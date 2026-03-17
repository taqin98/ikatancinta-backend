import { Buffer } from "node:buffer";
import { getDriveClient, hasGoogleCredentials } from "../../integrations/googleWorkspace/client.js";
import { env } from "../../config/env.js";

const memoryCache = new Map();
const inflightRequests = new Map();

function getCacheTtlMs() {
  return env.assetProxyCacheTtlSeconds * 1000;
}

function getCacheMaxEntries() {
  return env.assetProxyMaxEntries;
}

function getClientCacheControl() {
  const seconds = env.assetProxyClientMaxAgeSeconds;
  return `public, max-age=${seconds}, s-maxage=${seconds}, stale-while-revalidate=86400`;
}

function pruneCache() {
  const now = Date.now();

  for (const [key, entry] of memoryCache.entries()) {
    if (entry.expiresAt <= now) {
      memoryCache.delete(key);
    }
  }

  const maxEntries = getCacheMaxEntries();
  while (memoryCache.size > maxEntries) {
    const oldestKey = memoryCache.keys().next().value;
    if (!oldestKey) break;
    memoryCache.delete(oldestKey);
  }
}

function createDriveProxyError(error, fallbackMessage = "Failed to fetch asset from Google Drive") {
  const status = error?.response?.status;
  if (status === 404) {
    const notFoundError = new Error("Drive asset not found");
    notFoundError.status = 404;
    return notFoundError;
  }

  if (status === 403) {
    const forbiddenError = new Error("Drive asset is not accessible by current credentials");
    forbiddenError.status = 403;
    return forbiddenError;
  }

  const proxyError = new Error(error?.message || fallbackMessage);
  proxyError.status = 502;
  return proxyError;
}

function buildPublicDriveSourceUrls(fileId) {
  const encodedId = encodeURIComponent(fileId);
  return [
    `https://drive.google.com/uc?export=download&id=${encodedId}`,
    `https://drive.google.com/uc?export=view&id=${encodedId}`,
    `https://drive.google.com/thumbnail?id=${encodedId}&sz=w1600`,
    `https://lh3.googleusercontent.com/d/${encodedId}=w1600`,
  ];
}

function extractResponseErrorStatus(error) {
  return error?.response?.status || error?.status || 0;
}

async function fetchDriveAssetViaApi(fileId) {
  const drive = await getDriveClient();

  const [metadataResponse, mediaResponse] = await Promise.all([
    drive.files.get({
      fileId,
      supportsAllDrives: true,
      fields: "id,name,mimeType,modifiedTime,md5Checksum,size",
    }),
    drive.files.get(
      {
        fileId,
        alt: "media",
        supportsAllDrives: true,
      },
      {
        responseType: "arraybuffer",
      }
    ),
  ]);

  const metadata = metadataResponse.data || {};
  const data = Buffer.from(mediaResponse.data || []);

  return {
    data,
    mimeType: metadata.mimeType || mediaResponse.headers?.["content-type"] || "application/octet-stream",
    name: metadata.name || fileId,
    etag: metadata.md5Checksum || null,
    modifiedAt: metadata.modifiedTime || null,
    contentLength: data.length,
    expiresAt: Date.now() + getCacheTtlMs(),
    cacheControl: getClientCacheControl(),
  };
}

async function fetchDriveAssetViaPublicUrl(fileId) {
  let lastStatus = 0;

  for (const url of buildPublicDriveSourceUrls(fileId)) {
    const response = await globalThis.fetch(url, {
      redirect: "follow",
      headers: {
        Accept: "image/*,*/*;q=0.8",
        "User-Agent": "ikatancinta-asset-proxy/1.0",
      },
    });

    if (!response.ok) {
      lastStatus = response.status;
      continue;
    }

    const mimeType = response.headers.get("content-type") || "application/octet-stream";
    if (mimeType.includes("text/html")) {
      lastStatus = 502;
      continue;
    }

    const data = Buffer.from(await response.arrayBuffer());
    return {
      data,
      mimeType,
      name: `${fileId}.bin`,
      etag: response.headers.get("etag") || null,
      modifiedAt: response.headers.get("last-modified") || null,
      contentLength: data.length,
      expiresAt: Date.now() + getCacheTtlMs(),
      cacheControl: getClientCacheControl(),
    };
  }

  const error = new Error(
    lastStatus === 429
      ? "Google Drive public asset is rate limited"
      : "Failed to fetch public Google Drive asset"
  );
  error.status = lastStatus === 404 ? 404 : 502;
  throw error;
}

async function fetchDriveAssetFromSource(fileId) {
  if (hasGoogleCredentials()) {
    try {
      return await fetchDriveAssetViaApi(fileId);
    } catch (error) {
      const status = extractResponseErrorStatus(error);
      if (status && ![403, 404, 429, 500].includes(status)) {
        throw createDriveProxyError(error);
      }
    }
  }

  try {
    return await fetchDriveAssetViaPublicUrl(fileId);
  } catch (error) {
    throw createDriveProxyError(error, "Failed to fetch asset from Drive API and public fallback");
  }
}

async function loadDriveAsset(fileId) {
  pruneCache();

  const cachedEntry = memoryCache.get(fileId);
  if (cachedEntry && cachedEntry.expiresAt > Date.now()) {
    return { ...cachedEntry, cacheStatus: "HIT" };
  }

  if (!inflightRequests.has(fileId)) {
    inflightRequests.set(
      fileId,
      fetchDriveAssetFromSource(fileId)
        .then((entry) => {
          memoryCache.set(fileId, entry);
          pruneCache();
          return { ...entry, cacheStatus: "MISS" };
        })
        .finally(() => {
          inflightRequests.delete(fileId);
        })
    );
  }

  return inflightRequests.get(fileId);
}

export async function getDriveAsset(fileId) {
  if (!String(fileId || "").trim()) {
    const error = new Error("fileId is required");
    error.status = 422;
    throw error;
  }

  return loadDriveAsset(String(fileId).trim());
}

export function applyAssetResponseHeaders(res, asset) {
  if (asset.etag) {
    res.setHeader("ETag", `"${asset.etag}"`);
  }

  if (asset.modifiedAt) {
    res.setHeader("Last-Modified", new Date(asset.modifiedAt).toUTCString());
  }

  res.setHeader("Cache-Control", asset.cacheControl || getClientCacheControl());
  res.setHeader("Content-Type", asset.mimeType || "application/octet-stream");
  res.setHeader("Content-Length", String(asset.contentLength || asset.data?.length || 0));
  res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(asset.name || "asset")}"`);
  res.setHeader("X-Asset-Proxy", "google-drive");
  res.setHeader("X-Asset-Cache", asset.cacheStatus || "MISS");
}

export function isAssetFresh(req, asset) {
  const ifNoneMatch = String(req.get("if-none-match") || "").replace(/^W\//, "");
  if (asset.etag && ifNoneMatch && ifNoneMatch.includes(asset.etag)) {
    return true;
  }

  const ifModifiedSince = req.get("if-modified-since");
  if (asset.modifiedAt && ifModifiedSince) {
    return new Date(ifModifiedSince).getTime() >= new Date(asset.modifiedAt).getTime();
  }

  return false;
}

import { Buffer } from "node:buffer";
import { getDriveClient } from "../../integrations/googleWorkspace/client.js";
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

async function fetchDriveAssetFromSource(fileId) {
  const drive = await getDriveClient();

  try {
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
  } catch (error) {
    throw createDriveProxyError(error);
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

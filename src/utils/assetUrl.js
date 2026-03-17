import { env } from "../config/env.js";

const DRIVE_URL_PATTERNS = [
  /[?&]id=([^&#]+)/i,
  /\/d\/([^/?#]+)/i,
  /\/file\/d\/([^/?#]+)/i,
  /\/thumbnail\/([^/?#]+)/i,
];

function trimTrailingSlash(value) {
  return String(value || "").replace(/\/+$/g, "");
}

export function extractDriveFileId(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  for (const pattern of DRIVE_URL_PATTERNS) {
    const match = raw.match(pattern);
    if (match?.[1]) {
      return decodeURIComponent(match[1]);
    }
  }

  return "";
}

export function buildDriveAssetProxyUrl(fileId) {
  if (!fileId) return "";
  return `${trimTrailingSlash(env.publicBaseUrl)}/api/assets/drive/${encodeURIComponent(fileId)}`;
}

export function normalizeDriveAssetUrl(url, fileId) {
  const resolvedFileId = String(fileId || "").trim() || extractDriveFileId(url);
  return resolvedFileId ? buildDriveAssetProxyUrl(resolvedFileId) : String(url || "");
}

function isPlainObject(value) {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

export function normalizeDriveAssetUrlsDeep(value) {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeDriveAssetUrlsDeep(item));
  }

  if (!isPlainObject(value)) {
    return value;
  }

  const nextValue = {};
  Object.keys(value).forEach((key) => {
    const currentValue = normalizeDriveAssetUrlsDeep(value[key]);
    nextValue[key] = key === "url" && typeof currentValue === "string"
      ? normalizeDriveAssetUrl(currentValue, value.driveFileId || value.drive_file_id)
      : currentValue;
  });
  return nextValue;
}

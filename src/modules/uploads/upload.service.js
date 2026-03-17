import { env } from "../../config/env.js";
import { callAppsScript } from "../../integrations/appsScript/client.js";
import { appendSheetObject, listSheetObjects } from "../../integrations/googleWorkspace/sheetsStore.js";
import { uploadFileToDrive } from "../../integrations/googleWorkspace/driveStore.js";
import { createAssetId, normalizeOrderId } from "../../utils/createId.js";
import { addUpload, listUploads } from "./upload.repository.js";

const UPLOAD_HEADERS = [
  "asset_id",
  "order_id",
  "kind",
  "file_name",
  "mime_type",
  "size",
  "drive_file_id",
  "drive_folder_id",
  "url",
  "created_at",
];

function buildDriveThumbnailUrl(fileId) {
  if (!fileId) return "";
  return `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=w1600`;
}

function normalizeDriveAssetUrl(url, fileId) {
  if (fileId) {
    return buildDriveThumbnailUrl(fileId);
  }

  const raw = String(url || "");
  const match = raw.match(/[?&]id=([^&#]+)/i) || raw.match(/\/d\/([^/?#]+)/i);
  return match?.[1] ? buildDriveThumbnailUrl(decodeURIComponent(match[1])) : raw;
}

function mapUploadRowToAsset(row) {
  return {
    assetId: row.asset_id,
    orderId: row.order_id || null,
    kind: row.kind || "file",
    name: row.file_name || "asset",
    mimeType: row.mime_type || "application/octet-stream",
    size: row.size ? Number(row.size) : null,
    driveFileId: row.drive_file_id || null,
    driveFolderId: row.drive_folder_id || null,
    url: normalizeDriveAssetUrl(row.url, row.drive_file_id),
    createdAt: row.created_at || null,
    storage: env.mediaStorageProvider,
  };
}

export async function getUploads() {
  if (env.dataStoreProvider === "apps_script" || env.mediaStorageProvider === "apps_script") {
    const response = await callAppsScript("listUploads");
    return response.data || [];
  }

  if (env.dataStoreProvider === "google_sheets") {
    const rows = await listSheetObjects("uploads", UPLOAD_HEADERS);
    return rows.map((row) => mapUploadRowToAsset(row));
  }

  return listUploads();
}

export async function createUpload({ file, body }) {
  const assetId = createAssetId();
  const filename = file?.originalname || body?.name || "asset";
  const createdAt = new Date().toISOString();
  const orderId = normalizeOrderId(body?.orderId || body?.order_id);

  if (!orderId) {
    const error = new Error("orderId is required");
    error.status = 422;
    throw error;
  }

  if (env.mediaStorageProvider === "apps_script") {
    const response = await callAppsScript("createUpload", {
      upload: {
        assetId,
        orderId,
        kind: body?.kind || "file",
        name: filename,
        mimeType: file?.mimetype || body?.mimeType || "application/octet-stream",
        size: file?.size || (body?.size ? Number(body.size) : null),
        createdAt,
        fileBase64: file?.buffer ? file.buffer.toString("base64") : "",
      },
    });
    return response.data || null;
  }

  if (env.mediaStorageProvider === "google_drive") {
    const uploadedFile = await uploadFileToDrive({
      file,
      orderId,
      filename,
      mimeType: file?.mimetype || body?.mimeType || "application/octet-stream",
    });

    const asset = {
      assetId,
      orderId,
      kind: body?.kind || "file",
      name: filename,
      mimeType: uploadedFile.mimeType,
      size: uploadedFile.size || file?.size || null,
      url: uploadedFile.url,
      createdAt,
      storage: "google_drive",
      driveFileId: uploadedFile.fileId,
      driveFolderId: uploadedFile.folderId,
    };

    if (env.dataStoreProvider === "google_sheets") {
      await appendSheetObject("uploads", UPLOAD_HEADERS, {
        asset_id: asset.assetId,
        order_id: asset.orderId,
        kind: asset.kind,
        file_name: asset.name,
        mime_type: asset.mimeType,
        size: asset.size ?? "",
        drive_file_id: asset.driveFileId || "",
        drive_folder_id: asset.driveFolderId || "",
        url: asset.url,
        created_at: asset.createdAt,
      });
      return asset;
    }

    return addUpload(asset);
  }

  const asset = {
    assetId,
    orderId,
    kind: body?.kind || "file",
    name: filename,
    mimeType: file?.mimetype || body?.mimeType || "application/octet-stream",
    size: file?.size || (body?.size ? Number(body.size) : null),
    url: `${env.publicBaseUrl}/mock-assets/${encodeURIComponent(orderId)}/${assetId}/${encodeURIComponent(filename)}`,
    createdAt,
    storage: "memory",
  };

  if (env.dataStoreProvider === "google_sheets") {
    await appendSheetObject("uploads", UPLOAD_HEADERS, {
      asset_id: asset.assetId,
      order_id: asset.orderId,
      kind: asset.kind,
      file_name: asset.name,
      mime_type: asset.mimeType,
      size: asset.size ?? "",
      drive_file_id: "",
      drive_folder_id: "",
      url: asset.url,
      created_at: asset.createdAt,
    });
    return asset;
  }

  return addUpload(asset);
}

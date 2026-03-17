import { Readable } from "node:stream";
import { env } from "../../config/env.js";
import { assertGoogleDriveEnabled, getDriveClient } from "./client.js";

function buildDrivePublicUrl(fileId) {
  return `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=w1600`;
}

async function findOrCreateOrderFolder(drive, orderId) {
  const parentId = env.googleDriveRootFolderId;
  const escapedOrderId = String(orderId).replace(/'/g, "\\'");
  const listResponse = await drive.files.list({
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
    q: [
      `'${parentId}' in parents`,
      "mimeType = 'application/vnd.google-apps.folder'",
      `name = '${escapedOrderId}'`,
      "trashed = false",
    ].join(" and "),
    fields: "files(id,name)",
    pageSize: 1,
  });

  const existingFolder = listResponse.data.files?.[0];
  if (existingFolder?.id) {
    return { id: existingFolder.id, name: existingFolder.name || orderId };
  }

  const createResponse = await drive.files.create({
    supportsAllDrives: true,
    requestBody: {
      name: orderId,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentId],
    },
    fields: "id,name",
  });

  return {
    id: createResponse.data.id,
    name: createResponse.data.name || orderId,
  };
}

export async function uploadFileToDrive({ file, folderId, orderId, filename, mimeType }) {
  assertGoogleDriveEnabled();
  const drive = await getDriveClient();
  const targetFolder = folderId
    ? { id: folderId, name: orderId || folderId }
    : await findOrCreateOrderFolder(drive, orderId);

  const response = await drive.files.create({
    supportsAllDrives: true,
    requestBody: {
      name: filename,
      parents: [targetFolder.id],
    },
    media: {
      mimeType,
      body: Readable.from(file.buffer),
    },
    fields: "id,name,mimeType,size,parents,webViewLink",
  });

  const uploadedFile = response.data;

  if (env.googleDrivePublicRead && uploadedFile.id) {
    await drive.permissions.create({
      fileId: uploadedFile.id,
      supportsAllDrives: true,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    });
  }

  return {
    fileId: uploadedFile.id,
    name: uploadedFile.name,
    mimeType: uploadedFile.mimeType,
    size: uploadedFile.size ? Number(uploadedFile.size) : file.size,
    folderId: targetFolder.id,
    folderName: targetFolder.name,
    url: env.googleDrivePublicRead && uploadedFile.id ? buildDrivePublicUrl(uploadedFile.id) : uploadedFile.webViewLink || "",
  };
}

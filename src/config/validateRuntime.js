import { env } from "./env.js";

function hasGoogleCredentials() {
  return Boolean(env.googleApplicationCredentials) || Boolean(env.googleClientEmail && env.googlePrivateKey);
}

export function validateRuntimeConfig() {
  if (!env.adminAuthEmail) {
    throw new Error("ADMIN_AUTH_EMAIL is required.");
  }
  if (!env.adminAuthPassword) {
    throw new Error("ADMIN_AUTH_PASSWORD is required.");
  }
  if (!env.adminJwtSecret) {
    throw new Error("ADMIN_JWT_SECRET is required.");
  }

  if (env.dataStoreProvider === "apps_script" || env.mediaStorageProvider === "apps_script") {
    if (!env.appsScriptBaseUrl) {
      throw new Error("apps_script provider requires APPS_SCRIPT_BASE_URL.");
    }
    if (!env.appsScriptSharedSecret) {
      throw new Error("apps_script provider requires APPS_SCRIPT_SHARED_SECRET.");
    }
  }

  if (env.dataStoreProvider === "google_sheets") {
    if (!hasGoogleCredentials()) {
      throw new Error("google_sheets provider requires GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_CLIENT_EMAIL + GOOGLE_PRIVATE_KEY.");
    }
    if (!env.googleSheetsSpreadsheetId) {
      throw new Error("google_sheets provider requires GOOGLE_SHEETS_SPREADSHEET_ID.");
    }
  }

  if (env.mediaStorageProvider === "google_drive") {
    if (!hasGoogleCredentials()) {
      throw new Error("google_drive provider requires GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_CLIENT_EMAIL + GOOGLE_PRIVATE_KEY.");
    }
    if (!env.googleDriveRootFolderId) {
      throw new Error("google_drive provider requires GOOGLE_DRIVE_ROOT_FOLDER_ID.");
    }
  }
}

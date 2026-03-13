import dotenv from "dotenv";

dotenv.config();

function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toBoolean(value, fallback = false) {
  if (value == null || value === "") return fallback;
  return ["1", "true", "yes", "on"].includes(String(value).trim().toLowerCase());
}

function normalizePrivateKey(value) {
  if (!value) return "";
  return String(value).replace(/\\n/g, "\n");
}

export const env = {
  port: toNumber(process.env.PORT, 3001),
  appOrigin: process.env.APP_ORIGIN || "http://127.0.0.1:5173",
  publicBaseUrl: process.env.PUBLIC_BASE_URL || "http://127.0.0.1:3001",
  bodyLimit: process.env.BODY_LIMIT || "10mb",
  uploadFileLimitBytes: toNumber(process.env.UPLOAD_FILE_LIMIT_MB, 10) * 1024 * 1024,
  dataStoreProvider: process.env.DATA_STORE_PROVIDER || "memory",
  mediaStorageProvider: process.env.MEDIA_STORAGE_PROVIDER || "memory",
  appsScriptBaseUrl: process.env.APPS_SCRIPT_BASE_URL || "",
  appsScriptSharedSecret: process.env.APPS_SCRIPT_SHARED_SECRET || "",
  appsScriptTimeoutMs: toNumber(process.env.APPS_SCRIPT_TIMEOUT_MS, 30000),
  adminAuthEmail: process.env.ADMIN_AUTH_EMAIL || "",
  adminAuthPassword: process.env.ADMIN_AUTH_PASSWORD || "",
  adminJwtSecret: process.env.ADMIN_JWT_SECRET || "",
  adminJwtExpiresInSeconds: toNumber(process.env.ADMIN_JWT_EXPIRES_IN_SECONDS, 60 * 60 * 8),
  adminDisplayName: process.env.ADMIN_DISPLAY_NAME || "Admin",
  googleProjectId: process.env.GOOGLE_PROJECT_ID || "",
  googleClientEmail: process.env.GOOGLE_CLIENT_EMAIL || "",
  googlePrivateKey: normalizePrivateKey(process.env.GOOGLE_PRIVATE_KEY),
  googleApplicationCredentials: process.env.GOOGLE_APPLICATION_CREDENTIALS || "",
  googleSheetsSpreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID || "",
  googleSheetsOrdersSheet: process.env.GOOGLE_SHEETS_ORDERS_SHEET || "orders",
  googleSheetsUploadsSheet: process.env.GOOGLE_SHEETS_UPLOADS_SHEET || "uploads",
  googleSheetsWishesSheet: process.env.GOOGLE_SHEETS_WISHES_SHEET || "wishes",
  googleSheetsOrderEmailsSheet: process.env.GOOGLE_SHEETS_ORDER_EMAILS_SHEET || "order_emails",
  googleDriveRootFolderId: process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || "",
  googleDrivePublicRead: toBoolean(process.env.GOOGLE_DRIVE_PUBLIC_READ, false),
};

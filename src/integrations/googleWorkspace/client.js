import { google } from "googleapis";
import { env } from "../../config/env.js";

const SHEETS_SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];
const DRIVE_SCOPES = ["https://www.googleapis.com/auth/drive"];

function assertGoogleConfig() {
  if (!hasGoogleCredentials()) {
    const error = new Error(
      "Google Workspace credentials are missing. Set GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_CLIENT_EMAIL + GOOGLE_PRIVATE_KEY."
    );
    error.status = 500;
    throw error;
  }
}

export function hasGoogleCredentials() {
  const hasKeyFile = Boolean(env.googleApplicationCredentials);
  const hasInlineCredentials = Boolean(env.googleClientEmail && env.googlePrivateKey);
  return hasKeyFile || hasInlineCredentials;
}

function createAuth(scopes) {
  assertGoogleConfig();

  if (env.googleApplicationCredentials) {
    return new google.auth.GoogleAuth({
      keyFile: env.googleApplicationCredentials,
      scopes,
    });
  }

  return new google.auth.GoogleAuth({
    credentials: {
      type: "service_account",
      project_id: env.googleProjectId || undefined,
      client_email: env.googleClientEmail,
      private_key: env.googlePrivateKey,
    },
    scopes,
  });
}

let sheetsClientPromise;
let driveClientPromise;

export async function getSheetsClient() {
  if (!sheetsClientPromise) {
    sheetsClientPromise = (async () => {
      const auth = await createAuth(SHEETS_SCOPES).getClient();
      return google.sheets({ version: "v4", auth });
    })();
  }

  return sheetsClientPromise;
}

export async function getDriveClient() {
  if (!driveClientPromise) {
    driveClientPromise = (async () => {
      const auth = await createAuth(DRIVE_SCOPES).getClient();
      return google.drive({ version: "v3", auth });
    })();
  }

  return driveClientPromise;
}

export function assertGoogleSheetsEnabled() {
  if (!env.googleSheetsSpreadsheetId) {
    const error = new Error("GOOGLE_SHEETS_SPREADSHEET_ID is required for google_sheets provider.");
    error.status = 500;
    throw error;
  }
}

export function assertGoogleDriveEnabled() {
  if (!env.googleDriveRootFolderId) {
    const error = new Error("GOOGLE_DRIVE_ROOT_FOLDER_ID is required for google_drive provider.");
    error.status = 500;
    throw error;
  }
}

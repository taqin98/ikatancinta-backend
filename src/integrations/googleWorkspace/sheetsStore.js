import { env } from "../../config/env.js";
import { assertGoogleSheetsEnabled, getSheetsClient } from "./client.js";

function getSheetName(sheetKey) {
  const sheetMap = {
    orders: env.googleSheetsOrdersSheet,
    uploads: env.googleSheetsUploadsSheet,
    wishes: env.googleSheetsWishesSheet,
    orderEmails: env.googleSheetsOrderEmailsSheet,
  };
  return sheetMap[sheetKey];
}

async function ensureHeader(sheetName, headers) {
  const sheets = await getSheetsClient();
  const range = `${sheetName}!A1:ZZ1`;
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: env.googleSheetsSpreadsheetId,
    range,
  });

  const existingHeader = response.data.values?.[0] || [];
  const hasSameHeader =
    existingHeader.length === headers.length &&
    headers.every((column, index) => existingHeader[index] === column);

  if (hasSameHeader) {
    return existingHeader;
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId: env.googleSheetsSpreadsheetId,
    range: `${sheetName}!A1`,
    valueInputOption: "RAW",
    requestBody: {
      values: [headers],
    },
  });

  return headers;
}

function mapRowToObject(header, row = []) {
  return header.reduce((accumulator, key, index) => {
    accumulator[key] = row[index] ?? "";
    return accumulator;
  }, {});
}

function buildColumnRange(sheetName, rowNumber, width) {
  return `${sheetName}!A${rowNumber}:${String.fromCharCode(64 + Math.min(width, 26))}${rowNumber}`;
}

export async function appendSheetObject(sheetKey, headers, rowObject) {
  assertGoogleSheetsEnabled();
  const sheets = await getSheetsClient();
  const sheetName = getSheetName(sheetKey);
  const header = await ensureHeader(sheetName, headers);
  const row = header.map((column) => rowObject[column] ?? "");

  await sheets.spreadsheets.values.append({
    spreadsheetId: env.googleSheetsSpreadsheetId,
    range: `${sheetName}!A1`,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: [row],
    },
  });

  return rowObject;
}

export async function listSheetObjects(sheetKey, headers) {
  assertGoogleSheetsEnabled();
  const sheets = await getSheetsClient();
  const sheetName = getSheetName(sheetKey);
  const header = await ensureHeader(sheetName, headers);
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: env.googleSheetsSpreadsheetId,
    range: `${sheetName}!A2:ZZ`,
  });

  const rows = response.data.values || [];
  return rows.map((row) => mapRowToObject(header, row));
}

export async function updateSheetObject(sheetKey, headers, matchColumn, matchValue, patchObject) {
  assertGoogleSheetsEnabled();
  const sheets = await getSheetsClient();
  const sheetName = getSheetName(sheetKey);
  const header = await ensureHeader(sheetName, headers);
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: env.googleSheetsSpreadsheetId,
    range: `${sheetName}!A2:ZZ`,
  });

  const rows = response.data.values || [];
  const matchIndex = header.indexOf(matchColumn);
  if (matchIndex < 0) {
    throw new Error(`Sheet column not found: ${matchColumn}`);
  }

  const rowIndex = rows.findIndex((row) => (row[matchIndex] ?? "") === matchValue);
  if (rowIndex < 0) {
    return null;
  }

  const currentObject = mapRowToObject(header, rows[rowIndex]);
  const nextObject = {
    ...currentObject,
    ...patchObject,
  };
  const nextRow = header.map((column) => nextObject[column] ?? "");
  const rowNumber = rowIndex + 2;

  await sheets.spreadsheets.values.update({
    spreadsheetId: env.googleSheetsSpreadsheetId,
    range: buildColumnRange(sheetName, rowNumber, header.length),
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [nextRow],
    },
  });

  return nextObject;
}

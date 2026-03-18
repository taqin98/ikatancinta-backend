import { env } from "../../config/env.js";
import { callAppsScript } from "../../integrations/appsScript/client.js";
import {
  listPaymentMethodRecords,
  findPaymentMethodById,
  addPaymentMethod,
  updatePaymentMethodRecord,
  removePaymentMethodRecord,
} from "./paymentMethod.repository.js";

const PM_HEADERS = [
  "method_id", "type", "label", "account_number", "account_name",
  "description", "logo_url", "url_content", "enabled", "sort_order", "created_at",
];

function generateMethodId() {
  return `pm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function toBoolean(value, fallback = true) {
  if (value === null || value === undefined || value === "") return fallback;
  return ["1", "true", "yes", "on"].includes(String(value).trim().toLowerCase());
}

function mapRowToMethod(row) {
  return {
    methodId: row.method_id || "",
    type: row.type || "bank_transfer",
    label: row.label || "",
    accountNumber: row.account_number || "",
    accountName: row.account_name || "",
    description: row.description || "",
    logoUrl: row.logo_url || "",
    urlContent: row.url_content || "",
    enabled: toBoolean(row.enabled, true),
    sortOrder: Number(row.sort_order) || 0,
  };
}

function sortByOrder(list) {
  return [...list].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
}

// ─── LIST ────────────────────────────────────────────────────────────────────

export async function getPaymentMethods({ includeDisabled = false } = {}) {
  if (env.dataStoreProvider === "apps_script") {
    const response = await callAppsScript("listPaymentMethods", {});
    const items = response.data || [];
    return includeDisabled ? sortByOrder(items) : sortByOrder(items.filter((m) => m.enabled !== false));
  }

  if (env.dataStoreProvider === "google_sheets") {
    const { listSheetObjects } = await import("../../integrations/googleWorkspace/sheetsStore.js");
    const rows = await listSheetObjects("paymentMethods", PM_HEADERS);
    const mapped = rows.map(mapRowToMethod);
    return includeDisabled ? sortByOrder(mapped) : sortByOrder(mapped.filter((m) => m.enabled));
  }

  // memory store
  const all = listPaymentMethodRecords();
  return includeDisabled ? sortByOrder(all) : sortByOrder(all.filter((m) => m.enabled !== false));
}

// ─── GET BY ID ───────────────────────────────────────────────────────────────

export async function getPaymentMethodById(methodId) {
  if (env.dataStoreProvider === "apps_script") {
    // Apps Script has no getById, filter from list
    const all = await getPaymentMethods({ includeDisabled: true });
    return all.find((m) => m.methodId === methodId) || null;
  }

  if (env.dataStoreProvider === "google_sheets") {
    const { listSheetObjects } = await import("../../integrations/googleWorkspace/sheetsStore.js");
    const rows = await listSheetObjects("paymentMethods", PM_HEADERS);
    const row = rows.find((r) => r.method_id === methodId);
    return row ? mapRowToMethod(row) : null;
  }

  return findPaymentMethodById(methodId);
}

// ─── CREATE ──────────────────────────────────────────────────────────────────

export async function createPaymentMethod(payload) {
  if (!payload?.label) {
    const error = new Error("label is required");
    error.status = 400;
    throw error;
  }

  const method = {
    methodId: generateMethodId(),
    type: payload.type || "bank_transfer",
    label: payload.label,
    accountNumber: payload.accountNumber || "",
    accountName: payload.accountName || "",
    description: payload.description || "",
    logoUrl: payload.logoUrl || "",
    urlContent: payload.urlContent || "",
    enabled: payload.enabled !== false,
    sortOrder: Number(payload.sortOrder) || 0,
  };

  if (env.dataStoreProvider === "apps_script") {
    const response = await callAppsScript("createPaymentMethod", { method });
    return response.data || method;
  }

  if (env.dataStoreProvider === "google_sheets") {
    const { appendSheetObject } = await import("../../integrations/googleWorkspace/sheetsStore.js");
    await appendSheetObject("paymentMethods", PM_HEADERS, {
      method_id: method.methodId,
      type: method.type,
      label: method.label,
      account_number: method.accountNumber,
      account_name: method.accountName,
      description: method.description,
      logo_url: method.logoUrl,
      url_content: method.urlContent,
      enabled: method.enabled ? "true" : "false",
      sort_order: method.sortOrder,
      created_at: new Date().toISOString(),
    });
    return method;
  }

  addPaymentMethod(method);
  return method;
}

// ─── UPDATE ──────────────────────────────────────────────────────────────────

export async function updatePaymentMethod(methodId, payload) {
  const existing = await getPaymentMethodById(methodId);
  if (!existing) return null;

  const updated = {
    ...existing,
    type: payload.type ?? existing.type,
    label: payload.label ?? existing.label,
    accountNumber: payload.accountNumber ?? existing.accountNumber,
    accountName: payload.accountName ?? existing.accountName,
    description: payload.description ?? existing.description,
    logoUrl: payload.logoUrl ?? existing.logoUrl,
    urlContent: payload.urlContent ?? existing.urlContent,
    enabled: payload.enabled !== undefined ? payload.enabled : existing.enabled,
    sortOrder: payload.sortOrder !== undefined ? Number(payload.sortOrder) : existing.sortOrder,
  };

  if (env.dataStoreProvider === "google_sheets") {
    const { listSheetObjects, updateSheetRow } = await import("../../integrations/googleWorkspace/sheetsStore.js");
    const rows = await listSheetObjects("paymentMethods", PM_HEADERS);
    const rowIndex = rows.findIndex((r) => r.method_id === methodId);
    if (rowIndex < 0) return null;
    await updateSheetRow("paymentMethods", PM_HEADERS, rowIndex, {
      method_id: updated.methodId,
      type: updated.type,
      label: updated.label,
      account_number: updated.accountNumber,
      account_name: updated.accountName,
      description: updated.description,
      logo_url: updated.logoUrl,
      url_content: updated.urlContent,
      enabled: updated.enabled ? "true" : "false",
      sort_order: updated.sortOrder,
      created_at: rows[rowIndex].created_at || new Date().toISOString(),
    });
    return updated;
  }

  // memory store
  updatePaymentMethodRecord(methodId, updated);
  return updated;
}

// ─── DELETE ──────────────────────────────────────────────────────────────────

export async function deletePaymentMethod(methodId) {
  const existing = await getPaymentMethodById(methodId);
  if (!existing) return false;

  if (env.dataStoreProvider === "google_sheets") {
    const { listSheetObjects, deleteSheetRow } = await import("../../integrations/googleWorkspace/sheetsStore.js");
    const rows = await listSheetObjects("paymentMethods", PM_HEADERS);
    const rowIndex = rows.findIndex((r) => r.method_id === methodId);
    if (rowIndex < 0) return false;
    await deleteSheetRow("paymentMethods", PM_HEADERS, rowIndex);
    return true;
  }

  // memory store
  return removePaymentMethodRecord(methodId);
}

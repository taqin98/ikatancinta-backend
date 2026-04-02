import { env } from "../../config/env.js";
import { callAppsScript } from "../../integrations/appsScript/client.js";
import { appendSheetObject, listSheetObjects } from "../../integrations/googleWorkspace/sheetsStore.js";
import { getOrderByInvitationSlug } from "../orders/order.service.js";
import { getThemeBySlug } from "../themes/theme.service.js";
import { listAllWishes, listWishesByOrderId, listWishesBySlug, prependWish } from "./wish.repository.js";

const WISH_HEADERS = ["wish_id", "invitation_slug", "order_id", "name", "attendance", "message", "source", "created_at"];

function createWishId() {
  return `wish_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizePersonKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function isQrCheckInRecord(record) {
  return normalizeWishSource(record?.source, record) === "qr_checkin";
}

function createConflictError(message) {
  const error = new Error(message);
  error.status = 409;
  return error;
}

function normalizeWishSource(value, record = null) {
  const normalized = String(value || record?.source || record?.entrySource || record?.entry_source || "")
    .trim()
    .toLowerCase();

  if (normalized === "qr_checkin" || normalized === "qr-checkin" || normalized === "qr") {
    return "qr_checkin";
  }

  if (!normalized && String(record?.message || record?.comment || "").trim() === "Check-in via QR tamu.") {
    return "qr_checkin";
  }

  return "guest_wish";
}

function normalizeWishRecord(record, options = {}) {
  return {
    wishId: record?.wishId || record?.wish_id || null,
    invitationSlug: record?.invitationSlug || record?.invitation_slug || options.invitationSlug || null,
    orderId: record?.orderId || record?.order_id || null,
    name: record?.name || record?.author || "Anonim",
    attendance: record?.attendance || "hadir",
    message: record?.message || record?.comment || "",
    source: normalizeWishSource(record?.source, record),
    createdAt: record?.createdAt || record?.created_at || new Date().toISOString(),
  };
}

function mapWishRecordToEntry(record, options = {}) {
  const normalized = normalizeWishRecord(record, options);
  return {
    orderId: normalized.orderId,
    author: normalized.name,
    comment: normalized.message,
    attendance: normalized.attendance,
    source: normalized.source,
    createdAt: normalized.createdAt,
  };
}

export async function listWishRecordsBySlug(slug) {
  if (!slug) return [];

  if (env.dataStoreProvider === "apps_script") {
    const response = await callAppsScript("listWishes", { invitationSlug: slug });
    return (response.data || []).map((record) => normalizeWishRecord(record, { invitationSlug: slug }));
  }

  if (env.dataStoreProvider === "google_sheets") {
    const rows = await listSheetObjects("wishes", WISH_HEADERS);
    return rows
      .filter((row) => row.invitation_slug === slug)
      .map((row) => normalizeWishRecord(row, { invitationSlug: slug }));
  }

  return listWishesBySlug(slug).map((record) => normalizeWishRecord(record, { invitationSlug: slug }));
}

export async function listWishes(slug) {
  const rows = await listWishRecordsBySlug(slug);
  return rows.map((record) => mapWishRecordToEntry(record, { invitationSlug: slug }));
}

export async function listWishRecordsByOrderId(orderId) {
  if (!orderId) return [];

  if (env.dataStoreProvider === "apps_script") {
    const response = await callAppsScript("listWishes", { orderId });
    return (response.data || []).map((record) => normalizeWishRecord(record));
  }

  if (env.dataStoreProvider === "google_sheets") {
    const rows = await listSheetObjects("wishes", WISH_HEADERS);
    return rows
      .filter((row) => row.order_id === orderId)
      .map((row) => normalizeWishRecord(row));
  }

  return listWishesByOrderId(orderId).map((record) => normalizeWishRecord(record));
}

export async function listAllWishRecords() {
  if (env.dataStoreProvider === "apps_script") {
    const response = await callAppsScript("listWishes", {});
    return (response.data || []).map((record) => normalizeWishRecord(record));
  }

  if (env.dataStoreProvider === "google_sheets") {
    const rows = await listSheetObjects("wishes", WISH_HEADERS);
    return rows.map((row) => normalizeWishRecord(row));
  }

  return listAllWishes().map((record) => normalizeWishRecord(record));
}

export async function createWish(slug, payload) {
  const relatedOrder = await getOrderByInvitationSlug(slug);
  const theme = getThemeBySlug(slug);

  if (!relatedOrder && !theme) {
    const error = new Error("Invitation theme not found");
    error.status = 404;
    throw error;
  }

  const entry = {
    wishId: createWishId(),
    invitationSlug: slug,
    orderId: relatedOrder?.orderId || null,
    author: payload?.name || "Anonim",
    comment: payload?.message || "",
    attendance: payload?.attendance || "hadir",
    source: normalizeWishSource(payload?.source, payload),
    createdAt: new Date().toISOString(),
  };

  if (entry.source === "qr_checkin") {
    const nameKey = normalizePersonKey(entry.author);
    if (nameKey) {
      const existingRecords = await listWishRecordsBySlug(slug);
      const existingQrCheckIn = existingRecords.find(
        (record) => isQrCheckInRecord(record) && normalizePersonKey(record.name) === nameKey
      );

      if (existingQrCheckIn) {
        throw createConflictError(`Tamu ${entry.author} sudah pernah scan QR.`);
      }
    }
  }

  if (env.dataStoreProvider === "apps_script") {
    const response = await callAppsScript("createWish", {
      wish: {
        invitationSlug: slug,
        orderId: entry.orderId,
        name: entry.author,
        attendance: entry.attendance,
        message: entry.comment,
        source: entry.source,
        createdAt: entry.createdAt,
      },
    });
    return response.data || entry;
  }

  if (env.dataStoreProvider === "google_sheets") {
    await appendSheetObject("wishes", WISH_HEADERS, {
      wish_id: entry.wishId,
      invitation_slug: slug,
      order_id: entry.orderId || "",
      name: entry.author,
      attendance: entry.attendance,
      message: entry.comment,
      source: entry.source,
      created_at: entry.createdAt,
    });
    return entry;
  }

  prependWish(slug, entry);
  return entry;
}

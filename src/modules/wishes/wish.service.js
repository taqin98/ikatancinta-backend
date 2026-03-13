import { env } from "../../config/env.js";
import { callAppsScript } from "../../integrations/appsScript/client.js";
import { appendSheetObject, listSheetObjects } from "../../integrations/googleWorkspace/sheetsStore.js";
import { getOrderByInvitationSlug } from "../orders/order.service.js";
import { getThemeBySlug } from "../themes/theme.service.js";
import { listAllWishes, listWishesByOrderId, listWishesBySlug, prependWish } from "./wish.repository.js";

const WISH_HEADERS = ["wish_id", "invitation_slug", "order_id", "name", "attendance", "message", "created_at"];

function mapWishRecordToEntry(record) {
  return {
    orderId: record.order_id || null,
    author: record.name || "Anonim",
    comment: record.message || "",
    attendance: record.attendance || "hadir",
    createdAt: record.created_at || new Date().toISOString(),
  };
}

export async function listWishes(slug) {
  if (env.dataStoreProvider === "apps_script") {
    const response = await callAppsScript("listWishes", { invitationSlug: slug });
    return response.data || [];
  }

  if (env.dataStoreProvider === "google_sheets") {
    const rows = await listSheetObjects("wishes", WISH_HEADERS);
    return rows
      .filter((row) => row.invitation_slug === slug)
      .map((row) => mapWishRecordToEntry(row));
  }

  return listWishesBySlug(slug);
}

export async function listWishRecordsByOrderId(orderId) {
  if (!orderId) return [];

  if (env.dataStoreProvider === "apps_script") {
    const response = await callAppsScript("listWishes", { orderId });
    return response.data || [];
  }

  if (env.dataStoreProvider === "google_sheets") {
    const rows = await listSheetObjects("wishes", WISH_HEADERS);
    return rows
      .filter((row) => row.order_id === orderId)
      .map((row) => mapWishRecordToEntry(row));
  }

  return listWishesByOrderId(orderId);
}

export async function listAllWishRecords() {
  if (env.dataStoreProvider === "apps_script") {
    const response = await callAppsScript("listWishes", {});
    return response.data || [];
  }

  if (env.dataStoreProvider === "google_sheets") {
    const rows = await listSheetObjects("wishes", WISH_HEADERS);
    return rows.map((row) => mapWishRecordToEntry(row));
  }

  return listAllWishes();
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
    orderId: relatedOrder?.orderId || null,
    author: payload?.name || "Anonim",
    comment: payload?.message || "",
    attendance: payload?.attendance || "hadir",
    createdAt: new Date().toISOString(),
  };

  if (env.dataStoreProvider === "apps_script") {
    const response = await callAppsScript("createWish", {
      wish: {
        invitationSlug: slug,
        orderId: entry.orderId,
        name: entry.author,
        attendance: entry.attendance,
        message: entry.comment,
        createdAt: entry.createdAt,
      },
    });
    return response.data || entry;
  }

  if (env.dataStoreProvider === "google_sheets") {
    await appendSheetObject("wishes", WISH_HEADERS, {
      wish_id: `wish_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      invitation_slug: slug,
      order_id: entry.orderId || "",
      name: entry.author,
      attendance: entry.attendance,
      message: entry.comment,
      created_at: entry.createdAt,
    });
    return entry;
  }

  prependWish(slug, entry);
  return entry;
}

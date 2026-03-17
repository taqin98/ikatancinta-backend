import { createEmailId, createOrderId, normalizeOrderId } from "../../utils/createId.js";
import { env } from "../../config/env.js";
import { callAppsScript } from "../../integrations/appsScript/client.js";
import { appendSheetObject, listSheetObjects, updateSheetObject } from "../../integrations/googleWorkspace/sheetsStore.js";
import { normalizeDriveAssetUrl, normalizeDriveAssetUrlsDeep } from "../../utils/assetUrl.js";
import { normalizePackageTier } from "../../utils/normalizePackageTier.js";
import { getPackageConfig } from "../packages/package.service.js";
import { getThemeBySlug } from "../themes/theme.service.js";
import { addOrder, addOrderEmail, findOrderById, findOrderByInvitationSlug, listOrders, updateOrder } from "./order.repository.js";

const ORDER_HEADERS = [
  "order_id",
  "invitation_slug",
  "created_at",
  "updated_at",
  "published_at",
  "published_by",
  "completed_at",
  "status",
  "last_updated_by",
  "last_update_type",
  "last_update_note",
  "customer_name",
  "customer_phone",
  "customer_email",
  "package_tier",
  "theme_slug",
  "theme_name",
  "total_price",
  "cover_asset_id",
  "gallery_asset_ids",
  "music_asset_id",
  "payload_json",
];

const ORDER_EMAIL_HEADERS = ["email_id", "order_id", "customer_email", "status", "created_at"];
export const ORDER_STATUS_VALUES = ["pending", "processing", "published", "done", "cancelled"];

function normalizeOrderStatus(status, fallback = "processing") {
  const normalized = String(status || "").trim().toLowerCase();
  return ORDER_STATUS_VALUES.includes(normalized) ? normalized : fallback;
}

function slugifyPart(value, fallback = "undangan") {
  const normalized = String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || fallback;
}

function createInvitationSlug(payload, orderId) {
  const groomPart = slugifyPart(payload?.groom?.nickname || payload?.groom?.fullname || "mempelai-pria", "mempelai-pria");
  const bridePart = slugifyPart(payload?.bride?.nickname || payload?.bride?.fullname || "mempelai-wanita", "mempelai-wanita");
  const orderPart = String(orderId || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${groomPart}-${bridePart}-${orderPart || "order"}`;
}

function createConflictError(message) {
  const error = new Error(message);
  error.status = 409;
  return error;
}

function createValidationError(message, details = []) {
  const error = new Error(message);
  error.status = 422;
  error.details = details;
  return error;
}

function isPlainObject(value) {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

function deepMergeOrderPayload(baseValue, patchValue) {
  if (patchValue === undefined) return baseValue;
  if (Array.isArray(patchValue)) return patchValue.slice();
  if (!isPlainObject(baseValue) || !isPlainObject(patchValue)) return patchValue;

  const nextValue = { ...baseValue };
  Object.keys(patchValue).forEach((key) => {
    nextValue[key] = deepMergeOrderPayload(baseValue?.[key], patchValue[key]);
  });
  return nextValue;
}

function normalizeAuditMeta(meta = {}, fallbackType = "admin_update") {
  return {
    updatedBy: String(meta.updatedBy || meta.actor || "admin").trim() || "admin",
    note: String(meta.note || meta.reason || "").trim(),
    updateType: String(meta.updateType || fallbackType).trim() || fallbackType,
  };
}

function sanitizeAssetReference(asset, fallbackKind = "file") {
  if (!asset || typeof asset !== "object") return null;
  const assetId = typeof asset.assetId === "string" ? asset.assetId : "";
  const url = typeof asset.url === "string" ? asset.url : "";
  if (!assetId && !url) return null;

  return {
    assetId: assetId || null,
    kind: typeof asset.kind === "string" ? asset.kind : fallbackKind,
    name: typeof asset.name === "string" ? asset.name : "asset",
    mimeType: typeof asset.mimeType === "string" ? asset.mimeType : "application/octet-stream",
    size: Number.isFinite(asset.size) ? asset.size : asset.size ? Number(asset.size) : null,
    url: normalizeDriveAssetUrl(url) || null,
  };
}

function normalizeMusicPayload(music, packageConfig) {
  if (!music || typeof music !== "object") {
    return null;
  }

  if (music.mode === "upload") {
    if (!packageConfig.capabilities.customMusic) {
      return {
        mode: "list",
        trackId: "andmesh-cinta-luar-biasa",
        trackLabel: "Andmesh - Cinta Luar Biasa",
      };
    }

    return {
      mode: "upload",
      file: sanitizeAssetReference(music.file, "music"),
    };
  }

  return {
    mode: "list",
    trackId: music.trackId || "andmesh-cinta-luar-biasa",
    trackLabel: music.trackLabel || "Andmesh - Cinta Luar Biasa",
    previewUrl: music.previewUrl || null,
  };
}

function sanitizeOrderPayload(payload) {
  const requestedOrderId = normalizeOrderId(payload?.orderId || payload?.order_id);
  const requestedStatus = normalizeOrderStatus(payload?.status, "processing");
  const selectedTheme = payload?.selectedTheme || {};
  const selectedPackage = payload?.selectedPackage || {};
  const packageTier = normalizePackageTier(selectedPackage.tier || selectedTheme.packageTier);
  const packageConfig = getPackageConfig(packageTier);
  const theme = getThemeBySlug(selectedTheme.slug);

  if (!theme) {
    const error = new Error("Theme not found");
    error.status = 404;
    throw error;
  }

  if (normalizePackageTier(theme.packageTier) !== packageConfig.tier) {
    const error = new Error("Selected theme does not match selected package");
    error.status = 422;
    throw error;
  }

  const galleryImages = Array.isArray(payload?.galleryImages)
    ? payload.galleryImages.map((image) => sanitizeAssetReference(image, "gallery")).filter(Boolean).slice(0, packageConfig.limits.galleryMax)
    : [];

  const stories = packageConfig.capabilities.loveStory
    ? Array.isArray(payload?.stories) ? payload.stories : []
    : [];

  const invitationSlug = slugifyPart(payload?.invitationSlug || payload?.invitation_slug || "");

  return {
    ...payload,
    orderId: requestedOrderId || undefined,
    invitationSlug,
    status: requestedStatus,
    coverImage: sanitizeAssetReference(payload?.coverImage, "cover"),
    galleryImages,
    stories,
    music: normalizeMusicPayload(payload?.music, packageConfig),
    selectedTheme: {
      ...selectedTheme,
      packageTier: packageConfig.tier,
      name: theme.name,
      presetId: theme.presetId,
    },
    selectedPackage: packageConfig,
  };
}

export function serializeOrder(order) {
  return {
    id: order.id,
    orderId: order.id,
    invitationSlug: order.payload?.invitationSlug || null,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt || order.createdAt,
    publishedAt: order.publishedAt || null,
    publishedBy: order.publishedBy || null,
    completedAt: order.completedAt || null,
    status: normalizeOrderStatus(order.status, "processing"),
    customerName: order.payload?.customer?.name || null,
    packageTier: order.payload?.selectedPackage?.tier || null,
    themeSlug: order.payload?.selectedTheme?.slug || null,
    themeName: order.payload?.selectedTheme?.name || null,
    totalPrice: order.payload?.selectedPackage?.price || null,
    audit: {
      lastUpdatedBy: order.lastUpdatedBy || null,
      lastUpdateType: order.lastUpdateType || null,
      lastUpdateNote: order.lastUpdateNote || null,
    },
    payload: normalizeDriveAssetUrlsDeep(order.payload),
  };
}

function parseJsonSafely(value, fallback = null) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function mapOrderRowToOrder(row) {
  return {
    id: row.order_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at || row.created_at,
    publishedAt: row.published_at || null,
    publishedBy: row.published_by || null,
    completedAt: row.completed_at || null,
    status: row.status || "processing",
    lastUpdatedBy: row.last_updated_by || null,
    lastUpdateType: row.last_update_type || null,
    lastUpdateNote: row.last_update_note || null,
    payload: parseJsonSafely(row.payload_json, {
      customer: {
        name: row.customer_name || "",
        phone: row.customer_phone || "",
        email: row.customer_email || "",
      },
      selectedPackage: {
        tier: row.package_tier || "BASIC",
        price: row.total_price ? Number(row.total_price) : null,
      },
      selectedTheme: {
        slug: row.theme_slug || "",
        name: row.theme_name || "",
      },
      invitationSlug: row.invitation_slug || "",
      coverImage: row.cover_asset_id ? { assetId: row.cover_asset_id } : null,
      galleryImages: row.gallery_asset_ids
        ? String(row.gallery_asset_ids)
            .split(",")
            .map((assetId) => assetId.trim())
            .filter(Boolean)
            .map((assetId) => ({ assetId }))
        : [],
      music: row.music_asset_id ? { mode: "upload", file: { assetId: row.music_asset_id } } : null,
    }),
  };
}

function buildOrderRow(serialized, payload, audit = {}) {
  return {
    order_id: serialized.orderId,
    invitation_slug: payload.invitationSlug || "",
    created_at: serialized.createdAt,
    updated_at: serialized.updatedAt,
    published_at: serialized.publishedAt || "",
    published_by: serialized.publishedBy || "",
    completed_at: serialized.completedAt || "",
    status: serialized.status,
    last_updated_by: serialized.audit?.lastUpdatedBy || audit.updatedBy || "",
    last_update_type: serialized.audit?.lastUpdateType || audit.updateType || "",
    last_update_note: serialized.audit?.lastUpdateNote || audit.note || "",
    customer_name: serialized.customerName || "",
    customer_phone: payload.customer?.phone || "",
    customer_email: payload.customer?.email || "",
    package_tier: serialized.packageTier || "",
    theme_slug: serialized.themeSlug || "",
    theme_name: serialized.themeName || "",
    total_price: serialized.totalPrice ?? "",
    cover_asset_id: payload.coverImage?.assetId || "",
    gallery_asset_ids: (payload.galleryImages || []).map((item) => item.assetId).filter(Boolean).join(","),
    music_asset_id: payload.music?.file?.assetId || "",
    payload_json: JSON.stringify(payload),
  };
}

function validatePublishReadiness(order) {
  const payload = order?.payload || {};
  const missing = [];
  if (!payload.customer?.name) missing.push("customer.name");
  if (!payload.selectedTheme?.slug) missing.push("selectedTheme.slug");
  if (!payload.selectedPackage?.tier) missing.push("selectedPackage.tier");
  if (!(payload.groom?.fullname || payload.groom?.nickname)) missing.push("groom.fullname");
  if (!(payload.bride?.fullname || payload.bride?.nickname)) missing.push("bride.fullname");
  if (!payload.akad?.date) missing.push("akad.date");
  if (!payload.akad?.venue) missing.push("akad.venue");
  if (!(payload.coverImage?.assetId || payload.coverImage?.url)) missing.push("coverImage");
  if (!order?.invitationSlug) missing.push("invitationSlug");

  if (missing.length > 0) {
    throw createValidationError("Order is not ready to publish", missing);
  }
}

function assertEditableStatus(currentOrder) {
  if (["done", "cancelled"].includes(currentOrder?.status)) {
    throw createValidationError(`Order with status ${currentOrder.status} cannot be edited`, ["status"]);
  }
}

function validateEditRules(currentOrder, patchPayload = {}) {
  assertEditableStatus(currentOrder);

  const protectedWhenPublished = [
    "invitationSlug",
    "selectedPackage",
    "selectedTheme",
  ];

  if (currentOrder?.status === "published") {
    const blockedFields = protectedWhenPublished.filter((field) => Object.prototype.hasOwnProperty.call(patchPayload, field));
    if (blockedFields.length > 0) {
      throw createValidationError("Published order can no longer change protected fields", blockedFields);
    }
  }
}

async function ensureInvitationSlugAvailable(invitationSlug, currentOrderId) {
  if (!invitationSlug) return;
  const existing = await getOrderByInvitationSlug(invitationSlug);
  if (existing && existing.orderId !== currentOrderId) {
    throw createConflictError("invitationSlug already exists");
  }
}

async function ensureOrderUnique(orderId, invitationSlug) {
  if (env.dataStoreProvider === "apps_script") {
    if (orderId) {
      const existingById = await getOrderById(orderId);
      if (existingById) {
        throw createConflictError("orderId already exists");
      }
    }
    if (invitationSlug) {
      const existingBySlug = await getOrderByInvitationSlug(invitationSlug);
      if (existingBySlug) {
        throw createConflictError("invitationSlug already exists");
      }
    }
    return;
  }

  if (env.dataStoreProvider === "google_sheets") {
    const rows = await listSheetObjects("orders", ORDER_HEADERS);
    if (orderId && rows.some((row) => row.order_id === orderId)) {
      throw createConflictError("orderId already exists");
    }
    if (invitationSlug && rows.some((row) => row.invitation_slug === invitationSlug)) {
      throw createConflictError("invitationSlug already exists");
    }
    return;
  }

  if (orderId && findOrderById(orderId)) {
    throw createConflictError("orderId already exists");
  }
  if (invitationSlug && findOrderByInvitationSlug(invitationSlug)) {
    throw createConflictError("invitationSlug already exists");
  }
}

function validateStatusPatch(status) {
  const normalized = normalizeOrderStatus(status, "");
  if (!normalized) {
    const error = new Error("status is required");
    error.status = 422;
    throw error;
  }
  if (!ORDER_STATUS_VALUES.includes(normalized)) {
    const error = new Error(`Invalid status. Allowed: ${ORDER_STATUS_VALUES.join(", ")}`);
    error.status = 422;
    throw error;
  }
  return normalized;
}

async function createOrderWithSheets(payload) {
  const basePayload = sanitizeOrderPayload(payload);
  const orderId = basePayload.orderId || createOrderId();
  const sanitizedPayload = {
    ...basePayload,
    invitationSlug: basePayload.invitationSlug || createInvitationSlug(basePayload, orderId),
  };
  const status = normalizeOrderStatus(sanitizedPayload.status, "processing");
  await ensureOrderUnique(orderId, sanitizedPayload.invitationSlug);
  const audit = normalizeAuditMeta({ updatedBy: "system", updateType: "create" }, "create");
  const now = new Date().toISOString();
  const order = {
    id: orderId,
    createdAt: now,
    updatedAt: now,
    publishedAt: status === "published" ? now : null,
    publishedBy: status === "published" ? audit.updatedBy : null,
    completedAt: status === "done" ? now : null,
    status,
    lastUpdatedBy: audit.updatedBy,
    lastUpdateType: audit.updateType,
    lastUpdateNote: audit.note,
    payload: sanitizedPayload,
  };
  const serialized = serializeOrder(order);

  await appendSheetObject("orders", ORDER_HEADERS, buildOrderRow(serialized, sanitizedPayload, audit));

  return serialized;
}

async function createOrderWithAppsScript(payload) {
  const basePayload = sanitizeOrderPayload(payload);
  const orderId = basePayload.orderId || createOrderId();
  const sanitizedPayload = {
    ...basePayload,
    invitationSlug: basePayload.invitationSlug || createInvitationSlug(basePayload, orderId),
  };
  const status = normalizeOrderStatus(sanitizedPayload.status, "processing");
  await ensureOrderUnique(orderId, sanitizedPayload.invitationSlug);
  const audit = normalizeAuditMeta({ updatedBy: "system", updateType: "create" }, "create");
  const now = new Date().toISOString();
  const order = {
    id: orderId,
    createdAt: now,
    updatedAt: now,
    publishedAt: status === "published" ? now : null,
    publishedBy: status === "published" ? audit.updatedBy : null,
    completedAt: status === "done" ? now : null,
    status,
    lastUpdatedBy: audit.updatedBy,
    lastUpdateType: audit.updateType,
    lastUpdateNote: audit.note,
    payload: sanitizedPayload,
  };
  const serialized = serializeOrder(order);

  const response = await callAppsScript("createOrder", {
    order: {
      orderId: serialized.orderId,
      invitationSlug: sanitizedPayload.invitationSlug || "",
      createdAt: serialized.createdAt,
      updatedAt: serialized.updatedAt,
      publishedAt: serialized.publishedAt || "",
      publishedBy: serialized.publishedBy || "",
      completedAt: serialized.completedAt || "",
      status: status,
      lastUpdatedBy: serialized.audit?.lastUpdatedBy || audit.updatedBy,
      lastUpdateType: serialized.audit?.lastUpdateType || audit.updateType,
      lastUpdateNote: serialized.audit?.lastUpdateNote || audit.note,
      customerName: serialized.customerName,
      customerPhone: sanitizedPayload.customer?.phone || "",
      customerEmail: sanitizedPayload.customer?.email || "",
      packageTier: serialized.packageTier,
      themeSlug: serialized.themeSlug,
      themeName: serialized.themeName,
      totalPrice: serialized.totalPrice,
      coverAssetId: sanitizedPayload.coverImage?.assetId || "",
      galleryAssetIds: (sanitizedPayload.galleryImages || []).map((item) => item.assetId).filter(Boolean),
      musicAssetId: sanitizedPayload.music?.file?.assetId || "",
      payloadJson: JSON.stringify(sanitizedPayload),
    },
  });

  return normalizeDriveAssetUrlsDeep(response.data || serialized);
}

export async function createOrder(payload) {
  if (env.dataStoreProvider === "apps_script") {
    return createOrderWithAppsScript(payload);
  }

  if (env.dataStoreProvider === "google_sheets") {
    return createOrderWithSheets(payload);
  }

  const basePayload = sanitizeOrderPayload(payload);
  const orderId = basePayload.orderId || createOrderId();
  const sanitizedPayload = {
    ...basePayload,
    invitationSlug: basePayload.invitationSlug || createInvitationSlug(basePayload, orderId),
  };
  const status = normalizeOrderStatus(sanitizedPayload.status, "processing");
  await ensureOrderUnique(orderId, sanitizedPayload.invitationSlug);
  const audit = normalizeAuditMeta({ updatedBy: "system", updateType: "create" }, "create");
  const now = new Date().toISOString();
  const order = addOrder({
    id: orderId,
    createdAt: now,
    updatedAt: now,
    publishedAt: status === "published" ? now : null,
    publishedBy: status === "published" ? audit.updatedBy : null,
    completedAt: status === "done" ? now : null,
    status,
    lastUpdatedBy: audit.updatedBy,
    lastUpdateType: audit.updateType,
    lastUpdateNote: audit.note,
    payload: sanitizedPayload,
  });

  return serializeOrder(order);
}

export async function getOrders() {
  if (env.dataStoreProvider === "apps_script") {
    const response = await callAppsScript("listOrders");
    return Array.isArray(response.data) ? response.data.map((order) => normalizeDriveAssetUrlsDeep(order)) : [];
  }

  if (env.dataStoreProvider === "google_sheets") {
    const rows = await listSheetObjects("orders", ORDER_HEADERS);
    return rows.map((row) => serializeOrder(mapOrderRowToOrder(row)));
  }

  return listOrders().map((order) => serializeOrder(order));
}

export async function getOrderByInvitationSlug(invitationSlug) {
  if (!invitationSlug) return null;

  if (env.dataStoreProvider === "apps_script") {
    const response = await callAppsScript("getOrderByInvitationSlug", { invitationSlug });
    return normalizeDriveAssetUrlsDeep(response.data || null);
  }

  if (env.dataStoreProvider === "google_sheets") {
    const rows = await listSheetObjects("orders", ORDER_HEADERS);
    const found = rows.find((row) => row.invitation_slug === invitationSlug);
    return found ? serializeOrder(mapOrderRowToOrder(found)) : null;
  }

  const found = listOrders().find((order) => order.payload?.invitationSlug === invitationSlug);
  return found ? serializeOrder(found) : null;
}

export async function getOrderById(orderId) {
  if (env.dataStoreProvider === "apps_script") {
    const response = await callAppsScript("getOrderById", { orderId });
    return normalizeDriveAssetUrlsDeep(response.data || null);
  }

  if (env.dataStoreProvider === "google_sheets") {
    const rows = await listSheetObjects("orders", ORDER_HEADERS);
    const found = rows.find((row) => row.order_id === orderId);
    return found ? serializeOrder(mapOrderRowToOrder(found)) : null;
  }

  const order = findOrderById(orderId);
  return order ? serializeOrder(order) : null;
}

export async function editOrder(orderId, payload, meta = {}) {
  const currentOrder = await getOrderById(orderId);
  if (!currentOrder) return null;

  const currentPayload = currentOrder.payload || {};
  const editablePatch = { ...(payload || {}) };
  delete editablePatch.note;
  delete editablePatch.reason;
  delete editablePatch.updatedBy;
  delete editablePatch.status;
  delete editablePatch.orderId;
  validateEditRules(currentOrder, editablePatch);
  const mergedPayload = deepMergeOrderPayload(currentPayload, editablePatch);
  const sanitizedPayload = sanitizeOrderPayload({
    ...mergedPayload,
    orderId,
    invitationSlug: editablePatch?.invitationSlug ?? currentOrder.invitationSlug ?? currentPayload.invitationSlug,
    status: currentOrder.status,
  });
  const nextInvitationSlug = sanitizedPayload.invitationSlug || currentOrder.invitationSlug || createInvitationSlug(sanitizedPayload, orderId);
  await ensureInvitationSlugAvailable(nextInvitationSlug, orderId);

  const audit = normalizeAuditMeta(meta, "edit_order");
  const nextPayload = {
    ...sanitizedPayload,
    invitationSlug: nextInvitationSlug,
  };
  const updatedAt = new Date().toISOString();
  const nextOrder = {
    id: orderId,
    createdAt: currentOrder.createdAt,
    updatedAt,
    publishedAt: currentOrder.publishedAt || null,
    publishedBy: currentOrder.publishedBy || null,
    completedAt: currentOrder.completedAt || null,
    status: currentOrder.status,
    lastUpdatedBy: audit.updatedBy,
    lastUpdateType: audit.updateType,
    lastUpdateNote: audit.note,
    payload: nextPayload,
  };
  const serialized = serializeOrder(nextOrder);

  if (env.dataStoreProvider === "apps_script") {
    const response = await callAppsScript("updateOrder", {
      order: buildOrderRow(serialized, nextPayload, audit),
    });
    return normalizeDriveAssetUrlsDeep(response.data || serialized);
  }

  if (env.dataStoreProvider === "google_sheets") {
    const updated = await updateSheetObject("orders", ORDER_HEADERS, "order_id", orderId, buildOrderRow(serialized, nextPayload, audit));
    return updated ? serializeOrder(mapOrderRowToOrder(updated)) : null;
  }

  const updated = updateOrder(orderId, {
    id: orderId,
    createdAt: currentOrder.createdAt,
    updatedAt,
    publishedAt: currentOrder.publishedAt || null,
    publishedBy: currentOrder.publishedBy || null,
    completedAt: currentOrder.completedAt || null,
    status: currentOrder.status,
    lastUpdatedBy: audit.updatedBy,
    lastUpdateType: audit.updateType,
    lastUpdateNote: audit.note,
    payload: nextPayload,
  });
  return updated ? serializeOrder(updated) : null;
}

export async function updateOrderStatus(orderId, payload, meta = {}) {
  const nextStatus = validateStatusPatch(payload?.status);
  const currentOrder = await getOrderById(orderId);
  if (!currentOrder) return null;
  if (nextStatus === "published") {
    validatePublishReadiness(currentOrder);
  }
  const audit = normalizeAuditMeta(
    {
      updatedBy: meta.updatedBy || payload?.updatedBy,
      note: meta.note || payload?.note,
      updateType: meta.updateType || "status_change",
    },
    "status_change"
  );
  const updatedAt = new Date().toISOString();
  const publishedAt = nextStatus === "published" ? updatedAt : "";
  const publishedBy = nextStatus === "published" ? audit.updatedBy : "";
  const completedAt = nextStatus === "done" ? currentOrder.completedAt || updatedAt : "";

  if (env.dataStoreProvider === "apps_script") {
    const response = await callAppsScript("updateOrderStatus", {
      orderId,
      status: nextStatus,
      updatedAt,
      publishedAt,
      publishedBy,
      completedAt,
      lastUpdatedBy: audit.updatedBy,
      lastUpdateType: audit.updateType,
      lastUpdateNote: audit.note,
    });
    return normalizeDriveAssetUrlsDeep(response.data || null);
  }

  if (env.dataStoreProvider === "google_sheets") {
    const updated = await updateSheetObject("orders", ORDER_HEADERS, "order_id", orderId, {
      status: nextStatus,
      updated_at: updatedAt,
      published_at: publishedAt,
      published_by: publishedBy,
      completed_at: completedAt,
      last_updated_by: audit.updatedBy,
      last_update_type: audit.updateType,
      last_update_note: audit.note,
    });
    return updated ? serializeOrder(mapOrderRowToOrder(updated)) : null;
  }

  const updated = updateOrder(orderId, (current) => ({
    ...current,
    status: nextStatus,
    updatedAt,
    publishedAt: nextStatus === "published" ? updatedAt : null,
    publishedBy: nextStatus === "published" ? audit.updatedBy : null,
    completedAt: nextStatus === "done" ? current.completedAt || updatedAt : null,
    lastUpdatedBy: audit.updatedBy,
    lastUpdateType: audit.updateType,
    lastUpdateNote: audit.note,
  }));
  return updated ? serializeOrder(updated) : null;
}

export async function publishOrder(orderId, meta = {}) {
  const currentOrder = await getOrderById(orderId);
  if (!currentOrder) return null;
  validatePublishReadiness(currentOrder);

  const audit = normalizeAuditMeta(meta, "publish");
  const order = await updateOrderStatus(
    orderId,
    {
      status: "published",
      updatedBy: audit.updatedBy,
      note: audit.note,
    },
    {
      ...audit,
      updateType: "publish",
    }
  );
  if (!order) return null;

  return {
    ...order,
    invitationUrl: `${env.appOrigin.replace(/\/+$/, "")}/undangan/${order.invitationSlug}`,
  };
}

export async function queueOrderEmail(payload) {
  const emailJob = {
    id: createEmailId(),
    orderId: payload?.orderId || null,
    customerEmail: payload?.customer?.email || null,
    status: "queued",
    createdAt: new Date().toISOString(),
  };

  if (env.dataStoreProvider === "apps_script") {
    const response = await callAppsScript("queueOrderEmail", {
      emailJob,
    });
    return response.data || emailJob;
  }

  if (env.dataStoreProvider === "google_sheets") {
    await appendSheetObject("orderEmails", ORDER_EMAIL_HEADERS, {
      email_id: emailJob.id,
      order_id: emailJob.orderId || "",
      customer_email: emailJob.customerEmail || "",
      status: emailJob.status,
      created_at: emailJob.createdAt,
    });
    return emailJob;
  }

  return addOrderEmail(emailJob);
}

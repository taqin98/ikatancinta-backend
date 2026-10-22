import { getOrders } from "../orders/order.service.js";
import { getThemeBySlug } from "./theme.service.js";

const PUBLIC_ORDER_STATUSES = new Set(["published", "done"]);
const invitationDateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Asia/Jakarta",
});

function pickText(...values) {
  for (const value of values) {
    if (value === null || value === undefined) continue;
    if (typeof value === "object") continue;
    const text = String(value).replace(/\s+/g, " ").trim();
    if (text) return text;
  }
  return "";
}

function resolveCoupleName(payload = {}) {
  const groomName = pickText(payload?.groom?.nickname, payload?.groom?.fullname);
  const brideName = pickText(payload?.bride?.nickname, payload?.bride?.fullname);

  if (groomName && brideName) {
    return `${groomName} & ${brideName}`;
  }

  return pickText(payload?.customer?.name);
}

function formatInvitationDate(...candidates) {
  for (const candidate of candidates) {
    const rawValue = pickText(candidate);
    if (!rawValue) continue;

    const parsed = new Date(rawValue);
    if (!Number.isNaN(parsed.getTime())) {
      return invitationDateFormatter.format(parsed);
    }

    return rawValue;
  }

  return "";
}

function resolveInvitationThumbnail(order, theme) {
  return pickText(
    order?.payload?.frontCoverImage?.url,
    order?.payload?.coverImage?.url,
    order?.payload?.openingThumbnailImage?.url,
    order?.payload?.galleryImages?.[0]?.url,
    theme?.thumbnail,
    theme?.image,
  );
}

function resolveInvitationTitle(order) {
  const coupleName = resolveCoupleName(order?.payload || {});
  return coupleName ? `Undangan ${coupleName}` : `Undangan ${order?.orderId || ""}`.trim();
}

function mapOrderToThemeInvitation(order, theme) {
  const payload = order?.payload || {};
  const invitationSlug = pickText(order?.invitationSlug, payload?.invitationSlug, payload?.invitation_slug);

  return {
    id: order?.orderId || invitationSlug,
    orderId: order?.orderId || null,
    invitationSlug: invitationSlug || null,
    href: invitationSlug ? `/undangan/${encodeURIComponent(invitationSlug)}` : null,
    title: resolveInvitationTitle(order),
    couple: resolveCoupleName(payload),
    date: formatInvitationDate(
      payload?.akad?.date,
      payload?.event?.akad?.date,
      payload?.resepsiList?.[0]?.date,
      payload?.event?.resepsiList?.[0]?.date,
      payload?.resepsi?.date,
      payload?.event?.resepsi?.date,
      order?.publishedAt,
      order?.createdAt,
    ),
    thumbnail: resolveInvitationThumbnail(order, theme),
    status: order?.status || null,
    publishedAt: order?.publishedAt || null,
    themeSlug: order?.themeSlug || theme?.slug || null,
    themeName: order?.themeName || theme?.name || null,
  };
}

export async function getLiveThemeInvitations(slug) {
  const theme = getThemeBySlug(slug);
  if (!theme) return null;

  const orders = await getOrders();

  return orders
    .filter((order) => {
      if (!order) return false;
      if (String(order?.themeSlug || "") !== slug) return false;
      if (!PUBLIC_ORDER_STATUSES.has(String(order?.status || "").toLowerCase())) return false;
      return Boolean(pickText(order?.invitationSlug, order?.payload?.invitationSlug, order?.payload?.invitation_slug));
    })
    .sort((left, right) => {
      const leftTime = new Date(left?.publishedAt || left?.updatedAt || left?.createdAt || 0).getTime();
      const rightTime = new Date(right?.publishedAt || right?.updatedAt || right?.createdAt || 0).getTime();
      return rightTime - leftTime;
    })
    .map((order) => mapOrderToThemeInvitation(order, theme));
}

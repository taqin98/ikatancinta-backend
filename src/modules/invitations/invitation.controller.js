import { getInvitationBySlug } from "./invitation.service.js";
import { getOrderByInvitationSlug } from "../orders/order.service.js";
import { getThemeBySlug } from "../themes/theme.service.js";
import { createWish, listWishRecordsBySlug } from "../wishes/wish.service.js";

export async function getInvitationController(req, res, next) {
  try {
    const invitation = await getInvitationBySlug(req.params.slug);
    if (!invitation) {
      res.status(404).json({ success: false, message: "Invitation theme not found" });
      return;
    }

    res.json(invitation);
  } catch (error) {
    next(error);
  }
}

export async function createWishController(req, res, next) {
  try {
    const entry = await createWish(req.params.slug, req.body);
    res.status(201).json({
      success: true,
      message: "Wish accepted",
      data: entry,
    });
  } catch (error) {
    next(error);
  }
}

export async function listInvitationWishesController(req, res, next) {
  try {
    const relatedOrder = await getOrderByInvitationSlug(req.params.slug);
    const theme = getThemeBySlug(req.params.slug);

    if (!relatedOrder && !theme) {
      res.status(404).json({ success: false, message: "Invitation theme not found" });
      return;
    }

    const wishes = await listWishRecordsBySlug(req.params.slug);
    res.json({
      success: true,
      data: {
        invitationSlug: req.params.slug,
        orderId: relatedOrder?.orderId || null,
        packageTier: relatedOrder?.packageTier || theme?.packageTier || null,
        themeSlug: relatedOrder?.themeSlug || theme?.slug || null,
        orderStatus: relatedOrder?.status || null,
        publishedAt: relatedOrder?.publishedAt || null,
        isPublished: relatedOrder ? ["published", "done"].includes(String(relatedOrder.status || "").toLowerCase()) : true,
        total: wishes.length,
        wishes,
      },
    });
  } catch (error) {
    next(error);
  }
}

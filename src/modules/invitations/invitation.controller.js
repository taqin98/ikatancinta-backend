import { getInvitationBySlug } from "./invitation.service.js";
import { createWish } from "../wishes/wish.service.js";

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

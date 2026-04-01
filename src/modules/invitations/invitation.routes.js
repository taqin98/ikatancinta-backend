import { Router } from "express";
import { createWishController, getInvitationController, listInvitationWishesController } from "./invitation.controller.js";

const router = Router();

router.get("/:slug", getInvitationController);
router.get("/:slug/list-wishes", listInvitationWishesController);
router.post("/:slug/wishes", createWishController);

export default router;

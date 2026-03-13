import { Router } from "express";
import { createWishController, getInvitationController } from "./invitation.controller.js";

const router = Router();

router.get("/:slug", getInvitationController);
router.post("/:slug/wishes", createWishController);

export default router;

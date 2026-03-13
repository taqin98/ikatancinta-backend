import { Router } from "express";
import { listThemeInvitations, listThemes } from "./theme.controller.js";

const router = Router();

router.get("/", listThemes);
router.get("/:slug/invitations", listThemeInvitations);

export default router;

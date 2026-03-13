import { Router } from "express";
import { requireAdminAuth } from "../../middlewares/requireAdminAuth.js";
import { getAdminProfileController, getAdminSummaryController, loginAdminController } from "./admin.controller.js";

const router = Router();

router.post("/auth/login", loginAdminController);
router.get("/auth/me", requireAdminAuth, getAdminProfileController);
router.get("/summary", requireAdminAuth, getAdminSummaryController);

export default router;

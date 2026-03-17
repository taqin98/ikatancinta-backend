import { Router } from "express";
import { getDriveAssetController } from "./asset.controller.js";

const router = Router();

router.get("/drive/:fileId", getDriveAssetController);

export default router;

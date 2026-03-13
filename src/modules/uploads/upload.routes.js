import { Router } from "express";
import multer from "multer";
import { env } from "../../config/env.js";
import { createUploadController, listUploadsController } from "./upload.controller.js";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.uploadFileLimitBytes,
  },
});

router.get("/", listUploadsController);
router.post("/", upload.single("file"), createUploadController);

export default router;

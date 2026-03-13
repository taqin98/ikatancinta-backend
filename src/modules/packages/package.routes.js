import { Router } from "express";
import { listPackages } from "./package.controller.js";

const router = Router();

router.get("/", listPackages);

export default router;

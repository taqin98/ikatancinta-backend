import { Router } from "express";
import {
  listPaymentMethodsController,
  getPaymentMethodByIdController,
  createPaymentMethodController,
  updatePaymentMethodController,
  deletePaymentMethodController,
} from "./paymentMethod.controller.js";
import { requireAdminAuth } from "../../middlewares/requireAdminAuth.js";

const router = Router();

// Public: anyone can list enabled payment methods
router.get("/", listPaymentMethodsController);

// Admin-only: CRUD
router.get("/:methodId", requireAdminAuth, getPaymentMethodByIdController);
router.post("/", requireAdminAuth, createPaymentMethodController);
router.put("/:methodId", requireAdminAuth, updatePaymentMethodController);
router.delete("/:methodId", requireAdminAuth, deletePaymentMethodController);

export default router;

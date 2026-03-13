import { Router } from "express";
import { createOrderController, getOrderByIdController, listOrdersController, patchOrderStatusController, publishOrderController, queueOrderEmailController, updateOrderController } from "./order.controller.js";
import { requireAdminAuth } from "../../middlewares/requireAdminAuth.js";

const router = Router();

router.post("/", createOrderController);
router.get("/:orderId", getOrderByIdController);
router.get("/", requireAdminAuth, listOrdersController);
router.put("/:orderId", requireAdminAuth, updateOrderController);
router.patch("/:orderId", requireAdminAuth, patchOrderStatusController);
router.post("/:orderId/publish", requireAdminAuth, publishOrderController);
router.post("/email", requireAdminAuth, queueOrderEmailController);

export default router;

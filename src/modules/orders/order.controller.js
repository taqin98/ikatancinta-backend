import { createOrder, editOrder, getOrderById, getOrders, publishOrder, queueOrderEmail, updateOrderStatus } from "./order.service.js";
import { getUploads } from "../uploads/upload.service.js";
import { listWishRecordsByOrderId, listWishes } from "../wishes/wish.service.js";

function readAdminMeta(req, fallbackType = "admin_update") {
  return {
    updatedBy: String(req.get("x-admin-actor") || req.body?.updatedBy || req.admin?.name || req.admin?.sub || "admin").trim() || "admin",
    note: String(req.body?.note || req.body?.reason || "").trim(),
    updateType: fallbackType,
  };
}

export function createOrderController(req, res, next) {
  try {
    Promise.resolve(createOrder(req.body))
      .then((order) => {
        res.status(201).json({
          success: true,
          orderId: order.orderId,
          createdAt: order.createdAt,
          completedAt: order.completedAt,
          status: order.status,
          invitationSlug: order.invitationSlug,
          customerName: order.customerName,
          packageTier: order.packageTier,
          themeSlug: order.themeSlug,
          themeName: order.themeName,
          totalPrice: order.totalPrice,
          message: "Pesanan berhasil diterima dan sedang diproses admin.",
          data: {
            orderId: order.orderId,
            invitationSlug: order.invitationSlug,
            customerName: order.customerName,
            packageTier: order.packageTier,
            themeSlug: order.themeSlug,
            themeName: order.themeName,
            totalPrice: order.totalPrice,
          },
        });
      })
      .catch(next);
  } catch (error) {
    next(error);
  }
}

export async function listOrdersController(req, res, next) {
  try {
    const orders = await getOrders();
    const statusFilter = typeof req.query?.status === "string" ? req.query.status.trim().toLowerCase() : "";
    const packageFilter = typeof req.query?.packageTier === "string" ? req.query.packageTier.trim().toUpperCase() : "";
    const themeFilter = typeof req.query?.themeSlug === "string" ? req.query.themeSlug.trim() : "";
    const filteredOrders = orders.filter((order) => {
      if (statusFilter && String(order.status || "").toLowerCase() !== statusFilter) return false;
      if (packageFilter && String(order.packageTier || "").toUpperCase() !== packageFilter) return false;
      if (themeFilter && String(order.themeSlug || "") !== themeFilter) return false;
      return true;
    });
    res.json(
      filteredOrders.map((order) => ({
        id: order.id,
        orderId: order.orderId,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        publishedAt: order.publishedAt,
        completedAt: order.completedAt,
        status: order.status,
        invitationSlug: order.invitationSlug,
        packageTier: order.packageTier,
        themeSlug: order.themeSlug,
        customerName: order.customerName,
        audit: order.audit,
      }))
    );
  } catch (error) {
    next(error);
  }
}

export async function patchOrderStatusController(req, res, next) {
  try {
    const order = await updateOrderStatus(req.params.orderId, req.body, readAdminMeta(req, "status_change"));
    if (!order) {
      res.status(404).json({ success: false, message: "Order not found" });
      return;
    }

    res.json({
      success: true,
      message: "Order status updated",
      data: order,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateOrderController(req, res, next) {
  try {
    const order = await editOrder(req.params.orderId, req.body, readAdminMeta(req, "edit_order"));
    if (!order) {
      res.status(404).json({ success: false, message: "Order not found" });
      return;
    }

    res.json({
      success: true,
      message: "Order updated",
      data: order,
    });
  } catch (error) {
    next(error);
  }
}

export async function publishOrderController(req, res, next) {
  try {
    const order = await publishOrder(req.params.orderId, readAdminMeta(req, "publish"));
    if (!order) {
      res.status(404).json({ success: false, message: "Order not found" });
      return;
    }

    res.json({
      success: true,
      message: "Order published",
      data: order,
    });
  } catch (error) {
    next(error);
  }
}

export async function getOrderByIdController(req, res, next) {
  try {
    const order = await getOrderById(req.params.orderId);
    if (!order) {
      res.status(404).json({ success: false, message: "Order not found" });
      return;
    }

    const allUploads = await getUploads();
    const relatedUploads = allUploads.filter((asset) => asset.orderId === order.orderId);
    const relatedWishes = order.invitationSlug
      ? await listWishes(order.invitationSlug)
      : await listWishRecordsByOrderId(order.orderId);

    res.json({
      success: true,
      data: {
        ...order,
        uploads: relatedUploads,
        wishes: relatedWishes,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function queueOrderEmailController(req, res, next) {
  try {
    const emailJob = await queueOrderEmail(req.body);
    res.status(202).json({
      success: true,
      message: "Email notification queued by mock API.",
      data: emailJob,
    });
  } catch (error) {
    next(error);
  }
}

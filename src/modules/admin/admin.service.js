import { getOrders } from "../orders/order.service.js";
import { getUploads } from "../uploads/upload.service.js";
import { listAllWishRecords } from "../wishes/wish.service.js";

export async function getAdminSummary() {
  const [orders, uploads, wishes] = await Promise.all([
    getOrders(),
    getUploads(),
    listAllWishRecords(),
  ]);

  const byStatus = orders.reduce((accumulator, order) => {
    const key = order.status || "processing";
    accumulator[key] = (accumulator[key] || 0) + 1;
    return accumulator;
  }, {});

  const byPackageTier = orders.reduce((accumulator, order) => {
    const key = order.packageTier || "UNKNOWN";
    accumulator[key] = (accumulator[key] || 0) + 1;
    return accumulator;
  }, {});

  return {
    totals: {
      orders: orders.length,
      uploads: uploads.length,
      wishes: wishes.length,
      publishedOrders: byStatus.published || 0,
      pendingOrders: byStatus.pending || 0,
      processingOrders: byStatus.processing || 0,
    },
    byStatus,
    byPackageTier,
    recentOrders: orders.slice(0, 5).map((order) => ({
      orderId: order.orderId,
      invitationSlug: order.invitationSlug,
      status: order.status,
      customerName: order.customerName,
      packageTier: order.packageTier,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      publishedAt: order.publishedAt,
      audit: order.audit,
    })),
    generatedAt: new Date().toISOString(),
  };
}

import { memoryStore } from "../../store/memoryStore.js";

export function addOrder(order) {
  memoryStore.orders.unshift(order);
  return order;
}

export function listOrders() {
  return memoryStore.orders;
}

export function findOrderById(orderId) {
  return memoryStore.orders.find((order) => order.id === orderId) || null;
}

export function findOrderByInvitationSlug(invitationSlug) {
  return memoryStore.orders.find((order) => order.payload?.invitationSlug === invitationSlug) || null;
}

export function updateOrder(orderId, updater) {
  const index = memoryStore.orders.findIndex((order) => order.id === orderId);
  if (index < 0) return null;
  const current = memoryStore.orders[index];
  const next = typeof updater === "function" ? updater(current) : { ...current, ...updater };
  memoryStore.orders[index] = next;
  return next;
}

export function addOrderEmail(emailJob) {
  memoryStore.orderEmails.unshift(emailJob);
  return emailJob;
}

import { memoryStore } from "../../store/memoryStore.js";

export function listPaymentMethodRecords() {
  return memoryStore.paymentMethods;
}

export function findPaymentMethodById(methodId) {
  return memoryStore.paymentMethods.find((m) => m.methodId === methodId) || null;
}

export function addPaymentMethod(method) {
  memoryStore.paymentMethods.push(method);
  return method;
}

export function updatePaymentMethodRecord(methodId, updater) {
  const index = memoryStore.paymentMethods.findIndex((m) => m.methodId === methodId);
  if (index < 0) return null;
  const current = memoryStore.paymentMethods[index];
  const next = typeof updater === "function" ? updater(current) : { ...current, ...updater };
  memoryStore.paymentMethods[index] = next;
  return next;
}

export function removePaymentMethodRecord(methodId) {
  const index = memoryStore.paymentMethods.findIndex((m) => m.methodId === methodId);
  if (index < 0) return false;
  memoryStore.paymentMethods.splice(index, 1);
  return true;
}

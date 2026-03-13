import { memoryStore } from "../../store/memoryStore.js";

export function listWishesBySlug(slug) {
  return memoryStore.wishes.get(slug) || [];
}

export function listWishesByOrderId(orderId) {
  return Array.from(memoryStore.wishes.values()).flat().filter((wish) => wish.orderId === orderId);
}

export function listAllWishes() {
  return Array.from(memoryStore.wishes.values()).flat();
}

export function prependWish(slug, wish) {
  const current = listWishesBySlug(slug);
  const next = [wish, ...current];
  memoryStore.wishes.set(slug, next);
  return wish;
}

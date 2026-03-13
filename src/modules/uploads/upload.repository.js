import { memoryStore } from "../../store/memoryStore.js";

export function addUpload(asset) {
  memoryStore.uploads.unshift(asset);
  return asset;
}

export function listUploads() {
  return memoryStore.uploads;
}

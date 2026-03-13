export function normalizeOrderId(value) {
  if (typeof value !== "string") return "";
  return value.trim().replace(/[^A-Za-z0-9_-]/g, "");
}

export function createAssetId() {
  return `asset_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createEmailId() {
  return `email_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createOrderId() {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `IKC-${yy}${mm}${dd}-${random}`;
}

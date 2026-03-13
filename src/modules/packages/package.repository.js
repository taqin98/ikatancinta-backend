import { packageCatalog } from "./package.data.js";
import { normalizePackageTier } from "../../utils/normalizePackageTier.js";

export function findAllPackages() {
  return packageCatalog;
}

export function findPackageByTier(tier) {
  const normalizedTier = normalizePackageTier(tier);
  return packageCatalog.find((item) => item.tier === normalizedTier) || packageCatalog[0];
}

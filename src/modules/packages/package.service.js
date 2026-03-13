import { findAllPackages, findPackageByTier } from "./package.repository.js";

export function getPackages() {
  return findAllPackages();
}

export function getPackageConfig(tier) {
  return findPackageByTier(tier);
}

const PACKAGE_TIER_ALIASES = {
  EKSLUSIF: "EKSKLUSIF",
};

export function normalizePackageTier(tier) {
  if (!tier) return "BASIC";
  return PACKAGE_TIER_ALIASES[String(tier).trim().toUpperCase()] || String(tier).trim().toUpperCase();
}

import { themes, invitationsByTheme } from "./theme.data.js";
import { normalizePackageTier } from "../../utils/normalizePackageTier.js";
import { themeMatchesCategory } from "./themeCategory.util.js";

export function findThemes(filters = {}) {
  return themes.filter((theme) => {
    if (filters.packageTier && normalizePackageTier(theme.packageTier) !== normalizePackageTier(filters.packageTier)) return false;
    if (filters.slug && theme.slug !== filters.slug) return false;
    if (filters.presetId && theme.presetId !== filters.presetId) return false;
    if (filters.status && theme.status !== filters.status) return false;
    if (filters.category && !themeMatchesCategory(theme, filters.category)) return false;
    return true;
  });
}

export function findThemeBySlug(slug) {
  return themes.find((theme) => theme.slug === slug) || null;
}

export function findInvitationsByThemeSlug(slug) {
  return invitationsByTheme[slug] || [];
}

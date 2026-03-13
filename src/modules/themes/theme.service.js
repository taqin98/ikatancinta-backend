import { findInvitationsByThemeSlug, findThemeBySlug, findThemes } from "./theme.repository.js";

export function getThemes(filters) {
  return findThemes(filters);
}

export function getThemeBySlug(slug) {
  return findThemeBySlug(slug);
}

export function getThemeInvitations(slug) {
  return findInvitationsByThemeSlug(slug);
}

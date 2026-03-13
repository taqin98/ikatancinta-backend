import { getThemeBySlug, getThemeInvitations, getThemes } from "./theme.service.js";

export function listThemes(req, res) {
  res.json(getThemes(req.query));
}

export function listThemeInvitations(req, res) {
  const theme = getThemeBySlug(req.params.slug);
  if (!theme) {
    res.status(404).json({ success: false, message: "Theme not found" });
    return;
  }

  res.json(getThemeInvitations(req.params.slug));
}

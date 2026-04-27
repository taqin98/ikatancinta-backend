import { getThemeBySlug, getThemes } from "./theme.service.js";
import { getLiveThemeInvitations } from "./themeInvitation.service.js";

export function listThemes(req, res) {
  res.json(getThemes(req.query));
}

export async function listThemeInvitations(req, res, next) {
  try {
    const theme = getThemeBySlug(req.params.slug);
    if (!theme) {
      res.status(404).json({ success: false, message: "Theme not found" });
      return;
    }

    const invitations = await getLiveThemeInvitations(req.params.slug);
    res.json(Array.isArray(invitations) ? invitations : []);
  } catch (error) {
    next(error);
  }
}

import { loginAdmin } from "./adminAuth.service.js";
import { getAdminSummary } from "./admin.service.js";

export async function loginAdminController(req, res, next) {
  try {
    res.json({
      success: true,
      message: "Admin login success",
      data: loginAdmin(req.body),
    });
  } catch (error) {
    next(error);
  }
}

export async function getAdminProfileController(req, res, next) {
  try {
    res.json({
      success: true,
      data: {
        email: req.admin?.sub || null,
        name: req.admin?.name || null,
        role: req.admin?.role || "admin",
        expiresAt: req.admin?.exp ? new Date(Number(req.admin.exp) * 1000).toISOString() : null,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getAdminSummaryController(_req, res, next) {
  try {
    res.json({
      success: true,
      data: await getAdminSummary(),
    });
  } catch (error) {
    next(error);
  }
}

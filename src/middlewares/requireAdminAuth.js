import { verifyAdminJwt } from "../utils/adminJwt.js";

function readBearerToken(headerValue) {
  const match = String(headerValue || "").match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || "";
}

export function requireAdminAuth(req, _res, next) {
  try {
    const token = readBearerToken(req.get("authorization"));
    req.admin = verifyAdminJwt(token);
    next();
  } catch (error) {
    next(error);
  }
}

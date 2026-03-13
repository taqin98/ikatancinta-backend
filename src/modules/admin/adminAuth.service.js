import crypto from "crypto";
import { env } from "../../config/env.js";
import { createAdminJwt } from "../../utils/adminJwt.js";

function timingSafeEquals(left, right) {
  const leftBuffer = Buffer.from(String(left || ""));
  const rightBuffer = Buffer.from(String(right || ""));
  if (leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

export function loginAdmin(payload = {}) {
  const email = String(payload.email || "").trim().toLowerCase();
  const password = String(payload.password || "");

  if (!email || !password) {
    const error = new Error("email and password are required");
    error.status = 422;
    throw error;
  }

  const expectedEmail = String(env.adminAuthEmail || "").trim().toLowerCase();
  const expectedPassword = String(env.adminAuthPassword || "");
  if (!timingSafeEquals(email, expectedEmail) || !timingSafeEquals(password, expectedPassword)) {
    const error = new Error("Admin login failed");
    error.status = 401;
    throw error;
  }

  const accessToken = createAdminJwt({
    sub: env.adminAuthEmail,
    name: env.adminDisplayName,
  });

  return {
    accessToken,
    tokenType: "Bearer",
    expiresIn: env.adminJwtExpiresInSeconds,
    admin: {
      email: env.adminAuthEmail,
      name: env.adminDisplayName,
      role: "admin",
    },
  };
}

import crypto from "crypto";
import { env } from "../config/env.js";

function base64UrlEncode(input) {
  const buffer = Buffer.isBuffer(input) ? input : Buffer.from(String(input));
  return buffer.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(input) {
  const normalized = String(input).replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return Buffer.from(normalized + padding, "base64").toString("utf8");
}

function signTokenSegment(unsignedToken) {
  return base64UrlEncode(crypto.createHmac("sha256", env.adminJwtSecret).update(unsignedToken).digest());
}

export function createAdminJwt(payload = {}) {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const header = {
    alg: "HS256",
    typ: "JWT",
  };
  const body = {
    sub: payload.sub || env.adminAuthEmail,
    role: "admin",
    name: payload.name || env.adminDisplayName,
    iat: nowSeconds,
    exp: nowSeconds + env.adminJwtExpiresInSeconds,
  };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(body));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;
  const signature = signTokenSegment(unsignedToken);
  return `${unsignedToken}.${signature}`;
}

export function verifyAdminJwt(token) {
  const normalizedToken = String(token || "").trim();
  if (!normalizedToken) {
    const error = new Error("Admin token is required");
    error.status = 401;
    throw error;
  }

  const segments = normalizedToken.split(".");
  if (segments.length !== 3) {
    const error = new Error("Invalid admin token");
    error.status = 401;
    throw error;
  }

  const [encodedHeader, encodedPayload, signature] = segments;
  const expectedSignature = signTokenSegment(`${encodedHeader}.${encodedPayload}`);
  const providedSignature = Buffer.from(signature);
  const computedSignature = Buffer.from(expectedSignature);

  if (
    providedSignature.length !== computedSignature.length ||
    !crypto.timingSafeEqual(providedSignature, computedSignature)
  ) {
    const error = new Error("Admin token signature mismatch");
    error.status = 401;
    throw error;
  }

  let payload;
  try {
    payload = JSON.parse(base64UrlDecode(encodedPayload));
  } catch {
    const error = new Error("Invalid admin token payload");
    error.status = 401;
    throw error;
  }

  if (payload.exp && Math.floor(Date.now() / 1000) >= Number(payload.exp)) {
    const error = new Error("Admin token expired");
    error.status = 401;
    throw error;
  }

  if (payload.role !== "admin") {
    const error = new Error("Admin role is required");
    error.status = 403;
    throw error;
  }

  return payload;
}

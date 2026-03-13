import { env } from "../../config/env.js";

function getAppsScriptBaseUrl() {
  return String(env.appsScriptBaseUrl || "").replace(/\/+$/, "");
}

async function readJsonSafely(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function callAppsScript(action, payload = {}) {
  const baseUrl = getAppsScriptBaseUrl();
  if (!baseUrl) {
    const error = new Error("APPS_SCRIPT_BASE_URL is required for apps_script provider.");
    error.status = 500;
    throw error;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), env.appsScriptTimeoutMs);

  try {
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        secret: env.appsScriptSharedSecret,
        action,
        payload,
      }),
      signal: controller.signal,
    });

    const data = await readJsonSafely(response);
    if (!response.ok) {
      const message = data?.message || `Apps Script request failed with HTTP ${response.status}`;
      const error = new Error(message);
      error.status = response.status;
      error.response = data;
      throw error;
    }

    if (!data?.success) {
      const error = new Error(data?.message || "Apps Script request failed.");
      error.status = 502;
      error.response = data;
      throw error;
    }

    return data;
  } catch (error) {
    if (error.name === "AbortError") {
      const timeoutError = new Error("Apps Script request timed out.");
      timeoutError.status = 504;
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

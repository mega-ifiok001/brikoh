/**
 * HTTP client implementing the API contract.
 * - Merchant routes: /api/public, /api/dashboard, /api/webhooks
 * - Admin routes: /api/admin — SEPARATE token type (admin access token)
 * - Errors: uniform `{ error: { code, message } }`
 * - Logout sends the refreshToken in the body (contract: POST /auth/logout)
 * - Timestamps: UTC ISO-8601 (server-side)
 */

import {
  getApiBaseUrl, getAccessToken, getRefreshToken, getAdminToken,
  setTokens, clearTokens,
} from "./config";
import { ApiError } from "./types";

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  auth?: boolean; // merchant bearer
  admin?: boolean; // admin bearer
  signal?: AbortSignal;
}

let refreshing: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/public/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) { clearTokens(); return false; }
    const body = await res.json();
    if (body.accessToken && body.refreshToken) {
      setTokens(body.accessToken, body.refreshToken);
      return true;
    }
    clearTokens();
    return false;
  } catch {
    return false;
  }
}

async function rawFetch(path: string, opts: RequestOptions, attempt = 0): Promise<any> {
  const url = `${getApiBaseUrl()}${path}`;
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  if (opts.admin) {
    const token = getAdminToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  } else if (opts.auth) {
    const token = getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method: opts.method ?? "GET",
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    signal: opts.signal,
  });

  let body: any = null;
  const text = await res.text();
  if (text) {
    try { body = JSON.parse(text); } catch { body = null; }
  }

  // Merchant 401 → refresh once then retry (admin tokens are short-lived; no auto-refresh)
  if (res.status === 401 && attempt === 0 && opts.auth && !path.endsWith("/auth/refresh")) {
    refreshing = refreshing ?? refreshAccessToken();
    const ok = await refreshing;
    refreshing = null;
    if (ok) return rawFetch(path, opts, 1);
    throw new ApiError("UNAUTHORIZED", "Session expired — please log in again.", 401);
  }

  if (!res.ok) {
    const err = body?.error;
    throw new ApiError(err?.code ?? "REQUEST_FAILED", err?.message ?? `Request failed (${res.status})`, res.status);
  }

  return body ?? {};
}

export async function isApiReachable(timeoutMs = 4000): Promise<boolean> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(`${getApiBaseUrl()}/api/public/health`, { signal: ctrl.signal });
    clearTimeout(t);
    return res.ok;
  } catch {
    return false;
  }
}

export const api = {
  get: <T>(path: string, opts?: Omit<RequestOptions, "method">) =>
    rawFetch(path, { ...opts, method: "GET" }) as Promise<T>,
  post: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, "method" | "body">) =>
    rawFetch(path, { ...opts, method: "POST", body }) as Promise<T>,
  put: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, "method" | "body">) =>
    rawFetch(path, { ...opts, method: "PUT", body }) as Promise<T>,
  patch: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, "method" | "body">) =>
    rawFetch(path, { ...opts, method: "PATCH", body }) as Promise<T>,
  del: <T>(path: string, opts?: Omit<RequestOptions, "method">) =>
    rawFetch(path, { ...opts, method: "DELETE" }) as Promise<T>,
};

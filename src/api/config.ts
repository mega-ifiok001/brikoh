/**
 * Live API configuration — the app is fully API-driven (no local fallbacks).
 * Merchant and Admin use SEPARATE token stores per the contract (admin tokens
 * are a distinct type, minted with their own secret, never mixed).
 */

export const DEFAULT_API_URL = "https://oja-r4vs.onrender.com";
export const API_BASE_KEY = "oja_api_url";

export const ACCESS_TOKEN_KEY = "oja_access_token";
export const REFRESH_TOKEN_KEY = "oja_refresh_token";
export const ADMIN_ACCESS_TOKEN_KEY = "oja_admin_access_token";

export function getApiBaseUrl(): string {
  try {
    const saved = localStorage.getItem(API_BASE_KEY);
    if (saved && /^https?:\/\//.test(saved)) return saved.replace(/\/+$/, "");
  } catch { /* ignore */ }
  return DEFAULT_API_URL;
}

export function setApiBaseUrl(url: string) {
  localStorage.setItem(API_BASE_KEY, url.replace(/\/+$/, ""));
}

export function getAccessToken(): string | null {
  try { return localStorage.getItem(ACCESS_TOKEN_KEY); } catch { return null; }
}
export function getRefreshToken(): string | null {
  try { return localStorage.getItem(REFRESH_TOKEN_KEY); } catch { return null; }
}
export function setTokens(access: string, refresh: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, access);
  localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
}
export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function getAdminToken(): string | null {
  try { return localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY); } catch { return null; }
}
export function setAdminToken(t: string) {
  localStorage.setItem(ADMIN_ACCESS_TOKEN_KEY, t);
}
export function clearAdminToken() {
  localStorage.removeItem(ADMIN_ACCESS_TOKEN_KEY);
}

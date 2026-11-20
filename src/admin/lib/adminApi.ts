// Brikoh ADMIN API client.
//
// Admin tokens are a SEPARATE token type from the merchant/store bearer:
// they are issued by /api/admin/auth/login, stored under their own keys and
// refreshed through /api/admin/auth/refresh. They never touch `lib/api.ts`'s
// merchant tokens.
//
// Refresh tokens are SINGLE-USE (rotation). Concurrent 401s therefore share
// ONE in-flight refresh promise — otherwise the second call would replay a
// revoked token and the server would kill every session (TOKEN_REUSE_DETECTED).

import { API_BASE, ApiError } from "../../lib/api";

const AT = "brikoh.admin.at";
const RT = "brikoh.admin.rt";
export const ADMIN_SIGNED_OUT_EVENT = "brikoh:admin-signed-out";

const ls = {
  get(k: string): string | null {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set(k: string, v: string) {
    try {
      localStorage.setItem(k, v);
    } catch {
      /* storage unavailable */
    }
  },
  del(k: string) {
    try {
      localStorage.removeItem(k);
    } catch {
      /* noop */
    }
  },
};

export const getAdminToken = () => ls.get(AT);
export const getAdminRefresh = () => ls.get(RT);
export const hasAdminSession = () => !!ls.get(AT) || !!ls.get(RT);
export function setAdminTokens(at?: string | null, rt?: string | null) {
  if (at) ls.set(AT, at);
  if (rt) ls.set(RT, rt);
}
export function clearAdminTokens() {
  ls.del(AT);
  ls.del(RT);
}

export type Params = Record<string, string | number | boolean | null | undefined>;

export function qs(params: Params = {}): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface RawOpts {
  method?: string;
  body?: unknown;
  auth?: boolean;
}

async function raw(
  path: string,
  { method = "GET", body, auth = true }: RawOpts
): Promise<{ status: number; json: any }> {
  const run = async (): Promise<Response> => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 90_000);
    try {
      const headers: Record<string, string> = {};
      if (body !== undefined) headers["Content-Type"] = "application/json";
      if (auth) {
        const at = getAdminToken();
        if (at) headers["Authorization"] = `Bearer ${at}`;
      }
      return await fetch(`${API_BASE}${path}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: ctrl.signal,
      });
    } finally {
      clearTimeout(timer);
    }
  };

  let resp: Response;
  try {
    resp = await run();
  } catch {
    // Only GETs are retried (cold-starting host). A mutation must never be
    // silently replayed.
    if (method !== "GET") {
      throw new ApiError(0, "Can't reach the Brikoh server. Check your connection and try again.", "NETWORK");
    }
    await sleep(2200);
    try {
      resp = await run();
    } catch {
      throw new ApiError(0, "Can't reach the Brikoh server. Check your connection and try again.", "NETWORK");
    }
  }

  const text = await resp.text();
  let json: any = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      /* not json */
    }
  }
  return { status: resp.status, json };
}

function toErr(status: number, json: any): ApiError {
  const e = json?.error;
  const code = (e && typeof e === "object" && e.code) || `HTTP_${status}`;
  let message = (e && typeof e === "object" && e.message) || (typeof e === "string" ? e : "") || "";
  if (!message) {
    message =
      status === 400
        ? "The server couldn't understand that request."
        : status === 401
          ? "Your session expired. Please sign in again."
          : status === 403
            ? "You don't have permission to do that."
            : status === 404
              ? "That resource wasn't found."
              : status === 429
                ? "Too many requests — please slow down."
                : status >= 500
                  ? "The server hit a problem. Please try again."
                  : `Request failed (${status}).`;
  }
  return new ApiError(status, message, code, json);
}

/** Friendly message for an ApiError, keyed on the contract's error codes. */
export function errMsg(e: any, fallback = "Something went wrong. Please try again."): string {
  const code: string | undefined = e?.code;
  const map: Record<string, string> = {
    RATE_LIMITED: "Too many requests — wait a moment and try again.",
    INSUFFICIENT_PERMISSIONS: "Your admin role doesn't include that permission.",
    FORBIDDEN: "You don't have access to that.",
    STORE_NOT_FOUND: "That store no longer exists.",
    ADMIN_EVENT_NOT_FOUND: "No webhook event with that id.",
    ADMIN_NOT_FOUND: "That admin doesn't exist or is inactive.",
    TICKET_CLOSED: "This ticket is closed and can't be changed.",
    INVALID_PLAN: "That plan isn't supported.",
    INVALID_CREDENTIALS: "Wrong email or password.",
    "2FA_INVALID": "That authenticator code is invalid or expired.",
    ACCOUNT_DISABLED: "This admin account has been deactivated.",
    NETWORK: "Can't reach the Brikoh server. Check your connection.",
  };
  if (code && map[code]) return map[code];
  return e?.message || fallback;
}

/* ------------------------------ refresh flow ------------------------------ */

let refreshing: Promise<boolean> | null = null;

async function doRefresh(): Promise<boolean> {
  const rt = getAdminRefresh();
  if (!rt) return false;
  try {
    const { status, json } = await raw("/api/admin/auth/refresh", {
      method: "POST",
      body: { refreshToken: rt },
      auth: false,
    });
    if (status >= 400 || !json?.accessToken) return false;
    setAdminTokens(json.accessToken, json.refreshToken); // rotate: persist the NEW rt
    return true;
  } catch {
    return false;
  }
}

export function refreshAdminSession(): Promise<boolean> {
  if (!refreshing) {
    refreshing = doRefresh().finally(() => {
      refreshing = null;
    });
  }
  return refreshing;
}

const NO_REFRESH = ["/api/admin/auth/login", "/api/admin/auth/refresh", "/api/admin/auth/logout"];

async function core(path: string, opts: RawOpts = {}): Promise<any> {
  const auth = opts.auth !== false;
  for (let attempt = 0; attempt < 2; attempt++) {
    const { status, json } = await raw(path, opts);
    if (status === 401 && auth && !NO_REFRESH.some((p) => path.startsWith(p))) {
      if (attempt === 0 && (await refreshAdminSession())) continue;
      clearAdminTokens();
      window.dispatchEvent(new Event(ADMIN_SIGNED_OUT_EVENT));
      throw new ApiError(401, "Your session expired. Please sign in again.", "UNAUTHORIZED");
    }
    if (status === 204) return null;
    if (status >= 400) throw toErr(status, json);
    return json;
  }
  throw new ApiError(0, "Something went wrong. Please try again.", "RETRY_EXHAUSTED");
}

/* ---------------------- support-ticket route resolution -------------------
   The contract documents the ticket routes as `/tickets…` inside the admin
   route group. Merchant tickets are served under `/api/dashboard/support`, so
   the admin ones may live under `/api/admin/support/tickets` OR
   `/api/admin/tickets`. Pages always call `/api/admin/tickets…`; the first
   call probes both and remembers whichever exists.
   ------------------------------------------------------------------------- */

const TICKET_ROOT = "/api/admin/tickets";
const TICKET_BASES = ["/api/admin/support/tickets", "/api/admin/tickets"];
let ticketBase: string | null = null;

async function ticketRequest(path: string, opts: RawOpts): Promise<any> {
  const suffix = path.slice(TICKET_ROOT.length);
  if (ticketBase) return core(ticketBase + suffix, opts);
  let firstErr: unknown = null;
  for (let i = 0; i < TICKET_BASES.length; i++) {
    const base = TICKET_BASES[i];
    try {
      const r = await core(base + suffix, opts);
      ticketBase = base;
      return r;
    } catch (e: any) {
      if (e instanceof ApiError && e.status === 404 && i < TICKET_BASES.length - 1) {
        firstErr = e;
        continue; // route not found here — try the next base
      }
      if (e instanceof ApiError && e.status !== 404) ticketBase = base; // route exists
      throw i > 0 && e?.status === 404 && firstErr ? firstErr : e;
    }
  }
  throw firstErr;
}

function request(path: string, opts: RawOpts = {}): Promise<any> {
  return path.startsWith(TICKET_ROOT) ? ticketRequest(path, opts) : core(path, opts);
}

export const adminApi = {
  get: <T = any>(path: string, params?: Params): Promise<T> => request(path + qs(params), { method: "GET" }),
  post: <T = any>(path: string, body?: unknown): Promise<T> => request(path, { method: "POST", body: body ?? {} }),
  put: <T = any>(path: string, body?: unknown): Promise<T> => request(path, { method: "PUT", body: body ?? {} }),
  patch: <T = any>(path: string, body?: unknown): Promise<T> => request(path, { method: "PATCH", body: body ?? {} }),
};

/* --------------------------------- auth ---------------------------------- */

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  admin: { id: string; email: string; roleName: string };
}

export async function adminLogin(email: string, password: string, totpToken: string): Promise<LoginResult> {
  const { status, json } = await raw("/api/admin/auth/login", {
    method: "POST",
    body: { email, password, totpToken },
    auth: false,
  });
  if (status >= 400) throw toErr(status, json);
  setAdminTokens(json.accessToken, json.refreshToken);
  return json as LoginResult;
}

export async function adminLogout(): Promise<void> {
  const rt = getAdminRefresh();
  try {
    if (rt) await raw("/api/admin/auth/logout", { method: "POST", body: { refreshToken: rt }, auth: false });
  } catch {
    /* logout is idempotent; clear locally regardless */
  }
  clearAdminTokens();
}
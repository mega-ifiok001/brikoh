// Brikoh API client — talks to the platform backend.
// Handles bearer auth, one-shot refresh on 401, cold-start retries
// (Render free tier sleeps) and normalized error objects.

export const API_BASE = "https://oja-r4vs.onrender.com";

const AT_KEY = "brikoh.at";
const RT_KEY = "brikoh.rt";

export class ApiError extends Error {
  status: number;
  code: string;
  details: any;
  constructor(status: number, message: string, code?: string, details?: any) {
    super(message);
    this.status = status;
    this.code = code || "UNKNOWN";
    this.details = details;
  }
}

export function getAccessToken(): string | null {
  try {
    return localStorage.getItem(AT_KEY);
  } catch {
    return null;
  }
}
export function getRefreshToken(): string | null {
  try {
    return localStorage.getItem(RT_KEY);
  } catch {
    return null;
  }
}
export function setTokens(at: string | null | undefined, rt: string | null | undefined) {
  try {
    if (at) localStorage.setItem(AT_KEY, at);
    if (rt) localStorage.setItem(RT_KEY, rt);
  } catch {
    /* storage unavailable */
  }
}
export function clearTokens() {
  try {
    localStorage.removeItem(AT_KEY);
    localStorage.removeItem(RT_KEY);
  } catch {
    /* noop */
  }
}
export function hasSession(): boolean {
  return !!getAccessToken();
}

// Tokens may arrive under several shapes depending on endpoint.
export function extractTokens(res: any): { at?: string; rt?: string } {
  if (!res || typeof res !== "object") return {};
  const t = res.tokens || res.auth || res.session || {};
  const at =
    res.accessToken ?? t.accessToken ?? res.access_token ?? t.access_token ?? res.at ?? t.at ?? res.token;
  const rt =
    res.refreshToken ?? t.refreshToken ?? res.refresh_token ?? t.refresh_token ?? res.rt ?? t.rt;
  return { at: at || undefined, rt: rt || undefined };
}

let refreshPromise: Promise<boolean> | null = null;

function doRefresh(): Promise<boolean> {
  const rt = getRefreshToken();
  if (!rt) return Promise.resolve(false);
  return fetch(`${API_BASE}/api/public/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: rt }),
  })
    .then(async (r) => {
      let j: any = null;
      try {
        j = await r.json();
      } catch {
        /* no body */
      }
      if (!r.ok) return false;
      const { at, rt: nrt } = extractTokens(j);
      if (!at) return false;
      setTokens(at, nrt ?? getRefreshToken());
      return true;
    })
    .catch(() => false);
}

export function refreshSession(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

interface RawOpts {
  method?: string;
  body?: any;
  auth?: boolean;
}

// One fetch with a generous timeout + a single retry for cold starts /
// transient network errors (the API runs on a free Render instance).
async function rawFetch(
  path: string,
  { method = "GET", body, auth = true }: RawOpts
): Promise<{ status: number; json: any; text: string }> {
  const run = async (): Promise<Response> => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 90_000);
    try {
      const headers: Record<string, string> = {};
      if (body !== undefined) headers["Content-Type"] = "application/json";
      if (auth) {
        const at = getAccessToken();
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
    // network failure or abort — the free instance may be waking up
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
  return { status: resp.status, json, text };
}

function toApiError(status: number, json: any, text: string): ApiError {
  let message = "";
  let code = "";
  if (json) {
    const e = json.error ?? json;
    if (e && typeof e === "object") {
      message = e.message || e.detail || "";
      code = e.code || "";
    } else if (typeof e === "string") {
      message = e;
    }
    if (!message && typeof json.message === "string") message = json.message;
    if (!message && typeof json.error === "string") message = json.error;
    if (!message && code && /^[A-Z_]{4,}$/.test(code)) {
      message = code.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
    }
  }
  if (!message) {
    message =
      status === 0
        ? "Can't reach the Brikoh server."
        : status === 400
          ? "The server couldn't understand that request."
          : status === 401
            ? "Your session expired. Please sign in again."
            : status === 403
              ? "You don't have permission to do that."
              : status === 404
                ? "That resource wasn't found."
                : status >= 500
                  ? "The server hit a problem. Please try again."
                  : `Request failed (${status}).`;
  }
  return new ApiError(status, message, code || "HTTP_" + status, json ?? text);
}

async function request(path: string, opts: RawOpts = {}): Promise<any> {
  const auth = opts.auth !== false;
  for (let attempt = 0; attempt < 2; attempt++) {
    const { status, json } = await rawFetch(path, opts);

    if (
      status === 401 &&
      auth &&
      getAccessToken() &&
      !path.startsWith("/api/public/auth/")
    ) {
      const ok = await refreshSession();
      if (ok) continue; // retry with the fresh token
      clearTokens();
      window.dispatchEvent(new Event("brikoh:signed-out"));
      if (!location.hash.startsWith("#/auth") && !location.hash.startsWith("#/verify")) {
        location.hash = "#/auth";
      }
      throw new ApiError(401, "Your session expired. Please sign in again.", "UNAUTHENTICATED");
    }

    if (status === 204) return null;

    if (status >= 400) {
      const text = "";
      throw toApiError(status, json, text);
    }
    return json ?? null;
  }
  throw new ApiError(0, "Something went wrong. Please try again.", "RETRY_EXHAUSTED");
}

export const api = {
  get: (path: string) => request(path, { method: "GET" }),
  post: (path: string, body?: any) => request(path, { method: "POST", body: body ?? {} }),
  put: (path: string, body?: any) => request(path, { method: "PUT", body: body ?? {} }),
  patch: (path: string, body?: any) => request(path, { method: "PATCH", body: body ?? {} }),
  del: (path: string) => request(path, { method: "DELETE" }),
  publicGet: (path: string) => request(path, { method: "GET", auth: false }),
  publicPost: (path: string, body?: any) => request(path, { method: "POST", body: body ?? {}, auth: false }),

  // Some dashboard routes are versioned a different way; probe a list of
  // candidates and stop at the first that isn't a 404/405.
  async tryRoutes(routes: string[], method: string, body?: any): Promise<any> {
    let last: ApiError | null = null;
    for (const r of routes) {
      try {
        return await request(r, { method, body: body ?? {} });
      } catch (e: any) {
        last = e;
        if (e?.status !== 404 && e?.status !== 405) throw e;
      }
    }
    throw last ?? new ApiError(404, "Endpoint not found on the server.", "NOT_FOUND");
  },
};

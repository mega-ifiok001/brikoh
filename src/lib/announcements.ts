// Dashboard announcements — typed client for the route group (contract says
// "dashboard", served under /api/dashboard/announcements). Auth: bearer + store.
//   GET  /api/dashboard/announcements
//   POST /api/dashboard/announcements/:announcementId/view
//
// GET returns all *active, published* announcements targeted at every tier or
// the store's resolved tier (a store with no subscription resolves to STARTER).
// POST /view records one idempotent view for the tenant; it resolves on 204 and
// a draft, an inactive announcement, or one aimed at another tier comes back
// 404 ANNOUNCEMENT_NOT_FOUND (surfaced as an ApiError with code on the caller).
//
// The backend is the source of truth. These types + helpers are a thin,
// defensive wrapper over the shared `api` client (bearer auth, 401 refresh,
// normalized ApiError with `status`/`code`). Field access funnels through
// pick/asList because server naming varies between modules.

import { api } from "./api";
import { asList, pick } from "./format";

/**
 * targetTier values: "EVERY"/"ALL" means the announcement is broadcast to every
 * tier; otherwise it's a concrete plan tier the store's resolved tier must match.
 */
export type AnnouncementTier =
  | "EVERY"
  | "ALL"
  | "STARTER"
  | "PRO"
  | "ENTERPRISE"
  | (string & {});

export interface Announcement {
  id: string;
  title: string;
  body: string;
  /** "EVERY"/"ALL" or a specific plan tier (STARTER | PRO | ENTERPRISE). */
  targetTier: string;
  /** UTC ISO-8601 timestamp. */
  publishedAt: string | null;
  /** UTC ISO-8601 timestamp. */
  createdAt: string | null;
}

export interface AnnouncementList {
  items: Announcement[];
  /** Loose paging flag — future-proofing, the contract lists every match already. */
  hasMore: boolean;
}

export function isEveryTier(tier: string): boolean {
  return tier === "EVERY" || tier === "ALL";
}

function normalizeAnnouncement(v: any): Announcement | null {
  if (!v || typeof v !== "object") return null;
  const a = v.announcement ?? v;
  const id = String(pick(a, ["id", "announcementId"]) ?? "");
  if (!id) return null;
  return {
    id,
    title: pick<string>(a, ["title", "heading", "subject", "name"]) ?? "",
    body: pick<string>(a, ["body", "content", "message", "text"]) ?? "",
    targetTier: pick<string>(a, ["targetTier", "target_tier", "tier"]) ?? "EVERY",
    publishedAt: pick<string | null>(a, ["publishedAt", "published_at"]) ?? null,
    createdAt: pick<string | null>(a, ["createdAt", "created_at"]) ?? null,
  };
}

/**
 * GET /api/dashboard/announcements — all active, published announcements
 * targeted at every tier or the store's resolved tier. Throws ApiError on any
 * non-2xx (401 is handled by the shared client's one-shot refresh).
 */
export async function listAnnouncements(): Promise<AnnouncementList> {
  const res: any = await api.get("/api/dashboard/announcements");
  return {
    items: asList(res, "items", "announcements", "data")
      .map(normalizeAnnouncement)
      .filter(Boolean) as Announcement[],
    hasMore: !!pick(res, ["hasMore", "has_next", "nextCursor"]),
  };
}

/**
 * POST /api/dashboard/announcements/:id/view — records one idempotent view for
 * the tenant. Resolves on 204. Rejects with an ApiError (code
 * ANNOUNCEMENT_NOT_FOUND) for drafts, inactive announcements and ones targeted
 * to a different tier.
 */
export async function markAnnouncementViewed(id: string): Promise<void> {
  await api.post(`/api/dashboard/announcements/${encodeURIComponent(id)}/view`);
}
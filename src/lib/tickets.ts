// Dashboard support tickets — typed client for the route group (contract says
// "dashboard", served under /api/dashboard/support):
//   POST   /api/dashboard/support/tickets
//   GET    /api/dashboard/support/tickets
//   GET    /api/dashboard/support/tickets/:ticketId
//   POST   /api/dashboard/support/tickets/:ticketId/messages
//
// The backend is the source of truth. These types + helpers are just a thin,
// defensive wrapper over the shared `api` client (bearer auth, 401 refresh,
// normalized ApiError with `status`/`code`). Field access funnels through
// pick/asList because server naming varies between modules.

import { api } from "./api";
import { asList, pick } from "./format";

// The dashboard "support tickets" route group lives under /api/dashboard/support.
const TICKETS_BASE = "/api/dashboard/support/tickets";

export type TicketStatus =
  | "OPEN"
  | "PENDING"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "CLOSED";

export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type AuthorType = "MERCHANT" | "ADMIN" | "SYSTEM";

export interface AssignedAdmin {
  id: string;
  name: string | null;
  email: string | null;
}

/**
 * "Safe typed-author projection" — endpoint-specific shape. We keep it loose
 * enough to tolerate firstName/lastName split vs a single `name`.
 */
export interface AuthorSummary {
  id?: string | null;
  name?: string | null;
  email?: string | null;
  type?: AuthorType | string | null;
}

export interface TicketMessage {
  id: string;
  body: string;
  author: AuthorSummary;
  /** UTC ISO timestamp. */
  createdAt: string | null;
}

export interface Ticket {
  id: string;
  subject: string;
  priority: TicketPriority | string;
  status: TicketStatus | string;
  assignedAdmin: AssignedAdmin | null;
  createdAt: string | null;
  updatedAt: string | null;
  /** Lifecycle timestamps (opened / first response / closed, UTC). */
  openedAt: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  lastMessageAt: string | null;
  storeId?: string | null;
}

export interface TicketPage {
  items: Ticket[];
  nextCursor: string | null;
}

export interface TicketDetail {
  ticket: Ticket;
  messages: TicketMessage[];
  nextCursor: string | null;
}

export interface TicketListParams {
  status?: TicketStatus | string;
  priority?: TicketPriority | string;
  cursor?: string | null;
  limit?: number;
}

export interface CreateTicketInput {
  subject: string;
  priority: TicketPriority;
  /** First MERCHANT message body. */
  message: string;
}
function normalizeAdmin(v: any): AssignedAdmin | null {
  if (!v || typeof v !== "object") return null;
  return {
    id: String(pick(v, ["id", "adminId"]) ?? ""),
    name: pick<string | null>(v, ["name", "fullName", "displayName"]) ?? "",
    email: pick<string | null>(v, ["email"]) ?? null,
  };
}

function normalizeAuthor(v: any): AuthorSummary {
  if (!v || typeof v !== "object") {
    return { id: null, name: null, email: null, type: null };
  }
  const name =
    pick<string>(v, ["name"]) ??
    (() => {
      const f = pick<string>(v, ["firstName", "first_name"]);
      const l = pick<string>(v, ["lastName", "last_name"]);
      return [f, l].filter(Boolean).join(" ") || null;
    })();
  return {
    id: pick<string | null>(v, ["id", "userId", "authorId"]) ?? null,
    name: name ?? null,
    email: pick<string | null>(v, ["email"]) ?? null,
    type:
      pick<AuthorType | string | null>(v, ["type", "kind", "role", "actorType"]) ??
      null,
  };
}

function normalizeMessage(v: any): TicketMessage | null {
  if (!v || typeof v !== "object" || !v.id) return null;
  return {
    id: String(v.id),
    body: pick<string>(v, ["body", "content", "text"]) ?? "",
    author: normalizeAuthor(pick(v, ["author", "sender", "from", "merchant"])),
    createdAt:
      pick<string | null>(v, ["createdAt", "sentAt", "timestamp", "created_at"]) ??
      null,
  };
}

function normalizeTicket(v: any): Ticket | null {
  if (!v || typeof v !== "object" || !v.id) return null;
  const t = v.ticket ?? v;
  return {
    id: String(t.id),
    subject: pick<string>(t, ["subject", "title", "topic"]) ?? "",
    priority: pick<string>(t, ["priority"]) ?? "MEDIUM",
    status: pick<string>(t, ["status", "state"]) ?? "OPEN",
    assignedAdmin:
      normalizeAdmin(pick(t, ["assignedAdmin", "assignee", "assignedTo", "admin"])) ??
      (t.assignedAdminId
        ? { id: String(t.assignedAdminId), name: null, email: null }
        : null),
    createdAt: pick<string | null>(t, ["createdAt", "created_at"]) ?? null,
    updatedAt: pick<string | null>(t, ["updatedAt", "updated_at"]) ?? null,
    openedAt: pick<string | null>(t, ["openedAt", "opened_at"]) ?? null,
    resolvedAt: pick<string | null>(t, ["resolvedAt", "resolved_at"]) ?? null,
    closedAt: pick<string | null>(t, ["closedAt", "closed_at"]) ?? null,
    lastMessageAt:
      pick<string | null>(t, [
        "lastMessageAt",
        "last_message_at",
        "lastActivityAt",
      ]) ?? null,
    storeId: pick<string | null>(t, ["storeId", "store_id"]) ?? null,
  };
}

function nextCursorOf(res: any): string | null {
  const c = pick<string | null>(res, ["nextCursor", "next", "after"]);
  if (c) return c;
  return pick(res, ["hasMore", "has_next"])
    ? (pick(res, ["cursor", "endCursor"]) ?? null)
    : null;
}

/** POST /tickets — creates an OPEN ticket plus its first merchant message. */
export async function createTicket(input: CreateTicketInput): Promise<Ticket> {
  const res: any = await api.post(TICKETS_BASE, {
    subject: input.subject,
    priority: input.priority,
    message: input.message,
  });
  const t = normalizeTicket(res?.ticket ?? res);
  if (!t)
    throw new Error(
      "The ticket was created but the server returned an unrecognised shape."
    );
  return t;
}

/** GET /tickets — lists only the authenticated store's tickets. */
export async function listTickets(
  params: TicketListParams = {}
): Promise<TicketPage> {
  const qs = new URLSearchParams();
  if (params.status) qs.set("status", params.status);
  if (params.priority) qs.set("priority", params.priority);
  if (params.cursor) qs.set("cursor", params.cursor);
  qs.set("limit", String(params.limit ?? 20));

  const res: any = await api.get(`${TICKETS_BASE}?${qs.toString()}`);
  return {
    items: asList(res, "items", "tickets", "data")
      .map(normalizeTicket)
      .filter(Boolean) as Ticket[],
    nextCursor: nextCursorOf(res),
  };
}

/** GET /tickets/:ticketId — ticket + chronological cursor-paginated messages. */
export async function getTicket(ticketId: string): Promise<TicketDetail> {
  const res: any = await api.get(
    `${TICKETS_BASE}/${encodeURIComponent(ticketId)}`
  );
  const t = normalizeTicket(res?.ticket ?? res);
  if (!t) throw new Error("Couldn't load that ticket.");
  const messages = (res?.messages ?? res?.items ?? [])
    .map(normalizeMessage)
    .filter(Boolean) as TicketMessage[];
  return { ticket: t, messages, nextCursor: nextCursorOf(res) };
}

/** POST /tickets/:ticketId/messages — adds a merchant message. */
export async function addTicketMessage(
  ticketId: string,
  body: string
): Promise<TicketMessage> {
  const res: any = await api.post(
    `${TICKETS_BASE}/${encodeURIComponent(ticketId)}/messages`,
    { body }
  );
  const m = normalizeMessage(res?.message ?? res?.userMessage ?? res);
  if (!m) throw new Error("Message sent but the server returned an unexpected shape.");
  return m;
}
// Defensive normalizers for admin support tickets. The contract fixes the
// endpoints and status codes but not every field name, so reads go through
// these helpers (same approach as the merchant-side lib/tickets.ts).

export const TICKET_STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const;
export const TICKET_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

export interface NTicket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  storeId: string | null;
  storeName: string | null;
  assigneeId: string | null;
  assigneeLabel: string | null;
  createdAt: string | null;
  lastMessageAt: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
}

export function normTicket(t: any): NTicket {
  const store = t?.store ?? {};
  const a = t?.assignedAdmin ?? t?.assignee ?? null;
  return {
    id: String(t?.id ?? ""),
    subject: t?.subject ?? "(no subject)",
    status: String(t?.status ?? "").toUpperCase(),
    priority: String(t?.priority ?? "").toUpperCase(),
    storeId: store.id ?? t?.storeId ?? null,
    storeName: store.name ?? t?.storeName ?? null,
    assigneeId: a?.id ?? t?.assignedAdminId ?? null,
    assigneeLabel: a ? (a.email ?? a.name ?? a.id ?? null) : (t?.assignedAdminEmail ?? null),
    createdAt: t?.createdAt ?? null,
    lastMessageAt: t?.lastMessageAt ?? t?.updatedAt ?? t?.createdAt ?? null,
    resolvedAt: t?.resolvedAt ?? null,
    closedAt: t?.closedAt ?? null,
  };
}

export interface NMessage {
  id: string;
  body: string;
  authorType: string; // MERCHANT | ADMIN | SYSTEM
  authorName: string;
  createdAt: string | null;
}

export function normMessage(m: any): NMessage {
  const a = m?.author ?? {};
  const full = [a.firstName, a.lastName].filter(Boolean).join(" ");
  return {
    id: String(m?.id ?? Math.random()),
    body: String(m?.body ?? ""),
    authorType: String(a.type ?? m?.authorType ?? m?.senderType ?? "").toUpperCase(),
    authorName: a.name ?? (full || a.email) ?? m?.authorName ?? "",
    createdAt: m?.createdAt ?? null,
  };
}
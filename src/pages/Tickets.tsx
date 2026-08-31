import { useCallback, useEffect, useState } from "react";
import { cls, fdt, initialsOf, titleCase } from "../lib/format";
import {
  addTicketMessage,
  createTicket,
  getTicket,
  listTickets,
  type Ticket,
  type TicketMessage,
  type TicketPriority,
  type TicketStatus,
} from "../lib/tickets";
import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  Field,
  Icon,
  Input,
  LoadMore,
  Modal,
  PageHead,
  Select,
  StatusBadge,
  Textarea,
  toast,
} from "../components/ui";

const STATUSES: Array<"ALL" | TicketStatus> = [
  "ALL",
  "OPEN",
  "PENDING",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
];

const PRIORITIES: Array<"ALL" | TicketPriority> = [
  "ALL",
  "LOW",
  "MEDIUM",
  "HIGH",
  "URGENT",
];

const PRIORITY_TONE: Record<string, "neutral" | "brand" | "gold" | "danger"> = {
  LOW: "neutral",
  MEDIUM: "brand",
  HIGH: "gold",
  URGENT: "danger",
};

const CLOSED = "CLOSED";

function isClosed(t: Ticket): boolean {
  return String(t.status ?? "").toUpperCase() === CLOSED;
}

function authorName(m: TicketMessage): string {
  const name = m.author?.name?.trim();
  if (name) return name;
  if (m.author?.type) return titleCase(m.author.type);
  return "Support";
}

function isMerchant(m: TicketMessage): boolean {
  const t = String(m.author?.type ?? "").toUpperCase();
  return t === "MERCHANT";
}

export default function Tickets() {
  const [items, setItems] = useState<Ticket[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [status, setStatus] = useState<"ALL" | TicketStatus>("ALL");
  const [priority, setPriority] = useState<"ALL" | TicketPriority>("ALL");

  // New ticket modal.
  const [newOpen, setNewOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [ticketPriority, setTicketPriority] = useState<TicketPriority>("MEDIUM");
  const [message, setMessage] = useState("");
  const [createBusy, setCreateBusy] = useState(false);

  // Detail modal.
  const [detail, setDetail] = useState<Ticket | null>(null);
  const [detailBusy, setDetailBusy] = useState(false);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [msgCursor, setMsgCursor] = useState<string | null>(null);
  const [msgLoadingMore, setMsgLoadingMore] = useState(false);
  const [reply, setReply] = useState("");
  const [replyBusy, setReplyBusy] = useState(false);

  const load = useCallback(
    async (cursor?: string | null) => {
      if (!cursor) setLoading(true);
      else setLoadingMore(true);
      setError(null);
      try {
        const page = await listTickets({
          status: status === "ALL" ? undefined : status,
          priority: priority === "ALL" ? undefined : priority,
          cursor: cursor ?? undefined,
          limit: 20,
        });
        setItems((prev) => (cursor ? [...prev, ...page.items] : page.items));
        setNextCursor(page.nextCursor);
      } catch (e: any) {
        setError(e?.message || "Couldn't load support tickets.");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [status, priority]
  );

  useEffect(() => {
    load();
  }, [load]);

  const detailClosed = detail ? isClosed(detail) : true;

  const openDetail = async (t: Ticket) => {
    setDetail(t);
    setMessages([]);
    setReply("");
    setMsgCursor(null);
    setDetailBusy(true);
    try {
      const d = await getTicket(t.id);
      setDetail(d.ticket);
      setMessages(d.messages);
      setMsgCursor(d.nextCursor);
    } catch (e: any) {
      if (e?.status === 404) {
        toast.error("That ticket no longer exists.");
        setDetail(null);
      } else {
        toast.error(e?.message || "Couldn't open that ticket.");
      }
    } finally {
      setDetailBusy(false);
    }
  };

  const loadOlderMessages = async () => {
    if (!detail || !msgCursor) return;
    setMsgLoadingMore(true);
    try {
      const d = await getTicket(detail.id);
      // Prepend older messages while keeping current ones.
      setMessages((prev) => {
        const merged = [...d.messages, ...prev];
        const seen = new Set<string>();
        return merged.filter((m) => {
          if (seen.has(m.id)) return false;
          seen.add(m.id);
          return true;
        });
      });
      setMsgCursor(d.nextCursor);
    } catch (e: any) {
      toast.error(e?.message || "Couldn't load more messages.");
    } finally {
      setMsgLoadingMore(false);
    }
  };

  const submitCreate = async () => {
    if (!subject.trim()) {
      toast.error("Give the ticket a subject.");
      return;
    }
    if (!message.trim()) {
      toast.error("Add a message so support knows what's going on.");
      return;
    }
    setCreateBusy(true);
    try {
      const t = await createTicket({
        subject: subject.trim(),
        priority: ticketPriority,
        message: message.trim(),
      });
      toast.success("Ticket created.");
      setNewOpen(false);
      setSubject("");
      setMessage("");
      setTicketPriority("MEDIUM");
      await load();
      if (status === "ALL") await openDetail(t);
    } catch (e: any) {
      toast.error(e?.message || "Couldn't create the ticket.");
    } finally {
      setCreateBusy(false);
    }
  };

  const submitReply = async () => {
    if (!detail || !reply.trim()) return;
    setReplyBusy(true);
    try {
      const m = await addTicketMessage(detail.id, reply.trim());
      if (m) setMessages((prev) => [...prev, m]);
      setReply("");
      toast.success("Message sent.");
      try {
        const d = await getTicket(detail.id);
        setDetail(d.ticket);
      } catch {
        /* non-fatal */
      }
    } catch (e: any) {
      if (e?.code === "TICKET_CLOSED") {
        toast.error("This ticket is closed, so you can't reply to it.");
        try {
          const d = await getTicket(detail.id);
          setDetail(d.ticket);
          setMsgCursor(d.nextCursor);
        } catch {
          /* ignore */
        }
      } else {
        toast.error(e?.message || "Couldn't send that message.");
      }
    } finally {
      setReplyBusy(false);
    }
  };

  return (
    <div>
      <PageHead
        title="Support tickets"
        sub="Conversations with the Brikoh support team."
      >
        <Button icon="plus" onClick={() => setNewOpen(true)}>
          New ticket
        </Button>
      </PageHead>

      {/* Filters */}
      <div className="mb-4 space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {STATUSES.map((s) => (
            <button
              key={s}
              className={cls("chip", status === s && "chip-on")}
              onClick={() => setStatus(s)}
            >
              {s === "ALL" ? "All statuses" : titleCase(s)}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PRIORITIES.map((p) => (
            <button
              key={p}
              className={cls("chip", priority === p && "chip-on")}
              onClick={() => setPriority(p)}
            >
              {p === "ALL" ? "All priorities" : titleCase(p)}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-14" />
          ))}
        </div>
      ) : error ? (
        <div className="card">
          <ErrorState message={error} onRetry={() => load()} />
        </div>
      ) : items.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="lifebuoy"
            title="No tickets found"
            hint="Questions you send to Brikoh support will show up here."
            action={
              <Button icon="plus" onClick={() => setNewOpen(true)}>
                Open a ticket
              </Button>
            }
          />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto scrollbar-slim">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Assigned to</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {items.map((t) => (
                  <tr
                    key={t.id}
                    className="cursor-pointer"
                    onClick={() => openDetail(t)}
                  >
                    <td>
                      <div className="max-w-[240px]">
                        <p className="truncate font-bold">
                          {t.subject || "Untitled"}
                        </p>
                        <p className="text-xs text-ink-400 tabular-nums">
                          {t.id}
                        </p>
                      </div>
                    </td>
                    <td>
                      <Badge tone={PRIORITY_TONE[t.priority] || "neutral"}>
                        {titleCase(t.priority)}
                      </Badge>
                    </td>
                    <td>
                      <StatusBadge status={t.status} />
                    </td>
                    <td>
                      {t.assignedAdmin?.name ||
                        t.assignedAdmin?.email ||
                        (isClosed(t) ? "—" : "Unassigned")}
                    </td>
                    <td className="whitespace-nowrap text-ink-500">
                      {fdt(t.updatedAt ?? t.lastMessageAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <LoadMore
            hasMore={!!nextCursor}
            loading={loadingMore}
            onClick={() => load(nextCursor)}
          />
        </div>
      )}

      {/* New ticket modal */}
      <Modal
        open={newOpen}
        onClose={() => setNewOpen(false)}
        title="New support ticket"
        sub="We'll reply here and keep you posted."
      >
        <div className="space-y-4">
          <Field label="Subject">
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="What's going on?"
            />
          </Field>
          <Field label="Priority">
            <Select
              value={ticketPriority}
              onChange={(e) =>
                setTicketPriority(e.target.value as TicketPriority)
              }
            >
              {PRIORITIES.filter((p) => p !== "ALL").map((p) => (
                <option key={p} value={p}>
                  {titleCase(p)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Message">
            <Textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe the issue in as much detail as you can…"
            />
          </Field>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setNewOpen(false)}>
            Cancel
          </Button>
          <Button loading={createBusy} onClick={submitCreate}>
            Create ticket
          </Button>
        </div>
      </Modal>

      {/* Detail modal */}
      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail?.subject || "Ticket"}
        sub={
          detail ? (
            <span className="inline-flex flex-wrap items-center gap-2">
              <span className="tabular-nums">{detail.id}</span>
              <StatusBadge status={detail.status} />
              <Badge tone={PRIORITY_TONE[detail.priority] || "neutral"}>
                {detail.priority ? titleCase(detail.priority) : "Priority"}
              </Badge>
            </span>
          ) : undefined
        }
        wide
      >
        {detailBusy ? (
          <div className="flex items-center justify-center py-16">
            <Icon name="clock" size={22} className="animate-spin text-brand-500" />
          </div>
        ) : detail ? (
          <div>
{!detailClosed && (
              <div className="mb-4 rounded-xl border border-cream-200 bg-cream-50 px-4 py-3 text-sm">
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-ink-500">
                  <span>
                    Assigned to:{" "}
                    <b className="text-ink-800">
                      {detail.assignedAdmin?.name ||
                        detail.assignedAdmin?.email ||
                        "Unassigned"}
                    </b>
                  </span>
                  {detail.lastMessageAt && (
                    <span>
                      Last activity:{" "}
                      <b className="text-ink-800">{fdt(detail.lastMessageAt)}</b>
                    </span>
                  )}
                </div>
              </div>
            )}

            {messages.length === 0 ? (
              <p className="rounded-xl border border-dashed border-cream-200 px-4 py-8 text-center text-sm text-ink-400">
                No messages yet.
              </p>
            ) : (
              <div className="space-y-3">
                <LoadMore
                  hasMore={!!msgCursor}
                  loading={msgLoadingMore}
                  onClick={loadOlderMessages}
                />
                {messages.map((m) => {
                  const mine = isMerchant(m);
                  return (
                    <div
                      key={m.id}
                      className={cls(
                        "flex flex-col gap-1",
                        mine ? "items-end" : "items-start"
                      )}
                    >
                      <div
                        className={cls(
                          "flex items-center gap-2 text-xs font-semibold text-ink-400",
                          mine && "flex-row-reverse"
                        )}
                      >
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-[9px] font-extrabold text-white">
                          {initialsOf(authorName(m))}
                        </span>
                        <span>
                          {authorName(m)}
                          {m.author?.type && (
                            <span className="text-ink-300">
                              {" · "}
                              {titleCase(m.author.type)}
                            </span>
                          )}
                        </span>
                      </div>
                      <div
                        className={cls(
                          "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm",
                          mine
                            ? "rounded-br-sm bg-brand-500 text-white"
                            : "rounded-bl-sm border border-cream-200 bg-white text-ink-800"
                        )}
                      >
                        {m.body}
                      </div>
                      <span className="text-[11px] text-ink-300">
                        {fdt(m.createdAt)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {detailClosed ? (
              <div className="mt-5 flex items-center gap-2 rounded-xl border border-dashed border-cream-300 px-4 py-3 text-sm text-ink-400">
                <Icon name="info" size={15} />
                This ticket is closed. Open a new one for follow-ups.
              </div>
            ) : (
              <div className="mt-5 border-t border-cream-200 pt-4">
                <Field label="Reply">
                  <Textarea
                    rows={3}
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Write a reply to support…"
                  />
                </Field>
                <div className="mt-2 flex justify-end">
                  <Button
                    icon="send"
                    loading={replyBusy}
                    disabled={!reply.trim()}
                    onClick={submitReply}
                  >
                    Send
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
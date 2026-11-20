import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button, Confirm, Icon, KV, LoadMore, PageHead, Select, Textarea, toast } from "../../components/ui";
import { cls, fdt, titleCase } from "../../lib/format";
import { ListShell, Panel, Pill } from "../components/bits";
import { useAdmin } from "../AdminContext";
import { adminApi, errMsg } from "../lib/adminApi";
import { normMessage, normTicket, TICKET_STATUSES, type NMessage } from "../lib/tickets";

export default function TicketDetail() {
  const { ticketId } = useParams();
  const { p, can, me } = useAdmin();
  const canManage = can("admin:support.tickets.manage");

  const [ticket, setTicket] = useState<ReturnType<typeof normTicket> | null>(null);
  const [store, setStore] = useState<any>(null);
  const [msgs, setMsgs] = useState<NMessage[]>([]);
  const [next, setNext] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [moreBusy, setMoreBusy] = useState(false);
  const [error, setError] = useState("");

  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [admins, setAdmins] = useState<{ id: string; email: string }[]>([]);
  const [closeAsk, setCloseAsk] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(
    async (cursor?: string | null) => {
      if (!ticketId) return;
      cursor ? setMoreBusy(true) : (setLoading(true), setError(""));
      try {
        const q = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
        const res: any = await adminApi.get(`/api/admin/tickets/${ticketId}${q}`);
        const raw = res?.messages;
        const list: any[] = Array.isArray(raw) ? raw : (raw?.items ?? []);
        const got = list.map(normMessage);
        if (!cursor) {
          setTicket(normTicket(res?.ticket ?? res));
          setStore(res?.store ?? res?.ticket?.store ?? null);
        }
        setMsgs((prev) => {
          const merged = cursor ? [...prev, ...got] : got;
          const seen = new Set<string>();
          return merged.filter((m) => (seen.has(m.id) ? false : (seen.add(m.id), true)));
        });
        setNext(res?.nextCursor ?? raw?.nextCursor ?? null);
      } catch (e) {
        if (!cursor) setError(errMsg(e));
        else toast.error(errMsg(e));
      } finally {
        setLoading(false);
        setMoreBusy(false);
      }
    },
    [ticketId]
  );

  useEffect(() => {
    load();
  }, [load]);

  // Admin picker is only available to SUPER_ADMIN (the staff list is SUPER-only).
  useEffect(() => {
    if (!canManage || !can("admin:staff.view")) return;
    adminApi
      .get<{ items: any[] }>("/api/admin/staff")
      .then((r) => setAdmins((r.items ?? []).filter((a) => a.isActive).map((a) => ({ id: a.id, email: a.email }))))
      .catch(() => {});
  }, [canManage, can]);

  const sorted = useMemo(
    () => [...msgs].sort((a, b) => new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime()),
    [msgs]
  );
  const closed = ticket?.status === "CLOSED";

  async function act(fn: () => Promise<unknown>, ok: string) {
    setBusy(true);
    try {
      await fn();
      toast.success(ok);
      await load();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  }

  const setStatus = (status: string) =>
    act(() => adminApi.patch(`/api/admin/tickets/${ticketId}/status`, { status }), `Marked ${titleCase(status)}`);
  const assign = (adminId: string | null) =>
    act(
      () => adminApi.post(`/api/admin/tickets/${ticketId}/assign`, { adminId }),
      adminId ? "Ticket assigned" : "Ticket unassigned"
    );

  async function send() {
    const text = body.trim();
    if (!text) return;
    setSending(true);
    try {
      await adminApi.post(`/api/admin/tickets/${ticketId}/messages`, { body: text });
      setBody("");
      toast.success("Reply sent — the owner is emailed (best effort).");
      await load();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <Link to={p("/tickets")} className="mb-3 inline-flex items-center gap-1 text-sm font-bold text-ink-400 hover:text-ink-800">
        <Icon name="chevronLeft" size={15} /> Tickets
      </Link>

      <ListShell loading={loading} error={error} onRetry={() => load()} count={ticket ? 1 : 0}>
        {ticket && (
          <>
            <PageHead title={ticket.subject} sub={`Opened ${fdt(ticket.createdAt)}`}>
              <Pill value={ticket.priority} />
              <Pill value={ticket.status} />
            </PageHead>

            <div className="grid gap-5 lg:grid-cols-3">
              <div className="space-y-4 lg:col-span-2">
                <div className="card space-y-3 p-4">
                  {sorted.length === 0 && <p className="py-6 text-center text-sm text-ink-400">No messages yet.</p>}
                  {sorted.map((m) => {
                    const admin = m.authorType === "ADMIN";
                    const system = m.authorType === "SYSTEM";
                    return (
                      <div key={m.id} className={cls("flex", admin ? "justify-end" : "justify-start")}>
                        <div
                          className={cls(
                            "max-w-[88%] rounded-2xl px-3.5 py-2.5",
                            system
                              ? "mx-auto bg-cream-100 text-center text-ink-500"
                              : admin
                                ? "bg-ink-900 text-cream-50"
                                : "border border-cream-200 bg-cream-50"
                          )}
                        >
                          {!system && (
                            <p
                              className={cls(
                                "mb-0.5 text-[11px] font-bold uppercase tracking-wide",
                                admin ? "text-brand-300" : "text-ink-400"
                              )}
                            >
                              {m.authorName || titleCase(m.authorType) || "Unknown"} · {fdt(m.createdAt)}
                            </p>
                          )}
                          <p className="whitespace-pre-wrap text-sm leading-relaxed">{m.body}</p>
                        </div>
                      </div>
                    );
                  })}
                  <LoadMore hasMore={!!next} loading={moreBusy} onClick={() => load(next)} />
                </div>

                {canManage &&
                  (closed ? (
                    <p className="rounded-xl border border-cream-200 bg-white p-3 text-sm font-semibold text-ink-500">
                      This ticket is closed. Closed tickets are terminal and can't be replied to.
                    </p>
                  ) : (
                    <div className="card p-4">
                      <Textarea
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        placeholder="Write a reply to the merchant…"
                        rows={4}
                      />
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <p className="text-xs text-ink-400">The store owner receives an email notification.</p>
                        <Button icon="send" loading={sending} disabled={!body.trim()} onClick={send}>
                          Send reply
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>

              <div className="space-y-5">
                {canManage && (
                  <Panel title="Manage">
                    <div className="space-y-3">
                      <div>
                        <p className="lbl">Status</p>
                        <Select
                          value={ticket.status}
                          disabled={busy || closed}
                          onChange={(e) => (e.target.value === "CLOSED" ? setCloseAsk(true) : setStatus(e.target.value))}
                        >
                          {TICKET_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {titleCase(s)}
                            </option>
                          ))}
                        </Select>
                      </div>
                      <div>
                        <p className="lbl">Assignee</p>
                        {admins.length > 0 ? (
                          <Select
                            value={ticket.assigneeId ?? ""}
                            disabled={busy || closed}
                            onChange={(e) => assign(e.target.value || null)}
                          >
                            <option value="">Unassigned</option>
                            {admins.map((a) => (
                              <option key={a.id} value={a.id}>
                                {a.email}
                                {a.id === me?.id ? " (me)" : ""}
                              </option>
                            ))}
                          </Select>
                        ) : (
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold text-ink-700">
                              {ticket.assigneeLabel ?? "Unassigned"}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={busy || closed || ticket.assigneeId === me?.id}
                              onClick={() => me && assign(me.id)}
                            >
                              Assign to me
                            </Button>
                            {ticket.assigneeId && (
                              <Button size="sm" variant="ghost" disabled={busy || closed} onClick={() => assign(null)}>
                                Unassign
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </Panel>
                )}

                <Panel title="Details">
                  <div className="-my-2 divide-y divide-cream-100">
                    <KV label="Store" value={store?.name ?? ticket.storeName ?? "—"} />
                    {store?.ownerEmail && <KV label="Owner" value={store.ownerEmail} />}
                    {store?.tier && <KV label="Plan" value={<Pill value={store.tier} />} />}
                    <KV label="Resolved" value={fdt(ticket.resolvedAt)} />
                    <KV label="Closed" value={fdt(ticket.closedAt)} />
                  </div>
                  {(store?.id ?? ticket.storeId) && can("stores:view") && (
                    <Link
                      to={p(`/stores/${store?.id ?? ticket.storeId}`)}
                      className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-brand-700 hover:underline"
                    >
                      Open store <Icon name="arrowRight" size={14} />
                    </Link>
                  )}
                </Panel>
              </div>
            </div>
          </>
        )}
      </ListShell>

      <Confirm
        open={closeAsk}
        onClose={() => setCloseAsk(false)}
        loading={busy}
        title="Close this ticket?"
        confirmLabel="Close ticket"
        body="Closed tickets are terminal: they can't be reopened, replied to, or reassigned. Use Resolved if the merchant might follow up."
        onConfirm={async () => {
          await setStatus("CLOSED");
          setCloseAsk(false);
        }}
      />
    </>
  );
}
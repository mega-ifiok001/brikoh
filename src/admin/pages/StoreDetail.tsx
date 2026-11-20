import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button, Confirm, Icon, KV, PageHead, toast } from "../../components/ui";
import { ago, fd, fdt, fm } from "../../lib/format";
import { ListShell, Panel, Pill, TableWrap } from "../components/bits";
import { useAdmin } from "../AdminContext";
import { adminApi, errMsg } from "../lib/adminApi";
import { useGet } from "../lib/hooks";

export default function StoreDetail() {
  const { storeId } = useParams();
  const { p, can } = useAdmin();
  const { data: s, loading, error, reload } = useGet<any>(storeId ? `/api/admin/stores/${storeId}` : null);
  const [replay, setReplay] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  const plan = s?.plan;
  const usage = plan?.usage ?? {};
  const health = s?.paymentProvider?.webhookHealth;
  const canRun = can("operations:run");

  async function reprocess() {
    if (!replay) return;
    setBusy(true);
    try {
      const r = await adminApi.post<{ outcome: string }>(`/api/admin/webhook-events/${replay.id}/reprocess`);
      toast.success(`Webhook reprocessed: ${r?.outcome ?? "done"}`);
      setReplay(null);
      reload();
    } catch (e: any) {
      const m =
        e?.status === 409
          ? "Already processed — a replay would have no effect."
          : e?.status === 400
            ? "The stored payload no longer parses."
            : errMsg(e);
      toast.error(m);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Link to={p("/stores")} className="mb-3 inline-flex items-center gap-1 text-sm font-bold text-ink-400 hover:text-ink-800">
        <Icon name="chevronLeft" size={15} /> Stores
      </Link>

      <ListShell loading={loading} error={error} onRetry={reload} count={s ? 1 : 0}>
        {s && (
          <>
            <PageHead
              title={s.name}
              sub={`${s.subdomain ? s.subdomain + ".brikoh.com · " : ""}${s.ownerEmail} · ${s.businessType ?? "—"} · created ${fd(s.createdAt)}`}
            >
              <Pill value={plan?.tier} />
              <Pill value={plan?.status} />
            </PageHead>

            <div className="grid gap-5 lg:grid-cols-3">
              <div className="space-y-5 lg:col-span-2">
                <Panel title="Recent orders" flush>
                  {(s.recentOrders ?? []).length === 0 ? (
                    <p className="p-4 text-sm text-ink-400">No orders yet.</p>
                  ) : (
                    <TableWrap>
                      <thead>
                        <tr>
                          <th>Order</th>
                          <th>Status</th>
                          <th className="text-right">Total</th>
                          <th>Placed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {s.recentOrders.map((o: any) => (
                          <tr key={o.id}>
                            <td className="font-mono text-[12px] text-ink-500">{String(o.id).slice(0, 8)}…</td>
                            <td>
                              <Pill value={o.status} />
                            </td>
                            <td className="text-right tabular-nums font-semibold">{fm(o.total)}</td>
                            <td className="whitespace-nowrap text-ink-500">{fdt(o.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </TableWrap>
                  )}
                </Panel>

                <Panel title="Staff" flush>
                  {(s.staff ?? []).length === 0 ? (
                    <p className="p-4 text-sm text-ink-400">No staff accounts.</p>
                  ) : (
                    <TableWrap>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Role</th>
                          <th>Permissions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {s.staff.map((m: any) => (
                          <tr key={m.id}>
                            <td className="font-semibold">{m.name || "—"}</td>
                            <td>
                              <Pill value={m.role} tone="neutral" />
                            </td>
                            <td className="text-xs text-ink-500">{(m.permissions ?? []).join(", ") || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </TableWrap>
                  )}
                </Panel>

                <Panel
                  title="Payment provider & webhook health"
                  sub={s.paymentProvider?.provider ? `Connected: ${s.paymentProvider.provider}` : "No provider connected"}
                  flush
                >
                  <div className="grid grid-cols-2 gap-3 border-b border-cream-100 p-4">
                    <div>
                      <p className="lbl">Last success</p>
                      <p className="text-sm font-semibold">{health?.lastSuccessAt ? ago(health.lastSuccessAt) : "—"}</p>
                    </div>
                    <div>
                      <p className="lbl">Last failure</p>
                      <p className={`text-sm font-semibold ${health?.lastFailureAt ? "text-danger-500" : ""}`}>
                        {health?.lastFailureAt ? ago(health.lastFailureAt) : "—"}
                      </p>
                    </div>
                  </div>
                  {(health?.lastEvents ?? []).length === 0 ? (
                    <p className="p-4 text-sm text-ink-400">No webhook events recorded.</p>
                  ) : (
                    <TableWrap>
                      <thead>
                        <tr>
                          <th>Event</th>
                          <th>Status</th>
                          <th>Received</th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {health.lastEvents.map((ev: any) => {
                          const done = String(ev.status).toUpperCase() === "PROCESSED";
                          return (
                            <tr key={ev.id}>
                              <td className="font-mono text-[12px]">{ev.event}</td>
                              <td>
                                <Pill value={ev.status} />
                              </td>
                              <td className="whitespace-nowrap text-ink-500">{fdt(ev.createdAt)}</td>
                              <td className="text-right">
                                {canRun && !done && (
                                  <Button size="sm" variant="outline" onClick={() => setReplay(ev)}>
                                    Reprocess
                                  </Button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </TableWrap>
                  )}
                </Panel>
              </div>

              <div className="space-y-5">
                <Panel title="Plan">
                  <div className="-my-2 divide-y divide-cream-100">
                    <KV label="Tier" value={<Pill value={plan?.tier} />} />
                    <KV label="Status" value={<Pill value={plan?.status} />} />
                    <KV label="Period start" value={fd(plan?.currentPeriodStart)} />
                    <KV label="Period end" value={fd(plan?.currentPeriodEnd)} />
                  </div>
                </Panel>
                <Panel title="Usage this period">
                  <div className="-my-2 divide-y divide-cream-100">
                    <KV mono label="Staff" value={usage.staff ?? 0} />
                    <KV mono label="Products" value={usage.products ?? 0} />
                    <KV mono label="Orders" value={usage.orders ?? 0} />
                  </div>
                </Panel>
                <Panel title="Identifiers">
                  <p className="lbl">Store ID</p>
                  <code className="break-all font-mono text-xs text-ink-600">{s.id}</code>
                  {plan?.activeSubscriptionId && (
                    <>
                      <p className="lbl mt-3">Active subscription</p>
                      <code className="break-all font-mono text-xs text-ink-600">{plan.activeSubscriptionId}</code>
                    </>
                  )}
                </Panel>
              </div>
            </div>
          </>
        )}
      </ListShell>

      <Confirm
        open={!!replay}
        onClose={() => setReplay(null)}
        onConfirm={reprocess}
        loading={busy}
        title="Reprocess this webhook?"
        confirmLabel="Reprocess"
        body={
          <>
            Re-runs the stored <b>{replay?.event}</b> payload through the order-fulfilment pipeline. Only events that
            haven't been processed can be replayed.
          </>
        }
      />
    </>
  );
}
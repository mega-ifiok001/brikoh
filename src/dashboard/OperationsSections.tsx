"use client";

import { useState } from "react";
import { useApi } from "@/api/useApi";
import { ApiError } from "@/api/types";
import {
  notificationsService, ordersService, overviewService, settingsService,
  reportsService, suppliersService, purchaseOrdersService, templatesService,
  walletService, customersService, productsService, branchesService,
} from "@/api/services";
import { SkeletonRows } from "@/components/Skeleton";
import {
  Bell, Refresh, AlertCircle, ShoppingBag, Truck,
  Plus, Trash, X, Check, Send, Ban, LayoutGrid, Key,
} from "@/components/icons";
import type { PaymentMethod, PurchaseOrderDetail, Supplier, NotificationSettings } from "@/api/types";

const input = "w-full rounded-xl border border-ink/10 bg-white px-4 py-3 text-[15px] text-ink outline-none transition-all focus:border-brand focus:ring-4 focus:ring-brand/10";

function ErrorCard({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed border-red-200 bg-red-50/50 px-6 py-12 text-center">
      <AlertCircle className="h-8 w-8 text-red-400" />
      <p className="mt-3 text-sm font-semibold text-red-500">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-white">
          <Refresh className="h-4 w-4" /> Retry
        </button>
      )}
    </div>
  );
}

function SectionHead({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink">{title}</h2>
        {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-extrabold text-ink">{title}</h3>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-ink/40 hover:bg-ink/5"><X className="h-5 w-5" /></button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}

function useSubmit(onSaved: () => void) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const run = async (fn: () => Promise<unknown>) => {
    setError("");
    setBusy(true);
    try { await fn(); onSaved(); return true; }
    catch (e) { setError(e instanceof ApiError ? e.message : (e as Error).message); return false; }
    finally { setBusy(false); }
  };
  return { error, busy, run };
}

/* ============================= Notifications ============================= */

export function NotificationsSection() {
  const list = useApi(() => notificationsService.list());
  const [kind, setKind] = useState("");
  const [testMsg, setTestMsg] = useState("");

  const testAlert = async () => {
    try { const r = await notificationsService.test(); setTestMsg(`Test email sent to ${r.to}`); }
    catch (e) { setTestMsg(`Failed: ${(e as Error).message}`); }
  };

  const dispatches = (list.data?.dispatches ?? []).filter((d) => !kind || d.kind === kind);
  const kindTint: Record<string, string> = { LOW_STOCK: "bg-sun/20 text-[#b7791f]", EXPIRING_SOON: "bg-red-100 text-red-500", PAYMENT_RECEIVED: "bg-leaf/15 text-leaf" };

  return (
    <div className="space-y-5">
      <SectionHead
        title="Notifications"
        sub="Owner-only · merchant alert dispatches (email)"
        action={
          <div className="flex gap-2">
            <select value={kind} onChange={(e) => setKind(e.target.value)} className="rounded-xl border border-ink/10 bg-white px-3 py-2.5 text-sm font-medium outline-none">
              <option value="">All kinds</option>
              {["LOW_STOCK", "EXPIRING_SOON", "PAYMENT_RECEIVED"].map((k) => <option key={k}>{k}</option>)}
            </select>
            <button onClick={testAlert} className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 bg-white px-4 py-2.5 text-sm font-semibold text-ink hover:border-brand hover:text-brand">
              <Send className="h-4 w-4" /> Send test alert
            </button>
          </div>
        }
      />
      {testMsg && <p className="rounded-xl bg-cream px-4 py-3 text-sm font-semibold text-forest">{testMsg}</p>}

      {list.loading ? <SkeletonRows rows={4} /> : list.error ? <ErrorCard message={list.error} onRetry={list.refetch} /> : (
        <div className="space-y-2.5">
          {dispatches.map((d) => (
            <div key={d.id} className="flex items-center gap-3 rounded-2xl border border-ink/5 bg-white p-4 shadow-sm">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand/10 text-brand"><Bell className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-ink">{d.kind.replace(/_/g, " ")}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${kindTint[d.kind] ?? "bg-ink/10 text-muted"}`}>{d.kind}</span>
                </div>
                <p className="mt-0.5 truncate text-xs text-muted">
                  {Object.entries(d.snapshot).map(([k, v]) => `${k}: ${String(v)}`).join(" · ")}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted">{new Date(d.sentAt).toLocaleString()}</p>
                {d.sentQuantity != null && <p className="text-[10px] font-bold text-[#b7791f]">qty {d.sentQuantity}</p>}
              </div>
            </div>
          ))}
          {dispatches.length === 0 && <p className="py-8 text-center text-sm text-muted">No alert dispatches yet.</p>}
        </div>
      )}
    </div>
  );
}

/* ================================ Orders ================================ */

export function OrdersSection() {
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Awaited<ReturnType<typeof ordersService.list>>["items"]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Awaited<ReturnType<typeof ordersService.get>> | null>(null);
  const [posOpen, setPosOpen] = useState(false);

  const load = async (next?: string) => {
    setLoading(true); setError(null);
    try {
      const res = await ordersService.list({ status: status || undefined, q: q || undefined, limit: 20, cursor: next ?? undefined });
      setItems((prev) => (next ? [...prev, ...res.items] : res.items));
      setCursor(res.nextCursor);
    } catch (e) { setError((e as Error).message); }
    setLoading(false);
  };

  const openDetail = async (id: string) => { setDetailId(id); setDetail(null); try { setDetail(await ordersService.get(id)); } catch (e) { alert((e as Error).message); setDetailId(null); } };

  const statusTint: Record<string, string> = { PENDING: "bg-sun/20 text-[#b7791f]", PAID: "bg-leaf/15 text-leaf", SHIPPED: "bg-pine/15 text-pine", CANCELLED: "bg-ink/10 text-muted", REFUNDED: "bg-red-100 text-red-500", FAILED: "bg-red-100 text-red-500" };

  return (
    <div className="space-y-5">
      <SectionHead
        title="Orders"
        sub="orders.manage · POS sales & storefront checkouts with ORD-#### numbers"
        action={
          <div className="flex flex-wrap gap-2">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search customer…" className="w-40 rounded-xl border border-ink/10 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand" />
            <select value={status} onChange={(e) => { setStatus(e.target.value); }} className="rounded-xl border border-ink/10 bg-white px-3 py-2.5 text-sm font-medium outline-none">
              <option value="">All statuses</option>
              {["PENDING", "PAID", "SHIPPED", "CANCELLED", "REFUNDED", "FAILED"].map((s) => <option key={s}>{s}</option>)}
            </select>
            <button onClick={() => load()} className="rounded-xl bg-forest px-4 py-2.5 text-sm font-bold text-white">Filter</button>
            <button onClick={() => setPosOpen(true)} className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-brand-light to-brand px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand/25">
              <Plus className="h-4 w-4" /> POS sale
            </button>
          </div>
        }
      />

      {error ? <ErrorCard message={error} onRetry={() => load()} /> : loading && items.length === 0 ? <SkeletonRows rows={6} /> : (
        <div className="space-y-2.5">
          {items.map((o) => (
            <div key={o.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-ink/5 bg-white p-4 shadow-sm">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand"><ShoppingBag className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-ink">{o.orderNumber} · {o.customer.name}</p>
                <p className="text-xs text-muted">{o.source} · {o.paymentMethod} · {new Date(o.createdAt).toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-extrabold text-ink">{o.total}</p>
                {Number(o.balanceDue) > 0 && <p className="text-[10px] font-bold text-[#b7791f]">due {o.balanceDue}</p>}
              </div>
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${statusTint[o.status]}`}>{o.status}</span>
              <button onClick={() => openDetail(o.id)} className="rounded-full border border-ink/15 px-3.5 py-1.5 text-xs font-bold text-ink hover:border-brand hover:text-brand">View</button>
            </div>
          ))}
          {loading && <SkeletonRows rows={2} />}
          {cursor && <button onClick={() => load(cursor)} className="w-full rounded-full border border-ink/15 py-3 text-sm font-bold text-ink hover:border-brand hover:text-brand">Load more</button>}
          {!loading && items.length === 0 && <p className="py-10 text-center text-sm text-muted">No orders yet.</p>}
        </div>
      )}

      {posOpen && <PosSaleModal onClose={() => setPosOpen(false)} onDone={() => { setPosOpen(false); load(); }} />}

      {detailId && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm" onClick={() => setDetailId(null)}>
          <div className="max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-extrabold text-ink">{detail?.order.orderNumber ?? "Order"}</h3>
                <p className="text-xs text-muted">{detail?.order.customer.name}</p>
              </div>
              <button onClick={() => setDetailId(null)} className="grid h-8 w-8 place-items-center rounded-lg text-ink/40 hover:bg-ink/5"><X className="h-5 w-5" /></button>
            </div>
            {!detail ? <div className="mt-4"><SkeletonRows rows={4} /></div> : (
              <div className="mt-4 space-y-5">
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl bg-cream p-3"><p className="text-[11px] text-muted">Total</p><p className="font-extrabold text-ink">{detail.order.total}</p></div>
                  <div className="rounded-xl bg-cream p-3"><p className="text-[11px] text-muted">Paid</p><p className="font-extrabold text-leaf">{detail.order.amountPaid}</p></div>
                  <div className="rounded-xl bg-cream p-3"><p className="text-[11px] text-muted">Due</p><p className="font-extrabold text-[#b7791f]">{detail.order.balanceDue}</p></div>
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted">Line items</h4>
                  <div className="mt-2 space-y-1.5">
                    {detail.lineItems.map((li) => (
                      <div key={li.id} className="flex items-center justify-between rounded-xl bg-cream px-4 py-2.5 text-sm">
                        <span className="font-semibold text-ink">{li.productName} × {li.quantity}</span>
                        <span className="font-bold text-ink">{li.lineTotal}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted">Credit repayments</h4>
                  <div className="mt-2 space-y-1.5">
                    {detail.repayments.map((r) => (
                      <div key={r.id} className="flex items-center justify-between rounded-xl bg-cream px-4 py-2.5 text-sm">
                        <span className="font-semibold text-ink">{r.amount} <span className="text-xs text-muted">· {r.recordedByName}</span></span>
                        <span className="text-xs text-muted">{new Date(r.createdAt).toLocaleString()}</span>
                      </div>
                    ))}
                    {detail.repayments.length === 0 && <p className="py-2 text-center text-xs text-muted">No repayments.</p>}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function PosSaleModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [products, setProducts] = useState<Awaited<ReturnType<typeof productsService.list>>["items"]>([]);
  const [customers, setCustomers] = useState<Awaited<ReturnType<typeof customersService.list>>["items"]>([]);
  const [branches, setBranches] = useState<Awaited<ReturnType<typeof branchesService.list>>["items"]>([]);
  const [lines, setLines] = useState<{ productId: string; quantity: string }[]>([{ productId: "", quantity: "1" }]);
  const [customerId, setCustomerId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [amountPaid, setAmountPaid] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ order: { id: string; status: string; total: string }; payment: { redirectUrl: string } | null } | null>(null);

  const loadRefs = async () => {
    try {
      const [p, c, b] = await Promise.all([productsService.list(100), customersService.list({ limit: 50 }), branchesService.list()]);
      setProducts(p.items); setCustomers(c.items); setBranches(b.items);
    } catch { /* ignore */ }
  };
  useState(() => { loadRefs(); });

  const submit = async () => {
    setError("");
    const cleaned = lines.filter((l) => l.productId && Number(l.quantity) > 0);
    if (cleaned.length === 0) return setError("Add at least one line item.");
    setBusy(true);
    try {
      const res = await ordersService.posSale({
        items: cleaned.map((l) => ({ productId: l.productId, quantity: Number(l.quantity) })),
        customerId: customerId || undefined,
        branchId: branchId || undefined,
        paymentMethod,
        amountPaid: amountPaid || undefined,
        email: email || undefined,
      });
      setResult({ order: res.order, payment: res.payment });
    } catch (e) { setError(e instanceof ApiError ? e.message : (e as Error).message); }
    setBusy(false);
  };

  if (result) {
    return (
      <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm" onClick={onClose}>
        <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-leaf/15 text-leaf"><Check className="h-7 w-7" /></span>
          <h3 className="mt-4 font-display text-xl font-extrabold text-ink">Sale recorded!</h3>
          <p className="mt-1 text-sm text-muted">{result.order.id} · {result.order.status} · {result.order.total}</p>
          {result.payment && (
            <a href={result.payment.redirectUrl} target="_blank" rel="noreferrer" className="mt-4 block w-full rounded-full bg-forest py-3 text-sm font-bold text-white">Complete payment</a>
          )}
          <button onClick={onDone} className="mt-3 w-full rounded-full border border-ink/15 py-3 text-sm font-bold text-ink">Done</button>
        </div>
      </div>
    );
  }

  return (
    <Modal title="Record POS sale" onClose={onClose}>
      {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-500">{error}</p>}
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-ink">Line items (prices resolved server-side)</label>
          {lines.map((l, i) => (
            <div key={i} className="mb-2 grid grid-cols-[1fr_60px_28px] items-center gap-2">
              <select value={l.productId} onChange={(e) => setLines((ls) => ls.map((x, j) => (j === i ? { ...x, productId: e.target.value } : x)))} className="rounded-xl border border-ink/10 px-3 py-2.5 text-sm outline-none">
                <option value="">Product…</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <input type="number" value={l.quantity} onChange={(e) => setLines((ls) => ls.map((x, j) => (j === i ? { ...x, quantity: e.target.value } : x)))} placeholder="Qty" className="rounded-xl border border-ink/10 px-3 py-2.5 text-sm outline-none" />
              <button onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))} className="grid h-9 w-9 place-items-center rounded-lg text-ink/40 hover:text-red-500">✕</button>
            </div>
          ))}
          <button onClick={() => setLines((ls) => [...ls, { productId: "", quantity: "1" }])} className="inline-flex items-center gap-1 text-xs font-bold text-brand"><Plus className="h-3.5 w-3.5" /> Add line</button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">Customer</label>
            <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className={input}>
              <option value="">Walk-in</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">Branch</label>
            <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className={input}>
              <option value="">Default branch</option>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-ink">Payment method</label>
          <div className="grid grid-cols-4 gap-1.5">
            {(["CASH", "TRANSFER", "CREDIT", "CARD"] as const).map((m) => (
              <button key={m} onClick={() => setPaymentMethod(m)} className={`rounded-xl border-2 py-2 text-xs font-bold ${paymentMethod === m ? "border-brand bg-brand/[0.06] text-brand" : "border-ink/8 text-muted"}`}>{m}</button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input type="number" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} placeholder="Amount paid (optional)" className={input} />
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email (required for CARD)" className={input} />
        </div>
      </div>
      <button onClick={submit} disabled={busy} className="mt-4 w-full rounded-full bg-forest py-3 text-sm font-bold text-white disabled:opacity-60">{busy ? "Recording…" : "Record sale"}</button>
    </Modal>
  );
}

/* ================================ Overview =============================== */

export function OverviewHomeSection() {
  const ov = useApi(() => overviewService.get());

  if (ov.loading) return <SkeletonRows rows={6} />;
  if (ov.error || !ov.data) return <ErrorCard message={ov.error ?? "error"} onRetry={ov.refetch} />;

  const d = ov.data;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {d.kpis.revenue != null && <div className="rounded-2xl border border-ink/5 bg-white p-5 shadow-sm"><p className="font-display text-2xl font-extrabold text-ink">{d.kpis.revenue}</p><p className="text-xs text-muted">Revenue (30d)</p></div>}
        <div className="rounded-2xl border border-ink/5 bg-white p-5 shadow-sm"><p className="font-display text-2xl font-extrabold text-ink">{d.kpis.orders}</p><p className="text-xs text-muted">Orders (30d)</p></div>
        <div className="rounded-2xl border border-ink/5 bg-white p-5 shadow-sm"><p className="font-display text-2xl font-extrabold text-ink">{d.kpis.customers}</p><p className="text-xs text-muted">Customers</p></div>
        {d.kpis.avgOrderValue != null && <div className="rounded-2xl border border-ink/5 bg-white p-5 shadow-sm"><p className="font-display text-2xl font-extrabold text-ink">{d.kpis.avgOrderValue}</p><p className="text-xs text-muted">Avg order</p></div>}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-ink/5 bg-white p-6 shadow-sm">
          <h3 className="font-display text-base font-extrabold text-ink">Low stock</h3>
          <div className="mt-4 space-y-2">
            {(d.lowStock ?? []).map((s) => (
              <div key={`${s.productId}-${s.branchId}`} className="flex items-center gap-3 rounded-xl bg-cream px-4 py-3 text-sm">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-sun/20 text-xs">⚠️</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-ink">{s.name}</p>
                  <p className="text-xs text-muted">{s.branchName} · {s.quantity} left</p>
                </div>
              </div>
            ))}
            {(d.lowStock ?? []).length === 0 && <p className="py-4 text-center text-sm text-muted">All good 🎉</p>}
          </div>
        </div>
        <div className="rounded-3xl border border-ink/5 bg-white p-6 shadow-sm">
          <h3 className="font-display text-base font-extrabold text-ink">Expiring soon (7 days)</h3>
          <div className="mt-4 space-y-2">
            {(d.expiringSoon ?? []).map((s) => (
              <div key={s.productId} className="flex items-center gap-3 rounded-xl bg-cream px-4 py-3 text-sm">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-red-100 text-xs">⏰</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-ink">{s.name}</p>
                  <p className="text-xs text-muted">expires {new Date(s.expiryDate).toLocaleDateString()} · {s.quantity} left</p>
                </div>
              </div>
            ))}
            {(d.expiringSoon ?? []).length === 0 && <p className="py-4 text-center text-sm text-muted">Nothing expiring.</p>}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-ink/5 bg-white p-6 shadow-sm">
          <h3 className="font-display text-base font-extrabold text-ink">Recent orders</h3>
          <div className="mt-4 space-y-2">
            {d.recentOrders.map((o) => (
              <div key={o.id} className="flex items-center justify-between rounded-xl bg-cream px-4 py-3 text-sm">
                <div>
                  <p className="font-bold text-ink">{o.customerName}</p>
                  <p className="text-xs text-muted">{o.status} · {o.source} · {new Date(o.createdAt).toLocaleString()}</p>
                </div>
                <span className="font-extrabold text-ink">{o.total}</span>
              </div>
            ))}
            {d.recentOrders.length === 0 && <p className="py-4 text-center text-sm text-muted">No orders yet.</p>}
          </div>
        </div>
        <div className="rounded-3xl border border-ink/5 bg-white p-6 shadow-sm">
          <h3 className="font-display text-base font-extrabold text-ink">Quick stats</h3>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {[
              { k: "Products", v: d.quickStats.productCount },
              { k: "Branches", v: d.quickStats.branchCount },
              { k: "Pending orders", v: d.quickStats.pendingOrderCount },
              { k: "Credit owing", v: d.quickStats.creditOwing },
            ].map((s) => (
              <div key={s.k} className="rounded-xl bg-cream p-3">
                <p className="font-display text-lg font-extrabold text-ink">{s.v}</p>
                <p className="text-xs text-muted">{s.k}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* =============================== Settings =============================== */

export function SettingsDetailSection() {
  const business = useApi(() => settingsService.business.get());
  const notif = useApi(() => settingsService.notifications.get());
  const twofa = useApi(() => settingsService.twoFactor.state());
  const [passForm, setPassForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [passMsg, setPassMsg] = useState("");
  const [notifBusy, setNotifBusy] = useState(false);
  const [setup, setSetup] = useState<{ secret: string; otpauthUrl: string } | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [msg, setMsg] = useState("");

  const [draftNotif, setDraftNotif] = useState<NotificationSettings | null>(null);

  const saveNotif = async () => {
    setNotifBusy(true);
    try {
      await settingsService.notifications.update(draftNotif ?? notif.data!);
      notif.refetch();
      setMsg("Notification preferences saved.");
    } catch (e) { setMsg(`Failed: ${(e as Error).message}`); }
    setNotifBusy(false);
  };

  const changePassword = async () => {
    setPassMsg("");
    if (passForm.newPassword !== passForm.confirmPassword) { setPassMsg("Passwords don't match."); return; }
    try {
      await settingsService.password(passForm);
      setPassMsg("Password changed — all other sessions were logged out.");
      setPassForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (e) { setPassMsg(`Failed: ${(e as Error).message}`); }
  };

  const setup2fa = async () => {
    try { setSetup(await settingsService.twoFactor.setup()); } catch (e) { setMsg((e as Error).message); }
  };
  const enable2fa = async () => {
    try { await settingsService.twoFactor.enable(totpCode); setSetup(null); setTotpCode(""); twofa.refetch(); setMsg("2FA enabled."); } catch (e) { setMsg((e as Error).message); }
  };
  const disable2fa = async () => {
    try { await settingsService.twoFactor.disable(totpCode); setTotpCode(""); twofa.refetch(); setMsg("2FA disabled."); } catch (e) { setMsg((e as Error).message); }
  };

  if (business.loading || notif.loading) return <SkeletonRows rows={5} />;
  if (business.error) return <ErrorCard message={business.error} onRetry={business.refetch} />;

  return (
    <div className="space-y-6">
      {msg && <p className="rounded-xl bg-leaf/10 px-4 py-3 text-sm font-semibold text-forest">{msg}</p>}

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-ink/5 bg-white p-6 shadow-sm">
          <h3 className="font-display text-base font-extrabold text-ink">Business profile</h3>
          {business.data && (
            <div className="mt-4 grid gap-2 text-sm">
              <div className="flex justify-between border-b border-ink/5 pb-2"><span className="text-muted">Name</span><span className="font-bold text-ink">{business.data.name}</span></div>
              <div className="flex justify-between border-b border-ink/5 pb-2"><span className="text-muted">Type</span><span className="font-bold text-ink">{business.data.businessType}</span></div>
              <div className="flex justify-between border-b border-ink/5 pb-2"><span className="text-muted">Location</span><span className="font-bold text-ink">{business.data.location}</span></div>
              <div className="flex justify-between border-b border-ink/5 pb-2"><span className="text-muted">Currency</span><span className="font-bold text-ink">{business.data.currency}</span></div>
              <div className="flex justify-between"><span className="text-muted">Phone</span><span className="font-bold text-ink">{business.data.businessPhone}</span></div>
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-ink/5 bg-white p-6 shadow-sm">
          <h3 className="font-display text-base font-extrabold text-ink">Notification preferences</h3>
          <p className="text-xs text-muted">Owner-only · these drive the merchant-alert engine.</p>
          {notif.data && (() => {
            const eff = draftNotif ?? notif.data!;
            return (
              <div className="mt-4 space-y-3">
                {(["lowStockAlerts", "paymentAlerts", "expiringSoonAlerts"] as const).map((k) => (
                  <label key={k} className="flex items-center justify-between rounded-xl bg-cream px-4 py-3 text-sm">
                    <span className="font-semibold text-ink">{k.replace(/([A-Z])/g, " $1").toLowerCase()}</span>
                    <button
                      onClick={() => setDraftNotif((d) => ({ ...(d ?? notif.data!), [k]: !(d ?? notif.data!)[k] }))}
                      className={`relative h-6 w-11 rounded-full transition-colors ${eff[k] ? "bg-forest" : "bg-ink/15"}`}
                    >
                      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${eff[k] ? "left-[22px]" : "left-0.5"}`} />
                    </button>
                  </label>
                ))}
                <button onClick={saveNotif} disabled={notifBusy} className="w-full rounded-full bg-forest py-2.5 text-sm font-bold text-white disabled:opacity-60">{notifBusy ? "Saving…" : "Save preferences"}</button>
              </div>
            );
          })()}
        </div>

        <div className="rounded-3xl border border-ink/5 bg-white p-6 shadow-sm">
          <h3 className="font-display text-base font-extrabold text-ink">Change password</h3>
          {passMsg && <p className="mt-2 rounded-lg bg-cream px-3 py-2 text-xs font-semibold text-forest">{passMsg}</p>}
          <div className="mt-4 space-y-3">
            <input type="password" value={passForm.currentPassword} onChange={(e) => setPassForm((p) => ({ ...p, currentPassword: e.target.value }))} placeholder="Current password" className={input} />
            <input type="password" value={passForm.newPassword} onChange={(e) => setPassForm((p) => ({ ...p, newPassword: e.target.value }))} placeholder="New password (min 8)" className={input} />
            <input type="password" value={passForm.confirmPassword} onChange={(e) => setPassForm((p) => ({ ...p, confirmPassword: e.target.value }))} placeholder="Confirm new password" className={input} />
          </div>
          <button onClick={changePassword} className="mt-4 w-full rounded-full bg-forest py-2.5 text-sm font-bold text-white">Change password</button>
        </div>

        <div className="rounded-3xl border border-ink/5 bg-white p-6 shadow-sm">
          <h3 className="flex items-center gap-2 font-display text-base font-extrabold text-ink"><Key className="h-5 w-5 text-brand" /> Two-factor authentication</h3>
          <p className="text-xs text-muted">Status: {twofa.data?.enabled ? "Enabled" : twofa.data?.pending ? "Pending (verify to activate)" : "Disabled"}</p>
          {setup ? (
            <div className="mt-4 rounded-xl bg-amber-50 px-4 py-4 ring-1 ring-amber-200">
              <p className="text-xs font-bold text-amber-700">Scan this with your authenticator:</p>
              <p className="mt-2 break-all font-mono text-xs font-bold text-ink">{setup.secret}</p>
              <p className="mt-1 break-all text-[10px] text-muted">{setup.otpauthUrl}</p>
              <div className="mt-3 flex gap-2">
                <input value={totpCode} onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="6-digit code" className={`${input} font-mono`} />
                <button onClick={enable2fa} className="shrink-0 rounded-xl bg-forest px-4 text-sm font-bold text-white">Enable</button>
              </div>
            </div>
          ) : !twofa.data?.enabled ? (
            <button onClick={setup2fa} className="mt-4 rounded-full bg-forest px-5 py-2.5 text-sm font-bold text-white">Set up 2FA</button>
          ) : (
            <div className="mt-4 flex gap-2">
              <input value={totpCode} onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="6-digit code" className={`${input} font-mono`} />
              <button onClick={disable2fa} className="shrink-0 rounded-full border border-red-200 px-4 py-2.5 text-sm font-bold text-red-400 hover:bg-red-50">Disable</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================================ Reports =============================== */

export function ReportsSection() {
  const [period, setPeriod] = useState("week");
  const pnl = useApi(() => reportsService.pnl(period), [period]);
  const expenses = useApi(() => reportsService.expensesByCategory(period), [period]);
  const valuation = useApi(() => reportsService.inventoryValuation());

  return (
    <div className="space-y-6">
      <SectionHead
        title="Reports"
        sub="analytics.manage + viewProfit · P&L, expenses & inventory valuation"
        action={
          <div className="flex rounded-full bg-white p-1 ring-1 ring-ink/10">
            {["week", "month", "quarter", "year"].map((p) => (
              <button key={p} onClick={() => setPeriod(p)} className={`rounded-full px-3.5 py-1.5 text-xs font-bold capitalize ${period === p ? "bg-forest text-white" : "text-muted hover:text-ink"}`}>{p}</button>
            ))}
          </div>
        }
      />

      {pnl.loading ? <SkeletonRows rows={4} /> : pnl.error ? <ErrorCard message={pnl.error} onRetry={pnl.refetch} /> : pnl.data && (
        <div className="rounded-3xl border border-ink/5 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-extrabold text-ink">Profit & Loss</h3>
            <span className="text-xs text-muted">{pnl.data.period.key} · {new Date(pnl.data.period.start).toLocaleDateString()} → {new Date(pnl.data.period.end).toLocaleDateString()}</span>
          </div>
          {pnl.data.cogsUnpricedLineItems > 0 && (
            <div className="mt-3 rounded-xl bg-sun/15 px-4 py-3 text-sm font-bold text-[#b7791f]">
              ⚠️ {pnl.data.cogsUnpricedLineItems} item(s) sold this period have no recorded cost price; profit may be overstated.
            </div>
          )}
          <div className="mt-4 space-y-2">
            <div className="flex justify-between rounded-xl bg-cream px-4 py-3 text-sm"><span className="text-ink/75">Revenue</span><span className="font-extrabold text-ink">{pnl.data.revenue}</span></div>
            <div className="flex justify-between rounded-xl bg-cream px-4 py-3 text-sm"><span className="text-ink/75">COGS</span><span className="font-extrabold text-ink">−{pnl.data.cogs}</span></div>
            <div className="flex justify-between rounded-xl bg-cream px-4 py-3 text-sm"><span className="text-ink/75">Expenses</span><span className="font-extrabold text-ink">−{pnl.data.expenses}</span></div>
            <div className={`flex justify-between rounded-2xl px-5 py-4 ${Number(pnl.data.netProfit) >= 0 ? "bg-leaf/10" : "bg-red-50"}`}>
              <span className="font-display text-base font-extrabold text-ink">Net profit</span>
              <span className={`font-display text-xl font-extrabold ${Number(pnl.data.netProfit) >= 0 ? "text-forest" : "text-red-500"}`}>{pnl.data.netProfit}</span>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-ink/5 bg-white p-6 shadow-sm">
          <h3 className="font-display text-base font-extrabold text-ink">Expenses by category</h3>
          {expenses.loading ? <div className="mt-4"><SkeletonRows rows={3} /></div> : expenses.error ? <ErrorCard message={expenses.error} onRetry={expenses.refetch} /> : (
            <div className="mt-4 space-y-3">
              {(expenses.data?.categories ?? []).map((c) => (
                <div key={c.category} className="flex items-center justify-between rounded-xl bg-cream px-4 py-3 text-sm">
                  <span className="font-bold text-ink">{c.category} <span className="text-xs text-muted">({c.count})</span></span>
                  <span className="font-extrabold text-ink">{c.total}</span>
                </div>
              ))}
              <div className="flex items-center justify-between rounded-xl bg-forest px-4 py-3 text-sm text-white">
                <span className="font-bold">Grand total</span>
                <span className="font-extrabold">{expenses.data?.grandTotal}</span>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-ink/5 bg-white p-6 shadow-sm">
          <h3 className="font-display text-base font-extrabold text-ink">Inventory valuation</h3>
          {valuation.loading ? <div className="mt-4"><SkeletonRows rows={3} /></div> : valuation.error ? <ErrorCard message={valuation.error} onRetry={valuation.refetch} /> : (
            <div className="mt-4 space-y-2">
              {valuation.data && (
                <>
                  <div className="flex justify-between rounded-xl bg-cream px-4 py-3 text-sm"><span className="text-ink/75">Value at cost</span><span className="font-extrabold text-ink">{valuation.data.totals.atCost}</span></div>
                  <div className="flex justify-between rounded-xl bg-cream px-4 py-3 text-sm"><span className="text-ink/75">Value at retail</span><span className="font-extrabold text-ink">{valuation.data.totals.atRetail}</span></div>
                  <div className="flex justify-between rounded-xl bg-cream px-4 py-3 text-sm"><span className="text-ink/75">Unpriced products</span><span className="font-extrabold text-ink">{valuation.data.unpricedProducts}</span></div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================================ Suppliers =============================== */

export function SuppliersSection() {
  const list = useApi(() => suppliersService.list());
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const submit = useSubmit(() => { setOpen(false); list.refetch(); });

  const create = () => submit.run(async () => {
    if (name.trim().length < 1) throw new Error("Supplier name required.");
    await suppliersService.create({ name: name.trim(), contactName: contactName.trim() || undefined, phone: phone.trim() || undefined, email: email.trim() || undefined, address: address.trim() || undefined, notes: notes.trim() || undefined });
    setName(""); setContactName(""); setPhone(""); setEmail(""); setAddress(""); setNotes("");
  });

  const del = async (id: string) => { if (confirm("Delete this supplier? Only possible without order history.")) { try { await suppliersService.del(id); list.refetch(); } catch (e) { alert((e as Error).message); } } };

  return (
    <div className="space-y-5">
      <SectionHead
        title="Suppliers"
        sub="purchases.manage · vendor directory"
        action={
          <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-brand-light to-brand px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand/25">
            <Plus className="h-4 w-4" /> Add supplier
          </button>
        }
      />

      {list.loading ? <SkeletonRows rows={4} /> : list.error ? <ErrorCard message={list.error} onRetry={list.refetch} /> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(list.data?.items ?? []).map((s) => (
            <div key={s.id} className="rounded-2xl border border-ink/5 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-pine/10 text-pine"><Truck className="h-5 w-5" /></span>
                {!s.isActive && <span className="rounded-full bg-ink/10 px-2.5 py-1 text-[10px] font-bold text-muted">Inactive</span>}
              </div>
              <p className="mt-3 font-display text-base font-extrabold text-ink">{s.name}</p>
              <p className="text-xs text-muted">{s.contactName ?? "—"} {s.phone ? `· ${s.phone}` : ""}</p>
              {s.email && <p className="truncate text-xs text-muted">{s.email}</p>}
              <div className="mt-3 flex items-center justify-between border-t border-ink/5 pt-3 text-sm">
                <span className="text-muted">{s.purchaseOrderCount ?? 0} PO(s)</span>
                <span className="font-extrabold text-ink">{s.balanceDue ?? "0.00"} due</span>
              </div>
              <button onClick={() => del(s.id)} className="mt-3 rounded-full border border-red-200 px-3.5 py-1.5 text-xs font-bold text-red-400 hover:bg-red-50">Delete</button>
            </div>
          ))}
          {(list.data?.items ?? []).length === 0 && <p className="py-8 text-center text-sm text-muted sm:col-span-3">No suppliers yet.</p>}
        </div>
      )}

      {open && (
        <Modal title="Add supplier" onClose={() => setOpen(false)}>
          {submit.error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-500">{submit.error}</p>}
          <div className="space-y-3">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Supplier name" className={input} />
            <input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Contact name (optional)" className={input} />
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone (optional)" className={input} />
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email (optional)" className={input} />
            <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address (optional)" className={input} />
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (optional)" rows={2} className={`${input} resize-none`} />
          </div>
          <button onClick={create} disabled={submit.busy} className="mt-4 w-full rounded-full bg-forest py-3 text-sm font-bold text-white disabled:opacity-60">{submit.busy ? "Creating…" : "Create supplier"}</button>
        </Modal>
      )}
    </div>
  );
}

/* ============================ Purchase orders ============================ */

export function PurchaseOrdersSection() {
  const list = useApi(() => purchaseOrdersService.list());
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [branches, setBranches] = useState<Awaited<ReturnType<typeof branchesService.list>>["items"]>([]);
  const [products, setProducts] = useState<Awaited<ReturnType<typeof productsService.list>>["items"]>([]);
  const [open, setOpen] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [lines, setLines] = useState<{ productId: string; quantity: string; unitCostAtOrder: string }[]>([{ productId: "", quantity: "1", unitCostAtOrder: "" }]);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<PurchaseOrderDetail | null>(null);
  const [payAmt, setPayAmt] = useState("");
  const [filter, setFilter] = useState("");
  const submit = useSubmit(() => { setOpen(false); list.refetch(); });
  const detailSubmit = useSubmit(async () => { if (detailId) setDetail(await purchaseOrdersService.get(detailId)); });

  const loadRefs = async () => {
    try {
      const [s, b, p] = await Promise.all([suppliersService.list(), branchesService.list(), productsService.list(100)]);
      setSuppliers(s.items); setBranches(b.items); setProducts(p.items);
    } catch { /* ignore */ }
  };

  const create = () => submit.run(async () => {
    if (!supplierId || !branchId) throw new Error("Select a supplier and branch.");
    const cleaned = lines.filter((l) => l.productId && Number(l.quantity) > 0);
    if (cleaned.length === 0) throw new Error("Add at least one line item.");
    await purchaseOrdersService.create({
      supplierId, branchId,
      lineItems: cleaned.map((l) => ({ productId: l.productId, quantity: Number(l.quantity), unitCostAtOrder: l.unitCostAtOrder || "0" })),
    });
    setSupplierId(""); setBranchId(""); setLines([{ productId: "", quantity: "1", unitCostAtOrder: "" }]);
  });

  const openDetail = async (id: string) => { setDetailId(id); setDetail(null); setPayAmt(""); try { setDetail(await purchaseOrdersService.get(id)); } catch (e) { alert((e as Error).message); setDetailId(null); } };

  const issue = async (id: string) => { try { await purchaseOrdersService.issue(id); list.refetch(); } catch (e) { alert((e as Error).message); } };
  const cancel = async (id: string) => { if (confirm("Cancel this purchase order?")) { try { await purchaseOrdersService.cancel(id); list.refetch(); } catch (e) { alert((e as Error).message); } } };
  const delDraft = async (id: string) => { if (confirm("Delete this draft PO?")) { try { await purchaseOrdersService.del(id); list.refetch(); } catch (e) { alert((e as Error).message); } } };

  const pay = () => detailSubmit.run(async () => {
    if (!detailId || !Number(payAmt)) throw new Error("Enter a payment amount.");
    await purchaseOrdersService.pay(detailId, { amount: payAmt });
    setPayAmt("");
  });

  const orders = (list.data?.items ?? []).filter((o) => !filter || o.status === filter);
  const statusTint: Record<string, string> = { DRAFT: "bg-ink/10 text-muted", ORDERED: "bg-sun/20 text-[#b7791f]", PARTIALLY_RECEIVED: "bg-pine/15 text-pine", RECEIVED: "bg-leaf/15 text-leaf", CANCELLED: "bg-red-100 text-red-500" };

  return (
    <div className="space-y-5">
      <SectionHead
        title="Purchase orders"
        sub="purchases.manage · DRAFT → ORDERED → RECEIVED"
        action={
          <div className="flex gap-2">
            <select value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded-xl border border-ink/10 bg-white px-3 py-2.5 text-sm font-medium outline-none">
              <option value="">All statuses</option>
              {["DRAFT", "ORDERED", "PARTIALLY_RECEIVED", "RECEIVED", "CANCELLED"].map((s) => <option key={s}>{s}</option>)}
            </select>
            <button onClick={() => { setOpen(true); loadRefs(); }} className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-brand-light to-brand px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand/25">
              <Plus className="h-4 w-4" /> New PO
            </button>
          </div>
        }
      />

      {list.loading ? <SkeletonRows rows={4} /> : list.error ? <ErrorCard message={list.error} onRetry={list.refetch} /> : (
        <div className="space-y-2.5">
          {orders.map((po) => (
            <div key={po.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-ink/5 bg-white p-4 shadow-sm">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-pine/10 text-pine"><Truck className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-ink">{po.number ?? "Draft"} · {po.supplier.name}</p>
                <p className="text-xs text-muted">{po.branch.name} · {po.itemCount} item(s) · {new Date(po.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-extrabold text-ink">{po.total}</p>
                {Number(po.balanceDue) > 0 && po.status !== "DRAFT" && <p className="text-[10px] font-bold text-[#b7791f]">due {po.balanceDue}</p>}
              </div>
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${statusTint[po.status]}`}>{po.status}</span>
              <div className="flex gap-1.5">
                <button onClick={() => openDetail(po.id)} className="rounded-full border border-ink/15 px-3.5 py-1.5 text-xs font-bold text-ink hover:border-brand hover:text-brand">View</button>
                {po.status === "DRAFT" && (
                  <>
                    <button onClick={() => issue(po.id)} className="inline-flex items-center gap-1 rounded-full bg-forest px-3.5 py-1.5 text-xs font-bold text-white"><Send className="h-3 w-3" /> Issue</button>
                    <button onClick={() => delDraft(po.id)} className="grid h-7 w-7 place-items-center rounded-lg text-ink/35 hover:text-red-500"><Trash className="h-4 w-4" /></button>
                  </>
                )}
                {(po.status === "ORDERED" || po.status === "PARTIALLY_RECEIVED") && (
                  <button onClick={() => cancel(po.id)} className="inline-flex items-center gap-1 rounded-full border border-red-200 px-3.5 py-1.5 text-xs font-bold text-red-400 hover:bg-red-50"><Ban className="h-3 w-3" /> Cancel</button>
                )}
              </div>
            </div>
          ))}
          {orders.length === 0 && <p className="py-8 text-center text-sm text-muted">No purchase orders.</p>}
        </div>
      )}

      {open && (
        <Modal title="New purchase order (DRAFT)" onClose={() => setOpen(false)}>
          {submit.error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-500">{submit.error}</p>}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className={input}>
                <option value="">Supplier…</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className={input}>
                <option value="">Branch…</option>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted">Line items</p>
            {lines.map((l, i) => (
              <div key={i} className="grid grid-cols-[1fr_55px_70px_28px] items-center gap-2">
                <select value={l.productId} onChange={(e) => setLines((ls) => ls.map((x, j) => (j === i ? { ...x, productId: e.target.value } : x)))} className="rounded-xl border border-ink/10 px-3 py-2.5 text-sm outline-none">
                  <option value="">Product…</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <input type="number" value={l.quantity} onChange={(e) => setLines((ls) => ls.map((x, j) => (j === i ? { ...x, quantity: e.target.value } : x)))} placeholder="Qty" className="rounded-xl border border-ink/10 px-3 py-2.5 text-sm outline-none" />
                <input value={l.unitCostAtOrder} onChange={(e) => setLines((ls) => ls.map((x, j) => (j === i ? { ...x, unitCostAtOrder: e.target.value } : x)))} placeholder="Cost" className="rounded-xl border border-ink/10 px-3 py-2.5 text-sm outline-none" />
                <button onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))} className="grid h-9 w-9 place-items-center rounded-lg text-ink/40 hover:text-red-500">✕</button>
              </div>
            ))}
            <button onClick={() => setLines((ls) => [...ls, { productId: "", quantity: "1", unitCostAtOrder: "" }])} className="inline-flex items-center gap-1 text-xs font-bold text-brand"><Plus className="h-3.5 w-3.5" /> Add line</button>
          </div>
          <button onClick={create} disabled={submit.busy} className="mt-4 w-full rounded-full bg-forest py-3 text-sm font-bold text-white disabled:opacity-60">{submit.busy ? "Creating…" : "Create draft"}</button>
        </Modal>
      )}

      {detailId && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm" onClick={() => setDetailId(null)}>
          <div className="max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-extrabold text-ink">{detail?.purchaseOrder.number ?? "PO"}</h3>
                <p className="text-xs text-muted">{detail?.purchaseOrder.supplier.name} · {detail?.purchaseOrder.branch.name}</p>
              </div>
              <button onClick={() => setDetailId(null)} className="grid h-8 w-8 place-items-center rounded-lg text-ink/40 hover:bg-ink/5"><X className="h-5 w-5" /></button>
            </div>
            {!detail ? <div className="mt-4"><SkeletonRows rows={4} /></div> : (
              <div className="mt-4 space-y-5">
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl bg-cream p-3"><p className="text-[11px] text-muted">Total</p><p className="font-extrabold text-ink">{detail.purchaseOrder.total}</p></div>
                  <div className="rounded-xl bg-cream p-3"><p className="text-[11px] text-muted">Paid</p><p className="font-extrabold text-leaf">{detail.purchaseOrder.amountPaid}</p></div>
                  <div className="rounded-xl bg-cream p-3"><p className="text-[11px] text-muted">Due</p><p className="font-extrabold text-[#b7791f]">{detail.purchaseOrder.balanceDue}</p></div>
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted">Line items</h4>
                  <div className="mt-2 space-y-1.5">
                    {detail.lineItems.map((li) => (
                      <div key={li.id} className="flex items-center justify-between rounded-xl bg-cream px-4 py-2.5 text-sm">
                        <div>
                          <p className="font-semibold text-ink">{li.productName} × {li.quantity}</p>
                          <p className="text-xs text-muted">{li.quantityReceived} received · {li.remainingToReceive} to go</p>
                        </div>
                        <span className="font-bold text-ink">{li.lineTotal}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {detail.purchaseOrder.status !== "DRAFT" && detail.purchaseOrder.status !== "CANCELLED" && (
                  <div className="rounded-xl bg-sun/10 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#b7791f]">Record payment</p>
                    {detailSubmit.error && <p className="mt-1 text-xs font-medium text-red-500">{detailSubmit.error}</p>}
                    <div className="mt-2 flex gap-2">
                      <input value={payAmt} onChange={(e) => setPayAmt(e.target.value)} placeholder="Amount" className={input} />
                      <button onClick={pay} disabled={detailSubmit.busy} className="shrink-0 rounded-full bg-forest px-5 text-sm font-bold text-white disabled:opacity-60">{detailSubmit.busy ? "…" : "Pay"}</button>
                    </div>
                  </div>
                )}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted">Receipts</h4>
                  <div className="mt-2 space-y-1.5">
                    {detail.receipts.map((r) => (
                      <div key={r.id} className="rounded-xl bg-cream px-4 py-2.5 text-sm">
                        <p className="font-semibold text-ink">{r.lines.map((l) => `${l.productName} ×${l.quantityReceived}`).join(", ")}</p>
                        <p className="text-xs text-muted">{r.recordedByName} · {new Date(r.createdAt).toLocaleString()}</p>
                      </div>
                    ))}
                    {detail.receipts.length === 0 && <p className="py-2 text-center text-xs text-muted">No receipts yet.</p>}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ================================ Wallet ================================ */

export function WalletSection() {
  const w = useApi(() => walletService.overview());

  if (w.loading) return <SkeletonRows rows={4} />;
  if (w.error || !w.data) return <ErrorCard message={w.error ?? "error"} onRetry={w.refetch} />;

  const { wallet, recentEntries } = w.data;

  return (
    <div className="space-y-6">
      <SectionHead title="Wallet" sub="Owner-only · NGN · fed by CARD/online orders" />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <div className="rounded-2xl bg-gradient-to-br from-forest to-pine p-5 text-white">
          <p className="text-xs text-white/70">Available</p>
          <p className="mt-1 font-display text-2xl font-extrabold">₦{wallet.available}</p>
        </div>
        <div className="rounded-2xl border border-ink/5 bg-white p-5 shadow-sm"><p className="text-xs text-muted">Pending</p><p className="mt-1 font-display text-2xl font-extrabold text-ink">₦{wallet.pending}</p></div>
        <div className="rounded-2xl border border-ink/5 bg-white p-5 shadow-sm"><p className="text-xs text-muted">Withdrawn</p><p className="mt-1 font-display text-2xl font-extrabold text-ink">₦{wallet.withdrawn}</p></div>
        <div className="rounded-2xl border border-ink/5 bg-white p-5 shadow-sm"><p className="text-xs text-muted">Total credits</p><p className="mt-1 font-display text-2xl font-extrabold text-ink">₦{wallet.totalCredits}</p></div>
      </div>

      <div className="rounded-3xl border border-ink/5 bg-white p-6 shadow-sm">
        <h3 className="font-display text-base font-extrabold text-ink">Recent ledger entries</h3>
        <div className="mt-4 space-y-2">
          {recentEntries.map((e) => (
            <div key={e.id} className="flex items-center gap-3 rounded-xl bg-cream px-4 py-3 text-sm">
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${e.type === "CREDIT" ? "bg-leaf/15 text-leaf" : "bg-brand/15 text-brand"}`}>
                {e.type === "CREDIT" ? "+" : "−"}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-ink">{e.source.replace(/_/g, " ")}</p>
                <p className="text-xs text-muted">{e.type} · balance after {e.balanceAfter} · {new Date(e.createdAt).toLocaleString()}</p>
              </div>
              <span className={`font-extrabold ${e.type === "CREDIT" ? "text-forest" : "text-ink"}`}>{e.type === "CREDIT" ? "+" : "−"}{e.amount}</span>
            </div>
          ))}
          {recentEntries.length === 0 && <p className="py-8 text-center text-sm text-muted">No wallet activity yet.</p>}
        </div>
      </div>
    </div>
  );
}

/* =============================== Templates =============================== */

export function TemplatesSection() {
  const cat = useApi(() => templatesService.catalog());
  const [selected, setSelected] = useState("");
  const [custom, setCustom] = useState({ accentColor: "", heroText: "", heroSubtext: "", logoUrl: "" });
  const [msg, setMsg] = useState("");

  const select = async (id: string) => {
    try { await templatesService.select(id); setSelected(id); setMsg("Template applied."); cat.refetch(); } catch (e) { setMsg((e as Error).message); }
  };

  const saveCustom = async () => {
    try {
      await templatesService.customize({
        accentColor: custom.accentColor || undefined,
        heroText: custom.heroText || undefined,
        heroSubtext: custom.heroSubtext || undefined,
        logoUrl: custom.logoUrl || undefined,
      });
      setMsg("Customization saved.");
    } catch (e) { setMsg((e as Error).message); }
  };

  return (
    <div className="space-y-5">
      <SectionHead title="Templates" sub="Owner-only · storefront design catalog (tier-gated)" />
      {msg && <p className="rounded-xl bg-leaf/10 px-4 py-3 text-sm font-semibold text-forest">{msg}</p>}

      {cat.loading ? <SkeletonRows rows={3} /> : cat.error ? <ErrorCard message={cat.error} onRetry={cat.refetch} /> : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-forest/10 px-3 py-1.5 text-xs font-bold text-forest">Tier: {cat.data?.tier}</span>
            <span className="rounded-full bg-cream px-3 py-1.5 text-xs font-bold text-muted">Visible: {cat.data?.visibleCount ?? "all"}</span>
            {cat.data?.selectedTemplateId && <span className="rounded-full bg-brand/10 px-3 py-1.5 text-xs font-bold text-brand">Selected</span>}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {(cat.data?.templates ?? []).map((t) => (
              <button key={t.id} onClick={() => select(t.id)} className={`rounded-2xl border-2 p-5 text-left transition-all ${selected === t.id || cat.data?.selectedTemplateId === t.id ? "border-brand bg-brand/[0.05] shadow-lg shadow-brand/10" : "border-ink/8 bg-white hover:border-brand/40"}`}>
                <span className="grid h-14 w-14 place-items-center rounded-xl bg-gradient-to-br from-brand/20 to-pine/20 text-2xl"><LayoutGrid className="h-6 w-6 text-brand" /></span>
                <p className="mt-3 font-display text-base font-extrabold text-ink">{t.name}</p>
                <p className="mt-1 text-xs text-muted">{t.description ?? "—"}</p>
                <p className="mt-2 font-mono text-[10px] text-muted">{t.slug}</p>
              </button>
            ))}
          </div>

          <div className="rounded-3xl border border-ink/5 bg-white p-6 shadow-sm">
            <h3 className="font-display text-base font-extrabold text-ink">Customize template</h3>
            <div className="mt-4 space-y-3">
              <input value={custom.accentColor} onChange={(e) => setCustom((c) => ({ ...c, accentColor: e.target.value }))} placeholder="Accent color (#RRGGBB)" className={input} />
              <input value={custom.heroText} onChange={(e) => setCustom((c) => ({ ...c, heroText: e.target.value }))} placeholder="Hero text (1-80)" className={input} />
              <input value={custom.heroSubtext} onChange={(e) => setCustom((c) => ({ ...c, heroSubtext: e.target.value }))} placeholder="Hero subtext (1-160)" className={input} />
              <input value={custom.logoUrl} onChange={(e) => setCustom((c) => ({ ...c, logoUrl: e.target.value }))} placeholder="Logo URL (https)" className={input} />
            </div>
            <button onClick={saveCustom} className="mt-4 w-full rounded-full bg-forest py-2.5 text-sm font-bold text-white">Save customization</button>
          </div>
        </>
      )}
    </div>
  );
}

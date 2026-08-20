"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useApi } from "@/api/useApi";
import { getApiBaseUrl, setApiBaseUrl } from "@/api/config";
import { utcRange } from "@/api/services";
import {
  analyticsService, productsService, uploadsService, staffService,
  paymentsService, subscriptionService, locationsService, dashboardService,
  branchesService,
} from "@/api/services";
import { ApiError } from "@/api/types";
import type { Product, StockReason, StaffRole, PresignRequest } from "@/api/types";
import { SkeletonKpis, SkeletonRows } from "@/components/Skeleton";
import {
  Plus, Pencil, Trash, Refresh, Server, AlertCircle, Wallet,
  Globe, X, Upload, Users, MapPin,
} from "@/components/icons";

const SYM: Record<string, string> = { NGN: "₦", USD: "$", GHS: "GH₵", KES: "KSh", ZAR: "R" };
export const fmt = (cur: string, n: number) => `${SYM[cur] ?? ""}${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

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

function Bar({ label, value, max, color = "bg-brand" }: { label: string; value: number; max: number; color?: string }) {
  return (
    <div>
      <div className="flex justify-between text-sm"><span className="font-medium text-ink/80">{label}</span><span className="font-bold text-ink">{value}</span></div>
      <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-ink/5"><div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, (value / Math.max(1, max)) * 100)}%` }} /></div>
    </div>
  );
}

/* ============================== Overview ============================== */

export function OverviewSection() {
  const { user } = useAuth();
  const cur = user?.role === "OWNER" ? "NGN" : "NGN";
  const r = utcRange(30);
  const summary = useApi(() => analyticsService.summary(r.start, r.end, 5));
  const ts = useApi(() => analyticsService.timeseries(r.start, r.end, "daily"));

  if (!user) return null;
  const max = Math.max(...(ts.data?.buckets ?? []).map((b) => Number(b.totalSales)), 1);
  const firstName = user.firstName ?? user.email.split("@")[0];

  return (
    <div className="space-y-6">
      <SectionHead
        title={`Welcome back, ${firstName}`}
        sub="Live data from the API — every number comes from the backend."
        action={
          user.subdomain ? (
            <a href={`#/storefront/${user.subdomain}`} className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-brand-light to-brand px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand/25">
              <Globe className="h-4 w-4" /> View my website
            </a>
          ) : undefined
        }
      />

      <div className="rounded-3xl bg-gradient-to-br from-forest to-pine p-6 text-white shadow-lg shadow-forest/20">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-white/70">{user.storeName ?? "My Store"} · {user.role ? user.role.toLowerCase() : "member"}</p>
            <p className="font-display text-2xl font-extrabold">{user.subdomain ? `${user.subdomain}.brikoh.app` : "No public website (SKIP)"}</p>
            <p className="mt-1 text-xs text-white/70">{user.email}</p>
          </div>
          {user.subdomain && <span className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold">Storefront live</span>}
        </div>
      </div>

      {summary.loading ? (
        <SkeletonKpis />
      ) : summary.error ? (
        <ErrorCard message={`Analytics unavailable: ${summary.error}`} onRetry={summary.refetch} />
      ) : summary.data ? (
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
          <div className="rounded-2xl border border-ink/5 bg-white p-5 shadow-sm">
            <p className="font-display text-2xl font-extrabold tracking-tight text-ink">{fmt(cur, Number(summary.data.totalSales))}</p>
            <p className="mt-0.5 text-xs font-medium text-muted">Total sales (30d)</p>
          </div>
          <div className="rounded-2xl border border-ink/5 bg-white p-5 shadow-sm">
            <p className="font-display text-2xl font-extrabold tracking-tight text-ink">{summary.data.orderCount}</p>
            <p className="mt-0.5 text-xs font-medium text-muted">Orders</p>
          </div>
          <div className="rounded-2xl border border-ink/5 bg-white p-5 shadow-sm">
            <p className="font-display text-2xl font-extrabold tracking-tight text-ink">{summary.data.bestSellers.length}</p>
            <p className="mt-0.5 text-xs font-medium text-muted">Best sellers</p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="rounded-3xl border border-ink/5 bg-white p-6 shadow-sm">
          <h3 className="font-display text-base font-extrabold text-ink">Revenue — last 30 days</h3>
          {ts.loading ? <div className="mt-4"><SkeletonRows rows={3} /></div> : ts.error ? (
            <ErrorCard message={ts.error} onRetry={ts.refetch} />
          ) : (
            <div className="mt-5 flex h-44 items-end gap-1.5">
              {(ts.data?.buckets ?? []).map((b, i) => (
                <div key={i} className="group relative flex-1">
                  <div className="w-full rounded-t-lg bg-gradient-to-t from-brand/20 to-brand" style={{ height: `${Math.max(4, (Number(b.totalSales) / max) * 100)}%` }} />
                  {i % 5 === 0 && <p className="mt-1 truncate text-center text-[8px] text-muted">{new Date(b.start).toLocaleDateString(undefined, { day: "numeric", month: "short" })}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-ink/5 bg-white p-6 shadow-sm">
          <h3 className="font-display text-base font-extrabold text-ink">Best sellers</h3>
          <div className="mt-4 space-y-3">
            {(summary.data?.bestSellers ?? []).slice(0, 5).map((p) => (
              <div key={p.productId} className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-ink">{p.name}</p>
                  <p className="text-xs text-muted">{p.units} units</p>
                </div>
                <span className="text-sm font-extrabold text-forest">{fmt(cur, Number(p.revenue))}</span>
              </div>
            ))}
            {(summary.data?.bestSellers ?? []).length === 0 && <p className="py-6 text-center text-sm text-muted">No sales yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================== Analytics ============================== */

export function AnalyticsSection() {
  const [days, setDays] = useState<7 | 30 | 90>(30);
  const r = utcRange(days);
  const summary = useApi(() => analyticsService.summary(r.start, r.end, 5), [days]);
  const ts = useApi(() => analyticsService.timeseries(r.start, r.end, "daily"), [days]);
  const trends = useApi(() => analyticsService.trends(r.start, r.end, "daily").catch(() => null as never), [days]);
  const staffPerf = useApi(() => analyticsService.staffPerformance(r.start, r.end).catch(() => null as never), [days]);
  const channels = useApi(() => analyticsService.channels(r.start, r.end).catch(() => null as never), [days]);

  const cur = "NGN";
  const max = Math.max(...(ts.data?.buckets ?? []).map((b) => Number(b.totalSales)), 1);

  return (
    <div className="space-y-6">
      <SectionHead
        title="Analytics"
        sub={`UTC range ${r.start} → ${r.end} (${days} days)`}
        action={
          <div className="flex rounded-full bg-white p-1 ring-1 ring-ink/10">
            {([7, 30, 90] as const).map((d) => (
              <button key={d} onClick={() => setDays(d)} className={`rounded-full px-3.5 py-1.5 text-xs font-bold ${days === d ? "bg-forest text-white" : "text-muted hover:text-ink"}`}>{d}d</button>
            ))}
          </div>
        }
      />

      {summary.loading ? <SkeletonKpis /> : summary.error ? <ErrorCard message={summary.error} onRetry={summary.refetch} /> : (
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <div className="rounded-2xl border border-ink/5 bg-white p-5 shadow-sm"><p className="font-display text-2xl font-extrabold text-ink">{fmt(cur, Number(summary.data?.totalSales))}</p><p className="text-xs text-muted">Total sales</p></div>
          <div className="rounded-2xl border border-ink/5 bg-white p-5 shadow-sm"><p className="font-display text-2xl font-extrabold text-ink">{summary.data?.orderCount}</p><p className="text-xs text-muted">Orders</p></div>
          <div className="rounded-2xl border border-ink/5 bg-white p-5 shadow-sm"><p className="font-display text-2xl font-extrabold text-ink">{summary.data?.bestSellers.length}</p><p className="text-xs text-muted">Products sold</p></div>
          {trends.data?.changePercent != null && (
            <div className="rounded-2xl border border-ink/5 bg-white p-5 shadow-sm">
              <p className="font-display text-2xl font-extrabold text-forest">{trends.data.changePercent >= 0 ? "+" : ""}{trends.data.changePercent}%</p>
              <p className="text-xs text-muted">vs previous period</p>
            </div>
          )}
        </div>
      )}

      <div className="rounded-3xl border border-ink/5 bg-white p-6 shadow-sm">
        <h3 className="font-display text-base font-extrabold text-ink">Revenue over time</h3>
        {ts.loading ? <div className="mt-4"><SkeletonRows rows={3} /></div> : ts.error ? <ErrorCard message={ts.error} onRetry={ts.refetch} /> : (
          <div className="mt-5 flex h-48 items-end gap-1.5">
            {(ts.data?.buckets ?? []).map((b, i) => (
              <div key={i} className="group relative flex-1" title={`${fmt(cur, Number(b.totalSales))} · ${b.orderCount} orders`}>
                <div className="w-full rounded-t-lg bg-gradient-to-t from-brand/20 to-brand" style={{ height: `${Math.max(4, (Number(b.totalSales) / max) * 100)}%` }} />
                {i % 7 === 0 && <p className="mt-1 truncate text-center text-[8px] text-muted">{new Date(b.start).toLocaleDateString(undefined, { day: "numeric", month: "short" })}</p>}
              </div>
            ))}
          </div>
        )}
        <p className="mt-2 text-[11px] text-muted">Zero-filled daily buckets · only PAID/SHIPPED orders counted.</p>
      </div>

      {/* channels */}
      <div className="rounded-3xl border border-ink/5 bg-white p-6 shadow-sm">
        <h3 className="font-display text-base font-extrabold text-ink">Revenue by channel</h3>
        <p className="text-xs text-muted">Advanced tier · POS / STOREFRONT / DIRECT / SOCIAL / MARKETPLACE / REFERRAL (zero-filled)</p>
        {channels.loading ? <div className="mt-4"><SkeletonRows rows={3} /></div> : channels.error ? (
          <p className="mt-4 rounded-xl bg-cream px-4 py-3 text-sm text-muted">Advanced analytics unavailable on this plan.</p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(channels.data?.channels ?? []).map((ch) => (
              <div key={ch.source} className="rounded-xl bg-cream px-4 py-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-ink">{ch.source}</span>
                  <span className="text-xs text-muted">{ch.orderCount} order(s)</span>
                </div>
                <p className="mt-1 font-extrabold text-forest">{ch.revenue}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* staff performance (advanced) */}
      <div className="rounded-3xl border border-ink/5 bg-white p-6 shadow-sm">
        <h3 className="font-display text-base font-extrabold text-ink">Staff performance</h3>
        <p className="text-xs text-muted">Advanced tier (PRO/ENTERPRISE) · sales + inventory activity attribution</p>
        {staffPerf.loading ? <div className="mt-4"><SkeletonRows rows={3} /></div> : staffPerf.error ? (
          <p className="mt-4 rounded-xl bg-cream px-4 py-3 text-sm text-muted">Advanced analytics unavailable on this plan (feature flag: advancedAnalytics).</p>
        ) : (
          <div className="mt-4 space-y-2.5">
            {(staffPerf.data?.staff ?? []).map((s) => (
              <div key={s.staffMemberId} className="flex items-center gap-3 rounded-xl bg-cream px-4 py-3 text-sm">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-pine/15 font-bold text-pine">{s.name.charAt(0)}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-ink">{s.name}</p>
                  <p className="text-xs text-muted">{s.sales.orderCount} sales · {s.inventoryActivity.entries} stock entries</p>
                </div>
                <span className="font-extrabold text-forest">{fmt(cur, Number(s.sales.revenue))}</span>
              </div>
            ))}
            {(staffPerf.data?.staff ?? []).length === 0 && <p className="py-6 text-center text-sm text-muted">No staff activity in this range.</p>}
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================== Products ============================== */

export function ProductsSection() {
  const [items, setItems] = useState<Product[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [adjusting, setAdjusting] = useState<Product | null>(null);

  const load = async (next?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await productsService.list(50, next ?? undefined);
      setItems((prev) => (next ? [...prev, ...res.items] : res.items));
      setCursor(res.nextCursor);
      setTotal(res.total);
    } catch (e) {
      setError((e as Error).message);
    }
    setLoading(false);
  };

  const refresh = () => load();

  const del = async (p: Product) => {
    if (!confirm(`Delete "${p.name}"? This is a soft delete — history is preserved.`)) return;
    try { await productsService.del(p.id); setItems((prev) => prev.filter((x) => x.id !== p.id)); } catch (e) { alert((e as Error).message); }
  };

  return (
    <div className="space-y-5">
      <SectionHead
        title="Products"
        sub={total != null ? `${total} products · price is a decimal string · stock moves only via stock-adjustments` : "Loading…"}
        action={
          <button onClick={() => { setEditing(null); setFormOpen(true); }} className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-brand-light to-brand px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand/25">
            <Plus className="h-4 w-4" /> Add product
          </button>
        }
      />

      {error ? <ErrorCard message={error} onRetry={refresh} /> : loading && items.length === 0 ? (
        <SkeletonRows rows={6} />
      ) : (
        <div className="space-y-2.5">
          {items.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-ink/5 bg-white p-4 shadow-sm">
              <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-cream text-xl">
                {p.images?.[0] ? <img src={p.images[0]} alt="" className="h-full w-full object-cover" /> : "📦"}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-ink">{p.name}</p>
                <p className="text-xs text-muted">{p.id} · {p.description ? p.description.slice(0, 60) : "no description"}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-extrabold text-ink">{fmt("NGN", Number(p.price))}</p>
                <p className={`text-xs font-bold ${p.quantity === 0 ? "text-red-500" : "text-forest"}`}>{p.quantity} in stock</p>
              </div>
              <div className="flex shrink-0 gap-1">
                <button onClick={() => setAdjusting(p)} className="grid h-8 w-8 place-items-center rounded-lg text-ink/40 hover:bg-ink/5 hover:text-ink" title="Adjust stock"><Plus className="h-4 w-4" /></button>
                <button onClick={() => { setEditing(p); setFormOpen(true); }} className="grid h-8 w-8 place-items-center rounded-lg text-ink/40 hover:bg-ink/5 hover:text-ink" title="Edit"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => del(p)} className="grid h-8 w-8 place-items-center rounded-lg text-ink/40 hover:bg-red-50 hover:text-red-500" title="Delete"><Trash className="h-4 w-4" /></button>
              </div>
            </div>
          ))}

          {loading && <SkeletonRows rows={2} />}
          {cursor && (
            <button onClick={() => load(cursor)} className="w-full rounded-full border border-ink/15 py-3 text-sm font-bold text-ink hover:border-brand hover:text-brand">
              Load more (cursor pagination)
            </button>
          )}
          {!loading && items.length === 0 && <p className="py-10 text-center text-sm text-muted">No products yet — add your first one.</p>}
        </div>
      )}

      {formOpen && <ProductForm product={editing} onClose={() => setFormOpen(false)} onSaved={() => { setFormOpen(false); refresh(); }} />}
      {adjusting && <AdjustModal product={adjusting} onClose={() => setAdjusting(null)} onDone={() => { setAdjusting(null); refresh(); }} />}
    </div>
  );
}

/* --------------------------- product form --------------------------- */

function ProductForm({ product, onClose, onSaved }: { product: Product | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(product?.name ?? "");
  const [price, setPrice] = useState(product?.price ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  const onFile = async (file: File) => {
    setUploading(true);
    setError("");
    const mime = file.type as PresignRequest["contentType"];
    if (!["image/jpeg", "image/png", "image/webp"].includes(mime)) { setError("Only JPEG, PNG or WebP."); setUploading(false); return; }
    try {
      const presigned = await uploadsService.presignProductImage({ fileName: file.name, contentType: mime, declaredSizeBytes: file.size });
      await fetch(presigned.uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": mime } });
      setImages((imgs) => [...imgs, presigned.publicUrl]);
    } catch (e) {
      setError(`Upload failed: ${(e as Error).message}`);
    }
    setUploading(false);
  };

  const submit = async () => {
    setError("");
    if (name.trim().length < 1) return setError("Name is required.");
    if (!Number(price) || Number(price) <= 0) return setError("Price must be > 0.");
    setBusy(true);
    try {
      if (product) await productsService.update(product.id, { name: name.trim(), price, description: description || null, images });
      else await productsService.create({ name: name.trim(), price, description: description || null, images });
      onSaved();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : (e as Error).message);
    }
    setBusy(false);
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-extrabold text-ink">{product ? `Edit ${product.name}` : "Add product"}</h3>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-ink/40 hover:bg-ink/5"><X className="h-5 w-5" /></button>
        </div>
        {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

        <div className="mt-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={input} placeholder="e.g. Ankara Gown" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ink">Price</label>
              <input value={price} onChange={(e) => setPrice(e.target.value)} className={input} placeholder="19.99" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ink">Quantity <span className="text-[10px] text-muted">(via adjustments)</span></label>
              <input value={product?.quantity ?? ""} disabled className={`${input} opacity-60`} />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={`${input} resize-none`} placeholder="Optional, up to 2000 chars" />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink">Photos (max 10)</label>
            <div className="flex flex-wrap gap-2">
              {images.map((img, i) => (
                <div key={i} className="relative grid h-16 w-16 place-items-center overflow-hidden rounded-xl bg-cream ring-2 ring-brand/40">
                  <img src={img} alt="" className="h-full w-full object-cover" />
                  <button onClick={() => setImages((imgs) => imgs.filter((_, j) => j !== i))} className="absolute right-0 top-0 grid h-5 w-5 place-items-center rounded-bl-lg bg-red-500 text-[10px] text-white">✕</button>
                </div>
              ))}
              <label className="grid h-16 w-16 cursor-pointer place-items-center rounded-xl border-2 border-dashed border-ink/15 text-muted hover:border-brand">
                {uploading ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand/30 border-t-brand" /> : <Upload className="h-5 w-5" />}
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
              </label>
            </div>
            <p className="mt-1.5 text-[11px] text-muted">Presigned R2 upload (300s) → then PATCH images with the publicUrl.</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 rounded-full border border-ink/15 py-3 text-sm font-semibold text-muted hover:text-ink">Cancel</button>
            <button onClick={submit} disabled={busy} className="flex-1 rounded-full bg-gradient-to-br from-brand-light to-brand py-3 text-sm font-semibold text-white shadow-lg shadow-brand/25 disabled:opacity-60">
              {busy ? "Saving…" : product ? "Save changes" : "Create product"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* --------------------------- adjust modal --------------------------- */

function AdjustModal({ product, onClose, onDone }: { product: Product; onClose: () => void; onDone: () => void }) {
  const branches = useApi(() => branchesService.list());
  const [reason, setReason] = useState<StockReason>("RESTOCK");
  const [branchId, setBranchId] = useState("");
  const [quantityChange, setQuantityChange] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const effectiveBranchId = branchId || branches.data?.items?.find((b) => b.isDefault)?.id || branches.data?.items?.[0]?.id || "";

  const submit = async () => {
    setError("");
    const n = Number(quantityChange);
    if (!n || !Number.isInteger(n)) return setError("Enter a non-zero integer quantity.");
    if (n < 0 && Math.abs(n) > product.quantity) return setError(`Cannot decrement below zero (current: ${product.quantity}).`);
    if (!effectiveBranchId) return setError("No branch available — create one first.");
    setBusy(true);
    try {
      await productsService.stockAdjustments(product.id, { branchId: effectiveBranchId, quantityChange: n, reason });
      onDone();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : (e as Error).message);
    }
    setBusy(false);
  };

  const reasons: StockReason[] = ["RESTOCK", "MANUAL_ADJUSTMENT", "REFUND", "WRITE_OFF"];

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-display text-lg font-extrabold text-ink">Adjust stock — {product.name}</h3>
        <p className="mt-1 text-xs text-muted">Current quantity: <span className="font-bold text-forest">{product.quantity}</span> · POST /stock-adjustments</p>

        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink">Branch</label>
            <select value={effectiveBranchId} onChange={(e) => setBranchId(e.target.value)} className={input}>
              {(branches.data?.items ?? []).map((b) => <option key={b.id} value={b.id}>{b.name}{b.isDefault ? " (default)" : ""}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink">Reason</label>
            <select value={reason} onChange={(e) => setReason(e.target.value as StockReason)} className={input}>
              {reasons.map((r) => <option key={r} value={r}>{r.replace(/_/g, " ")}</option>)}
            </select>
            <p className="mt-1 text-[10px] text-muted">SALE is rejected by the API — sale movements come only from order fulfillment.</p>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink">Quantity change (signed int)</label>
            <input type="number" value={quantityChange} onChange={(e) => setQuantityChange(e.target.value)} placeholder="e.g. 10 or -3" className={input} autoFocus />
          </div>
          {error && <p className="text-xs font-medium text-red-500">{error}</p>}
        </div>

        <div className="mt-5 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-full border border-ink/15 py-3 text-sm font-semibold text-muted">Cancel</button>
          <button onClick={submit} disabled={busy} className="flex-1 rounded-full bg-forest py-3 text-sm font-semibold text-white disabled:opacity-60">{busy ? "Applying…" : "Apply"}</button>
        </div>
        <p className="mt-3 text-center text-[11px] text-muted">Appends one StockLedgerEntry in a single transaction — atomic.</p>
      </div>
    </div>
  );
}

/* =============================== Staff =============================== */

export function StaffSection() {
  const list = useApi(() => staffService.list());
  const invites = useApi(() => staffService.invites().catch(() => ({ items: [] } as never)));
  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<StaffRole>("STAFF");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submitInvite = async () => {
    setError("");
    if (!email.includes("@")) return setError("Enter a valid email.");
    setBusy(true);
    try {
      await staffService.invite({ email, role });
      setInviteOpen(false); setEmail(""); setRole("STAFF");
      invites.refetch();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : (e as Error).message);
    }
    setBusy(false);
  };

  const setRoleFor = async (id: string, r: StaffRole) => {
    try { await staffService.update(id, { role: r }); list.refetch(); } catch (e) { alert((e as Error).message); }
  };
  const removeStaff = async (id: string) => {
    if (!confirm("Remove this staff member? Their refresh tokens are revoked immediately.")) return;
    try { await staffService.remove(id); list.refetch(); } catch (e) { alert((e as Error).message); }
  };
  const revokeInvite = async (id: string) => {
    try { await staffService.revokeInvite(id); invites.refetch(); } catch (e) { alert((e as Error).message); }
  };

  const roleTint: Record<string, string> = { ADMIN: "bg-brand/15 text-brand", MANAGER: "bg-pine/15 text-pine", STAFF: "bg-leaf/15 text-leaf" };

  return (
    <div className="space-y-5">
      <SectionHead
        title="Staff & invites"
        sub="Owner-only · invites create an InviteToken — the invitee accepts via /accept-invite"
        action={
          <button onClick={() => setInviteOpen(true)} className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-brand-light to-brand px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand/25">
            <Plus className="h-4 w-4" /> Invite staff
          </button>
        }
      />

      <div className="rounded-3xl border border-ink/5 bg-white p-6 shadow-sm">
        <h3 className="flex items-center gap-2 font-display text-base font-extrabold text-ink"><Users className="h-5 w-5 text-pine" /> Active staff</h3>
        {list.loading ? <div className="mt-4"><SkeletonRows rows={3} /></div> : list.error ? <ErrorCard message={list.error} onRetry={list.refetch} /> : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {(list.data?.items ?? []).map((m) => (
              <div key={m.id} className="rounded-2xl bg-cream p-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-brand-light to-brand font-bold text-white">{m.email.charAt(0).toUpperCase()}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-ink">{m.email}</p>
                    <p className="text-xs text-muted">{m.id}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <select value={m.role} onChange={(e) => setRoleFor(m.id, e.target.value as StaffRole)} className={`rounded-full px-3 py-1.5 text-[11px] font-bold outline-none ${roleTint[m.role]}`}>
                    {(["ADMIN", "MANAGER", "STAFF"] as const).map((r) => <option key={r} value={r} className="text-ink">{r}</option>)}
                  </select>
                  <button onClick={() => removeStaff(m.id)} className="text-[11px] font-bold text-red-400 hover:text-red-500">Remove</button>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {m.permissions.map((p) => <span key={p} className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-muted">{p}</span>)}
                </div>
              </div>
            ))}
            {(list.data?.items ?? []).length === 0 && <p className="py-6 text-center text-sm text-muted">No staff yet.</p>}
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-ink/5 bg-white p-6 shadow-sm">
        <h3 className="flex items-center gap-2 font-display text-base font-extrabold text-ink"><Ticket className="h-5 w-5 text-brand" /> Pending invites</h3>
        {invites.loading ? <div className="mt-4"><SkeletonRows rows={2} /></div> : (
          <div className="mt-4 space-y-2">
            {(invites.data?.items ?? []).map((inv) => (
              <div key={inv.id} className="flex items-center gap-3 rounded-xl bg-cream px-4 py-3 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-ink">{inv.email}</p>
                  <p className="text-xs text-muted">{inv.role} · expires {new Date(inv.expiresAt).toLocaleString()}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${roleTint[inv.role]}`}>{inv.role}</span>
                <button onClick={() => revokeInvite(inv.id)} className="text-xs font-bold text-red-400 hover:text-red-500">Revoke</button>
              </div>
            ))}
            {(invites.data?.items ?? []).length === 0 && <p className="py-4 text-center text-sm text-muted">No pending invites.</p>}
          </div>
        )}
      </div>

      {inviteOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm" onClick={() => setInviteOpen(false)}>
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-lg font-extrabold text-ink">Invite staff member</h3>
            {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-500">{error}</p>}
            <div className="mt-4 space-y-3">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email (receives the invite token)" className={input} />
              <select value={role} onChange={(e) => setRole(e.target.value as StaffRole)} className={input}>
                {(["ADMIN", "MANAGER", "STAFF"] as const).map((r) => <option key={r} value={r}>{r} — {r === "ADMIN" ? "products, orders, customers, invoices" : r === "MANAGER" ? "products, orders" : "orders"}</option>)}
              </select>
            </div>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setInviteOpen(false)} className="flex-1 rounded-full border border-ink/15 py-3 text-sm font-semibold text-muted">Cancel</button>
              <button onClick={submitInvite} disabled={busy} className="flex-1 rounded-full bg-forest py-3 text-sm font-semibold text-white disabled:opacity-60">{busy ? "Sending…" : "Send invite"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================== Payments ============================== */

export function PaymentsSection() {
  const provider = useApi(() => paymentsService.getProvider());
  const settlements = useApi(() => paymentsService.settlements());
  const [pubKey, setPubKey] = useState("");
  const [secKey, setSecKey] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const saveProvider = async () => {
    setError("");
    if (!pubKey.startsWith("pk_") || !secKey.startsWith("sk_")) return setError("Keys must start with pk_ / sk_.");
    setBusy(true);
    try {
      await paymentsService.updateProvider({ provider: "paystack", publicKey: pubKey, secretKey: secKey });
      setPubKey(""); setSecKey("");
      provider.refetch();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : (e as Error).message);
    }
    setBusy(false);
  };

  return (
    <div className="space-y-6">
      <SectionHead title="Payments" sub="Owner-only · Paystack keys are encrypted server-side; the secret is only ever shown masked" />

      {provider.loading ? <SkeletonRows rows={2} /> : (
        <div className="rounded-3xl border border-ink/5 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-forest/10 text-forest"><Wallet className="h-6 w-6" /></span>
              <div>
                <p className="font-display text-base font-extrabold text-ink">Paystack {provider.data?.configured ? "configured" : "not configured"}</p>
                {provider.data?.configured ? (
                  <>
                    <p className="font-mono text-xs text-muted">{provider.data.publicKey}</p>
                    <p className="font-mono text-xs text-muted">secret: {provider.data.secretKeyMasked}</p>
                  </>
                ) : (
                  <p className="text-xs text-muted">No payment credentials saved yet.</p>
                )}
              </div>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${provider.data?.configured ? "bg-leaf/15 text-leaf" : "bg-ink/10 text-muted"}`}>
              {provider.data?.configured ? "Configured" : "Missing"}
            </span>
          </div>

          {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-500">{error}</p>}
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input value={pubKey} onChange={(e) => setPubKey(e.target.value)} placeholder="pk_test_…" className={`${input} font-mono text-xs`} />
            <input value={secKey} onChange={(e) => setSecKey(e.target.value)} placeholder="sk_test_… (never returned after save)" className={`${input} font-mono text-xs`} />
          </div>
          <button onClick={saveProvider} disabled={busy} className="mt-3 rounded-full bg-forest px-6 py-2.5 text-sm font-bold text-white disabled:opacity-60">
            {busy ? "Saving…" : provider.data?.configured ? "Update keys" : "Save keys"}
          </button>
        </div>
      )}

      <div className="rounded-3xl border border-ink/5 bg-white p-6 shadow-sm">
        <h3 className="font-display text-base font-extrabold text-ink">Settlements</h3>
        <p className="text-xs text-muted">Live from Paystack per paid order — settlement state is always present, never omitted.</p>
        {settlements.loading ? <div className="mt-4"><SkeletonRows rows={5} /></div> : settlements.error ? <ErrorCard message={settlements.error} onRetry={settlements.refetch} /> : (
          <div className="mt-4 overflow-x-auto">
            <table className="tbl-mobile w-full text-left text-sm">
              <thead>
                <tr className="border-b border-ink/5 text-[11px] font-bold uppercase tracking-wider text-muted">
                  <th className="px-4 py-3">Order</th><th className="px-4 py-3">Total</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Settlement</th>
                </tr>
              </thead>
              <tbody>
                {(settlements.data?.settlements ?? []).map((s) => (
                  <tr key={s.orderId} className="border-b border-ink/5 last:border-0 hover:bg-cream/50">
                    <td data-label="Order" className="px-4 py-3">
                      <p className="font-bold text-ink">{s.reference}</p>
                      <p className="font-mono text-[10px] text-muted">{s.orderId}</p>
                    </td>
                    <td data-label="Total" className="px-4 py-3 font-extrabold text-ink">{s.total} {s.currency}</td>
                    <td data-label="Status" className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${s.transactionStatus === "success" ? "bg-leaf/15 text-leaf" : s.transactionStatus === "failed" ? "bg-red-100 text-red-500" : "bg-sun/20 text-[#b7791f]"}`}>{s.transactionStatus}</span>
                    </td>
                    <td data-label="Settlement" className="px-4 py-3">
                      <p className={`text-xs font-bold ${s.settlement.status === "SETTLED" ? "text-forest" : "text-[#b7791f]"}`}>{s.settlement.status}</p>
                      <p className="text-[10px] text-muted">{s.settlement.detail}</p>
                    </td>
                  </tr>
                ))}
                {(settlements.data?.settlements ?? []).length === 0 && <tr><td colSpan={4} className="px-4 py-10 text-center text-muted">No paid orders yet.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================ Subscription ============================ */

export function SubscriptionSection() {
  const usage = useApi(() => subscriptionService.usage());
  const [domain, setDomain] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const setCustomDomain = async () => {
    setError("");
    if (!domain.trim()) return;
    setBusy(true);
    try {
      await subscriptionService.setCustomDomain({ customDomain: domain.trim() });
      setDomain("");
      usage.refetch();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : (e as Error).message);
    }
    setBusy(false);
  };

  if (usage.loading) return <div className="space-y-6"><SkeletonKpis count={3} /><SkeletonRows rows={3} /></div>;
  if (usage.error || !usage.data) return <ErrorCard message={`Subscription unavailable: ${usage.error ?? "no data"}`} onRetry={usage.refetch} />;

  const { plan, usage: u, period } = usage.data;
  const caps = [
    { label: "Staff", used: u.staff, cap: plan.limits.staffCap },
    { label: "Locations", used: u.locations, cap: plan.limits.locationCap },
    { label: "Products", used: u.products, cap: plan.limits.productCap },
    { label: "Orders (period)", used: u.orders, cap: plan.limits.orderCap },
  ];

  return (
    <div className="space-y-6">
      <SectionHead title="Subscription" sub={`GET /api/dashboard/subscriptions/usage · owner-only`} />

      <div className="rounded-3xl bg-gradient-to-br from-forest to-pine p-6 text-white shadow-lg shadow-forest/20">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-white/70">Current plan</p>
            <p className="mt-1 font-display text-3xl font-extrabold capitalize">{plan.tier.toLowerCase()}</p>
          </div>
          <div className="flex gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${plan.active ? "bg-leaf/30 text-white" : "bg-white/15 text-white/80"}`}>{plan.status ?? "no subscription"}</span>
            {plan.active && <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold">Active</span>}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-white/75">
          {plan.featureFlags.customDomain && <span>✓ custom domain</span>}
          {plan.featureFlags.advancedAnalytics && <span>✓ advanced analytics</span>}
          {plan.featureFlags.marketingTools && <span>✓ marketing tools</span>}
        </div>
      </div>

      <div className="rounded-3xl border border-ink/5 bg-white p-6 shadow-sm">
        <h3 className="font-display text-base font-extrabold text-ink">Usage vs plan caps</h3>
        <p className="text-xs text-muted">Billing period {new Date(period.start).toLocaleDateString()} → {new Date(period.end).toLocaleDateString()}</p>
        <div className="mt-5 space-y-4">
          {caps.map((c) => (
            <Bar key={c.label} label={`${c.label}: ${c.used}${c.cap != null ? ` / ${c.cap}` : " (unlimited)"}`} value={c.cap != null ? c.used : 0} max={c.cap ?? 1} color={c.cap != null && c.used >= c.cap ? "bg-red-400" : "bg-brand"} />
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-ink/5 bg-white p-6 shadow-sm">
        <h3 className="font-display text-base font-extrabold text-ink">Custom domain</h3>
        {usage.data.customDomain ? (
          <p className="mt-3 rounded-xl bg-leaf/10 px-4 py-3 text-sm font-bold text-forest">{usage.data.customDomain}</p>
        ) : (
          <p className="mt-3 text-sm text-muted">No custom domain set.</p>
        )}
        {!plan.featureFlags.customDomain ? (
          <p className="mt-3 rounded-xl bg-sun/15 px-4 py-3 text-sm font-bold text-[#b7791f]">Custom domains require the PRO or ENTERPRISE plan (PLAN_FEATURE_LOCKED).</p>
        ) : (
          <div className="mt-3 flex gap-2">
            <input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="shop.example.com" className={`${input} flex-1`} />
            <button onClick={setCustomDomain} disabled={busy} className="rounded-xl bg-forest px-5 py-3 text-sm font-bold text-white disabled:opacity-60">{busy ? "…" : "Set"}</button>
          </div>
        )}
        {error && <p className="mt-2 text-xs font-medium text-red-500">{error}</p>}
      </div>
    </div>
  );
}

/* ============================== Locations ============================== */

export function LocationsSection() {
  const list = useApi(() => locationsService.list());
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const create = async () => {
    setError("");
    if (!name.trim()) return setError("Name is required.");
    setBusy(true);
    try {
      await locationsService.create({ name: name.trim(), address: address.trim() });
      setName(""); setAddress("");
      list.refetch();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : (e as Error).message);
    }
    setBusy(false);
  };

  return (
    <div className="space-y-5">
      <SectionHead title="Locations" sub="locations.manage · locationCap enforced by the API (LOCATION_LIMIT_REACHED)" />

      <div className="rounded-3xl border border-ink/5 bg-white p-6 shadow-sm">
        <h3 className="font-display text-base font-extrabold text-ink">Add a location</h3>
        {error && <p className="mt-2 text-xs font-medium text-red-500">{error}</p>}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Lagos Flagship" className={input} />
          <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="12 Adeola Odeku St, VI, Lagos" className={input} />
        </div>
        <button onClick={create} disabled={busy} className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-brand-light to-brand px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand/25 disabled:opacity-60">
          <Plus className="h-4 w-4" /> {busy ? "Creating…" : "Create location"}
        </button>
      </div>

      {list.loading ? <SkeletonRows rows={3} /> : list.error ? <ErrorCard message={list.error} onRetry={list.refetch} /> : (
        <div className="space-y-2.5">
          {(list.data ?? []).map((loc) => (
            <div key={loc.id} className="flex items-center gap-3 rounded-2xl border border-ink/5 bg-white p-4 shadow-sm">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-pine/10 text-pine"><MapPin className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-ink">{loc.name}</p>
                <p className="truncate text-xs text-muted">{loc.address}</p>
              </div>
              <span className="text-xs text-muted">{new Date(loc.createdAt).toLocaleDateString()}</span>
            </div>
          ))}
          {(list.data ?? []).length === 0 && <p className="py-8 text-center text-sm text-muted">No locations yet.</p>}
        </div>
      )}
    </div>
  );
}

/* ============================== Settings ============================== */

export function SettingsSection() {
  const { user, logout } = useAuth();
  const me = useApi(() => dashboardService.me());
  const [url, setUrl] = useState(getApiBaseUrl());
  const [status, setStatus] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);

  const test = async () => {
    setChecking(true);
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 4000);
      const res = await fetch(`${getApiBaseUrl()}/api/public/health`, { signal: ctrl.signal });
      clearTimeout(t);
      setStatus(res.ok);
    } catch { setStatus(false); }
    setChecking(false);
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <SectionHead title="Settings" sub="Account identity from GET /api/dashboard/me" />

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-ink/5 bg-white p-6 shadow-sm">
          <h3 className="font-display text-base font-extrabold text-ink">Account</h3>
          {me.loading ? <SkeletonRows rows={3} /> : (
            <div className="mt-4 flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-brand-light to-brand font-display text-lg font-extrabold text-white">
                {(me.data?.firstName ?? me.data?.email ?? "?").charAt(0).toUpperCase()}
              </span>
              <div>
                <p className="font-bold text-ink">{me.data?.firstName} {me.data?.lastName}</p>
                <p className="text-xs text-muted">{me.data?.email} · {me.data?.phone}</p>
              </div>
            </div>
          )}
          <div className="mt-4 grid gap-2 text-sm">
            <div className="flex justify-between border-b border-ink/5 pb-2"><span className="text-muted">Role</span><span className="font-bold capitalize text-ink">{me.data?.role ?? "—"}</span></div>
            <div className="flex justify-between border-b border-ink/5 pb-2"><span className="text-muted">Store</span><span className="font-bold text-ink">{me.data?.storeName ?? "—"}</span></div>
            <div className="flex justify-between border-b border-ink/5 pb-2"><span className="text-muted">Subdomain</span><span className="font-mono font-bold text-brand">{me.data?.subdomain ?? "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted">Permissions</span><span className="max-w-[200px] truncate font-bold text-ink">{me.data?.permissions.join(", ") || "[]"}</span></div>
          </div>
        </div>

        <div className="rounded-3xl border border-ink/5 bg-white p-6 shadow-sm">
          <h3 className="font-display text-base font-extrabold text-ink">API status</h3>
          <div className="mt-3 flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-forest/10 text-forest"><Server className="h-5 w-5" /></span>
            <div className="min-w-0 flex-1">
              <p className="font-mono text-xs text-muted">{getApiBaseUrl()}</p>
            </div>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${status === true ? "bg-leaf/10 text-leaf" : status === false ? "bg-red-50 text-red-500" : "bg-ink/5 text-muted"}`}>
              <span className={`h-2 w-2 rounded-full ${status === true ? "bg-leaf" : status === false ? "bg-red-400" : "bg-ink/20"}`} />
              {status === true ? "Connected" : status === false ? "Unreachable" : "Not checked"}
            </span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <input value={url} onChange={(e) => setUrl(e.target.value)} className="w-full rounded-xl border border-ink/10 bg-cream px-4 py-2.5 font-mono text-xs text-ink outline-none focus:border-brand sm:flex-1" placeholder="https://…" />
            <button onClick={() => { setApiBaseUrl(url.trim()); test(); }} className="rounded-xl bg-forest px-5 py-2.5 text-xs font-bold text-white">Save & test</button>
            <button onClick={test} className="inline-flex items-center gap-1.5 rounded-xl border border-ink/15 px-4 py-2.5 text-xs font-bold text-ink hover:border-brand hover:text-brand">
              <Refresh className={`h-3.5 w-3.5 ${checking ? "animate-spin" : ""}`} /> Test
            </button>
          </div>
          <button onClick={logout} className="mt-5 w-full rounded-full border border-red-200 bg-red-50 py-3 text-sm font-bold text-red-500 hover:bg-red-100">Log out</button>
        </div>
      </div>
    </div>
  );
}

function Ticket({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M3 8.5a2 2 0 0 0 2 2 2 2 0 0 1 0 4 2 2 0 0 0 2 2v3h14v-3a2 2 0 0 1 0-4 2 2 0 0 1 0-4V5H5v3a2 2 0 0 0 2-2" />
    </svg>
  );
}

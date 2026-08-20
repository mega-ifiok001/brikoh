"use client";

import { useState, type ReactNode } from "react";
import { useApi } from "@/api/useApi";
import { utcRange } from "@/api/services";
import { adminService } from "@/api/services";
import { setAdminToken, clearAdminToken, getAdminToken } from "@/api/config";
import { ApiError } from "@/api/types";
import { Logo } from "@/components/ui";
import ThemeToggle from "@/components/ThemeToggle";
import { SkeletonKpis, SkeletonRows } from "@/components/Skeleton";
import { LayoutGrid, Storefront, Tag, ScrollText, LogOut, ArrowLeft, Shield, X, Menu, Refresh, AlertCircle, Wrench } from "@/components/icons";

const input = "w-full rounded-xl border border-ink/10 bg-white px-4 py-3 text-[15px] text-ink outline-none transition-all focus:border-brand focus:ring-4 focus:ring-brand/10";

type Section = "overview" | "stores" | "pricing" | "operations" | "audit";

const NAV: { id: Section; label: string; icon: ReactNode }[] = [
  { id: "overview", label: "Platform health", icon: <LayoutGrid className="h-5 w-5" /> },
  { id: "stores", label: "Stores", icon: <Storefront className="h-5 w-5" /> },
  { id: "pricing", label: "Billing & pricing", icon: <Tag className="h-5 w-5" /> },
  { id: "operations", label: "Operations", icon: <Wrench className="h-5 w-5" /> },
  { id: "audit", label: "Audit log", icon: <ScrollText className="h-5 w-5" /> },
];

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

export default function AdminPanel() {
  const [authed, setAuthed] = useState<boolean>(() => Boolean(getAdminToken()));
  const [section, setSection] = useState<Section>("overview");
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totpToken, setTotpToken] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const doLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    if (totpToken.replace(/\D/g, "").length !== 6) return setLoginError("Enter the 6-digit TOTP code from your authenticator app.");
    setLoginLoading(true);
    try {
      const res = await adminService.login({ email, password, totpToken: totpToken.trim() });
      setAdminToken(res.accessToken);
      setAuthed(true);
    } catch (err) {
      setLoginError(err instanceof ApiError ? err.message : (err as Error).message);
    }
    setLoginLoading(false);
  };

  const logout = () => {
    clearAdminToken();
    setAuthed(false);
    window.location.hash = "/";
  };

  if (!authed) {
    return (
      <div className="grid min-h-screen place-items-center bg-cream p-6">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex justify-center"><Logo /></div>
          <div className="rounded-3xl border border-ink/5 bg-white p-8 shadow-xl shadow-forest/5">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-forest/10 text-forest"><Shield className="h-6 w-6" /></span>
            <h1 className="mt-4 font-display text-2xl font-extrabold text-ink">Brikoh Ops Console</h1>
            <p className="mt-1 text-sm text-muted">Admin login requires a TOTP 2FA code — there is no admin session without it.</p>
            {loginError && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{loginError}</p>}
            <form onSubmit={doLogin} className="mt-5 space-y-3">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin email" className="w-full rounded-xl border border-ink/10 px-4 py-3 text-sm outline-none focus:border-brand" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password" className="w-full rounded-xl border border-ink/10 px-4 py-3 text-sm outline-none focus:border-brand" />
              <input value={totpToken} onChange={(e) => setTotpToken(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="6-digit TOTP code" inputMode="numeric" className="w-full rounded-xl border border-ink/10 px-4 py-3 text-sm font-mono outline-none focus:border-brand" />
              <button disabled={loginLoading} className="w-full rounded-xl bg-forest py-3 text-sm font-bold text-white disabled:opacity-60">
                {loginLoading ? "Verifying…" : "Sign in"}
              </button>
            </form>
            <a href="#/" className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-brand"><ArrowLeft className="h-3.5 w-3.5" /> Back to Brikoh.com</a>
          </div>
        </div>
      </div>
    );
  }

  const current = NAV.find((n) => n.id === section);

  const Sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between px-5">
        <a href="#/" className="inline-flex items-center gap-2"><Logo /><span className="rounded-full bg-forest/10 px-2.5 py-1 text-[10px] font-bold text-forest">Ops Console</span></a>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pt-4">
        {NAV.map((n) => (
          <button key={n.id} onClick={() => { setSection(n.id); setOpen(false); }} className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all ${section === n.id ? "bg-forest text-white shadow-lg shadow-forest/20" : "text-ink/65 hover:bg-ink/5 hover:text-ink"}`}>
            {n.icon} {n.label}
          </button>
        ))}
      </nav>
      <div className="border-t border-ink/5 p-4">
        <button onClick={logout} className="flex w-full items-center gap-2 rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-100"><LogOut className="h-4 w-4" /> Sign out</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-cream">
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-white shadow-2xl">
            <button onClick={() => setOpen(false)} className="absolute right-3 top-4 grid h-8 w-8 place-items-center rounded-lg text-ink/50 hover:bg-ink/5"><X className="h-5 w-5" /></button>
            {Sidebar}
          </aside>
        </div>
      )}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-ink/5 bg-white lg:block">{Sidebar}</aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-ink/5 bg-cream/85 backdrop-blur-xl">
          <div className="flex h-16 min-w-0 items-center gap-2 px-3 sm:gap-4 sm:px-8">
            <button onClick={() => setOpen(true)} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-ink/10 bg-white text-ink lg:hidden"><Menu className="h-5 w-5" /></button>
            <h1 className="min-w-0 flex-1 truncate font-display text-base font-extrabold text-ink sm:text-lg">{current?.label ?? "Admin"}</h1>
            <div className="ml-auto flex shrink-0 items-center gap-2">
              <span className="hidden items-center gap-1.5 rounded-full bg-forest/10 px-3 py-1.5 text-xs font-bold text-forest md:inline-flex"><Shield className="h-3.5 w-3.5" /> Admin</span>
              <ThemeToggle />
            </div>
          </div>
        </header>

        <main className="px-5 py-6 sm:px-8 sm:py-8">
          {section === "overview" && <Overview />}
          {section === "stores" && <Stores />}
          {section === "pricing" && <Pricing />}
          {section === "operations" && <Operations />}
          {section === "audit" && <Audit />}
        </main>
      </div>
    </div>
  );
}

/* ------------------------------ overview ------------------------------ */

function Overview() {
  const r = utcRange(30);
  const subs = useApi(() => adminService.subscriptions());
  const signups = useApi(() => adminService.signups(r.start, r.end, "daily"));
  const activation = useApi(() => adminService.activation(r.start, r.end));
  const churn = useApi(() => adminService.churn(r.start, r.end));

  const loading = subs.loading || signups.loading;
  if (loading) return <div className="space-y-6"><SkeletonKpis count={6} /><SkeletonRows rows={5} /></div>;
  if (subs.error || signups.error) return <ErrorCard message={subs.error ?? signups.error ?? "error"} onRetry={() => { subs.refetch(); signups.refetch(); }} />;

  const totalSignups = (signups.data?.buckets ?? []).reduce((a, b) => a + b.count, 0);
  const mrr = subs.data?.metrics.mrr ?? 0;

  const kpis = [
    { k: "Active subscriptions", v: (subs.data?.metrics.activeSubscriptions ?? 0).toString() },
    { k: "MRR", v: `$${mrr.toLocaleString()}` },
    { k: "Signups (30d)", v: totalSignups.toString() },
    { k: "Activation rate", v: activation.data?.activationRate != null ? `${activation.data.activationRate}%` : "—" },
    { k: "Churn rate", v: churn.data?.churnRate != null ? `${churn.data.churnRate}%` : "—" },
    { k: "Active at period start", v: (churn.data?.activeAtPeriodStart ?? 0).toString() },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink">Platform health</h2>
          <p className="mt-1 text-sm text-muted">Shared metrics · UTC range {r.start} → {r.end}</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-leaf/10 px-3.5 py-1.5 text-xs font-bold text-leaf"><span className="h-2 w-2 animate-pulse rounded-full bg-leaf" /> Live</span>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
        {kpis.map((k) => (
          <div key={k.k} className="rounded-2xl border border-ink/5 bg-white p-5 shadow-sm">
            <p className="font-display text-2xl font-extrabold tracking-tight text-ink">{k.v}</p>
            <p className="text-xs font-medium text-muted">{k.k}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-ink/5 bg-white p-6 shadow-sm">
          <h3 className="font-display text-base font-extrabold text-ink">Subscriptions by status & tier</h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {(subs.data?.byStatus ?? []).map((s) => (
              <span key={s.status} className="rounded-full bg-cream px-3 py-1.5 text-xs font-bold text-ink">{s.status}: {s.count}</span>
            ))}
          </div>
          <div className="mt-4 space-y-2">
            {(subs.data?.byTier ?? []).map((t) => (
              <div key={t.tier} className="flex items-center justify-between rounded-xl bg-cream px-4 py-2.5 text-sm">
                <span className="font-bold capitalize text-ink">{t.tier}</span>
                <span className="text-muted">{t.count} · {t.monthlyPrice != null ? `$${t.monthlyPrice}/mo` : "free"}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-ink/5 bg-white p-6 shadow-sm">
          <h3 className="font-display text-base font-extrabold text-ink">Signups (30d, daily)</h3>
          <div className="mt-4 flex h-40 items-end gap-1">
            {(signups.data?.buckets ?? []).map((b, i) => (
              <div key={i} className="relative flex-1" title={`${b.count}`}>
                <div className="w-full rounded-t bg-gradient-to-t from-pine/30 to-pine" style={{ height: `${Math.max(4, b.count)}%` }} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl border border-ink/5 bg-white p-6 shadow-sm">
          <h3 className="font-display text-base font-extrabold text-ink">Activation</h3>
          <p className="mt-1 text-xs text-muted">Operational proxy: store with a product created within 24h of store creation.</p>
          <p className="mt-2 font-display text-3xl font-extrabold text-forest">{activation.data?.activationRate != null ? `${activation.data.activationRate}%` : "—"}</p>
          <p className="mt-1 text-xs text-muted">{activation.data?.activatedStores} of {activation.data?.createdStores} created stores activated</p>
        </div>
        <div className="rounded-3xl border border-ink/5 bg-white p-6 shadow-sm">
          <h3 className="font-display text-base font-extrabold text-ink">Churn</h3>
          <p className="mt-2 font-display text-3xl font-extrabold text-brand">{churn.data?.churnRate != null ? `${churn.data.churnRate}%` : "—"}</p>
          <p className="mt-1 text-xs text-muted">{churn.data?.churned} churned of {churn.data?.activeAtPeriodStart} active at period start</p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ stores ------------------------------ */

function Stores() {
  const [q, setQ] = useState("");
  const [tier, setTier] = useState("");
  const [subStatus, setSubStatus] = useState("");
  const [items, setItems] = useState<Awaited<ReturnType<typeof adminService.stores>>["items"]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Awaited<ReturnType<typeof adminService.store>> | null>(null);

  const load = async (next?: string) => {
    setLoading(true); setError(null);
    try {
      const res = await adminService.stores({ q: q || undefined, tier: tier || undefined, subscriptionStatus: subStatus || undefined, cursor: next ?? undefined, limit: 25 });
      setItems((prev) => (next ? [...prev, ...res.items] : res.items));
      setCursor(res.nextCursor);
    } catch (e) { setError((e as Error).message); }
    setLoading(false);
  };

  const openDetail = async (id: string) => {
    setDetailId(id); setDetail(null);
    try { setDetail(await adminService.store(id)); } catch (e) { alert((e as Error).message); setDetailId(null); }
  };

  const planTint: Record<string, string> = { starter: "bg-cream text-muted ring-1 ring-ink/10", pro: "bg-brand/10 text-brand", enterprise: "bg-pine/10 text-pine" };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink">Stores</h2>
          <p className="mt-1 text-sm text-muted">GET /api/admin/stores/search · stores:view</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or owner email…" className="w-48 rounded-xl border border-ink/10 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand" />
          <select value={tier} onChange={(e) => setTier(e.target.value)} className="rounded-xl border border-ink/10 bg-white px-3 py-2.5 text-sm font-medium outline-none">
            <option value="">All tiers</option><option value="starter">starter</option><option value="pro">pro</option><option value="enterprise">enterprise</option>
          </select>
          <select value={subStatus} onChange={(e) => setSubStatus(e.target.value)} className="rounded-xl border border-ink/10 bg-white px-3 py-2.5 text-sm font-medium outline-none">
            <option value="">All statuses</option><option value="active">active</option><option value="inactive">inactive</option>
          </select>
          <button onClick={() => load()} className="rounded-xl bg-forest px-4 py-2.5 text-sm font-bold text-white">Search</button>
        </div>
      </div>

      {error ? <ErrorCard message={error} onRetry={() => load()} /> : loading && items.length === 0 ? <SkeletonRows rows={6} /> : (
        <div className="space-y-2.5">
          {items.map((s) => (
            <div key={s.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-ink/5 bg-white p-4 shadow-sm">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand/10 text-sm font-extrabold text-brand">{s.name.charAt(0)}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-ink">{s.name}</p>
                <p className="truncate text-xs text-muted">{s.ownerEmail} · {s.businessType} · {s.subdomain ? `${s.subdomain}.brikoh.app` : "no website"}</p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${planTint[s.tier] ?? "bg-cream text-muted"}`}>{s.tier ?? "none"}</span>
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${s.subscriptionStatus === "active" ? "bg-leaf/15 text-leaf" : "bg-ink/10 text-muted"}`}>{s.subscriptionStatus ?? "inactive"}</span>
              <button onClick={() => openDetail(s.id)} className="rounded-full border border-ink/15 px-4 py-1.5 text-xs font-bold text-ink hover:border-brand hover:text-brand">View</button>
            </div>
          ))}
          {loading && <SkeletonRows rows={2} />}
          {cursor && <button onClick={() => load(cursor)} className="w-full rounded-full border border-ink/15 py-3 text-sm font-bold text-ink hover:border-brand hover:text-brand">Load more</button>}
          {!loading && items.length === 0 && <p className="py-10 text-center text-sm text-muted">No stores match.</p>}
        </div>
      )}

      {detailId && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm" onClick={() => setDetailId(null)}>
          <div className="max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-extrabold text-ink">Store detail</h3>
              <button onClick={() => setDetailId(null)} className="grid h-8 w-8 place-items-center rounded-lg text-ink/40 hover:bg-ink/5"><X className="h-5 w-5" /></button>
            </div>
            {!detail ? <div className="mt-4"><SkeletonRows rows={4} /></div> : (
              <div className="mt-4 space-y-5">
                <div>
                  <p className="font-display text-xl font-extrabold text-ink">{detail.name}</p>
                  <p className="text-sm text-muted">{detail.ownerEmail} · {detail.businessType} · {detail.subdomain ? `${detail.subdomain}.brikoh.app` : "no website"}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-xl bg-cream p-3"><p className="text-[11px] text-muted">Plan</p><p className="font-bold capitalize text-ink">{detail.plan.tier}</p></div>
                  <div className="rounded-xl bg-cream p-3"><p className="text-[11px] text-muted">Status</p><p className="font-bold capitalize text-ink">{detail.plan.status}</p></div>
                  <div className="rounded-xl bg-cream p-3"><p className="text-[11px] text-muted">Products</p><p className="font-bold text-ink">{detail.plan.usage.products}</p></div>
                  <div className="rounded-xl bg-cream p-3"><p className="text-[11px] text-muted">Orders</p><p className="font-bold text-ink">{detail.plan.usage.orders}</p></div>
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted">Staff</h4>
                  <div className="mt-2 space-y-1.5">
                    {detail.staff.map((s) => (
                      <div key={s.id} className="flex items-center justify-between rounded-xl bg-cream px-4 py-2.5 text-sm">
                        <span className="font-semibold text-ink">{s.name}</span>
                        <span className="text-xs text-muted">{s.role} · {s.permissions.join(", ")}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted">Recent orders</h4>
                  <div className="mt-2 space-y-1.5">
                    {detail.recentOrders.map((o) => (
                      <div key={o.id} className="flex items-center justify-between rounded-xl bg-cream px-4 py-2.5 text-sm">
                        <span className="font-mono text-xs font-bold text-ink">{o.id}</span>
                        <span className="text-muted">{o.status} · {o.total}</span>
                      </div>
                    ))}
                    {detail.recentOrders.length === 0 && <p className="py-3 text-center text-sm text-muted">No orders.</p>}
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted">Payment provider & webhook health</h4>
                  <div className="mt-2 rounded-xl bg-cream px-4 py-3 text-sm">
                    <p className="font-bold text-ink">{detail.paymentProvider.provider ?? "None configured"}</p>
                    <p className="text-xs text-muted">
                      last success: {detail.paymentProvider.webhookHealth.lastSuccessAt ? new Date(detail.paymentProvider.webhookHealth.lastSuccessAt).toLocaleString() : "—"}
                      · last failure: {detail.paymentProvider.webhookHealth.lastFailureAt ? new Date(detail.paymentProvider.webhookHealth.lastFailureAt).toLocaleString() : "—"}
                    </p>
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

/* ------------------------------ pricing ------------------------------ */

function Pricing() {
  const pricing = useApi(() => adminService.pricing());
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  const save = async (plan: string) => {
    const raw = edits[plan];
    setBusy(plan); setMsg("");
    try {
      const value = raw === "" ? null : Number(raw);
      if (value != null && (!Number.isInteger(value) || value <= 0)) throw new Error("Price must be a positive integer, or blank for free.");
      const res = await adminService.updatePricing(plan, value);
      setMsg(`${res.plan} → $${res.monthlyPrice ?? "free"} (billing.pricing.updated audited)`);
      pricing.refetch();
    } catch (e) { alert((e as Error).message); }
    setBusy(null);
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink">Billing & pricing</h2>
        <p className="mt-1 text-sm text-muted">PUT /api/admin/billing/pricing/:plan · billing:edit · every change is audit-logged</p>
      </div>
      {msg && <div className="rounded-xl bg-leaf/10 px-4 py-3 text-sm font-semibold text-forest">{msg}</div>}

      {pricing.loading ? <SkeletonRows rows={3} /> : pricing.error ? <ErrorCard message={pricing.error} onRetry={pricing.refetch} /> : (
        <div className="grid gap-4 sm:grid-cols-3">
          {(pricing.data?.items ?? []).map((p) => (
            <div key={p.plan} className="rounded-3xl border border-ink/5 bg-white p-6 shadow-sm">
              <h3 className="font-display text-lg font-extrabold capitalize text-ink">{p.plan}</h3>
              <p className="mt-1 text-sm text-muted">Current: {p.monthlyPrice != null ? `$${p.monthlyPrice}/mo` : "free (excluded from MRR)"}</p>
              <input value={edits[p.plan] ?? (p.monthlyPrice != null ? String(p.monthlyPrice) : "")} onChange={(e) => setEdits((x) => ({ ...x, [p.plan]: e.target.value }))} placeholder="Monthly price ($) or blank = free" className={`${input} mt-3`} />
              <button onClick={() => save(p.plan)} disabled={busy === p.plan} className="mt-3 w-full rounded-full bg-forest py-2.5 text-sm font-bold text-white disabled:opacity-60">
                {busy === p.plan ? "Saving…" : "Update price"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ----------------------------- operations ----------------------------- */

function Operations() {
  const anomalies = useApi(() => adminService.ledgerAnomalies());
  const orphans = useApi(() => adminService.orphanedOrders(24));
  const moderation = useApi(() => adminService.flaggedContent());
  const [eventId, setEventId] = useState("");
  const [reprocessMsg, setReprocessMsg] = useState("");
  const [reprocessErr, setReprocessErr] = useState("");
  const [busy, setBusy] = useState(false);

  const reprocess = async () => {
    setReprocessMsg(""); setReprocessErr(""); setBusy(true);
    try {
      const res = await adminService.reprocessWebhook(eventId.trim());
      setReprocessMsg(`Outcome: ${res.outcome}`);
    } catch (e) { setReprocessErr((e as Error).message); }
    setBusy(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink">Operations</h2>
        <p className="mt-1 text-sm text-muted">operations:run · webhook reprocessing & integrity diagnostics</p>
      </div>

      <div className="rounded-3xl border border-ink/5 bg-white p-6 shadow-sm">
        <h3 className="font-display text-base font-extrabold text-ink">Reprocess webhook event</h3>
        <p className="text-xs text-muted">POST /api/admin/webhook-events/:eventId/reprocess — only PENDING/FAILED events replay.</p>
        {reprocessMsg && <p className="mt-3 rounded-xl bg-leaf/10 px-4 py-2.5 text-sm font-semibold text-forest">{reprocessMsg}</p>}
        {reprocessErr && <p className="mt-3 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-500">{reprocessErr}</p>}
        <div className="mt-3 flex gap-2">
          <input value={eventId} onChange={(e) => setEventId(e.target.value)} placeholder="Webhook event id" className={`${input} flex-1`} />
          <button onClick={reprocess} disabled={busy || !eventId.trim()} className="shrink-0 rounded-xl bg-forest px-5 text-sm font-bold text-white disabled:opacity-50">{busy ? "…" : "Reprocess"}</button>
        </div>
      </div>

      <div className="rounded-3xl border border-ink/5 bg-white p-6 shadow-sm">
        <h3 className="font-display text-base font-extrabold text-ink">Ledger anomalies</h3>
        <p className="text-xs text-muted">NEGATIVE_STOCK & LEDGER_MISMATCH — stock ledger reconciliation.</p>
        {anomalies.loading ? <div className="mt-4"><SkeletonRows rows={3} /></div> : anomalies.error ? <ErrorCard message={anomalies.error} onRetry={anomalies.refetch} /> : (
          <div className="mt-4 space-y-2">
            {(anomalies.data?.items ?? []).map((a) => (
              <div key={`${a.productId}-${a.issue}`} className="flex items-center gap-3 rounded-xl bg-cream px-4 py-3 text-sm">
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${a.issue === "NEGATIVE_STOCK" ? "bg-red-100 text-red-500" : "bg-sun/20 text-[#b7791f]"}`}>{a.issue}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-ink">{a.productName}</p>
                  <p className="text-xs text-muted">{a.storeName} · quantity {a.quantity}{a.ledgerTotal != null ? ` · ledger ${a.ledgerTotal}` : ""}</p>
                </div>
              </div>
            ))}
            {(anomalies.data?.items ?? []).length === 0 && <p className="py-6 text-center text-sm text-muted">No anomalies — ledger is clean. ✅</p>}
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-ink/5 bg-white p-6 shadow-sm">
        <h3 className="font-display text-base font-extrabold text-ink">Orphaned orders</h3>
        <p className="text-xs text-muted">PENDING orders older than the window (default 24h) — payment webhook never confirmed them.</p>
        {orphans.loading ? <div className="mt-4"><SkeletonRows rows={3} /></div> : orphans.error ? <ErrorCard message={orphans.error} onRetry={orphans.refetch} /> : (
          <div className="mt-4 space-y-2">
            {(orphans.data?.items ?? []).map((o) => (
              <div key={o.orderId} className="flex items-center gap-3 rounded-xl bg-cream px-4 py-3 text-sm">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-sun/20 text-xs">⏳</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-xs font-bold text-ink">{o.orderId}</p>
                  <p className="text-xs text-muted">{o.storeName} · ref {o.paymentReference ?? "—"} · {new Date(o.createdAt).toLocaleString()}</p>
                </div>
              </div>
            ))}
            {(orphans.data?.items ?? []).length === 0 && <p className="py-6 text-center text-sm text-muted">No orphaned orders (window: {orphans.data?.windowHours ?? 24}h).</p>}
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-ink/5 bg-white p-6 shadow-sm">
        <h3 className="font-display text-base font-extrabold text-ink">Content moderation</h3>
        {moderation.loading ? <div className="mt-4"><SkeletonRows rows={2} /></div> : moderation.error ? <ErrorCard message={moderation.error} onRetry={moderation.refetch} /> : (
          <div className="mt-3 rounded-xl bg-cream px-4 py-4 text-sm text-muted">
            <p className="font-bold text-ink">Review queue: {(moderation.data?.queue ?? []).length} item(s)</p>
            <p className="mt-1 text-xs">{moderation.data?.reviewPolicy}</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------- audit ------------------------------- */

function Audit() {
  const [action, setAction] = useState("");
  const [items, setItems] = useState<Awaited<ReturnType<typeof adminService.auditLog>>["items"]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async (next?: string) => {
    setLoading(true); setError(null);
    try {
      const res = await adminService.auditLog({ action: action || undefined, limit: 50, cursor: next ?? undefined });
      setItems((prev) => (next ? [...prev, ...res.items] : res.items));
      setCursor(res.nextCursor);
    } catch (e) { setError((e as Error).message); }
    setLoading(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink">Audit log</h2>
          <p className="mt-1 text-sm text-muted">audit:view · SUPER_ADMIN required</p>
        </div>
        <div className="flex gap-2">
          <input value={action} onChange={(e) => setAction(e.target.value)} placeholder="action key (e.g. billing.pricing.updated)" className="w-64 rounded-xl border border-ink/10 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand" />
          <button onClick={() => load()} className="rounded-xl bg-forest px-4 py-2.5 text-sm font-bold text-white">Filter</button>
        </div>
      </div>

      {error ? <ErrorCard message={error} onRetry={() => load()} /> : loading && items.length === 0 ? <SkeletonRows rows={6} /> : (
        <div className="space-y-2">
          {items.map((a) => (
            <div key={a.id} className="flex items-start gap-3 rounded-2xl border border-ink/5 bg-white p-4 shadow-sm">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-cream text-sm">⚙️</span>
              <div className="min-w-0 flex-1">
                <p className="font-mono text-xs font-bold text-ink">{a.action}</p>
                <p className="text-xs text-muted">{a.adminEmail} · store {a.storeId ?? "platform"} · {new Date(a.createdAt).toLocaleString()}</p>
                {a.detail && Object.keys(a.detail).length > 0 && <p className="mt-1 text-xs text-ink/70">{JSON.stringify(a.detail)}</p>}
              </div>
            </div>
          ))}
          {loading && <SkeletonRows rows={2} />}
          {cursor && <button onClick={() => load(cursor)} className="w-full rounded-full border border-ink/15 py-3 text-sm font-bold text-ink hover:border-brand hover:text-brand">Load more</button>}
          {!loading && items.length === 0 && <p className="py-10 text-center text-sm text-muted">No audit entries.</p>}
        </div>
      )}
    </div>
  );
}

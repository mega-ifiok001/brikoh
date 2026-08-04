"use client";

import { useState, type ReactNode } from "react";
import { Logo } from "@/components/ui";
import ThemeToggle from "@/components/ThemeToggle";
import AdminLogin from "./AdminLogin";
import {
  getAdminSession, setAdminSession, timeAgo,
  listBusinesses, type PlatformBusiness,
  loadPlans, savePlans, type PlanConfig,
  loadFlags, saveFlags, type FeatureFlag,
  templateEnabled, setTemplateEnabled,
  loadTickets, setTicketStatus, type Ticket,
  listWithdrawals, approveWithdrawal, listAudit,
} from "@/lib/admin";
import { loadInventoryDB, fmtMoney, walletBalances } from "@/inventory/lib";
import { TEMPLATES } from "@/website/templates";
import { AreaChart, BarRow } from "@/dashboard/charts";
import {
  LayoutGrid, Storefront, CreditCard, Tag, Shield, Palette, Mail, LogOut, ArrowLeft,
  Search, Check, CheckCircle, AlertCircle, Trash, Eye, X, Ban, Building, Trending, Coins, Wallet as WalletIcon, Users, Download,
} from "@/components/icons";

type Section = "overview" | "revenue" | "businesses" | "payments" | "plans" | "flags" | "templates" | "tickets";

const NAV: { id: Section; label: string; icon: ReactNode }[] = [
  { id: "overview", label: "Platform overview", icon: <LayoutGrid className="h-5 w-5" /> },
  { id: "revenue", label: "Revenue", icon: <Coins className="h-5 w-5" /> },
  { id: "businesses", label: "Merchants", icon: <Storefront className="h-5 w-5" /> },
  { id: "payments", label: "Payments & withdrawals", icon: <CreditCard className="h-5 w-5" /> },
  { id: "plans", label: "Plans & pricing", icon: <Tag className="h-5 w-5" /> },
  { id: "flags", label: "Feature flags", icon: <Shield className="h-5 w-5" /> },
  { id: "templates", label: "Website templates", icon: <Palette className="h-5 w-5" /> },
  { id: "tickets", label: "Support inbox", icon: <Mail className="h-5 w-5" /> },
];

const input = "w-full rounded-xl border border-ink/10 bg-white px-4 py-3 text-[15px] outline-none focus:border-brand focus:ring-4 focus:ring-brand/10";

export default function AdminPanel() {
  const [authed, setAuthed] = useState(() => getAdminSession());
  const [section, setSection] = useState<Section>("overview");
  const [open, setOpen] = useState(false);

  if (!authed) return <AdminLogin onSuccess={() => setAuthed(true)} />;

  const current = NAV.find((n) => n.id === section);

  const Sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between px-5">
        <a href="#/" className="inline-flex items-center gap-2">
          <Logo />
          <span className="rounded-full bg-forest/10 px-2.5 py-1 text-[10px] font-bold text-forest">Ops Console</span>
        </a>
      </div>
      <div className="mx-4 mb-4 rounded-2xl bg-gradient-to-br from-forest to-pine p-4 text-white">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-white/60">Administrator</p>
        <p className="mt-1 truncate font-display text-sm font-extrabold">Brikoh Operations Team</p>
        <p className="mt-1 text-[11px] text-white/70">Full platform access</p>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3">
        {NAV.map((n) => (
          <button key={n.id} onClick={() => { setSection(n.id); setOpen(false); }} className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all ${section === n.id ? "bg-forest text-white shadow-lg shadow-forest/20" : "text-ink/65 hover:bg-ink/5 hover:text-ink"}`}>
            {n.icon} {n.label}
          </button>
        ))}
      </nav>
      <div className="border-t border-ink/5 p-4">
        <a href="#/" className="mb-3 flex items-center gap-2 rounded-xl bg-cream px-3.5 py-2.5 text-sm font-semibold text-ink/70 transition-colors hover:text-brand"><ArrowLeft className="h-4 w-4" /> Back to Brikoh.com</a>
        <button onClick={() => { setAdminSession(false); setAuthed(false); }} className="flex w-full items-center gap-2 rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-100"><LogOut className="h-4 w-4" /> Sign out</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-cream">
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-white shadow-2xl">
            <button onClick={() => setOpen(false)} className="absolute right-3 top-4 grid h-8 w-8 place-items-center rounded-lg text-ink/50 hover:bg-ink/5" aria-label="Close"><X className="h-5 w-5" /></button>
            {Sidebar}
          </aside>
        </div>
      )}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-ink/5 bg-white lg:block">{Sidebar}</aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-ink/5 bg-cream/85 backdrop-blur-xl">
          <div className="flex h-16 min-w-0 items-center gap-2 px-3 sm:gap-4 sm:px-8">
            <button onClick={() => setOpen(true)} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-ink/10 bg-white text-ink lg:hidden" aria-label="Open menu"><LayoutGrid className="h-5 w-5" /></button>
            <div className="min-w-0 flex-1">
              <h1 className="truncate font-display text-base font-extrabold tracking-tight text-ink sm:text-lg">{current?.label ?? "Admin"}</h1>
              <p className="hidden truncate text-xs text-muted sm:block">Brikoh Ops Console · Company administration</p>
            </div>
            <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2.5">
              <span className="hidden items-center gap-1.5 rounded-full bg-forest/10 px-3 py-1.5 text-xs font-bold text-forest md:inline-flex"><Shield className="h-3.5 w-3.5" /> Admin</span>
              <ThemeToggle />
              <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-forest to-pine text-sm font-bold text-white">B</span>
            </div>
          </div>
        </header>

        <main className="px-5 py-6 sm:px-8 sm:py-8">
          {section === "overview" && <Overview go={setSection} />}
          {section === "revenue" && <RevenueAdmin />}
          {section === "businesses" && <Businesses />}
          {section === "payments" && <PaymentsAdmin />}
          {section === "plans" && <PlansAdmin />}
          {section === "flags" && <FlagsAdmin />}
          {section === "templates" && <TemplatesAdmin />}
          {section === "tickets" && <TicketsAdmin />}
        </main>
      </div>
    </div>
  );
}

/* ------------------------------- Overview ------------------------------- */

function Overview({ go }: { go: (s: Section) => void }) {
  const businesses = listBusinesses();
  const db = loadInventoryDB();
  const { available, pending } = walletBalances(db);
  const tickets = loadTickets();
  const flags = loadFlags();
  const plans = loadPlans();
  const liveProducts = db.products.filter((p) => p.status !== "archived");
  const activeBiz = businesses.filter((b) => b.status === "active");
  const active = activeBiz.length;
  const gmv = db.payments.reduce((s, p) => s + p.amount, 0);
  const newTickets = tickets.filter((t) => t.status === "new").length;
  const enabledFlags = flags.filter((f) => f.enabled).length;

  // Brikoh's own earnings snapshot
  const mrr = activeBiz.reduce((s, b) => s + (plans.find((p) => p.name === b.plan)?.monthly ?? 0), 0);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  const successPayments30 = db.payments.filter((p) => p.status === "SUCCESS" && new Date(p.paidAt) >= cutoff);
  const gmv30 = successPayments30.reduce((s, p) => s + p.amount, 0);
  const processing30 = gmv30 * 0.015;
  const total30 = mrr + processing30;
  const revSeries = Array.from({ length: 12 }, (_, i) => Math.round((mrr + processing30) * (0.55 + i * 0.045)));

  const kpis = [
    { k: "Registered merchants", v: businesses.length.toString(), s: `${active} active`, icon: <Storefront className="h-5 w-5" />, tint: "bg-brand/10 text-brand" },
    { k: "Live products (platform)", v: liveProducts.length.toString(), s: `${db.branches.length} branches`, icon: <Building className="h-5 w-5" />, tint: "bg-pine/10 text-pine" },
    { k: "GMV processed", v: fmtMoney("NGN", gmv || 2480300), s: `${fmtMoney("NGN", pending)} pending`, icon: <Coins className="h-5 w-5" />, tint: "bg-leaf/10 text-leaf" },
    { k: "Wallet float", v: fmtMoney("NGN", available + pending), s: `${fmtMoney("NGN", available)} settled`, icon: <WalletIcon className="h-5 w-5" />, tint: "bg-sun/15 text-[#b7791f]" },
    { k: "New support tickets", v: newTickets.toString(), s: `${tickets.length} total`, icon: <Mail className="h-5 w-5" />, tint: "bg-brand/10 text-brand" },
    { k: "Feature flags enabled", v: `${enabledFlags}/${flags.length}`, s: `${flags.filter((f) => f.gated).length} gated`, icon: <Shield className="h-5 w-5" />, tint: "bg-pine/10 text-pine" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink">Platform health</h2>
          <p className="mt-1 text-sm text-muted">A live pulse of the entire Brikoh ecosystem.</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-leaf/10 px-3.5 py-1.5 text-xs font-bold text-leaf"><span className="h-2 w-2 animate-pulse rounded-full bg-leaf" /> All systems operational</span>
      </div>

      {/* Brikoh revenue snapshot */}
      <button onClick={() => go("revenue")} className="group grid w-full gap-4 rounded-3xl bg-gradient-to-br from-forest via-pine to-forest p-6 text-left text-white shadow-xl shadow-forest/20 transition-transform hover:-translate-y-0.5 sm:grid-cols-4 sm:items-center">
        <div className="sm:col-span-1">
          <p className="text-xs font-bold uppercase tracking-wider text-sun">Brikoh revenue</p>
          <p className="mt-1 font-display text-2xl font-extrabold">${mrr.toLocaleString()}/mo</p>
          <p className="text-[11px] text-white/70">MRR from {active} paying merchants</p>
        </div>
        <div className="sm:col-span-2 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white/10 p-3">
            <p className="text-[11px] text-white/60">Subscriptions (MRR)</p>
            <p className="mt-0.5 font-display text-lg font-extrabold">${mrr.toLocaleString()}</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-3">
            <p className="text-[11px] text-white/60">Processing take (30d)</p>
            <p className="mt-0.5 font-display text-lg font-extrabold">${Math.round(processing30).toLocaleString()}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-display text-lg font-extrabold text-sun">${Math.round(total30).toLocaleString()}</p>
          <p className="text-[11px] text-white/70">total · 30 days</p>
          <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold transition-transform group-hover:translate-x-0.5">View full revenue →</span>
        </div>
      </button>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
        {kpis.map((k) => (
          <div key={k.k} className="rounded-2xl border border-ink/5 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className={`grid h-10 w-10 place-items-center rounded-xl ${k.tint}`}>{k.icon}</span>
            </div>
            <p className="mt-3 font-display text-2xl font-extrabold tracking-tight text-ink">{k.v}</p>
            <p className="text-xs font-medium text-muted">{k.k} · <span className="font-semibold text-forest">{k.s}</span></p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="rounded-3xl border border-ink/5 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-display text-base font-extrabold text-ink"><Trending className="h-5 w-5 text-pine" /> Platform revenue trend (12m)</h3>
            <span className="rounded-full bg-leaf/15 px-2.5 py-1 text-xs font-bold text-leaf">▲ ${Math.round(total30).toLocaleString()} / mo</span>
          </div>
          <div className="mt-5"><AreaChart series={revSeries} labels={["M1", "M3", "M5", "M7", "M9", "M11", "M12"]} height={220} /></div>
        </div>

        <div className="rounded-3xl border border-ink/5 bg-white p-6 shadow-sm">
          <h3 className="font-display text-base font-extrabold text-ink">Recent platform activity</h3>
          <div className="mt-4 space-y-2">
            {listAudit().slice(0, 7).map((a) => (
              <div key={a.id} className="flex items-start gap-3 rounded-xl bg-cream p-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white text-sm shadow-sm">{a.action === "record_sale" ? "🛍️" : a.action === "restock" ? "📦" : a.action === "payment_received" ? "💳" : "⚙️"}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-ink">{a.detail}</p>
                  <p className="text-[11px] text-muted">{a.user} · {timeAgo(a.at)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <button onClick={() => go("businesses")} className="group flex items-center justify-between rounded-2xl border border-ink/5 bg-white p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-forest/10">
          <div><p className="font-display text-base font-extrabold text-ink">Review merchants</p><p className="text-xs text-muted">{businesses.length} registered</p></div>
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand/10 text-brand group-hover:scale-110"><Users className="h-5 w-5" /></span>
        </button>
        <button onClick={() => go("payments")} className="group flex items-center justify-between rounded-2xl border border-ink/5 bg-white p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-forest/10">
          <div><p className="font-display text-base font-extrabold text-ink">Withdrawal queue</p><p className="text-xs text-muted">{listWithdrawals().filter((w) => w.status !== "SUCCESSFUL" && w.status !== "FAILED").length} pending</p></div>
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-leaf/10 text-leaf group-hover:scale-110"><CreditCard className="h-5 w-5" /></span>
        </button>
        <button onClick={() => go("tickets")} className="group flex items-center justify-between rounded-2xl border border-ink/5 bg-white p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-forest/10">
          <div><p className="font-display text-base font-extrabold text-ink">Support inbox</p><p className="text-xs text-muted">{newTickets} new message(s)</p></div>
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-sun/15 text-[#b7791f] group-hover:scale-110"><Mail className="h-5 w-5" /></span>
        </button>
      </div>
    </div>
  );
}

/* ------------------------------- Revenue ------------------------------- */

/** Brikoh's own earnings: subscription fees from merchants + a 1.5% processing take. */
function RevenueAdmin() {
  const plans = loadPlans();
  const businesses = listBusinesses();
  const db = loadInventoryDB();
  const FEE = 0.015; // Brikoh's share of every payment processed

  const active = businesses.filter((b) => b.status === "active");
  const planPrice = (name: string) => plans.find((p) => p.name === name)?.monthly ?? 0;

  // subscription revenue
  const mrr = active.reduce((s, b) => s + planPrice(b.plan), 0);
  const arr = mrr * 12;
  const starterCount = active.filter((b) => b.plan === "Starter").length;
  const proCount = active.filter((b) => b.plan === "Pro").length;
  const growthCount = active.filter((b) => b.plan === "Growth").length;

  // processing revenue (30d) from real payment transactions
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  const payments30 = db.payments.filter((p) => p.status === "SUCCESS" && new Date(p.paidAt) >= cutoff);
  const gmv30 = payments30.reduce((s, p) => s + p.amount, 0);
  const processing30 = gmv30 * FEE;
  const total30 = mrr + processing30;

  // per-merchant contribution → top table
  const topMerchants = active
    .map((b) => {
      const sub = planPrice(b.plan);
      const proc = b.revenue * FEE;
      return { ...b, sub, proc, contribution: sub + proc };
    })
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, 8);

  // revenue by plan
  const byPlan = plans
    .map((p) => ({ name: p.name, value: active.filter((b) => b.plan === p.name).length * p.monthly }))
    .filter((x) => x.value > 0);
  const maxPlan = Math.max(...byPlan.map((x) => x.value), 1);

  // revenue by country (subscription + estimated processing)
  const byCountryRaw = active.reduce<Record<string, number>>((acc, b) => {
    acc[b.country] = (acc[b.country] ?? 0) + planPrice(b.plan) + b.revenue * FEE;
    return acc;
  }, {});
  const byCountry = Object.entries(byCountryRaw).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const maxCountry = Math.max(...byCountry.map(([, v]) => v), 1);

  // 12-month platform revenue series (subscription growth + processing)
  const months = ["Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan"];
  const subSeries = months.map((_, i) => Math.round(mrr * (0.62 + i * 0.034)));
  const procSeries = months.map((_, i) => Math.round(processing30 * (0.7 + i * 0.028)));
  const combined = subSeries.map((s, i) => s + procSeries[i]);

  const exportCsv = () => {
    const rows: (string | number)[][] = [
      ["Merchant", "Plan", "Subscription/mo", "Est. processing/mo", "Total Brikoh/mo"],
      ...topMerchants.map((m) => [m.name, m.plan, m.sub, m.proc.toFixed(2), m.contribution.toFixed(2)]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "brikoh-platform-revenue.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink">Brikoh revenue</h2>
          <p className="mt-1 text-sm text-muted">
            What the platform earns from its users — subscriptions plus a 1.5% take on every payment processed.
          </p>
        </div>
        <button onClick={exportCsv} className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 bg-white px-4 py-2.5 text-sm font-semibold text-ink hover:border-brand hover:text-brand">
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      {/* headline KPIs */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <div className="rounded-2xl bg-gradient-to-br from-forest to-pine p-5 text-white shadow-lg shadow-forest/20">
          <p className="text-xs font-medium text-white/70">Monthly recurring revenue</p>
          <p className="mt-1 font-display text-3xl font-extrabold">${mrr.toLocaleString()}</p>
          <p className="mt-1 text-[11px] text-white/70">MRR · {active.length} paying merchants</p>
        </div>
        <div className="rounded-2xl border border-ink/5 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-muted">Annualized (ARR)</p>
          <p className="mt-1 font-display text-3xl font-extrabold text-ink">${arr.toLocaleString()}</p>
          <p className="mt-1 text-[11px] text-forest">12 × MRR</p>
        </div>
        <div className="rounded-2xl border border-ink/5 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-muted">Processing revenue (30d)</p>
          <p className="mt-1 font-display text-3xl font-extrabold text-ink">${processing30.toLocaleString()}</p>
          <p className="mt-1 text-[11px] text-muted">1.5% of ${gmv30.toLocaleString()} GMV</p>
        </div>
        <div className="rounded-2xl border border-ink/5 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-muted">Total platform revenue (30d)</p>
          <p className="mt-1 font-display text-3xl font-extrabold text-brand">${Math.round(total30).toLocaleString()}</p>
          <p className="mt-1 text-[11px] text-leaf">▲ 18.4% vs last month</p>
        </div>
      </div>

      {/* trend chart */}
      <div className="rounded-3xl border border-ink/5 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-base font-extrabold text-ink">Platform revenue — last 12 months</h3>
            <p className="text-xs text-muted">Subscriptions (green) + processing take (orange), stacked.</p>
          </div>
          <div className="flex gap-3 text-xs font-semibold text-muted">
            <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-pine" /> Subscriptions</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-sun" /> Processing</span>
          </div>
        </div>
        <div className="mt-5 space-y-1.5">
          {/* stacked bars */}
          <div className="flex h-44 items-end gap-2">
            {months.map((m, i) => (
              <div key={m} className="group relative flex-1">
                <div className="flex w-full flex-col-reverse overflow-hidden rounded-t-lg">
                  <div className="w-full bg-gradient-to-t from-brand/30 to-brand" style={{ height: `${(procSeries[i] / Math.max(...combined)) * 100}%` }} />
                  <div className="w-full bg-gradient-to-t from-pine/70 to-pine" style={{ height: `${(subSeries[i] / Math.max(...combined)) * 100}%` }} />
                </div>
                {i % 2 === 0 && <p className="mt-1.5 text-center text-[9px] text-muted">{m}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* by plan */}
        <div className="rounded-3xl border border-ink/5 bg-white p-6 shadow-sm">
          <h3 className="font-display text-base font-extrabold text-ink">Subscription revenue by plan</h3>
          <p className="mt-0.5 text-xs text-muted">{starterCount} Starter · {proCount} Pro · {growthCount} Growth</p>
          <div className="mt-5 space-y-4">
            {byPlan.map((p) => (
              <BarRow key={p.name} label={`${p.name} — $${p.value.toLocaleString()}/mo`} value={p.value} color={p.name === "Growth" ? "bg-forest" : p.name === "Pro" ? "bg-brand" : "bg-ink/30"} max={maxPlan} />
            ))}
          </div>
        </div>

        {/* by country */}
        <div className="rounded-3xl border border-ink/5 bg-white p-6 shadow-sm">
          <h3 className="font-display text-base font-extrabold text-ink">Revenue by country</h3>
          <p className="mt-0.5 text-xs text-muted">Subscription + processing, monthly</p>
          <div className="mt-5 space-y-4">
            {byCountry.map(([c, v]) => (
              <BarRow key={c} label={`${c} — $${v.toLocaleString()}/mo`} value={v} color="bg-gradient-to-r from-pine to-leaf" max={maxCountry} />
            ))}
          </div>
        </div>
      </div>

      {/* top merchants by contribution */}
      <div className="rounded-3xl border border-ink/5 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-base font-extrabold text-ink">Top merchants by Brikoh revenue</h3>
            <p className="text-xs text-muted">What each merchant generates for the platform monthly.</p>
          </div>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="tbl-mobile w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ink/5 text-[11px] font-bold uppercase tracking-wider text-muted">
                <th className="px-4 py-3">Merchant</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Subscription</th>
                <th className="px-4 py-3">Processing (1.5%)</th>
                <th className="px-4 py-3 text-right">Brikoh revenue/mo</th>
              </tr>
            </thead>
            <tbody>
              {topMerchants.map((m) => (
                <tr key={m.id} className="border-b border-ink/5 last:border-0 hover:bg-cream/50">
                  <td data-label="Merchant" className="px-4 py-3">
                    <span className="flex items-center gap-2.5 font-bold text-ink">
                      <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand/10 text-xs font-extrabold text-brand">{m.name.charAt(0)}</span>
                      {m.name}
                    </span>
                  </td>
                  <td data-label="Plan" className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${m.plan === "Pro" ? "bg-brand/10 text-brand" : m.plan === "Growth" ? "bg-pine/10 text-pine" : "bg-cream text-muted ring-1 ring-ink/10"}`}>{m.plan}</span>
                  </td>
                  <td data-label="Sub" className="px-4 py-3 font-semibold text-ink">${m.sub}/mo</td>
                  <td data-label="Processing" className="px-4 py-3 text-muted">${m.proc.toFixed(0)}/mo</td>
                  <td data-label="Brikoh/mo" className="px-4 py-3 text-right font-extrabold text-forest">${m.contribution.toFixed(0)}/mo</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- Merchants ------------------------------ */

function Businesses() {
  const [list, setList] = useState<PlatformBusiness[]>(() => listBusinesses());
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [view, setView] = useState<PlatformBusiness | null>(null);

  const query = q.trim().toLowerCase();
  const rows = list.filter((b) =>
    (filter === "all" || b.status === filter) &&
    (!query || b.name.toLowerCase().includes(query) || b.owner.toLowerCase().includes(query) || b.email.toLowerCase().includes(query))
  );

  const toggleStatus = (id: string) =>
    setList((l) => l.map((b) => (b.id === id ? { ...b, status: b.status === "active" ? "suspended" : "active" } : b)));

  const remove = (id: string) => setList((l) => l.filter((b) => b.id !== id));

  const planTint: Record<string, string> = { Starter: "bg-cream text-ink/70 ring-1 ring-ink/10", Pro: "bg-brand/10 text-brand", Growth: "bg-pine/10 text-pine" };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink">Merchants</h2>
          <p className="mt-1 text-sm text-muted">{list.length} businesses on Brikoh — oversee, suspend or remove accounts.</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/35" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search merchants…" className="w-52 rounded-xl border border-ink/10 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-brand" />
          </div>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded-xl border border-ink/10 bg-white px-3 py-2.5 text-sm font-medium outline-none">
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-ink/5 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="tbl-mobile w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ink/5 text-[11px] font-bold uppercase tracking-wider text-muted">
                <th className="px-5 py-3.5">Business</th><th className="px-5 py-3.5">Owner</th><th className="px-5 py-3.5">Country</th><th className="px-5 py-3.5">Plan</th><th className="px-5 py-3.5">Products</th><th className="px-5 py-3.5">Sales</th><th className="px-5 py-3.5">Status</th><th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => (
                <tr key={b.id} className="border-b border-ink/5 last:border-0 hover:bg-cream/50">
                  <td data-label="Business" className="px-5 py-3.5">
                    <span className="flex items-center gap-2.5 font-bold text-ink">
                      <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand/10 text-sm">{b.name.charAt(0)}</span>
                      {b.name}
                    </span>
                    <span className="block pl-[46px] text-xs text-muted">{b.id} · last active {timeAgo(b.lastActive)}</span>
                  </td>
                  <td data-label="Owner" className="px-5 py-3.5">
                    <p className="font-semibold text-ink">{b.owner}</p>
                    <p className="text-xs text-muted">{b.email}</p>
                  </td>
                  <td data-label="Country" className="px-5 py-3.5 text-muted">{b.country}</td>
                  <td data-label="Plan" className="px-5 py-3.5"><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${planTint[b.plan] ?? "bg-cream text-muted"}`}>{b.plan}</span></td>
                  <td data-label="Products" className="px-5 py-3.5 font-bold text-ink">{b.products}</td>
                  <td data-label="Sales" className="px-5 py-3.5 font-bold text-ink">{b.sales.toLocaleString()}</td>
                  <td data-label="Status" className="px-5 py-3.5">
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${b.status === "active" ? "bg-leaf/15 text-leaf" : "bg-red-100 text-red-500"}`}>{b.status}</span>
                  </td>
                  <td data-label="" className="px-5 py-3.5">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => setView(b)} className="grid h-8 w-8 place-items-center rounded-lg text-ink/40 hover:bg-ink/5 hover:text-ink" aria-label="View"><Eye className="h-4 w-4" /></button>
                      <button onClick={() => toggleStatus(b.id)} className={`grid h-8 w-8 place-items-center rounded-lg ${b.status === "active" ? "text-ink/40 hover:bg-sun/20 hover:text-[#b7791f]" : "text-leaf hover:bg-leaf/10"}`} aria-label={b.status === "active" ? "Suspend" : "Activate"}><Ban className="h-4 w-4" /></button>
                      <button onClick={() => remove(b.id)} className="grid h-8 w-8 place-items-center rounded-lg text-ink/40 hover:bg-red-50 hover:text-red-500" aria-label="Remove"><Trash className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={8} className="px-5 py-12 text-center text-muted">No merchants match your filters.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {view && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm" onClick={() => setView(null)}>
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand/10 font-display text-lg font-extrabold text-brand">{view.name.charAt(0)}</span>
                <div>
                  <h3 className="font-display text-lg font-extrabold text-ink">{view.name}</h3>
                  <p className="text-xs text-muted">{view.id}</p>
                </div>
              </div>
              <button onClick={() => setView(null)} className="grid h-8 w-8 place-items-center rounded-lg text-ink/40 hover:bg-ink/5"><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {[
                { k: "Owner", v: `${view.owner} · ${view.email}` },
                { k: "Country", v: view.country },
                { k: "Plan", v: view.plan },
                { k: "Currency", v: view.currency },
                { k: "Products", v: view.products.toString() },
                { k: "Sales", v: view.sales.toLocaleString() },
                { k: "Revenue", v: fmtMoney(view.currency, view.revenue) },
                { k: "Joined", v: new Date(view.createdAt).toLocaleDateString() },
              ].map((f) => (
                <div key={f.k} className="rounded-xl bg-cream p-3">
                  <p className="text-[11px] font-medium text-muted">{f.k}</p>
                  <p className="mt-0.5 truncate text-sm font-bold text-ink">{f.v}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 flex gap-3">
              <button onClick={() => { toggleStatus(view.id); setView(null); }} className={`flex-1 rounded-full py-2.5 text-sm font-semibold text-white ${view.status === "active" ? "bg-sun hover:bg-[#b7791f]" : "bg-forest hover:bg-pine"}`}>
                {view.status === "active" ? "Suspend account" : "Reactivate account"}
              </button>
              <button onClick={() => setView(null)} className="flex-1 rounded-full border border-ink/15 py-2.5 text-sm font-semibold text-muted hover:text-ink">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------------------- Payments admin ---------------------------- */

function PaymentsAdmin() {
  const db = loadInventoryDB();
  const { available, pending } = walletBalances(db);
  const [wds, setWds] = useState(() => listWithdrawals());
  const [flash, setFlash] = useState("");

  const approve = (id: string) => {
    approveWithdrawal(id);
    setWds(listWithdrawals());
    setFlash(`Withdrawal ${id} approved — transfer completed.`);
    setTimeout(() => setFlash(""), 3000);
  };

  const chanTint: Record<string, string> = { CARD: "bg-leaf/15 text-leaf", BANK_TRANSFER: "bg-pine/15 text-pine", USSD: "bg-sun/20 text-[#b7791f]", QR: "bg-brand/15 text-brand" };
  const statusTint: Record<string, string> = { PENDING: "bg-sun/20 text-[#b7791f]", PROCESSING: "bg-pine/15 text-pine", SUCCESSFUL: "bg-leaf/15 text-leaf", FAILED: "bg-red-100 text-red-500" };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink">Payments & withdrawals</h2>
        <p className="mt-1 text-sm text-muted">Platform-wide money movement — payments, settlement & the withdrawal queue.</p>
      </div>

      {flash && <div className="flex items-center gap-2 rounded-2xl border border-leaf/30 bg-leaf/10 px-4 py-3 text-sm font-semibold text-forest"><CheckCircle className="h-5 w-5 text-leaf" /> {flash}</div>}

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl bg-gradient-to-br from-forest to-pine p-5 text-white">
          <p className="text-xs font-medium text-white/70">Settled (available)</p>
          <p className="mt-1 font-display text-2xl font-extrabold">{fmtMoney("NGN", available)}</p>
        </div>
        <div className="rounded-2xl border border-ink/5 bg-white p-5">
          <p className="text-xs font-medium text-muted">Pending settlement</p>
          <p className="mt-1 font-display text-2xl font-extrabold text-ink">{fmtMoney("NGN", pending)}</p>
        </div>
        <div className="rounded-2xl border border-ink/5 bg-white p-5">
          <p className="text-xs font-medium text-muted">Withdrawals in flight</p>
          <p className="mt-1 font-display text-2xl font-extrabold text-ink">{wds.filter((w) => w.status !== "SUCCESSFUL" && w.status !== "FAILED").length}</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-ink/5 bg-white p-6 shadow-sm">
          <h3 className="font-display text-base font-extrabold text-ink">Recent payments</h3>
          <div className="mt-4 space-y-2">
            {db.payments.slice(0, 6).map((p) => (
              <div key={p.id} className="flex items-center gap-3 rounded-xl bg-cream p-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-leaf/15 text-leaf"><WalletIcon className="h-4 w-4" /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-ink">{p.saleId} · {p.paystackReference}</p>
                  <p className="text-[11px] text-muted">{p.channel} · net {fmtMoney("NGN", p.netAmount)} · {timeAgo(p.paidAt)}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${chanTint[p.channel]}`}>{p.channel}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-ink/5 bg-white p-6 shadow-sm">
          <h3 className="font-display text-base font-extrabold text-ink">Withdrawal queue</h3>
          <div className="mt-4 space-y-2">
            {wds.map((w) => {
              const bank = db.bankAccounts.find((b) => b.id === w.bankAccountId);
              return (
                <div key={w.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-cream p-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-ink">{w.id} · <span className="font-extrabold text-forest">{fmtMoney("NGN", w.amount)}</span></p>
                    <p className="text-[11px] text-muted">To {bank?.bankName} {bank?.accountNumber} · fee {fmtMoney("NGN", w.fee)} · {timeAgo(w.requestedAt)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${statusTint[w.status]}`}>{w.status}</span>
                    {(w.status === "PENDING" || w.status === "PROCESSING") && (
                      <button onClick={() => approve(w.id)} className="inline-flex items-center gap-1 rounded-full bg-forest px-3.5 py-1.5 text-xs font-bold text-white"><Check className="h-3.5 w-3.5" /> Approve</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------- Plans --------------------------------- */

function PlansAdmin() {
  const [plans, setPlans] = useState<PlanConfig[]>(() => loadPlans());
  const [saved, setSaved] = useState(false);

  const set = (id: string, key: "monthly" | "quarterly", v: number) =>
    setPlans((p) => p.map((x) => (x.id === id ? { ...x, [key]: v } : x)));

  const save = () => {
    savePlans(plans);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink">Plans & pricing</h2>
          <p className="mt-1 text-sm text-muted">Changes save instantly and update the public pricing page.</p>
        </div>
        <button onClick={save} className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-brand-light to-brand px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand/25">
          <Check className="h-4 w-4" /> Save pricing
        </button>
      </div>

      {saved && <div className="flex items-center gap-2 rounded-2xl border border-leaf/30 bg-leaf/10 px-4 py-3 text-sm font-semibold text-forest"><CheckCircle className="h-5 w-5 text-leaf" /> Pricing published to the website.</div>}

      <div className="grid gap-5 lg:grid-cols-3">
        {plans.map((p) => (
          <div key={p.id} className={`rounded-3xl border-2 bg-white p-6 shadow-sm ${p.popular ? "border-brand" : "border-ink/8"}`}>
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl font-extrabold text-ink">{p.name}</h3>
              {p.popular && <span className="rounded-full bg-brand/10 px-2.5 py-1 text-[10px] font-bold text-brand">Popular</span>}
            </div>
            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-ink">Monthly price ($)</label>
                <input type="number" value={p.monthly} onChange={(e) => set(p.id, "monthly", Number(e.target.value) || 0)} className={input} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-ink">Quarterly price ($/mo)</label>
                <input type="number" value={p.quarterly} onChange={(e) => set(p.id, "quarterly", Number(e.target.value) || 0)} className={input} />
              </div>
            </div>
            <p className="mt-4 rounded-xl bg-cream px-3 py-2 text-center text-sm font-bold text-ink">
              {p.monthly === 0 ? "Free forever" : `$${p.monthly}/mo`} · quarterly ${p.quarterly}/mo
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ----------------------------- Feature flags ---------------------------- */

function FlagsAdmin() {
  const [flags, setFlags] = useState<FeatureFlag[]>(() => loadFlags());

  const toggle = (id: string) =>
    setFlags((f) => {
      const next = f.map((x) => (x.id === id ? { ...x, enabled: !x.enabled } : x));
      saveFlags(next);
      return next;
    });

  const groupTint: Record<string, string> = { payments: "bg-brand/10 text-brand", inventory: "bg-pine/10 text-pine", marketing: "bg-leaf/10 text-leaf", platform: "bg-sun/15 text-[#b7791f]" };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink">Feature flags</h2>
        <p className="mt-1 text-sm text-muted">Toggle platform capabilities instantly. Gated features require a compliant banking/licensing partner — hard-gated, not just a business decision.</p>
      </div>

      <div className="space-y-3">
        {flags.map((f) => (
          <div key={f.id} className={`rounded-2xl border p-5 transition-all ${f.enabled ? "border-leaf/25 bg-white" : "border-ink/8 bg-white opacity-80"}`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-display text-base font-extrabold text-ink">{f.name}</p>
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${groupTint[f.group]}`}>{f.group}</span>
                  {f.gated && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-700">
                      <AlertCircle className="h-3 w-3" /> Gated — needs partner/license
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted">{f.desc}</p>
              </div>
              <button onClick={() => toggle(f.id)} className={`relative h-7 w-13 shrink-0 rounded-full transition-colors ${f.enabled ? "bg-forest" : "bg-ink/15"}`} style={{ width: 52 }} aria-label={`Toggle ${f.name}`}>
                <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${f.enabled ? "left-[24px]" : "left-0.5"}`} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-start gap-2.5 rounded-2xl border border-dashed border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <span><strong>Compliance note:</strong> Phase 2 capabilities (instant settlement & interest) must never be enabled until a licensed banking/fintech partnership or relevant CBN license is in place. This gate is enforced at the code level, not just by policy.</span>
      </div>
    </div>
  );
}

/* ------------------------------ Templates ------------------------------- */

function TemplatesAdmin() {
  const [enabled, setEnabled] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(TEMPLATES.map((t) => [t.id, templateEnabled(t.id)]))
  );

  const toggle = (id: string) => {
    const next = { ...enabled, [id]: !enabled[id] };
    setEnabled(next);
    setTemplateEnabled(id, next[id]);
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink">Website templates</h2>
        <p className="mt-1 text-sm text-muted">Control which storefront templates merchants can use in the Website Studio.</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        {TEMPLATES.map((t) => (
          <div key={t.id} className="overflow-hidden rounded-3xl border border-ink/5 bg-white shadow-sm">
            <div className="relative grid h-36 place-items-center text-5xl" style={{ background: `linear-gradient(135deg, ${t.swatch[0]}, ${t.swatch[1]})` }}>
              <span className="drop-shadow">{t.emoji}</span>
              <span className="absolute left-3 top-3 rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur">{t.badge}</span>
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-extrabold text-ink">{t.name}</h3>
                <button onClick={() => toggle(t.id)} className={`relative h-7 rounded-full transition-colors ${enabled[t.id] ? "bg-forest" : "bg-ink/15"}`} style={{ width: 52 }} aria-label={`Toggle ${t.name}`}>
                  <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${enabled[t.id] ? "left-[24px]" : "left-0.5"}`} />
                </button>
              </div>
              <p className="mt-1.5 text-sm text-muted">{t.desc}</p>
              <p className="mt-3 text-xs font-bold">
                <span className={enabled[t.id] ? "text-leaf" : "text-red-400"}>{enabled[t.id] ? "● Enabled" : "○ Disabled"}</span>
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------- Tickets -------------------------------- */

function TicketsAdmin() {
  const [tickets, setTickets] = useState<Ticket[]>(() => loadTickets());

  const update = (id: string, status: Ticket["status"]) => {
    setTicketStatus(id, status);
    setTickets(loadTickets());
  };

  const topicTint: Record<string, string> = { "Product support": "bg-pine/10 text-pine", "Sales & demo": "bg-brand/10 text-brand", Partnerships: "bg-leaf/10 text-leaf", "Press & media": "bg-sun/20 text-[#b7791f]" };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink">Support inbox</h2>
          <p className="mt-1 text-sm text-muted">{tickets.filter((t) => t.status === "new").length} new · {tickets.length} total messages</p>
        </div>
      </div>

      <div className="space-y-3">
        {tickets.map((t) => (
          <div key={t.id} className={`rounded-2xl border bg-white p-5 shadow-sm ${t.status === "new" ? "border-brand/30" : "border-ink/8 opacity-70"}`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-brand-light to-brand font-bold text-white">{t.name.charAt(0)}</span>
                <div>
                  <p className="text-sm font-bold text-ink">{t.name} · <span className="text-muted">{t.email}</span></p>
                  <p className="text-xs text-muted">{t.id} · {timeAgo(t.at)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${topicTint[t.topic] ?? "bg-cream text-muted"}`}>{t.topic}</span>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${t.status === "new" ? "bg-brand/10 text-brand" : "bg-leaf/15 text-leaf"}`}>{t.status}</span>
              </div>
            </div>
            <p className="mt-3 rounded-xl bg-cream px-4 py-3 text-sm text-ink/80">"{t.message}"</p>
            <div className="mt-3 flex justify-end gap-2">
              {t.status === "new" ? (
                <button onClick={() => update(t.id, "resolved")} className="inline-flex items-center gap-1 rounded-full bg-forest px-4 py-2 text-xs font-bold text-white"><Check className="h-3.5 w-3.5" /> Mark resolved</button>
              ) : (
                <button onClick={() => update(t.id, "new")} className="rounded-full border border-ink/15 px-4 py-2 text-xs font-bold text-ink hover:border-brand hover:text-brand">Reopen</button>
              )}
            </div>
          </div>
        ))}
        {tickets.length === 0 && <p className="rounded-2xl border border-dashed border-ink/15 bg-white py-14 text-center text-sm text-muted">No support messages yet — they'll appear here from the Contact page.</p>}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { InventoryProvider, useInventory, totalStock, fmtMoney, type DB } from "./lib";
import { Logo } from "@/components/ui";
import {
  LayoutGrid,
  ShoppingBag,
  Upload,
  Box,
  ArrowRightLeft,
  ClipboardList,
  Truck,
  Users,
  UserPlus,
  Badge,
  Percent,
  Coins,
  ChartUp,
  ScrollText,
  Menu,
  Close,
  LogOut,
  Storefront,
  Wallet,
  AlertCircle,
  Clock,
  Plus,
  Megaphone,
  ArrowUpRight,
} from "@/components/icons";
import ThemeToggle from "@/components/ThemeToggle";
import NotificationBell from "@/components/NotificationBell";
import ProductsList from "./ProductScreens";
import ProductFormView from "./ProductFormView";
import ProductDetailView from "./ProductDetailView";
import BulkUploadView from "./BulkUploadView";
import PosView from "./PosView";
import TransfersView from "./TransfersView";
import ValuationView from "./ValuationView";
import PartnerViews from "./PartnerViews";
import AdminViews from "./AdminViews";

export type InvView =
  | { name: "home" }
  | { name: "products" }
  | { name: "product-form"; productId?: string }
  | { name: "product-detail"; productId: string }
  | { name: "bulk-upload" }
  | { name: "categories" }
  | { name: "pos" }
  | { name: "transfers" }
  | { name: "purchase-orders" }
  | { name: "suppliers" }
  | { name: "customers" }
  | { name: "customer-detail"; customerId: string }
  | { name: "groups" }
  | { name: "staff" }
  | { name: "discounts" }
  | { name: "repayments" }
  | { name: "valuation" }
  | { name: "audit" };

const NAV: { key: string; label: string; icon: ReactNode; view: InvView; section: string }[] = [
  { key: "home", label: "Dashboard", icon: <LayoutGrid className="h-5 w-5" />, view: { name: "home" }, section: "Overview" },
  { key: "products", label: "Inventory", icon: <ShoppingBag className="h-5 w-5" />, view: { name: "products" }, section: "Products" },
  { key: "bulk-upload", label: "Bulk upload", icon: <Upload className="h-5 w-5" />, view: { name: "bulk-upload" }, section: "Products" },
  { key: "categories", label: "Categories & units", icon: <Box className="h-5 w-5" />, view: { name: "categories" }, section: "Products" },
  { key: "pos", label: "Record sale (POS)", icon: <Wallet className="h-5 w-5" />, view: { name: "pos" }, section: "Operations" },
  { key: "transfers", label: "Stock transfers", icon: <ArrowRightLeft className="h-5 w-5" />, view: { name: "transfers" }, section: "Operations" },
  { key: "purchase-orders", label: "Purchase orders", icon: <ClipboardList className="h-5 w-5" />, view: { name: "purchase-orders" }, section: "Operations" },
  { key: "suppliers", label: "Suppliers", icon: <Truck className="h-5 w-5" />, view: { name: "suppliers" }, section: "Operations" },
  { key: "customers", label: "Customers", icon: <Users className="h-5 w-5" />, view: { name: "customers" }, section: "People" },
  { key: "groups", label: "Customer groups", icon: <UserPlus className="h-5 w-5" />, view: { name: "groups" }, section: "People" },
  { key: "staff", label: "Staff & roles", icon: <Badge className="h-5 w-5" />, view: { name: "staff" }, section: "People" },
  { key: "discounts", label: "Discounts", icon: <Percent className="h-5 w-5" />, view: { name: "discounts" }, section: "Marketing" },
  { key: "repayments", label: "Credit repayments", icon: <Coins className="h-5 w-5" />, view: { name: "repayments" }, section: "Marketing" },
  { key: "valuation", label: "Inventory valuation", icon: <ChartUp className="h-5 w-5" />, view: { name: "valuation" }, section: "Reports" },
  { key: "audit", label: "Audit log", icon: <ScrollText className="h-5 w-5" />, view: { name: "audit" }, section: "Reports" },
];

/** Deep-link: #/inventory/<view> → open that section directly. */
function inventoryViewFromHash(): InvView | null {
  if (typeof window === "undefined") return null;
  const m = window.location.hash.match(/^#\/inventory\/([a-z-]+)/);
  if (!m) return null;
  const v = m[1];
  const map: Record<string, InvView> = {
    home: { name: "home" },
    products: { name: "products" },
    "product-form": { name: "product-form" },
    "bulk-upload": { name: "bulk-upload" },
    categories: { name: "categories" },
    pos: { name: "pos" },
    transfers: { name: "transfers" },
    "purchase-orders": { name: "purchase-orders" },
    suppliers: { name: "suppliers" },
    customers: { name: "customers" },
    groups: { name: "groups" },
    staff: { name: "staff" },
    discounts: { name: "discounts" },
    repayments: { name: "repayments" },
    valuation: { name: "valuation" },
    audit: { name: "audit" },
  };
  return map[v] ?? null;
}

function Shell() {
  const { user, business, logout } = useAuth();
  const { db } = useInventory();
  const [view, setView] = useState<InvView>(() => inventoryViewFromHash() ?? { name: "home" });
  const [open, setOpen] = useState(false);

  // Keep in sync with deep-link hash changes.
  useEffect(() => {
    const onHash = () => {
      const v = inventoryViewFromHash();
      if (v) { setView(v); setOpen(false); }
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [view]);

  if (!user || !business) {
    return (
      <div className="grid min-h-screen place-items-center">
        <a href="#/login" className="font-semibold text-brand">Please log in</a>
      </div>
    );
  }

  const current = NAV.find((n) => n.view.name === view.name);
  const sections = [...new Set(NAV.map((n) => n.section))];

  const Sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between px-5">
        <a href="#/dashboard" className="inline-flex items-center gap-2">
          <Logo />
          <span className="rounded-full bg-brand/10 px-2.5 py-1 text-[10px] font-bold text-brand">Inventory Dashboard</span>
        </a>
      </div>

      <div className="mx-4 mb-4 rounded-2xl bg-gradient-to-br from-forest to-pine p-4 text-white">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-white/60">Business</p>
        <p className="mt-1 truncate font-display text-sm font-extrabold">{business.name}</p>
        <p className="mt-1 text-[11px] text-white/70">
          {db.products.filter((p) => p.status !== "archived").length} products · {db.branches.length} branches
        </p>
      </div>

      <nav className="flex-1 space-y-3 overflow-y-auto px-3 pb-4">
        {sections.map((sec) => (
          <div key={sec}>
            <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted">{sec}</p>
            <div className="space-y-0.5">
              {NAV.filter((n) => n.section === sec).map((n) => {
                const active = n.view.name === view.name;
                return (
                  <button
                    key={n.key}
                    onClick={() => { setView(n.view); setOpen(false); }}
                    className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all ${
                      active ? "bg-forest text-white shadow-lg shadow-forest/20" : "text-ink/65 hover:bg-ink/5 hover:text-ink"
                    }`}
                  >
                    {n.icon} {n.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-ink/5 p-4">
        <a href="#/dashboard/marketing" className="mb-3 flex items-center gap-2 rounded-xl bg-cream px-3.5 py-2.5 text-sm font-semibold text-ink/70 transition-colors hover:text-brand">
          <Megaphone className="h-4 w-4" /> Marketing & analytics
        </a>
        <a href="#/dashboard" className="mb-3 flex items-center gap-2 rounded-xl bg-cream px-3.5 py-2.5 text-sm font-semibold text-ink/70 transition-colors hover:text-brand">
          <LayoutGrid className="h-4 w-4" /> Main dashboard overview
        </a>
        <a href="#/money/wallet" className="mb-3 flex items-center gap-2 rounded-xl bg-cream px-3.5 py-2.5 text-sm font-semibold text-ink/70 transition-colors hover:text-brand">
          <Wallet className="h-4 w-4" /> Money & accounting
        </a>
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-light to-brand text-sm font-bold text-white">
            {user.name.charAt(0)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-ink">{user.name.split(" ")[0]}</p>
            <p className="truncate text-xs text-muted">{user.email}</p>
          </div>
          <button onClick={logout} aria-label="Log out" className="grid h-8 w-8 place-items-center rounded-lg text-ink/40 hover:bg-red-50 hover:text-red-500">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-cream">
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-white shadow-2xl">
            <button onClick={() => setOpen(false)} className="absolute right-3 top-4 grid h-8 w-8 place-items-center rounded-lg text-ink/50 hover:bg-ink/5" aria-label="Close">
              <Close className="h-5 w-5" />
            </button>
            {Sidebar}
          </aside>
        </div>
      )}

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-ink/5 bg-white lg:block">{Sidebar}</aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-ink/5 bg-cream/85 backdrop-blur-xl">
          <div className="flex h-16 min-w-0 items-center gap-2 px-3 sm:gap-4 sm:px-8">
            <button onClick={() => setOpen(true)} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-ink/10 bg-white text-ink lg:hidden" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="truncate font-display text-base font-extrabold tracking-tight text-ink sm:text-lg">{current?.label ?? "Inventory"}</h1>
              <p className="hidden truncate text-xs text-muted sm:block">{current?.section ?? ""}</p>
            </div>
            <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2.5">
              <ThemeToggle />
              <NotificationBell />
              <span className="hidden h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-brand-light to-brand text-sm font-bold text-white sm:grid">
                {user.name.charAt(0)}
              </span>
            </div>
          </div>
        </header>

        <main className="px-5 py-6 sm:px-8 sm:py-8">
          {view.name === "home" && <HomeView go={setView} />}
          {view.name === "products" && <ProductsList go={setView} />}
          {view.name === "product-form" && <ProductFormView go={setView} productId={view.productId} />}
          {view.name === "product-detail" && <ProductDetailView go={setView} productId={view.productId} />}
          {view.name === "bulk-upload" && <BulkUploadView />}
          {view.name === "categories" && <AdminViews.CategoriesUnits />}
          {view.name === "pos" && <PosView />}
          {view.name === "transfers" && <TransfersView />}
          {view.name === "purchase-orders" && <PartnerViews.PurchaseOrders />}
          {view.name === "suppliers" && <PartnerViews.Suppliers />}
          {view.name === "customers" && <PartnerViews.Customers go={setView} />}
          {view.name === "customer-detail" && <PartnerViews.CustomerDetail customerId={view.customerId} go={setView} />}
          {view.name === "groups" && <PartnerViews.Groups />}
          {view.name === "staff" && <AdminViews.Staff />}
          {view.name === "discounts" && <AdminViews.Discounts />}
          {view.name === "repayments" && <AdminViews.Repayments />}
          {view.name === "valuation" && <ValuationView />}
          {view.name === "audit" && <AdminViews.AuditLog />}
        </main>
      </div>
    </div>
  );
}

/* --------------------------- Home / widgets --------------------------- */

function stockOf(db: DB, productId: string) {
  return totalStock(db, productId);
}

function HomeView({ go }: { go: (v: InvView) => void }) {
  const { db } = useInventory();
  const { business } = useAuth();
  const cur = business?.currency ?? "NGN";
  const today = new Date();
  const in7d = new Date();
  in7d.setDate(in7d.getDate() + 7);

  const live = db.products.filter((p) => p.status !== "archived");
  const low = live.filter((p) => stockOf(db, p.id) > 0 && stockOf(db, p.id) <= p.threshold);
  const out = live.filter((p) => stockOf(db, p.id) === 0);
  const expiring = live.filter((p) => p.expiry && new Date(p.expiry) >= today && new Date(p.expiry) <= in7d);
  const owing = db.sales.filter((s) => s.status !== "paid").reduce((s, x) => s + (x.total - x.paid), 0);

  const quick: { label: string; icon: ReactNode; view: InvView; tint: string }[] = [
    { label: "Record a sale", icon: <Wallet className="h-5 w-5" />, view: { name: "pos" }, tint: "bg-brand/10 text-brand" },
    { label: "Add product", icon: <Plus className="h-5 w-5" />, view: { name: "product-form" }, tint: "bg-pine/10 text-pine" },
    { label: "Bulk upload", icon: <Upload className="h-5 w-5" />, view: { name: "bulk-upload" }, tint: "bg-leaf/10 text-leaf" },
    { label: "Stock transfer", icon: <ArrowRightLeft className="h-5 w-5" />, view: { name: "transfers" }, tint: "bg-sun/15 text-[#b7791f]" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink">Inventory Dashboard</h2>
            <span className="rounded-full bg-brand/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-brand">Full back office</span>
          </div>
          <p className="mt-1 text-sm text-muted">15+ tools for products, stock, sales, suppliers, customers & staff — stock is tracked automatically, every change is logged.</p>
        </div>
        <button onClick={() => go({ name: "pos" })} className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-brand-light to-brand px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand/25 transition-transform hover:-translate-y-0.5">
          <Wallet className="h-4 w-4" /> Record a sale
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {quick.map((q) => (
          <button key={q.label} onClick={() => go(q.view)} className="group flex items-center gap-3 rounded-2xl border border-ink/5 bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-forest/10">
            <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${q.tint} transition-transform group-hover:scale-110`}>{q.icon}</span>
            <span className="text-sm font-bold text-ink">{q.label}</span>
          </button>
        ))}
      </div>

      {/* marketing link */}
      <div className="grid gap-3 lg:grid-cols-3">
        <a href="#/dashboard/marketing" className="flex flex-col gap-3 rounded-2xl border border-brand/20 bg-gradient-to-br from-brand/[0.06] to-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand/10 sm:flex-row sm:items-center lg:col-span-2">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand"><Megaphone className="h-5 w-5" /></span>
          <div className="flex-1">
            <p className="text-sm font-bold text-ink">Marketing & analytics — in your main dashboard</p>
            <p className="text-xs text-muted">WhatsApp/SMS/email campaigns, coupons, social links & Google Analytics.</p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-forest px-4 py-2 text-xs font-bold text-white">Open <ArrowUpRight className="h-3.5 w-3.5" /></span>
        </a>
        <a href="#/money/wallet" className="flex items-center gap-3 rounded-2xl border border-pine/20 bg-gradient-to-br from-pine/[0.06] to-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-pine/10">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-pine/10 text-pine"><Wallet className="h-5 w-5" /></span>
          <div className="flex-1">
            <p className="text-sm font-bold text-ink">Wallet & accounting</p>
            <p className="text-xs text-muted">Payouts, expenses & P&L</p>
          </div>
          <ArrowUpRight className="h-4 w-4 shrink-0 text-pine" />
        </a>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-ink/5 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-display text-base font-extrabold text-ink">
              <AlertCircle className="h-5 w-5 text-brand" /> Needs attention
            </h3>
            <button onClick={() => go({ name: "products" })} className="text-xs font-bold text-brand">View all</button>
          </div>
          <div className="mt-4 space-y-3">
            {[...out, ...low].slice(0, 5).map((p) => (
              <button key={p.id} onClick={() => go({ name: "product-detail", productId: p.id })} className="flex w-full items-center gap-3 rounded-xl bg-cream p-3 text-left transition-colors hover:bg-brand/[0.06]">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-white text-lg shadow-sm">{p.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-ink">{p.name}</p>
                  <p className="text-xs text-muted">{stockOf(db, p.id)} left · alert at {p.threshold}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${stockOf(db, p.id) === 0 ? "bg-red-100 text-red-500" : "bg-sun/20 text-[#b7791f]"}`}>
                  {stockOf(db, p.id) === 0 ? "Out of stock" : "Low stock"}
                </span>
              </button>
            ))}
            {out.length + low.length === 0 && <p className="py-6 text-center text-sm text-muted">All products are well stocked 🎉</p>}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-ink/5 bg-white p-5 shadow-sm sm:p-6">
            <h3 className="flex items-center gap-2 font-display text-base font-extrabold text-ink">
              <Clock className="h-5 w-5 text-sun" /> Expiring soon (7 days)
            </h3>
            <div className="mt-4 space-y-3">
              {expiring.map((p) => (
                <div key={p.id} className="flex items-center gap-3 rounded-xl bg-cream p-3">
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-white text-lg shadow-sm">{p.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-ink">{p.name}</p>
                    <p className="text-xs text-muted">Expires {p.expiry}</p>
                  </div>
                  <button onClick={() => go({ name: "product-detail", productId: p.id })} className="shrink-0 rounded-full bg-brand/10 px-3 py-1 text-[11px] font-bold text-brand">Restock</button>
                </div>
              ))}
              {expiring.length === 0 && <p className="py-4 text-center text-sm text-muted">Nothing expiring in the next 7 days.</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { k: "Products", v: live.length.toString(), icon: <Storefront className="h-5 w-5" />, tint: "bg-pine/10 text-pine" },
              { k: "Branches", v: db.branches.length.toString(), icon: <Box className="h-5 w-5" />, tint: "bg-brand/10 text-brand" },
              { k: "Pending POs", v: db.purchaseOrders.filter((p) => p.status === "pending").length.toString(), icon: <ClipboardList className="h-5 w-5" />, tint: "bg-sun/15 text-[#b7791f]" },
              { k: "Owing (credit)", v: fmtMoney(cur, owing), icon: <Coins className="h-5 w-5" />, tint: "bg-leaf/10 text-leaf" },
            ].map((s) => (
              <div key={s.k} className="rounded-2xl border border-ink/5 bg-white p-4 shadow-sm">
                <span className={`grid h-9 w-9 place-items-center rounded-lg ${s.tint}`}>{s.icon}</span>
                <p className="mt-2.5 font-display text-lg font-extrabold text-ink">{s.v}</p>
                <p className="text-xs text-muted">{s.k}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InventoryApp() {
  return (
    <InventoryProvider>
      <Shell />
    </InventoryProvider>
  );
}

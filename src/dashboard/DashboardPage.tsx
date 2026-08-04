"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { Logo } from "@/components/ui";
import {
  Home,
  Storefront,
  ShoppingBag,
  Receipt,
  Users,
  Box,
  ChartUp,
  Wallet,
  Settings,
  Search,
  LogOut,
  Menu,
  Close,
  ChevronDown,
  Rocket,
  Megaphone,
  ArrowUpRight,
} from "@/components/icons";
import ThemeToggle from "@/components/ThemeToggle";
import NotificationBell from "@/components/NotificationBell";
import Overview from "./Overview";
import { StoreSection, ProductsSection, OrdersSection, CustomersSection, InventorySection, AnalyticsSection, PaymentsSection, SettingsSection } from "./Sections";
import MarketingSection from "./MarketingSection";

export type SectionId =
  | "overview"
  | "store"
  | "products"
  | "orders"
  | "customers"
  | "inventory"
  | "marketing"
  | "analytics"
  | "payments"
  | "settings";

type NavItem = { id: SectionId; label: string; icon: ReactNode; badge?: string; opensApp?: boolean; href?: string };

const NAV: NavItem[] = [
  { id: "overview", label: "Overview", icon: <Home className="h-5 w-5" /> },
  { id: "store", label: "Store", icon: <Storefront className="h-5 w-5" /> },
  { id: "products", label: "Products", icon: <ShoppingBag className="h-5 w-5" /> },
  { id: "orders", label: "Orders", icon: <Receipt className="h-5 w-5" /> },
  { id: "customers", label: "Customers", icon: <Users className="h-5 w-5" /> },
  { id: "inventory", label: "Inventory", icon: <Box className="h-5 w-5" />, badge: "Full dashboard", opensApp: true },
  { id: "marketing", label: "Marketing", icon: <Megaphone className="h-5 w-5" /> },
  { id: "analytics", label: "Analytics", icon: <ChartUp className="h-5 w-5" /> },
  { id: "payments", label: "Money & Accounting", icon: <Wallet className="h-5 w-5" />, badge: "Full dashboard", opensApp: true, href: "/money" },
  { id: "settings", label: "Settings", icon: <Settings className="h-5 w-5" /> },
];

/** Read a dashboard section deep-link from the hash, e.g. #/dashboard/marketing */
function dashboardSectionFromHash(): SectionId | null {
  if (typeof window === "undefined") return null;
  const m = window.location.hash.match(/^#\/dashboard\/([a-z-]+)/);
  if (!m) return null;
  const s = m[1] as SectionId;
  return NAV.some((n) => n.id === s) ? s : null;
}

export default function DashboardPage() {
  const { user, business, logout } = useAuth();
  const [section, setSection] = useState<SectionId>(() => dashboardSectionFromHash() ?? "overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Keep section in sync with deep-link hash changes (e.g. from other modules).
  useEffect(() => {
    const onHash = () => {
      const s = dashboardSectionFromHash();
      if (!s) return;
      if (s === "payments") {
        window.location.hash = "/money";
        return;
      }
      setSection(s);
      setSidebarOpen(false);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // Guards: must be logged in with a business profile.
  useEffect(() => {
    if (!user) window.location.hash = "/login";
    else if (!business) window.location.hash = "/onboarding";
  }, [user, business]);

  // Payments now lives in the Money & Accounting module — redirect there.
  useEffect(() => {
    if (section === "payments") window.location.hash = "/money";
  }, [section]);

  useEffect(() => {
    document.title = `${business?.name ?? "Dashboard"} — Brikoh`;
    window.scrollTo({ top: 0 });
  }, [business, section]);

  if (!user || !business) return null;

  const initial = user.name.charAt(0).toUpperCase();
  const firstName = user.name.split(" ")[0];

  const sectionTitle = NAV.find((n) => n.id === section)?.label ?? "Overview";

  const Sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center px-5">
        <a href="#/" className="inline-block">
          <Logo />
        </a>
      </div>

      <div className="mx-4 mb-4 rounded-2xl bg-gradient-to-br from-forest to-pine p-4 text-white">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-white/60">Your store</p>
        <p className="mt-1 truncate font-display text-sm font-extrabold">{business.name}</p>
        <div className="mt-2.5 flex items-center gap-2">
          <span className="rounded-full bg-leaf/30 px-2 py-0.5 text-[10px] font-bold text-leaf">
            {business.websiteLive ? "Website live" : "Online + offline"}
          </span>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3">
                {NAV.map((n) => {
                  const active = section === n.id;
                  return (
                    <button
                      key={n.id}
                      onClick={() => {
                        if (n.opensApp) {
                          window.location.hash = n.href ?? "/inventory";
                          return;
                        }
                        setSection(n.id);
                        setSidebarOpen(false);
                      }}
                      className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all ${
                        active
                          ? "bg-forest text-white shadow-lg shadow-forest/20"
                          : "text-ink/65 hover:bg-ink/5 hover:text-ink"
                      }`}
                    >
                      {n.icon}
                      <span className="flex-1 text-left">{n.label}</span>
                      {n.badge && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide ${
                            active ? "bg-white/20 text-white" : "bg-brand/10 text-brand"
                          }`}
                        >
                          {n.badge}
                        </span>
                      )}
                      {n.opensApp && <ArrowUpRight className={`h-4 w-4 ${active ? "text-white/70" : "text-ink/35"}`} />}
                    </button>
                  );
                })}
      </nav>

      <div className="border-t border-ink/5 p-4">
        <div className="rounded-2xl border border-dashed border-brand/30 bg-brand/[0.05] p-4">
          <Rocket className="h-5 w-5 text-brand" />
          <p className="mt-2 text-sm font-bold text-ink">Upgrade to Pro</p>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            Unlock multi-store, automation & advanced analytics.
          </p>
          <a
            href="#/pricing"
            className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-gradient-to-br from-brand-light to-brand px-4 py-2 text-xs font-bold text-white"
          >
            View plans
          </a>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-light to-brand text-sm font-bold text-white">
            {initial}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-ink">{firstName}</p>
            <p className="truncate text-xs text-muted">{user.email}</p>
          </div>
          <button
            onClick={logout}
            aria-label="Log out"
            className="grid h-8 w-8 place-items-center rounded-lg text-ink/40 transition-colors hover:bg-red-50 hover:text-red-500"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-cream">
      {/* mobile sidebar backdrop + drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-white shadow-2xl">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute right-3 top-4 grid h-8 w-8 place-items-center rounded-lg text-ink/50 hover:bg-ink/5"
              aria-label="Close menu"
            >
              <Close className="h-5 w-5" />
            </button>
            {Sidebar}
          </aside>
        </div>
      )}

      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-ink/5 bg-white lg:block">
        {Sidebar}
      </aside>

      {/* main column */}
      <div className="lg:pl-72">
        {/* topbar */}
        <header className="sticky top-0 z-20 border-b border-ink/5 bg-cream/85 backdrop-blur-xl">
          <div className="flex h-16 min-w-0 items-center gap-2 px-3 sm:gap-4 sm:px-8">
            <button
              onClick={() => setSidebarOpen(true)}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-ink/10 bg-white text-ink lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <h1 className="min-w-0 flex-1 truncate font-display text-base font-extrabold tracking-tight text-ink sm:text-xl">
              {sectionTitle}
            </h1>

            <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2.5">
              <ThemeToggle />
              <div className="relative hidden md:block">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/35" />
                <input
                  placeholder="Search products, orders…"
                  className="w-52 rounded-full border border-ink/10 bg-white py-2.5 pl-10 pr-4 text-sm text-ink outline-none transition-all placeholder:text-ink/30 focus:border-brand focus:ring-4 focus:ring-brand/10 lg:w-64"
                />
              </div>
              <NotificationBell />
              <div className="relative">
                <button
                  onClick={() => setProfileOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-full border border-ink/10 bg-white py-1.5 pl-1.5 pr-3"
                >
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-brand-light to-brand text-sm font-bold text-white">
                    {initial}
                  </span>
                  <span className="hidden text-sm font-semibold text-ink sm:block">{firstName}</span>
                  <ChevronDown className={`h-4 w-4 text-ink/40 transition-transform ${profileOpen ? "rotate-180" : ""}`} />
                </button>
                {profileOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                    <div className="absolute right-0 z-20 mt-2 w-56 rounded-2xl border border-ink/5 bg-white p-2 shadow-2xl shadow-ink/10">
                      <div className="border-b border-ink/5 px-3 py-2.5">
                        <p className="text-sm font-bold text-ink">{user.name}</p>
                        <p className="truncate text-xs text-muted">{user.email}</p>
                      </div>
                      <a
                        href="#/store"
                        className="block rounded-xl px-3 py-2 text-sm font-semibold text-ink/80 hover:bg-cream"
                      >
                        My store
                      </a>
                      <a
                        href="#/settings"
                        className="block rounded-xl px-3 py-2 text-sm font-semibold text-ink/80 hover:bg-cream"
                      >
                        Settings
                      </a>
                      <button
                        onClick={logout}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-red-500 hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4" /> Log out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* content */}
        <main className="px-5 py-6 sm:px-8 sm:py-8">
          {section === "overview" && <Overview onNavigate={setSection} />}
          {section === "store" && <StoreSection />}
          {section === "products" && <ProductsSection />}
          {section === "orders" && <OrdersSection />}
          {section === "customers" && <CustomersSection />}
          {section === "inventory" && <InventorySection />}
          {section === "marketing" && <MarketingSection />}
          {section === "analytics" && <AnalyticsSection />}
          {section === "payments" && <PaymentsSection />}
          {section === "settings" && <SettingsSection />}
        </main>
      </div>
    </div>
  );
}

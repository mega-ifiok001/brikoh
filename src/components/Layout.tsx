import { useCallback, useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { ago, cls, fd, initialsOf, titleCase } from "../lib/format";
import { Badge, CopyBtn, Icon, toast } from "./ui";
import { getAccess, type Feature } from "../lib/access";
import AnnouncementsBanner from "./AnnouncementsBanner";

interface NavItem {
  to: string;
  label: string;
  icon: string;
  feature: Feature;
}
interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV: NavGroup[] = [
  {
    title: "Sell",
    items: [
      { to: "", label: "Overview", icon: "grid", feature: "overview" },
      { to: "/pos", label: "Point of sale", icon: "pos", feature: "pos" },
      { to: "/orders", label: "Orders", icon: "receipt", feature: "orders" },
      { to: "/storefront", label: "Storefront", icon: "store", feature: "storefront" },
    ],
  },
  {
    title: "Inventory",
    items: [
      { to: "/products", label: "Products", icon: "box", feature: "products" },
      { to: "/branches", label: "Branches", icon: "building", feature: "branches" },
      { to: "/purchases", label: "Purchases", icon: "truck", feature: "purchases" },
    ],
  },
  {
    title: "Customers",
    items: [
      { to: "/customers", label: "Customers", icon: "users", feature: "customers" },
      { to: "/invoices", label: "Invoices", icon: "file", feature: "invoices" },
      { to: "/discounts", label: "Discounts", icon: "tag", feature: "discounts" },
    ],
  },
  {
    title: "Money",
    items: [
      { to: "/wallet", label: "Wallet", icon: "wallet", feature: "wallet" },
      { to: "/expenses", label: "Expenses", icon: "banknote", feature: "expenses" },
      { to: "/analytics", label: "Analytics", icon: "chart", feature: "analytics" },
      { to: "/reports", label: "Reports", icon: "books", feature: "reports" },
    ],
  },
  {
    title: "Manage",
    items: [
      { to: "/staff", label: "Staff", icon: "user", feature: "staff" },
      { to: "/tickets", label: "Support tickets", icon: "lifebuoy", feature: "tickets" },
      { to: "/settings", label: "Settings", icon: "settings", feature: "settings" },
    ],
  },
];

function Brand({ light }: { light?: boolean }) {
  return (
    <Link to="/dashboard" className="flex items-center gap-2.5">
      <span className={cls("flex h-9 w-9 items-center justify-center rounded-xl", light ? "bg-brand-500 text-white" : "bg-brand-500 text-white")}>
        <Icon name="logo" size={22} />
      </span>
      <span className={cls("font-display text-xl font-extrabold tracking-tight", light ? "text-cream-50" : "text-ink-900")}>
        brikoh
      </span>
    </Link>
  );
}

type PlanLimits = {
  staffCap: number | null;
  locationCap: number | null;
  productCap: number | null;
  orderCap: number | null;
  templateCap: number | null;
};

type Plan = {
  tier: "STARTER" | "PRO" | "ENTERPRISE";
  status: "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELLED" | null;
  active: boolean;
  limits: PlanLimits;
  featureFlags: {
    customDomain: boolean;
    advancedAnalytics: boolean;
    marketingTools: boolean;
  };
};

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { me } = useAuth();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [period, setPeriod] = useState<{ start: string; end: string } | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const access = getAccess(me);
  const canSettings = access.can("settings");

  // Filter the nav so restricted roles don't even see links they can't use.
  // Groups that end up empty (e.g. "Manage" for staff) are dropped entirely.
  const visibleNav = NAV.map((g) => ({
    ...g,
    items: g.items.filter((it) => access.can(it.feature)),
  })).filter((g) => g.items.length > 0);

  useEffect(() => {
    let cancelled = false;

    async function loadSubscription() {
      try {
        const res: any = await api.get("/api/dashboard/subscriptions/usage");
        if (cancelled) return;
        setPlan(res?.plan ?? null);
        setPeriod(res?.period ?? null);
      } catch (e: any) {
        if (cancelled) return;
        if (e?.status === 403) {
          setForbidden(true);
        }
      } finally {
        if (!cancelled) setLoaded(true);
      }
    }

    loadSubscription();
    return () => {
      cancelled = true;
    };
  }, []);

  const limits = plan?.limits || ({} as Partial<PlanLimits>);
  const caps = [
    { label: "Products", cap: limits.productCap },
    { label: "Staff", cap: limits.staffCap },
    { label: "Locations", cap: limits.locationCap },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pb-5 pt-6">
        <Brand light />
      </div>
      <nav className="scrollbar-slim flex-1 space-y-5 overflow-y-auto px-3 pb-4">
        {visibleNav.map((g) => (
          <div key={g.title}>
            <p className="px-2.5 pb-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-ink-300/70">
              {g.title}
            </p>
            <div className="space-y-0.5">
              {g.items.map((it) => (
                <NavLink
                  key={it.to}
                  to={`/dashboard${it.to}`}
                  end={it.to === ""}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cls(
                      "flex items-center gap-3 rounded-lg px-2.5 py-2 text-[13.5px] font-bold transition-colors",
                      isActive
                        ? "bg-brand-500 text-white shadow-[0_2px_8px_rgba(217,83,42,.35)]"
                        : "text-cream-100/70 hover:bg-white/5 hover:text-cream-50"
                    )
                  }
                >
                  <Icon name={it.icon} size={17} />
                  {it.label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
      {canSettings && !forbidden && (
        <div className="border-t border-white/10 p-4">
          <div className="rounded-xl bg-white/5 p-3.5">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-cream-100/60">
                Plan
              </p>
              <Badge tone="brand">
                {titleCase(plan?.tier || (loaded ? "Starter" : "..."))}
              </Badge>
            </div>
            <p className="mt-1.5 text-xs font-semibold text-cream-100/80">
              {plan?.status
                ? titleCase(plan.status)
                : loaded
                ? "No active plan"
                : "Loading..."}
              {period?.end ? ` · renews ${fd(period.end)}` : ""}
            </p>
            {plan && (
              <p className="mt-1 text-[11px] text-cream-100/50">
                {caps
                  .map((c) => `${c.label}: ${c.cap === null || c.cap === undefined ? "∞" : c.cap}`)
                  .join(" · ")}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const KIND_META: Record<string, { icon: string; label: string }> = {
  LOW_STOCK: { icon: "alert", label: "Low stock" },
  EXPIRING_SOON: { icon: "clock", label: "Expiring soon" },
  PAYMENT_RECEIVED: { icon: "wallet", label: "Payment received" },
};

function dispatchText(n: any): string {
  const s = n.snapshot || {};
  switch (n.kind) {
    case "LOW_STOCK":
      return `${s.productName ?? "A product"} at ${s.branchName ?? "a branch"} — ${
        s.quantity ?? n.sentQuantity ?? "?"
      } left${s.threshold != null ? ` (alert at ${s.threshold})` : ""}`;
    case "EXPIRING_SOON":
      return `${s.productName ?? "A product"} expiring${s.expiryDate ? ` ${new Date(s.expiryDate).toLocaleDateString()}` : " soon"}`;
    case "PAYMENT_RECEIVED":
      return s.amount ? `Payment of ${s.amount} received${s.customerName ? ` from ${s.customerName}` : ""}` : "Payment received";
    default:
      return titleCase(n.refType || "");
  }
}

function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const [lastSeenId, setLastSeenId] = useState<string | null>(() => {
    try {
      return localStorage.getItem("brikoh:lastSeenAlertId");
    } catch {
      return null;
    }
  });
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(
    async (quiet = false) => {
      if (forbidden) return;
      if (!quiet) setLoading(true);
      try {
        const res: any = await api.get("/api/dashboard/notifications");
        setItems((res?.dispatches ?? []).slice(0, 20));
      } catch (e: any) {
        if (e?.status === 403) setForbidden(true);
        setItems([]);
      } finally {
        setLoading(false);
      }
    },
    [forbidden]
  );

  useEffect(() => {
    load(true);
    const t = setInterval(() => load(true), 120_000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const hasUnseen = items.length > 0 && items[0]?.id !== lastSeenId;

  const openPanel = () => {
    setOpen((o) => !o);
    if (items[0]?.id) {
      try {
        localStorage.setItem("brikoh:lastSeenAlertId", items[0].id);
      } catch {
        /* ignore */
      }
      setLastSeenId(items[0].id);
    }
  };

  if (forbidden) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={openPanel}
        className="relative rounded-lg p-2 text-ink-500 transition-colors hover:bg-cream-100 hover:text-ink-900"
        aria-label="Notifications"
      >
        <Icon name="bell" size={19} />
        {hasUnseen && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brand-500 ring-2 ring-white" />}
      </button>
      {open && (
        <div className="anim-pop absolute right-0 top-full z-40 mt-2 w-[min(92vw,380px)] overflow-hidden rounded-xl border border-cream-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-cream-200 px-4 py-3">
            <p className="text-sm font-extrabold">Alerts</p>
            <button className="text-xs font-bold text-brand-600 hover:underline" onClick={() => load()}>
              Refresh
            </button>
          </div>
          <div className="scrollbar-slim max-h-96 overflow-y-auto">
            {loading && items.length === 0 ? (
              <div className="space-y-3 p-4">
                <div className="skeleton h-10" />
                <div className="skeleton h-10" />
              </div>
            ) : items.length === 0 ? (
              <p className="p-6 text-center text-sm text-ink-400">
                No alerts yet — we'll email you about low stock, expiring products and payments.
              </p>
            ) : (
              items.map((n) => {
                const meta = KIND_META[n.kind] || { icon: "bell", label: "Alert" };
                return (
                  <div key={n.id} className="flex gap-3 border-b border-cream-100 px-4 py-3 last:border-0">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                      <Icon name={meta.icon} size={15} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[13px] font-bold text-ink-800">{meta.label}</p>
                      <p className="truncate text-xs text-ink-400" title={dispatchText(n)}>
                        {dispatchText(n)}
                      </p>
                      <p className="mt-0.5 text-[11px] font-semibold text-ink-300">{ago(n.sentAt)}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Layout() {
  const { me, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileNav, setMobileNav] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const userRef = useRef<HTMLDivElement>(null);
  const store = me.store || {};
  const currency: string = store.currency || "NGN";
  const account = me.account || {};
  const access = getAccess(me);
  const canSettings = access.can("settings");
  const name =
    [account.firstName, account.lastName].filter(Boolean).join(" ") ||
    account.email ||
    "Account";

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserMenu(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const previewUrl = store.subdomain
    ? `${location.origin}${location.pathname}#/s/${store.subdomain}`
    : "";

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 bg-ink-900 lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      {mobileNav && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink-900/50" onClick={() => setMobileNav(false)} />
          <aside className="anim-rise absolute inset-y-0 left-0 w-64 bg-ink-900">
            <SidebarContent onNavigate={() => setMobileNav(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col lg:pl-60">
        {/* Topbar */}
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-cream-200 bg-cream-50/90 px-4 backdrop-blur sm:px-6">
          <button
            className="rounded-lg p-2 text-ink-500 hover:bg-cream-100 lg:hidden"
            onClick={() => setMobileNav(true)}
            aria-label="Open menu"
          >
            <Icon name="menu" size={20} />
          </button>

          <div className="hidden items-center gap-2 sm:flex">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-900 text-cream-50">
              <Icon name="store" size={15} />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-extrabold">{store.name || "My store"}</p>
              <p className="text-[11px] font-semibold text-ink-400">
                {store.subdomain ? `${store.subdomain}.brikoh.com` : "No subdomain yet"}
              </p>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            {store.subdomain && (
              <button
                onClick={() => window.open(previewUrl, "_blank")}
                className="hidden items-center gap-1.5 rounded-lg border border-cream-300 bg-white px-3 py-2 text-xs font-bold text-ink-700 transition-colors hover:border-brand-300 hover:text-brand-600 md:flex"
              >
                <Icon name="eye" size={14} />
                View storefront
              </button>
            )}
            <NotificationsBell />
            <div className="relative" ref={userRef}>
              <button
                onClick={() => setUserMenu((o) => !o)}
                className="flex items-center gap-2 rounded-lg p-1.5 pr-2 hover:bg-cream-100"
                aria-label="Account menu"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-xs font-extrabold text-white">
                  {initialsOf(name)}
                </span>
                <Icon name="chevronDown" size={14} className="text-ink-400" />
              </button>
              {userMenu && (
                <div className="anim-pop absolute right-0 top-full z-40 mt-2 w-64 overflow-hidden rounded-xl border border-cream-200 bg-white shadow-2xl">
                  <div className="border-b border-cream-100 px-4 py-3">
                    <p className="truncate text-sm font-extrabold">{name}</p>
                    <p className="truncate text-xs text-ink-400">{account.email || ""}</p>
                    {account.emailVerifiedAt ? (
                      <span className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold text-leaf-600">
                        <Icon name="shield" size={12} /> Email verified
                      </span>
                    ) : (
                      <span className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold text-gold-600">
                        <Icon name="alert" size={12} /> Email unverified
                      </span>
                    )}
                  </div>
                  <div className="p-1.5">
                    {store.subdomain && (
                      <div className="flex items-center justify-between gap-2 rounded-lg px-2.5 py-2">
                        <span className="text-xs font-bold text-ink-500">Storefront link</span>
                        <CopyBtn text={previewUrl} label="Copy" />
                      </div>
                    )}
                    {canSettings && (
                      <Link
                        to="/dashboard/settings"
                        onClick={() => setUserMenu(false)}
                        className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-bold text-ink-700 hover:bg-cream-100"
                      >
                        <Icon name="settings" size={15} /> Settings
                      </Link>
                    )}
                    <button
                      onClick={async () => {
                        setUserMenu(false);
                        await logout();
                        toast.info("Signed out. See you soon.");
                        navigate("/");
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-bold text-danger-500 hover:bg-danger-100"
                    >
                      <Icon name="logout" size={15} /> Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1180px]">
            <AnnouncementsBanner />
            <Outlet />
          </div>
        </main>

        <footer className="border-t border-cream-200 px-6 py-4 text-center text-[11px] font-semibold text-ink-300">
          Brikoh · all-in-one commerce for your store · money in {currency}
        </footer>
      </div>
    </div>
  );
}
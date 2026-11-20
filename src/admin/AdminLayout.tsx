import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { Badge, Icon } from "../components/ui";
import { cls, initialsOf } from "../lib/format";
import { useAdmin } from "./AdminContext";

export interface AdminNavItem {
  to: string;
  label: string;
  icon: string;
  perm?: string;
  superOnly?: boolean;
}
export interface AdminNavGroup {
  title: string;
  items: AdminNavItem[];
}

export const ADMIN_NAV: AdminNavGroup[] = [
  {
    title: "Platform",
    items: [
      { to: "/", label: "Overview", icon: "grid", perm: "admin:overview.view", superOnly: true },
      { to: "/merchants", label: "Merchants", icon: "users", perm: "admin:merchants.view" },
      { to: "/stores", label: "Stores", icon: "store", perm: "admin:stores.view" },
      { to: "/orders", label: "Orders", icon: "receipt", perm: "admin:orders.view" },
      { to: "/payments", label: "Awaiting payment", icon: "banknote", perm: "admin:payments.awaiting-confirmation.view" },
    ],
  },
  {
    title: "Support",
    items: [
      { to: "/tickets", label: "Support tickets", icon: "lifebuoy", perm: "admin:support.tickets.view" },
      { to: "/announcements", label: "Announcements", icon: "bell", perm: "admin:announcements.view", superOnly: true },
    ],
  },
  {
    title: "Insights",
    items: [
      { to: "/health", label: "Platform health", icon: "zap", perm: "stores:view" },
      { to: "/telemetry", label: "Funnel & telemetry", icon: "chart", perm: "admin:telemetry.view", superOnly: true },
    ],
  },
  {
    title: "Operations",
    items: [
      { to: "/pricing", label: "Plan pricing", icon: "tag", perm: "stores:view" },
      { to: "/operations", label: "Integrity & webhooks", icon: "settings", perm: "operations:run" },
      { to: "/audit", label: "Audit log", icon: "file", perm: "audit:view", superOnly: true },
    ],
  },
  {
    title: "Admin",
    items: [
      { to: "/staff", label: "Platform staff", icon: "shield", perm: "admin:staff.view", superOnly: true },
      { to: "/account", label: "My account", icon: "key" },
    ],
  },
];

export function useVisibleNav(): AdminNavGroup[] {
  const { can, isSuper } = useAdmin();
  return ADMIN_NAV.map((g) => ({
    ...g,
    items: g.items.filter((i) => (!i.perm || can(i.perm)) && (!i.superOnly || isSuper)),
  })).filter((g) => g.items.length > 0);
}

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  const { p, me } = useAdmin();
  const nav = useVisibleNav();
  return (
    <div className="flex h-full flex-col">
      <Link to={p("/")} onClick={onNavigate} className="flex items-center gap-2.5 px-5 pb-4 pt-5">
        <img src="/logo-white.png" width={92} alt="Brikoh" />
        <span className="rounded-md bg-brand-500 px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white">
          Admin
        </span>
      </Link>

      <nav className="scrollbar-slim flex-1 space-y-5 overflow-y-auto px-3 pb-4">
        {nav.map((g) => (
          <div key={g.title}>
            <p className="mb-1.5 px-2.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-cream-300/50">
              {g.title}
            </p>
            <div className="space-y-0.5">
              {g.items.map((i) => (
                <NavLink
                  key={i.to}
                  to={p(i.to)}
                  end={i.to === "/"}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cls(
                      "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13.5px] font-semibold transition-colors",
                      isActive ? "bg-white/12 text-white" : "text-cream-200/70 hover:bg-white/6 hover:text-white"
                    )
                  }
                >
                  <Icon name={i.icon} size={17} />
                  {i.label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-500 text-xs font-extrabold text-white">
            {initialsOf(me?.email)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-bold text-white">{me?.email}</p>
            <p className="text-[10px] font-bold uppercase tracking-wide text-cream-300/60">
              {me?.roleName?.replace("_", " ")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const { signOut, me } = useAdmin();
  const [open, setOpen] = useState(false);
  const loc = useLocation();

  useEffect(() => setOpen(false), [loc.pathname]);

  return (
    <div className="min-h-screen bg-cream-50 lg:pl-64">
      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 bg-ink-900 lg:block">
        <SidebarBody />
      </aside>

      {/* mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink-900/50" onClick={() => setOpen(false)} />
          <aside className="anim-rise absolute inset-y-0 left-0 w-64 bg-ink-900">
            <SidebarBody onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-cream-200 bg-cream-50/90 px-4 py-2.5 backdrop-blur sm:px-6">
        <button
          className="rounded-lg p-2 text-ink-700 hover:bg-cream-100 lg:hidden"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
        >
          <Icon name="menu" size={20} />
        </button>
        <div className="hidden items-center gap-2 text-xs font-semibold text-ink-400 lg:flex">
          <Icon name="shield" size={14} className="text-brand-500" />
          Cross-tenant access is audit-logged
        </div>
        <div className="ml-auto flex items-center gap-3">
          <Badge tone={me?.roleName === "SUPER_ADMIN" ? "dark" : "brand"}>{me?.roleName?.replace("_", " ")}</Badge>
          <button
            onClick={() => signOut()}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-bold text-ink-700 hover:bg-cream-100"
          >
            <Icon name="logout" size={16} />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1280px] px-4 py-6 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
"use client";

import { useState, type ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { Logo } from "@/components/ui";
import ThemeToggle from "@/components/ThemeToggle";
import { Home, ChartUp, ShoppingBag, Users, Wallet, Tag, MapPin, Settings, LogOut, Menu, Close, Storefront, Megaphone, ScrollText, UserPlus, LayoutGrid, Banknote, Percent, Coins, FileText, Truck, Palette, Bell } from "@/components/icons";
import {
  AnalyticsSection, ProductsSection, StaffSection,
  PaymentsSection, SubscriptionSection, LocationsSection,
} from "./DashboardSections";
import {
  BranchesSection, CatalogSection, CampaignsSection, CustomerGroupsSection,
  CustomersSection, BankAccountsSection, ActivitySection,
} from "./MoreSections";
import { DiscountsSection, ExpensesSection, InvoicesSection } from "./CommerceSections";
import {
  NotificationsSection, OrdersSection, OverviewHomeSection, SettingsDetailSection,
  ReportsSection, SuppliersSection, PurchaseOrdersSection, WalletSection, TemplatesSection,
} from "./OperationsSections";

export type SectionId = "overview" | "analytics" | "products" | "staff" | "payments" | "bank-accounts" | "subscription" | "locations" | "branches" | "catalog" | "campaigns" | "customer-groups" | "customers" | "discounts" | "expenses" | "invoices" | "orders" | "suppliers" | "purchase-orders" | "wallet" | "templates" | "notifications" | "reports" | "activity" | "settings";

const NAV: { id: SectionId; label: string; icon: ReactNode }[] = [
  { id: "overview", label: "Overview", icon: <Home className="h-5 w-5" /> },
  { id: "analytics", label: "Analytics", icon: <ChartUp className="h-5 w-5" /> },
  { id: "products", label: "Products", icon: <ShoppingBag className="h-5 w-5" /> },
  { id: "orders", label: "Orders & POS", icon: <ShoppingBag className="h-5 w-5" /> },
  { id: "catalog", label: "Catalog", icon: <LayoutGrid className="h-5 w-5" /> },
  { id: "branches", label: "Branches", icon: <MapPin className="h-5 w-5" /> },
  { id: "customers", label: "Customers", icon: <Users className="h-5 w-5" /> },
  { id: "customer-groups", label: "Customer groups", icon: <UserPlus className="h-5 w-5" /> },
  { id: "discounts", label: "Discounts", icon: <Percent className="h-5 w-5" /> },
  { id: "campaigns", label: "Campaigns", icon: <Megaphone className="h-5 w-5" /> },
  { id: "invoices", label: "Invoices", icon: <FileText className="h-5 w-5" /> },
  { id: "expenses", label: "Expenses", icon: <Coins className="h-5 w-5" /> },
  { id: "suppliers", label: "Suppliers", icon: <Truck className="h-5 w-5" /> },
  { id: "purchase-orders", label: "Purchase orders", icon: <Truck className="h-5 w-5" /> },
  { id: "wallet", label: "Wallet", icon: <Wallet className="h-5 w-5" /> },
  { id: "templates", label: "Templates", icon: <Palette className="h-5 w-5" /> },
  { id: "notifications", label: "Notifications", icon: <Bell className="h-5 w-5" /> },
  { id: "reports", label: "Reports", icon: <ChartUp className="h-5 w-5" /> },
  { id: "staff", label: "Staff & invites", icon: <ScrollText className="h-5 w-5" /> },
  { id: "payments", label: "Payments", icon: <Wallet className="h-5 w-5" /> },
  { id: "bank-accounts", label: "Bank accounts", icon: <Banknote className="h-5 w-5" /> },
  { id: "subscription", label: "Subscription", icon: <Tag className="h-5 w-5" /> },
  { id: "locations", label: "Locations", icon: <MapPin className="h-5 w-5" /> },
  { id: "activity", label: "Activity log", icon: <ScrollText className="h-5 w-5" /> },
  { id: "settings", label: "Settings", icon: <Settings className="h-5 w-5" /> },
];

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [section, setSection] = useState<SectionId>("overview");
  const [open, setOpen] = useState(false);

  if (!user) { window.location.hash = "/login"; return null; }
  if (user.needsOnboarding) { window.location.hash = "/onboarding"; return null; }

  const current = NAV.find((n) => n.id === section);
  const firstName = user.firstName ?? user.email.split("@")[0];
  const initial = (user.firstName?.charAt(0) ?? user.email.charAt(0)).toUpperCase();
  const site = user.subdomain ? `${user.subdomain}.brikoh.app` : null;

  const Sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between px-5">
        <a href="#/" className="inline-flex items-center gap-2"><Logo /></a>
      </div>

      <div className="mx-4 mb-4 rounded-2xl bg-gradient-to-br from-forest to-pine p-4 text-white">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-white/60">Your store</p>
        <p className="mt-1 truncate font-display text-sm font-extrabold">{user.storeName ?? "My Store"}</p>
        {site && <span className="mt-1 inline-block truncate font-mono text-[11px] text-sun">{site}</span>}
        {user.role && <span className="mt-1 inline-block rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold capitalize">{user.role.toLowerCase()}</span>}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3">
        {NAV.map((n) => (
          <button
            key={n.id}
            onClick={() => { setSection(n.id); setOpen(false); }}
            className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all ${
              section === n.id ? "bg-forest text-white shadow-lg shadow-forest/20" : "text-ink/65 hover:bg-ink/5 hover:text-ink"
            }`}
          >
            {n.icon} {n.label}
          </button>
        ))}
      </nav>

      <div className="border-t border-ink/5 p-4">
        {site && (
          <a href={`#/storefront/${user.subdomain}`} className="mb-3 flex items-center gap-2 rounded-xl bg-cream px-3.5 py-2.5 text-sm font-semibold text-ink/70 transition-colors hover:text-brand">
            <Storefront className="h-4 w-4" /> Open my storefront
          </a>
        )}
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-light to-brand text-sm font-bold text-white">{initial}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-ink">{firstName}</p>
            <p className="truncate text-xs text-muted">{user.email}</p>
          </div>
          <button onClick={logout} aria-label="Log out" className="grid h-8 w-8 place-items-center rounded-lg text-ink/40 hover:bg-red-50 hover:text-red-500"><LogOut className="h-4 w-4" /></button>
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
            <button onClick={() => setOpen(false)} className="absolute right-3 top-4 grid h-8 w-8 place-items-center rounded-lg text-ink/50 hover:bg-ink/5" aria-label="Close"><Close className="h-5 w-5" /></button>
            {Sidebar}
          </aside>
        </div>
      )}

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-ink/5 bg-white lg:block">{Sidebar}</aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-ink/5 bg-cream/85 backdrop-blur-xl">
          <div className="flex h-16 min-w-0 items-center gap-2 px-3 sm:gap-4 sm:px-8">
            <button onClick={() => setOpen(true)} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-ink/10 bg-white text-ink lg:hidden" aria-label="Open menu"><Menu className="h-5 w-5" /></button>
            <h1 className="min-w-0 flex-1 truncate font-display text-base font-extrabold tracking-tight text-ink sm:text-xl">{current?.label ?? "Dashboard"}</h1>
            <div className="ml-auto flex shrink-0 items-center gap-2">
              <ThemeToggle />
              <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-brand-light to-brand text-sm font-bold text-white">{initial}</span>
            </div>
          </div>
        </header>

        <main className="px-5 py-6 sm:px-8 sm:py-8">
          {section === "overview" && <OverviewHomeSection />}
          {section === "analytics" && <AnalyticsSection />}
          {section === "products" && <ProductsSection />}
          {section === "orders" && <OrdersSection />}
          {section === "catalog" && <CatalogSection />}
          {section === "branches" && <BranchesSection />}
          {section === "customers" && <CustomersSection />}
          {section === "customer-groups" && <CustomerGroupsSection />}
          {section === "campaigns" && <CampaignsSection />}
          {section === "discounts" && <DiscountsSection />}
          {section === "expenses" && <ExpensesSection />}
          {section === "invoices" && <InvoicesSection />}
          {section === "suppliers" && <SuppliersSection />}
          {section === "purchase-orders" && <PurchaseOrdersSection />}
          {section === "wallet" && <WalletSection />}
          {section === "templates" && <TemplatesSection />}
          {section === "notifications" && <NotificationsSection />}
          {section === "reports" && <ReportsSection />}
          {section === "staff" && <StaffSection />}
          {section === "payments" && <PaymentsSection />}
          {section === "bank-accounts" && <BankAccountsSection />}
          {section === "subscription" && <SubscriptionSection />}
          {section === "locations" && <LocationsSection />}
          {section === "activity" && <ActivitySection />}
          {section === "settings" && <SettingsDetailSection />}
        </main>
      </div>
    </div>
  );
}

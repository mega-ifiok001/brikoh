/**
 * Brikoh Ops Console — platform-level data for the company that owns Brikoh.
 * Admins oversee merchants, payments, plans, feature flags, templates & tickets.
 */

import { loadInventoryDB, saveInventoryDB } from "@/inventory/lib";

export const timeAgo = (iso: string): string => {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
};

/* ------------------------------ Admin auth ------------------------------ */

const SESSION_KEY = "brikoh_admin_session";
export const ADMIN_EMAIL = "admin@brikoh.app";
export const ADMIN_PASSWORD = "admin1234";

export function adminLogin(email: string, password: string) {
  return email.trim().toLowerCase() === ADMIN_EMAIL && password === ADMIN_PASSWORD;
}
export function getAdminSession() {
  try { return localStorage.getItem(SESSION_KEY) === "1"; } catch { return false; }
}
export function setAdminSession(v: boolean) {
  localStorage.setItem(SESSION_KEY, v ? "1" : "0");
}

/* -------------------------------- Plans -------------------------------- */

export type PlanConfig = { id: string; name: string; monthly: number; quarterly: number; popular: boolean };
const PLAN_KEY = "brikoh_admin_plans";

export const DEFAULT_PLANS: PlanConfig[] = [
  { id: "starter", name: "Starter", monthly: 0, quarterly: 0, popular: false },
  { id: "pro", name: "Pro", monthly: 16, quarterly: 12, popular: true },
  { id: "growth", name: "Growth", monthly: 39, quarterly: 32, popular: false },
];

export function loadPlans(): PlanConfig[] {
  try {
    const raw = localStorage.getItem(PLAN_KEY);
    if (raw) return JSON.parse(raw) as PlanConfig[];
  } catch { /* ignore */ }
  return DEFAULT_PLANS;
}
export function savePlans(p: PlanConfig[]) {
  localStorage.setItem(PLAN_KEY, JSON.stringify(p));
}

/* ----------------------------- Feature flags ---------------------------- */

export type FeatureFlag = {
  id: string;
  name: string;
  desc: string;
  enabled: boolean;
  group: "payments" | "inventory" | "marketing" | "platform";
  gated?: boolean; // true = requires banking/licensing partnership before enabling
};
const FLAG_KEY = "brikoh_admin_flags";

export const DEFAULT_FLAGS: FeatureFlag[] = [
  { id: "instant_settlement", name: "Instant settlement (Phase 2)", desc: "Funds available before Paystack's settlement window. Requires a licensed banking partner.", enabled: false, group: "payments", gated: true },
  { id: "wallet_interest", name: "Interest on wallet balance", desc: "Periodic INTEREST_PAYOUT accrual on balances. Requires a licensed partner.", enabled: false, group: "payments", gated: true },
  { id: "allow_overselling", name: "Allow overselling", desc: "Let sales exceed available stock when toggled on.", enabled: false, group: "inventory" },
  { id: "multi_branch", name: "Multi-branch & transfers", desc: "Per-location stock, settlement tracking and transfers.", enabled: true, group: "inventory" },
  { id: "marketing_campaigns", name: "Marketing campaigns", desc: "WhatsApp / SMS / email broadcasts for merchants.", enabled: true, group: "marketing" },
  { id: "ga_integration", name: "Google Analytics integration", desc: "Merchant GA4 connection inside Analytics.", enabled: true, group: "marketing" },
  { id: "staff_roles", name: "Staff roles & permissions", desc: "Owner / Admin / Manager / Cashier roles with audit.", enabled: true, group: "platform" },
];

export function loadFlags(): FeatureFlag[] {
  try {
    const raw = localStorage.getItem(FLAG_KEY);
    if (raw) return JSON.parse(raw) as FeatureFlag[];
  } catch { /* ignore */ }
  return DEFAULT_FLAGS;
}
export function saveFlags(f: FeatureFlag[]) {
  localStorage.setItem(FLAG_KEY, JSON.stringify(f));
}

/* ------------------------------ Templates ------------------------------- */

const TEMPLATE_KEY = "brikoh_admin_templates";

export function templateEnabled(id: string): boolean {
  try {
    const raw = JSON.parse(localStorage.getItem(TEMPLATE_KEY) || "{}");
    return raw[id] !== false;
  } catch { return true; }
}
export function setTemplateEnabled(id: string, on: boolean) {
  const raw = JSON.parse(localStorage.getItem(TEMPLATE_KEY) || "{}");
  raw[id] = on;
  localStorage.setItem(TEMPLATE_KEY, JSON.stringify(raw));
}

/* ------------------------------ Businesses ------------------------------ */

export type PlatformBusiness = {
  id: string;
  name: string;
  owner: string;
  email: string;
  country: string;
  currency: string;
  plan: string;
  status: "active" | "suspended";
  products: number;
  sales: number;
  revenue: number;
  createdAt: string;
  lastActive: string;
};

const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
};

export const DEFAULT_BUSINESSES: PlatformBusiness[] = [
  { id: "B-1001", name: "Amara & Co.", owner: "Ada Obi", email: "ada@brikoh.app", country: "Nigeria", currency: "NGN", plan: "Pro", status: "active", products: 124, sales: 1284, revenue: 2480300, createdAt: daysAgo(200), lastActive: daysAgo(0) },
  { id: "B-1002", name: "Kente Lane", owner: "Kwame Mensah", email: "kwame@brikoh.app", country: "Ghana", currency: "GHS", plan: "Growth", status: "active", products: 96, sales: 812, revenue: 1874200, createdAt: daysAgo(180), lastActive: daysAgo(1) },
  { id: "B-1003", name: "Lumé Skincare", owner: "Zainab Toure", email: "zainab@brikoh.app", country: "Nigeria", currency: "NGN", plan: "Pro", status: "active", products: 58, sales: 643, revenue: 1240500, createdAt: daysAgo(160), lastActive: daysAgo(2) },
  { id: "B-1004", name: "Nomad Coffee", owner: "David Mensah", email: "david@brikoh.app", country: "Kenya", currency: "KES", plan: "Starter", status: "active", products: 210, sales: 1540, revenue: 980300, createdAt: daysAgo(140), lastActive: daysAgo(3) },
  { id: "B-1005", name: "Atelier 9", owner: "Tolu Adeyemi", email: "tolu@brikoh.app", country: "Nigeria", currency: "NGN", plan: "Growth", status: "active", products: 75, sales: 512, revenue: 2040800, createdAt: daysAgo(120), lastActive: daysAgo(4) },
  { id: "B-1006", name: "Soko Studio", owner: "Nana Boateng", email: "nana@brikoh.app", country: "Ghana", currency: "GHS", plan: "Starter", status: "active", products: 23, sales: 186, revenue: 245600, createdAt: daysAgo(100), lastActive: daysAgo(9) },
  { id: "B-1007", name: "BrightFold", owner: "Fatima Bello", email: "fatima@brikoh.app", country: "Nigeria", currency: "NGN", plan: "Starter", status: "suspended", products: 12, sales: 48, revenue: 92100, createdAt: daysAgo(90), lastActive: daysAgo(21) },
  { id: "B-1008", name: "Olive & Oak", owner: "Peter Ade", email: "peter@brikoh.app", country: "South Africa", currency: "ZAR", plan: "Pro", status: "active", products: 152, sales: 968, revenue: 1650900, createdAt: daysAgo(70), lastActive: daysAgo(0) },
  { id: "B-1009", name: "Petal Press", owner: "Amina Yusuf", email: "amina@brikoh.app", country: "Egypt", currency: "USD", plan: "Pro", status: "active", products: 340, sales: 2210, revenue: 2980600, createdAt: daysAgo(50), lastActive: daysAgo(1) },
];

/** Merge demo businesses with any real registered businesses from localStorage. */
export function listBusinesses(): PlatformBusiness[] {
  const real: PlatformBusiness[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith("brikoh_business_")) {
      try {
        const b = JSON.parse(localStorage.getItem(k) || "{}");
        const email = k.replace("brikoh_business_", "");
        real.push({
          id: `B-${email.slice(0, 4).toUpperCase()}`,
          name: b.name || "Unnamed store",
          owner: b.name || "",
          email,
          country: b.country || "—",
          currency: b.currency || "NGN",
          plan: "Starter",
          status: "active",
          products: 0,
          sales: 0,
          revenue: 0,
          createdAt: b.createdAt || new Date().toISOString(),
          lastActive: new Date().toISOString(),
        });
      } catch { /* ignore */ }
    }
  }
  const all = [...real, ...DEFAULT_BUSINESSES];
  const seen = new Set<string>();
  return all.filter((b) => (seen.has(b.email) ? false : (seen.add(b.email), true)));
}

/* ------------------------------- Payments ------------------------------- */

export function platformWallet() {
  return loadInventoryDB();
}
export function listWithdrawals() {
  return loadInventoryDB().withdrawals;
}
export function approveWithdrawal(id: string) {
  const db = loadInventoryDB();
  db.withdrawals = db.withdrawals.map((w) =>
    w.id === id ? { ...w, status: "SUCCESSFUL" as const, completedAt: new Date().toISOString() } : w
  );
  saveInventoryDB(db);
}
export function listAudit() {
  return loadInventoryDB().audit;
}

/* -------------------------------- Tickets ------------------------------- */

export type Ticket = { id: string; name: string; email: string; topic: string; message: string; at: string; status: "new" | "resolved" };
const TICKET_KEY = "brikoh_tickets";

export function loadTickets(): Ticket[] {
  try {
    const raw = localStorage.getItem(TICKET_KEY);
    if (raw) return JSON.parse(raw) as Ticket[];
  } catch { /* ignore */ }
  return [];
}
export function addTicket(t: Omit<Ticket, "id" | "at" | "status">) {
  const list = loadTickets();
  list.unshift({ ...t, id: `TK-${Math.floor(1000 + Math.random() * 9000)}`, at: new Date().toISOString(), status: "new" });
  localStorage.setItem(TICKET_KEY, JSON.stringify(list));
}
export function setTicketStatus(id: string, status: Ticket["status"]) {
  const list = loadTickets().map((t) => (t.id === id ? { ...t, status } : t));
  localStorage.setItem(TICKET_KEY, JSON.stringify(list));
}

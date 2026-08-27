import type { Me } from "../context/AuthContext";

/**
 * Role-based navigation access.
 *
 * The backend is the source of truth for security (it returns
 * 403 / INSUFFICIENT_PERMISSIONS for anything a signed-in user may not do).
 * This module only decides what the CURRENT user *sees* in the UI, so a
 * restricted staff member never even sees a link they can't use — it never
 * grants anything.
 */

export const ROLE_IDS = ["OWNER", "ADMIN", "MANAGER", "STAFF"] as const;
export type RoleId = (typeof ROLE_IDS)[number];

/** Every feature that has a dedicated page in the dashboard. */
export type Feature =
  | "overview"
  | "pos"
  | "orders"
  | "storefront"
  | "products"
  | "branches"
  | "purchases"
  | "customers"
  | "invoices"
  | "discounts"
  | "wallet"
  | "expenses"
  | "reports"
  | "staff"
  | "settings";

export const ALL_FEATURES: Feature[] = [
  "overview",
  "pos",
  "orders",
  "storefront",
  "products",
  "branches",
  "purchases",
  "customers",
  "invoices",
  "discounts",
  "wallet",
  "expenses",
  "reports",
  "staff",
  "settings",
];

export const ROLE_META: Record<RoleId, { label: string; hint: string }> = {
  OWNER: { label: "Owner", hint: "Full access to everything" },
  ADMIN: { label: "Admin", hint: "Full access to everything" },
  MANAGER: { label: "Manager", hint: "Runs the day-to-day" },
  STAFF: { label: "Staff", hint: "Sales and stock only" },
};

/**
 * Base menu each limited role may browse.
 * OWNER / ADMIN implicitly get EVERYTHING via getAccess().
 */
const RESTRICTED_FEATURES: Record<"MANAGER" | "STAFF", readonly Feature[]> = {
  MANAGER: [
    "overview",
    "pos",
    "orders",
    "storefront",
    "products",
    "branches",
    "purchases",
    "customers",
    "invoices",
    "discounts",
    "wallet",
    "expenses",
  ],
  STAFF: ["overview", "pos", "orders", "products", "customers", "invoices"],
};

/**
 * Features that need a specific permission string on top of the role.
 * When a role grants a feature but the account has an explicit permission
 * list (between the /me shape and the staff-list shape), we also require the
 * matching permission. Empty/unknown permission lists are treated as "role
 * decides" (so owners and legacy staff are never blocked accidentally).
 */
const REQUIRED_PERMISSION: Partial<Record<Feature, string>> = {
  reports: "viewProfit",
  expenses: "manageExpenses",
  discounts: "manageDiscounts",
  purchases: "managePurchases",
  branches: "manageBranches",
  storefront: "manageStorefront",
};

function normalizeRole(v: unknown): RoleId | null {
  const s = String(v ?? "")
    .trim()
    .toUpperCase();
  return ROLE_IDS.includes(s as RoleId) ? (s as RoleId) : null;
}

export interface Access {
  role: RoleId;
  label: string;
  permissions: string[];
  can: (feature: Feature) => boolean;
}

/**
 * Figure out the signed-in user's role + permissions from the /me payload.
 * The backend nests these differently across versions, so we probe several
 * common paths. If we can't determine the role we default to OWNER — full
 * access — so the real owner (who may not have a role field at all) is never
 * hidden.
 */
export function getAccess(me: Me): Access {
  const acct = (me.account || {}) as any;
  const staff = (me.staff || {}) as any;

  const rawRole =
    acct.role ??
    staff.role ??
    staff.membership?.role ??
    acct.staffRole ??
    (acct.isOwner ? "OWNER" : undefined);
  const role = normalizeRole(rawRole) ?? "OWNER";

  const permRaw =
    staff.permissions ?? acct.permissions ?? (me as any).permissions ?? [];
  const permissions = Array.isArray(permRaw) ? permRaw.map((p: any) => String(p)) : [];

  const effectiveRole = role === "OWNER" || role === "ADMIN" ? "OWNER" : role;
  const grantAll = permissions.some((p) => p.toLowerCase() === "all");

  const base =
    effectiveRole === "MANAGER" || effectiveRole === "STAFF"
      ? RESTRICTED_FEATURES[effectiveRole]
      : ALL_FEATURES;

  const can = (feature: Feature): boolean => {
    // Owners + Admins + anyone we couldn't identify see everything.
    if (effectiveRole === "OWNER") return true;

    const allowed = base as readonly Feature[];
    if (!allowed.includes(feature)) return false;

    if (grantAll) return true;

    // Only enforce fine-grained permissions when we actually have a list.
    const need = REQUIRED_PERMISSION[feature];
    if (need && permissions.length > 0 && !permissions.includes(need)) {
      return false;
    }
    return true;
  };

  return {
    role,
    label: ROLE_META[role].label,
    permissions,
    can,
  };
}
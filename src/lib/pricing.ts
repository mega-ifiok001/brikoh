/**
 * Platform subscription pricing — the single source of truth for every
 * surface that shows a plan price (the marketing landing page and the
 * dashboard's Settings → Plan tab).
 *
 * IMPORTANT: these figures are DISPLAY ONLY. The amount actually charged is
 * decided server-side from the admin-configured
 * `SubscriptionPlanSetting.monthlyPrice` + `paystackPlanCode` for the tier,
 * and is echoed back by POST /api/dashboard/subscriptions/checkout as
 * `amount`. Editing a number here never changes what a merchant is billed —
 * to change a real price, update the plan setting in the admin backend.
 *
 * Caps mirror the subscription API contract exactly, so the copy on both
 * surfaces can never drift from what the API actually enforces:
 *
 *   tier        staff location product order  templates  customDomain  advAnalytics  marketing
 *   STARTER     1     1        100     1,000  3          no            no            no
 *   PRO         10    3        500     5,000  5          yes           yes           no
 *   ENTERPRISE  null  null     null    null   null       yes           yes           yes
 *
 * A `null` cap means UNLIMITED. A store with no subscription row at all gets
 * unlimited staff/locations/products/orders too, with one deliberate
 * exception: templates fall back to the STARTER set (3) so template selection
 * still works at onboarding, before billing is wired up.
 */

export type BillableTier = "STARTER" | "PRO" | "ENTERPRISE";

export const BILLABLE_TIERS: readonly BillableTier[] = [
  "STARTER",
  "PRO",
  "ENTERPRISE",
];

/**
 * Monthly list price in the store currency (NGN). `null` means the tier is
 * custom-priced — the UI should offer "Talk to sales" rather than a figure.
 */
export const TIER_MONTHLY_PRICE: Record<BillableTier, number | null> = {
  STARTER: 5000,
  PRO: 10000,
  ENTERPRISE: null,
};

/** Relative ordering — decides upgrade vs. downgrade for a logged-in owner. */
export const TIER_RANK: Record<BillableTier, number> = {
  STARTER: 0,
  PRO: 1,
  ENTERPRISE: 2,
};

export const TIER_LABEL: Record<BillableTier, string> = {
  STARTER: "Starter",
  PRO: "Pro",
  ENTERPRISE: "Enterprise",
};

/** Per-resource caps, straight from the contract (null = unlimited). */
export const TIER_LIMITS: Record<
  BillableTier,
  {
    staffCap: number | null;
    locationCap: number | null;
    productCap: number | null;
    orderCap: number | null;
    templateCap: number | null;
  }
> = {
  STARTER: {
    staffCap: 1,
    locationCap: 1,
    productCap: 100,
    orderCap: 1000,
    templateCap: 3,
  },
  PRO: {
    staffCap: 10,
    locationCap: 3,
    productCap: 500,
    orderCap: 5000,
    templateCap: 5,
  },
  ENTERPRISE: {
    staffCap: null,
    locationCap: null,
    productCap: null,
    orderCap: null,
    templateCap: null,
  },
};

export function isBillableTier(v: unknown): v is BillableTier {
  return typeof v === "string" && (BILLABLE_TIERS as readonly string[]).includes(v);
}

/** Monthly price for a tier, or `null` when it's custom-priced/unknown. */
export function tierMonthlyPrice(tier: string): number | null {
  return isBillableTier(tier) ? TIER_MONTHLY_PRICE[tier] : null;
}

/** Human label for the price line — "₦10,000", or null when custom. */
export function tierPriceLabel(tier: string): string | null {
  const n = tierMonthlyPrice(tier);
  return n == null ? null : `₦${n.toLocaleString("en-NG")}`;
}

export function isHigherTier(from: string, to: string): boolean {
  if (!isBillableTier(from) || !isBillableTier(to)) return false;
  return TIER_RANK[to] > TIER_RANK[from];
}

export function isLowerTier(from: string, to: string): boolean {
  if (!isBillableTier(from) || !isBillableTier(to)) return false;
  return TIER_RANK[to] < TIER_RANK[from];
}

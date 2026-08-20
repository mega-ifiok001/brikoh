/**
 * Brikoh business profile — persisted per user in localStorage.
 */

export type BusinessProfile = {
  name: string;
  category: string;
  country: string;
  city: string;
  currency: string;
  phone: string;
  wantsWebsite: boolean;
  websiteLive: boolean;
  websiteName?: string;
  whatsapp?: string;
  template?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  accent?: string;
  tagline?: string;
  createdAt: string;
};

const key = (email: string) => `brikoh_business_${email.toLowerCase()}`;

export function getBusiness(email: string): BusinessProfile | null {
  try {
    const raw = localStorage.getItem(key(email));
    return raw ? (JSON.parse(raw) as BusinessProfile) : null;
  } catch {
    return null;
  }
}

export function saveBusiness(email: string, profile: BusinessProfile) {
  localStorage.setItem(key(email), JSON.stringify(profile));
}

export function updateBusiness(email: string, patch: Partial<BusinessProfile>) {
  const cur = getBusiness(email);
  if (!cur) return;
  saveBusiness(email, { ...cur, ...patch });
}

/** Map an API StoreProfile (storeId/subdomain tenant) into the local BusinessProfile. */
export function fromApiStore(store: {
  id?: string;
  name: string;
  subdomain: string;
  category?: string;
  country?: string;
  city?: string;
  currency?: string;
  phone?: string;
  whatsapp?: string;
  template?: string;
  websiteLive?: boolean;
  plan?: string;
  createdAt?: string;
}): BusinessProfile {
  return {
    name: store.name,
    category: store.category ?? "Other",
    country: store.country ?? "",
    city: store.city ?? "",
    currency: store.currency ?? "NGN",
    phone: store.phone ?? "",
    whatsapp: store.whatsapp,
    websiteName: store.subdomain,
    template: store.template,
    websiteLive: store.websiteLive ?? true,
    wantsWebsite: true,
    createdAt: store.createdAt ?? new Date().toISOString(),
  };
}

export const CURRENCY_SYMBOLS: Record<string, string> = {
  NGN: "₦",
  USD: "$",
  GHS: "GH₵",
  KES: "KSh",
  ZAR: "R",
  GBP: "£",
  EUR: "€",
};

export const fmtMoney = (currency: string, amount: number) =>
  `${CURRENCY_SYMBOLS[currency] ?? ""}${amount.toLocaleString(undefined, {
    maximumFractionDigits: 0,
  })}`;

/**
 * Brikoh marketing — Bumpa-style campaigns, coupons & social links.
 * Persisted to localStorage for the demo.
 */

export type Campaign = {
  id: string;
  name: string;
  channel: "whatsapp" | "sms" | "email";
  audience: "all" | "vip" | "group" | "wholesale";
  audienceLabel: string;
  message: string;
  sentAt: string;
  delivered: number;
  opened: number;
  status: "sent" | "scheduled";
};

export type Coupon = {
  id: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  expires: string | null;
  maxUses: number;
  uses: number;
  active: boolean;
};

export type Socials = { instagram: string; facebook: string; tiktok: string; website: string };

export type MarketingState = { campaigns: Campaign[]; coupons: Coupon[]; socials: Socials };

const KEY = "brikoh_marketing";
const daysAgo = (n: number, h = 10) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(h, 24, 0, 0);
  return d.toISOString();
};
const daysAhead = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

function seed(): MarketingState {
  return {
    campaigns: [
      { id: "CMP-1001", name: "Beauty week flash sale", channel: "whatsapp", audience: "all", audienceLabel: "All customers", message: "Hi! 🌸 15% off all skincare this week at Amara & Co. Shop now!", sentAt: daysAgo(2), delivered: 862, opened: 431, status: "sent" },
      { id: "CMP-1002", name: "VIP early access", channel: "email", audience: "vip", audienceLabel: "VIP Customers", message: "You get first access to the new Ankara collection — 48h early.", sentAt: daysAgo(5), delivered: 24, opened: 19, status: "sent" },
    ],
    coupons: [
      { id: "CPN-1", code: "BEAUTY15", type: "percentage", value: 15, expires: daysAhead(4), maxUses: 200, uses: 87, active: true },
      { id: "CPN-2", code: "WELCOME10", type: "percentage", value: 10, expires: null, maxUses: 1000, uses: 412, active: true },
      { id: "CPN-3", code: "FIXED2000", type: "fixed", value: 2000, expires: daysAhead(10), maxUses: 50, uses: 12, active: false },
    ],
    socials: { instagram: "https://instagram.com/amaraandco", facebook: "", tiktok: "https://tiktok.com/@amaraandco", website: "" },
  };
}

export function loadMarketing(): MarketingState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as MarketingState;
  } catch { /* ignore */ }
  return seed();
}

export function saveMarketing(s: MarketingState) {
  localStorage.setItem(KEY, JSON.stringify(s));
}

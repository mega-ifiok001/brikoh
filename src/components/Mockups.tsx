import type { ReactNode } from "react";
import { Storefront, Receipt, Wallet, Box, Bell, ChartUp, ArrowRight, Check, Truck } from "./icons";

/* ---------------- Phone frame ---------------- */

export function PhoneFrame({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <div className="relative mx-auto w-[268px] rounded-[2.6rem] border border-ink/10 bg-ink p-2.5 shadow-[0_40px_80px_-20px_rgba(20,90,50,0.45)]">
        <div className="overflow-hidden rounded-[2.1rem] bg-cream">
          {/* notch */}
          <div className="relative flex h-6 items-center justify-center bg-cream">
            <div className="absolute top-1.5 h-1.5 w-20 rounded-full bg-ink/15" />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

/* Hero phone dashboard */
export function PhoneDashboard() {
  const actions = [
    { icon: <Storefront className="h-4 w-4" />, label: "Store", tint: "text-brand" },
    { icon: <Receipt className="h-4 w-4" />, label: "Invoice", tint: "text-pine" },
    { icon: <Box className="h-4 w-4" />, label: "Stock", tint: "text-brand" },
    { icon: <Wallet className="h-4 w-4" />, label: "Pay", tint: "text-pine" },
  ];
  const bars = [42, 58, 36, 72, 50, 88, 64];
  const orders = [
    { name: "Adaeze O.", item: "Ankara set", amt: "₦18,500", status: "Paid" },
    { name: "Kwame M.", item: "Leather bag", amt: "$42.00", status: "Shipped" },
    { name: "Zainab T.", item: "Skincare kit", amt: "₦9,200", status: "Paid" },
  ];
  return (
    <PhoneFrame>
      <div className="px-4 pb-5 pt-1">
        {/* header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] text-muted">Good morning</p>
            <p className="font-display text-[15px] font-bold text-ink">Amara B.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-white shadow-sm ring-1 ring-ink/5">
              <Bell className="h-4 w-4 text-ink" />
            </span>
            <span className="h-8 w-8 rounded-full bg-gradient-to-br from-sun to-brand" />
          </div>
        </div>

        {/* balance card */}
        <div className="relative mt-3 overflow-hidden rounded-2xl bg-gradient-to-br from-forest to-pine p-4 text-white shadow-lg shadow-forest/30">
          <div className="absolute -right-6 -top-8 h-24 w-24 rounded-full bg-leaf/30 blur-xl" />
          <p className="text-[11px] font-medium text-white/70">Total revenue · June</p>
          <p className="mt-1 font-display text-2xl font-extrabold tracking-tight">₦2,480,300</p>
          <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold">
            <ChartUp className="h-3 w-3" /> +12.5% this week
          </div>
        </div>

        {/* quick actions */}
        <div className="mt-3 grid grid-cols-4 gap-2">
          {actions.map((a) => (
            <div key={a.label} className="flex flex-col items-center gap-1.5 rounded-xl bg-white p-2 shadow-sm ring-1 ring-ink/5">
              <span className={`${a.tint}`}>{a.icon}</span>
              <span className="text-[9px] font-medium text-muted">{a.label}</span>
            </div>
          ))}
        </div>

        {/* mini chart */}
        <div className="mt-3 rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-ink/5">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-ink">Sales this week</p>
            <span className="text-[9px] font-semibold text-leaf">7-day</span>
          </div>
          <div className="mt-3 flex h-16 items-end justify-between gap-1.5">
            {bars.map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-full bg-gradient-to-t from-brand/30 to-brand"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>

        {/* orders */}
        <div className="mt-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-ink/5">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-ink">Recent orders</p>
            <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-brand">
              All <ArrowRight className="h-3 w-3" />
            </span>
          </div>
          <div className="mt-2 space-y-2">
            {orders.map((o) => (
              <div key={o.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-cream text-[10px] font-bold text-forest">
                    {o.name[0]}
                  </span>
                  <div>
                    <p className="text-[10px] font-semibold text-ink">{o.name}</p>
                    <p className="text-[9px] text-muted">{o.item}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-ink">{o.amt}</p>
                  <span
                    className={`text-[8px] font-semibold ${
                      o.status === "Shipped" ? "text-brand" : "text-leaf"
                    }`}
                  >
                    {o.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}

/* Floating toast cards used around the hero phone */
export function FloatCard({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`absolute rounded-2xl border border-ink/5 bg-white/95 p-3 shadow-xl shadow-ink/10 backdrop-blur ${className}`}
    >
      {children}
    </div>
  );
}

export function PaymentToast() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-full bg-leaf/15 text-leaf">
        <Check className="h-5 w-5" />
      </span>
      <div>
        <p className="text-xs font-bold text-ink">Payment received</p>
        <p className="text-[11px] text-muted">+$120.00 · Stripe</p>
      </div>
    </div>
  );
}

export function OrderToast() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-full bg-brand/15 text-brand">
        <Truck className="h-5 w-5" />
      </span>
      <div>
        <p className="text-xs font-bold text-ink">Order #2041 shipped</p>
        <p className="text-[11px] text-muted">Auto-tracked to customer</p>
      </div>
    </div>
  );
}

/* Browser/website mockup */
export function BrowserMockup({ className = "" }: { className?: string }) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-2xl shadow-forest/10 ${className}`}>
      <div className="flex items-center gap-1.5 border-b border-ink/5 bg-cream px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        <div className="ml-3 flex-1 rounded-md bg-white px-3 py-1 text-[10px] text-muted ring-1 ring-ink/5">
          amara-store.brikoh.app
        </div>
      </div>
      <div className="bg-gradient-to-br from-forest to-pine p-5 text-white">
        <div className="flex items-center justify-between">
          <span className="font-display text-sm font-bold">AMARA & CO.</span>
          <div className="hidden gap-3 text-[9px] text-white/70 sm:flex">
            <span>Shop</span>
            <span>About</span>
            <span>Contact</span>
            <span className="rounded-full bg-sun px-2 py-0.5 font-semibold text-ink">Cart 2</span>
          </div>
        </div>
        <div className="mt-6 max-w-[70%]">
          <p className="font-display text-lg font-extrabold leading-tight">
            Handcrafted goods, made with love.
          </p>
          <div className="mt-2 flex gap-2">
            <span className="rounded-full bg-sun px-3 py-1 text-[9px] font-bold text-ink">Shop now</span>
            <span className="rounded-full border border-white/40 px-3 py-1 text-[9px] font-semibold">
              Our story
            </span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 p-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-xl bg-cream p-2">
            <div className={`h-12 rounded-lg bg-gradient-to-br ${["from-sun/40 to-brand/40", "from-leaf/40 to-pine/40", "from-brand/30 to-sun/40"][i]}`} />
            <div className="mt-1.5 h-1.5 w-3/4 rounded-full bg-ink/10" />
            <div className="mt-1 h-1.5 w-1/2 rounded-full bg-brand/30" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* Analytics dashboard card */
export function AnalyticsCard() {
  const cats = ["W1", "W2", "W3", "W4"];
  return (
    <div className="w-full rounded-3xl border border-ink/5 bg-white p-5 shadow-2xl shadow-forest/10">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-muted">Net profit · YTD</p>
          <p className="font-display text-2xl font-extrabold text-ink">₦8.42M</p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-leaf/10 px-2.5 py-1 text-xs font-bold text-leaf">
          <ChartUp className="h-3.5 w-3.5" /> 24%
        </span>
      </div>

      {/* area chart */}
      <div className="relative mt-4 h-32">
        <svg viewBox="0 0 320 120" className="h-full w-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#27AE60" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#27AE60" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M0,90 L40,72 L80,84 L120,50 L160,58 L200,30 L240,40 L280,12 L320,22 L320,120 L0,120 Z"
            fill="url(#areaGrad)"
          />
          <path
            d="M0,90 L40,72 L80,84 L120,50 L160,58 L200,30 L240,40 L280,12 L320,22"
            fill="none"
            stroke="#1E8449"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div className="mt-1 flex justify-between text-[10px] font-medium text-muted">
        {cats.map((c) => (
          <span key={c}>{c}</span>
        ))}
      </div>

      {/* mini stats */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        {[
          { k: "Avg. order", v: "₦14.2k" },
          { k: "Top product", v: "Ankara" },
          { k: "Conversion", v: "6.4%" },
        ].map((s) => (
          <div key={s.k} className="rounded-xl bg-cream p-2.5">
            <p className="text-[9px] text-muted">{s.k}</p>
            <p className="text-xs font-bold text-ink">{s.v}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* Invoice card */
export function InvoiceCard() {
  const rows = [
    { n: "1", desc: "Embroidered gown", qty: "2", amt: "₦36,000" },
    { n: "2", desc: "Beaded clutch", qty: "1", amt: "₦12,500" },
  ];
  return (
    <div className="w-full max-w-sm rounded-3xl border border-ink/5 bg-white p-5 shadow-2xl shadow-forest/10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand/10 text-brand">
            <Receipt className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-bold text-ink">Invoice #BRK-0192</p>
            <p className="text-[11px] text-muted">Issued 12 Jun · Due 26 Jun</p>
          </div>
        </div>
        <span className="rounded-full bg-leaf/10 px-2.5 py-1 text-[10px] font-bold text-leaf">PAID</span>
      </div>
      <div className="mt-4 space-y-2">
        {rows.map((r) => (
          <div key={r.n} className="flex items-center justify-between rounded-xl bg-cream px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-white text-[9px] font-bold text-forest ring-1 ring-ink/5">
                {r.n}
              </span>
              <span className="text-xs font-medium text-ink">{r.desc}</span>
            </div>
            <span className="text-xs font-semibold text-ink">{r.amt}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-dashed border-ink/10 pt-3">
        <span className="text-sm font-bold text-ink">Total</span>
        <span className="font-display text-lg font-extrabold text-brand">₦48,500</span>
      </div>
    </div>
  );
}

/* Payments wallet card */
export function PaymentCard() {
  const methods = ["Visa", "Mastercard", "Paystack", "Stripe", "Bank"];
  return (
    <div className="w-full max-w-sm rounded-3xl border border-ink/5 bg-white p-5 shadow-2xl shadow-forest/10">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-ink">Accept payments</p>
        <Wallet className="h-5 w-5 text-pine" />
      </div>
      <div className="mt-4 rounded-2xl bg-gradient-to-br from-forest to-pine p-4 text-white">
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-white/70">Available balance</p>
          <span className="text-[10px] font-semibold text-white/70">USD · NGN</span>
        </div>
        <p className="mt-1 font-display text-2xl font-extrabold">$12,480.50</p>
        <div className="mt-3 flex items-end justify-between">
          <span className="text-sm font-semibold tracking-widest">•••• 4921</span>
          <span className="h-6 w-9 rounded bg-sun/80" />
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {methods.map((m) => (
          <span
            key={m}
            className="rounded-full bg-cream px-2.5 py-1 text-[10px] font-semibold text-ink/70 ring-1 ring-ink/5"
          >
            {m}
          </span>
        ))}
      </div>
    </div>
  );
}

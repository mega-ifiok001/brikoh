import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE } from "../lib/api";
import { cls } from "../lib/format";
import { Icon } from "../components/ui";

const IMG = {
  chilies:
    "https://images.pexels.com/photos/34143550/pexels-photo-34143550.jpeg?auto=compress&cs=tinysrgb&dpr=1&fit=crop&h=420&w=560",
  textiles:
    "https://images.pexels.com/photos/36966422/pexels-photo-36966422.jpeg?auto=compress&cs=tinysrgb&dpr=1&fit=crop&h=420&w=560",
  spices:
    "https://images.pexels.com/photos/28641901/pexels-photo-28641901.jpeg?auto=compress&cs=tinysrgb&dpr=1&fit=crop&h=560&w=1200",
};

const CATEGORIES = [
  "Foods & drink",
  "Fashion & wearables",
  "Health & beauty",
  "Electronics",
  "Agriculture",
  "Prof. services",
];

const PRICING_PLANS = [
  {
    tier: "STARTER",
    name: "Starter",
    description: "Everything you need to get your store up and running.",
    price: 5000,
    popular: false,
    features: [
      "1 staff member",
      "1 business location",
      "Up to 100 products",
      "Up to 1,000 orders / month",
      "3 storefront templates",
      "Point of sale",
      "Public storefront",
      "Inventory & stock management",
      "Customers & invoices",
      "Wallet & payouts",
      "Reports & expenses",
    ],
  },
  {
    tier: "PRO",
    name: "Pro",
    description: "More capacity and powerful tools for growing businesses.",
    price: 10000,
    popular: true,
    features: [
      "Up to 10 staff members",
      "Up to 3 business locations",
      "Up to 500 products",
      "Up to 5,000 orders / month",
      "5 storefront templates",
      "Everything in Starter",
      "Custom domain",
      "Advanced analytics",
      "Wallet & payouts",
      "Reports & expenses",
    ],
  },
  {
    tier: "ENTERPRISE",
    name: "Enterprise",
    description: "Unlimited capacity and the full Brikoh toolkit for businesses operating at scale.",
    price: null,
    popular: false,
    features: [
      "Unlimited staff members",
      "Unlimited business locations",
      "Unlimited products",
      "Unlimited orders",
      "Unlimited storefront templates",
      "Everything in Pro",
      "Custom domain",
      "Advanced analytics",
      "Marketing tools",
      "Dedicated support",
    ],
  },
];

const FEATURES = [
  {
    icon: "pos",
    title: "Point of sale",
    body: "Ring up cash, transfer and credit sales in seconds. Stock moves itself, receipts print clean, walk-ins become customers.",
  },
  {
    icon: "store",
    title: "Public storefront",
    body: "A ready-made brikoh.com storefront your customers can browse and check out on — paid online through Paystack.",
  },
  {
    icon: "box",
    title: "Inventory & branches",
    body: "Per-branch stock that never goes negative, one-tap transfers between branches, and low-stock & expiry alerts that email you first.",
  },
  {
    icon: "wallet",
    title: "Wallet & payouts",
    body: "Online sales land straight in your Brikoh wallet. Withdraw to your own bank account whenever you like — fees shown up front.",
  },
  {
    icon: "users",
    title: "Customers, credit & invoices",
    body: "Track who owes you what, take partial repayments, and issue numbered invoices with a proper payment ledger behind them.",
  },
  {
    icon: "chart",
    title: "Reports & expenses",
    body: "Profit & loss, expense breakdowns by category, revenue by channel. No spreadsheet, no weekend maths.",
  },
];

function HealthDot() {
  const [state, setState] = useState<"checking" | "online" | "offline">("checking");
  useEffect(() => {
    let alive = true;
    fetch(`${API_BASE}/api/public/health`)
      .then((r) => alive && setState(r.ok ? "online" : "offline"))
      .catch(() => alive && setState("offline"));
    return () => {
      alive = false;
    };
  }, []);
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-cream-200 bg-white px-2.5 py-1 text-[11px] font-bold text-ink-500">
      <span
        className={cls(
          "h-1.5 w-1.5 rounded-full",
          state === "online" && "bg-leaf-500",
          state === "offline" && "bg-danger-500",
          state === "checking" && "bg-gold-600"
        )}
      />
      {state === "checking" ? "Checking API…" : state === "online" ? "API online" : "API unreachable"}
    </span>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-cream-50">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-cream-200 bg-cream-50/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-white">
              <Icon name="logo" size={22} />
            </span>
            <span className="font-display text-xl font-extrabold tracking-tight">brikoh</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-bold text-ink-500 md:flex">
            <a href="#inside" className="hover:text-ink-900">What's inside</a>
            <a href="#how" className="hover:text-ink-900">How it works</a>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Link
              to="/auth"
              className="rounded-[10px] px-3.5 py-2 text-sm font-bold text-ink-700 hover:bg-cream-100"
            >
              Sign in
            </Link>
            <Link
              to="/auth?mode=register"
              className="rounded-[10px] bg-brand-500 px-3.5 py-2 text-sm font-bold text-white shadow-[0_2px_8px_rgba(217,83,42,.3)] transition-colors hover:bg-brand-600"
            >
              Start free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pb-14 pt-12 sm:px-6 lg:pt-16">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
          <div className="anim-rise">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-extrabold text-brand-700">
              <Icon name="zap" size={13} />
              Free to start · no card needed
            </span>
            <h1 className="mt-5 font-display text-[42px] font-extrabold leading-[1.04] tracking-tight sm:text-[56px]">
              Your store, your market, <span className="text-brand-500">your business.</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-ink-500">
              Products, point of sale, a public storefront, orders, customers and payouts —
              the entire market of your business in one warm, fast dashboard.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                to="/auth?mode=register"
                className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-3.5 text-[15px] font-extrabold text-white shadow-[0_4px_14px_rgba(217,83,42,.35)] transition-all hover:bg-brand-600 hover:shadow-[0_6px_18px_rgba(217,83,42,.4)]"
              >
                Start your store
                <Icon name="arrowRight" size={17} />
              </Link>
              <Link
                to="/auth"
                className="inline-flex items-center gap-2 rounded-xl border border-cream-300 bg-white px-6 py-3.5 text-[15px] font-extrabold text-ink-800 hover:border-brand-300 hover:text-brand-600"
              >
                I already have one
              </Link>
            </div>
            <div className="mt-7 flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <span key={c} className="chip cursor-default">
                  {c}
                </span>
              ))}
            </div>
          </div>

          {/* Collage */}
          <div className="anim-rise relative mx-auto w-full max-w-md select-none [animation-delay:120ms]">
            <div className="absolute -inset-6 -z-10 rounded-[36px] bg-gradient-to-br from-brand-100 via-cream-100 to-gold-100" />
            <div className="card rotate-1 p-4">
              <div className="flex gap-3">
                <img
                  src={IMG.chilies}
                  alt="Dried chilies at a market"
                  className="h-20 w-24 rounded-lg object-cover"
                  loading="lazy"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-extrabold">Ata rodo, 500g</p>
                  <p className="text-xs font-semibold text-ink-400">Dried chilies · Zaria market</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="font-display text-lg font-extrabold tabular-nums">₦4,500</span>
                    <span className="rounded-full bg-leaf-100 px-2 py-0.5 text-[10px] font-extrabold uppercase text-leaf-700">
                      128 in stock
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-3 border-t border-cream-100 pt-3">
                <div className="flex items-center justify-between text-xs font-bold text-ink-500">
                  <span>Ticket ORD-0241 · just now</span>
                  <span className="rounded-full bg-leaf-100 px-2 py-0.5 text-[10px] font-extrabold uppercase text-leaf-700">
                    Paid · cash
                  </span>
                </div>
              </div>
            </div>

            <div className="card ml-10 mt-4 -rotate-1 p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-leaf-100 text-leaf-700">
                  <Icon name="wallet" size={18} />
                </span>
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-ink-400">
                    Wallet available
                  </p>
                  <p className="font-display text-xl font-extrabold tabular-nums">₦482,300.50</p>
                </div>
                <span className="ml-auto rounded-lg bg-ink-900 px-3 py-1.5 text-xs font-extrabold text-cream-50">
                  Withdraw
                </span>
              </div>
            </div>

            <div className="card mr-8 mt-4 rotate-2 p-4">
              <div className="flex items-center gap-3">
                <img
                  src={IMG.textiles}
                  alt="Ankara textiles"
                  className="h-14 w-14 rounded-lg object-cover"
                  loading="lazy"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-extrabold">Ankara print, 6 yards</p>
                  <p className="text-xs font-semibold text-ink-400">
                    <span className="text-leaf-600">PUBLISHED</span> · on your storefront
                  </p>
                </div>
              </div>
            </div>

            <div className="card mt-4 -rotate-1 p-3.5">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <Icon name="store" size={15} />
                </span>
                <p className="text-xs font-extrabold text-ink-700">chioma.brikoh.com is live</p>
                <span className="ml-auto h-2 w-2 animate-pulse rounded-full bg-leaf-500" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Photo band */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl">
          <img
            src={IMG.spices}
            alt="A vibrant open-air market"
            className="h-64 w-full object-cover sm:h-80"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-ink-900/80 via-ink-900/40 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-10">
            <p className="font-display text-2xl font-extrabold leading-snug text-cream-50 sm:text-4xl">
              Built for the way markets actually move.
            </p>
            <p className="mt-2 max-w-md text-sm font-semibold text-cream-100/80 sm:text-base">
              From the morning restock to the last cash drawer — every kobo accounted for.
            </p>
          </div>
        </div>
      </section>

      {/* What's inside */}
      <section id="inside" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="max-w-xl">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-brand-600">
            What's inside
          </p>
          <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            One dashboard runs the whole shop
          </h2>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className={cls(
                "card anim-rise p-5 transition-shadow hover:shadow-md",
                i === 0 && "sm:col-span-2 lg:col-span-1"
              )}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <Icon name={f.icon} size={21} />
              </span>
              <h3 className="mt-4 text-lg font-extrabold">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-500">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

 {/* Pricing */}
<section id="pricing" className="border-y border-cream-200 bg-cream-50">
  <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-brand-600">
        Pricing
      </p>

      <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
        Simple pricing. No surprises.
      </h2>

      <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-ink-500 sm:text-base">
        Start small, grow your store, and upgrade when you need more.
        Every plan gives you the tools to run your business.
      </p>
    </div>

    <div className="mt-12 grid gap-5 lg:grid-cols-3">
      {PRICING_PLANS.map((plan) => (
        <div
          key={plan.tier}
          className={cls(
            "relative flex flex-col rounded-3xl border bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-lg sm:p-7",
            plan.popular
              ? "border-brand-400 shadow-[0_8px_30px_rgba(217,83,42,.12)]"
              : "border-cream-200"
          )}
        >
          {plan.popular && (
            <span className="absolute right-5 top-5 rounded-full bg-brand-500 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white">
              Most popular
            </span>
          )}

          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-brand-600">
            {plan.name}
          </p>

          <h3 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-ink-900">
            {plan.name}
          </h3>

          <p className="mt-2 min-h-[48px] text-sm leading-relaxed text-ink-500">
            {plan.description}
          </p>

          {/* Price */}
          <div className="mt-6 border-y border-cream-100 py-5">
            {plan.price !== null ? (
              <>
                <div className="flex items-end gap-1">
                  <span className="text-sm font-bold text-ink-500">₦</span>
                  <span className="font-display text-4xl font-extrabold tracking-tight text-ink-900">
                    {plan.price.toLocaleString()}
                  </span>
                  <span className="mb-1 text-sm font-semibold text-ink-400">
                    / month
                  </span>
                </div>

                <p className="mt-1 text-xs font-semibold text-ink-400">
                  Cancel or upgrade anytime
                </p>
              </>
            ) : (
              <>
                <p className="font-display text-3xl font-extrabold tracking-tight text-ink-900">
                  Let&apos;s talk
                </p>

                <p className="mt-1 text-xs font-semibold text-ink-400">
                  Pricing tailored to your business
                </p>
              </>
            )}
          </div>

          {/* Features */}
          <div className="mt-6">
            <p className="text-xs font-extrabold uppercase tracking-wider text-ink-400">
              What&apos;s included
            </p>

            <ul className="mt-4 space-y-3">
              {plan.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-2.5 text-sm font-semibold text-ink-700"
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-leaf-100 text-leaf-700">
                    <Icon name="check" size={12} />
                  </span>

                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* CTA */}
          <div className="mt-auto pt-8">
            {plan.tier === "ENTERPRISE" ? (
              <a
                href="mailto:sales@brikoh.com?subject=Brikoh%20Enterprise%20Plan"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-cream-300 bg-white px-5 py-3.5 text-sm font-extrabold text-ink-800 transition-all hover:border-brand-300 hover:text-brand-600"
              >
                Talk to sales
                <Icon name="arrowRight" size={16} />
              </a>
            ) : (
              <Link
                to="/auth?mode=register"
                className={cls(
                  "flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-extrabold transition-all",
                  plan.popular
                    ? "bg-brand-500 text-white shadow-[0_4px_14px_rgba(217,83,42,.25)] hover:bg-brand-600"
                    : "border border-cream-300 bg-white text-ink-800 hover:border-brand-300 hover:text-brand-600"
                )}
              >
                Start with {plan.name}
                <Icon name="arrowRight" size={16} />
              </Link>
            )}
          </div>
        </div>
      ))}
    </div>

    <div className="mx-auto mt-8 max-w-3xl rounded-2xl border border-cream-200 bg-white p-5">
      <div className="flex gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
          <Icon name="zap" size={16} />
        </span>

        <div>
          <p className="text-sm font-extrabold text-ink-800">
            Built to grow with your business
          </p>

          <p className="mt-1 text-xs leading-relaxed text-ink-500">
            Start with the essentials and unlock more capacity as your
            business grows. Pro adds multiple locations, more products,
            custom domains and advanced analytics. Enterprise gives you
            unlimited capacity plus marketing tools.
          </p>
        </div>
      </div>
    </div>
  </div>
</section>

      {/* How it works */}
      <section id="how" className="border-y border-cream-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="flex flex-col gap-12 lg:flex-row lg:items-center">
            <div className="lg:w-72">
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-brand-600">
                How it works
              </p>
              <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight">
                Live before lunch
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-500">
                Three steps between you and your first sale. Most stores are live in under an
                hour.
              </p>
            </div>
            <ol className="flex-1 space-y-6">
            {[
  {
    t: "Create your account",
    b: "Sign up with your email and verify it. It only takes a few seconds.",
  },
  {
    t: "Set up your store",
    b: "Give your store a name, choose your Brikoh subdomain, and get your main branch ready to manage your business.",
  },
  {
    t: "Add products & go live",
    b: "Add what you're selling, share your storefront link, and start taking your first sales — in-store or online.",
  },
  {
    t: "Manage & grow your business",
    b: "Keep track of your products, sales, customers, branches, and business performance — all from one place.",
  },
].map((s, i) => (
                <li key={s.t} className="flex gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink-900 font-display text-base font-extrabold text-cream-50">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="text-lg font-extrabold">{s.t}</h3>
                    <p className="mt-0.5 text-sm text-ink-500">{s.b}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-brand-500 px-6 py-14 text-center sm:px-12">
          <div className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-20 -right-10 h-64 w-64 rounded-full bg-ink-900/15" />
          <h2 className="relative font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Your market is waiting.
          </h2>
          <p className="relative mx-auto mt-3 max-w-md text-[15px] font-semibold text-brand-50/90">
            Free to start. Upgrade when your shelves get fuller — not before.
          </p>
          <Link
            to="/auth?mode=register"
            className="relative mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-[15px] font-extrabold text-brand-600 shadow-lg transition-transform hover:scale-[1.02]"
          >
            Open your store
            <Icon name="arrowRight" size={17} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-cream-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-white">
              <Icon name="logo" size={19} />
            </span>
            <span className="font-display text-lg font-extrabold tracking-tight">brikoh</span>
            <span className="ml-2 text-xs font-semibold text-ink-300">
              all-in-one commerce for your store
            </span>
          </div>
          <div className="flex items-center gap-4">
            <HealthDot />
            <Link to="/auth" className="text-sm font-bold text-ink-500 hover:text-ink-900">
              Sign in
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

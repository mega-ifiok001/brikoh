"use client";

import { useState } from "react";
import PageShell from "@/components/PageShell";
import PageHero from "@/components/PageHero";
import { Container, Reveal } from "@/components/ui";
import {
  Search,
  Rocket,
  Storefront,
  Wallet,
  Box,
  Receipt,
  Shield,
  ChevronRight,
  MessageCircle,
  Mail,
  Network,
  Graduation,
} from "@/components/icons";

const categories = [
  {
    icon: <Rocket className="h-6 w-6" />,
    title: "Getting started",
    desc: "Create your account, set up your store and make your first sale.",
    count: 24,
    tint: "bg-brand/10 text-brand",
  },
  {
    icon: <Storefront className="h-6 w-6" />,
    title: "Store & website",
    desc: "Themes, products, discounts, domains and shipping settings.",
    count: 31,
    tint: "bg-pine/10 text-pine",
  },
  {
    icon: <Wallet className="h-6 w-6" />,
    title: "Payments & payouts",
    desc: "Accept payments, connect gateways and track your money.",
    count: 28,
    tint: "bg-brand/10 text-brand",
  },
  {
    icon: <Box className="h-6 w-6" />,
    title: "Inventory & orders",
    desc: "Stock levels, barcodes, fulfilment and order tracking.",
    count: 22,
    tint: "bg-pine/10 text-pine",
  },
  {
    icon: <Receipt className="h-6 w-6" />,
    title: "Billing & plans",
    desc: "Invoices, receipts, expenses and subscription questions.",
    count: 17,
    tint: "bg-brand/10 text-brand",
  },
  {
    icon: <Shield className="h-6 w-6" />,
    title: "Account & security",
    desc: "Passwords, two-factor auth, staff roles and data privacy.",
    count: 19,
    tint: "bg-pine/10 text-pine",
  },
];

const articles = [
  { title: "How to create your Brikoh account", category: "Getting started", views: "48k" },
  { title: "Add and publish your first product", category: "Store & website", views: "52k" },
  { title: "Connect a payment gateway (Paystack, Stripe, Flutterwave)", category: "Payments & payouts", views: "61k" },
  { title: "How payouts and settlement work", category: "Payments & payouts", views: "37k" },
  { title: "Record a sale and send a receipt", category: "Billing & plans", views: "44k" },
  { title: "Update stock automatically after a sale", category: "Inventory & orders", views: "29k" },
  { title: "Set up two-factor authentication", category: "Account & security", views: "26k" },
  { title: "Issue a refund to a customer", category: "Payments & payouts", views: "21k" },
  { title: "Add staff and assign roles", category: "Account & security", views: "18k" },
  { title: "Generate barcodes for your products", category: "Inventory & orders", views: "15k" },
];

const channels = [
  {
    icon: <MessageCircle className="h-6 w-6" />,
    title: "Live chat",
    text: "Chat with our team in-app. Fastest way to get help.",
    tint: "bg-brand/10 text-brand",
  },
  {
    icon: <Mail className="h-6 w-6" />,
    title: "Email support",
    text: "support@brikoh.com — replies within 24 hours.",
    tint: "bg-pine/10 text-pine",
  },
  {
    icon: <Network className="h-6 w-6" />,
    title: "Community",
    text: "40,000+ founders sharing answers and advice.",
    tint: "bg-brand/10 text-brand",
  },
  {
    icon: <Graduation className="h-6 w-6" />,
    title: "Brikoh Academy",
    text: "Free courses and step-by-step video lessons.",
    tint: "bg-pine/10 text-pine",
  },
];

export default function HelpCenterPage() {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const results = q
    ? articles.filter((a) => `${a.title} ${a.category}`.toLowerCase().includes(q))
    : null;

  return (
    <PageShell title="Help center">
      <PageHero
        eyebrow="Help center"
        eyebrowTone="orange"
        title={
          <>
            How can we <span className="text-gradient-brand">help you?</span>
          </>
        }
        subtitle="Search guides, browse topics, or talk to a real human — whatever you need to get back to selling."
      >
        <div className="relative mx-auto w-full max-w-xl">
          <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-ink/35" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search articles, e.g. 'connect payments'"
            className="w-full rounded-full border border-ink/10 bg-white py-4 pl-13 pr-5 text-[15px] text-ink shadow-lg shadow-forest/5 outline-none transition-all placeholder:text-ink/30 focus:border-brand focus:ring-4 focus:ring-brand/10"
          />
        </div>
      </PageHero>

      <section className="pb-20 sm:pb-24">
        <Container>
          {results ? (
            <div>
              <p className="text-sm font-medium text-muted">
                {results.length} result{results.length === 1 ? "" : "s"} for{" "}
                <span className="font-bold text-ink">"{query}"</span>
              </p>
              <div className="mt-6 space-y-3">
                {results.map((a) => (
                  <a
                    key={a.title}
                    href="#/help"
                    className="flex items-center justify-between gap-4 rounded-2xl border border-ink/5 bg-white px-6 py-4 transition-all hover:border-brand/30 hover:shadow-lg hover:shadow-forest/10"
                  >
                    <div>
                      <p className="font-semibold text-ink">{a.title}</p>
                      <p className="mt-0.5 text-xs text-muted">
                        {a.category} · {a.views} views
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 shrink-0 text-brand" />
                  </a>
                ))}
              </div>
              {results.length === 0 && (
                <div className="rounded-3xl border border-dashed border-ink/15 bg-white p-10 text-center">
                  <span className="text-4xl">🔍</span>
                  <p className="mt-3 font-display text-lg font-bold text-ink">No results found</p>
                  <p className="mt-1 text-sm text-muted">
                    Try different keywords, or reach out and we'll point you the right way.
                  </p>
                  <a
                    href="#/contact"
                    className="mt-5 inline-flex items-center gap-2 rounded-full bg-forest px-6 py-3 text-sm font-semibold text-white"
                  >
                    <Mail className="h-4 w-4" /> Contact support
                  </a>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* categories */}
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {categories.map((c, i) => (
                  <Reveal key={c.title} delay={(i % 3) * 80}>
                    <a
                      href="#/help"
                      className="group flex h-full flex-col rounded-2xl border border-ink/5 bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-forest/10"
                    >
                      <span className={`grid h-12 w-12 place-items-center rounded-xl ${c.tint}`}>
                        {c.icon}
                      </span>
                      <h3 className="mt-4 font-display text-lg font-bold text-ink">{c.title}</h3>
                      <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted">{c.desc}</p>
                      <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand">
                        {c.count} articles <ChevronRight className="h-4 w-4" />
                      </span>
                    </a>
                  </Reveal>
                ))}
              </div>

              {/* popular */}
              <Reveal>
                <div className="mt-14 rounded-3xl border border-ink/5 bg-white p-7 sm:p-9">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-xl font-extrabold text-ink">
                      Popular articles
                    </h3>
                    <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-bold text-brand">
                      Most viewed
                    </span>
                  </div>
                  <div className="mt-6 grid gap-x-10 gap-y-1 md:grid-cols-2">
                    {articles.map((a) => (
                      <a
                        key={a.title}
                        href="#/help"
                        className="group flex items-center justify-between gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-cream"
                      >
                        <div>
                          <p className="text-sm font-semibold text-ink group-hover:text-brand">
                            {a.title}
                          </p>
                          <p className="mt-0.5 text-xs text-muted">{a.category}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-ink/25 group-hover:text-brand" />
                      </a>
                    ))}
                  </div>
                </div>
              </Reveal>

              {/* channels */}
              <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {channels.map((c, i) => (
                  <Reveal key={c.title} delay={i * 70}>
                    <div className="h-full rounded-2xl border border-ink/5 bg-white p-6 text-center transition-shadow hover:shadow-lg hover:shadow-forest/10">
                      <span className={`mx-auto grid h-12 w-12 place-items-center rounded-xl ${c.tint}`}>
                        {c.icon}
                      </span>
                      <h3 className="mt-3.5 font-display text-base font-bold text-ink">{c.title}</h3>
                      <p className="mt-1.5 text-xs leading-relaxed text-muted">{c.text}</p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </>
          )}
        </Container>
      </section>
    </PageShell>
  );
}

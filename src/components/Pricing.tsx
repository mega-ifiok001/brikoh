"use client";

import { useState } from "react";
import { Container, SectionHeading, Reveal, LinkButton } from "./ui";
import { Check, Sparkles, Globe, Megaphone, Box } from "./icons";
import { loadPlans } from "@/lib/admin";

type Plan = {
  name: string;
  tagline: string;
  monthly: number | null;
  quarterly: number | null;
  popular?: boolean;
  deliverables: { group: string; items: string[] }[];
  cta: string;
};

const plans: Plan[] = [
  {
    name: "Starter",
    tagline: "For new businesses finding their feet.",
    monthly: 0,
    quarterly: 0,
    deliverables: [
      {
        group: "Website",
        items: ["Free online store (Classic template)", "WhatsApp chat button on your site", "Your own .brikoh.app link"],
      },
      {
        group: "Sell & track",
        items: ["Up to 50 products", "Record sales & receipts", "Low-stock alerts", "Basic analytics"],
      },
    ],
    cta: "Start for free",
  },
  {
    name: "Pro",
    tagline: "For growing teams that mean business.",
    monthly: 16,
    quarterly: 12,
    popular: true,
    deliverables: [
      {
        group: "Website",
        items: ["All 3 website templates + full editor", "Custom domain (your own .com)", "Google Analytics integration"],
      },
      {
        group: "Inventory",
        items: ["Unlimited products", "Full Inventory Dashboard", "Stock transfers, POs & valuation", "Multi-branch"],
      },
      {
        group: "Marketing & team",
        items: ["Campaigns: WhatsApp, SMS & email", "Coupons & discounts", "Customer groups", "2 staff seats · No Brikoh branding"],
      },
    ],
    cta: "Start 14-day trial",
  },
  {
    name: "Growth",
    tagline: "For multi-store operators scaling fast.",
    monthly: 39,
    quarterly: 32,
    deliverables: [
      {
        group: "Everything in Pro, plus",
        items: ["Marketing automation & broadcasts", "Advanced analytics & GA4 reports", "Loyalty & VIP programs"],
      },
      {
        group: "Scale",
        items: ["10 staff seats with roles", "Priority support & onboarding", "Custom integrations", "Dedicated success manager"],
      },
    ],
    cta: "Talk to sales",
  },
];

const comparison: { label: string; values: [string, string, string] }[] = [
  { label: "Website templates", values: ["1", "3", "3"] },
  { label: "WhatsApp button", values: ["✓", "✓", "✓"] },
  { label: "Online store products", values: ["50", "Unlimited", "Unlimited"] },
  { label: "Marketing campaigns", values: ["—", "✓", "✓ + automation"] },
  { label: "Google Analytics", values: ["—", "✓", "✓ + GA4"] },
  { label: "Inventory Dashboard", values: ["Basic", "Full", "Full + multi-branch"] },
  { label: "Staff seats", values: ["—", "2", "10"] },
];

export default function Pricing() {
  const [yearly, setYearly] = useState(true);

  const fmt = (n: number | null) => (n === 0 ? "$0" : n === null ? "Custom" : `$${n}`);

  // Prices can be edited by the Brikoh ops team in the Admin console.
  const adminPlans = loadPlans();
  const planPrice = (name: string) => {
    const base = plans.find((x) => x.name === name)!;
    const cfg = adminPlans.find((x) => x.name === name);
    return { monthly: cfg?.monthly ?? base.monthly, quarterly: cfg?.quarterly ?? base.quarterly };
  };

  return (
    <section id="pricing" className="relative py-24 sm:py-28">
      <Container>
        <SectionHeading
          eyebrow="Simple pricing"
          eyebrowTone="green"
          title={
            <>
              Plans that grow <span className="text-gradient-brand">with your business</span>
            </>
          }
          intro="Every plan includes your free website with a WhatsApp chat button. Start free, upgrade when you're ready."
        />

        {/* toggle */}
        <Reveal>
          <div className="mt-8 flex items-center justify-center gap-3">
            <span className={`text-sm font-semibold ${!yearly ? "text-ink" : "text-muted"}`}>Monthly</span>
            <button
              onClick={() => setYearly((v) => !v)}
              className="relative h-7 w-14 rounded-full bg-forest p-1 transition-colors"
              aria-label="Toggle billing period"
            >
              <span
                className={`block h-5 w-5 rounded-full bg-sun shadow transition-transform duration-300 ${
                  yearly ? "translate-x-7" : "translate-x-0"
                }`}
              />
            </button>
            <span className={`text-sm font-semibold ${yearly ? "text-ink" : "text-muted"}`}>Quarterly</span>
            <span className="rounded-full bg-leaf/15 px-2.5 py-1 text-xs font-bold text-leaf">Save 25%</span>
          </div>
        </Reveal>

        <div className="mt-12 grid items-stretch gap-6 lg:grid-cols-3">
          {plans.map((p, i) => (
            <Reveal key={p.name} delay={i * 100}>
              <div
                className={`relative flex h-full flex-col rounded-3xl p-7 transition-all duration-300 ${
                  p.popular
                    ? "border-2 border-brand bg-white shadow-2xl shadow-brand/20 lg:-mt-4 lg:mb-4"
                    : "border border-ink/8 bg-white shadow-sm hover:shadow-lg hover:shadow-forest/10"
                }`}
              >
                {p.popular && (
                  <span className="absolute -top-3.5 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-gradient-to-br from-brand-light to-brand px-3.5 py-1.5 text-xs font-bold text-white shadow-lg shadow-brand/30">
                    <Sparkles className="h-3.5 w-3.5" /> Most popular
                  </span>
                )}

                <h3 className="font-display text-xl font-extrabold text-ink">{p.name}</h3>
                <p className="mt-1.5 min-h-[40px] text-sm leading-relaxed text-muted">{p.tagline}</p>

                <div className="mt-5 flex items-end gap-1.5">
                  <span className="font-display text-4xl font-extrabold tracking-tight text-ink">
                    {fmt(yearly ? planPrice(p.name).quarterly : planPrice(p.name).monthly)}
                  </span>
                  {planPrice(p.name).monthly !== null && planPrice(p.name).monthly !== 0 && (
                    <span className="mb-1 text-sm font-medium text-muted">/ mo</span>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted">
                  {planPrice(p.name).monthly === 0 ? "Free forever, no card needed" : yearly ? "Billed quarterly" : "Billed monthly"}
                </p>

                <LinkButton href="#/signup" variant={p.popular ? "primary" : "outline"} className="mt-6 w-full">
                  {p.cta}
                </LinkButton>

                {/* deliverables */}
                <div className="mt-7 space-y-5">
                  {p.deliverables.map((g) => (
                    <div key={g.group}>
                      <p className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-brand">
                        {g.group === "Website" ? <Globe className="h-3.5 w-3.5" /> : g.group === "Marketing & team" || g.group.startsWith("Everything") ? <Megaphone className="h-3.5 w-3.5" /> : g.group === "Inventory" ? <Box className="h-3.5 w-3.5" /> : null}
                        {g.group}
                      </p>
                      <ul className="mt-2.5 space-y-2">
                        {g.items.map((f) => (
                          <li key={f} className="flex items-start gap-2.5">
                            <span className={`mt-0.5 grid h-4.5 w-4.5 shrink-0 place-items-center rounded-full ${p.popular ? "bg-brand/15 text-brand" : "bg-leaf/15 text-leaf"}`}>
                              <Check className="h-3 w-3" />
                            </span>
                            <span className="text-[13px] font-medium leading-snug text-ink/80">{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* comparison */}
        <Reveal>
          <div className="mt-16 overflow-hidden rounded-3xl border border-ink/5 bg-white shadow-sm">
            <div className="border-b border-ink/5 bg-cream px-6 py-4">
              <p className="font-display text-base font-extrabold text-ink">Compare plans</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="border-b border-ink/5 text-[11px] font-bold uppercase tracking-wider text-muted">
                    <th className="px-6 py-3">Feature</th>
                    <th className="px-6 py-3">Starter</th>
                    <th className="px-6 py-3 text-brand">Pro</th>
                    <th className="px-6 py-3">Growth</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.map((row) => (
                    <tr key={row.label} className="border-b border-ink/5 last:border-0">
                      <td className="px-6 py-3 font-semibold text-ink">{row.label}</td>
                      {row.values.map((v, i) => (
                        <td key={i} className={`px-6 py-3 ${i === 1 ? "font-bold text-brand" : "text-muted"}`}>
                          {v}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Reveal>

        <Reveal>
          <p className="mt-8 text-center text-sm text-muted">
            Not sure which plan fits?{" "}
            <a href="#faq" className="font-semibold text-brand hover:underline">Get a recommendation</a>{" "}
            or try Brikoh free.
          </p>
        </Reveal>
      </Container>
    </section>
  );
}

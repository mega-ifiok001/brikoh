"use client";

import { useState } from "react";
import { Container, SectionHeading, Reveal } from "./ui";
import { Plus } from "./icons";

const faqs = [
  {
    q: "Is Brikoh a marketplace like Jumia or Jiji?",
    a: "No. Brikoh is your own business app and storefront. You keep 100% of your sales, your customers and your brand — we simply give you the tools to run and grow everything yourself.",
  },
  {
    q: "Is there really a free plan?",
    a: "Yes. The Starter plan is free forever with no credit card required. You get a real online store, sales recording and basic analytics to get going without any risk.",
  },
  {
    q: "Can I accept international payments?",
    a: "Absolutely. Brikoh lets you accept payments in Naira and US Dollars through cards, bank transfers and popular gateways, with instant notifications on every transaction.",
  },
  {
    q: "Does Brikoh run ads or bring me customers?",
    a: "Brikoh connects with your marketing and ad tools so you can promote your store, and built-in SEO helps you get discovered — but you stay in full control of your marketing.",
  },
  {
    q: "Can I manage multiple stores or staff?",
    a: "Yes. Growth and higher plans include multi-location control, staff roles and permissions, so you can oversee every store and team member from one dashboard.",
  },
  {
    q: "How long does it take to set up?",
    a: "Most merchants launch their store within an afternoon. Add your products, pick a theme, connect payments and you're ready to sell.",
  },
];

function Item({ q, a, open, onClick }: { q: string; a: string; open: boolean; onClick: () => void }) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border transition-colors duration-300 ${
        open ? "border-brand/30 bg-white" : "border-ink/8 bg-white hover:border-ink/15"
      }`}
    >
      <button
        onClick={onClick}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
      >
        <span className={`font-display text-base font-bold sm:text-lg ${open ? "text-brand" : "text-ink"}`}>
          {q}
        </span>
        <span
          className={`grid h-8 w-8 shrink-0 place-items-center rounded-full transition-all duration-300 ${
            open ? "rotate-45 bg-brand text-white" : "bg-cream text-ink"
          }`}
        >
          <Plus className="h-4 w-4" />
        </span>
      </button>
      <div
        className={`grid transition-all duration-300 ease-out ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <p className="px-6 pb-5 text-sm leading-relaxed text-muted sm:text-[15px]">{a}</p>
        </div>
      </div>
    </div>
  );
}

export default function FAQ() {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="relative py-24 sm:py-28">
      <Container>
        <SectionHeading
          eyebrow="FAQ"
          eyebrowTone="green"
          title={
            <>
              Questions, <span className="text-gradient-brand">answered</span>
            </>
          }
          intro="Everything you need to know about running your business on Brikoh."
        />

        <div className="mx-auto mt-14 max-w-3xl space-y-3">
          {faqs.map((f, i) => (
            <Reveal key={f.q} delay={(i % 2) * 60}>
              <Item q={f.q} a={f.a} open={open === i} onClick={() => setOpen(open === i ? -1 : i)} />
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

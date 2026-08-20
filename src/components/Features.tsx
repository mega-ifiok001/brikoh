import { Container, SectionHeading, Reveal } from "./ui";
import { BrowserMockup, InvoiceCard, AnalyticsCard, PaymentCard } from "./Mockups";
import { Check, ArrowRight, Storefront, Receipt, ChartUp, Wallet } from "./icons";
import type { ReactNode } from "react";

type Feature = {
  eyebrow: string;
  icon: ReactNode;
  title: ReactNode;
  body: string;
  points: string[];
  visual: ReactNode;
  tint: "orange" | "green";
};

const features: Feature[] = [
  {
    eyebrow: "Online store",
    icon: <Storefront className="h-5 w-5" />,
    title: "Launch a beautiful store in minutes",
    body: "Add products, run flash sales, ship orders and connect your ads & analytics. Your Brikoh store looks stunning on every device — no designer required.",
    points: ["Drag-and-drop storefront themes", "Discounts, coupons & flash sales", "Built-in shipping & order tracking"],
    visual: <BrowserMockup />,
    tint: "orange",
  },
  {
    eyebrow: "Sales & invoices",
    icon: <Receipt className="h-5 w-5" />,
    title: "Record sales and share receipts instantly",
    body: "Log every sale, send professional invoices and auto-generate receipts your customers actually love. Never lose track of a transaction again.",
    points: ["One-tap invoicing & receipts", "Track who has paid and who hasn't", "Expense logging in seconds"],
    visual: <InvoiceCard />,
    tint: "green",
  },
  {
    eyebrow: "Analytics",
    icon: <ChartUp className="h-5 w-5" />,
    title: "Know your numbers before competitors do",
    body: "Brikoh Analytics turns your data into clear decisions — profit, best-sellers, customer spend and website traffic, all in one living dashboard.",
    points: ["Live profit & revenue insights", "Best-selling products at a glance", "Customer spend & retention trends"],
    visual: <AnalyticsCard />,
    tint: "orange",
  },
  {
    eyebrow: "Payments",
    icon: <Wallet className="h-5 w-5" />,
    title: "Get paid locally and globally",
    body: "Accept payments in Naira or Dollars through cards, bank transfers and wallets. Set instant payment alerts so you never miss a sale.",
    points: ["Cards, transfers & mobile money", "Multi-currency settlements", "Instant payment notifications"],
    visual: <PaymentCard />,
    tint: "green",
  },
];

export default function Features() {
  return (
    <section id="features" className="relative py-24 sm:py-28">
      <Container>
        <SectionHeading
          eyebrow="One solution at a time"
          eyebrowTone="orange"
          title={
            <>
              Everything you need to <span className="text-gradient-brand">run &amp; grow</span>
            </>
          }
          intro="Simplify operations with tools that make inventory, sales, orders and customer management effortless."
        />

        <div className="mt-20 flex flex-col gap-24 lg:gap-32">
          {features.map((f, i) => {
            const reversed = i % 2 === 1;
            const isGreen = f.tint === "green";
            return (
              <div
                key={f.eyebrow}
                className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16"
              >
                {/* copy */}
                <Reveal className={reversed ? "lg:order-2" : ""}>
                  <div className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider ring-1 ring-inset ${isGreen ? "bg-pine/10 text-pine ring-pine/15" : "bg-brand/10 text-brand ring-brand/15"}`}>
                    {f.icon}
                    {f.eyebrow}
                  </div>
                  <h3 className="mt-5 font-display text-2xl font-extrabold leading-tight tracking-tight text-ink sm:text-3xl md:text-[2.1rem]">
                    {f.title}
                  </h3>
                  <p className="mt-4 max-w-md text-base leading-relaxed text-muted sm:text-lg">{f.body}</p>
                  <ul className="mt-6 space-y-3">
                    {f.points.map((p) => (
                      <li key={p} className="flex items-start gap-3">
                        <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full ${isGreen ? "bg-pine/10 text-pine" : "bg-brand/10 text-brand"}`}>
                          <Check className="h-3.5 w-3.5" />
                        </span>
                        <span className="text-sm font-medium text-ink/80">{p}</span>
                      </li>
                    ))}
                  </ul>
                  <a
                    href="#platform"
                    className={`mt-7 inline-flex items-center gap-2 text-sm font-semibold transition-colors ${isGreen ? "text-pine hover:text-forest" : "text-brand hover:text-brand-light"}`}
                  >
                    Learn more
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </Reveal>

                {/* visual */}
                <Reveal delay={120} className={reversed ? "lg:order-1" : ""}>
                  <div className="relative flex items-center justify-center">
                    <div
                      className={`absolute inset-0 -z-10 rounded-[2.5rem] blur-2xl ${
                        isGreen ? "bg-leaf/10" : "bg-sun/15"
                      }`}
                    />
                    {f.visual}
                  </div>
                </Reveal>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

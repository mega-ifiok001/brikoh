import { Container, SectionHeading, Reveal } from "./ui";
import {
  Box,
  Truck,
  Users,
  Badge,
  Calculator,
  Barcode,
  Building,
  Refresh,
  Globe,
  Bell,
} from "./icons";
import type { ReactNode } from "react";

type Item = { icon: ReactNode; title: string; desc: string; tint?: "orange" | "green" };

const items: Item[] = [
  {
    icon: <Box className="h-6 w-6" />,
    title: "Smart inventory",
    desc: "Stock updates itself after every sale so you always know what's left.",
    tint: "green",
  },
  {
    icon: <Truck className="h-6 w-6" />,
    title: "Order fulfillment",
    desc: "Process deliveries fast with automated shipping & status emails.",
    tint: "orange",
  },
  {
    icon: <Users className="h-6 w-6" />,
    title: "Customer CRM",
    desc: "Save details, purchase history and addresses for smarter marketing.",
    tint: "green",
  },
  {
    icon: <Badge className="h-6 w-6" />,
    title: "Staff management",
    desc: "Assign roles and track exactly what each team member does.",
    tint: "orange",
  },
  {
    icon: <Calculator className="h-6 w-6" />,
    title: "Expense tracking",
    desc: "Log every cost and watch your true profit update in real time.",
    tint: "green",
  },
  {
    icon: <Barcode className="h-6 w-6" />,
    title: "Barcode checkout",
    desc: "Turn any phone into a fast POS with barcode scanning.",
    tint: "orange",
  },
  {
    icon: <Building className="h-6 w-6" />,
    title: "Multi-store control",
    desc: "Oversee sales, stock and staff across every location at once.",
    tint: "green",
  },
  {
    icon: <Refresh className="h-6 w-6" />,
    title: "Automation",
    desc: "From stock alerts to receipts, let Brikoh handle the busywork.",
    tint: "orange",
  },
  {
    icon: <Globe className="h-6 w-6" />,
    title: "Sell everywhere",
    desc: "Sync your store with social media, marketplaces and ads.",
    tint: "green",
  },
];

export default function FeatureGrid() {
  return (
    <section id="platform" className="relative py-24 sm:py-28">
      <Container>
        <SectionHeading
          eyebrow="The complete platform"
          eyebrowTone="green"
          title={
            <>
              More than an app — your <span className="text-gradient-brand">command center</span>
            </>
          }
          intro="Turn your physical store into a smart store and automate the busywork with tools built to scale with you."
        />

        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it, i) => (
            <Reveal key={it.title} delay={(i % 3) * 80}>
              <div className="group h-full rounded-2xl border border-ink/5 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-transparent hover:shadow-xl hover:shadow-forest/10">
                <span
                  className={`grid h-12 w-12 place-items-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${
                    it.tint === "green"
                      ? "bg-pine/10 text-pine"
                      : "bg-brand/10 text-brand"
                  }`}
                >
                  {it.icon}
                </span>
                <h3 className="mt-4 font-display text-lg font-bold text-ink">{it.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{it.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <div className="mt-8 flex items-center justify-center gap-3 rounded-2xl border border-dashed border-brand/30 bg-brand/[0.04] px-6 py-5 text-center">
            <Bell className="h-5 w-5 text-brand" />
            <p className="text-sm font-medium text-ink/80">
              Want to integrate with Brikoh?{" "}
              <a href="#/contact" className="font-bold text-brand underline-offset-2 hover:underline">
                Talk to our team
              </a>
            </p>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

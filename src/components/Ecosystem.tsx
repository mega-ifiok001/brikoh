import { Container, SectionHeading, Reveal } from "./ui";
import { Graduation, Network, Badge, ArrowRight } from "./icons";
import type { ReactNode } from "react";

type Item = { icon: ReactNode; title: string; desc: string; tag: string; tint: string };

const items: Item[] = [
  {
    icon: <Graduation className="h-6 w-6" />,
    title: "Brikoh Academy",
    desc: "Take free courses on sales, marketing and money management built for African founders.",
    tag: "100+ free lessons",
    tint: "bg-brand/10 text-brand",
  },
  {
    icon: <Network className="h-6 w-6" />,
    title: "Brikoh Community",
    desc: "Join a thriving network of business owners to share wins, resources and real support.",
    tag: "40k+ members",
    tint: "bg-pine/10 text-pine",
  },
  {
    icon: <Badge className="h-6 w-6" />,
    title: "Brikoh Champions",
    desc: "Refer fellow entrepreneurs and earn rewards — up to millions every year.",
    tag: "Earn as you grow",
    tint: "bg-leaf/15 text-leaf",
  },
];

export default function Ecosystem() {
  return (
    <section className="relative py-24 sm:py-28">
      <Container>
        <SectionHeading
          eyebrow="More than an app"
          eyebrowTone="orange"
          title={
            <>
              An entire ecosystem <span className="text-gradient-brand">to help you thrive</span>
            </>
          }
          intro="Brikoh surrounds you with the education, community and support every business owner deserves."
        />

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {items.map((it, i) => (
            <Reveal key={it.title} delay={i * 100}>
              <div className="group relative h-full overflow-hidden rounded-3xl border border-ink/5 bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-forest/10">
                <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br from-sun/0 to-brand/0 transition-all duration-500 group-hover:from-sun/20 group-hover:to-leaf/10" />
                <span className={`relative grid h-14 w-14 place-items-center rounded-2xl ${it.tint}`}>
                  {it.icon}
                </span>
                <h3 className="relative mt-5 font-display text-xl font-bold text-ink">{it.title}</h3>
                <p className="relative mt-2 text-sm leading-relaxed text-muted">{it.desc}</p>
                <div className="relative mt-5 flex items-center justify-between">
                  <span className="rounded-full bg-cream px-3 py-1 text-xs font-bold text-ink/70 ring-1 ring-ink/5">
                    {it.tag}
                  </span>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand transition-transform duration-300 group-hover:translate-x-1">
                    Explore <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

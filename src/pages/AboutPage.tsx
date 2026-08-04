import PageShell from "@/components/PageShell";
import PageHero from "@/components/PageHero";
import PageCTA from "@/components/PageCTA";
import { Container, SectionHeading, Reveal } from "@/components/ui";
import {
  Heart,
  Sparkles,
  Shield,
  Rocket,
  Target,
  Users,
  Quote,
  ArrowRight,
} from "@/components/icons";

const stats = [
  { value: "80,000+", label: "Businesses powered" },
  { value: "14", label: "Countries served" },
  { value: "120+", label: "Team members" },
  { value: "$340M+", label: "Processed annually" },
];

const milestones = [
  {
    year: "2021",
    title: "Founded in Lagos",
    text: "Brikoh starts as a two-person team on a mission to make business software feel joyful.",
  },
  {
    year: "2022",
    title: "10,000 merchants & payments",
    text: "We launch payments in Naira and Dollar and cross the first 10,000 active merchants.",
  },
  {
    year: "2023",
    title: "Analytics & multi-store",
    text: "Brikoh Analytics ships alongside multi-location controls for growing teams.",
  },
  {
    year: "2024",
    title: "$100M processed",
    text: "We hit $100M in annual processed volume and open offices in Accra and Nairobi.",
  },
  {
    year: "2025",
    title: "80,000 businesses strong",
    text: "Merchants across 14 countries run their stores, payments and numbers on Brikoh.",
  },
];

const values = [
  {
    icon: <Heart className="h-6 w-6" />,
    title: "Customer obsession",
    text: "Every feature starts with a founder's real problem — we ship for them, not for vanity metrics.",
  },
  {
    icon: <Sparkles className="h-6 w-6" />,
    title: "Craft & polish",
    text: "Tools should be beautiful. We sweat the details so your work feels effortless.",
  },
  {
    icon: <Shield className="h-6 w-6" />,
    title: "Integrity first",
    text: "Your data, your money and your trust are non-negotiable. Always.",
  },
  {
    icon: <Rocket className="h-6 w-6" />,
    title: "Move with speed",
    text: "Small, fast, decisive. We'd rather ship and learn than wait for perfect.",
  },
  {
    icon: <Target className="h-6 w-6" />,
    title: "Own the outcome",
    text: "We're builders who take responsibility end-to-end — no passing the buck.",
  },
  {
    icon: <Users className="h-6 w-6" />,
    title: "Community powered",
    text: "Our merchants lift each other. We build the rails and get out of the way.",
  },
];

const team = [
  { name: "Ada Obi", role: "Co-founder & CEO", grad: "from-sun to-brand", initials: "AO" },
  { name: "Tunde Bakare", role: "Co-founder & CTO", grad: "from-leaf to-pine", initials: "TB" },
  { name: "Ngozi Eze", role: "VP of Product", grad: "from-brand to-sun", initials: "NE" },
  { name: "Kofi Adjei", role: "Head of Engineering", grad: "from-pine to-forest", initials: "KA" },
  { name: "Amina Yusuf", role: "VP of Design", grad: "from-sun to-leaf", initials: "AY" },
  { name: "Samuel Okafor", role: "Head of Growth", grad: "from-brand to-pine", initials: "SO" },
  { name: "Chiamaka Nwosu", role: "Head of Community", grad: "from-leaf to-brand", initials: "CN" },
  { name: "David Mensah", role: "Head of Finance", grad: "from-forest to-leaf", initials: "DM" },
];

export default function AboutPage() {
  return (
    <PageShell title="About us">
      <PageHero
        eyebrow="About Brikoh"
        eyebrowTone="orange"
        title={
          <>
            Building the operating system{" "}
            <span className="text-gradient-brand">for African commerce</span>
          </>
        }
        subtitle="We started Brikoh because we believed running a small business should feel powerful, not painful. Today we help over 80,000 merchants sell, get paid and grow — beautifully, from their phones."
      />

      {/* stats strip */}
      <section className="border-y border-ink/5 bg-white">
        <Container className="grid grid-cols-2 gap-8 py-12 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-display text-3xl font-extrabold tracking-tight text-forest sm:text-4xl">
                {s.value}
              </p>
              <p className="mt-1.5 text-sm font-medium text-muted">{s.label}</p>
            </div>
          ))}
        </Container>
      </section>

      {/* story + timeline */}
      <section className="py-20 sm:py-24">
        <Container>
          <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
            <Reveal>
              <div>
                <SectionHeading
                  align="left"
                  eyebrow="Our story"
                  eyebrowTone="green"
                  title={
                    <>
                      From a Lagos living room to <span className="text-gradient-brand">14 countries</span>
                    </>
                  }
                />
                <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-muted sm:text-base">
                  <p>
                    In 2021, Ada and Tunde were watching brilliant founders lose sales to
                    spreadsheets, pen-and-paper ledgers and payment hassles. There were tools for
                    big companies — but nothing joyful, affordable and mobile-first for the
                    businesses that power Africa's economy.
                  </p>
                  <p>
                    So they built Brikoh. A single app where you launch a store, record sales,
                    accept payments, manage stock and understand your numbers. Every release since
                    has been shaped by real conversations with real merchants.
                  </p>
                </div>
                <a
                  href="#/contact"
                  className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-brand hover:text-brand-light"
                >
                  Work with us <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </Reveal>

            <Reveal delay={120}>
              <div className="relative">
                <div className="absolute bottom-2 left-[1.35rem] top-2 w-px bg-gradient-to-b from-brand/40 via-pine/40 to-leaf/40" />
                <div className="space-y-8">
                  {milestones.map((m) => (
                    <div key={m.year} className="relative flex gap-6 pl-0">
                      <span className="relative z-10 mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white font-display text-[11px] font-extrabold text-brand shadow-md shadow-ink/10 ring-1 ring-ink/5">
                        {m.year}
                      </span>
                      <div className="pt-0.5">
                        <h3 className="font-display text-lg font-bold text-ink">{m.title}</h3>
                        <p className="mt-1 text-sm leading-relaxed text-muted">{m.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* mission & vision */}
      <section className="bg-white py-20 sm:py-24">
        <Container>
          <SectionHeading
            eyebrow="Why we exist"
            eyebrowTone="orange"
            title={
              <>
                Our mission &amp; <span className="text-gradient-brand">vision</span>
              </>
            }
          />
          <div className="mt-14 grid gap-6 lg:grid-cols-2">
            <Reveal>
              <div className="h-full rounded-3xl border border-ink/5 bg-cream p-8 transition-shadow hover:shadow-xl hover:shadow-forest/10">
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand/10 text-brand">
                  <Target className="h-7 w-7" />
                </span>
                <h3 className="mt-5 font-display text-2xl font-extrabold text-ink">Our mission</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-muted">
                  To give every African entrepreneur the same power as any global business — a
                  beautiful store, seamless payments and clear numbers — in one app they love to
                  use every day.
                </p>
              </div>
            </Reveal>
            <Reveal delay={120}>
              <div className="h-full rounded-3xl border border-ink/5 bg-cream p-8 transition-shadow hover:shadow-xl hover:shadow-forest/10">
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-pine/10 text-pine">
                  <Rocket className="h-7 w-7" />
                </span>
                <h3 className="mt-5 font-display text-2xl font-extrabold text-ink">Our vision</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-muted">
                  A future where starting and scaling a business is as easy as opening an app —
                  and where millions of African founders build world-class brands on Brikoh.
                </p>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* values */}
      <section className="py-20 sm:py-24">
        <Container>
          <SectionHeading
            eyebrow="Our values"
            eyebrowTone="green"
            title={
              <>
                The principles we <span className="text-gradient-brand">build by</span>
              </>
            }
          />
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {values.map((v, i) => (
              <Reveal key={v.title} delay={(i % 3) * 80}>
                <div className="group h-full rounded-2xl border border-ink/5 bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-forest/10">
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand/10 text-brand transition-transform duration-300 group-hover:scale-110">
                    {v.icon}
                  </span>
                  <h3 className="mt-4 font-display text-lg font-bold text-ink">{v.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{v.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* team */}
      <section className="bg-white py-20 sm:py-24">
        <Container>
          <SectionHeading
            eyebrow="The team"
            eyebrowTone="orange"
            title={
              <>
                Meet the people behind <span className="text-gradient-brand">Brikoh</span>
              </>
            }
            intro="A small, senior team of builders, designers and operators across Lagos, Accra and Nairobi."
          />
          <div className="mt-14 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
            {team.map((m, i) => (
              <Reveal key={m.name} delay={(i % 4) * 70}>
                <div className="group rounded-2xl border border-ink/5 bg-cream p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-forest/10">
                  <span
                    className={`mx-auto grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br ${m.grad} font-display text-2xl font-extrabold text-white shadow-lg transition-transform duration-300 group-hover:scale-105`}
                  >
                    {m.initials}
                  </span>
                  <h3 className="mt-4 font-display text-base font-bold text-ink">{m.name}</h3>
                  <p className="mt-1 text-xs font-medium text-muted">{m.role}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* culture quote */}
      <section className="relative overflow-hidden bg-forest py-20">
        <div className="pointer-events-none absolute inset-0 bg-dotgrid-light opacity-40" />
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-pine/40 blur-3xl" />
        <Container className="relative">
          <Reveal>
            <figure className="mx-auto max-w-3xl text-center">
              <Quote className="mx-auto h-10 w-10 text-sun" />
              <blockquote className="mt-6 font-display text-2xl font-extrabold leading-snug text-white sm:text-3xl">
                "We win when our merchants win. That one sentence decides every feature we build,
                every partnership we sign, every pixel we ship."
              </blockquote>
              <figcaption className="mt-6 text-sm font-medium text-white/70">
                Ada Obi — Co-founder &amp; CEO, Brikoh
              </figcaption>
            </figure>
          </Reveal>
        </Container>
      </section>

      <PageCTA
        title="Want to build with us?"
        subtitle="We're hiring builders who care about craft and the people we serve."
        primaryLabel="See open roles"
        primaryHref="#/contact"
        secondaryLabel="Visit our blog"
        secondaryHref="#/blog"
      />
    </PageShell>
  );
}

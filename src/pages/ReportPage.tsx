import PageShell from "@/components/PageShell";
import PageHero from "@/components/PageHero";
import PageCTA from "@/components/PageCTA";
import { Container, SectionHeading, Reveal, LinkButton } from "@/components/ui";
import { Download, FileText, Trending } from "@/components/icons";

const stats = [
  { value: "8.4M", label: "Online merchants across the continent" },
  { value: "$128B", label: "Estimated e-commerce GMV in 2025" },
  { value: "61%", label: "Of shoppers are mobile-only" },
  { value: "3.2×", label: "Growth in cross-border purchases" },
];

const findings = [
  {
    emoji: "📱",
    title: "Mobile-first commerce dominates",
    text: "Six in ten shoppers complete their entire journey on a phone. Stores that load fast and check out in under a minute win the sale.",
  },
  {
    emoji: "💳",
    title: "Payments fragmentation is easing",
    text: "Cards, mobile money and bank transfers are converging. Merchants who accept multiple methods report up to 2.1× higher conversion.",
  },
  {
    emoji: "🛒",
    title: "Social commerce is the new storefront",
    text: "Over half of first-time discovery now happens in social apps. The winners turn comments into carts — not followers into fans alone.",
  },
];

const bars = [
  { country: "Nigeria", value: 45, color: "from-brand to-sun" },
  { country: "South Africa", value: 38, color: "from-leaf to-pine" },
  { country: "Egypt", value: 30, color: "from-brand to-brand-light" },
  { country: "Kenya", value: 28, color: "from-pine to-leaf" },
  { country: "Ghana", value: 22, color: "from-sun to-brand" },
  { country: "Morocco", value: 19, color: "from-forest to-pine" },
];

const donut = [
  { label: "Cards", pct: 34, color: "#E86100" },
  { label: "Mobile money", pct: 28, color: "#FF8C4A" },
  { label: "Bank transfer", pct: 22, color: "#1E8449" },
  { label: "Cash on delivery", pct: 16, color: "#27AE60" },
];

const chapters = [
  { n: "01", title: "Executive summary", text: "The state of online commerce across Africa's key markets." },
  { n: "02", title: "The mobile shopper", text: "Who they are, what they buy, and how they decide." },
  { n: "03", title: "The payments landscape", text: "Method adoption, fees and the rise of multi-currency." },
  { n: "04", title: "Social & marketplace commerce", text: "How discovery moved into the feed — and what to do about it." },
  { n: "05", title: "Logistics & last-mile delivery", text: "Costs, speed and the infrastructure merchants rely on." },
  { n: "06", title: "The outlook for 2026", text: "Predictions from 200+ merchants and industry experts." },
];

function DonutChart() {
  const r = 54;
  const C = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 140 140" className="h-36 w-36 shrink-0 -rotate-90">
        <circle cx="70" cy="70" r={r} fill="none" stroke="#f2efe9" strokeWidth="16" />
        {donut.map((d) => {
          const len = (d.pct / 100) * C;
          const el = (
            <circle
              key={d.label}
              cx="70"
              cy="70"
              r={r}
              fill="none"
              stroke={d.color}
              strokeWidth="16"
              strokeDasharray={`${len} ${C - len}`}
              strokeDashoffset={-offset}
            />
          );
          offset += len;
          return el;
        })}
      </svg>
      <ul className="space-y-2.5">
        {donut.map((d) => (
          <li key={d.label} className="flex items-center gap-2.5 text-sm">
            <span className="h-3 w-3 rounded-full" style={{ background: d.color }} />
            <span className="font-medium text-ink/80">{d.label}</span>
            <span className="ml-auto font-bold text-ink">{d.pct}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ReportPage() {
  return (
    <PageShell title="E-commerce Report">
      <PageHero
        tone="forest"
        eyebrow="Brikoh Research · 2026 Edition"
        title={
          <>
            The State of Commerce <span className="text-sun">in Africa</span>
          </>
        }
        subtitle="Data, stories and predictions from 200+ merchants and millions of transactions across 14 countries — free to download."
      >
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <LinkButton variant="primary" href="#download">
            <Download className="h-4 w-4" /> Download the full report
          </LinkButton>
          <LinkButton variant="light" href="#chapters">
            <FileText className="h-4 w-4" /> Browse the chapters
          </LinkButton>
        </div>
      </PageHero>

      {/* stats */}
      <section className="border-y border-white/10 bg-forest pb-16 pt-4">
        <Container className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-display text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
                {s.value}
              </p>
              <div className="mx-auto mt-3 h-1 w-8 rounded-full bg-sun" />
              <p className="mt-3 text-sm font-medium text-white/70">{s.label}</p>
            </div>
          ))}
        </Container>
      </section>

      {/* findings */}
      <section className="py-20 sm:py-24">
        <Container>
          <SectionHeading
            eyebrow="Key findings"
            eyebrowTone="orange"
            title={
              <>
                Three things every merchant <span className="text-gradient-brand">should know</span>
              </>
            }
          />
          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {findings.map((f, i) => (
              <Reveal key={f.title} delay={i * 100}>
                <div className="h-full rounded-3xl border border-ink/5 bg-white p-7 transition-shadow hover:shadow-xl hover:shadow-forest/10">
                  <span className="text-4xl">{f.emoji}</span>
                  <h3 className="mt-4 font-display text-xl font-extrabold text-ink">{f.title}</h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-muted">{f.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* data viz */}
      <section className="bg-white py-20 sm:py-24">
        <Container>
          <SectionHeading
            eyebrow="Inside the data"
            eyebrowTone="green"
            title={
              <>
                The numbers behind <span className="text-gradient-brand">the boom</span>
              </>
            }
          />
          <div className="mt-14 grid gap-6 lg:grid-cols-2">
            {/* bar chart */}
            <Reveal>
              <div className="h-full rounded-3xl border border-ink/5 bg-cream p-7">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-lg font-bold text-ink">
                    E-commerce GMV by market (2025, $B)
                  </h3>
                  <Trending className="h-5 w-5 text-pine" />
                </div>
                <div className="mt-8 flex h-56 items-end justify-between gap-3">
                  {bars.map((b) => (
                    <div key={b.country} className="flex flex-1 flex-col items-center gap-2">
                      <span className="text-xs font-bold text-ink">${b.value}B</span>
                      <div
                        className={`w-full max-w-12 rounded-t-xl bg-gradient-to-t ${b.color}`}
                        style={{ height: `${(b.value / 45) * 100}%` }}
                      />
                      <span className="text-[10px] font-semibold text-muted">{b.country}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            {/* donut */}
            <Reveal delay={120}>
              <div className="h-full rounded-3xl border border-ink/5 bg-cream p-7">
                <h3 className="font-display text-lg font-bold text-ink">Payment methods used</h3>
                <div className="mt-8">
                  <DonutChart />
                </div>
                <p className="mt-6 text-sm leading-relaxed text-muted">
                  Merchants offering 3+ payment methods convert{" "}
                  <strong className="text-ink">2.1× better</strong> than those accepting only one.
                </p>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* chapters */}
      <section id="chapters" className="py-20 sm:py-24">
        <Container>
          <SectionHeading
            eyebrow="Inside the report"
            eyebrowTone="orange"
            title={
              <>
                Six chapters of <span className="text-gradient-brand">actionable insight</span>
              </>
            }
          />
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {chapters.map((c, i) => (
              <Reveal key={c.n} delay={(i % 3) * 80}>
                <div className="group h-full rounded-2xl border border-ink/5 bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-forest/10">
                  <span className="font-display text-3xl font-extrabold text-brand/25 transition-colors group-hover:text-brand">
                    {c.n}
                  </span>
                  <h3 className="mt-3 font-display text-lg font-bold text-ink">{c.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{c.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* download band */}
      <section id="download" className="pb-20">
        <Container>
          <Reveal>
            <div className="overflow-hidden rounded-[2rem] border border-ink/5 bg-white shadow-xl shadow-forest/10">
              <div className="grid items-center gap-8 p-8 sm:p-12 lg:grid-cols-[1.2fr_1fr]">
                <div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-leaf/15 px-3.5 py-1.5 text-xs font-bold text-leaf">
                    <Download className="h-3.5 w-3.5" /> Free PDF · 42 pages
                  </span>
                  <h3 className="mt-4 font-display text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
                    Get the full 2026 report
                  </h3>
                  <p className="mt-3 max-w-md text-[15px] leading-relaxed text-muted">
                    Methodology included: survey of 200+ merchants, aggregated transaction data and
                    expert interviews. No email required — just download and read.
                  </p>
                </div>
                <div className="rounded-2xl bg-gradient-to-br from-forest to-pine p-8 text-center text-white">
                  <span className="text-5xl">📊</span>
                  <p className="mt-3 font-display text-lg font-extrabold">The Brikoh E-commerce Report</p>
                  <p className="text-sm text-white/70">2026 Edition · Africa</p>
                  <LinkButton variant="light" href="#top" className="mt-5 w-full">
                    <Download className="h-4 w-4" /> Download PDF
                  </LinkButton>
                </div>
              </div>
            </div>
          </Reveal>
        </Container>
      </section>

      <PageCTA
        title="Want to see these numbers in your own store?"
        subtitle="Brikoh Analytics turns your data into decisions — profit, best-sellers and customer trends in one dashboard."
        primaryLabel="Start free"
        primaryHref="#/signup"
        secondaryLabel="Read the report again"
        secondaryHref="#chapters"
      />
    </PageShell>
  );
}

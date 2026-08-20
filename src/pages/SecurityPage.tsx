import PageShell from "@/components/PageShell";
import PageHero from "@/components/PageHero";
import PageCTA from "@/components/PageCTA";
import { Container, SectionHeading, Reveal } from "@/components/ui";
import {
  Shield,
  Fingerprint,
  Users,
  Bell,
  Server,
  FileText,
  Key,
  Lock,
} from "@/components/icons";

const badges = [
  { label: "SOC 2 Type II", sub: "Audited controls" },
  { label: "ISO 27001", sub: "InfoSec management" },
  { label: "GDPR", sub: "Data protection" },
  { label: "PCI DSS", sub: "Card data safe" },
  { label: "256-bit AES", sub: "Encryption at rest" },
  { label: "99.98%", sub: "Platform uptime" },
];

const features = [
  {
    icon: <Lock className="h-6 w-6" />,
    title: "Encryption everywhere",
    text: "Data is encrypted in transit with TLS 1.3 and at rest with 256-bit AES. Your records are unreadable to anyone but you.",
    tint: "bg-brand/10 text-brand",
  },
  {
    icon: <Fingerprint className="h-6 w-6" />,
    title: "Two-factor authentication",
    text: "Protect your account with TOTP or SMS codes. We strongly encourage 2FA for every merchant.",
    tint: "bg-pine/10 text-pine",
  },
  {
    icon: <Users className="h-6 w-6" />,
    title: "Role-based access",
    text: "Give staff exactly the access they need — and nothing more. Every action is tied to a named user.",
    tint: "bg-brand/10 text-brand",
  },
  {
    icon: <Bell className="h-6 w-6" />,
    title: "24/7 threat monitoring",
    text: "Our security operations team watches for suspicious activity around the clock and responds in minutes.",
    tint: "bg-pine/10 text-pine",
  },
  {
    icon: <Server className="h-6 w-6" />,
    title: "Automated backups",
    text: "Your data is backed up continuously across secure, redundant infrastructure in multiple regions.",
    tint: "bg-brand/10 text-brand",
  },
  {
    icon: <FileText className="h-6 w-6" />,
    title: "Audit-ready logs",
    text: "Detailed audit trails for logins, payments and staff actions — ready for your accountants and regulators.",
    tint: "bg-pine/10 text-pine",
  },
];

const layers = [
  {
    n: "01",
    title: "Secure by design",
    text: "Security reviews, dependency scanning and penetration tests are part of every release.",
  },
  {
    n: "02",
    title: "Least privilege",
    text: "Staff and systems only ever get the minimum access required to do their job.",
  },
  {
    n: "03",
    title: "Continuous monitoring",
    text: "Real-time anomaly detection flags unusual logins, payouts and API traffic.",
  },
  {
    n: "04",
    title: "Rapid response",
    text: "A documented incident-response plan with 24/7 on-call engineers and transparent disclosure.",
  },
];

export default function SecurityPage() {
  return (
    <PageShell title="Security">
      <PageHero
        eyebrow="Security & trust"
        eyebrowTone="green"
        title={
          <>
            Security you can <span className="text-gradient-brand">build on</span>
          </>
        }
        subtitle="Brikoh protects your data, your money and your customers' trust with enterprise-grade security — baked into everything we ship."
      />

      {/* badges */}
      <section className="border-y border-ink/5 bg-white">
        <Container className="grid grid-cols-2 gap-6 py-10 sm:grid-cols-3 lg:grid-cols-6">
          {badges.map((b) => (
            <div key={b.label} className="text-center">
              <p className="font-display text-base font-extrabold text-forest sm:text-lg">{b.label}</p>
              <p className="mt-0.5 text-xs text-muted">{b.sub}</p>
            </div>
          ))}
        </Container>
      </section>

      {/* features */}
      <section className="py-20 sm:py-24">
        <Container>
          <SectionHeading
            eyebrow="How we protect you"
            eyebrowTone="orange"
            title={
              <>
                Layers of protection, <span className="text-gradient-brand">by default</span>
              </>
            }
          />
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <Reveal key={f.title} delay={(i % 3) * 80}>
                <div className="group h-full rounded-2xl border border-ink/5 bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-forest/10">
                  <span className={`grid h-12 w-12 place-items-center rounded-xl ${f.tint} transition-transform duration-300 group-hover:scale-110`}>
                    {f.icon}
                  </span>
                  <h3 className="mt-4 font-display text-lg font-bold text-ink">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{f.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* layered defense */}
      <section className="bg-white py-20 sm:py-24">
        <Container>
          <SectionHeading
            eyebrow="Defense in depth"
            eyebrowTone="green"
            title={
              <>
                How our security <span className="text-gradient-brand">operates</span>
              </>
            }
          />
          <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {layers.map((l, i) => (
              <Reveal key={l.n} delay={i * 90}>
                <div className="relative h-full rounded-2xl border border-ink/5 bg-cream p-7">
                  <span className="font-display text-3xl font-extrabold text-brand/25">{l.n}</span>
                  <h3 className="mt-3 font-display text-base font-bold text-ink">{l.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{l.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* disclosure */}
      <section className="py-20 sm:py-24">
        <Container>
          <Reveal>
            <div className="overflow-hidden rounded-[2rem] bg-forest">
              <div className="pointer-events-none absolute inset-0 bg-dotgrid-light opacity-40" />
              <div className="relative grid items-center gap-8 p-8 sm:p-12 lg:grid-cols-[1.3fr_1fr]">
                <div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-sun/15 px-3.5 py-1.5 text-xs font-bold text-sun ring-1 ring-inset ring-sun/30">
                    <Key className="h-3.5 w-3.5" /> Responsible disclosure
                  </span>
                  <h3 className="mt-4 font-display text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                    Found a vulnerability? Tell us first.
                  </h3>
                  <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-white/75">
                    We welcome reports from security researchers. Reach our security team directly
                    and we'll acknowledge your report within 24 hours, keep you updated, and — for
                    qualifying findings — say thanks with a bounty.
                  </p>
                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <a
                      href="mailto:security@brikoh.com"
                      className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-brand-light to-brand px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/30 transition-transform hover:-translate-y-0.5"
                    >
                      <Shield className="h-4 w-4" /> security@brikoh.com
                    </a>
                    <span className="text-sm text-white/60">Please do not test on live merchants.</span>
                  </div>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/10 p-6 backdrop-blur">
                  <p className="text-sm font-semibold uppercase tracking-wider text-sun">Our pledge</p>
                  <ul className="mt-4 space-y-3 text-sm text-white/85">
                    {[
                      "No legal action for good-faith research",
                      "24-hour acknowledgement of reports",
                      "Clear, private communication throughout",
                      "Public recognition for qualifying findings",
                    ].map((t) => (
                      <li key={t} className="flex items-start gap-2.5">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-leaf" />
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </Reveal>
        </Container>
      </section>

      <PageCTA
        title="Start selling with total peace of mind"
        subtitle="Every Brikoh account is protected by encryption, monitoring and a team that treats your data like our own."
        primaryLabel="Create free account"
        primaryHref="#/signup"
        secondaryLabel="Read our privacy policy"
        secondaryHref="#/privacy"
      />
    </PageShell>
  );
}

import type { ReactNode } from "react";
import PageShell from "./PageShell";
import { Container, Eyebrow } from "./ui";
import { Mail } from "./icons";

export type LegalSection = { id: string; label: string; body: ReactNode };

export default function LegalLayout({
  title,
  updated,
  intro,
  sections,
  contactEmail = "legal@brikoh.com",
}: {
  title: string;
  updated: string;
  intro?: ReactNode;
  sections: LegalSection[];
  contactEmail?: string;
}) {
  return (
    <PageShell title={title}>
      {/* header */}
      <section className="relative overflow-hidden border-b border-ink/5 bg-cream">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-32 top-8 h-72 w-72 rounded-full bg-sun/15 blur-3xl" />
          <div className="absolute inset-x-0 top-0 h-64 bg-dotgrid opacity-50 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
        </div>
        <Container className="relative">
          <div className="max-w-3xl pb-12 pt-32 sm:pb-14 sm:pt-40">
            <Eyebrow tone="green">Legal</Eyebrow>
            <h1 className="mt-5 font-display text-4xl font-extrabold leading-tight tracking-tight text-ink sm:text-5xl">
              {title}
            </h1>
            <p className="mt-4 text-sm font-medium text-muted">Last updated: {updated}</p>
            {intro && (
              <p className="mt-5 text-[15px] leading-relaxed text-muted sm:text-base">{intro}</p>
            )}
          </div>
        </Container>
      </section>

      <Container>
        <div className="grid gap-10 py-14 lg:grid-cols-[260px_1fr] lg:gap-16">
          {/* TOC */}
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">On this page</p>
            <nav className="mt-4 flex flex-row flex-wrap gap-2 lg:flex-col lg:gap-1">
              {sections.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="rounded-full px-3 py-1.5 text-sm font-medium text-ink/70 transition-colors hover:bg-white hover:text-brand lg:rounded-xl lg:px-3.5 lg:py-2"
                >
                  {s.label}
                </a>
              ))}
            </nav>
          </aside>

          {/* content */}
          <div className="max-w-3xl space-y-12">
            {sections.map((s, i) => (
              <section key={s.id} id={s.id} className="scroll-mt-28">
                <div className="flex items-start gap-4">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-brand/10 font-display text-sm font-extrabold text-brand">
                    {i + 1}
                  </span>
                  <h2 className="pt-1 font-display text-2xl font-extrabold tracking-tight text-ink">
                    {s.label}
                  </h2>
                </div>
                <div className="mt-4 space-y-4 pl-12 text-[15px] leading-relaxed text-muted [&_strong]:font-semibold [&_strong]:text-ink [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5">
                  {s.body}
                </div>
              </section>
            ))}
          </div>
        </div>
      </Container>

      {/* contact band */}
      <section className="pb-20">
        <Container>
          <div className="flex flex-col items-center justify-between gap-5 rounded-3xl border border-ink/5 bg-white p-8 text-center shadow-sm sm:flex-row sm:text-left">
            <div>
              <h3 className="font-display text-xl font-extrabold text-ink">Questions about this policy?</h3>
              <p className="mt-1.5 text-sm text-muted">
                Our legal team is happy to help — reach us anytime.
              </p>
            </div>
            <a
              href={`mailto:${contactEmail}`}
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-forest px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-forest/20 transition-transform hover:-translate-y-0.5"
            >
              <Mail className="h-4 w-4" /> {contactEmail}
            </a>
          </div>
        </Container>
      </section>
    </PageShell>
  );
}

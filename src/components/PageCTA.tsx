import { Container, Reveal } from "./ui";
import { ArrowRight } from "./icons";

export default function PageCTA({
  title = "Ready to grow your business?",
  subtitle = "Join 80,000+ merchants running smarter stores with Brikoh. Set up in minutes — free forever, no credit card required.",
  primaryLabel = "Create my free account",
  primaryHref = "#/signup",
  secondaryLabel = "Talk to our team",
  secondaryHref = "#/contact",
}: {
  title?: string;
  subtitle?: string;
  primaryLabel?: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
}) {
  return (
    <section className="py-16 sm:py-20">
      <Container>
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-light via-brand to-[#c45300] px-6 py-14 text-center shadow-2xl shadow-brand/25 sm:px-12 sm:py-16">
            <div className="pointer-events-none absolute inset-0 bg-dotgrid-light opacity-30" />
            <div className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full bg-sun/40 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -right-10 h-72 w-72 rounded-full bg-forest/40 blur-3xl" />

            <div className="relative mx-auto max-w-2xl">
              <h2 className="font-display text-3xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-4xl">
                {title}
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">
                {subtitle}
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <a
                  href={primaryHref}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-base font-bold text-forest shadow-lg shadow-black/10 transition-all duration-300 hover:-translate-y-0.5 hover:bg-cream"
                >
                  {primaryLabel}
                  <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href={secondaryHref}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/40 px-7 py-3.5 text-base font-semibold text-white transition-colors hover:bg-white/10"
                >
                  {secondaryLabel}
                </a>
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

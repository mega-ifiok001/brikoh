import { Container, Reveal } from "./ui";
import { ArrowRight, Check, Sparkles } from "./icons";

function StoreBadge({ store, sub }: { store: string; sub: string }) {
  return (
    <a
      href="#"
      className="inline-flex items-center gap-3 rounded-xl border border-white/25 bg-white/10 px-5 py-2.5 backdrop-blur transition-colors hover:bg-white/20"
    >
      <svg viewBox="0 0 24 24" className="h-6 w-6 text-white" fill="currentColor">
        {store === "apple" ? (
          <path d="M16.5 1.6c.1 1-.3 2-1 2.8-.7.8-1.8 1.4-2.8 1.3-.1-1 .4-2 1-2.7.7-.8 1.9-1.4 2.8-1.4zM20 17.2c-.5 1.2-.8 1.7-1.5 2.7-1 1.5-2.4 3.3-4.1 3.3-1.5 0-1.9-1-4-1-2 0-2.5 1-4 1-1.7 0-3-1.6-4-3.1-2.8-4.2-2.5-9.2.6-11.5C4.5 7.3 6.3 6.8 7.6 6.8c1.7 0 2.7 1 4 1 1.3 0 2.1-1 4-1 1.3 0 2.7.5 3.9 1.5-3.4 2-2.8 7-.3 7.9z" />
        ) : (
          <path d="M3.6 2.3c-.3.3-.5.7-.5 1.3v16.8c0 .6.2 1 .5 1.3l9.2-9.7L3.6 2.3zm10.4 8L5.4 1.7 15.7 7.5l-1.7 2.8zM17.6 9.2l-2.6 1.5 1.9 2.8 4-2.3c.8-.5.8-1.7 0-2.2l-3.3-1.8zm-3.6 3.9l-1.7-2.8-7.2 8.5c.4.2.9.1 1.4-.1l7.5-4.4z" />
        )}
      </svg>
      <span className="text-left leading-tight">
        <span className="block text-[10px] font-medium text-white/70">{sub}</span>
        <span className="block text-sm font-bold text-white">{store === "apple" ? "App Store" : "Google Play"}</span>
      </span>
    </a>
  );
}

export default function CTA() {
  return (
    <section id="cta" className="relative py-20 sm:py-24">
      <Container>
        <Reveal>
          <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-forest via-pine to-forest px-6 py-16 text-center shadow-2xl shadow-forest/30 sm:px-12 sm:py-20">
            {/* decor */}
            <div className="pointer-events-none absolute inset-0 bg-dotgrid-light opacity-40" />
            <div className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full bg-brand/30 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -right-10 h-72 w-72 rounded-full bg-sun/25 blur-3xl" />
            <div className="pointer-events-none absolute right-10 top-10 animate-float-slow">
              <Sparkles className="h-8 w-8 text-sun/70" />
            </div>

            <div className="relative mx-auto max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-sun ring-1 ring-inset ring-white/20">
                Start free today
              </span>
              <h2 className="mt-6 font-display text-3xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-5xl">
                Ready to grow your business from your phone?
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">
                Join 80,000+ merchants running smarter stores with Brikoh. Set up in minutes —
                free forever, no credit card required.
              </p>

              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <a
                  href="#/signup"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-br from-brand-light to-brand px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-brand/40 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-brand/50"
                >
                  Create my free account
                  <ArrowRight className="h-4 w-4" />
                </a>
                <div className="flex items-center gap-3">
                  <StoreBadge store="apple" sub="Download on the" />
                  <StoreBadge store="google" sub="Get it on" />
                </div>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-white/70">
                {["Free forever plan", "No credit card", "Cancel anytime"].map((t) => (
                  <span key={t} className="inline-flex items-center gap-1.5">
                    <Check className="h-4 w-4 text-sun" />
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

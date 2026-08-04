import { Container, Eyebrow, LinkButton } from "./ui";
import { PhoneDashboard, FloatCard, PaymentToast, OrderToast } from "./Mockups";
import { ArrowRight, Star, Check } from "./icons";

export default function Hero() {
  return (
    <section id="top" className="relative overflow-hidden pt-32 pb-20 sm:pt-36 lg:pt-40 lg:pb-28">
      {/* background decor */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-40 top-10 h-[34rem] w-[34rem] rounded-full bg-sun/20 blur-3xl" />
        <div className="absolute -right-32 top-40 h-[30rem] w-[30rem] rounded-full bg-leaf/15 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-[42rem] bg-dotgrid opacity-60 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
      </div>

      <Container>
        <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
          {/* copy */}
          <div className="flex flex-col items-start">
            <Eyebrow tone="orange">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" />
              Trusted by 80,000+ growing businesses
            </Eyebrow>

            <h1 className="mt-6 font-display text-[2.2rem] font-extrabold leading-[1.08] tracking-tight text-ink sm:text-5xl lg:text-6xl">
              Your whole business,
              <br />
              <span className="text-gradient-brand">beautifully in one app.</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
              Brikoh gives ambitious entrepreneurs a stunning online store, effortless
              payments, smart inventory and the analytics to grow — all from your phone.
              No spreadsheets. No stress.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <LinkButton variant="primary" href="#/signup" className="px-7 py-3.5 text-base">
                Start free — it's on us
                <ArrowRight className="h-4 w-4" />
              </LinkButton>
              <LinkButton variant="outline" href="#/mobile" className="px-7 py-3.5 text-base">
                📱 Open the app
              </LinkButton>
            </div>

            {/* trust row */}
            <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-7">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-3">
                  {["from-sun to-brand", "from-leaf to-pine", "from-brand to-sun", "from-pine to-forest", "from-forest to-pine"].map(
                    (g, i) => (
                      <span
                        key={i}
                        className={`h-9 w-9 rounded-full border-2 border-cream bg-gradient-to-br ${g}`}
                      />
                    )
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-0.5 text-brand">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <Star key={i} className="h-3.5 w-3.5" />
                    ))}
                  </div>
                  <p className="text-xs font-medium text-muted">
                    <span className="font-bold text-ink">4.9/5</span> · 6,200+ reviews
                  </p>
                </div>
              </div>

              <div className="hidden h-9 w-px bg-ink/10 sm:block" />

              <div className="flex items-center gap-2 text-sm font-medium text-ink/70">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-leaf/15 text-leaf">
                  <Check className="h-3.5 w-3.5" />
                </span>
                Free forever plan · No card required
              </div>
            </div>
          </div>

          {/* visual */}
          <div className="relative mx-auto flex w-full max-w-sm items-center justify-center sm:max-w-none">
            <div className="absolute h-[22rem] w-[22rem] rounded-full bg-gradient-to-br from-sun/30 via-brand/10 to-leaf/20 blur-2xl sm:h-[26rem] sm:w-[26rem]" />
            <div className="relative scale-[0.88] animate-float-slow sm:scale-100">
              <PhoneDashboard />
            </div>

            {/* floating cards */}
            <FloatCard className="-left-1 top-14 animate-float sm:-left-8 sm:top-16">
              <PaymentToast />
            </FloatCard>
            <FloatCard className="-right-1 bottom-20 animate-float-slow sm:-right-6 sm:bottom-24">
              <OrderToast />
            </FloatCard>
          </div>
        </div>
      </Container>
    </section>
  );
}

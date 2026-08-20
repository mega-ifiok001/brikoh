import { Container, Reveal } from "./ui";

const stats = [
  { value: "80,000+", label: "Businesses powered" },
  { value: "$340M+", label: "Processed annually" },
  { value: "14", label: "Countries served" },
  { value: "99.98%", label: "Platform uptime" },
];

export default function Stats() {
  return (
    <section className="relative overflow-hidden bg-forest py-20">
      <div className="pointer-events-none absolute inset-0 bg-dotgrid-light opacity-50" />
      <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-pine/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-brand/20 blur-3xl" />

      <Container className="relative">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sun">By the numbers</p>
            <h2 className="mt-4 font-display text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">
              Trusted by ambitious merchants everywhere
            </h2>
          </div>
        </Reveal>

        <div className="mt-14 grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-4">
          {stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 90}>
              <div className="text-center">
                <p className="font-display text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
                  {s.value}
                </p>
                <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-sun" />
                <p className="mt-3 text-sm font-medium text-white/70">{s.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

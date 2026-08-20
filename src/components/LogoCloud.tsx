import { Container } from "./ui";

const brands = [
  "Lumé Skincare",
  "Verdant Co.",
  "Kente Lane",
  "Nomad Coffee",
  "Atelier 9",
  "BrightFold",
  "Mara & Mint",
  "Olive & Oak",
  "Soko Studio",
  "Petal Press",
];

export default function LogoCloud() {
  return (
    <section className="border-y border-ink/5 bg-white py-10">
      <Container>
        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted">
          Powering modern merchants across 14 countries
        </p>
      </Container>
      <div className="relative mt-7 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
        <div className="flex w-max animate-marquee items-center gap-12 pr-12">
          {[...brands, ...brands].map((b, i) => (
            <span
              key={i}
              className="font-display text-xl font-bold tracking-tight text-ink/35 transition-colors hover:text-brand/70"
            >
              {b}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

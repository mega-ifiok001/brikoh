import { Container, SectionHeading, Reveal } from "./ui";
import { Star, Quote } from "./icons";

type T = {
  quote: string;
  name: string;
  role: string;
  grad: string;
  initials: string;
};

const testimonials: T[] = [
  {
    quote:
      "Brikoh replaced four apps and a notebook. I launched my store in an afternoon and made my first international sale the same week.",
    name: "Amara Obi",
    role: "Founder, Amara & Co.",
    grad: "from-sun to-brand",
    initials: "AO",
  },
  {
    quote:
      "The analytics finally showed me which products actually make money. I cut dead stock and profit jumped 30% in two months.",
    name: "Kwame Mensah",
    role: "Owner, Kente Lane",
    grad: "from-leaf to-pine",
    initials: "KM",
  },
  {
    quote:
      "Recording sales and sending receipts used to eat my evenings. Now it's one tap. Brikoh gave me my time back.",
    name: "Zainab Toure",
    role: "CEO, Soko Studio",
    grad: "from-brand to-sun",
    initials: "ZT",
  },
];

export default function Testimonials() {
  return (
    <section id="stories" className="relative py-24 sm:py-28">
      <Container>
        <div className="grid items-end gap-8 lg:grid-cols-[1fr_auto]">
          <SectionHeading
            align="left"
            eyebrow="Loved by merchants"
            eyebrowTone="orange"
            title={
              <>
                See what business owners <span className="text-gradient-brand">say about Brikoh</span>
              </>
            }
          />
          <div className="flex items-center gap-3 rounded-2xl border border-ink/5 bg-white px-5 py-4 shadow-sm">
            <div className="flex items-center gap-0.5 text-brand">
              {[0, 1, 2, 3, 4].map((i) => (
                <Star key={i} className="h-5 w-5" />
              ))}
            </div>
            <div className="text-sm">
              <p className="font-bold text-ink">4.9 out of 5</p>
              <p className="text-muted">6,200+ reviews</p>
            </div>
          </div>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <Reveal key={t.name} delay={i * 100}>
              <figure className="relative flex h-full flex-col rounded-3xl border border-ink/5 bg-white p-7 shadow-sm transition-shadow duration-300 hover:shadow-xl hover:shadow-forest/10">
                <Quote className="h-9 w-9 text-sun/40" />
                <blockquote className="mt-4 flex-1 text-[15px] leading-relaxed text-ink/85">
                  "{t.quote}"
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3 border-t border-ink/5 pt-5">
                  <span
                    className={`grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br ${t.grad} text-sm font-bold text-white`}
                  >
                    {t.initials}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-ink">{t.name}</p>
                    <p className="text-xs text-muted">{t.role}</p>
                  </div>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

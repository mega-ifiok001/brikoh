import PageShell from "@/components/PageShell";
import PageHero from "@/components/PageHero";
import PageCTA from "@/components/PageCTA";
import { Container, SectionHeading, Reveal, LinkButton } from "@/components/ui";
import { Rocket, Trending, Calculator, Bolt, Award, Clock, Video, ArrowRight } from "@/components/icons";

const stats = [
  { value: "100+", label: "Free lessons" },
  { value: "40,000+", label: "Students" },
  { value: "15", label: "Expert instructors" },
  { value: "4.8★", label: "Average rating" },
];

const paths = [
  {
    icon: <Rocket className="h-6 w-6" />,
    title: "Start your store",
    lessons: "18 lessons · 4h 30m",
    desc: "From zero to a live, beautiful store in one weekend.",
    grad: "from-brand to-sun",
  },
  {
    icon: <Trending className="h-6 w-6" />,
    title: "Marketing & growth",
    lessons: "22 lessons · 5h 15m",
    desc: "Social selling, ads and campaigns that actually convert.",
    grad: "from-leaf to-pine",
  },
  {
    icon: <Calculator className="h-6 w-6" />,
    title: "Money & bookkeeping",
    lessons: "16 lessons · 3h 50m",
    desc: "Prices, profit and clean books — without the jargon.",
    grad: "from-brand to-brand-light",
  },
  {
    icon: <Bolt className="h-6 w-6" />,
    title: "Automate & scale",
    lessons: "14 lessons · 3h 20m",
    desc: "Automations, staff and multi-store operations.",
    grad: "from-pine to-forest",
  },
];

const courses = [
  {
    title: "Launch Your Store in 7 Days",
    desc: "A step-by-step sprint from idea to first online sale.",
    lessons: 12,
    duration: "3h 20m",
    level: "Beginner",
    emoji: "🛍️",
    grad: "from-brand to-sun",
  },
  {
    title: "Instagram & TikTok Selling Bootcamp",
    desc: "Turn your followers into paying customers with content that sells.",
    lessons: 8,
    duration: "2h",
    level: "Beginner",
    emoji: "📱",
    grad: "from-leaf to-pine",
  },
  {
    title: "Pricing for Profit",
    desc: "Cost-plus, value-based and everything in between.",
    lessons: 6,
    duration: "1h 30m",
    level: "Intermediate",
    emoji: "🏷️",
    grad: "from-brand to-brand-light",
  },
  {
    title: "Bookkeeping for Busy Founders",
    desc: "Track income, expenses and profit without an accountant.",
    lessons: 10,
    duration: "2h 40m",
    level: "Beginner",
    emoji: "🧾",
    grad: "from-pine to-forest",
  },
  {
    title: "Automate Your Business with Brikoh",
    desc: "Stock alerts, receipts and orders on autopilot.",
    lessons: 7,
    duration: "1h 45m",
    level: "Intermediate",
    emoji: "⚙️",
    grad: "from-sun to-brand",
  },
  {
    title: "Customer Retention that Compounds",
    desc: "Keep customers coming back — and double their lifetime value.",
    lessons: 9,
    duration: "2h 15m",
    level: "Advanced",
    emoji: "💎",
    grad: "from-forest to-leaf",
  },
];

const instructors = [
  { name: "Ada Obi", role: "Founder & CEO", initials: "AO", grad: "from-sun to-brand" },
  { name: "Samuel Okafor", role: "Growth Lead", initials: "SO", grad: "from-leaf to-pine" },
  { name: "Ngozi Eze", role: "Product Lead", initials: "NE", grad: "from-brand to-sun" },
  { name: "Amina Yusuf", role: "Design Lead", initials: "AY", grad: "from-pine to-forest" },
];

export default function AcademyPage() {
  return (
    <PageShell title="Brikoh Academy">
      <PageHero
        tone="forest"
        eyebrow="Brikoh Academy"
        title={
          <>
            Learn to grow. <span className="text-sun">Free, forever.</span>
          </>
        }
        subtitle="Practical, bite-sized courses on selling, marketing and managing money — built with real merchants, for real businesses."
      >
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <LinkButton variant="primary" href="#courses">
            Browse courses
          </LinkButton>
          <LinkButton variant="light" href="#paths">
            Explore learning paths
          </LinkButton>
        </div>
      </PageHero>

      {/* stats */}
      <section className="border-y border-white/10 bg-forest pb-14 pt-2">
        <Container className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                {s.value}
              </p>
              <p className="mt-1.5 text-sm font-medium text-white/70">{s.label}</p>
            </div>
          ))}
        </Container>
      </section>

      {/* learning paths */}
      <section id="paths" className="py-20 sm:py-24">
        <Container>
          <SectionHeading
            eyebrow="Learning paths"
            eyebrowTone="orange"
            title={
              <>
                Follow a path, not <span className="text-gradient-brand">a pile of videos</span>
              </>
            }
            intro="Curated sequences that take you from wherever you are to where you want to be."
          />
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {paths.map((p, i) => (
              <Reveal key={p.title} delay={i * 90}>
                <a
                  href="#courses"
                  className="group flex h-full flex-col rounded-3xl border border-ink/5 bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-forest/10"
                >
                  <span
                    className={`grid h-13 w-13 place-items-center rounded-2xl bg-gradient-to-br ${p.grad} p-3 text-white shadow-lg transition-transform duration-300 group-hover:scale-110`}
                  >
                    {p.icon}
                  </span>
                  <h3 className="mt-4 font-display text-lg font-bold text-ink">{p.title}</h3>
                  <p className="mt-1 text-xs font-semibold text-brand">{p.lessons}</p>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{p.desc}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-ink/60 transition-colors group-hover:text-brand">
                    Start path <ArrowRight className="h-4 w-4" />
                  </span>
                </a>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* courses */}
      <section id="courses" className="bg-white py-20 sm:py-24">
        <Container>
          <SectionHeading
            eyebrow="Course catalog"
            eyebrowTone="green"
            title={
              <>
                Hand-picked courses for <span className="text-gradient-brand">every stage</span>
              </>
            }
          />
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((c, i) => (
              <Reveal key={c.title} delay={(i % 3) * 80}>
                <div className="group h-full cursor-pointer overflow-hidden rounded-3xl border border-ink/5 bg-cream transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-forest/15">
                  <div
                    className={`relative flex h-40 items-center justify-center bg-gradient-to-br ${c.grad}`}
                  >
                    <div className="absolute inset-0 bg-dotgrid-light opacity-30" />
                    <span className="relative text-5xl drop-shadow transition-transform duration-500 group-hover:scale-110">
                      {c.emoji}
                    </span>
                    <span className="absolute left-4 top-4 rounded-full bg-white/20 px-3 py-1 text-[11px] font-bold text-white backdrop-blur">
                      {c.level}
                    </span>
                  </div>
                  <div className="p-6">
                    <h3 className="font-display text-lg font-bold text-ink">{c.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted">{c.desc}</p>
                    <div className="mt-4 flex items-center gap-4 border-t border-ink/5 pt-4 text-xs font-medium text-muted">
                      <span className="inline-flex items-center gap-1.5">
                        <Video className="h-4 w-4 text-pine" /> {c.lessons} lessons
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-brand" /> {c.duration}
                      </span>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* instructors */}
      <section className="py-20 sm:py-24">
        <Container>
          <SectionHeading
            eyebrow="Your instructors"
            eyebrowTone="orange"
            title={
              <>
                Learn from people who've <span className="text-gradient-brand">done it</span>
              </>
            }
          />
          <div className="mt-14 grid grid-cols-2 gap-6 lg:grid-cols-4">
            {instructors.map((t, i) => (
              <Reveal key={t.name} delay={i * 80}>
                <div className="rounded-2xl border border-ink/5 bg-white p-6 text-center transition-shadow hover:shadow-lg hover:shadow-forest/10">
                  <span
                    className={`mx-auto grid h-18 w-18 place-items-center rounded-full bg-gradient-to-br ${t.grad} p-5 font-display text-xl font-extrabold text-white shadow-lg`}
                  >
                    {t.initials}
                  </span>
                  <h3 className="mt-4 font-display text-base font-bold text-ink">{t.name}</h3>
                  <p className="mt-1 text-xs font-medium text-muted">{t.role}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* certification */}
      <section className="pb-20">
        <Container>
          <Reveal>
            <div className="grid items-center gap-8 overflow-hidden rounded-[2rem] border border-ink/5 bg-white p-8 shadow-xl shadow-forest/10 sm:p-12 lg:grid-cols-[1.2fr_1fr]">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-brand/10 px-3.5 py-1.5 text-xs font-bold text-brand">
                  <Award className="h-3.5 w-3.5" /> Earn a certificate
                </span>
                <h3 className="mt-4 font-display text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
                  Finish a path. Get certified.
                </h3>
                <p className="mt-3 max-w-md text-[15px] leading-relaxed text-muted">
                  Complete any learning path to earn a Brikoh certificate you can share on LinkedIn
                  and with customers. New cohorts start every month.
                </p>
                <LinkButton variant="primary" href="#/signup" className="mt-6">
                  Start learning free <ArrowRight className="h-4 w-4" />
                </LinkButton>
              </div>
              <div className="flex items-center justify-center">
                <div className="w-full max-w-xs rotate-2 rounded-2xl border border-brand/20 bg-gradient-to-br from-cream to-white p-7 shadow-2xl shadow-forest/10">
                  <div className="flex items-center justify-between">
                    <span className="font-display text-lg font-extrabold text-ink">Brikoh</span>
                    <Award className="h-6 w-6 text-brand" />
                  </div>
                  <p className="mt-6 text-center text-[11px] font-bold uppercase tracking-widest text-muted">
                    Certificate of Completion
                  </p>
                  <p className="mt-2 text-center font-display text-xl font-extrabold text-forest">
                    Marketing &amp; Growth
                  </p>
                  <p className="mt-1 text-center text-xs text-muted">Awarded to Ada Obi</p>
                  <div className="mt-6 flex items-center justify-between border-t border-dashed border-ink/10 pt-4 text-[10px] text-muted">
                    <span>Brikoh Academy</span>
                    <span>Jan 2026</span>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </Container>
      </section>

      <PageCTA
        title="Your first lesson is free"
        subtitle="Join 40,000+ founders learning to sell more — no credit card, just a desire to grow."
        primaryLabel="Create free account"
        primaryHref="#/signup"
        secondaryLabel="Browse the help center"
        secondaryHref="#/help"
      />
    </PageShell>
  );
}

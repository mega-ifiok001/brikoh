import { useEffect, useMemo, useState, type MouseEvent, type ReactNode } from "react";
import {
  CAREERS_EMAIL,
  FAQ,
  MAIN_SITE,
  PROCESS,
  ROLES,
  STATS,
  TEAMS,
  VALUES,
  WORKING,
  type Role,
  type Team,
} from "../lib/careers";

const P: Record<string, ReactNode> = {
  arrowRight: <path d="M5 12h14M13 6l6 6-6 6" />,
  arrowUpRight: <path d="M7 17 17 7M8 7h9v9" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  zap: <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />,
  pin: (
    <>
      <path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  market: (
    <>
      <path d="M3 9 5 4h14l2 5" />
      <path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" />
      <path d="M5 12v8h14v-8" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  heart: <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />,
  users: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" />
      <path d="M16 5.2a3 3 0 0 1 0 5.6M18 14.8c1.8.7 3 2.3 3 5.2" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" />
    </>
  ),
  chart: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  book: (
    <>
      <path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5Z" />
      <path d="M4 19a2 2 0 0 0 2 2h13" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </>
  ),
};

function Icon({
  name,
  size = 18,
  className = "",
  strokeWidth = 1.8,
}: {
  name: string;
  size?: number;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      aria-hidden
    >
      {P[name] ?? <circle cx="12" cy="12" r="2" />}
    </svg>
  );
}

const IMG_MARKET =
  "https://images.pexels.com/photos/28641901/pexels-photo-28641901.jpeg?auto=compress&cs=tinysrgb&dpr=1&fit=crop&h=560&w=1200";

const EYEBROW = "text-xs font-extrabold uppercase tracking-[0.16em] text-brand-600";

function cn(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

function applyHref(title?: string) {
  const subject = title ? `Application: ${title}` : "Open application";
  const body = [
    "Hi Brikoh team,",
    "",
    `I'd like to apply${title ? ` for the ${title} role` : ""}.`,
    "",
    "Name:",
    "Location:",
    "CV / LinkedIn:",
    "Portfolio / GitHub / work samples:",
    "",
    "Why Brikoh, and what I've built that's relevant:",
    "",
  ].join("\n");
  return `mailto:${CAREERS_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function scrollToId(id: string) {
  if (id === "top") window.scrollTo({ top: 0, behavior: "smooth" });
  else document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

// The main app uses a HashRouter, so plain "#section" links would be read as
// routes. These handlers scroll in-page instead and never touch the hash.
const jump = (id: string) => (e: MouseEvent<HTMLElement>) => {
  e.preventDefault();
  scrollToId(id);
};

/* --------------------------------- Header --------------------------------- */

function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-cream-200 bg-cream-50/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <a href="#/" onClick={jump("top")} className="flex items-center gap-3" aria-label="Brikoh careers home">
          <img src="/logo.png" width={100} alt="Brikoh" />
          <span className="hidden rounded-full border border-brand-200 bg-brand-50 px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-brand-600 sm:inline">
            Careers
          </span>
        </a>
        <nav className="ml-4 hidden items-center gap-6 text-sm font-bold text-ink-500 md:flex">
          <a href="#/" onClick={jump("why")} className="hover:text-ink-900">Why Brikoh</a>
          <a href="#/" onClick={jump("values")} className="hover:text-ink-900">Values</a>
          <a href="#/" onClick={jump("roles")} className="hover:text-ink-900">Open roles</a>
          <a href="#/" onClick={jump("process")} className="hover:text-ink-900">Hiring process</a>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <a
            href={MAIN_SITE}
            className="hidden rounded-[10px] px-3.5 py-2 text-sm font-bold text-ink-700 hover:bg-cream-100 sm:block"
          >
            brikoh.com
          </a>
          <a
            href="#/" onClick={jump("roles")}
            className="rounded-[10px] bg-brand-500 px-3.5 py-2 text-sm font-bold text-white shadow-[0_2px_8px_rgba(236,100,5,.3)] transition-colors hover:bg-brand-600"
          >
            See open roles
          </a>
        </div>
      </div>
    </header>
  );
}

/* ---------------------------------- Hero ---------------------------------- */

function Hero({ openCount }: { openCount: number }) {
  return (
    <section id="top" className="scroll-mt-20 mx-auto max-w-6xl px-4 pb-14 pt-12 sm:px-6 lg:pt-20">
      <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_1fr]">
        <div className="anim-rise">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-extrabold text-brand-600">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-leaf-500" />
            {openCount > 0
              ? `${openCount} open ${openCount === 1 ? "role" : "roles"} · we're hiring`
              : "Always glad to meet great people"}
          </span>
          <h1 className="mt-5 font-display text-[42px] font-extrabold leading-[1.04] tracking-tight sm:text-[58px]">
            Help us build the
            <br />
            <span className="text-brand-500">market of the future.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-500">
            Brikoh is the all-in-one commerce platform for Nigerian businesses: point of sale,
            storefront, inventory, customers and payouts in one warm, fast dashboard. We're a
            small team doing meaningful work for the people who keep the economy moving.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <a
              href="#/" onClick={jump("roles")}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-3.5 text-[15px] font-extrabold text-white shadow-[0_4px_14px_rgba(236,100,5,.35)] transition-all hover:bg-brand-600"
            >
              Explore open roles
              <Icon name="arrowRight" size={17} />
            </a>
            <a
              href="#/" onClick={jump("why")}
              className="inline-flex items-center gap-2 rounded-xl border border-cream-300 bg-white px-6 py-3.5 text-[15px] font-extrabold text-ink-800 hover:border-brand-500 hover:text-brand-600"
            >
              What we're building
            </a>
          </div>
        </div>

        {/* Collage */}
        <div className="anim-rise relative mx-auto w-full max-w-md select-none [animation-delay:120ms]">
          <div className="absolute -inset-6 -z-10 rounded-[36px] bg-gradient-to-br from-brand-50 via-cream-100 to-gold-100" />
          <div className="card rotate-1 p-4">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-ink-400">
              What you'd help build
            </p>
            <ul className="mt-3 space-y-2.5">
              {[
                "Stock that corrects itself on every sale",
                "A storefront that's live the same day",
                "A wallet and payouts for every naira",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2.5 text-sm font-bold text-ink-700">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-leaf-100 text-leaf-700">
                    <Icon name="check" size={12} />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="card ml-10 mt-4 -rotate-1 p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <Icon name="users" size={18} />
              </span>
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-ink-400">
                  The team
                </p>
                <p className="font-display text-lg font-extrabold">Small, close, shipping</p>
              </div>
            </div>
          </div>
          <div className="card mr-8 mt-4 rotate-2 p-3.5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-leaf-100 text-leaf-700">
                <Icon name="pin" size={15} />
              </span>
              <p className="text-xs font-extrabold text-ink-700">Remote-friendly · Nigeria</p>
              <span className="ml-auto h-2 w-2 animate-pulse rounded-full bg-leaf-500" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------- Mission band ------------------------------ */

function MissionBand() {
  return (
    <section id="why" className="scroll-mt-20 mx-auto max-w-6xl px-4 sm:px-6">
      <div className="relative overflow-hidden rounded-3xl">
        <img
          src={IMG_MARKET}
          alt="A vibrant open-air market"
          className="h-72 w-full object-cover sm:h-96"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A100D]/92 via-[#0A100D]/60 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-12">
          <p className={EYEBROW + " !text-brand-500"}>Why Brikoh</p>
          <p className="mt-2 max-w-xl font-display text-2xl font-extrabold leading-snug text-cream-50 sm:text-4xl">
            Too many Nigerian businesses still run on notebooks, WhatsApp and memory.
          </p>
          <p className="mt-3 max-w-md text-sm font-semibold text-cream-100/80 sm:text-base">
            We're building the tools that let them sell, track and get paid properly, without
            needing a developer, an accountant or a weekend of spreadsheets.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {STATS.map((s) => (
          <div key={s.v} className="card p-5">
            <p className="font-display text-3xl font-extrabold text-brand-500">{s.k}</p>
            <p className="mt-1 text-base font-extrabold">{s.v}</p>
            <p className="mt-0.5 text-sm text-ink-500">{s.d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* --------------------------------- Values --------------------------------- */

function Values() {
  return (
    <section id="values" className="scroll-mt-20 mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="max-w-xl">
        <p className={EYEBROW}>How we think</p>
        <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
          What we care about
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-ink-500 sm:text-base">
          Four ideas shape how we build the product, and how we work with each other.
        </p>
      </div>
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {VALUES.map((v, i) => (
          <div
            key={v.title}
            className="card anim-rise p-6 transition-shadow hover:shadow-md"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <Icon name={v.icon} size={21} />
            </span>
            <h3 className="mt-4 text-lg font-extrabold">{v.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-500">{v.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------ How we work ------------------------------- */

function Working() {
  return (
    <section className="border-y border-cream-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="flex flex-col gap-12 lg:flex-row">
          <div className="lg:w-80">
            <p className={EYEBROW}>Life at Brikoh</p>
            <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight">
              Early, small and focused
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-500">
              We're at the stage where one person's work visibly moves the product. If you like
              ownership and fast feedback, you'll feel at home.
            </p>
          </div>
          <div className="grid flex-1 gap-6 sm:grid-cols-2">
            {WORKING.map((w) => (
              <div key={w.t} className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0A100D] text-cream-50">
                  <Icon name={w.icon} size={18} />
                </span>
                <div>
                  <h3 className="text-base font-extrabold">{w.t}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-ink-500">{w.b}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------- Roles --------------------------------- */

function RoleCard({
  role,
  open,
  onToggle,
}: {
  role: Role;
  open: boolean;
  onToggle: () => void;
}) {
  const panelId = `panel-${role.id}`;
  return (
    <article
      id={role.id}
      className={cn(
        "card overflow-hidden transition-shadow",
        open ? "border-brand-500 shadow-[0_8px_30px_rgba(236,100,5,.10)]" : "hover:shadow-md"
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center gap-4 p-5 text-left sm:p-6"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-cream-100 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-ink-500">
              {role.team}
            </span>
          </div>
          <h3 className="mt-2 text-xl font-extrabold tracking-tight">{role.title}</h3>
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm font-semibold text-ink-500">
            <span className="inline-flex items-center gap-1.5">
              <Icon name="pin" size={14} />
              {role.location}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Icon name="clock" size={14} />
              {role.type}
            </span>
          </div>
        </div>
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-cream-300 text-ink-700 transition-transform",
            open && "rotate-180 bg-ink-900 text-white"
          )}
        >
          <Icon name="chevronDown" size={16} />
        </span>
      </button>

      {open && (
        <div id={panelId} className="anim-rise border-t border-cream-100 px-5 pb-6 pt-5 sm:px-6">
          <p className="max-w-2xl text-[15px] leading-relaxed text-ink-700">{role.summary}</p>

          <div className="mt-6 grid gap-8 md:grid-cols-2">
            <ListBlock title="What you'll do" items={role.doing} />
            <ListBlock title="What we're looking for" items={role.needs} />
          </div>
          {role.bonus && (
            <div className="mt-6">
              <ListBlock title="Nice to have" items={role.bonus} muted />
            </div>
          )}

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <a
              href={applyHref(role.title)}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-3 text-sm font-extrabold text-white shadow-[0_4px_14px_rgba(236,100,5,.3)] transition-colors hover:bg-brand-600"
            >
              Apply for this role
              <Icon name="arrowUpRight" size={16} />
            </a>
            <span className="text-xs font-semibold text-ink-400">
              Opens your email app with a ready-to-fill note to {CAREERS_EMAIL}
            </span>
          </div>
        </div>
      )}
    </article>
  );
}

function ListBlock({ title, items, muted }: { title: string; items: string[]; muted?: boolean }) {
  return (
    <div>
      <p className="text-xs font-extrabold uppercase tracking-wider text-ink-400">{title}</p>
      <ul className="mt-3 space-y-2.5">
        {items.map((it) => (
          <li key={it} className="flex items-start gap-2.5 text-sm font-semibold text-ink-700">
            <span
              className={cn(
                "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                muted ? "bg-cream-100 text-ink-500" : "bg-leaf-100 text-leaf-700"
              )}
            >
              <Icon name="check" size={12} />
            </span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Roles() {
  const openRoles = useMemo(() => ROLES.filter((r) => r.open), []);
  const [team, setTeam] = useState<"All" | Team>("All");
  const [openId, setOpenId] = useState<string | null>(null);

  // Deep link: careers.brikoh.com/#/?role=full-stack-engineer opens + scrolls to that role.
  useEffect(() => {
    const query = window.location.hash.split("?")[1] || "";
    const id = new URLSearchParams(query).get("role");
    if (id && openRoles.some((r) => r.id === id)) {
      setOpenId(id);
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }), 150);
    }
  }, [openRoles]);

  const visibleTeams = TEAMS.filter((t) => t === "All" || openRoles.some((r) => r.team === t));
  const visible = openRoles.filter((r) => team === "All" || r.team === team);

  return (
    <section id="roles" className="scroll-mt-20 mx-auto max-w-4xl px-4 py-20 sm:px-6">
      <div className="text-center">
        <p className={EYEBROW}>Open roles</p>
        <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
          Find your place at Brikoh
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-ink-500 sm:text-base">
          Pick a role to read the details and apply. Don't see yours? Send an open application
          below.
        </p>
      </div>

      {openRoles.length > 0 ? (
        <>
          <div className="mt-8 flex flex-wrap justify-center gap-2" role="tablist" aria-label="Filter roles by team">
            {visibleTeams.map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={team === t}
                onClick={() => setTeam(t)}
                className={cn("chip", team === t && "chip-on")}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="mt-8 space-y-3">
            {visible.map((r) => (
              <RoleCard
                key={r.id}
                role={r}
                open={openId === r.id}
                onToggle={() => setOpenId(openId === r.id ? null : r.id)}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="card mt-10 p-8 text-center">
          <p className="font-display text-xl font-extrabold">No open roles right now</p>
          <p className="mt-2 text-sm text-ink-500">
            We're always happy to hear from great people. Send an open application and we'll keep
            you in mind.
          </p>
        </div>
      )}

      <div className="mt-8 flex flex-col items-start gap-4 rounded-2xl border border-dashed border-cream-300 bg-white p-6 sm:flex-row sm:items-center">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <Icon name="mail" size={20} />
        </span>
        <div className="flex-1">
          <p className="text-base font-extrabold">Don't see the right role?</p>
          <p className="mt-0.5 text-sm text-ink-500">
            Tell us what you're great at and how you'd help Brikoh grow.
          </p>
        </div>
        <a
          href={applyHref()}
          className="inline-flex items-center gap-2 rounded-xl border border-cream-300 bg-white px-5 py-3 text-sm font-extrabold text-ink-800 transition-all hover:border-brand-500 hover:text-brand-600"
        >
          Send open application
          <Icon name="arrowRight" size={16} />
        </a>
      </div>
    </section>
  );
}

/* --------------------------------- Process -------------------------------- */

function Process() {
  return (
    <section id="process" className="scroll-mt-20 border-y border-cream-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="flex flex-col gap-12 lg:flex-row lg:items-start">
          <div className="lg:w-80">
            <p className={EYEBROW}>Hiring process</p>
            <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight">
              Simple, human, quick
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-500">
              We respect your time. Here's what to expect from first hello to final answer.
            </p>
          </div>
          <ol className="flex-1 space-y-6">
            {PROCESS.map((s, i) => (
              <li key={s.t} className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0A100D] font-display text-base font-extrabold text-cream-50">
                  {i + 1}
                </span>
                <div>
                  <h3 className="text-lg font-extrabold">{s.t}</h3>
                  <p className="mt-0.5 text-sm leading-relaxed text-ink-500">{s.b}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

/* ----------------------------------- FAQ ---------------------------------- */

function Faq() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
      <div className="text-center">
        <p className={EYEBROW}>Good to know</p>
        <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight">
          Questions, answered
        </h2>
      </div>
      <div className="mt-8 space-y-3">
        {FAQ.map((f) => (
          <details key={f.q} className="card group p-5 open:border-brand-500">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-extrabold [&::-webkit-details-marker]:hidden">
              {f.q}
              <Icon
                name="chevronDown"
                size={18}
                className="text-ink-400 transition-transform group-open:rotate-180"
              />
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-ink-500">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

/* ----------------------------------- CTA ---------------------------------- */

function Cta() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
      <div className="relative overflow-hidden rounded-3xl bg-[#0A100D] px-6 py-14 text-center sm:px-12">
        <div className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-brand-500/20" />
        <div className="pointer-events-none absolute -bottom-20 -right-10 h-64 w-64 rounded-full bg-leaf-500/10" />
        <h2 className="relative font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Build something merchants rely on.
        </h2>
        <p className="relative mx-auto mt-3 max-w-md text-[15px] font-semibold text-cream-100/80">
          Join the team making everyday business easier for people who work hard for every sale.
        </p>
        <a
          href="#/" onClick={jump("roles")}
          className="relative mt-7 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-7 py-3.5 text-[15px] font-extrabold text-white shadow-lg transition-transform hover:scale-[1.02] hover:bg-brand-600"
        >
          See open roles
          <Icon name="arrowRight" size={17} />
        </a>
      </div>
    </section>
  );
}

/* --------------------------------- Footer --------------------------------- */

function Footer() {
  return (
    <footer className="border-t border-cream-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" width={100} alt="Brikoh" />
          <span className="ml-2 text-xs font-semibold text-ink-400">
            all-in-one commerce for your store
          </span>
        </div>
        <div className="flex items-center gap-5 text-sm font-bold text-ink-500">
          <a href={MAIN_SITE} className="hover:text-ink-900">brikoh.com</a>
          <a href={`mailto:${CAREERS_EMAIL}`} className="hover:text-ink-900">{CAREERS_EMAIL}</a>
        </div>
      </div>
      <p className="border-t border-cream-100 py-4 text-center text-xs font-semibold text-ink-300">
        © {new Date().getFullYear()} Brikoh.
      </p>
    </footer>
  );
}

/* ---------------------------------- Page ---------------------------------- */

export default function Careers() {
  const openCount = ROLES.filter((r) => r.open).length;

  useEffect(() => {
    const prev = document.title;
    document.title = "Careers at Brikoh | Build commerce for Nigerian businesses";
    return () => {
      document.title = prev;
    };
  }, []);

  return (
    <div className="min-h-screen overflow-x-clip bg-cream-50">
      <Header />
      <main>
        <Hero openCount={openCount} />
        <MissionBand />
        <Values />
        <Working />
        <Roles />
        <Process />
        <Faq />
        <Cta />
      </main>
      <Footer />
    </div>
  );
}
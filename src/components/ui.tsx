"use client";

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type ButtonHTMLAttributes,
  type AnchorHTMLAttributes,
} from "react";

/* ----------------------------- Logo ----------------------------- */

export function Logo({
  className = "",
  variant = "dark",
}: {
  className?: string;
  variant?: "dark" | "light";
}) {
  const text = variant === "light" ? "text-white" : "text-ink";
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span className="relative inline-flex">
        <svg width="34" height="34" viewBox="0 0 64 64" fill="none" className="drop-shadow-sm">
          <defs>
            <linearGradient id="brikohLogoGrad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
              <stop stopColor="#F2690E" />
              <stop offset="1" stopColor="#E86100" />
            </linearGradient>
          </defs>
          <rect width="64" height="64" rx="16" fill="url(#brikohLogoGrad)" />
          <g fill="#FFFFFF">
            <rect x="17" y="33" width="13" height="13" rx="3" />
            <rect x="34" y="33" width="13" height="13" rx="3" opacity="0.9" />
            <rect x="25.5" y="18" width="13" height="13" rx="3" />
          </g>
        </svg>
      </span>
      <span className={`font-display text-[1.35rem] font-extrabold tracking-tight ${text}`}>
        Brikoh
      </span>
    </span>
  );
}

/* --------------------------- Container --------------------------- */

export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`mx-auto w-full max-w-7xl px-5 sm:px-8 ${className}`}>{children}</div>;
}

/* ----------------------------- Reveal ---------------------------- */

export function Reveal({
  children,
  delay = 0,
  className = "",
  y = 24,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  y?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          obs.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        transitionDelay: `${delay}ms`,
        transform: shown ? "translateY(0)" : `translateY(${y}px)`,
      }}
      className={`transition-all duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
        shown ? "opacity-100" : "opacity-0"
      } ${className}`}
    >
      {children}
    </div>
  );
}

/* ----------------------------- Eyebrow --------------------------- */

export function Eyebrow({
  children,
  tone = "orange",
}: {
  children: ReactNode;
  tone?: "orange" | "green" | "light";
}) {
  const styles =
    tone === "green"
      ? "bg-pine/10 text-pine ring-pine/15"
      : tone === "light"
      ? "bg-white/10 text-white ring-white/20"
      : "bg-brand/10 text-brand ring-brand/15";
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider ring-1 ring-inset ${styles}`}
    >
      {children}
    </span>
  );
}

/* --------------------------- SectionHead ------------------------- */

export function SectionHeading({
  eyebrow,
  eyebrowTone = "orange",
  title,
  intro,
  align = "center",
  light = false,
}: {
  eyebrow?: ReactNode;
  eyebrowTone?: "orange" | "green" | "light";
  title: ReactNode;
  intro?: ReactNode;
  align?: "center" | "left";
  light?: boolean;
}) {
  return (
    <div
      className={`flex flex-col gap-5 ${
        align === "center" ? "items-center text-center" : "items-start text-left"
      } ${align === "center" ? "mx-auto max-w-2xl" : "max-w-xl"}`}
    >
      {eyebrow && <Eyebrow tone={eyebrowTone}>{eyebrow}</Eyebrow>}
      <h2
        className={`font-display text-3xl font-extrabold leading-[1.1] tracking-tight sm:text-4xl md:text-[2.75rem] ${
          light ? "text-white" : "text-ink"
        }`}
      >
        {title}
      </h2>
      {intro && (
        <p className={`text-base leading-relaxed sm:text-lg ${light ? "text-white/75" : "text-muted"}`}>
          {intro}
        </p>
      )}
    </div>
  );
}

/* ----------------------------- Button ---------------------------- */

type BtnVariant = "primary" | "dark" | "outline" | "ghost" | "light";
type Common = { variant?: BtnVariant; className?: string; children: ReactNode };

const variantClasses: Record<BtnVariant, string> = {
  primary:
    "bg-gradient-to-br from-brand-light to-brand text-white shadow-lg shadow-brand/25 hover:shadow-xl hover:shadow-brand/35 hover:-translate-y-0.5",
  dark: "bg-forest text-white shadow-lg shadow-forest/20 hover:bg-forest/90 hover:-translate-y-0.5",
  outline:
    "border border-ink/15 bg-white text-ink hover:border-brand hover:text-brand",
  ghost: "text-ink hover:bg-ink/5",
  light: "bg-white text-forest hover:bg-cream shadow-lg shadow-black/10",
};

function btnBase(cls: string) {
  return `inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-all duration-300 active:scale-[0.98] ${cls}`;
}

export function Button({
  variant = "primary",
  className = "",
  children,
  ...rest
}: Common & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={btnBase(`${variantClasses[variant]} ${className}`)} {...rest}>
      {children}
    </button>
  );
}

export function LinkButton({
  variant = "primary",
  className = "",
  children,
  ...rest
}: Common & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a className={btnBase(`${variantClasses[variant]} ${className}`)} {...rest}>
      {children}
    </a>
  );
}

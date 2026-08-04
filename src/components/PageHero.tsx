import type { ReactNode } from "react";
import { Container, Eyebrow } from "./ui";

export default function PageHero({
  eyebrow,
  eyebrowTone = "orange",
  title,
  subtitle,
  tone = "cream",
  align = "center",
  children,
}: {
  eyebrow?: ReactNode;
  eyebrowTone?: "orange" | "green" | "light";
  title: ReactNode;
  subtitle?: ReactNode;
  tone?: "cream" | "forest";
  align?: "center" | "left";
  children?: ReactNode;
}) {
  const forest = tone === "forest";
  return (
    <section className={`relative overflow-hidden ${forest ? "bg-forest" : "bg-cream"}`}>
      <div className="pointer-events-none absolute inset-0">
        {forest ? (
          <>
            <div className="absolute inset-0 bg-dotgrid-light opacity-40" />
            <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-pine/50 blur-3xl" />
            <div className="absolute -bottom-28 -right-16 h-80 w-80 rounded-full bg-brand/25 blur-3xl" />
          </>
        ) : (
          <>
            <div className="absolute -left-32 top-8 h-80 w-80 rounded-full bg-sun/15 blur-3xl" />
            <div className="absolute -right-24 top-24 h-72 w-72 rounded-full bg-leaf/10 blur-3xl" />
            <div className="absolute inset-x-0 top-0 h-80 bg-dotgrid opacity-50 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
          </>
        )}
      </div>

      <Container className="relative">
        <div
          className={`flex flex-col gap-5 pb-14 pt-32 sm:pb-16 sm:pt-40 lg:pb-20 lg:pt-44 ${
            align === "center"
              ? "mx-auto max-w-3xl items-center text-center"
              : "max-w-2xl items-start text-left"
          }`}
        >
          {eyebrow && <Eyebrow tone={forest ? "light" : eyebrowTone}>{eyebrow}</Eyebrow>}
          <h1
            className={`font-display text-4xl font-extrabold leading-[1.06] tracking-tight sm:text-5xl lg:text-6xl ${
              forest ? "text-white" : "text-ink"
            }`}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              className={`text-base leading-relaxed sm:text-lg ${
                forest ? "text-white/75" : "text-muted"
              }`}
            >
              {subtitle}
            </p>
          )}
          {children && <div className="mt-1">{children}</div>}
        </div>
      </Container>
    </section>
  );
}

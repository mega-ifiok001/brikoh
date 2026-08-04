"use client";

import { useState } from "react";
import { Container, Reveal } from "./ui";
import { ArrowRight, Check } from "./icons";

export default function Newsletter({
  title = "Never miss a growth tip",
  subtitle = "Join 40,000+ founders getting weekly insights on selling, scaling and thriving.",
}: {
  title?: string;
  subtitle?: string;
}) {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  return (
    <section className="py-16 sm:py-20">
      <Container>
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] bg-forest px-6 py-12 sm:px-12 sm:py-14">
            <div className="pointer-events-none absolute inset-0 bg-dotgrid-light opacity-40" />
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand/30 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-leaf/25 blur-3xl" />

            <div className="relative mx-auto grid max-w-4xl items-center gap-8 lg:grid-cols-[1.2fr_1fr]">
              <div>
                <h2 className="font-display text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                  {title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-white/70 sm:text-base">{subtitle}</p>
              </div>
              {done ? (
                <div className="flex items-center gap-3 rounded-2xl bg-white/10 p-4 text-white ring-1 ring-white/15">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-leaf text-white">
                    <Check className="h-5 w-5" />
                  </span>
                  <p className="text-sm font-semibold">You're in! Check your inbox for a welcome note. 🎉</p>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) setDone(true);
                  }}
                  className="flex w-full gap-2"
                >
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@business.com"
                    className="w-full rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm text-white placeholder-white/40 outline-none transition-colors focus:border-sun focus:bg-white/15"
                  />
                  <button
                    type="submit"
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-gradient-to-br from-brand-light to-brand px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/30 transition-transform hover:-translate-y-0.5"
                  >
                    Subscribe <ArrowRight className="h-4 w-4" />
                  </button>
                </form>
              )}
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

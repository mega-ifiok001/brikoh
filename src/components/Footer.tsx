"use client";

import { useState } from "react";
import { Container, Logo } from "./ui";
import { ArrowRight, Check } from "./icons";

type FooterLink = { label: string; href?: string };

const columns: { title: string; links: FooterLink[] }[] = [
  {
    title: "Product",
    links: [
      { label: "Log in", href: "#/login" },
      { label: "Create account", href: "#/signup" },
      { label: "E-commerce report", href: "#/report" },
      { label: "Blog", href: "#/blog" },
      { label: "Help center", href: "#/help" },
      { label: "Contact us", href: "#/contact" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About us", href: "#/about" },
      { label: "Careers", href: "#/about" },
      { label: "Press", href: "#/blog" },
      { label: "Blog", href: "#/blog" },
      { label: "Champions", href: "#/academy" },
      { label: "Contact", href: "#/contact" },
      { label: "Admin console", href: "#/admin" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Brikoh Academy", href: "#/academy" },
      { label: "Help center", href: "#/help" },
      { label: "Community", href: "#/blog" },
      { label: "E-commerce report", href: "#/report" },
      { label: "Security", href: "#/security" },
      { label: "Status", href: "#/help" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy policy", href: "#/privacy" },
      { label: "Terms of service", href: "#/terms" },
      { label: "Cookie policy", href: "#/cookies" },
      { label: "Security", href: "#/security" },
    ],
  },
];

const socials = ["X", "in", "Ig", "Yt", "Fb"];

export default function Footer() {
  const [subscribed, setSubscribed] = useState(false);
  return (
    <footer className="relative overflow-hidden bg-forest text-white">
      <div className="pointer-events-none absolute inset-0 bg-dotgrid-light opacity-30" />
      <div className="pointer-events-none absolute -left-32 top-0 h-72 w-72 rounded-full bg-pine/40 blur-3xl" />

      <Container className="relative">
        {/* newsletter */}
        <div className="grid gap-8 border-b border-white/10 py-14 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div>
            <h3 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
              Get growth tips, straight to your inbox.
            </h3>
            <p className="mt-2 max-w-md text-sm text-white/65">
              Join 40,000+ founders getting weekly insights on selling, scaling and thriving.
            </p>
          </div>
          {subscribed ? (
            <div className="flex items-center gap-2 rounded-full bg-white/10 px-5 py-3 text-sm font-semibold text-white ring-1 ring-inset ring-white/15">
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-leaf text-white"><Check className="h-3.5 w-3.5" /></span>
              You're subscribed! Watch your inbox. 🎉
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSubscribed(true);
              }}
              className="flex w-full max-w-md gap-2 lg:ml-auto"
            >
              <input
                type="email"
                required
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

        {/* links */}
        <div className="grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <Logo variant="light" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/65">
              The all-in-one business app to start, run and grow your business — beautifully, from
              your phone.
            </p>
            <div className="mt-5 flex gap-2">
              {socials.map((s) => (
                <a
                  key={s}
                  href="#"
                  aria-label={s}
                  className="grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-white/5 text-xs font-bold text-white/80 transition-colors hover:border-sun hover:bg-sun hover:text-ink"
                >
                  {s}
                </a>
              ))}
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-bold uppercase tracking-wider text-white/90">
                {col.title}
              </h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href ?? "#"}
                      className="text-sm text-white/60 transition-colors hover:text-sun"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* bottom */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 py-7 text-center sm:flex-row sm:text-left">
          <p className="text-xs text-white/50">
            © {new Date().getFullYear()} Brikoh Technologies. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-white/50">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-leaf" />
              All systems operational
            </span>
            <span className="text-white/20">·</span>
            <span>Made with care for African founders</span>
          </div>
        </div>
      </Container>
    </footer>
  );
}

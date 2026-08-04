"use client";

import { useEffect, useState } from "react";
import { Container, Logo, LinkButton } from "./ui";
import { useAuth } from "@/context/AuthContext";
import { Menu, Close, ArrowRight, LogOut } from "./icons";
import ThemeToggle from "./ThemeToggle";

const links = [
  { label: "Features", href: "#features" },
  { label: "Platform", href: "#platform" },
  { label: "Pricing", href: "#pricing" },
  { label: "Stories", href: "#stories" },
  { label: "FAQ", href: "#faq" },
];

export default function Navbar() {
  const { user, business, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const initial = user?.name.charAt(0).toUpperCase() ?? "";
  const firstName = user?.name.split(" ")[0] ?? "";

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className={`transition-all duration-300 ${scrolled ? "py-2.5" : "py-4"}`}>
        <Container>
          <div
            className={`flex items-center justify-between rounded-2xl px-4 py-2.5 transition-all duration-300 ${
              scrolled
                ? "border border-ink/5 bg-cream/85 shadow-lg shadow-ink/5 backdrop-blur-xl"
                : "border border-transparent bg-transparent"
            }`}
          >
            <a href="#top" className="shrink-0">
              <Logo />
            </a>

            <nav className="hidden items-center gap-1 lg:flex">
              {links.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  className="rounded-full px-4 py-2 text-sm font-medium text-ink/70 transition-colors hover:bg-ink/5 hover:text-ink"
                >
                  {l.label}
                </a>
              ))}
            </nav>

            {user ? (
              <div className="hidden items-center gap-3 lg:flex">
                <LinkButton variant="outline" href="#/mobile" className="px-4">
                  📱 Use the app
                </LinkButton>
                <LinkButton
                  variant="outline"
                  href={business ? "#/dashboard" : "#/onboarding"}
                  className="px-4"
                >
                  {business ? "Dashboard" : "Finish setup"}
                </LinkButton>
                <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-brand-light to-brand text-sm font-bold text-white shadow-md shadow-brand/25">
                  {initial}
                </span>
                <span className="max-w-[100px] truncate text-sm font-semibold text-ink">
                  {firstName}
                </span>
                <button
                  onClick={logout}
                  className="inline-flex items-center gap-1.5 rounded-full border border-ink/10 bg-white px-4 py-2 text-sm font-semibold text-ink transition-colors hover:border-brand hover:text-brand"
                >
                  <LogOut className="h-4 w-4" /> Log out
                </button>
              </div>
            ) : (
              <div className="hidden items-center gap-2 lg:flex">
                <ThemeToggle />
                <LinkButton variant="ghost" href="#/login" className="px-4">
                  Log in
                </LinkButton>
                <LinkButton variant="primary" href="#/signup">
                  Start free
                  <ArrowRight className="h-4 w-4" />
                </LinkButton>
              </div>
            )}

            <button
              aria-label="Toggle menu"
              onClick={() => setOpen((v) => !v)}
              className="grid h-10 w-10 place-items-center rounded-xl border border-ink/10 bg-white/70 text-ink lg:hidden"
            >
              {open ? <Close className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </Container>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="lg:hidden">
          <div
            className="fixed inset-0 top-0 -z-10 bg-ink/30 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <Container>
            <div className="mt-2 rounded-2xl border border-ink/5 bg-cream p-4 shadow-2xl shadow-ink/10">
              <nav className="flex flex-col">
                {links.map((l) => (
                  <a
                    key={l.label}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="border-b border-ink/5 py-3 text-base font-medium text-ink/80 last:border-0"
                  >
                    {l.label}
                  </a>
                ))}
              </nav>
              <div className="mb-3 flex items-center justify-between rounded-xl border border-ink/10 bg-white px-4 py-3">
                <span className="text-sm font-semibold text-ink">Dark mode</span>
                <ThemeToggle />
              </div>
              <div className="mt-4 flex flex-col gap-2">
                {user ? (
                  <div className="flex items-center justify-between rounded-xl border border-ink/10 bg-white p-3">
                    <div className="flex items-center gap-2.5">
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-brand-light to-brand text-sm font-bold text-white">
                        {initial}
                      </span>
                      <span className="text-sm font-semibold text-ink">{firstName}</span>
                    </div>
                    <button
                      onClick={() => {
                        logout();
                        setOpen(false);
                      }}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand"
                    >
                      <LogOut className="h-4 w-4" /> Log out
                    </button>
                  </div>
                ) : (
                  <>
                    <LinkButton variant="outline" href="#/login" onClick={() => setOpen(false)}>
                      Log in
                    </LinkButton>
                    <LinkButton variant="primary" href="#/signup" onClick={() => setOpen(false)}>
                      Start free
                      <ArrowRight className="h-4 w-4" />
                    </LinkButton>
                  </>
                )}
              </div>
            </div>
          </Container>
        </div>
      )}
    </header>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Check, ArrowRight } from "@/components/icons";

/** Sliding welcome toast shown right after a successful sign-up / login. */
export default function WelcomeToast() {
  const { user, business } = useAuth();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const name = sessionStorage.getItem("brikoh_just_authed");
    if (name) {
      setShow(true);
      const t = setTimeout(() => {
        setShow(false);
        sessionStorage.removeItem("brikoh_just_authed");
      }, 6000);
      return () => clearTimeout(t);
    }
  }, []);

  if (!show || !user) return null;

  const href = business ? "#/dashboard" : "#/onboarding";
  const title = business ? `Welcome back, ${user.name.split(" ")[0]}! 🎉` : `Welcome, ${user.name.split(" ")[0]}! 🎉`;
  const text = business
    ? "Your business is ready — jump into your dashboard."
    : "Let's set up your business in a few quick steps.";

  return (
    <div className="fixed bottom-6 right-6 z-50 flex animate-pop items-center gap-3 rounded-2xl border border-ink/5 bg-white p-4 shadow-2xl shadow-ink/20">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-leaf/15 text-leaf">
        <Check className="h-5 w-5" />
      </span>
      <div>
        <p className="text-sm font-bold text-ink">{title}</p>
        <p className="text-xs text-muted">{text}</p>
      </div>
      <a
        href={href}
        className="ml-1 inline-flex shrink-0 items-center gap-1 rounded-full bg-gradient-to-br from-brand-light to-brand px-4 py-2 text-xs font-bold text-white shadow-lg shadow-brand/25"
      >
        {business ? "Dashboard" : "Set up"} <ArrowRight className="h-3.5 w-3.5" />
      </a>
    </div>
  );
}

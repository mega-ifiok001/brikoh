"use client";

import { useState, type ReactNode, type InputHTMLAttributes, type ButtonHTMLAttributes } from "react";
import { Logo } from "@/components/ui";
import { passwordScore } from "@/lib/auth";
import {
  ArrowLeft,
  AlertCircle,
  Check,
  CheckCircle,
  Eye,
  EyeOff,
  Google,
  Apple,
  Quote,
} from "@/components/icons";

/* ------------------------------ Shell ------------------------------ */

export function AuthShell({
  children,
  title,
  subtitle,
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="min-h-screen bg-cream lg:grid lg:grid-cols-[0.9fr_1.1fr]">
      {/* Brand panel (desktop) */}
      <aside className="relative hidden overflow-hidden bg-forest p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
        <div className="pointer-events-none absolute inset-0 bg-dotgrid-light opacity-40" />
        <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-pine/50 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-brand/25 blur-3xl" />

        <div className="relative">
          <a href="#/" className="inline-block">
            <Logo variant="light" />
          </a>
        </div>

        <div className="relative">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sun">
            Welcome to Brikoh
          </p>
          <h2 className="mt-4 font-display text-4xl font-extrabold leading-[1.1] tracking-tight xl:text-5xl">
            Your whole business, beautifully in one app.
          </h2>
          <ul className="mt-8 space-y-4">
            {[
              "Stunning online store in minutes",
              "Local & international payments",
              "Smart inventory & powerful analytics",
            ].map((t) => (
              <li key={t} className="flex items-center gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-leaf/25 text-leaf">
                  <Check className="h-4 w-4" />
                </span>
                <span className="text-white/85">{t}</span>
              </li>
            ))}
          </ul>
        </div>

        <figure className="relative rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur">
          <Quote className="h-7 w-7 text-sun/60" />
          <blockquote className="mt-3 text-sm leading-relaxed text-white/85">
            "I launched my store in an afternoon and made my first international sale the same
            week."
          </blockquote>
          <figcaption className="mt-4 flex items-center gap-3">
            <span className="h-10 w-10 rounded-full bg-gradient-to-br from-sun to-brand" />
            <div>
              <p className="text-sm font-bold text-white">Amara Obi</p>
              <p className="text-xs text-white/60">Founder, Amara &amp; Co.</p>
            </div>
          </figcaption>
        </figure>
      </aside>

      {/* Form side */}
      <main className="relative flex min-h-screen flex-col px-5 py-8 sm:px-10">
        <div className="flex items-center justify-between">
          <a href="#/" className="lg:hidden">
            <Logo />
          </a>
          <a
            href="#/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-brand"
          >
            <ArrowLeft className="h-4 w-4" /> Back to home
          </a>
        </div>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">{title}</h1>
          {subtitle && <p className="mt-2 text-[15px] leading-relaxed text-muted">{subtitle}</p>}
          <div className="mt-8">{children}</div>
        </div>

        <p className="text-center text-xs text-muted">
          Protected by Brikoh{" "}
          <span className="font-semibold text-forest">Security</span> · End-to-end encrypted
        </p>
      </main>
    </div>
  );
}

/* ------------------------------ Fields ----------------------------- */

const inputBox = (error?: string) =>
  `group relative flex items-center rounded-xl border bg-white transition-all focus-within:ring-4 ${
    error
      ? "border-red-300 focus-within:border-red-400 focus-within:ring-red-100"
      : "border-ink/10 focus-within:border-brand focus-within:ring-brand/10"
  }`;

export function TextInput({
  label,
  icon,
  error,
  hint,
  className = "",
  ...props
}: {
  label: string;
  icon?: ReactNode;
  error?: string;
  hint?: string;
  className?: string;
} & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-sm font-semibold text-ink">{label}</label>
      <div className={inputBox(error)}>
        {icon && (
          <span className="pointer-events-none absolute left-4 text-ink/35 transition-colors group-focus-within:text-brand">
            {icon}
          </span>
        )}
        <input
          className={`w-full bg-transparent py-3.5 text-[15px] text-ink outline-none placeholder:text-ink/30 ${
            icon ? "pl-11" : "pl-4"
          } pr-4`}
          {...props}
        />
      </div>
      {hint && !error && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
      {error && (
        <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-500">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {error}
        </p>
      )}
    </div>
  );
}

export function PasswordInput({
  label,
  icon,
  error,
  withMeter = false,
  className = "",
  ...props
}: {
  label: string;
  icon?: ReactNode;
  error?: string;
  withMeter?: boolean;
  className?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  const [show, setShow] = useState(false);
  const value = String(props.value ?? "");
  const score = withMeter ? passwordScore(value) : null;
  const barColors = ["bg-[#ef4444]", "bg-[#ef4444]", "bg-sun", "bg-pine", "bg-leaf"];

  return (
    <div className={className}>
      <label className="mb-1.5 block text-sm font-semibold text-ink">{label}</label>
      <div className={inputBox(error)}>
        {icon && (
          <span className="pointer-events-none absolute left-4 text-ink/35 transition-colors group-focus-within:text-brand">
            {icon}
          </span>
        )}
        <input
          type={show ? "text" : "password"}
          className={`w-full bg-transparent py-3.5 text-[15px] text-ink outline-none placeholder:text-ink/30 ${
            icon ? "pl-11" : "pl-4"
          } pr-12`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute right-3 grid h-8 w-8 place-items-center rounded-lg text-ink/40 transition-colors hover:text-ink"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {withMeter && score && value.length > 0 && (
        <div className="mt-2">
          <div className="flex gap-1.5">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                  i < score.score ? barColors[score.score] : "bg-ink/10"
                }`}
              />
            ))}
          </div>
          <p className="mt-1.5 text-xs text-muted">
            Strength:{" "}
            <span
              className={`font-semibold ${
                score.score <= 1 ? "text-red-500" : score.score === 2 ? "text-[#b7791f]" : "text-leaf"
              }`}
            >
              {score.label}
            </span>
          </p>
        </div>
      )}
      {error && (
        <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-500">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {error}
        </p>
      )}
    </div>
  );
}

/* ------------------------------ Buttons ---------------------------- */

export function PrimaryButton({
  loading = false,
  children,
  className = "",
  ...rest
}: { loading?: boolean } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      disabled={loading || rest.disabled}
      className={`inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-brand-light to-brand px-6 py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-brand/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-brand/35 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 ${className}`}
      {...rest}
    >
      {loading ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          Please wait…
        </>
      ) : (
        children
      )}
    </button>
  );
}

export function SocialButtons({
  onGoogle,
  onApple,
}: {
  onGoogle?: () => void;
  onApple?: () => void;
}) {
  const cls =
    "inline-flex items-center justify-center gap-2.5 rounded-xl border border-ink/10 bg-white py-3 text-sm font-semibold text-ink transition-all hover:border-ink/25 hover:bg-cream active:scale-[0.99]";
  return (
    <div className="grid grid-cols-2 gap-3">
      <button type="button" onClick={onGoogle} className={cls}>
        <Google className="h-5 w-5" /> Google
      </button>
      <button type="button" onClick={onApple} className={cls}>
        <Apple className="h-5 w-5" /> Apple
      </button>
    </div>
  );
}

export function Divider({ label = "or continue with email" }: { label?: string }) {
  return (
    <div className="flex items-center gap-4">
      <span className="h-px flex-1 bg-ink/10" />
      <span className="text-xs font-medium uppercase tracking-wider text-muted">{label}</span>
      <span className="h-px flex-1 bg-ink/10" />
    </div>
  );
}

/* ---------------------------- Feedback ----------------------------- */

export function AlertBox({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

export function DemoHint({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-pine/40 bg-pine/[0.06] px-4 py-3 text-sm text-forest">
      {children}
    </div>
  );
}

export function SuccessPanel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center py-4 text-center">
      <span className="grid h-16 w-16 animate-pop place-items-center rounded-full bg-leaf/15 text-leaf">
        <CheckCircle className="h-8 w-8" />
      </span>
      <h2 className="mt-5 font-display text-2xl font-extrabold text-ink">{title}</h2>
      {subtitle && <p className="mt-2 max-w-sm text-[15px] leading-relaxed text-muted">{subtitle}</p>}
      {children && <div className="mt-6 w-full">{children}</div>}
    </div>
  );
}

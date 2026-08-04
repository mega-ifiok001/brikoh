"use client";

import { useState } from "react";
import { Logo } from "@/components/ui";
import { adminLogin, setAdminSession, ADMIN_EMAIL, ADMIN_PASSWORD } from "@/lib/admin";
import { Lock, Mail, Eye, Shield, AlertCircle, Check, ArrowLeft } from "@/components/icons";

export default function AdminLogin({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    setTimeout(() => {
      if (adminLogin(email, password)) {
        setAdminSession(true);
        onSuccess();
      } else {
        setErr("Invalid admin credentials. Try the demo login below.");
        setLoading(false);
      }
    }, 700);
  };

  return (
    <div className="min-h-screen bg-cream lg:grid lg:grid-cols-2">
      {/* brand panel */}
      <aside className="relative hidden overflow-hidden bg-forest p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
        <div className="pointer-events-none absolute inset-0 bg-dotgrid-light opacity-40" />
        <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-pine/50 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-brand/25 blur-3xl" />
        <div className="relative"><Logo variant="light" /></div>
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-sun ring-1 ring-inset ring-white/20">
            <Shield className="h-3.5 w-3.5" /> Brikoh Operations
          </span>
          <h2 className="mt-5 font-display text-4xl font-extrabold leading-[1.1] tracking-tight xl:text-5xl">
            The command center behind every merchant.
          </h2>
          <p className="mt-4 max-w-md text-white/70">
            Oversee businesses, payments, plans, feature flags, website templates and support —
            all in one secure console for the Brikoh team.
          </p>
          <ul className="mt-8 space-y-3">
            {["Merchant oversight & account controls", "Platform payments & withdrawal queue", "Plans, pricing, templates & feature gates"].map((t) => (
              <li key={t} className="flex items-center gap-3 text-sm text-white/85">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-leaf/25 text-leaf"><Check className="h-4 w-4" /></span>
                {t}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-white/40">Restricted access · 2FA enforced · All actions audited</p>
      </aside>

      {/* form */}
      <main className="flex min-h-screen flex-col px-5 py-8 sm:px-10">
        <div className="flex items-center justify-between">
          <a href="#/" className="lg:hidden"><Logo /></a>
          <a href="#/" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-brand"><ArrowLeft className="h-4 w-4" /> Back to home</a>
        </div>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-forest/10 text-forest"><Shield className="h-7 w-7" /></span>
          <h1 className="mt-5 font-display text-3xl font-extrabold tracking-tight text-ink">Brikoh Ops Console</h1>
          <p className="mt-2 text-[15px] text-muted">Sign in with your admin account to manage the platform.</p>

          <form onSubmit={submit} className="mt-8 space-y-4" noValidate>
            {err && (
              <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {err}
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ink">Admin email</label>
              <div className="group relative flex items-center rounded-xl border border-ink/10 bg-white transition-all focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/10">
                <Mail className="pointer-events-none absolute left-4 h-5 w-5 text-ink/35" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@brikoh.app" className="w-full bg-transparent py-3.5 pl-11 pr-4 text-[15px] outline-none placeholder:text-ink/30" />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ink">Password</label>
              <div className="group relative flex items-center rounded-xl border border-ink/10 bg-white transition-all focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/10">
                <Lock className="pointer-events-none absolute left-4 h-5 w-5 text-ink/35" />
                <input type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-transparent py-3.5 pl-11 pr-12 text-[15px] outline-none placeholder:text-ink/30" />
                <button type="button" onClick={() => setShow((v) => !v)} className="absolute right-3 grid h-8 w-8 place-items-center rounded-lg text-ink/40 hover:text-ink" aria-label="Toggle password"><Eye className="h-4 w-4" /></button>
              </div>
            </div>
            <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-forest to-pine py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-forest/25 transition-all hover:-translate-y-0.5 disabled:opacity-70">
              {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <Shield className="h-4 w-4" />}
              {loading ? "Verifying…" : "Sign in to Ops Console"}
            </button>
          </form>

          <div className="mt-6 rounded-2xl border border-dashed border-pine/40 bg-pine/[0.06] px-4 py-3.5 text-sm text-forest">
            <p className="font-bold">Demo admin access</p>
            <p className="mt-1 font-mono text-xs">{ADMIN_EMAIL} · {ADMIN_PASSWORD}</p>
            <button type="button" onClick={() => { setEmail(ADMIN_EMAIL); setPassword(ADMIN_PASSWORD); setErr(""); }} className="mt-2 text-xs font-bold text-brand underline underline-offset-2">Autofill</button>
          </div>
        </div>
      </main>
    </div>
  );
}

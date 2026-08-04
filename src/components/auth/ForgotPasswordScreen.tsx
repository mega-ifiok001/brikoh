"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { isValidEmail } from "@/lib/auth";
import { TextInput, PrimaryButton, AlertBox, SuccessPanel } from "./AuthUI";
import { Mail, ArrowLeft } from "@/components/icons";
import { LinkButton } from "@/components/ui";

export default function ForgotPasswordScreen() {
  const { requestReset } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [code, setCode] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    try {
      const c = await requestReset(email);
      sessionStorage.setItem("brikoh_reset_email", email.trim().toLowerCase());
      setCode(c);
      setLoading(false);
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  if (code) {
    return (
      <SuccessPanel
        title="Check your email"
        subtitle={`We sent a 6-digit verification code to ${email
          .trim()
          .toLowerCase()}. It expires in 15 minutes.`}
      >
        <div className="rounded-xl border border-dashed border-brand/40 bg-brand/[0.05] px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand">
            Demo preview — your code
          </p>
          <p className="mt-1.5 font-display text-2xl font-extrabold tracking-[0.3em] text-ink">
            {code}
          </p>
          <p className="mt-1.5 text-xs text-muted">In production this is delivered by email.</p>
        </div>
        <LinkButton variant="primary" href="#/reset-password" className="mt-5 w-full">
          I have the code — continue
        </LinkButton>
      </SuccessPanel>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {error && <AlertBox>{error}</AlertBox>}

      <TextInput
        label="Email address"
        type="email"
        icon={<Mail className="h-5 w-5" />}
        placeholder="you@business.com"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <PrimaryButton loading={loading}>Send reset code</PrimaryButton>

      <a
        href="#/login"
        className="inline-flex w-full items-center justify-center gap-1.5 pt-1 text-sm font-semibold text-muted transition-colors hover:text-brand"
      >
        <ArrowLeft className="h-4 w-4" /> Back to log in
      </a>
    </form>
  );
}

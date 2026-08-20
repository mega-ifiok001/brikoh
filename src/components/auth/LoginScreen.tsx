"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { isValidEmail } from "@/lib/auth";
import { ApiError } from "@/api/types";
import { TextInput, PasswordInput, PrimaryButton, AlertBox, SuccessPanel } from "./AuthUI";
import { Mail, Lock } from "@/components/icons";

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [totpRequired, setTotpRequired] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!isValidEmail(email)) { setError("Please enter a valid email address."); return; }
    if (!password) { setError("Please enter your password."); return; }
    if (totpRequired && totpCode.replace(/\D/g, "").length !== 6) { setError("Enter the 6-digit code from your authenticator app."); return; }
    setLoading(true);
    try {
      const user = await login(email, password, totpRequired ? totpCode.trim() : undefined);
      setDone(true);
      setTimeout(() => {
        window.location.hash = user.needsOnboarding ? "/onboarding" : "/dashboard";
      }, 800);
    } catch (err) {
      // 2FA enabled → show the TOTP field
      if (err instanceof ApiError && err.code === "TOTP_REQUIRED") {
        setTotpRequired(true);
        setError("This account has two-factor authentication enabled. Enter your 6-digit code.");
      } else {
        setError(err instanceof ApiError ? err.message : (err as Error).message);
      }
      setLoading(false);
    }
  }

  if (done) return <SuccessPanel title="Welcome back!" subtitle="Signing you into your workspace…" />;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {error && <AlertBox>{error}</AlertBox>}
      <TextInput
        label="Email address" type="email" icon={<Mail className="h-5 w-5" />}
        placeholder="you@business.com" autoComplete="email" value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <PasswordInput
        label="Password" icon={<Lock className="h-5 w-5" />} placeholder="••••••••"
        autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)}
      />
      {totpRequired && (
        <TextInput
          label="Authenticator code (6 digits)" inputMode="numeric" placeholder="••••••"
          autoComplete="one-time-code" value={totpCode}
          onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
        />
      )}
      <PrimaryButton loading={loading}>Log in</PrimaryButton>

      <p className="pt-2 text-center text-sm text-muted">
        New to Brikoh?{" "}
        <a href="#/signup" className="font-bold text-brand hover:text-brand-light">Create a free account</a>
      </p>
      <p className="pt-1 text-center text-xs text-muted">
        Invited as staff?{" "}
        <a href="#/accept-invite" className="font-bold text-brand hover:text-brand-light">Accept your invite</a>
      </p>
    </form>
  );
}

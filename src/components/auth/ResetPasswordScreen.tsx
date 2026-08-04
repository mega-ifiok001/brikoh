"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { isValidEmail } from "@/lib/auth";
import { TextInput, PasswordInput, PrimaryButton, AlertBox, SuccessPanel } from "./AuthUI";
import { Mail, Lock } from "@/components/icons";
import { LinkButton } from "@/components/ui";

export default function ResetPasswordScreen() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState(() =>
    typeof window !== "undefined" ? sessionStorage.getItem("brikoh_reset_email") ?? "" : ""
  );
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!/^\d{6}$/.test(code.trim())) {
      setError("Enter the 6-digit code we sent you.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email, code, password);
      sessionStorage.removeItem("brikoh_reset_email");
      setDone(true);
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  if (done) {
    return (
      <SuccessPanel
        title="Password updated"
        subtitle="Your new password is active. Log in with it to continue."
      >
        <LinkButton variant="primary" href="#/login" className="w-full">
          Back to log in
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

      <TextInput
        label="Verification code"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={6}
        placeholder="6-digit code"
        autoComplete="one-time-code"
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ""))}
        hint="Check the email you used to request the code."
      />

      <PasswordInput
        label="New password"
        icon={<Lock className="h-5 w-5" />}
        placeholder="Min. 8 characters"
        autoComplete="new-password"
        withMeter
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <PasswordInput
        label="Confirm new password"
        icon={<Lock className="h-5 w-5" />}
        placeholder="Re-enter your new password"
        autoComplete="new-password"
        error={
          confirm.length > 0 && password !== confirm ? "Passwords do not match." : undefined
        }
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
      />

      <PrimaryButton loading={loading}>Reset password</PrimaryButton>

      <a
        href="#/forgot-password"
        className="inline-flex w-full items-center justify-center gap-1.5 pt-1 text-sm font-semibold text-muted transition-colors hover:text-brand"
      >
        Resend a new code
      </a>
    </form>
  );
}

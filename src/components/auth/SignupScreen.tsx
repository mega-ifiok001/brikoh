"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { isValidEmail } from "@/lib/auth";
import { getBusiness } from "@/lib/business";
import {
  TextInput,
  PasswordInput,
  PrimaryButton,
  SocialButtons,
  Divider,
  AlertBox,
  SuccessPanel,
} from "./AuthUI";
import { Mail, Lock, User } from "@/components/icons";

export default function SignupScreen() {
  const { signUp } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [terms, setTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [socialNote, setSocialNote] = useState("");
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSocialNote("");

    if (name.trim().length < 2) {
      setError("Please enter your full name.");
      return;
    }
    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
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
    if (!terms) {
      setError("Please accept the Terms of Service to continue.");
      return;
    }

    setLoading(true);
    try {
      const user = await signUp(name, email, password);
      setDone(true);
      sessionStorage.setItem("brikoh_just_authed", user.name);
      setTimeout(() => {
        window.location.hash = getBusiness(user.email) ? "/dashboard" : "/onboarding";
      }, 900);
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  if (done) {
    return (
      <SuccessPanel
        title="Your account is ready! 🎉"
        subtitle="Welcome to Brikoh. We're taking you to your new workspace…"
      />
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {error && <AlertBox>{error}</AlertBox>}

      <TextInput
        label="Full name"
        icon={<User className="h-5 w-5" />}
        placeholder="Amara Obi"
        autoComplete="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <TextInput
        label="Email address"
        type="email"
        icon={<Mail className="h-5 w-5" />}
        placeholder="you@business.com"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <PasswordInput
        label="Password"
        icon={<Lock className="h-5 w-5" />}
        placeholder="Min. 8 characters"
        autoComplete="new-password"
        withMeter
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <PasswordInput
        label="Confirm password"
        icon={<Lock className="h-5 w-5" />}
        placeholder="Re-enter your password"
        autoComplete="new-password"
        error={
          confirm.length > 0 && password !== confirm ? "Passwords do not match." : undefined
        }
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
      />

      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={terms}
          onChange={(e) => setTerms(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded accent-brand"
        />
        <span className="text-sm leading-relaxed text-muted">
          I agree to Brikoh's{" "}
          <a href="#/" className="font-semibold text-brand hover:underline">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="#/" className="font-semibold text-brand hover:underline">
            Privacy Policy
          </a>
          .
        </span>
      </label>

      <PrimaryButton loading={loading}>Create my free account</PrimaryButton>

      <div>
        <Divider label="or sign up with" />
        <div className="mt-5">
          <SocialButtons
            onGoogle={() => setSocialNote("Google sign-in is coming soon — use email for now.")}
            onApple={() => setSocialNote("Apple sign-in is coming soon — use email for now.")}
          />
        </div>
        {socialNote && (
          <p className="mt-3 rounded-lg bg-cream px-3 py-2 text-center text-xs text-muted">
            {socialNote}
          </p>
        )}
      </div>

      <p className="pt-2 text-center text-sm text-muted">
        Already have an account?{" "}
        <a href="#/login" className="font-bold text-brand hover:text-brand-light">
          Log in
        </a>
      </p>
    </form>
  );
}

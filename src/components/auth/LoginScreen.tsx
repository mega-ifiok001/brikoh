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
  DemoHint,
  SuccessPanel,
} from "./AuthUI";
import { Mail, Lock } from "@/components/icons";

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [socialNote, setSocialNote] = useState("");
  const [done, setDone] = useState(false);

  const fillDemo = () => {
    setEmail("demo@brikoh.app");
    setPassword("demo1234");
    setError("");
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSocialNote("");
    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }
    setLoading(true);
    try {
      const user = await login(email, password);
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
        title="Welcome back!"
        subtitle="You're signed in. Taking you to your workspace…"
      />
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

      <div>
        <PasswordInput
          label="Password"
          icon={<Lock className="h-5 w-5" />}
          placeholder="••••••••"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div className="mt-2.5 flex items-center justify-between">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 rounded accent-pine"
            />
            Remember me
          </label>
          <a href="#/forgot-password" className="text-sm font-semibold text-brand hover:text-brand-light">
            Forgot password?
          </a>
        </div>
      </div>

      <PrimaryButton loading={loading}>Log in</PrimaryButton>

      <div>
        <Divider />
        <div className="mt-5">
          <SocialButtons
            onGoogle={() =>
              setSocialNote("Google sign-in is coming soon — use email or the demo account for now.")
            }
            onApple={() =>
              setSocialNote("Apple sign-in is coming soon — use email or the demo account for now.")
            }
          />
        </div>
        {socialNote && (
          <p className="mt-3 rounded-lg bg-cream px-3 py-2 text-center text-xs text-muted">
            {socialNote}
          </p>
        )}
      </div>

      <DemoHint>
        <span className="font-semibold">Try the demo:</span> demo@brikoh.app · demo1234{" "}
        <button type="button" onClick={fillDemo} className="ml-1 font-bold text-brand underline underline-offset-2">
          Autofill
        </button>
      </DemoHint>

      <p className="pt-2 text-center text-sm text-muted">
        New to Brikoh?{" "}
        <a href="#/signup" className="font-bold text-brand hover:text-brand-light">
          Create a free account
        </a>
      </p>
    </form>
  );
}

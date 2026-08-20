"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/api/types";
import { TextInput, PasswordInput, PrimaryButton, AlertBox, SuccessPanel } from "./AuthUI";
import { Lock, Ticket } from "@/components/icons";

export default function AcceptInviteScreen() {
  const { acceptInvite } = useAuth();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (token.trim().length < 6) { setError("Enter your invite token (inv_…)."); return; }
    if (password.length < 8 || !/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
      setError("Password must be at least 8 characters with at least one letter and one digit.");
      return;
    }
    setLoading(true);
    try {
      await acceptInvite(token.trim(), password);
      setDone(true);
      setTimeout(() => (window.location.hash = "/dashboard"), 800);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "This invite is broken or expired — ask the owner to resend.");
      setLoading(false);
    }
  }

  if (done) return <SuccessPanel title="Invite accepted! 🎉" subtitle="You now have access to the store workspace." />;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {error && <AlertBox>{error}</AlertBox>}
      <TextInput
        label="Invite token" icon={<Ticket className="h-5 w-5" />}
        placeholder="Paste the token from your invite email (inv_…)" value={token}
        onChange={(e) => setToken(e.target.value)}
      />
      <PasswordInput
        label="Set a password" icon={<Lock className="h-5 w-5" />}
        placeholder="Min 8 chars, letters + digits" autoComplete="new-password" value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <PrimaryButton loading={loading}>Accept invite</PrimaryButton>
      <p className="pt-2 text-center text-sm text-muted">
        Have an account?{" "}
        <a href="#/login" className="font-bold text-brand hover:text-brand-light">Log in</a>
      </p>
    </form>
  );
}

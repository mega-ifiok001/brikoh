"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/api/types";
import { PrimaryButton, AlertBox, SuccessPanel } from "./AuthUI";
import { CheckCircle } from "@/components/icons";

export default function VerifyEmailScreen() {
  const { verifyEmail, resendVerification } = useAuth();
  const [token, setToken] = useState("");
  const [state, setState] = useState<"idle" | "working" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const [resent, setResent] = useState(false);

  // Pull token from the email link: #/verify?token=vrf_...
  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.split("?")[1] ?? "");
    const t = params.get("token");
    if (t) setToken(t);
  }, []);

  const run = async () => {
    if (!token.trim()) { setError("Enter the verification token from your email (vrf_…)."); return; }
    setState("working"); setError("");
    try {
      await verifyEmail(token.trim());
      setState("done");
    } catch (e) {
      setState("error");
      setError(e instanceof ApiError ? e.message : (e as Error).message);
    }
  };

  const resend = async () => {
    try { await resendVerification(); setResent(true); setError(""); } catch (e) { setError((e as Error).message); }
  };

  if (state === "done") {
    return (
      <SuccessPanel
        title="Email verified! ✅"
        subtitle="Your account is verified. You can now set up your business."
      >
        <a href="#/onboarding" className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-br from-brand-light to-brand py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand/25">
          Continue to onboarding
        </a>
      </SuccessPanel>
    );
  }

  return (
    <div className="space-y-5">
      {error && <AlertBox>{error}</AlertBox>}
      <div className="rounded-2xl border border-dashed border-pine/40 bg-pine/[0.06] px-4 py-4 text-sm text-forest">
        <p className="flex items-center gap-2 font-bold"><CheckCircle className="h-4 w-4 text-leaf" /> Verification required before onboarding</p>
        <p className="mt-1 text-xs text-muted">
          Paste the single-use token from your verification email (link: <span className="font-mono">/verify?token=vrf_…</span>).
        </p>
      </div>
      <input
        value={token}
        onChange={(e) => setToken(e.target.value)}
        placeholder="vrf_… token"
        className="w-full rounded-xl border border-ink/10 bg-white px-4 py-3.5 font-mono text-[15px] text-ink outline-none focus:border-brand focus:ring-4 focus:ring-brand/10"
      />
      <PrimaryButton loading={state === "working"} onClick={run}>Verify email</PrimaryButton>
      <button onClick={resend} disabled={resent} className="w-full text-center text-sm font-semibold text-brand hover:text-brand-light disabled:opacity-50">
        {resent ? "Verification email re-sent ✓ (max 1 per 60s)" : "Resend verification email"}
      </button>
    </div>
  );
}

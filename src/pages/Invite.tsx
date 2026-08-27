// src/pages/Invite.tsx
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import {
  Button,
  ErrorState,
  Field,
  Input,
  toast,
} from "../components/ui";

type InviteStatus = "checking" | "valid" | "invalid" | "expired";

const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export default function Invite() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { acceptInvite } = useAuth();

  const token = searchParams.get("token") || "";

  const [status, setStatus] = useState<InviteStatus>("checking");
  const [invite, setInvite] = useState<{
    email: string;
    storeName: string;
    role: string;
    inviterEmail: string;
  } | null>(null);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ---------- Verify token on load ----------
  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }

    const verify = async () => {
      try {
        const res = await api.get(`/api/public/auth/invite/${encodeURIComponent(token)}`);
        setInvite({
          email: res.email,
          storeName: res.storeName,
          role: res.role,
          inviterEmail: res.inviterEmail,
        });
        setStatus("valid");
      } catch (e: any) {
        setStatus(e?.code === "INVITE_EXPIRED" ? "expired" : "invalid");
      }
    };

    verify();
  }, [token]);

  // ---------- Submit ----------
  const handleAccept = async () => {
    if (!PASSWORD_RULE.test(password)) {
      toast.error("Password must be at least 8 characters, with a letter and a number.");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords don't match.");
      return;
    }

    setSubmitting(true);
    try {
      const me = await acceptInvite(token, password);
      toast.success(`Welcome to ${me.store?.name || "the team"}!`);
      navigate("/dashboard");
    } catch (e: any) {
      if (e?.code === "INVITE_EXPIRED") {
        setStatus("expired");
      } else if (e?.code === "INVITE_INVALID") {
        setStatus("invalid");
      } else {
        toast.error(e?.message || "Couldn't set your password.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ---------- Render ----------
  if (status === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="skeleton h-40 w-full max-w-sm" />
      </div>
    );
  }

  if (status === "invalid" || status === "expired") {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="card max-w-sm p-6">
          <ErrorState
            message={
              status === "expired"
                ? "This invite link has expired. Ask the store owner to resend it."
                : "This invite link is broken or has already been used. Ask the store owner to resend it."
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="card w-full max-w-sm p-6">
        <h2 className="font-display text-lg font-extrabold">Join {invite?.storeName}</h2>
        <p className="mt-1 text-sm text-ink-400">
          {invite?.inviterEmail} invited you to join as{" "}
          <span className="font-bold">{invite?.role?.toLowerCase()}</span>. Set a password for{" "}
          <span className="font-bold">{invite?.email}</span> to get started.
        </p>

        <div className="mt-5 space-y-3">
          <Field label="Password">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="8+ chars, letters and numbers"
            />
          </Field>
          <Field label="Confirm password">
            <Input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Re-enter your password"
            />
          </Field>
          <Button className="w-full" loading={submitting} onClick={handleAccept}>
            Set password & join
          </Button>
        </div>
      </div>
    </div>
  );
}
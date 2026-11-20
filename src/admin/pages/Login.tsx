import { useState, type FormEvent } from "react";
import { Button, Field, Icon, Input } from "../../components/ui";
import { errMsg } from "../lib/adminApi";
import { useAdmin } from "../AdminContext";

export default function Login() {
  const { signIn } = useAdmin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totp, setTotp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (totp.length !== 6) {
      setError("Enter the 6-digit code from your authenticator app.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await signIn(email.trim(), password, totp);
    } catch (err) {
      setError(errMsg(err, "Couldn't sign in."));
      setTotp("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream-50 px-4 py-10">
      <div className="w-full max-w-[400px]">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink-900 text-brand-500">
            <Icon name="shield" size={24} />
          </span>
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight">Brikoh Admin</h1>
          <p className="mt-1 text-sm text-ink-400">Platform staff only. Every session requires two-factor.</p>
        </div>

        <form onSubmit={submit} className="card anim-rise space-y-4 p-5">
          <Field label="Email">
            <Input
              type="email"
              autoComplete="username"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@brikoh.com"
            />
          </Field>
          <Field label="Password">
            <Input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          <Field label="Authenticator code" hint="6-digit code from your authenticator app">
            <Input
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              value={totp}
              onChange={(e) => setTotp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              className="text-center font-mono text-lg tracking-[0.4em]"
            />
          </Field>

          {error && (
            <p className="flex items-start gap-2 rounded-lg bg-danger-100 px-3 py-2 text-sm font-semibold text-danger-700">
              <Icon name="alert" size={15} className="mt-0.5" />
              {error}
            </p>
          )}

          <Button type="submit" size="lg" className="w-full" loading={busy}>
            Sign in
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-ink-400">
          Lost your authenticator? A SUPER ADMIN can reset your 2FA.
        </p>
      </div>
    </div>
  );
}
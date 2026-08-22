import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api, extractTokens, setTokens } from "../lib/api";
import { Button, Field, Icon, Input, toast } from "../components/ui";

const HERO_IMG =
  "https://images.pexels.com/photos/28641901/pexels-photo-28641901.jpeg?auto=compress&cs=tinysrgb&dpr=1&fit=crop&h=1200&w=900";

// Module-level (not component-level) set of tokens we've already tried to
// verify. React 18 StrictMode mounts, unmounts, and remounts components in
// dev, which resets any `useRef` guard inside the component — but this Set
// lives outside the component and survives that remount, so a single token
// only ever gets submitted once per page load, even in StrictMode.
const verifiedTokens = new Set<string>();

function AuthShell({ children, headline, sub }: { children: ReactNode; headline: string; sub: string }) {
  return (
    <div className="flex min-h-screen bg-cream-50">
      <div className="relative hidden w-[42%] overflow-hidden lg:block">
        <img src={HERO_IMG} alt="A vibrant open-air market" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-900/85 via-ink-900/35 to-ink-900/20" />
        <div className="absolute inset-0 flex flex-col justify-between p-10">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-white">
              <Icon name="logo" size={24} />
            </span>
            <span className="font-display text-2xl font-extrabold tracking-tight text-cream-50">brikoh</span>
          </Link>
          <div>
            <h2 className="max-w-sm font-display text-4xl font-extrabold leading-tight text-cream-50">
              One dashboard. Every customer. Every kobo.
            </h2>
            <p className="mt-3 max-w-sm text-sm font-semibold text-cream-100/80">
              Join the market sellers running their whole business on Brikoh — from POS to payouts.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
        <div className="anim-rise w-full max-w-md">
          <Link to="/" className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-white">
              <Icon name="logo" size={22} />
            </span>
            <span className="font-display text-xl font-extrabold tracking-tight">brikoh</span>
          </Link>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">{headline}</h1>
          <p className="mt-1.5 text-sm text-ink-400">{sub}</p>
          <div className="card mt-7 p-6">{children}</div>
          <p className="mt-6 text-center text-xs font-semibold text-ink-300">
            Your data stays in your store. Sign in with email &amp; password.
          </p>
        </div>
      </div>
    </div>
  );
}

function ErrorBanner({ msg }: { msg: string }) {
  if (!msg) return null;
  return (
    <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-danger-100 bg-danger-100/60 px-3.5 py-3 text-sm font-semibold text-danger-700">
      <Icon name="alert" size={16} className="mt-0.5 shrink-0" />
      {msg}
    </div>
  );
}

/* ------------------------------- Login / Register ------------------------------ */

export function AuthPage() {
  const [params] = useSearchParams();
  const [mode, setMode] = useState<"login" | "register">(params.get("mode") === "register" ? "register" : "login");
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [confirm, setConfirm] = useState("");

  const afterAuth = (me: any) => {
    if (!me?.account?.emailVerifiedAt) navigate("/verify");
    else if (!me?.store?.id) navigate("/onboarding");
    else navigate("/dashboard");
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Enter a valid email address.");
    if (!password) return setError("Enter your password.");
    if (mode === "register") {
      if (!firstName.trim() || !lastName.trim()) return setError("First and last name are required.");
      if (password.length < 8) return setError("Password must be at least 8 characters.");
      if (password !== confirm) return setError("Passwords don't match.");
    }
    setBusy(true);
    try {
      if (mode === "login") {
        const me = await login(email, password);
        toast.success("Welcome back.");
        afterAuth(me);
      } else {
        const me = await register({ email, password, confirmPassword: confirm, firstName: firstName.trim(), lastName: lastName.trim(), phone: phone.trim() || undefined });
        toast.success("Account created — check your inbox.");
        navigate(`/verify?email=${encodeURIComponent(email)}`);
        void me;
      }
    } catch (err: any) {
      setError(err?.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      headline={mode === "login" ? "Welcome back" : "Open your store"}
      sub={
        mode === "login"
          ? "Sign in to run your market, take sales and chase the money in."
          : "Free to start. Your storefront, POS and wallet are one form away."
      }
    >
      <div className="mb-5 grid grid-cols-2 rounded-xl bg-cream-100 p-1 text-sm font-extrabold">
        {(["login", "register"] as const).map((m) => (
          <button
            key={m}
            onClick={() => {
              setMode(m);
              setError("");
            }}
            className={`rounded-lg py-2 transition-colors ${mode === m ? "bg-white text-ink-900 shadow-sm" : "text-ink-400 hover:text-ink-700"}`}
          >
            {m === "login" ? "Sign in" : "Create account"}
          </button>
        ))}
      </div>

      <ErrorBanner msg={error} />

      <form onSubmit={submit} className="space-y-4">
        {mode === "register" && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="First name">
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Adaeze" autoComplete="given-name" required />
            </Field>
            <Field label="Last name">
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Okafor" autoComplete="family-name" required />
            </Field>
          </div>
        )}
        <Field label="Email">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@store.com" autoComplete="email" required />
        </Field>
        {mode === "register" && (
          <Field label="Phone" hint="Shown to customers on your storefront.">
            <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+234 800 000 0000" autoComplete="tel" />
          </Field>
        )}
        <Field label="Password">
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === "register" ? "At least 8 characters" : "Your password"}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
          />
        </Field>
        {mode === "register" && (
          <Field label="Confirm password">
            <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Same password again" autoComplete="new-password" required />
          </Field>
        )}
        <Button type="submit" size="lg" loading={busy} className="w-full">
          {mode === "login" ? "Sign in" : "Create account"}
        </Button>
      </form>

      {mode === "login" && (
        <p className="mt-4 text-center text-sm text-ink-400">
          New here?{" "}
          <button className="font-bold text-brand-600 hover:underline" onClick={() => setMode("register")}>
            Create an account
          </button>
        </p>
      )}
    </AuthShell>
  );
}

/* ------------------------------------ Verify ---------------------------------- */

export function VerifyPage() {
  const [params] = useSearchParams();
  const { me, isAuthed, verifyEmail, resendVerification } = useAuth();
  const navigate = useNavigate();
  const email = params.get("email") || me?.account?.email || "";

  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const handleVerify = async (t: string) => {
    if (!t.trim()) return setError("Paste the token from your email first.");
    setBusy(true);
    setError("");
    try {
      const me2 = await verifyEmail(t.trim());
      setDone(true);
      toast.success("Email verified.");
      setTimeout(
        () => navigate(me2?.store?.id ? "/dashboard" : "/onboarding", { replace: true }),
        700
      );
    } catch (e: any) {
      setError(e?.message || "That token didn't work.");
      setDone(false);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    const t = params.get("token");
    // Guard against React 18 StrictMode's dev-only mount → unmount →
    // remount cycle firing this effect (and the verify request) twice
    // for the same token. A useRef guard resets on remount because it's
    // instance state; this module-level Set does not.
    if (t && !verifiedTokens.has(t)) {
      verifiedTokens.add(t);
      setToken(t);
      handleVerify(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const resend = async () => {
    try {
      await resendVerification();
      toast.success("Verification email sent.");
      setCooldown(30);
    } catch (e: any) {
      toast.error(e?.message || "Couldn't resend the email.");
    }
  };

  return (
    <AuthShell
      headline={done ? "Verified" : "Verify your email"}
      sub={
        email
          ? `We sent a verification token to ${email}.`
          : "Paste the verification token from your email."
      }
    >
      {done ? (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-leaf-100 text-leaf-700">
            <Icon name="check" size={26} strokeWidth={2.6} />
          </span>
          <p className="font-display text-xl font-extrabold">You're verified</p>
          <p className="text-sm text-ink-400">Taking you to your store…</p>
        </div>
      ) : (
        <>
          <ErrorBanner msg={error} />
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleVerify(token);
            }}
            className="space-y-4"
          >
            <Field label="Verification token">
              <Input
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste the token from your email"
                className="text-center font-mono tracking-widest"
              />
            </Field>
            <Button type="submit" size="lg" loading={busy} className="w-full" disabled={!isAuthed && !email && !token}>
              Verify email
            </Button>
          </form>
          <div className="mt-4 flex items-center justify-between text-sm">
            <button
              onClick={resend}
              disabled={cooldown > 0}
              className="font-bold text-brand-600 hover:underline disabled:opacity-50"
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend email"}
            </button>
            <Link to="/auth" className="font-bold text-ink-400 hover:text-ink-700">
              Back to sign in
            </Link>
          </div>
        </>
      )}
    </AuthShell>
  );
}

/* --------------------------------- Accept invite ------------------------------ */

export function AcceptInvitePage() {
  const [params] = useSearchParams();
  const token = params.get("token") || params.get("invite") || "";
  const invEmail = params.get("email") || "";
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!token) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-cream-50 px-6 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-danger-100 text-danger-500">
          <Icon name="alert" size={24} />
        </span>
        <h1 className="font-display text-2xl font-extrabold">This invite link is incomplete</h1>
        <p className="max-w-sm text-sm text-ink-400">
          Ask the store owner to send you the full invitation link again.
        </p>
        <Link to="/" className="mt-2 text-sm font-bold text-brand-600 hover:underline">
          Go to brikoh.com
        </Link>
      </div>
    );
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("Passwords don't match.");
    setBusy(true);
    try {
      const res = await api.publicPost("/api/public/auth/accept-invite", {
        token,
        password,
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        email: invEmail || undefined,
      });
      const t = extractTokens(res);
      if (t.at) {
        setTokens(t.at, t.rt);
        toast.success("Invite accepted. Signing you in…");
        window.location.hash = "#/dashboard";
        window.location.reload();
        return;
      }
      toast.info("Invite accepted. Sign in with your new password.");
      navigate("/auth");
    } catch (err: any) {
      setError(err?.message || "Couldn't accept the invite.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell headline="Join the team" sub={`You've been invited to ${invEmail ? "the store that owns " + invEmail : "a Brikoh store"}.`}>
      <ErrorBanner msg={error} />
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name">
            <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First" />
          </Field>
          <Field label="Last name">
            <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last" />
          </Field>
        </div>
        <Field label="Choose a password">
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" autoComplete="new-password" required />
        </Field>
        <Field label="Confirm password">
          <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Same password again" autoComplete="new-password" required />
        </Field>
        <Button type="submit" size="lg" loading={busy} className="w-full">
          Accept invite &amp; sign in
        </Button>
      </form>
    </AuthShell>
  );
}
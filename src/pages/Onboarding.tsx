import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { slugify } from "../lib/format";
import { Button, Field, Icon, Input, Select, toast } from "../components/ui";
import { VerifyPage } from "./AuthPages";

const BUSINESS_TYPES = [
  "RETAIL",
  "FOOD_AND_BEVERAGE",
  "FASHION_AND_WEARABLES",
  "HEALTH_AND_BEAUTY",
  "ELECTRONICS",
  "PROFESSIONAL_SERVICES",
  "AGRICULTURE",
  "OTHER",
];

const CURRENCIES = ["NGN", "USD", "GHS", "KES", "ZAR"];

function labelOf(v: string) {
  return v.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function Onboarding() {
  const { me, isOnboarded, isVerified, refresh } = useAuth();
  const navigate = useNavigate();

  const [storeName, setStoreName] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [subTouched, setSubTouched] = useState(false);
  const [businessType, setBusinessType] = useState("RETAIL");
  const [location, setLocation] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [currency, setCurrency] = useState("NGN");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (isOnboarded) return <Navigate to="/dashboard" replace />;
  if (!isVerified) return <VerifyPage />;

  const effectiveSub = subTouched ? subdomain : slugify(storeName);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (storeName.trim().length < 2) return setError("Give your store a name (at least 2 characters).");
    if (!location.trim()) return setError("Where is your store? A town or city is enough.");
    if (!businessPhone.trim()) return setError("Add the phone number customers can reach you on.");
    setBusy(true);
    try {
     await api.post("/api/dashboard/onboarding", {
  name: storeName.trim(),
  businessType,
  location: location.trim(),
  businessPhone: businessPhone.trim(),
  currency,
});
      toast.success(`Welcome to Brikoh, ${storeName.trim()}!`);
      await refresh();
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      if (err?.code === "VERIFICATION_REQUIRED") {
        toast.error("Verify your email first.");
        navigate("/verify");
        return;
      }
      if (err?.status === 409) {
        // Might already be onboarded (e.g. retry) — try to recover.
        await refresh();
        navigate("/dashboard");
        return;
      }
      setError(err?.message || "Couldn't create the store.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream-50 px-4 py-10">
      <div className="anim-rise w-full max-w-xl">
        <div className="mb-8 flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-white">
            <Icon name="logo" size={24} />
          </span>
          <span className="font-display text-2xl font-extrabold tracking-tight">brikoh</span>
        </div>

        <div className="mb-6">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-brand-600">
            Almost there
          </p>
          <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight">Set up your store</h1>
          <p className="mt-1.5 text-sm text-ink-400">
            Hi {me?.account?.firstName || "there"} — this takes a minute. You can change most of
            this later in Settings.
          </p>
        </div>

        <form onSubmit={submit} className="card space-y-5 p-6">
          {error && (
            <div className="flex items-start gap-2.5 rounded-xl border border-danger-100 bg-danger-100/60 px-3.5 py-3 text-sm font-semibold text-danger-700">
              <Icon name="alert" size={16} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <Field label="Store name">
            <Input
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="e.g. Adaeze's General Store"
              autoFocus
            />
          </Field>

          <Field
            label="Your storefront address"
            hint="Customers will shop at this address. Pick something short and memorable."
          >
            <div className="flex items-stretch">
              <Input
                value={effectiveSub}
                onChange={(e) => {
                  setSubTouched(true);
                  setSubdomain(slugify(e.target.value));
                }}
                placeholder="ojamarket"
                className="rounded-r-none font-mono"
              />
              <span className="flex items-center whitespace-nowrap rounded-r-[10px] border border-l-0 border-cream-300 bg-cream-100 px-3 text-sm font-bold text-ink-500">
                .brikoh.com
              </span>
            </div>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="What kind of business is it?">
              <Select value={businessType} onChange={(e) => setBusinessType(e.target.value)}>
                {BUSINESS_TYPES.map((b) => (
                  <option key={b} value={b}>
                    {labelOf(b)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Currency">
              <Select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c === "NGN" ? "NGN — Nigerian Naira" : c}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label="Location">
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Lagos, Nigeria"
            />
          </Field>

          <Field label="Business phone">
            <Input
              value={businessPhone}
              onChange={(e) => setBusinessPhone(e.target.value)}
              placeholder="+234 800 000 0000"
              type="tel"
            />
          </Field>

          <div className="rounded-xl bg-cream-100 px-4 py-3 text-xs font-semibold leading-relaxed text-ink-500">
            We'll create your main branch so stock can start moving, and give your store its own
            checkout page on Brikoh. No card, no fees to get started.
          </div>

          <Button type="submit" size="lg" loading={busy} className="w-full">
            Create my store
          </Button>
        </form>
      </div>
    </div>
  );
}

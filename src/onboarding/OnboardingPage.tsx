"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { ApiError, type BusinessType, type Currency } from "@/api/types";
import { Logo } from "@/components/ui";
import { ArrowRight, Globe, Storefront, Coins } from "@/components/icons";

const input = "w-full rounded-xl border border-ink/10 bg-white px-4 py-3.5 text-[15px] text-ink outline-none transition-all focus:border-brand focus:ring-4 focus:ring-brand/10";

const BUSINESS_TYPES: { id: BusinessType; label: string; emoji: string }[] = [
  { id: "RETAIL", label: "Retail", emoji: "🛍️" },
  { id: "FOOD_AND_BEVERAGE", label: "Food & Beverage", emoji: "🍔" },
  { id: "FASHION_AND_WEARABLES", label: "Fashion & Wearables", emoji: "👗" },
  { id: "HEALTH_AND_BEAUTY", label: "Health & Beauty", emoji: "💄" },
  { id: "ELECTRONICS", label: "Electronics", emoji: "📱" },
  { id: "PROFESSIONAL_SERVICES", label: "Professional Services", emoji: "💼" },
  { id: "AGRICULTURE", label: "Agriculture", emoji: "🌱" },
  { id: "OTHER", label: "Other", emoji: "✨" },
];

const CURRENCIES: Currency[] = ["NGN", "USD", "GHS", "KES", "ZAR"];

export default function OnboardingPage() {
  const { user, completeOnboarding } = useAuth();
  const [name, setName] = useState("");
  const [businessType, setBusinessType] = useState<BusinessType | "">("");
  const [location, setLocation] = useState("");
  const [currency, setCurrency] = useState<Currency>("NGN");
  const [businessPhone, setBusinessPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!user) { window.location.hash = "/login"; return null; }
  if (!user.needsOnboarding) { window.location.hash = "/dashboard"; return null; }

  // Verification gate (contract: 403 VERIFICATION_REQUIRED if not verified)
  if (!user.verified) {
    return (
      <div className="grid min-h-screen place-items-center bg-cream p-6">
        <div className="w-full max-w-sm rounded-3xl border border-ink/5 bg-white p-8 text-center shadow-xl shadow-forest/5">
          <span className="text-4xl">✉️</span>
          <h1 className="mt-4 font-display text-2xl font-extrabold text-ink">Verify your email first</h1>
          <p className="mt-2 text-sm text-muted">
            We emailed a verification link to <span className="font-bold text-ink">{user.email}</span>. Open it, or verify here with your token.
          </p>
          <a href="#/verify" className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-gradient-to-br from-brand-light to-brand py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand/25">
            Go to verification
          </a>
        </div>
      </div>
    );
  }

  const submit = async () => {
    setError("");
    if (name.trim().length < 1) return setError("Enter your business name.");
    if (!businessType) return setError("Select your business type.");
    if (location.trim().length < 2) return setError("Enter your location (e.g. Lagos, Nigeria).");
    if (businessPhone.replace(/\D/g, "").length < 7) return setError("Enter a valid business phone number.");

    setLoading(true);
    try {
      await completeOnboarding({
        name: name.trim(),
        businessType,
        location: location.trim(),
        currency,
        businessPhone: businessPhone.trim(),
        // templateId is optional — server defaults to first STARTER template
      });
      window.location.hash = "/dashboard";
    } catch (e) {
      setError(e instanceof ApiError ? e.message : (e as Error).message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-ink/5 bg-white/70 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-5 py-4">
          <a href="#/" className="inline-block"><Logo /></a>
          <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-bold text-brand">Set up your store</span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-5 pb-20 pt-10">
        <div className="rounded-3xl border border-ink/5 bg-white p-7 shadow-xl shadow-forest/5 sm:p-10">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand/10 text-brand"><Storefront className="h-7 w-7" /></span>
          <h1 className="mt-5 font-display text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">Set up your business</h1>
          <p className="mt-2 text-[15px] text-muted">
            This creates your Store and Owner record. Your subdomain is auto-generated from the store name.
          </p>

          {error && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

          <div className="mt-8 space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ink">Business name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Amara & Co." className={input} />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-ink">Business type</label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {BUSINESS_TYPES.map((t) => (
                  <button key={t.id} onClick={() => setBusinessType(t.id)} className={`rounded-2xl border-2 p-3 text-center transition-all ${businessType === t.id ? "border-brand bg-brand/[0.06]" : "border-ink/8 hover:border-brand/40"}`}>
                    <span className="text-xl">{t.emoji}</span>
                    <p className="mt-1 text-[11px] font-bold text-ink">{t.label}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-ink">Location</label>
                <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Lagos, Nigeria" className={input} />
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-ink"><Coins className="h-4 w-4 text-pine" /> Currency</label>
                <select value={currency} onChange={(e) => setCurrency(e.target.value as Currency)} className={input}>
                  {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-semibold text-ink">Business phone</label>
                <input type="tel" value={businessPhone} onChange={(e) => setBusinessPhone(e.target.value)} placeholder="+234 800 123 4567" className={input} />
              </div>
            </div>

            <div className="rounded-2xl bg-cream p-4">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-pine" />
                <p className="text-sm font-bold text-ink">Your website is created automatically</p>
              </div>
              <p className="mt-1.5 text-xs text-muted">
                The server derives your subdomain from the store name (e.g. <span className="font-mono font-bold text-forest">{name.trim() ? name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-") : "ades-boutique"}.brikoh.app</span>). You can customise the template later in the Website Studio.
              </p>
            </div>
          </div>

          <button
            onClick={submit}
            disabled={loading}
            className="mt-9 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-br from-brand-light to-brand py-4 text-[15px] font-semibold text-white shadow-lg shadow-brand/25 transition-transform hover:-translate-y-0.5 disabled:opacity-70"
          >
            {loading ? (
              <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Creating your store…</>
            ) : (
              <>Create my store <ArrowRight className="h-4 w-4" /></>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import type { BusinessProfile } from "@/lib/business";
import { CURRENCY_SYMBOLS } from "@/lib/business";
import { TEMPLATES } from "@/website/templates";
import { Logo } from "@/components/ui";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle,
  Storefront,
  Sparkles,
  MapPin,
  Coins,
  Globe,
} from "@/components/icons";

const CATEGORIES = [
  { id: "fashion", label: "Fashion & Apparel", emoji: "👗" },
  { id: "food", label: "Food & Drinks", emoji: "🍔" },
  { id: "beauty", label: "Beauty & Skincare", emoji: "💄" },
  { id: "electronics", label: "Electronics & Gadgets", emoji: "📱" },
  { id: "home", label: "Home & Living", emoji: "🏠" },
  { id: "health", label: "Health & Fitness", emoji: "💪" },
  { id: "services", label: "Services", emoji: "💼" },
  { id: "other", label: "Other", emoji: "✨" },
];

const COUNTRIES = ["Nigeria", "Ghana", "Kenya", "South Africa", "Egypt", "Uganda", "Tanzania", "Other"];

const CURRENCIES = [
  { code: "NGN", symbol: "₦", label: "Nigerian Naira" },
  { code: "USD", symbol: "$", label: "US Dollar" },
  { code: "GHS", symbol: "GH₵", label: "Ghanaian Cedi" },
  { code: "KES", symbol: "KSh", label: "Kenyan Shilling" },
  { code: "ZAR", symbol: "R", label: "South African Rand" },
  { code: "GBP", symbol: "£", label: "British Pound" },
  { code: "EUR", symbol: "€", label: "Euro" },
];

const STEPS = [
  { label: "Business name", icon: <Storefront className="h-4 w-4" /> },
  { label: "What you sell", icon: <Sparkles className="h-4 w-4" /> },
  { label: "Location", icon: <MapPin className="h-4 w-4" /> },
  { label: "Money settings", icon: <Coins className="h-4 w-4" /> },
  { label: "Free website", icon: <Globe className="h-4 w-4" /> },
];

export default function OnboardingPage() {
  const { user, business, saveBusinessProfile } = useAuth();

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [otherCategory, setOtherCategory] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [currency, setCurrency] = useState("NGN");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [storeName, setStoreName] = useState("");
  const [template, setTemplate] = useState("classic");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  // Guards: must be logged in; skip straight to dashboard if already set up.
  useEffect(() => {
    if (!user) {
      window.location.hash = "/login";
    } else if (business) {
      window.location.hash = "/dashboard";
    }
  }, [user, business]);

  if (!user || business) return null;

  const slug = (storeName.trim() || name.trim() || "my-business")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const finish = () => {
    const tpl = TEMPLATES.find((t) => t.id === template) ?? TEMPLATES[0];
    const profile: BusinessProfile = {
      name: name.trim(),
      category: category === "other" ? otherCategory.trim() : category,
      country,
      city: city.trim(),
      currency,
      phone: phone.trim(),
      whatsapp: whatsapp.trim() || phone.trim(),
      wantsWebsite: true,
      websiteLive: true,
      websiteName: slug,
      template: tpl.id,
      accent: tpl.accent,
      heroTitle: `${name.trim()} — handcrafted with love`,
      heroSubtitle: "Explore our collection and order today — we deliver nationwide.",
      tagline: "Fresh arrivals every week",
      createdAt: new Date().toISOString(),
    };
    saveBusinessProfile(profile);
    setDone(true);
    setTimeout(() => (window.location.hash = "/dashboard"), 1400);
  };

  const next = () => {
    setError("");
    if (step === 0 && name.trim().length < 2) return setError("Please enter your business name.");
    if (step === 1 && !category) return setError("Please pick what you sell.");
    if (step === 1 && category === "other" && otherCategory.trim().length < 2)
      return setError("Please describe what you sell.");
    if (step === 2) {
      if (!country) return setError("Please select your country.");
      if (city.trim().length < 2) return setError("Please enter your city.");
    }
    if (step === 3) {
      const digits = phone.replace(/\D/g, "");
      if (digits.length < 7 || digits.length > 15)
        return setError("Please enter a valid business phone number.");
      const wa = whatsapp.replace(/\D/g, "");
      if (wa.length < 7 || wa.length > 15)
        return setError("Please enter a valid WhatsApp number — customers will use it to chat with you.");
    }
    if (step === 4) {
      if (storeName.trim().length < 2) return setError("Please enter your store name.");
      return finish();
    }
    setStep((s) => s + 1);
  };

  return (
    <div className="min-h-screen bg-cream">
      {/* top bar */}
      <header className="border-b border-ink/5 bg-white/70 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-5 py-4">
          <a href="#/" className="inline-block">
            <Logo />
          </a>
          <span className="text-sm font-medium text-muted">
            Step {Math.min(step + 1, 5)} of 5
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-5 pb-20 pt-10 sm:pt-14">
        {/* progress */}
        <div className="flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s.label} className="flex-1">
              <div
                className={`h-1.5 rounded-full transition-colors duration-500 ${
                  i <= step ? "bg-gradient-to-r from-brand to-sun" : "bg-ink/10"
                }`}
              />
              <p
                className={`mt-2 hidden text-[11px] font-semibold sm:block ${
                  i === step ? "text-brand" : i < step ? "text-forest" : "text-muted"
                }`}
              >
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* done state */}
        {done ? (
          <div className="mt-16 flex flex-col items-center rounded-3xl border border-ink/5 bg-white px-6 py-16 text-center shadow-xl shadow-forest/5">
            <span className="grid h-20 w-20 animate-pop place-items-center rounded-full bg-leaf/15 text-leaf">
              <CheckCircle className="h-10 w-10" />
            </span>
            <h1 className="mt-6 font-display text-3xl font-extrabold tracking-tight text-ink">
              Your business is set up! 🎉
            </h1>
            <p className="mt-3 max-w-md text-[15px] leading-relaxed text-muted">
              Welcome to your {name.trim()} workspace. We're preparing your dashboard…
            </p>
          </div>
        ) : (
          <div className="mt-10 rounded-3xl border border-ink/5 bg-white p-7 shadow-xl shadow-forest/5 sm:p-10">
            {/* step 1 — business name */}
            {step === 0 && (
              <div>
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand/10 text-brand">
                  <Storefront className="h-7 w-7" />
                </span>
                <h1 className="mt-5 font-display text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
                  What's your business called?
                </h1>
                <p className="mt-2 text-[15px] text-muted">
                  This is how customers will know you. You can change it later.
                </p>
                <div className="mt-6">
                  <label className="mb-1.5 block text-sm font-semibold text-ink">Business name</label>
                  <input
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && next()}
                    placeholder="e.g. Amara & Co."
                    className="w-full rounded-xl border border-ink/10 bg-white px-4 py-3.5 text-[15px] text-ink outline-none transition-all placeholder:text-ink/30 focus:border-brand focus:ring-4 focus:ring-brand/10"
                  />
                  {error && <p className="mt-2 text-xs font-medium text-red-500">{error}</p>}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {["Amara & Co.", "Lumé Skincare", "Kente Lane"].map((sug) => (
                      <button
                        key={sug}
                        onClick={() => setName(sug)}
                        className="rounded-full border border-ink/10 bg-cream px-3.5 py-1.5 text-xs font-semibold text-muted transition-colors hover:border-brand hover:text-brand"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* step 2 — category */}
            {step === 1 && (
              <div>
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-pine/10 text-pine">
                  <Sparkles className="h-7 w-7" />
                </span>
                <h1 className="mt-5 font-display text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
                  What do you sell?
                </h1>
                <p className="mt-2 text-[15px] text-muted">
                  Pick the closest match — it helps us tailor your store and insights.
                </p>
                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setCategory(c.id);
                        setError("");
                      }}
                      className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-all ${
                        category === c.id
                          ? "border-brand bg-brand/[0.06] shadow-lg shadow-brand/10"
                          : "border-ink/8 bg-white hover:border-brand/40"
                      }`}
                    >
                      <span className="text-3xl">{c.emoji}</span>
                      <span className="text-center text-xs font-semibold text-ink">{c.label}</span>
                      {category === c.id && (
                        <span className="grid h-5 w-5 place-items-center rounded-full bg-brand text-white">
                          <Check className="h-3 w-3" />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                {category === "other" && (
                  <input
                    autoFocus
                    value={otherCategory}
                    onChange={(e) => setOtherCategory(e.target.value)}
                    placeholder="Describe what you sell…"
                    className="mt-4 w-full rounded-xl border border-ink/10 bg-white px-4 py-3.5 text-[15px] outline-none transition-all focus:border-brand focus:ring-4 focus:ring-brand/10"
                  />
                )}
                {error && <p className="mt-3 text-xs font-medium text-red-500">{error}</p>}
              </div>
            )}

            {/* step 3 — location */}
            {step === 2 && (
              <div>
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand/10 text-brand">
                  <MapPin className="h-7 w-7" />
                </span>
                <h1 className="mt-5 font-display text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
                  Where are you based?
                </h1>
                <p className="mt-2 text-[15px] text-muted">
                  We use this for shipping, taxes and local payment options.
                </p>
                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-ink">Country</label>
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full rounded-xl border border-ink/10 bg-white px-4 py-3.5 text-[15px] text-ink outline-none transition-all focus:border-brand focus:ring-4 focus:ring-brand/10"
                    >
                      <option value="">Select country</option>
                      {COUNTRIES.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-ink">City</label>
                    <input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && next()}
                      placeholder="e.g. Lagos"
                      className="w-full rounded-xl border border-ink/10 bg-white px-4 py-3.5 text-[15px] text-ink outline-none transition-all placeholder:text-ink/30 focus:border-brand focus:ring-4 focus:ring-brand/10"
                    />
                  </div>
                </div>
                {error && <p className="mt-3 text-xs font-medium text-red-500">{error}</p>}
              </div>
            )}

            {/* step 4 — money settings */}
            {step === 3 && (
              <div>
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-pine/10 text-pine">
                  <Coins className="h-7 w-7" />
                </span>
                <h1 className="mt-5 font-display text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
                  Money settings
                </h1>
                <p className="mt-2 text-[15px] text-muted">
                  Choose your currency and the number customers can reach you on.
                </p>
                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-ink">Currency</label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full rounded-xl border border-ink/10 bg-white px-4 py-3.5 text-[15px] text-ink outline-none transition-all focus:border-brand focus:ring-4 focus:ring-brand/10"
                    >
                      {CURRENCIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.symbol} {c.label} ({c.code})
                        </option>
                      ))}
                    </select>
                    <div className="mt-3 flex items-center gap-3 rounded-xl bg-cream px-4 py-3">
                      <span className="font-display text-xl font-extrabold text-forest">
                        {CURRENCY_SYMBOLS[currency]}1,000
                      </span>
                      <span className="text-xs text-muted">Preview of how prices will look</span>
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-ink">
                      Business phone number
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && next()}
                      placeholder="+234 800 123 4567"
                      className="w-full rounded-xl border border-ink/10 bg-white px-4 py-3.5 text-[15px] text-ink outline-none transition-all placeholder:text-ink/30 focus:border-brand focus:ring-4 focus:ring-brand/10"
                    />
                    <p className="mt-2 text-xs text-muted">
                      Used for customer order updates and receipts.
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-ink">
                      WhatsApp number <span className="rounded-full bg-[#25D366]/15 px-2 py-0.5 text-[10px] font-bold text-[#128C4B]">for your website chat button</span>
                    </label>
                    <input
                      type="tel"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && next()}
                      placeholder="+234 800 123 4567"
                      className="w-full rounded-xl border border-ink/10 bg-white px-4 py-3.5 text-[15px] text-ink outline-none transition-all placeholder:text-ink/30 focus:border-brand focus:ring-4 focus:ring-brand/10"
                    />
                    <p className="mt-2 text-xs text-muted">
                      Customers tap the WhatsApp button on your website and chat with you here.
                    </p>
                  </div>
                </div>
                {error && <p className="mt-3 text-xs font-medium text-red-500">{error}</p>}
              </div>
            )}

            {/* step 5 — free website (compulsory) */}
            {step === 4 && (
              <div>
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand/10 text-brand">
                  <Globe className="h-7 w-7" />
                </span>
                <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-forest/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-forest">
                  <Check className="h-3 w-3" /> Required to finish setup
                </div>
                <h1 className="mt-3 font-display text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
                  Create your free website
                </h1>
                <p className="mt-2 text-[15px] text-muted">
                  Every Brikoh business gets a beautiful online store — it's how you sell beyond
                  your counter, accept orders 24/7 and look professional to customers.
                </p>

                <div className="mt-6 rounded-2xl border border-brand/25 bg-brand/[0.04] p-5">
                  <label className="mb-1.5 block text-sm font-semibold text-ink">Your store name</label>
                  <input
                    autoFocus
                    value={storeName}
                    onChange={(e) => {
                      setStoreName(e.target.value);
                      setError("");
                    }}
                    onKeyDown={(e) => e.key === "Enter" && next()}
                    placeholder={name.trim() || "Amara & Co."}
                    className="w-full rounded-xl border border-ink/10 bg-white px-4 py-3.5 text-[15px] text-ink outline-none transition-all placeholder:text-ink/30 focus:border-brand focus:ring-4 focus:ring-brand/10"
                  />
                  <div className="mt-2.5 flex items-center gap-2 rounded-lg bg-white/70 px-3 py-2 text-sm">
                    <Globe className="h-4 w-4 shrink-0 text-pine" />
                    <span className="truncate font-mono font-semibold text-forest">
                      {slug || "your-store"}.brikoh.app
                    </span>
                    <span className="ml-auto shrink-0 rounded-full bg-leaf/15 px-2 py-0.5 text-[10px] font-bold text-leaf">
                      Free forever
                    </span>
                  </div>
                  {error && <p className="mt-2 text-xs font-medium text-red-500">{error}</p>}
                </div>

                {/* template picker */}
                <div className="mt-5">
                  <p className="mb-2 text-sm font-semibold text-ink">
                    Pick a template <span className="text-muted">— you can edit or change it anytime.</span>
                  </p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {TEMPLATES.map((t) => {
                      const selected = template === t.id;
                      return (
                        <button
                          key={t.id}
                          onClick={() => setTemplate(t.id)}
                          className={`overflow-hidden rounded-2xl border-2 text-left transition-all ${
                            selected ? "border-brand shadow-lg shadow-brand/10" : "border-ink/8 hover:border-brand/40"
                          }`}
                        >
                          <span
                            className="grid h-14 place-items-center text-2xl"
                            style={{ background: `linear-gradient(135deg, ${t.swatch[0]}, ${t.swatch[1]})` }}
                          >
                            {t.emoji}
                          </span>
                          <span className="flex items-center justify-between px-3 py-2.5">
                            <span className="text-xs font-bold text-ink">
                              {t.name}
                              <span className="block text-[10px] font-medium text-muted">{t.badge}</span>
                            </span>
                            {selected && <Check className="h-4 w-4 text-brand" />}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <ul className="mt-5 space-y-2.5">
                  {[
                    "Your own link to share anywhere — socials, WhatsApp, flyers",
                    "Products, prices and photos synced automatically from your inventory",
                    "Built-in checkout, so customers can pay and you get notified",
                    "Mobile-friendly storefront in under a minute",
                  ].map((t) => (
                    <li key={t} className="flex items-start gap-2.5 text-sm text-ink/80">
                      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-leaf/15 text-leaf">
                        <Check className="h-3 w-3" />
                      </span>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* nav buttons */}
            <div className="mt-9 flex items-center justify-between border-t border-ink/5 pt-6">
              <button
                onClick={() => {
                  setError("");
                  setStep((s) => Math.max(0, s - 1));
                }}
                disabled={step === 0}
                className="inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold text-muted transition-colors hover:text-ink disabled:invisible"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <button
                onClick={next}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-brand-light to-brand px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-brand/35"
              >
                {step === 4 ? "Finish setup" : "Continue"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { TEMPLATES, getTemplate, waLink } from "./templates";
import { templateEnabled } from "@/lib/admin";
import { Check, CheckCircle, Palette, WhatsApp, ArrowRight, Eye } from "@/components/icons";

const ACCENTS = ["#E86100", "#F2690E", "#FF8C4A", "#145A32", "#1E8449", "#27AE60", "#11231A", "#C45300"];

export default function WebsiteBuilder() {
  const { user, business, updateBusinessProfile } = useAuth();
  const tpl = getTemplate(business?.template);
  const [templateId, setTemplateId] = useState(business?.template ?? "classic");
  const available = TEMPLATES.filter((t) => templateEnabled(t.id));
  const [heroTitle, setHeroTitle] = useState(business?.heroTitle ?? business?.name ?? "My Store");
  const [heroSubtitle, setHeroSubtitle] = useState(business?.heroSubtitle ?? "Handcrafted with love — explore our collection and order today.");
  const [tagline, setTagline] = useState(business?.tagline ?? "Fresh arrivals every week");
  const [accent, setAccent] = useState(business?.accent ?? tpl.accent);
  const [saved, setSaved] = useState(false);

  if (!user || !business) {
    return (
      <div className="grid min-h-screen place-items-center">
        <a href="#/login" className="font-semibold text-brand">Please log in to edit your website</a>
      </div>
    );
  }

  const save = () => {
    updateBusinessProfile({ template: templateId, heroTitle, heroSubtitle, tagline, accent, websiteLive: true });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const input = "w-full rounded-xl border border-ink/10 bg-white px-4 py-3 text-[15px] text-ink outline-none transition-all focus:border-brand focus:ring-4 focus:ring-brand/10";

  return (
    <div className="min-h-screen bg-cream">
      {/* header */}
      <header className="sticky top-0 z-30 border-b border-ink/5 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4 sm:px-5">
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate font-display text-base font-extrabold text-ink sm:text-lg">Website Studio</span>
            <span className="hidden shrink-0 rounded-full bg-pine/10 px-2.5 py-1 text-[10px] font-bold text-pine sm:block">Free website</span>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <a href="#/dashboard" className="hidden rounded-full border border-ink/15 px-3.5 py-2 text-xs font-semibold text-ink hover:border-brand hover:text-brand sm:block sm:px-4 sm:text-sm">Back</a>
            <a href="#/storefront" className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 bg-white px-3.5 py-2 text-xs font-semibold text-ink hover:border-brand hover:text-brand sm:px-4 sm:text-sm">
              <Eye className="h-4 w-4" /> <span className="hidden sm:inline">Preview</span><span className="sm:hidden">View</span>
            </a>
            <button onClick={save} className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-brand-light to-brand px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-brand/25 sm:px-5 sm:text-sm">Publish</button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8">
        {saved && (
          <div className="mb-6 flex items-center gap-2 rounded-2xl border border-leaf/30 bg-leaf/10 px-4 py-3 text-sm font-semibold text-forest">
            <CheckCircle className="h-5 w-5 text-leaf" /> Website published — your customers can see it at {business.websiteName}.brikoh.app
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
          {/* editor */}
          <div className="space-y-6">
            {/* template picker */}
            <div>
              <h2 className="font-display text-lg font-extrabold text-ink">Choose a template</h2>
              <p className="mt-1 text-sm text-muted">Pick the look you love — you can switch anytime.</p>
              <div className="mt-4 space-y-3">
                {available.map((t) => {
                  const selected = templateId === t.id;
                  return (
                    <button key={t.id} onClick={() => { setTemplateId(t.id); if (!business.accent) setAccent(t.accent); }} className={`flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all ${selected ? "border-brand bg-brand/[0.05] shadow-lg shadow-brand/10" : "border-ink/8 bg-white hover:border-brand/40"}`}>
                      <span className="relative grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl">
                        <span className="absolute inset-0 bg-gradient-to-br" style={{ background: `linear-gradient(135deg, ${t.swatch[0]}, ${t.swatch[1]})` }} />
                        <span className="relative text-2xl drop-shadow">{t.emoji}</span>
                      </span>
                      <span className="flex-1">
                        <span className="flex items-center gap-2 font-display text-base font-bold text-ink">
                          {t.name}
                          <span className="rounded-full bg-cream px-2 py-0.5 text-[10px] font-bold text-muted ring-1 ring-ink/5">{t.badge}</span>
                        </span>
                        <span className="mt-0.5 block text-xs text-muted">{t.desc}</span>
                      </span>
                      {selected && <span className="grid h-6 w-6 place-items-center rounded-full bg-brand text-white"><Check className="h-3.5 w-3.5" /></span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* customise */}
            <div className="rounded-3xl border border-ink/5 bg-white p-6 shadow-sm">
              <h3 className="flex items-center gap-2 font-display text-base font-extrabold text-ink"><Palette className="h-5 w-5 text-brand" /> Customise (optional)</h3>
              <p className="mt-1 text-xs text-muted">Change anything you like — or leave it as it is.</p>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-ink">Store tagline</label>
                  <input value={tagline} onChange={(e) => setTagline(e.target.value)} className={input} placeholder="Fresh arrivals every week" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-ink">Hero title</label>
                  <input value={heroTitle} onChange={(e) => setHeroTitle(e.target.value)} className={input} placeholder="Welcome to my store" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-ink">Hero subtitle</label>
                  <textarea value={heroSubtitle} onChange={(e) => setHeroSubtitle(e.target.value)} rows={2} className={`${input} resize-none`} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-ink">Accent color</label>
                  <div className="flex flex-wrap gap-2">
                    {ACCENTS.map((c) => (
                      <button key={c} onClick={() => setAccent(c)} className={`grid h-9 w-9 place-items-center rounded-full transition-transform hover:scale-110 ${accent === c ? "ring-2 ring-offset-2 ring-ink/40" : ""}`} style={{ background: c }} aria-label={c}>
                        {accent === c && <Check className="h-4 w-4 text-white" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* whatsapp */}
            <div className="flex items-center gap-3 rounded-3xl border border-[#25D366]/25 bg-[#25D366]/[0.06] p-5">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#25D366] text-white"><WhatsApp className="h-6 w-6" /></span>
              <div className="flex-1">
                <p className="text-sm font-bold text-ink">WhatsApp chat button — on by default</p>
                <p className="text-xs text-muted">
                  Customers tap it and chat with you directly on{" "}
                  <span className="font-semibold text-forest">{business.whatsapp || business.phone || "your WhatsApp number"}</span>.
                </p>
              </div>
              <a href={waLink(business.whatsapp || business.phone)} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#25D366] px-4 py-2 text-xs font-bold text-white">Test it <ArrowRight className="h-3.5 w-3.5" /></a>
            </div>
          </div>

          {/* live preview */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted">Live preview</p>
            <div className="overflow-hidden rounded-3xl border border-ink/10 bg-white shadow-2xl shadow-forest/10">
              {/* browser bar */}
              <div className="flex items-center gap-1.5 border-b border-ink/5 bg-cream px-4 py-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                <span className="ml-2 flex-1 truncate rounded-md bg-white px-3 py-1 text-[10px] text-muted ring-1 ring-ink/5">
                  {(business.websiteName || "your-store").toLowerCase()}.brikoh.app
                </span>
              </div>

              <div className={`${getTemplate(templateId).font}`}>
                {/* header */}
                <div className="flex items-center justify-between border-b border-ink/5 px-5 py-3">
                  <span className="text-sm font-extrabold" style={{ color: getTemplate(templateId).heroStyle === "editorial" ? "#fff" : "#11231A" }}>{business.name}</span>
                  <div className="flex items-center gap-3 text-[10px] font-semibold text-ink/60">
                    <span>Shop</span><span>About</span><span>Contact</span>
                  </div>
                </div>

                {/* hero by style */}
                {getTemplate(templateId).heroStyle === "centered" ? (
                  <div className="px-6 py-12 text-center" style={{ background: `linear-gradient(135deg, ${getTemplate(templateId).swatch[0]}, ${getTemplate(templateId).swatch[1]})` }}>
                    <span className="text-4xl">{getTemplate(templateId).emoji}</span>
                    <p className="mt-3 text-xs font-bold uppercase tracking-widest" style={{ color: "#fff" }}>{tagline}</p>
                    <p className="mx-auto mt-2 max-w-sm font-display text-2xl font-extrabold text-white">{heroTitle}</p>
                    <p className="mx-auto mt-2 max-w-sm text-xs text-white/85">{heroSubtitle}</p>
                    <span className="mt-4 inline-block rounded-full px-5 py-2 text-xs font-bold text-white" style={{ background: accent }}>Shop now</span>
                  </div>
                ) : getTemplate(templateId).heroStyle === "editorial" ? (
                  <div className="px-6 py-12" style={{ background: "#11231A" }}>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>{tagline}</p>
                        <p className="mt-2 font-display text-3xl font-extrabold leading-tight text-white">{heroTitle}</p>
                        <p className="mt-2 max-w-xs text-xs text-white/70">{heroSubtitle}</p>
                        <span className="mt-4 inline-block rounded-full px-5 py-2 text-xs font-bold text-black" style={{ background: accent }}>Explore</span>
                      </div>
                      <span className="grid h-28 w-28 place-items-center rounded-2xl text-5xl" style={{ background: `${accent}22` }}>{getTemplate(templateId).emoji}</span>
                    </div>
                  </div>
                ) : (
                  <div className="grid items-center gap-6 px-6 py-10 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>{tagline}</p>
                      <p className="mt-2 font-display text-2xl font-extrabold text-ink">{heroTitle}</p>
                      <p className="mt-2 text-xs text-muted">{heroSubtitle}</p>
                      <span className="mt-4 inline-block rounded-full px-5 py-2 text-xs font-bold text-white" style={{ background: accent }}>Shop now</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[0, 1, 2, 3].map((i) => (
                        <div key={i} className="rounded-xl bg-cream p-2">
                          <div className="h-10 rounded-lg bg-gradient-to-br" style={{ background: `linear-gradient(135deg, ${getTemplate(templateId).swatch[0]}44, ${getTemplate(templateId).swatch[1]}44)` }} />
                          <div className="mt-1.5 h-1.5 w-3/4 rounded-full bg-ink/10" />
                          <div className="mt-1 h-1.5 w-1/2 rounded-full" style={{ background: `${accent}55` }} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* products strip */}
                <div className="grid grid-cols-3 gap-3 px-5 py-5" style={{ background: getTemplate(templateId).heroStyle === "editorial" ? "#0d1a14" : "#fff" }}>
                  {["🧣", "👗", "👜"].map((e, i) => (
                    <div key={i} className="rounded-xl p-3 text-center" style={{ background: getTemplate(templateId).heroStyle === "editorial" ? "#16251d" : "#faf8f4" }}>
                      <span className="text-2xl">{e}</span>
                      <div className="mx-auto mt-1.5 h-1.5 w-2/3 rounded-full bg-ink/10" />
                      <div className="mx-auto mt-1 h-1.5 w-1/3 rounded-full" style={{ background: `${accent}66` }} />
                    </div>
                  ))}
                </div>

                {/* footer */}
                <div className="border-t border-ink/5 px-5 py-4 text-center text-[10px] text-muted">
                  © {business.name} · Powered by Brikoh
                </div>
              </div>

              {/* whatsapp bubble */}
              <div className="absolute bottom-4 right-4 grid h-11 w-11 place-items-center rounded-full bg-[#25D366] text-white shadow-lg">
                <WhatsApp className="h-6 w-6" />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between rounded-2xl border border-ink/5 bg-white px-5 py-4">
              <div>
                <p className="text-sm font-bold text-ink">Your store link</p>
                <p className="font-mono text-sm font-bold text-brand">{(business.websiteName || "your-store").toLowerCase()}.brikoh.app</p>
              </div>
              <a href="#/storefront" className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-white">
                Open store <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { loadMarketing, saveMarketing, type Campaign, type Coupon, type Socials } from "@/lib/marketing";
import { loadInventoryDB } from "@/inventory/lib";
import { waLink } from "@/website/templates";
import {
  Megaphone,
  WhatsApp,
  Mail,
  Send,
  Tag,
  CheckCircle,
  Trash,
  Users,
  Globe,
} from "@/components/icons";

const input = "w-full rounded-xl border border-ink/10 bg-white px-4 py-3 text-[15px] outline-none focus:border-brand focus:ring-4 focus:ring-brand/10";

export default function MarketingSection() {
  const { business } = useAuth();
  const [state, setState] = useState(loadMarketing);
  const persist = (s: typeof state) => { setState(s); saveMarketing(s); };

  const db = loadInventoryDB();
  const customers = db.customers;
  const groups = db.groups;
  const totalCustomers = customers.length + 856; // seeded base

  const [campOpen, setCampOpen] = useState(false);
  const [cpnOpen, setCpnOpen] = useState(false);
  const [socials, setSocials] = useState<Socials>(state.socials);
  const [socialSaved, setSocialSaved] = useState(false);

  // campaign form
  const [cName, setCName] = useState("");
  const [cChannel, setCChannel] = useState<Campaign["channel"]>("whatsapp");
  const [cAudience, setCAudience] = useState<Campaign["audience"]>("all");
  const [cMessage, setCMessage] = useState("");

  // coupon form
  const [cpCode, setCpCode] = useState("");
  const [cpType, setCpType] = useState<Coupon["type"]>("percentage");
  const [cpValue, setCpValue] = useState("10");
  const [cpExpires, setCpExpires] = useState("");

  const audienceLabel = (a: Campaign["audience"]) =>
    a === "all" ? `All customers (${totalCustomers})` : a === "vip" ? "VIP customers" : a === "wholesale" ? "Wholesale group" : "Selected group";

  const audienceCount = (a: Campaign["audience"]) =>
    a === "all" ? totalCustomers : a === "vip" ? customers.filter((c) => db.sales.filter((s) => s.customerId === c.id).reduce((x, y) => x + y.total, 0) > 300000).length + 18 : customers.length + 22;

  const createCampaign = () => {
    if (cName.trim().length < 2 || cMessage.trim().length < 3) return;
    const camp: Campaign = {
      id: `CMP-${Math.floor(1000 + Math.random() * 9000)}`,
      name: cName.trim(),
      channel: cChannel,
      audience: cAudience,
      audienceLabel: audienceLabel(cAudience),
      message: cMessage.trim(),
      sentAt: new Date().toISOString(),
      delivered: audienceCount(cAudience),
      opened: Math.round(audienceCount(cAudience) * 0.55),
      status: "sent",
    };
    persist({ ...state, campaigns: [camp, ...state.campaigns] });
    setCampOpen(false); setCName(""); setCMessage("");
  };

  const createCoupon = () => {
    if (cpCode.trim().length < 3 || !Number(cpValue)) return;
    const coupon: Coupon = {
      id: `CPN-${Date.now()}`,
      code: cpCode.trim().toUpperCase(),
      type: cpType,
      value: Number(cpValue),
      expires: cpExpires || null,
      maxUses: 500,
      uses: 0,
      active: true,
    };
    persist({ ...state, coupons: [coupon, ...state.coupons] });
    setCpnOpen(false); setCpCode(""); setCpValue("10");
  };

  const toggleCoupon = (id: string) =>
    persist({ ...state, coupons: state.coupons.map((c) => (c.id === id ? { ...c, active: !c.active } : c)) });

  const deleteCampaign = (id: string) =>
    persist({ ...state, campaigns: state.campaigns.filter((c) => c.id !== id) });

  const saveSocials = () => {
    persist({ ...state, socials });
    setSocialSaved(true);
    setTimeout(() => setSocialSaved(false), 2500);
  };

  const whatsapp = business?.whatsapp || business?.phone || "";
  const stats = [
    { k: "Campaigns sent", v: state.campaigns.length.toString(), tint: "bg-brand/10 text-brand" },
    { k: "Reach", v: state.campaigns.reduce((s, c) => s + c.delivered, 0).toLocaleString(), tint: "bg-pine/10 text-pine" },
    { k: "Active coupons", v: state.coupons.filter((c) => c.active).length.toString(), tint: "bg-leaf/10 text-leaf" },
    { k: "Coupon redemptions", v: state.coupons.reduce((s, c) => s + c.uses, 0).toLocaleString(), tint: "bg-sun/15 text-[#b7791f]" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink">Marketing</h2>
          <p className="mt-1 text-sm text-muted">
            Reach your customers with campaigns, coupons and your social channels — Bumpa-style, built in.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setCpnOpen(true)} className="rounded-full border border-ink/15 bg-white px-4 py-2.5 text-sm font-semibold text-ink hover:border-brand hover:text-brand">
            <Tag className="mr-1 inline h-4 w-4" /> New coupon
          </button>
          <button onClick={() => setCampOpen(true)} className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-brand-light to-brand px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand/25">
            <Megaphone className="h-4 w-4" /> New campaign
          </button>
        </div>
      </div>

      {/* cross-links */}
      <div className="flex flex-wrap gap-2">
        {[
          { to: "#/inventory/customers", label: "👥 Customers & groups", hint: "Target these people" },
          { to: "#/website-builder", label: "🌐 Website Studio", hint: "Put promos on your site" },
          { to: "#/money/wallet", label: "💳 Wallet & payouts", hint: "Funds from campaigns" },
          { to: "#/dashboard/analytics", label: "📊 Analytics", hint: "Measure performance" },
        ].map((l) => (
          <a key={l.to} href={l.to} className="rounded-full border border-ink/10 bg-white px-4 py-2 text-xs font-bold text-ink/75 transition-colors hover:border-brand hover:text-brand" title={l.hint}>
            {l.label}
          </a>
        ))}
      </div>

      {/* stats */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {stats.map((s) => (
          <div key={s.k} className="rounded-2xl border border-ink/5 bg-white p-5 shadow-sm">
            <span className={`grid h-10 w-10 place-items-center rounded-xl ${s.tint}`}>
              <Users className="h-5 w-5" />
            </span>
            <p className="mt-3 font-display text-2xl font-extrabold text-ink">{s.v}</p>
            <p className="text-xs font-medium text-muted">{s.k}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        {/* campaigns */}
        <div className="rounded-3xl border border-ink/5 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-extrabold text-ink">Campaigns</h3>
            <button onClick={() => setCampOpen(true)} className="text-xs font-bold text-brand">New campaign</button>
          </div>
          <div className="mt-4 space-y-3">
            {state.campaigns.map((c) => (
              <div key={c.id} className="rounded-2xl bg-cream p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className={`grid h-10 w-10 place-items-center rounded-xl ${c.channel === "whatsapp" ? "bg-[#25D366]/15 text-[#128C4B]" : c.channel === "email" ? "bg-brand/10 text-brand" : "bg-pine/10 text-pine"}`}>
                      {c.channel === "whatsapp" ? <WhatsApp className="h-5 w-5" /> : c.channel === "email" ? <Mail className="h-5 w-5" /> : <Send className="h-5 w-5" />}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-ink">{c.name}</p>
                      <p className="text-xs text-muted">
                        {c.channel} · {c.audienceLabel} · {new Date(c.sentAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-forest">{c.delivered.toLocaleString()} delivered</p>
                    <p className="text-[11px] text-muted">{Math.round((c.opened / Math.max(1, c.delivered)) * 100)}% opened</p>
                  </div>
                  <button onClick={() => deleteCampaign(c.id)} className="grid h-8 w-8 place-items-center rounded-lg text-ink/35 hover:bg-red-50 hover:text-red-500" aria-label="Delete"><Trash className="h-4 w-4" /></button>
                </div>
                <p className="mt-2.5 rounded-xl bg-white px-3.5 py-2.5 text-sm text-ink/80">"{c.message}"</p>
              </div>
            ))}
            {state.campaigns.length === 0 && <p className="py-8 text-center text-sm text-muted">No campaigns yet — launch your first one.</p>}
          </div>
        </div>

        <div className="space-y-6">
          {/* WhatsApp broadcast */}
          <div className="rounded-3xl border border-[#25D366]/25 bg-gradient-to-br from-[#25D366]/10 to-white p-6">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-[#25D366] text-white"><WhatsApp className="h-6 w-6" /></span>
              <div>
                <p className="font-display text-base font-extrabold text-ink">WhatsApp broadcasts</p>
                <p className="text-xs text-muted">Reach customers instantly on WhatsApp</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-ink/80">
              Send promos and updates straight to your customers' chats. Your broadcast number:
              <span className="ml-1 font-bold text-forest">{whatsapp || "not set"}</span>
            </p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => { setCampOpen(true); setCChannel("whatsapp"); }}
                className="flex-1 rounded-full bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white"
              >
                Compose broadcast
              </button>
              <a href={waLink(whatsapp)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-[#25D366]/40 px-4 py-2.5 text-sm font-semibold text-[#128C4B]">
                Open WhatsApp
              </a>
            </div>
          </div>

          {/* socials */}
          <div className="rounded-3xl border border-ink/5 bg-white p-6 shadow-sm">
            <h3 className="font-display text-base font-extrabold text-ink">Social links</h3>
            <p className="mt-1 text-xs text-muted">Show these on your website & receipts.</p>
            <div className="mt-4 space-y-3">
              {(["instagram", "facebook", "tiktok", "website"] as const).map((k) => (
                <div key={k}>
                  <label className="mb-1 block text-xs font-semibold capitalize text-ink/70">{k}</label>
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 shrink-0 text-ink/30" />
                    <input value={socials[k]} onChange={(e) => setSocials((s) => ({ ...s, [k]: e.target.value }))} placeholder={`https://${k}.com/yourpage`} className="w-full rounded-xl border border-ink/10 bg-cream px-3.5 py-2.5 text-sm outline-none focus:border-brand" />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between">
              <button onClick={saveSocials} className="rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-white">Save links</button>
              {socialSaved && <span className="flex items-center gap-1 text-xs font-bold text-leaf"><CheckCircle className="h-4 w-4" /> Saved</span>}
            </div>
          </div>
        </div>
      </div>

      {/* coupons */}
      <div className="rounded-3xl border border-ink/5 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-extrabold text-ink">Coupons</h3>
          <button onClick={() => setCpnOpen(true)} className="text-xs font-bold text-brand">New coupon</button>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {state.coupons.map((c) => (
            <div key={c.id} className={`rounded-2xl border p-4 ${c.active ? "border-leaf/25 bg-leaf/[0.04]" : "border-ink/8 bg-cream/50"}`}>
              <div className="flex items-center justify-between">
                <span className="rounded-lg border-2 border-dashed border-forest/30 bg-white px-3 py-1 font-mono text-sm font-extrabold text-forest">{c.code}</span>
                <button onClick={() => toggleCoupon(c.id)} className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${c.active ? "bg-leaf/15 text-leaf" : "bg-ink/10 text-muted"}`}>{c.active ? "Active" : "Paused"}</button>
              </div>
              <p className="mt-2.5 text-sm text-ink/80">
                <span className="font-extrabold text-ink">{c.type === "percentage" ? `${c.value}% off` : `${c.value} off`}</span>
                {c.expires && <span className="text-muted"> · until {c.expires}</span>}
              </p>
              <p className="mt-1 text-xs text-muted">{c.uses} / {c.maxUses} redemptions</p>
            </div>
          ))}
        </div>
      </div>

      {/* campaign modal */}
      {campOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm" onClick={() => setCampOpen(false)}>
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-lg font-extrabold text-ink">New campaign</h3>
            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-ink">Campaign name</label>
                <input value={cName} onChange={(e) => setCName(e.target.value)} className={input} placeholder="e.g. End of season sale" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-ink">Channel</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["whatsapp", "sms", "email"] as const).map((ch) => (
                    <button key={ch} onClick={() => setCChannel(ch)} className={`rounded-xl border-2 py-2.5 text-xs font-bold capitalize transition-all ${cChannel === ch ? "border-brand bg-brand/[0.06] text-brand" : "border-ink/8 text-muted hover:border-brand/40"}`}>
                      {ch}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-ink">Audience</label>
                <select value={cAudience} onChange={(e) => setCAudience(e.target.value as Campaign["audience"])} className={input}>
                  <option value="all">All customers ({totalCustomers})</option>
                  <option value="vip">VIP customers</option>
                  <option value="wholesale">Wholesale group</option>
                  {groups.map((g) => <option key={g.id} value="group">{g.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-ink">Message</label>
                <textarea rows={4} value={cMessage} onChange={(e) => setCMessage(e.target.value)} className={`${input} resize-none`} placeholder="Hi! We're running a special this week…" />
                <p className="mt-1 text-right text-[11px] text-muted">{cMessage.length} / 480</p>
              </div>
            </div>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setCampOpen(false)} className="flex-1 rounded-full border border-ink/15 py-2.5 text-sm font-semibold text-muted">Cancel</button>
              <button onClick={createCampaign} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-gradient-to-br from-brand-light to-brand py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand/25">
                <Send className="h-4 w-4" /> Send now
              </button>
            </div>
            <p className="mt-3 text-center text-[11px] text-muted">Will reach ~{cAudience === "all" ? totalCustomers : cAudience === "vip" ? audienceCount("vip") : audienceCount("wholesale")} customers.</p>
          </div>
        </div>
      )}

      {/* coupon modal */}
      {cpnOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm" onClick={() => setCpnOpen(false)}>
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="flex items-center gap-2 font-display text-lg font-extrabold text-ink"><Tag className="h-5 w-5 text-brand" /> New coupon</h3>
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-ink">Code</label>
                <input value={cpCode} onChange={(e) => setCpCode(e.target.value.toUpperCase())} className={input} placeholder="e.g. SUMMER20" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-ink">Type</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(["percentage", "fixed"] as const).map((t) => (
                      <button key={t} onClick={() => setCpType(t)} className={`rounded-xl border-2 py-2 text-xs font-bold capitalize ${cpType === t ? "border-brand bg-brand/[0.06] text-brand" : "border-ink/8 text-muted"}`}>{t}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-ink">Value</label>
                  <input type="number" value={cpValue} onChange={(e) => setCpValue(e.target.value)} className={input} />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-ink">Expires (optional)</label>
                <input type="date" value={cpExpires} onChange={(e) => setCpExpires(e.target.value)} className={input} />
              </div>
            </div>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setCpnOpen(false)} className="flex-1 rounded-full border border-ink/15 py-2.5 text-sm font-semibold text-muted">Cancel</button>
              <button onClick={createCoupon} className="flex-1 rounded-full bg-forest py-2.5 text-sm font-semibold text-white">Create coupon</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

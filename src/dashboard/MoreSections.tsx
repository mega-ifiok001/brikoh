"use client";

import { useState } from "react";
import { useApi } from "@/api/useApi";
import { ApiError } from "@/api/types";
import {
  branchesService, catalogService, campaignsService, customerGroupsService,
  customersService, bankAccountsService, activityService,
} from "@/api/services";
import { SkeletonRows } from "@/components/Skeleton";
import {
  Plus, Trash, X, Refresh, AlertCircle, MapPin, Tag, Megaphone,
  Users, Wallet, Coins,
} from "@/components/icons";

const input = "w-full rounded-xl border border-ink/10 bg-white px-4 py-3 text-[15px] text-ink outline-none transition-all focus:border-brand focus:ring-4 focus:ring-brand/10";

function ErrorCard({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed border-red-200 bg-red-50/50 px-6 py-12 text-center">
      <AlertCircle className="h-8 w-8 text-red-400" />
      <p className="mt-3 text-sm font-semibold text-red-500">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-white">
          <Refresh className="h-4 w-4" /> Retry
        </button>
      )}
    </div>
  );
}

function SectionHead({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink">{title}</h2>
        {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-extrabold text-ink">{title}</h3>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-ink/40 hover:bg-ink/5"><X className="h-5 w-5" /></button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}

function useSubmit(onSaved: () => void) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const run = async (fn: () => Promise<unknown>) => {
    setError("");
    setBusy(true);
    try { await fn(); onSaved(); return true; }
    catch (e) { setError(e instanceof ApiError ? e.message : (e as Error).message); return false; }
    finally { setBusy(false); }
  };
  return { error, busy, run };
}

/* ============================== Branches ============================== */

export function BranchesSection() {
  const list = useApi(() => branchesService.list());
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [transfer, setTransfer] = useState(false);
  const [tProduct, setTProduct] = useState("");
  const [tFrom, setTFrom] = useState("");
  const [tTo, setTTo] = useState("");
  const [tQty, setTQty] = useState("");
  const submit = useSubmit(() => { setOpen(false); list.refetch(); });
  const tSubmit = useSubmit(() => { setTransfer(false); list.refetch(); });

  const branches = list.data?.items ?? [];

  const create = () => submit.run(async () => {
    if (name.trim().length < 1) throw new Error("Branch name is required.");
    await branchesService.create({ name: name.trim(), address: address.trim() || null });
    setName(""); setAddress("");
  });

  const doTransfer = () => tSubmit.run(async () => {
    if (!tProduct || !tFrom || !tTo || !Number(tQty)) throw new Error("Fill product, branches and quantity.");
    if (tFrom === tTo) throw new Error("Source and destination must differ.");
    await branchesService.transfer({ productId: tProduct, sourceBranchId: tFrom, destinationBranchId: tTo, quantity: Number(tQty) });
    setTQty("");
  });

  const products = useApi(() => import("@/api/services").then((m) => m.productsService.list(100).then((r) => r.items)));

  const makeDefault = async (id: string) => {
    try { await branchesService.makeDefault(id); list.refetch(); } catch (e) { alert((e as Error).message); }
  };
  const delBranch = async (id: string, isDefault: boolean) => {
    if (isDefault) return alert("The default branch cannot be deleted — transfer stock & set another default first.");
    if (!confirm("Delete this branch?")) return;
    try { await branchesService.del(id); list.refetch(); } catch (e) { alert((e as Error).message); }
  };

  return (
    <div className="space-y-5">
      <SectionHead
        title="Branches"
        sub="locations.manage · branches/transfers for stock movement"
        action={
          <div className="flex gap-2">
            <button onClick={() => setTransfer(true)} className="rounded-full border border-ink/15 bg-white px-4 py-2.5 text-sm font-semibold text-ink hover:border-brand hover:text-brand">Transfer stock</button>
            <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-brand-light to-brand px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand/25">
              <Plus className="h-4 w-4" /> Add branch
            </button>
          </div>
        }
      />

      {list.loading ? <SkeletonRows rows={4} /> : list.error ? <ErrorCard message={list.error} onRetry={list.refetch} /> : (
        <div className="grid gap-4 sm:grid-cols-2">
          {branches.map((b) => (
            <div key={b.id} className="rounded-2xl border border-ink/5 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-pine/10 text-pine"><MapPin className="h-5 w-5" /></span>
                  <div>
                    <p className="font-display text-base font-extrabold text-ink">{b.name}</p>
                    <p className="text-xs text-muted">{b.address ?? "No address"}</p>
                  </div>
                </div>
                {b.isDefault && <span className="rounded-full bg-brand/10 px-2.5 py-1 text-[10px] font-bold text-brand">Default</span>}
              </div>
              <div className="mt-4 flex gap-2">
                {!b.isDefault && <button onClick={() => makeDefault(b.id)} className="rounded-full bg-forest px-3.5 py-1.5 text-xs font-bold text-white">Make default</button>}
                <button onClick={() => delBranch(b.id, b.isDefault)} className="rounded-full border border-red-200 px-3.5 py-1.5 text-xs font-bold text-red-400 hover:bg-red-50">Delete</button>
              </div>
            </div>
          ))}
          {branches.length === 0 && <p className="py-8 text-center text-sm text-muted sm:col-span-2">No branches — your Main Branch is created at onboarding.</p>}
        </div>
      )}

      {open && (
        <Modal title="Add branch" onClose={() => setOpen(false)}>
          {submit.error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-500">{submit.error}</p>}
          <div className="space-y-3">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Branch name" className={input} />
            <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address (optional)" className={input} />
          </div>
          <button onClick={create} disabled={submit.busy} className="mt-4 w-full rounded-full bg-forest py-3 text-sm font-bold text-white disabled:opacity-60">{submit.busy ? "Creating…" : "Create branch"}</button>
        </Modal>
      )}

      {transfer && (
        <Modal title="Transfer stock" onClose={() => setTransfer(false)}>
          {tSubmit.error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-500">{tSubmit.error}</p>}
          <div className="space-y-3">
            <select value={tProduct} onChange={(e) => setTProduct(e.target.value)} className={input}>
              <option value="">Select product…</option>
              {(products.data ?? []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-3">
              <select value={tFrom} onChange={(e) => setTFrom(e.target.value)} className={input}>
                <option value="">From branch</option>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <select value={tTo} onChange={(e) => setTTo(e.target.value)} className={input}>
                <option value="">To branch</option>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <input type="number" value={tQty} onChange={(e) => setTQty(e.target.value)} placeholder="Quantity" className={input} />
          </div>
          <button onClick={doTransfer} disabled={tSubmit.busy} className="mt-4 w-full rounded-full bg-forest py-3 text-sm font-bold text-white disabled:opacity-60">{tSubmit.busy ? "Transferring…" : "Transfer"}</button>
        </Modal>
      )}
    </div>
  );
}

/* =========================== Catalog taxonomy ========================== */

export function CatalogSection() {
  const cats = useApi(() => catalogService.categories.list());
  const units = useApi(() => catalogService.units.list());
  const [catOpen, setCatOpen] = useState(false);
  const [unitOpen, setUnitOpen] = useState(false);
  const [cName, setCName] = useState("");
  const [cDesc, setCDesc] = useState("");
  const [uName, setUName] = useState("");
  const [uSym, setUSym] = useState("");
  const cSubmit = useSubmit(() => { setCatOpen(false); cats.refetch(); });
  const uSubmit = useSubmit(() => { setUnitOpen(false); units.refetch(); });

  const addCat = () => cSubmit.run(async () => {
    if (cName.trim().length < 1) throw new Error("Category name required.");
    await catalogService.categories.create({ name: cName.trim(), description: cDesc.trim() || null });
    setCName(""); setCDesc("");
  });
  const addUnit = () => uSubmit.run(async () => {
    if (uName.trim().length < 1) throw new Error("Unit name required.");
    await catalogService.units.create({ name: uName.trim(), symbol: uSym.trim() || null });
    setUName(""); setUSym("");
  });

  const delCat = async (id: string) => { if (confirm("Delete category? Products become uncategorized.")) { try { await catalogService.categories.del(id); cats.refetch(); } catch (e) { alert((e as Error).message); } } };
  const delUnit = async (id: string) => { if (confirm("Delete unit?")) { try { await catalogService.units.del(id); units.refetch(); } catch (e) { alert((e as Error).message); } } };

  return (
    <div className="space-y-5">
      <SectionHead title="Catalog" sub="catalog.manage · categories & units" />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-ink/5 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-display text-base font-extrabold text-ink"><Tag className="h-5 w-5 text-brand" /> Categories</h3>
            <button onClick={() => setCatOpen(true)} className="inline-flex items-center gap-1 rounded-full bg-pine/10 px-3 py-1.5 text-xs font-bold text-pine"><Plus className="h-3.5 w-3.5" /> Add</button>
          </div>
          {cats.loading ? <div className="mt-4"><SkeletonRows rows={3} /></div> : cats.error ? <ErrorCard message={cats.error} onRetry={cats.refetch} /> : (
            <div className="mt-4 space-y-2">
              {(cats.data?.items ?? []).map((c) => (
                <div key={c.id} className="flex items-center gap-3 rounded-xl bg-cream px-4 py-3 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-ink">{c.name}</p>
                    <p className="truncate text-xs text-muted">{c.description ?? "—"}</p>
                  </div>
                  <button onClick={() => delCat(c.id)} className="grid h-7 w-7 place-items-center rounded-lg text-ink/35 hover:text-red-500"><Trash className="h-4 w-4" /></button>
                </div>
              ))}
              {(cats.data?.items ?? []).length === 0 && <p className="py-4 text-center text-sm text-muted">No categories.</p>}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-ink/5 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-display text-base font-extrabold text-ink"><Coins className="h-5 w-5 text-pine" /> Units</h3>
            <button onClick={() => setUnitOpen(true)} className="inline-flex items-center gap-1 rounded-full bg-pine/10 px-3 py-1.5 text-xs font-bold text-pine"><Plus className="h-3.5 w-3.5" /> Add</button>
          </div>
          {units.loading ? <div className="mt-4"><SkeletonRows rows={3} /></div> : units.error ? <ErrorCard message={units.error} onRetry={units.refetch} /> : (
            <div className="mt-4 space-y-2">
              {(units.data?.items ?? []).map((u) => (
                <div key={u.id} className="flex items-center gap-3 rounded-xl bg-cream px-4 py-3 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-ink">{u.name}</p>
                    <p className="text-xs text-muted">{u.symbol ?? "no symbol"}</p>
                  </div>
                  <button onClick={() => delUnit(u.id)} className="grid h-7 w-7 place-items-center rounded-lg text-ink/35 hover:text-red-500"><Trash className="h-4 w-4" /></button>
                </div>
              ))}
              {(units.data?.items ?? []).length === 0 && <p className="py-4 text-center text-sm text-muted">No units.</p>}
            </div>
          )}
        </div>
      </div>

      {catOpen && (
        <Modal title="Add category" onClose={() => setCatOpen(false)}>
          {cSubmit.error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-500">{cSubmit.error}</p>}
          <div className="space-y-3">
            <input value={cName} onChange={(e) => setCName(e.target.value)} placeholder="Category name" className={input} />
            <input value={cDesc} onChange={(e) => setCDesc(e.target.value)} placeholder="Description (optional)" className={input} />
          </div>
          <button onClick={addCat} disabled={cSubmit.busy} className="mt-4 w-full rounded-full bg-forest py-3 text-sm font-bold text-white disabled:opacity-60">{cSubmit.busy ? "Creating…" : "Create"}</button>
        </Modal>
      )}
      {unitOpen && (
        <Modal title="Add unit" onClose={() => setUnitOpen(false)}>
          {uSubmit.error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-500">{uSubmit.error}</p>}
          <div className="space-y-3">
            <input value={uName} onChange={(e) => setUName(e.target.value)} placeholder="Unit name (e.g. Kilogram)" className={input} />
            <input value={uSym} onChange={(e) => setUSym(e.target.value)} placeholder="Symbol (e.g. kg)" className={input} />
          </div>
          <button onClick={addUnit} disabled={uSubmit.busy} className="mt-4 w-full rounded-full bg-forest py-3 text-sm font-bold text-white disabled:opacity-60">{uSubmit.busy ? "Creating…" : "Create"}</button>
        </Modal>
      )}
    </div>
  );
}

/* ============================== Campaigns ============================= */

export function CampaignsSection() {
  const list = useApi(() => campaignsService.list());
  const stats = useApi(() => campaignsService.stats());
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [bannerTitle, setBannerTitle] = useState("");
  const [bannerSubtitle, setBannerSubtitle] = useState("");
  const [ctaLabel, setCtaLabel] = useState("");
  const submit = useSubmit(() => { setOpen(false); list.refetch(); stats.refetch(); });

  const create = () => submit.run(async () => {
    if (name.trim().length < 1) throw new Error("Campaign name required.");
    await campaignsService.create({ name: name.trim(), bannerTitle: bannerTitle.trim() || null, bannerSubtitle: bannerSubtitle.trim() || null, ctaLabel: ctaLabel.trim() || null });
    setName(""); setBannerTitle(""); setBannerSubtitle(""); setCtaLabel("");
  });

  const toggleActive = async (id: string, isActive: boolean) => {
    try { await campaignsService.update(id, { isActive: !isActive }); list.refetch(); } catch (e) { alert((e as Error).message); }
  };
  const del = async (id: string) => { if (confirm("Delete this campaign?")) { try { await campaignsService.del(id); list.refetch(); } catch (e) { alert((e as Error).message); } } };

  const now = new Date();
  const isLive = (c: { isActive: boolean; startsAt: string | null; endsAt: string | null }) =>
    c.isActive && (!c.startsAt || new Date(c.startsAt) <= now) && (!c.endsAt || new Date(c.endsAt) > now);

  return (
    <div className="space-y-5">
      <SectionHead
        title="Campaigns"
        sub="marketing.manage · storefront banners, optionally linked to a coupon"
        action={
          <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-brand-light to-brand px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand/25">
            <Plus className="h-4 w-4" /> New campaign
          </button>
        }
      />

      {/* campaign stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.loading ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-ink/10" />) : (
          <>
            <div className="rounded-2xl border border-ink/5 bg-white p-4 text-center shadow-sm"><p className="font-display text-2xl font-extrabold text-ink">{stats.data?.totalCampaigns ?? 0}</p><p className="text-xs text-muted">Total campaigns</p></div>
            <div className="rounded-2xl border border-ink/5 bg-white p-4 text-center shadow-sm"><p className="font-display text-2xl font-extrabold text-leaf">{stats.data?.activeCampaigns ?? 0}</p><p className="text-xs text-muted">Live now</p></div>
            <div className="rounded-2xl border border-ink/5 bg-white p-4 text-center shadow-sm"><p className="font-display text-2xl font-extrabold text-ink">{stats.data?.activeCoupons ?? 0}</p><p className="text-xs text-muted">Active coupons</p></div>
            <div className="rounded-2xl border border-ink/5 bg-white p-4 text-center shadow-sm"><p className="font-display text-2xl font-extrabold text-brand">{stats.data?.totalRedemptions ?? 0}</p><p className="text-xs text-muted">Redemptions</p></div>
          </>
        )}
      </div>

      {list.loading ? <SkeletonRows rows={4} /> : list.error ? <ErrorCard message={list.error} onRetry={list.refetch} /> : (
        <div className="grid gap-4 sm:grid-cols-2">
          {(list.data?.items ?? []).map((c) => {
            const live = isLive(c);
            const stat = stats.data?.campaigns.find((s) => s.id === c.id);
            return (
              <div key={c.id} className={`rounded-2xl border p-5 shadow-sm ${live ? "border-leaf/30 bg-leaf/[0.03]" : "border-ink/5 bg-white"}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand/10 text-brand"><Megaphone className="h-5 w-5" /></span>
                    <div>
                      <p className="font-display text-base font-extrabold text-ink">{c.name}</p>
                      <p className="text-xs text-muted">{c.discountCode ? `Coupon ${c.discountCode}` : "No coupon linked"}</p>
                    </div>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${live ? "bg-leaf/15 text-leaf" : c.isActive ? "bg-sun/20 text-[#b7791f]" : "bg-ink/10 text-muted"}`}>
                    {live ? "LIVE" : c.isActive ? "Scheduled" : "Paused"}
                  </span>
                </div>
                {c.bannerTitle && <p className="mt-3 rounded-xl bg-cream px-4 py-2.5 text-sm font-semibold text-ink">"{c.bannerTitle}"{c.ctaLabel ? ` — ${c.ctaLabel}` : ""}</p>}
                {c.bannerSubtitle && <p className="mt-1 px-1 text-xs text-muted">{c.bannerSubtitle}</p>}
                {c.startsAt && <p className="mt-2 text-[11px] text-muted">Starts {new Date(c.startsAt).toLocaleString()}</p>}
                {c.endsAt && <p className="text-[11px] text-muted">Ends {new Date(c.endsAt).toLocaleString()}</p>}
                {stat && (stat.redemptions > 0 || Number(stat.attributedRevenue) > 0) && (
                  <p className="mt-2 rounded-xl bg-leaf/10 px-3 py-2 text-[11px] font-bold text-forest">
                    {stat.redemptions} redemptions · {stat.attributedOrders} orders · {stat.attributedRevenue} revenue
                  </p>
                )}
                <div className="mt-4 flex gap-2">
                  <button onClick={() => toggleActive(c.id, c.isActive)} className="rounded-full border border-ink/15 px-3.5 py-1.5 text-xs font-bold text-ink hover:border-brand hover:text-brand">{c.isActive ? "Pause" : "Activate"}</button>
                  <button onClick={() => del(c.id)} className="rounded-full border border-red-200 px-3.5 py-1.5 text-xs font-bold text-red-400 hover:bg-red-50">Delete</button>
                </div>
              </div>
            );
          })}
          {(list.data?.items ?? []).length === 0 && <p className="py-8 text-center text-sm text-muted sm:col-span-2">No campaigns yet.</p>}
        </div>
      )}

      {open && (
        <Modal title="New campaign" onClose={() => setOpen(false)}>
          {submit.error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-500">{submit.error}</p>}
          <div className="space-y-3">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Campaign name (1-100)" className={input} />
            <input value={bannerTitle} onChange={(e) => setBannerTitle(e.target.value)} placeholder="Banner title (1-80)" className={input} />
            <input value={bannerSubtitle} onChange={(e) => setBannerSubtitle(e.target.value)} placeholder="Banner subtitle (1-80)" className={input} />
            <input value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} placeholder="CTA label (1-80)" className={input} />
          </div>
          <button onClick={create} disabled={submit.busy} className="mt-4 w-full rounded-full bg-forest py-3 text-sm font-bold text-white disabled:opacity-60">{submit.busy ? "Creating…" : "Create campaign"}</button>
        </Modal>
      )}
    </div>
  );
}

/* =========================== Customer groups ========================== */

export function CustomerGroupsSection() {
  const list = useApi(() => customerGroupsService.list());
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const submit = useSubmit(() => { setOpen(false); list.refetch(); });

  const create = () => submit.run(async () => {
    if (name.trim().length < 1) throw new Error("Group name required.");
    await customerGroupsService.create({ name: name.trim(), description: desc.trim() || null });
    setName(""); setDesc("");
  });

  const del = async (id: string) => { if (confirm("Delete this group?")) { try { await customerGroupsService.del(id); list.refetch(); } catch (e) { alert((e as Error).message); } } };

  return (
    <div className="space-y-5">
      <SectionHead
        title="Customer groups"
        sub="customers.manage · auto-applied discounts for members"
        action={
          <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-brand-light to-brand px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand/25">
            <Plus className="h-4 w-4" /> New group
          </button>
        }
      />

      {list.loading ? <SkeletonRows rows={4} /> : list.error ? <ErrorCard message={list.error} onRetry={list.refetch} /> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(list.data?.items ?? []).map((g) => (
            <div key={g.id} className="rounded-2xl border border-ink/5 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand/10 text-brand"><Users className="h-5 w-5" /></span>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-base font-extrabold text-ink">{g.name}</p>
                  <p className="text-xs text-muted">{g.memberCount} member(s)</p>
                </div>
                <button onClick={() => del(g.id)} className="grid h-7 w-7 place-items-center rounded-lg text-ink/35 hover:text-red-500"><Trash className="h-4 w-4" /></button>
              </div>
              {g.discount && (
                <p className="mt-3 rounded-xl bg-leaf/10 px-3 py-2 text-xs font-bold text-forest">Auto-discount: {g.discount.name} ({g.discount.value}%)</p>
              )}
              {g.description && <p className="mt-2 text-xs text-muted">{g.description}</p>}
            </div>
          ))}
          {(list.data?.items ?? []).length === 0 && <p className="py-8 text-center text-sm text-muted sm:col-span-3">No groups — "General" is created lazily.</p>}
        </div>
      )}

      {open && (
        <Modal title="New customer group" onClose={() => setOpen(false)}>
          {submit.error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-500">{submit.error}</p>}
          <div className="space-y-3">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Group name (e.g. VIP)" className={input} />
            <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Description (optional)" className={input} />
          </div>
          <button onClick={create} disabled={submit.busy} className="mt-4 w-full rounded-full bg-forest py-3 text-sm font-bold text-white disabled:opacity-60">{submit.busy ? "Creating…" : "Create group"}</button>
        </Modal>
      )}
    </div>
  );
}

/* ============================== Customers ============================= */

export function CustomersSection() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Awaited<ReturnType<typeof customersService.list>>["items"]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Awaited<ReturnType<typeof customersService.get>> | null>(null);
  const [open, setOpen] = useState(false);
  const [cName, setCName] = useState("");
  const [cPhone, setCPhone] = useState("");
  const [cEmail, setCEmail] = useState("");
  const [repayAmt, setRepayAmt] = useState("");
  const submit = useSubmit(() => { setOpen(false); load(); });
  const repaySubmit = useSubmit(async () => { if (detailId) setDetail(await customersService.get(detailId)); });

  const load = async (next?: string) => {
    setLoading(true); setError(null);
    try {
      const res = await customersService.list({ q: q || undefined, limit: 20, cursor: next ?? undefined });
      setItems((prev) => (next ? [...prev, ...res.items] : res.items));
      setCursor(res.nextCursor);
    } catch (e) { setError((e as Error).message); }
    setLoading(false);
  };

  const create = () => submit.run(async () => {
    if (cName.trim().length < 1) throw new Error("Customer name required.");
    await customersService.create({ name: cName.trim(), phone: cPhone.trim() || undefined, email: cEmail.trim() || undefined });
    setCName(""); setCPhone(""); setCEmail("");
  });

  const openDetail = async (id: string) => { setDetailId(id); setDetail(null); setRepayAmt(""); try { setDetail(await customersService.get(id)); } catch (e) { alert((e as Error).message); setDetailId(null); } };

  const repay = () => repaySubmit.run(async () => {
    if (!detailId || !Number(repayAmt)) throw new Error("Enter a repayment amount.");
    await customersService.repay(detailId, { amount: repayAmt });
    setRepayAmt("");
  });

  return (
    <div className="space-y-5">
      <SectionHead
        title="Customers"
        sub="customers.manage · source, segment & credit balances"
        action={
          <div className="flex flex-wrap gap-2">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name / phone / email…" className="w-44 rounded-xl border border-ink/10 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand" />
            <button onClick={() => load()} className="rounded-xl bg-forest px-4 py-2.5 text-sm font-bold text-white">Search</button>
            <button onClick={() => customersService.exportCsv().catch((e) => alert((e as Error).message))} className="rounded-full border border-ink/15 bg-white px-4 py-2.5 text-sm font-semibold text-ink hover:border-brand hover:text-brand">Export CSV</button>
            <label className="cursor-pointer rounded-full border border-ink/15 bg-white px-4 py-2.5 text-sm font-semibold text-ink hover:border-brand hover:text-brand">
              Import CSV
              <input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  const text = await f.text();
                  try {
                    const res = await customersService.importCsv(text);
                    alert(`Import: ${res.created} created, ${res.skipped} skipped${res.errors.length ? `\n${res.errors.join("\n")}` : ""}`);
                    load();
                  } catch (err) { alert((err as Error).message); }
                  e.target.value = "";
                }}
              />
            </label>
            <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-brand-light to-brand px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand/25"><Plus className="h-4 w-4" /> Add</button>
          </div>
        }
      />

      {error ? <ErrorCard message={error} onRetry={() => load()} /> : loading && items.length === 0 ? <SkeletonRows rows={6} /> : (
        <div className="space-y-2.5">
          {items.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-ink/5 bg-white p-4 shadow-sm">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-light to-brand font-bold text-white">{c.name.charAt(0)}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-ink">{c.name}</p>
                <p className="truncate text-xs text-muted">{c.phone ?? "—"} · {c.email ?? "—"} {c.group ? `· ${c.group.name}` : ""}</p>
                <p className="mt-0.5 text-[10px] text-muted">{c.source} · {c.segment} · {c.ordersCount} orders · {c.totalSpent} spent</p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${c.hasOutstandingCredit ? "bg-sun/20 text-[#b7791f]" : "bg-leaf/10 text-leaf"}`}>
                {c.hasOutstandingCredit ? `Owes ${c.openCredit}` : "No credit"}
              </span>
              <button onClick={() => openDetail(c.id)} className="rounded-full border border-ink/15 px-4 py-1.5 text-xs font-bold text-ink hover:border-brand hover:text-brand">View</button>
            </div>
          ))}
          {loading && <SkeletonRows rows={2} />}
          {cursor && <button onClick={() => load(cursor)} className="w-full rounded-full border border-ink/15 py-3 text-sm font-bold text-ink hover:border-brand hover:text-brand">Load more</button>}
          {!loading && items.length === 0 && <p className="py-10 text-center text-sm text-muted">No customers yet — POS/checkout create them automatically.</p>}
        </div>
      )}

      {open && (
        <Modal title="Add customer" onClose={() => setOpen(false)}>
          {submit.error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-500">{submit.error}</p>}
          <div className="space-y-3">
            <input value={cName} onChange={(e) => setCName(e.target.value)} placeholder="Full name" className={input} />
            <input value={cPhone} onChange={(e) => setCPhone(e.target.value)} placeholder="Phone" className={input} />
            <input value={cEmail} onChange={(e) => setCEmail(e.target.value)} placeholder="Email (optional)" className={input} />
          </div>
          <button onClick={create} disabled={submit.busy} className="mt-4 w-full rounded-full bg-forest py-3 text-sm font-bold text-white disabled:opacity-60">{submit.busy ? "Creating…" : "Create customer"}</button>
        </Modal>
      )}

      {detailId && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm" onClick={() => setDetailId(null)}>
          <div className="max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-extrabold text-ink">Customer detail</h3>
              <button onClick={() => setDetailId(null)} className="grid h-8 w-8 place-items-center rounded-lg text-ink/40 hover:bg-ink/5"><X className="h-5 w-5" /></button>
            </div>
            {!detail ? <div className="mt-4"><SkeletonRows rows={4} /></div> : (
              <div className="mt-4 space-y-5">
                <div>
                  <p className="font-display text-xl font-extrabold text-ink">{detail.customer.name}</p>
                  <p className="text-sm text-muted">{detail.customer.phone ?? "—"} · {detail.customer.email ?? "—"} {detail.customer.group ? `· ${detail.customer.group.name}` : ""}</p>
                  <p className={`mt-1 font-bold ${detail.customer.hasOutstandingCredit ? "text-[#b7791f]" : "text-leaf"}`}>
                    {detail.customer.hasOutstandingCredit ? `Open credit: ${detail.customer.openCredit}` : "No outstanding credit"}
                  </p>
                </div>

                {detail.customer.hasOutstandingCredit && (
                  <div className="rounded-xl bg-sun/10 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#b7791f]">Record repayment</p>
                    {repaySubmit.error && <p className="mt-1 text-xs font-medium text-red-500">{repaySubmit.error}</p>}
                    <div className="mt-2 flex gap-2">
                      <input value={repayAmt} onChange={(e) => setRepayAmt(e.target.value)} placeholder="Amount" className={input} />
                      <button onClick={repay} disabled={repaySubmit.busy} className="shrink-0 rounded-full bg-forest px-5 text-sm font-bold text-white disabled:opacity-60">{repaySubmit.busy ? "…" : "Repay"}</button>
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted">Repayment history</h4>
                  <div className="mt-2 space-y-1.5">
                    {detail.repayments.map((r) => (
                      <div key={r.id} className="flex items-center justify-between rounded-xl bg-cream px-4 py-2.5 text-sm">
                        <span className="font-semibold text-ink">{r.amount} <span className="text-xs text-muted">· {r.recordedByName}</span></span>
                        <span className="text-xs text-muted">{new Date(r.createdAt).toLocaleString()}</span>
                      </div>
                    ))}
                    {detail.repayments.length === 0 && <p className="py-2 text-center text-xs text-muted">No repayments yet.</p>}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted">Recent orders</h4>
                  <div className="mt-2 space-y-1.5">
                    {detail.recentOrders.map((o) => (
                      <div key={o.id} className="flex items-center justify-between rounded-xl bg-cream px-4 py-2.5 text-sm">
                        <div>
                          <p className="font-mono text-xs font-bold text-ink">{o.id}</p>
                          <p className="text-xs text-muted">{o.status} · {o.source} · {o.paymentMethod}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-ink">{o.total}</p>
                          {Number(o.balanceDue) > 0 && <p className="text-[10px] font-bold text-[#b7791f]">due {o.balanceDue}</p>}
                        </div>
                      </div>
                    ))}
                    {detail.recentOrders.length === 0 && <p className="py-2 text-center text-xs text-muted">No orders.</p>}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================ Bank accounts ============================ */

export function BankAccountsSection() {
  const list = useApi(() => bankAccountsService.list());
  const [open, setOpen] = useState(false);
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankName, setBankName] = useState("Guaranty Trust Bank");
  const [bankCode, setBankCode] = useState("058");
  const submit = useSubmit(() => { setOpen(false); list.refetch(); });

  const create = () => submit.run(async () => {
    if (accountNumber.replace(/\D/g, "").length !== 10) throw new Error("Enter a 10-digit NUBAN account number.");
    await bankAccountsService.create({
      accountName: accountName.trim() || undefined,
      accountNumber: accountNumber.replace(/\D/g, ""),
      bankName, bankCode,
    });
    setAccountName(""); setAccountNumber("");
  });

  const del = async (id: string) => { if (confirm("Delete this bank account?")) { try { await bankAccountsService.del(id); list.refetch(); } catch (e) { alert((e as Error).message); } } };

  const BANKS = [
    { n: "Guaranty Trust Bank", c: "058" }, { n: "Kuda Bank", c: "50211" },
    { n: "Access Bank", c: "044" }, { n: "Zenith Bank", c: "057" },
    { n: "First Bank", c: "011" }, { n: "UBA", c: "033" }, { n: "Opay", c: "999992" },
  ];

  return (
    <div className="space-y-5">
      <SectionHead
        title="Bank accounts"
        sub="Owner-only · resolved & masked by Paystack — the full number is never stored"
        action={
          <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-brand-light to-brand px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand/25">
            <Plus className="h-4 w-4" /> Add account
          </button>
        }
      />

      {list.loading ? <SkeletonRows rows={3} /> : list.error ? <ErrorCard message={list.error} onRetry={list.refetch} /> : (
        <div className="grid gap-4 sm:grid-cols-2">
          {(list.data?.bankAccounts ?? []).map((b) => (
            <div key={b.id} className="rounded-2xl border border-ink/5 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-pine/10 text-pine"><Wallet className="h-5 w-5" /></span>
                {b.isDefault && <span className="rounded-full bg-brand/10 px-2.5 py-1 text-[10px] font-bold text-brand">Default</span>}
              </div>
              <p className="mt-3 font-display text-lg font-extrabold text-ink">{b.accountName}</p>
              <p className="text-sm text-muted">{b.bankName} · {b.maskedAccountNumber}</p>
              <button onClick={() => del(b.id)} className="mt-3 rounded-full border border-red-200 px-3.5 py-1.5 text-xs font-bold text-red-400 hover:bg-red-50">Delete</button>
            </div>
          ))}
          {(list.data?.bankAccounts ?? []).length === 0 && <p className="py-8 text-center text-sm text-muted sm:col-span-2">No bank accounts — add one to receive withdrawals.</p>}
        </div>
      )}

      {open && (
        <Modal title="Add bank account" onClose={() => setOpen(false)}>
          {submit.error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-500">{submit.error}</p>}
          <div className="space-y-3">
            <input value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="Expected account name (typo guard, optional)" className={input} />
            <input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="10-digit NUBAN account number" className={`${input} font-mono`} inputMode="numeric" />
            <select value={bankName} onChange={(e) => { const b = BANKS.find((x) => x.n === e.target.value); setBankName(e.target.value); if (b) setBankCode(b.c); }} className={input}>
              {BANKS.map((b) => <option key={b.c}>{b.n}</option>)}
            </select>
          </div>
          <button onClick={create} disabled={submit.busy} className="mt-4 w-full rounded-full bg-forest py-3 text-sm font-bold text-white disabled:opacity-60">{submit.busy ? "Resolving…" : "Add & verify"}</button>
        </Modal>
      )}
    </div>
  );
}

/* ============================== Activity ============================== */

export function ActivitySection() {
  const [items, setItems] = useState<Awaited<ReturnType<typeof activityService.list>>["items"]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async (next?: string) => {
    setLoading(true); setError(null);
    try {
      const res = await activityService.list({ limit: 50, cursor: next ?? undefined });
      setItems((prev) => (next ? [...prev, ...res.items] : res.items));
      setCursor(res.nextCursor);
      setTotal(res.total);
    } catch (e) { setError((e as Error).message); }
    setLoading(false);
  };

  return (
    <div className="space-y-5">
      <SectionHead title="Activity log" sub={`Owner-only · ${total != null ? `${total} entries` : "append-only per-store trail"} · GET /api/dashboard/activity`} />

      {error ? <ErrorCard message={error} onRetry={() => load()} /> : loading && items.length === 0 ? <SkeletonRows rows={6} /> : (
        <div className="space-y-2">
          {items.map((a) => (
            <div key={a.id} className="flex items-start gap-3 rounded-2xl border border-ink/5 bg-white p-4 shadow-sm">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-cream text-sm">
                {a.action.startsWith("product") ? "📦" : a.action.startsWith("stock") ? "📊" : a.action.startsWith("staff") ? "👤" : a.action.startsWith("branch") ? "📍" : a.action.startsWith("catalog") ? "🏷️" : a.action.startsWith("campaign") ? "📣" : a.action.startsWith("customer") ? "👥" : "⚙️"}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-mono text-xs font-bold text-ink">{a.action}</p>
                <p className="mt-0.5 text-xs text-muted">{a.staffMemberId ? `staff ${a.staffMemberId}` : "owner/system"} · {new Date(a.createdAt).toLocaleString()}</p>
                {a.detail && Object.keys(a.detail).length > 0 && (
                  <pre className="mt-1.5 overflow-x-auto rounded-lg bg-cream px-3 py-2 text-[10px] text-ink/70">{JSON.stringify(a.detail, null, 2)}</pre>
                )}
              </div>
            </div>
          ))}
          {loading && <SkeletonRows rows={2} />}
          {cursor && <button onClick={() => load(cursor)} className="w-full rounded-full border border-ink/15 py-3 text-sm font-bold text-ink hover:border-brand hover:text-brand">Load more</button>}
          {!loading && items.length === 0 && <p className="py-10 text-center text-sm text-muted">No activity yet.</p>}
        </div>
      )}
    </div>
  );
}

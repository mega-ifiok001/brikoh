"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useInventory, stockOnHand, totalStock, fmtMoney } from "./lib";
import type { InvView } from "./InventoryApp";
import { AdjustModal } from "./ProductScreens";
import { ArrowLeft, Pencil, Copy, Trash, Plus, Truck, AlertCircle, Globe } from "@/components/icons";

const EVENT_META: Record<string, { label: string; tint: string }> = {
  initial: { label: "Opening stock", tint: "bg-pine/15 text-pine" },
  restock: { label: "Restock", tint: "bg-leaf/15 text-leaf" },
  sale: { label: "Sale", tint: "bg-brand/15 text-brand" },
  damage: { label: "Damage", tint: "bg-red-100 text-red-500" },
  correction: { label: "Correction", tint: "bg-sun/20 text-[#b7791f]" },
  transfer_out: { label: "Transfer out", tint: "bg-ink/10 text-muted" },
  transfer_in: { label: "Transfer in", tint: "bg-ink/10 text-muted" },
};

export default function ProductDetailView({ go, productId }: { go: (v: InvView) => void; productId: string }) {
  const { db, duplicateProduct, deleteProduct } = useInventory();
  const { business } = useAuth();
  const cur = business?.currency ?? "NGN";
  const [adjusting, setAdjusting] = useState(false);
  const [imgIdx, setImgIdx] = useState(0);
  const p = db.products.find((x) => x.id === productId);
  if (!p) return <p className="py-10 text-center text-muted">Product not found.</p>;
  const imgs = p.images && p.images.length > 0 ? p.images : [p.emoji];

  const history = db.events.filter((e) => e.productId === p.id).sort((a, b) => (a.at < b.at ? 1 : -1));
  const running: { event: (typeof history)[number]; balance: number }[] = [];
  let bal = 0;
  history.forEach((e) => { bal += e.delta; running.push({ event: e, balance: bal }); });
  const byBranch = db.branches.map((b) => ({ branch: b, stock: stockOnHand(db, p.id, b.id) }));

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <button onClick={() => go({ name: "products" })} className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-brand">
        <ArrowLeft className="h-4 w-4" /> Back to inventory
      </button>

      {/* header */}
      <div className="rounded-3xl border border-ink/5 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className="shrink-0">
            <span className="grid h-20 w-20 place-items-center rounded-2xl bg-cream text-4xl">{imgs[imgIdx]}</span>
            {imgs.length > 1 && (
              <div className="mt-2 flex gap-1.5">
                {imgs.map((im, i) => (
                  <button key={i} onClick={() => setImgIdx(i)} aria-label={`Photo ${i + 1}`} className={`grid h-8 w-8 place-items-center rounded-lg text-lg transition-all ${i === imgIdx ? "ring-2 ring-brand" : "bg-cream opacity-60 hover:opacity-100"}`}>
                    {im}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink">{p.name}</h2>
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${p.status === "active" ? "bg-leaf/15 text-leaf" : p.status === "draft" ? "bg-ink/10 text-muted" : "bg-red-100 text-red-500"}`}>{p.status}</span>
            </div>
            <p className="mt-1 text-sm text-muted">{p.id} · {p.category} · sold per {p.unit}</p>
            {p.description && <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">{p.description}</p>}
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              <span className="font-extrabold text-ink">{fmtMoney(cur, p.sellingPrice)}</span>
              {p.discountPrice != null && <span className="text-muted line-through">{fmtMoney(cur, p.discountPrice)}</span>}
              {p.costPrice != null && <span className="text-muted">Cost {fmtMoney(cur, p.costPrice)}</span>}
              {p.expiry && <span className="text-[#b7791f]">Expires {p.expiry}</span>}
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <span className="rounded-2xl bg-gradient-to-br from-forest to-pine px-5 py-3 text-center text-white">
              <span className="block font-display text-2xl font-extrabold">{totalStock(db, p.id)}</span>
              <span className="text-[10px] uppercase tracking-wider text-white/70">total {p.unit}</span>
            </span>
            <div className="flex flex-wrap justify-end gap-2">
              <button onClick={() => setAdjusting(true)} className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-brand-light to-brand px-4 py-2 text-xs font-bold text-white shadow-lg shadow-brand/25"><Plus className="h-3.5 w-3.5" /> Adjust stock</button>
              {business?.websiteLive && (
                <a href="#/storefront" className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-4 py-2 text-xs font-bold text-ink/70 transition-colors hover:border-brand hover:text-brand">
                  <Globe className="h-3.5 w-3.5" /> View on website
                </a>
              )}
              <button onClick={() => go({ name: "product-form", productId: p.id })} className="grid h-9 w-9 place-items-center rounded-full border border-ink/15 text-ink/60 hover:text-brand" aria-label="Edit"><Pencil className="h-4 w-4" /></button>
              <button onClick={() => { duplicateProduct(p.id); go({ name: "product-form" }); }} className="grid h-9 w-9 place-items-center rounded-full border border-ink/15 text-ink/60 hover:text-brand" aria-label="Duplicate"><Copy className="h-4 w-4" /></button>
              <button onClick={() => { deleteProduct(p.id); go({ name: "products" }); }} className="grid h-9 w-9 place-items-center rounded-full border border-ink/15 text-ink/60 hover:border-red-300 hover:text-red-500" aria-label="Delete"><Trash className="h-4 w-4" /></button>
            </div>
          </div>
        </div>

        {/* branch stock */}
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {byBranch.map(({ branch, stock }) => (
            <div key={branch.id} className="rounded-2xl bg-cream p-4">
              <p className="flex items-center gap-1.5 text-xs font-medium text-muted"><Truck className="h-3.5 w-3.5" /> {branch.name}</p>
              <p className={`mt-1 font-display text-xl font-extrabold ${stock === 0 ? "text-red-500" : stock <= p.threshold ? "text-[#b7791f]" : "text-forest"}`}>{stock}</p>
              {stock <= p.threshold && <p className="mt-0.5 flex items-center gap-1 text-[11px] font-bold text-brand"><AlertCircle className="h-3 w-3" /> Low stock</p>}
            </div>
          ))}
        </div>
      </div>

      {/* stock history timeline */}
      <div className="rounded-3xl border border-ink/5 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-lg font-extrabold text-ink">Stock history</h3>
            <p className="text-xs text-muted">Every change is logged — current stock is the running total below.</p>
          </div>
          <button onClick={() => setAdjusting(true)} className="inline-flex items-center gap-1 rounded-full bg-pine/10 px-3.5 py-1.5 text-xs font-bold text-pine hover:bg-pine/20"><Plus className="h-3.5 w-3.5" /> Restock</button>
        </div>

        <div className="relative mt-6">
          <div className="absolute bottom-2 left-[1.1rem] top-2 w-px bg-ink/10" />
          <div className="space-y-4">
            {running.map(({ event, balance }) => {
              const meta = EVENT_META[event.type];
              const branch = db.branches.find((b) => b.id === event.branchId)?.name ?? "—";
              return (
                <div key={event.id} className="relative flex gap-4 pl-0">
                  <span className={`relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-extrabold ${meta.tint}`}>
                    {event.delta > 0 ? "+" : "−"}
                  </span>
                  <div className="min-w-0 flex-1 rounded-xl bg-cream px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-bold text-ink">
                        {meta.label} <span className={`font-extrabold ${event.delta > 0 ? "text-leaf" : "text-red-500"}`}>{event.delta > 0 ? "+" : ""}{event.delta}</span>
                      </p>
                      <span className="text-xs font-bold text-forest">Balance: {balance}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted">
                      {new Date(event.at).toLocaleString()} · {branch} · {event.note} · by {event.user}
                    </p>
                  </div>
                </div>
              );
            })}
            {history.length === 0 && <p className="py-6 text-center text-sm text-muted">No stock events yet.</p>}
          </div>
        </div>
        <p className="mt-4 text-center text-[11px] text-muted">Stock quantity is never edited directly — every screen above just logs a new history entry.</p>
      </div>

      {adjusting && <AdjustModal productId={p.id} onClose={() => setAdjusting(false)} />}
    </div>
  );
}

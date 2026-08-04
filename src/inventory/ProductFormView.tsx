"use client";

import { useState } from "react";
import { useInventory } from "./lib";
import type { InvView } from "./InventoryApp";
import { ArrowLeft, Plus, Trash, Image as ImageIcon, CheckCircle } from "@/components/icons";

const EMOJIS = ["📦", "👗", "👜", "👟", "🧣", "🧴", "☕", "🍔", "🏠", "📱", "💍", "🧺", "🪭", "🧪"];

export default function ProductFormView({ go, productId }: { go: (v: InvView) => void; productId?: string }) {
  const { db, addProduct, updateProduct } = useInventory();
  const editing = productId ? db.products.find((p) => p.id === productId) : undefined;

  const [name, setName] = useState(editing?.name ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [category, setCategory] = useState(editing?.category ?? db.categories[0] ?? "");
  const [unit, setUnit] = useState(editing?.unit ?? db.units[0] ?? "");
  const [costPrice, setCostPrice] = useState(editing?.costPrice?.toString() ?? "");
  const [sellingPrice, setSellingPrice] = useState(editing?.sellingPrice?.toString() ?? "");
  const [discountPrice, setDiscountPrice] = useState(editing?.discountPrice?.toString() ?? "");
  const [threshold, setThreshold] = useState(editing?.threshold.toString() ?? "10");
  const [expiry, setExpiry] = useState(editing?.expiry ?? "");
  const [emoji, setEmoji] = useState(editing?.emoji ?? "📦");
  const [startingStock, setStartingStock] = useState("");
  const [photos, setPhotos] = useState<string[]>(editing ? [emoji] : []);
  const [variants, setVariants] = useState(editing?.variants ?? []);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);

  const canPublish = name.trim().length > 1 && category && unit && Number(sellingPrice) > 0 && photos.length > 0;

  const save = (status: "draft" | "active") => {
    setErr("");
    if (status === "active" && !canPublish) {
      setErr("To publish you need: name, category, unit, selling price and at least one photo. Draft only needs a name.");
      return;
    }
    const data = {
      name: name.trim(),
      description: description.trim(),
      category,
      unit,
      costPrice: costPrice ? Number(costPrice) : null,
      sellingPrice: Number(sellingPrice) || 0,
      discountPrice: discountPrice ? Number(discountPrice) : null,
      threshold: Number(threshold) || 0,
      expiry: expiry || null,
      emoji: photos[0] || emoji,
      images: photos.length > 0 ? photos : [emoji],
      variants,
      status,
    };
    if (editing) {
      updateProduct(editing.id, data);
    } else {
      const p = addProduct(data, Number(startingStock) || 0);
      setDone(true);
      setTimeout(() => go({ name: "product-detail", productId: p.id }), 900);
      return;
    }
    setDone(true);
    setTimeout(() => go({ name: "products" }), 900);
  };

  const addVariant = () => setVariants((v) => [...v, { id: `V${Math.random().toString(36).slice(2, 6)}`, name: "", price: Number(sellingPrice) || 0, stock: 0 }]);

  if (done) {
    return (
      <div className="flex flex-col items-center py-20 text-center">
        <span className="grid h-16 w-16 animate-pop place-items-center rounded-full bg-leaf/15 text-leaf"><CheckCircle className="h-8 w-8" /></span>
        <h2 className="mt-5 font-display text-2xl font-extrabold text-ink">{editing ? "Product updated" : "Product created"}</h2>
        <p className="mt-2 text-sm text-muted">Stock was recorded as an initial stock event in history.</p>
      </div>
    );
  }

  const input = "w-full rounded-xl border border-ink/10 bg-white px-4 py-3 text-[15px] text-ink outline-none transition-all focus:border-brand focus:ring-4 focus:ring-brand/10";

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <button onClick={() => go({ name: "products" })} className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-brand">
        <ArrowLeft className="h-4 w-4" /> Back to inventory
      </button>
      <div>
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink">
          {editing ? `Edit ${editing.name}` : "Add a new product"}
        </h2>
        <p className="mt-1 text-sm text-muted">
          {editing ? "Changes update the product; stock is only changed via adjustments, sales & restocks." : "Stock you enter here becomes the opening stock — logged to history."}
        </p>
      </div>

      <div className="rounded-3xl border border-ink/5 bg-white p-6 shadow-sm sm:p-8">
        {err && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{err}</div>}

        {/* photos */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="block text-sm font-semibold text-ink">Product photo(s) <span className="text-red-500">*</span></label>
            <span className="rounded-full bg-pine/10 px-2.5 py-1 text-[10px] font-bold text-pine">{photos.length} photo{photos.length === 1 ? "" : "s"} · first = cover</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {photos.map((ph, i) => (
              <div key={i} className="relative">
                <div className={`grid h-20 w-20 place-items-center rounded-2xl bg-cream text-3xl ${i === 0 ? "ring-2 ring-brand ring-offset-2 ring-offset-white" : "ring-1 ring-ink/10"}`}>
                  {ph}
                </div>
                {i === 0 ? (
                  <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-brand px-2 py-0.5 text-[9px] font-bold text-white shadow">COVER</span>
                ) : (
                  <>
                    <button onClick={() => setPhotos((p) => { const copy = [...p]; const [m] = copy.splice(i, 1); return [m, ...copy]; })} className="absolute -left-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-forest text-[9px] font-bold text-white shadow" title="Make cover">★</button>
                    <button onClick={() => setPhotos((p) => p.filter((_, j) => j !== i))} className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-red-500 text-white shadow" title="Remove photo" aria-label="Remove">✕</button>
                  </>
                )}
              </div>
            ))}
            <div className="relative h-20 w-20">
              <div className="grid h-20 w-20 place-items-center rounded-2xl border-2 border-dashed border-ink/15 text-muted">
                <ImageIcon className="h-6 w-6" />
              </div>
              <div className="absolute inset-0 grid place-items-center overflow-hidden rounded-2xl">
                <div className="grid max-h-20 grid-cols-3 gap-0.5 p-1">
                  {EMOJIS.map((e) => (
                    <button key={e} onClick={() => { setPhotos((p) => [...p, e]); if (photos.length === 0) setEmoji(e); }} className="grid h-6 w-6 place-items-center rounded-md bg-white text-sm shadow-sm ring-1 ring-ink/5 hover:ring-brand">{e}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <p className="mt-4 text-[11px] text-muted">Add multiple photos — the first one is the cover shown on your website. Tap ★ to change the cover, ✕ to remove.</p>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-semibold text-ink">Product name <span className="text-red-500">*</span></label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Embroidered Ankara Gown" className={input} />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-semibold text-ink">Description (optional)</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Colour, material, sizing notes…" className={`${input} resize-none`} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink">Category <span className="text-red-500">*</span></label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={input}>
              {db.categories.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink">Unit <span className="text-red-500">*</span></label>
            <select value={unit} onChange={(e) => setUnit(e.target.value)} className={input}>
              {db.units.map((u) => <option key={u}>{u}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink">Cost price (optional)</label>
            <input type="number" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} placeholder="0.00" className={input} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink">Selling price <span className="text-red-500">*</span></label>
            <input type="number" value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} placeholder="0.00" className={input} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink">Discount price (optional)</label>
            <input type="number" value={discountPrice} onChange={(e) => setDiscountPrice(e.target.value)} placeholder="0.00" className={input} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ink">Low-stock alert</label>
              <input type="number" value={threshold} onChange={(e) => setThreshold(e.target.value)} className={input} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ink">Expiry (optional)</label>
              <input type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} className={input} />
            </div>
          </div>
          {!editing && (
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-semibold text-ink">Starting stock quantity</label>
              <input type="number" value={startingStock} onChange={(e) => setStartingStock(e.target.value)} placeholder="0" className={input} />
              <p className="mt-1.5 text-xs text-muted">This creates an "opening stock" event in stock history — stock is never edited directly.</p>
            </div>
          )}
        </div>

        {/* variants */}
        <div className="mt-7 border-t border-ink/5 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-base font-bold text-ink">Variants (optional)</h3>
              <p className="text-xs text-muted">e.g. sizes or colours — each with its own stock</p>
            </div>
            <button onClick={addVariant} className="inline-flex items-center gap-1 rounded-full bg-pine/10 px-3.5 py-1.5 text-xs font-bold text-pine hover:bg-pine/20">
              <Plus className="h-3.5 w-3.5" /> Add variant
            </button>
          </div>
          {variants.length > 0 && (
            <div className="mt-4 space-y-2.5">
              {variants.map((v, i) => (
                <div key={v.id} className="flex items-center gap-2.5">
                  <input value={v.name} onChange={(e) => setVariants((vs) => vs.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} placeholder={`Variant ${i + 1} name (e.g. Small)`} className="flex-1 rounded-xl border border-ink/10 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand" />
                  <input type="number" value={v.price || ""} onChange={(e) => setVariants((vs) => vs.map((x, j) => (j === i ? { ...x, price: Number(e.target.value) } : x)))} placeholder="Price" className="w-24 rounded-xl border border-ink/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand" />
                  <input type="number" value={v.stock || ""} onChange={(e) => setVariants((vs) => vs.map((x, j) => (j === i ? { ...x, stock: Number(e.target.value) } : x)))} placeholder="Stock" className="w-20 rounded-xl border border-ink/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand" />
                  <button onClick={() => setVariants((vs) => vs.filter((_, j) => j !== i))} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-ink/40 hover:bg-red-50 hover:text-red-500" aria-label="Remove variant"><Trash className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* actions */}
        <div className="mt-8 flex flex-col gap-3 border-t border-ink/5 pt-6 sm:flex-row sm:justify-end">
          <button onClick={() => save("draft")} className="rounded-full border border-ink/15 px-6 py-3 text-sm font-semibold text-ink transition-colors hover:border-brand hover:text-brand">
            Save as draft
          </button>
          <button onClick={() => save("active")} className="rounded-full bg-gradient-to-br from-brand-light to-brand px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/25 transition-transform hover:-translate-y-0.5 disabled:opacity-50">
            Publish product
          </button>
        </div>
        <p className="mt-3 text-center text-xs text-muted">Publishing requires name, category, unit, selling price and a photo.</p>
      </div>
    </div>
  );
}

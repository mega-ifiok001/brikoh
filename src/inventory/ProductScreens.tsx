"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useInventory, totalStock, fmtMoney, stockOnHand } from "./lib";
import type { InvView } from "./InventoryApp";
import { Search, Plus, Pencil, Trash, Copy, ArrowUpRight, Box } from "@/components/icons";

const STATUS: Record<string, string> = {
  active: "bg-leaf/15 text-leaf",
  draft: "bg-ink/10 text-muted",
  archived: "bg-red-100 text-red-500",
};

export default function ProductsList({ go }: { go: (v: InvView) => void }) {
  const { db, duplicateProduct, deleteProduct } = useInventory();
  const { business } = useAuth();
  const cur = business?.currency ?? "NGN";
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState<"name" | "stock" | "price">("name");
  const [sel, setSel] = useState<string[]>([]);

  const query = q.trim().toLowerCase();
  const live = db.products.filter((p) => p.status !== "archived");
  const cats = [...new Set(db.products.map((p) => p.category))];

  let list = live.filter((p) => (cat === "all" || p.category === cat) && (status === "all" || p.status === status) && (!query || p.name.toLowerCase().includes(query) || p.id.toLowerCase().includes(query)));
  list = [...list].sort((a, b) => {
    if (sort === "name") return a.name.localeCompare(b.name);
    if (sort === "price") return a.sellingPrice - b.sellingPrice;
    return totalStock(db, a.id) - totalStock(db, b.id);
  });

  const toggle = (id: string) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink">Inventory</h2>
          <p className="mt-1 text-sm text-muted">
            {live.length} products · stock is calculated from the history log — never edited directly.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => go({ name: "bulk-upload" })} className="rounded-full border border-ink/15 bg-white px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-brand hover:text-brand">
            Bulk upload
          </button>
          <button onClick={() => go({ name: "product-form" })} className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-brand-light to-brand px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand/25 transition-transform hover:-translate-y-0.5">
            <Plus className="h-4 w-4" /> Add product
          </button>
        </div>
      </div>

      {/* toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-ink/5 bg-white p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/35" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or SKU…" className="w-full rounded-xl border border-ink/10 bg-cream py-2.5 pl-10 pr-4 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand/10" />
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={cat} onChange={(e) => setCat(e.target.value)} className="rounded-xl border border-ink/10 bg-cream px-3 py-2.5 text-sm font-medium text-ink outline-none">
            <option value="all">All categories</option>
            {cats.map((c) => <option key={c}>{c}</option>)}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-xl border border-ink/10 bg-cream px-3 py-2.5 text-sm font-medium text-ink outline-none">
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="rounded-xl border border-ink/10 bg-cream px-3 py-2.5 text-sm font-medium text-ink outline-none">
            <option value="name">Sort: Name</option>
            <option value="price">Sort: Price</option>
            <option value="stock">Sort: Stock</option>
          </select>
        </div>
      </div>

      {/* bulk bar */}
      {sel.length > 0 && (
        <div className="flex items-center justify-between rounded-2xl bg-forest px-5 py-3 text-white">
          <p className="text-sm font-semibold">{sel.length} selected</p>
          <div className="flex gap-2">
            <button onClick={() => { sel.forEach((id) => duplicateProduct(id)); setSel([]); }} className="rounded-full bg-white/15 px-4 py-1.5 text-xs font-bold hover:bg-white/25">Duplicate</button>
            <button onClick={() => { sel.forEach((id) => deleteProduct(id)); setSel([]); }} className="rounded-full bg-red-500/80 px-4 py-1.5 text-xs font-bold hover:bg-red-500">Delete</button>
            <button onClick={() => setSel([])} className="rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold">Cancel</button>
          </div>
        </div>
      )}

      {/* table */}
      <div className="overflow-hidden rounded-2xl border border-ink/5 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="tbl-mobile w-full text-left">
            <thead>
              <tr className="border-b border-ink/5 text-[11px] font-bold uppercase tracking-wider text-muted">
                <th className="px-5 py-4 w-10">
                  <input type="checkbox" className="h-4 w-4 accent-brand" checked={sel.length === list.length && list.length > 0} onChange={() => setSel(sel.length === list.length ? [] : list.map((p) => p.id))} />
                </th>
                <th className="px-5 py-4">Product</th>
                <th className="px-5 py-4">Category</th>
                <th className="px-5 py-4">Cost</th>
                <th className="px-5 py-4">Selling</th>
                <th className="px-5 py-4">Stock</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => {
                const st = totalStock(db, p.id);
                return (
                  <tr key={p.id} className="border-b border-ink/5 text-sm last:border-0 hover:bg-cream/50">
                    <td data-label="" className="px-5 py-3.5">
                      <input type="checkbox" className="h-4 w-4 accent-brand" checked={sel.includes(p.id)} onChange={() => toggle(p.id)} />
                    </td>
                    <td data-label="Product" className="px-5 py-3.5">
                      <button onClick={() => go({ name: "product-detail", productId: p.id })} className="flex items-center gap-3 text-left">
                        <span className="grid h-10 w-10 place-items-center rounded-xl bg-cream text-lg">{p.emoji}</span>
                        <span>
                          <span className="block font-bold text-ink hover:text-brand">{p.name}</span>
                          <span className="block text-xs text-muted">{p.id}</span>
                        </span>
                      </button>
                    </td>
                    <td data-label="Category" className="px-5 py-3.5 text-muted">{p.category}</td>
                    <td data-label="Cost" className="px-5 py-3.5 text-muted">{p.costPrice != null ? fmtMoney(cur, p.costPrice) : "—"}</td>
                    <td data-label="Selling" className="px-5 py-3.5 font-extrabold text-ink">{fmtMoney(cur, p.sellingPrice)}</td>
                    <td data-label="Stock" className={`px-5 py-3.5 font-extrabold ${st === 0 ? "text-red-500" : st <= p.threshold ? "text-[#b7791f]" : "text-forest"}`}>{st}</td>
                    <td data-label="Status" className="px-5 py-3.5">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${STATUS[p.status]}`}>{p.status}</span>
                    </td>
                    <td data-label="" className="px-5 py-3.5">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => go({ name: "product-detail", productId: p.id })} className="grid h-8 w-8 place-items-center rounded-lg text-ink/40 hover:bg-ink/5 hover:text-ink" aria-label="View"><ArrowUpRight className="h-4 w-4" /></button>
                        <button onClick={() => go({ name: "product-form", productId: p.id })} className="grid h-8 w-8 place-items-center rounded-lg text-ink/40 hover:bg-ink/5 hover:text-ink" aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => duplicateProduct(p.id)} className="grid h-8 w-8 place-items-center rounded-lg text-ink/40 hover:bg-ink/5 hover:text-ink" aria-label="Duplicate"><Copy className="h-4 w-4" /></button>
                        <button onClick={() => deleteProduct(p.id)} className="grid h-8 w-8 place-items-center rounded-lg text-ink/40 hover:bg-red-50 hover:text-red-500" aria-label="Delete"><Trash className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {list.length === 0 && (
                <tr><td colSpan={8} className="px-5 py-12 text-center text-sm text-muted">No products match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="flex items-center gap-1.5 text-xs text-muted">
        <Box className="h-3.5 w-3.5" /> Deleting a product is a soft-delete — sales history is always preserved.
      </p>
    </div>
  );
}

/* Stock adjustment modal used by detail + list */
export function AdjustModal({
  productId,
  onClose,
  after,
}: {
  productId: string;
  onClose: () => void;
  after?: () => void;
}) {
  const { db, restock, adjustStock } = useInventory();
  const p = db.products.find((x) => x.id === productId);
  const [type, setType] = useState<"restock" | "damage" | "correction">("restock");
  const [branchId, setBranchId] = useState(db.branches[0]?.id ?? "");
  const [supplierId, setSupplierId] = useState("");
  const [qty, setQty] = useState("");
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");

  if (!p) return null;
  const current = stockOnHand(db, p.id, branchId);
  const n = Number(qty);

  const submit = () => {
    setErr("");
    if (!n || n <= 0) return setErr("Enter a quantity greater than zero.");
    if (type === "correction") {
      adjustStock(p.id, undefined, branchId, "correction", n, note || `Corrected to ${n}`);
    } else if (type === "damage") {
      if (n > current) return setErr("Damage cannot exceed current stock.");
      adjustStock(p.id, undefined, branchId, "damage", n, note);
    } else {
      restock(p.id, undefined, branchId, n, supplierId || undefined, note);
    }
    after?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-extrabold text-ink">Adjust stock</h3>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-ink/40 hover:bg-ink/5">✕</button>
        </div>
        <div className="mt-3 flex items-center gap-3 rounded-xl bg-cream p-3">
          <span className="text-2xl">{p.emoji}</span>
          <div>
            <p className="text-sm font-bold text-ink">{p.name}</p>
            <p className="text-xs text-muted">Current: <span className="font-bold text-forest">{current}</span> {p.unit}</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {(["restock", "damage", "correction"] as const).map((t) => (
            <button key={t} onClick={() => { setType(t); setErr(""); }} className={`rounded-xl border-2 py-2.5 text-sm font-bold capitalize transition-all ${type === t ? "border-brand bg-brand/[0.06] text-brand" : "border-ink/8 text-muted hover:border-brand/40"}`}>
              {t}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink">Branch</label>
              <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="w-full rounded-xl border border-ink/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand">
                {db.branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink">Quantity</label>
              <input type="number" min={1} value={qty} onChange={(e) => setQty(e.target.value)} placeholder="0" className="w-full rounded-xl border border-ink/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand/10" />
            </div>
          </div>
          {type === "restock" && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink">Supplier (optional)</label>
              <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="w-full rounded-xl border border-ink/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand">
                <option value="">No supplier</option>
                {db.suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink">Note / reason</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder={type === "restock" ? "e.g. Supplier delivery arrived" : "e.g. Broken items found"} className="w-full rounded-xl border border-ink/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand/10" />
          </div>
          {err && <p className="text-xs font-medium text-red-500">{err}</p>}
          {type === "correction" && (
            <p className="text-xs text-muted">Enter the new correct quantity. A correction event will log the difference.</p>
          )}
        </div>

        <div className="mt-5 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-full border border-ink/15 py-2.5 text-sm font-semibold text-muted hover:text-ink">Cancel</button>
          <button onClick={submit} className="flex-1 rounded-full bg-gradient-to-br from-brand-light to-brand py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand/25">
            {type === "restock" ? "Restock" : type === "damage" ? "Log damage" : "Apply correction"}
          </button>
        </div>
        <p className="mt-3 text-center text-[11px] text-muted">This will be recorded in the product's stock history.</p>
      </div>
    </div>
  );
}

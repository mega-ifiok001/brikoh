"use client";

import { useState } from "react";
import { useInventory, stockOnHand } from "./lib";
import { ArrowRightLeft, CheckCircle } from "@/components/icons";

export default function TransfersView() {
  const { db, transfer } = useInventory();
  const [productId, setProductId] = useState(db.products[0]?.id ?? "");
  const [from, setFrom] = useState(db.branches[0]?.id ?? "");
  const [to, setTo] = useState(db.branches[1]?.id ?? db.branches[0]?.id ?? "");
  const [qty, setQty] = useState("");
  const [err, setErr] = useState("");
  const [ok, setOk] = useState(false);

  const product = db.products.find((p) => p.id === productId);
  const available = product ? stockOnHand(db, product.id, from) : 0;
  const n = Number(qty);

  const submit = () => {
    setErr("");
    setOk(false);
    if (!product) return setErr("Select a product.");
    if (from === to) return setErr("Source and destination must be different.");
    if (!n || n <= 0) return setErr("Enter a quantity greater than zero.");
    if (n > available) return setErr(`Not enough stock in source branch — only ${available} available.`);
    transfer(product.id, undefined, from, to, n);
    setQty("");
    setOk(true);
    setTimeout(() => setOk(false), 3000);
  };

  const history = db.events.filter((e) => e.type === "transfer_out" || e.type === "transfer_in").slice(0, 8);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink">Stock transfer</h2>
        <p className="mt-1 text-sm text-muted">Move stock between branches — both branches update instantly and it's logged to history.</p>
      </div>

      <div className="rounded-3xl border border-ink/5 bg-white p-6 shadow-sm sm:p-8">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-semibold text-ink">Product</label>
            <select value={productId} onChange={(e) => setProductId(e.target.value)} className="w-full rounded-xl border border-ink/10 bg-white px-4 py-3 text-[15px] outline-none focus:border-brand">
              {db.products.filter((p) => p.status !== "archived").map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink">From branch</label>
            <select value={from} onChange={(e) => setFrom(e.target.value)} className="w-full rounded-xl border border-ink/10 bg-white px-4 py-3 text-[15px] outline-none focus:border-brand">
              {db.branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <p className="mt-1.5 text-xs text-muted">Available here: <span className="font-bold text-forest">{available}</span></p>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink">To branch</label>
            <select value={to} onChange={(e) => setTo(e.target.value)} className="w-full rounded-xl border border-ink/10 bg-white px-4 py-3 text-[15px] outline-none focus:border-brand">
              {db.branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-semibold text-ink">Quantity</label>
            <input type="number" min={1} value={qty} onChange={(e) => setQty(e.target.value)} placeholder="0" className="w-full rounded-xl border border-ink/10 bg-white px-4 py-3 text-[15px] outline-none focus:border-brand focus:ring-4 focus:ring-brand/10" />
            {err && <p className="mt-2 text-xs font-medium text-red-500">{err}</p>}
            {ok && <p className="mt-2 flex items-center gap-1.5 text-xs font-bold text-leaf"><CheckCircle className="h-4 w-4" /> Transfer complete — both branches updated.</p>}
          </div>
        </div>
        <button onClick={submit} className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-brand-light to-brand px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/25 transition-transform hover:-translate-y-0.5">
          <ArrowRightLeft className="h-4 w-4" /> Transfer stock
        </button>
      </div>

      {/* recent transfers */}
      <div className="rounded-3xl border border-ink/5 bg-white p-6 shadow-sm sm:p-8">
        <h3 className="font-display text-lg font-extrabold text-ink">Recent transfers</h3>
        <div className="mt-4 space-y-2">
          {history.map((e) => {
            const p = db.products.find((x) => x.id === e.productId);
            return (
              <div key={e.id} className="flex items-center gap-3 rounded-xl bg-cream px-4 py-3 text-sm">
                <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-extrabold ${e.type === "transfer_in" ? "bg-leaf/15 text-leaf" : "bg-brand/15 text-brand"}`}>
                  {e.type === "transfer_in" ? "+" : "−"}
                </span>
                <span className="font-semibold text-ink">{p?.name ?? e.productId}</span>
                <span className="text-muted">{e.note}</span>
                <span className="ml-auto text-xs text-muted">{new Date(e.at).toLocaleDateString()}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

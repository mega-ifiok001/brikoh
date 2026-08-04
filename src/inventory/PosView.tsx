"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useInventory, totalStock, fmtMoney } from "./lib";
import { Search, Trash, Printer, CheckCircle, QrCode } from "@/components/icons";

type CartItem = { productId: string; name: string; emoji: string; price: number; qty: number; unit: string };

export default function PosView() {
  const { db, recordSale } = useInventory();
  const { business } = useAuth();
  const cur = business?.currency ?? "NGN";
  const [q, setQ] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [method, setMethod] = useState<"cash" | "transfer" | "card" | "credit">("cash");
  const [discount, setDiscount] = useState("");
  const [err, setErr] = useState("");
  const [receipt, setReceipt] = useState<ReturnType<typeof recordSale> | null>(null);

  const query = q.trim().toLowerCase();
  const live = db.products.filter((p) => p.status === "active");
  const results = query ? live.filter((p) => p.name.toLowerCase().includes(query)) : live.slice(0, 12);

  const inCart = (id: string) => cart.find((c) => c.productId === id);

  const add = (id: string) => {
    const p = db.products.find((x) => x.id === id);
    if (!p) return;
    setErr("");
    const have = inCart(id)?.qty ?? 0;
    const available = totalStock(db, id);
    if (have + 1 > available) { setErr(`Only ${available} in stock — cannot add more. (Overselling is disabled.)`); return; }
    setCart((c) => c.some((x) => x.productId === id) ? c.map((x) => (x.productId === id ? { ...x, qty: x.qty + 1 } : x)) : [...c, { productId: id, name: p.name, emoji: p.emoji, price: p.sellingPrice, qty: 1, unit: p.unit }]);
  };

  const setQty = (id: string, n: number) => {
    setErr("");
    const p = db.products.find((x) => x.id === id);
    if (!p) return;
    const available = totalStock(db, id);
    if (n > available) { setErr(`Only ${available} in stock for ${p.name}.`); return; }
    setCart((c) => c.map((x) => (x.productId === id ? { ...x, qty: Math.max(0, n) } : x)).filter((x) => x.qty > 0));
  };

  const subtotal = cart.reduce((s, i) => s + i.qty * i.price, 0);
  const disc = discount ? Math.min(Number(discount) || 0, subtotal) : 0;
  const total = Math.max(0, subtotal - disc);
  const customer = db.customers.find((c) => c.id === customerId);

  const pay = () => {
    setErr("");
    if (cart.length === 0) return setErr("Add at least one product.");
    if (method === "credit" && !customerId) return setErr("Select a customer for a credit sale.");
    const sale = recordSale({
      customerId: customerId || null,
      customerName: customer?.name ?? "Walk-in customer",
      branchId: db.branches[0].id,
      items: cart.map((c) => ({ productId: c.productId, name: c.name, qty: c.qty, price: c.price })),
      subtotal, discount: disc, total,
      method, paid: method === "credit" ? 0 : total,
    });
    setReceipt(sale);
    setCart([]); setDiscount(""); setQ("");
  };

  if (receipt) {
    return (
      <div className="mx-auto max-w-md">
        <div className="rounded-3xl border border-ink/5 bg-white p-8 text-center shadow-sm">
          <span className="grid h-16 w-16 mx-auto animate-pop place-items-center rounded-full bg-leaf/15 text-leaf"><CheckCircle className="h-8 w-8" /></span>
          <h2 className="mt-5 font-display text-2xl font-extrabold text-ink">Sale recorded</h2>
          <p className="mt-1 text-sm text-muted">#{receipt.id} · {new Date(receipt.at).toLocaleString()}</p>
          <div className="mt-6 rounded-2xl bg-cream p-5 text-left">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">Receipt</p>
            <div className="mt-3 space-y-2">
              {receipt.items.map((it) => (
                <div key={it.productId} className="flex justify-between text-sm">
                  <span className="text-ink/80">{it.name} × {it.qty}</span>
                  <span className="font-semibold text-ink">{fmtMoney(cur, it.qty * it.price)}</span>
                </div>
              ))}
              {receipt.discount > 0 && <div className="flex justify-between text-sm text-leaf"><span>Discount</span><span>−{fmtMoney(cur, receipt.discount)}</span></div>}
              <div className="flex justify-between border-t border-ink/10 pt-2 font-extrabold text-ink"><span>Total</span><span>{fmtMoney(cur, receipt.total)}</span></div>
              <div className="flex justify-between text-xs text-muted"><span>Paid</span><span>{receipt.method === "credit" ? "Credit (owing)" : fmtMoney(cur, receipt.paid)}</span></div>
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <button onClick={() => setReceipt(null)} className="flex-1 rounded-full bg-forest px-5 py-3 text-sm font-semibold text-white">New sale</button>
            <button className="grid h-11 w-11 place-items-center rounded-full border border-ink/15 text-ink/60 hover:text-brand" aria-label="Print"><Printer className="h-5 w-5" /></button>
          </div>
          <p className="mt-4 text-[11px] text-muted">Stock was updated automatically and logged to history.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      {/* products */}
      <div className="rounded-3xl border border-ink/5 bg-white p-5 shadow-sm sm:p-6">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/35" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products to add…" className="w-full rounded-xl border border-ink/10 bg-cream py-3 pl-10 pr-4 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand/10" />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {results.map((p) => {
            const st = totalStock(db, p.id);
            return (
              <button key={p.id} onClick={() => add(p.id)} disabled={st === 0} className={`rounded-2xl border p-4 text-left transition-all ${st === 0 ? "cursor-not-allowed border-ink/5 bg-cream/50 opacity-50" : "border-ink/8 bg-white hover:-translate-y-0.5 hover:border-brand hover:shadow-lg hover:shadow-forest/10"}`}>
                <span className="text-2xl">{p.emoji}</span>
                <p className="mt-2 truncate text-sm font-bold text-ink">{p.name}</p>
                <p className="mt-0.5 text-xs text-muted">{fmtMoney(cur, p.sellingPrice)} · {st} left</p>
                {inCart(p.id) && <p className="mt-1.5 text-[11px] font-bold text-brand">In cart: {inCart(p.id)?.qty}</p>}
              </button>
            );
          })}
        </div>
        <p className="mt-4 flex items-center gap-1.5 text-xs text-muted"><QrCode className="h-4 w-4" /> Tip: barcode scanning & physical POS coming to the app.</p>
      </div>

      {/* cart */}
      <div className="rounded-3xl border border-ink/5 bg-white p-5 shadow-sm sm:p-6 lg:sticky lg:top-24 lg:self-start">
        <h3 className="font-display text-lg font-extrabold text-ink">New sale</h3>
        {err && <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-500">{err}</p>}

        <div className="mt-4 space-y-2.5">
          {cart.length === 0 && <p className="py-8 text-center text-sm text-muted">Cart is empty — tap a product to add it.</p>}
          {cart.map((c) => (
            <div key={c.productId} className="flex items-center gap-3 rounded-xl bg-cream p-3">
              <span className="text-xl">{c.emoji}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-ink">{c.name}</p>
                <p className="text-xs text-muted">{fmtMoney(cur, c.price)} each</p>
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={() => setQty(c.productId, c.qty - 1)} className="grid h-7 w-7 place-items-center rounded-lg bg-white text-sm font-bold shadow-sm">−</button>
                <span className="w-7 text-center text-sm font-bold text-ink">{c.qty}</span>
                <button onClick={() => setQty(c.productId, c.qty + 1)} className="grid h-7 w-7 place-items-center rounded-lg bg-white text-sm font-bold shadow-sm">+</button>
              </div>
              <span className="w-16 text-right text-sm font-extrabold text-ink">{fmtMoney(cur, c.qty * c.price)}</span>
              <button onClick={() => setCart((x) => x.filter((y) => y.productId !== c.productId))} className="grid h-7 w-7 place-items-center rounded-lg text-ink/40 hover:bg-red-50 hover:text-red-500" aria-label="Remove"><Trash className="h-3.5 w-3.5" /></button>
            </div>
          ))}
        </div>

        <div className="mt-5 space-y-3">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink">Customer (optional)</label>
            <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="w-full rounded-xl border border-ink/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand">
              <option value="">Walk-in customer</option>
              {db.customers.map((c) => <option key={c.id} value={c.id}>{c.name} {c.phone ? `· ${c.phone}` : ""}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink">Discount (amount)</label>
            <input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="0" className="w-full rounded-xl border border-ink/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink">Payment method</label>
            <div className="grid grid-cols-4 gap-2">
              {(["cash", "transfer", "card", "credit"] as const).map((m) => (
                <button key={m} onClick={() => setMethod(m)} className={`rounded-xl border-2 py-2 text-xs font-bold capitalize transition-all ${method === m ? "border-brand bg-brand/[0.06] text-brand" : "border-ink/8 text-muted hover:border-brand/40"}`}>{m}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-1.5 border-t border-ink/10 pt-4 text-sm">
          <div className="flex justify-between text-muted"><span>Subtotal</span><span>{fmtMoney(cur, subtotal)}</span></div>
          <div className="flex justify-between text-leaf"><span>Discount</span><span>−{fmtMoney(cur, disc)}</span></div>
          <div className="flex justify-between pt-1 font-display text-lg font-extrabold text-ink"><span>Total</span><span>{fmtMoney(cur, total)}</span></div>
        </div>

        <button onClick={pay} className="mt-4 w-full rounded-full bg-gradient-to-br from-brand-light to-brand py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand/25 transition-transform hover:-translate-y-0.5">
          Charge {fmtMoney(cur, total)}
        </button>
        <p className="mt-3 text-center text-[11px] text-muted">Credit sales mark the customer as owing and update their balance.</p>
      </div>
    </div>
  );
}

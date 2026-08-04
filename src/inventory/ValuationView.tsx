"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useInventory, stockOnHand, totalStock, fmtMoney } from "./lib";
import { Download } from "@/components/icons";

export default function ValuationView() {
  const { db } = useInventory();
  const { business } = useAuth();
  const cur = business?.currency ?? "NGN";
  const [branchId, setBranchId] = useState("all");

  const live = db.products.filter((p) => p.status !== "archived");
  const rows = live.map((p) => {
    const stock = branchId === "all" ? totalStock(db, p.id) : stockOnHand(db, p.id, branchId);
    const value = stock * (p.costPrice ?? 0);
    const sellValue = stock * p.sellingPrice;
    return { p, stock, value, sellValue };
  });
  const totalValue = rows.reduce((s, r) => s + r.value, 0);
  const totalSell = rows.reduce((s, r) => s + r.sellValue, 0);
  const activeValue = rows.filter((r) => r.p.status === "active").reduce((s, r) => s + r.value, 0);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink">Inventory valuation</h2>
          <p className="mt-1 text-sm text-muted">Current stock × cost price, across all products.</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="rounded-xl border border-ink/10 bg-white px-3 py-2.5 text-sm font-medium outline-none">
            <option value="all">All branches</option>
            {db.branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <button onClick={() => alert("Report exported as CSV (demo).")} className="inline-flex items-center gap-1.5 rounded-full bg-forest px-4 py-2.5 text-sm font-semibold text-white">
            <Download className="h-4 w-4" /> Export
          </button>
        </div>
      </div>

      {/* totals */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-gradient-to-br from-forest to-pine p-6 text-white shadow-lg shadow-forest/20">
          <p className="text-xs font-medium text-white/70">Total inventory value (cost)</p>
          <p className="mt-1 font-display text-3xl font-extrabold">{fmtMoney(cur, totalValue)}</p>
        </div>
        <div className="rounded-2xl border border-ink/5 bg-white p-6 shadow-sm">
          <p className="text-xs font-medium text-muted">Retail value (selling)</p>
          <p className="mt-1 font-display text-3xl font-extrabold text-ink">{fmtMoney(cur, totalSell)}</p>
        </div>
        <div className="rounded-2xl border border-ink/5 bg-white p-6 shadow-sm">
          <p className="text-xs font-medium text-muted">Active products only</p>
          <p className="mt-1 font-display text-3xl font-extrabold text-ink">{fmtMoney(cur, activeValue)}</p>
        </div>
      </div>

      {/* table */}
      <div className="overflow-hidden rounded-2xl border border-ink/5 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-ink/5 text-[11px] font-bold uppercase tracking-wider text-muted">
                <th className="px-5 py-3.5">Product</th>
                <th className="px-5 py-3.5">Stock</th>
                <th className="px-5 py-3.5">Cost price</th>
                <th className="px-5 py-3.5">Selling price</th>
                <th className="px-5 py-3.5 text-right">Valuation (cost)</th>
              </tr>
            </thead>
            <tbody>
              {rows.filter((r) => r.stock > 0 || r.value > 0).map((r) => (
                <tr key={r.p.id} className="border-b border-ink/5 last:border-0 hover:bg-cream/50">
                  <td className="px-5 py-3.5">
                    <span className="flex items-center gap-2.5 font-semibold text-ink"><span className="text-lg">{r.p.emoji}</span> {r.p.name}</span>
                  </td>
                  <td className="px-5 py-3.5 font-bold text-ink">{r.stock}</td>
                  <td className="px-5 py-3.5 text-muted">{r.p.costPrice != null ? fmtMoney(cur, r.p.costPrice) : "—"}</td>
                  <td className="px-5 py-3.5 text-muted">{fmtMoney(cur, r.p.sellingPrice)}</td>
                  <td className="px-5 py-3.5 text-right font-extrabold text-forest">{fmtMoney(cur, r.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

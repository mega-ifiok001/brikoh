"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { fmtMoney } from "@/lib/business";
import { AreaChart } from "./charts";
import { orders, products, topProducts, lowStock, salesSeries } from "./data";
import type { SectionId } from "./DashboardPage";
import {
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  Users,
  Coins,
  Plus,
  Storefront,
  ChartUp,
  AlertCircle,
  ArrowRight,
} from "@/components/icons";

const statusChip: Record<string, string> = {
  Paid: "bg-leaf/15 text-leaf",
  Shipped: "bg-brand/15 text-brand",
  Delivered: "bg-pine/15 text-pine",
  Processing: "bg-sun/20 text-[#b7791f]",
  Refunded: "bg-ink/10 text-muted",
};

export default function Overview({ onNavigate }: { onNavigate: (s: SectionId) => void }) {
  const { user, business } = useAuth();
  const [range, setRange] = useState<"7d" | "30d" | "90d">("30d");
  if (!business || !user) return null;

  const cur = business.currency;
  const labels = range === "7d" ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    : range === "30d" ? ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8", "W9", "W10", "W11", "W12"]
    : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const kpis = [
    { label: "Total revenue", value: fmtMoney(cur, 2480300), delta: "+12.5%", up: true, icon: <Coins className="h-5 w-5" />, tint: "bg-brand/10 text-brand" },
    { label: "Orders", value: "1,284", delta: "+8.2%", up: true, icon: <Receipt className="h-5 w-5" />, tint: "bg-pine/10 text-pine" },
    { label: "Customers", value: "862", delta: "+5.1%", up: true, icon: <Users className="h-5 w-5" />, tint: "bg-leaf/10 text-leaf" },
    { label: "Avg. order value", value: fmtMoney(cur, 14200), delta: "-2.3%", up: false, icon: <ChartUp className="h-5 w-5" />, tint: "bg-sun/15 text-[#b7791f]" },
  ];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-6">
      {/* greeting + quick actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink">
            {greeting}, {user.name.split(" ")[0]} 👋
          </h2>
          <p className="mt-1 text-sm text-muted">
            Here's what's happening at <span className="font-semibold text-forest">{business.name}</span> today.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onNavigate("products")}
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-brand-light to-brand px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand/25 transition-transform hover:-translate-y-0.5"
          >
            <Plus className="h-4 w-4" /> Add product
          </button>
          <button
            onClick={() => onNavigate("orders")}
            className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 bg-white px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-brand hover:text-brand"
          >
            <Receipt className="h-4 w-4" /> New order
          </button>
          <button
            onClick={() => onNavigate("store")}
            className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 bg-white px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-brand hover:text-brand"
          >
            <Storefront className="h-4 w-4" /> View store
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl border border-ink/5 bg-white p-5 shadow-sm transition-shadow hover:shadow-lg hover:shadow-forest/5">
            <div className="flex items-center justify-between">
              <span className={`grid h-10 w-10 place-items-center rounded-xl ${k.tint}`}>{k.icon}</span>
              <span className={`inline-flex items-center gap-0.5 text-xs font-bold ${k.up ? "text-leaf" : "text-red-500"}`}>
                {k.up ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                {k.delta}
              </span>
            </div>
            <p className="mt-4 font-display text-2xl font-extrabold tracking-tight text-ink">{k.value}</p>
            <p className="mt-0.5 text-xs font-medium text-muted">{k.label}</p>
          </div>
        ))}
      </div>

      {/* chart + top products */}
      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <div className="rounded-2xl border border-ink/5 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-base font-extrabold text-ink">Revenue</h3>
              <p className="mt-0.5 text-xs text-muted">
                {range === "7d" ? "Last 7 days" : range === "30d" ? "Last 30 days" : "Last 90 days"}
              </p>
            </div>
            <div className="flex rounded-full bg-cream p-1">
              {(["7d", "30d", "90d"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ${
                    range === r ? "bg-forest text-white shadow" : "text-muted hover:text-ink"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-5">
            <AreaChart series={salesSeries[range]} labels={range === "7d" ? undefined : labels} height={220} />
          </div>
        </div>

        {/* top products */}
        <div className="rounded-2xl border border-ink/5 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-extrabold text-ink">Top products</h3>
            <button onClick={() => onNavigate("products")} className="text-xs font-bold text-brand hover:text-brand-light">
              View all
            </button>
          </div>
          <div className="mt-5 space-y-4">
            {topProducts.map((p) => (
              <div key={p.name}>
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-cream text-lg">{p.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-ink">{p.name}</p>
                    <p className="text-xs text-muted">{p.units} units sold</p>
                  </div>
                  <span className="text-sm font-extrabold text-forest">{fmtMoney(cur, p.revenue)}</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink/5">
                  <div className="h-full rounded-full bg-gradient-to-r from-brand to-sun" style={{ width: `${p.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* orders + low stock */}
      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <div className="rounded-2xl border border-ink/5 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-extrabold text-ink">Recent orders</h3>
            <button onClick={() => onNavigate("orders")} className="inline-flex items-center gap-1 text-xs font-bold text-brand hover:text-brand-light">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="tbl-mobile w-full text-left">
              <thead>
                <tr className="text-[11px] font-bold uppercase tracking-wider text-muted">
                  <th className="pb-3">Order</th>
                  <th className="pb-3">Customer</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Total</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 5).map((o) => (
                  <tr key={o.id} className="border-t border-ink/5 text-sm">
                    <td data-label="Order" className="py-3 font-bold text-ink">{o.id}</td>
                    <td data-label="Customer" className="py-3 text-ink/80">{o.customer}</td>
                    <td data-label="Date" className="py-3 text-muted">{o.date}</td>
                    <td data-label="Total" className="py-3 font-extrabold text-ink">{fmtMoney(cur, o.total)}</td>
                    <td data-label="Status" className="py-3">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${statusChip[o.status]}`}>
                        {o.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* low stock + store health */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-ink/5 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-extrabold text-ink">Low stock alerts</h3>
              <a href="#/inventory" className="text-xs font-bold text-brand hover:text-brand-light">
                Open inventory
              </a>
            </div>
            <div className="mt-4 space-y-3">
              {lowStock.map((s) => (
                  <div key={s.name} className="flex items-center gap-3 rounded-xl bg-cream p-3">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-white text-base shadow-sm">{s.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-ink">{s.name}</p>
                      <p className="text-xs text-muted">
                        {s.stock} left · reorder at {s.reorder}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-brand">
                      <AlertCircle className="h-3.5 w-3.5" /> Reorder
                    </span>
                  </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-ink/5 bg-white p-5 shadow-sm sm:p-6">
            <h3 className="font-display text-base font-extrabold text-ink">Quick stats</h3>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {[
                { k: "Products", v: products.length.toString() },
                { k: "Website", v: business.websiteLive ? "Live 🌐" : "Not created" },
                { k: "Currency", v: cur },
                { k: "Pending orders", v: "3" },
              ].map((s) => (
                <div key={s.k} className="rounded-xl bg-cream p-3">
                  <p className="text-[11px] font-medium text-muted">{s.k}</p>
                  <p className="mt-0.5 text-sm font-extrabold text-ink">{s.v}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

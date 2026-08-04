"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { fmtMoney, CURRENCY_SYMBOLS } from "@/lib/business";
import { AreaChart, BarRow } from "./charts";
import { orders, products, customers, transactions, channelData, salesSeries } from "./data";
import {
  Storefront,
  Globe,
  Pencil,
  Plus,
  MoreHorizontal,
  Trash,
  ShoppingBag,
  Wallet,
  CreditCard,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  Check,
  CheckCircle,
  MapPin,
  Phone,
  Coins,
  Rocket,
  ChartUp,
  Box,
  Megaphone,
  Users,
} from "@/components/icons";

/* ----------------------------- shared bits ----------------------------- */

const orderChip: Record<string, string> = {
  Paid: "bg-leaf/15 text-leaf",
  Shipped: "bg-brand/15 text-brand",
  Delivered: "bg-pine/15 text-pine",
  Processing: "bg-sun/20 text-[#b7791f]",
  Refunded: "bg-ink/10 text-muted",
};

const productChip: Record<string, string> = {
  Active: "bg-leaf/15 text-leaf",
  Low: "bg-sun/20 text-[#b7791f]",
  Draft: "bg-ink/10 text-muted",
};

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-ink/5 bg-white p-5 shadow-sm sm:p-6 ${className}`}>{children}</div>;
}

function CardHead({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="font-display text-base font-extrabold text-ink">{title}</h3>
      {action}
    </div>
  );
}

function EmptyState({ emoji, title, text }: { emoji: string; title: string; text: string }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-ink/15 bg-white px-6 py-14 text-center">
      <span className="text-4xl">{emoji}</span>
      <p className="mt-3 font-display text-base font-bold text-ink">{title}</p>
      <p className="mt-1 max-w-xs text-sm text-muted">{text}</p>
    </div>
  );
}

/** Slim banner linking a dashboard section to its full module. */
function HubBanner({ to, title, text, cta }: { to: string; title: string; text: string; cta: string }) {
  return (
    <a href={to} className="group flex flex-col gap-3 rounded-2xl border border-brand/20 bg-gradient-to-br from-brand/[0.06] to-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand/10 sm:flex-row sm:items-center">
      <div className="flex-1">
        <p className="text-sm font-bold text-ink">{title}</p>
        <p className="text-xs text-muted">{text}</p>
      </div>
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-forest px-4 py-2 text-xs font-bold text-white transition-transform group-hover:translate-x-0.5">
        {cta} <ArrowRight className="h-3.5 w-3.5" />
      </span>
    </a>
  );
}

/* ------------------------------- Store ------------------------------- */

export function StoreSection() {
  const { business, updateBusinessProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  if (!business) return null;

  const [form, setForm] = useState({
    name: business.name,
    phone: business.phone,
    city: business.city,
    country: business.country,
    currency: business.currency,
  });

  const websiteUrl = `${business.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.brikoh.app`;

  const save = () => {
    updateBusinessProfile(form);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const fields = [
    { label: "Business name", value: business.name, icon: <Storefront className="h-5 w-5" /> },
    { label: "Category", value: business.category, icon: <ShoppingBag className="h-5 w-5" /> },
    { label: "Location", value: `${business.city}, ${business.country}`, icon: <MapPin className="h-5 w-5" /> },
    { label: "Currency", value: `${CURRENCY_SYMBOLS[business.currency] ?? ""} ${business.currency}`, icon: <Coins className="h-5 w-5" /> },
    { label: "Phone", value: business.phone, icon: <Phone className="h-5 w-5" /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink">Store settings</h2>
          <p className="mt-1 text-sm text-muted">Your business details — shown to customers and used across Brikoh.</p>
        </div>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 bg-white px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-brand hover:text-brand"
          >
            <Pencil className="h-4 w-4" /> Edit details
          </button>
        )}
      </div>

      {saved && (
        <div className="flex items-center gap-2 rounded-2xl border border-leaf/30 bg-leaf/10 px-4 py-3 text-sm font-semibold text-forest">
          <CheckCircle className="h-5 w-5 text-leaf" /> Store details updated successfully.
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Card>
          {editing ? (
            <div className="space-y-4">
              <CardHead title="Edit business details" />
              <div className="grid gap-4 sm:grid-cols-2">
                {([
                  ["name", "Business name"],
                  ["phone", "Business phone"],
                  ["city", "City"],
                  ["country", "Country"],
                ] as const).map(([key, label]) => (
                  <div key={key}>
                    <label className="mb-1.5 block text-sm font-semibold text-ink">{label}</label>
                    <input
                      value={form[key]}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                      className="w-full rounded-xl border border-ink/10 bg-white px-4 py-3 text-[15px] text-ink outline-none transition-all focus:border-brand focus:ring-4 focus:ring-brand/10"
                    />
                  </div>
                ))}
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-ink">Currency</label>
                  <select
                    value={form.currency}
                    onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                    className="w-full rounded-xl border border-ink/10 bg-white px-4 py-3 text-[15px] text-ink outline-none transition-all focus:border-brand focus:ring-4 focus:ring-brand/10"
                  >
                    {Object.entries(CURRENCY_SYMBOLS).map(([code, sym]) => (
                      <option key={code} value={code}>
                        {sym} {code}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={save}
                  className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-brand-light to-brand px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand/25"
                >
                  <Check className="h-4 w-4" /> Save changes
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="rounded-full border border-ink/15 px-5 py-2.5 text-sm font-semibold text-muted hover:text-ink"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <CardHead title="Business details" />
              {fields.map((f) => (
                <div key={f.label} className="flex items-center gap-4 rounded-xl bg-cream p-4">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-brand shadow-sm">{f.icon}</span>
                  <div>
                    <p className="text-xs font-medium text-muted">{f.label}</p>
                    <p className="text-sm font-bold text-ink capitalize">{f.value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* website card */}
        <div className="space-y-4">
          <Card>
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-extrabold text-ink">Your website</h3>
              <Globe className="h-5 w-5 text-pine" />
            </div>
            {business.websiteLive ? (
              <>
                <div className="mt-4 flex items-center gap-2 rounded-xl bg-leaf/10 px-4 py-3">
                  <span className="h-2 w-2 rounded-full bg-leaf" />
                  <p className="text-sm font-bold text-forest">Your free website is live</p>
                </div>
                <div className="mt-3 rounded-xl border border-ink/5 p-4">
                  <p className="text-xs text-muted">Your store link</p>
                  <p className="mt-1 break-all font-mono text-sm font-bold text-brand">{websiteUrl}</p>
                  <p className="mt-1.5 text-xs text-muted">
                    Template: <span className="font-bold capitalize text-ink">{business.template ?? "classic"}</span> · WhatsApp button:{" "}
                    <span className="font-bold text-[#128C4B]">{business.whatsapp || business.phone || "—"}</span>
                  </p>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <a href="#/storefront" className="inline-flex items-center justify-center gap-1.5 rounded-full bg-forest px-4 py-2.5 text-sm font-semibold text-white">
                    <Globe className="h-4 w-4" /> View store
                  </a>
                  <a href="#/website-builder" className="inline-flex items-center justify-center gap-1.5 rounded-full border border-ink/15 px-4 py-2.5 text-sm font-semibold text-ink hover:border-brand hover:text-brand">
                    <Pencil className="h-4 w-4" /> Edit website
                  </a>
                </div>
              </>
            ) : (
              <EmptyState
                emoji="🌐"
                title="No website yet"
                text="Create a free online store in minutes and start selling beyond your counter."
              />
            )}
          </Card>

          <Card>
            <CardHead title="Pro tip" />
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Businesses with a live website sell{" "}
              <span className="font-bold text-forest">2.4× more</span> on average. Enable yours from
              the dashboard.
            </p>
            <button className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-dashed border-brand/40 bg-brand/[0.05] px-4 py-2.5 text-sm font-bold text-brand">
              <Rocket className="h-4 w-4" /> Upgrade to unlock more
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ Products ----------------------------- */

export function ProductsSection() {
  const { business } = useAuth();
  if (!business) return null;
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink">Products</h2>
          <p className="mt-1 text-sm text-muted">{products.length} products · {products.filter((p) => p.status === "Active").length} active</p>
        </div>
        <a href="#/inventory/products" className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-brand-light to-brand px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand/25 transition-transform hover:-translate-y-0.5">
          <Plus className="h-4 w-4" /> Add product
        </a>
      </div>

      <HubBanner
        to="#/inventory/products"
        title="Manage products in the Inventory Dashboard"
        text="Photos, variants, bulk upload, pricing, stock history & more — the full product toolkit lives in the inventory module."
        cta="Open inventory"
      />

      <Card className="p-0 sm:p-0">
        <div className="overflow-x-auto">
          <table className="tbl-mobile w-full text-left">
            <thead>
              <tr className="border-b border-ink/5 text-[11px] font-bold uppercase tracking-wider text-muted">
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4">Sales</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-ink/5 text-sm last:border-0 hover:bg-cream/50">
                  <td data-label="Product" className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-xl bg-cream text-lg">{p.emoji}</span>
                      <div>
                        <p className="font-bold text-ink">{p.name}</p>
                        <p className="text-xs text-muted">{p.id}</p>
                      </div>
                    </div>
                  </td>
                  <td data-label="Price" className="px-6 py-4 font-extrabold text-ink">{fmtMoney(business.currency, p.price)}</td>
                  <td data-label="Stock" className={`px-6 py-4 font-semibold ${p.stock === 0 ? "text-red-500" : p.stock <= p.reorder ? "text-[#b7791f]" : "text-ink"}`}>
                    {p.stock === 0 ? "Out of stock" : p.stock}
                  </td>
                  <td data-label="Sales" className="px-6 py-4 text-muted">{p.sales}</td>
                  <td data-label="Status" className="px-6 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${productChip[p.status]}`}>{p.status}</span>
                  </td>
                  <td data-label="Actions" className="px-6 py-4 text-right">
                    <button className="grid h-8 w-8 place-items-center rounded-lg text-ink/40 hover:bg-ink/5 hover:text-ink" aria-label="More actions">
                      <MoreHorizontal className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ------------------------------- Orders ------------------------------ */

export function OrdersSection() {
  const { business } = useAuth();
  if (!business) return null;
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink">Orders</h2>
          <p className="mt-1 text-sm text-muted">{orders.length} orders · {orders.filter((o) => o.status === "Paid" || o.status === "Processing").length} awaiting action</p>
        </div>
        <a href="#/inventory/pos" className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-brand-light to-brand px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand/25">
          <Plus className="h-4 w-4" /> New order
        </a>
      </div>

      <HubBanner
        to="#/inventory/pos"
        title="Record & manage sales in the full POS"
        text="The POS-style sales screen lives in the Inventory Dashboard — with cart, payments, credit & receipts. Live orders from your website also land there."
        cta="Open sales & orders"
      />

      <Card className="p-0 sm:p-0">
        <div className="overflow-x-auto">
          <table className="tbl-mobile w-full text-left">
            <thead>
              <tr className="border-b border-ink/5 text-[11px] font-bold uppercase tracking-wider text-muted">
                <th className="px-6 py-4">Order</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Items</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-ink/5 text-sm last:border-0 hover:bg-cream/50">
                  <td data-label="Order" className="px-6 py-4 font-bold text-ink">{o.id}</td>
                  <td data-label="Customer" className="px-6 py-4 font-semibold text-ink/85">{o.customer}</td>
                  <td data-label="Items" className="px-6 py-4 text-muted">{o.items}</td>
                  <td data-label="Date" className="px-6 py-4 text-muted">{o.date}</td>
                  <td data-label="Total" className="px-6 py-4 font-extrabold text-ink">{fmtMoney(business.currency, o.total)}</td>
                  <td data-label="Status" className="px-6 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${orderChip[o.status]}`}>{o.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ----------------------------- Customers ----------------------------- */

export function CustomersSection() {
  const { business } = useAuth();
  if (!business) return null;
  const segChip: Record<string, string> = {
    VIP: "bg-brand/15 text-brand",
    Regular: "bg-pine/15 text-pine",
    New: "bg-leaf/15 text-leaf",
  };
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink">Customers</h2>
          <p className="mt-1 text-sm text-muted">{customers.length} customers · {customers.filter((c) => c.segment === "VIP").length} VIPs</p>
        </div>
        <a href="#/inventory/customers" className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 bg-white px-4 py-2.5 text-sm font-semibold text-ink hover:border-brand hover:text-brand">
          <Download className="h-4 w-4" /> Export list
        </a>
      </div>

      <HubBanner
        to="#/inventory/customers"
        title="Full customer management in the Inventory Dashboard"
        text="Auto-created records, groups, notes, bulk import/export, WhatsApp messaging and owing balances live in the customers module."
        cta="Open customers"
      />

      <Card className="p-0 sm:p-0">
        <div className="overflow-x-auto">
          <table className="tbl-mobile w-full text-left">
            <thead>
              <tr className="border-b border-ink/5 text-[11px] font-bold uppercase tracking-wider text-muted">
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Orders</th>
                <th className="px-6 py-4">Total spent</th>
                <th className="px-6 py-4">Segment</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.email} className="border-b border-ink/5 text-sm last:border-0 hover:bg-cream/50">
                  <td data-label="Customer" className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className={`grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br ${c.grad} text-xs font-bold text-white`}>{c.initials}</span>
                      <div>
                        <p className="font-bold text-ink">{c.name}</p>
                        <p className="text-xs text-muted">{c.email}</p>
                      </div>
                    </div>
                  </td>
                  <td data-label="Orders" className="px-6 py-4 font-semibold text-ink">{c.orders}</td>
                  <td data-label="Spent" className="px-6 py-4 font-extrabold text-ink">{fmtMoney(business.currency, c.spent)}</td>
                  <td data-label="Segment" className="px-6 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${segChip[c.segment]}`}>{c.segment}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ----------------------------- Inventory ----------------------------- */

export function InventorySection() {
  const { business } = useAuth();
  if (!business) return null;
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink">Inventory</h2>
          <p className="mt-1 text-sm text-muted">Stock levels update automatically after every sale.</p>
        </div>
        <a href="#/inventory" className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-brand-light to-brand px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand/25 transition-transform hover:-translate-y-0.5">
          Open the full inventory module <ArrowRight className="h-4 w-4" />
        </a>
      </div>

      <a href="#/inventory" className="block rounded-3xl bg-gradient-to-br from-forest to-pine p-8 text-white transition-transform hover:-translate-y-0.5">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="inline-flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wider text-sun">
              <ArrowUpRight className="h-4 w-4" /> Opens a full dashboard
            </p>
            <h3 className="mt-2 font-display text-2xl font-extrabold sm:text-3xl">Inventory Dashboard — your complete back office</h3>
            <p className="mt-2 max-w-xl text-sm text-white/70">Products, stock history, transfers, POS, suppliers, customers, staff, reports & more — its own dashboard with 15+ tools. Stock is never edited directly; every change is logged.</p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-forest">Open dashboard <ArrowRight className="h-4 w-4" /></span>
        </div>
      </a>

      <Card className="p-0 sm:p-0">
        <div className="overflow-x-auto">
          <table className="tbl-mobile w-full text-left">
            <thead>
              <tr className="border-b border-ink/5 text-[11px] font-bold uppercase tracking-wider text-muted">
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">In stock</th>
                <th className="px-6 py-4">Reorder at</th>
                <th className="px-6 py-4 w-1/3">Level</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const pct = Math.min(100, (p.stock / (p.reorder * 4)) * 100);
                return (
                  <tr key={p.id} className="border-b border-ink/5 text-sm last:border-0 hover:bg-cream/50">
                    <td data-label="Product" className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="grid h-9 w-9 place-items-center rounded-lg bg-cream text-base">{p.emoji}</span>
                        <p className="font-bold text-ink">{p.name}</p>
                      </div>
                    </td>
                    <td data-label="In stock" className={`px-6 py-4 font-extrabold ${p.stock === 0 ? "text-red-500" : "text-ink"}`}>{p.stock}</td>
                    <td data-label="Reorder" className="px-6 py-4 text-muted">{p.reorder}</td>
                    <td data-label="Level" className="px-6 py-4">
                      <div className="h-2 min-w-24 overflow-hidden rounded-full bg-ink/5">
                        <div
                          className={`h-full rounded-full ${p.stock === 0 ? "bg-red-400" : p.stock <= p.reorder ? "bg-sun" : "bg-leaf"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </td>
                    <td data-label="Status" className="px-6 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${productChip[p.status]}`}>{p.status}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ----------------------------- Analytics ----------------------------- */

export function AnalyticsSection() {
  const { business } = useAuth();
  const [range, setRange] = useState<"7d" | "30d" | "90d">("30d");
  const [gaId, setGaId] = useState(() => localStorage.getItem("brikoh_ga_id") ?? "");
  const [gaConnected, setGaConnected] = useState(() => localStorage.getItem("brikoh_ga_connected") === "1");
  const [gaErr, setGaErr] = useState("");
  if (!business) return null;
  const labels = range === "7d" ? undefined : range === "30d" ? ["W1", "W4", "W8", "W12"] : ["Jan", "Apr", "Jul", "Oct", "Dec"];

  const connectGA = () => {
    const id = gaId.trim().toUpperCase();
    if (!/^G-[A-Z0-9]{6,}$/.test(id)) {
      setGaErr("Enter a valid GA4 Measurement ID, e.g. G-ABCDEF1234");
      return;
    }
    setGaErr("");
    setGaConnected(true);
    localStorage.setItem("brikoh_ga_id", id);
    localStorage.setItem("brikoh_ga_connected", "1");
  };

  const disconnectGA = () => {
    setGaConnected(false);
    setGaId("");
    localStorage.removeItem("brikoh_ga_id");
    localStorage.removeItem("brikoh_ga_connected");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink">Analytics</h2>
          <p className="mt-1 text-sm text-muted">Know your numbers before your competitors do.</p>
        </div>
        <div className="flex rounded-full bg-white p-1 ring-1 ring-ink/10">
          {(["7d", "30d", "90d"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ${range === r ? "bg-forest text-white" : "text-muted hover:text-ink"}`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Google Analytics */}
      <div className="rounded-3xl border border-ink/5 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-forest/10 text-forest">
              <ChartUp className="h-6 w-6" />
            </span>
            <div>
              <p className="font-display text-base font-extrabold text-ink">Google Analytics</p>
              <p className="text-xs text-muted">
                {gaConnected
                  ? `Connected · tracking your website with ${localStorage.getItem("brikoh_ga_id") ?? ""}`
                  : "Connect GA4 to see real website traffic alongside your sales."}
              </p>
            </div>
            {gaConnected && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-leaf/15 px-3 py-1 text-xs font-bold text-leaf">
                <CheckCircle className="h-3.5 w-3.5" /> Verified
              </span>
            )}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            {gaConnected ? (
              <>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { k: "Sessions", v: "18,402", d: "+12%" },
                    { k: "Users", v: "9,876", d: "+8%" },
                    { k: "Page views", v: "31,204", d: "+15%" },
                  ].map((m) => (
                    <div key={m.k} className="rounded-xl bg-cream px-3 py-2 text-center">
                      <p className="font-display text-base font-extrabold text-ink">{m.v}</p>
                      <p className="text-[10px] font-semibold text-leaf">{m.d}</p>
                      <p className="text-[10px] text-muted">{m.k}</p>
                    </div>
                  ))}
                </div>
                <button onClick={disconnectGA} className="rounded-full border border-ink/15 px-4 py-2 text-xs font-semibold text-muted hover:border-red-300 hover:text-red-500">
                  Disconnect
                </button>
              </>
            ) : (
              <>
                <input
                  value={gaId}
                  onChange={(e) => { setGaId(e.target.value); setGaErr(""); }}
                  placeholder="G-XXXXXXXXXX"
                  className="w-full rounded-xl border border-ink/10 bg-cream px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand/10 sm:w-56"
                />
                <button onClick={connectGA} className="rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-white">
                  Connect
                </button>
              </>
            )}
          </div>
        </div>
        {gaErr && <p className="mt-3 text-xs font-medium text-red-500">{gaErr}</p>}
        {!gaConnected && (
          <p className="mt-4 rounded-xl bg-cream px-4 py-3 text-xs leading-relaxed text-muted">
            <strong className="text-ink">How to connect:</strong> create a GA4 property at analytics.google.com, copy your
            Measurement ID (starts with <span className="font-mono font-bold">G-</span>), paste it above, and Brikoh will tag your
            website automatically. Traffic data appears here within hours.
          </p>
        )}
      </div>

      {/* insight cards */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[
          { k: "Net profit", v: fmtMoney(business.currency, 842000), d: "+24% vs last period", up: true },
          { k: "Conversion rate", v: "6.4%", d: "+0.8 pts", up: true },
          { k: "Repeat customers", v: "38%", d: "+5 pts", up: true },
          { k: "Cart abandonment", v: "21%", d: "-3 pts", up: false },
        ].map((s) => (
          <div key={s.k} className="rounded-2xl border border-ink/5 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium text-muted">{s.k}</p>
            <p className="mt-1.5 font-display text-2xl font-extrabold tracking-tight text-ink">{s.v}</p>
            <p className={`mt-1 inline-flex items-center gap-0.5 text-xs font-bold ${s.up ? "text-leaf" : "text-red-500"}`}>
              {s.up ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />} {s.d}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHead title="Revenue trend" />
          <div className="mt-5">
            <AreaChart series={salesSeries[range]} labels={labels} height={260} />
          </div>
        </Card>

        <Card>
          <CardHead title="Revenue by channel" />
          <div className="mt-6 space-y-5">
            {channelData.map((c) => (
              <BarRow key={c.label} label={c.label} value={c.value} color={c.color} max={50} />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ------------------------------ Payments ----------------------------- */

export function PaymentsSection() {
  const { business } = useAuth();
  if (!business) return null;
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink">Payments</h2>
          <p className="mt-1 text-sm text-muted">Accept local & global payments, track every transaction.</p>
        </div>
        <a href="#/money/wallet" className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-brand-light to-brand px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand/25">
          <Wallet className="h-4 w-4" /> Withdraw
        </a>
      </div>

      <HubBanner
        to="#/money/wallet"
        title="Your wallet & accounting live in Money & Accounting"
        text="Real wallet balances, Paystack payment log, bank accounts, withdrawals, expenses and Profit & Loss reports — all in one module."
        cta="Open money & accounting"
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_1.5fr]">
        {/* balance */}
        <Card>
          <div className="rounded-2xl bg-gradient-to-br from-forest to-pine p-6 text-white">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-white/70">Available balance</p>
              <CreditCard className="h-5 w-5 text-sun" />
            </div>
            <p className="mt-2 font-display text-3xl font-extrabold tracking-tight">
              {fmtMoney(business.currency, 1248050)}
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white/10 p-3">
                <p className="text-[11px] text-white/60">Pending</p>
                <p className="mt-0.5 font-display text-lg font-extrabold">{fmtMoney(business.currency, 184200)}</p>
              </div>
              <div className="rounded-xl bg-white/10 p-3">
                <p className="text-[11px] text-white/60">Total this month</p>
                <p className="mt-0.5 font-display text-lg font-extrabold">{fmtMoney(business.currency, 2480300)}</p>
              </div>
            </div>
          </div>

          <div className="mt-5">
            <p className="text-sm font-bold text-ink">Connected methods</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {["Card", "Bank transfer", "Mobile money", "Paystack", "Stripe"].map((m) => (
                <span key={m} className="rounded-full bg-cream px-3 py-1.5 text-xs font-bold text-ink/70 ring-1 ring-ink/5">
                  {m}
                </span>
              ))}
            </div>
            <button className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-dashed border-brand/40 bg-brand/[0.05] px-4 py-2.5 text-sm font-bold text-brand">
              <Plus className="h-4 w-4" /> Connect payment method
            </button>
          </div>
        </Card>

        {/* transactions */}
        <Card>
          <CardHead title="Recent transactions" action={<button className="text-xs font-bold text-brand">View all</button>} />
          <div className="mt-4 space-y-2">
            {transactions.map((t) => (
              <div key={t.id} className="flex items-center gap-3 rounded-xl bg-cream p-3.5">
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${t.dir === "in" ? "bg-leaf/15 text-leaf" : "bg-brand/15 text-brand"}`}>
                  {t.dir === "in" ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-ink">{t.desc}</p>
                  <p className="text-xs text-muted">
                    {t.date} · {t.method} · {t.id}
                  </p>
                </div>
                <span className={`font-extrabold ${t.dir === "in" ? "text-forest" : "text-ink"}`}>
                  {t.dir === "in" ? "+" : "−"}{fmtMoney(business.currency, t.amount)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ------------------------------ Settings ----------------------------- */

export function SettingsSection() {
  const { user, business, logout } = useAuth();
  const [saved, setSaved] = useState(false);
  if (!business || !user) return null;

  const save = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink">Settings</h2>
        <p className="mt-1 text-sm text-muted">Manage your business and account preferences.</p>
      </div>

      {saved && (
        <div className="flex items-center gap-2 rounded-2xl border border-leaf/30 bg-leaf/10 px-4 py-3 text-sm font-semibold text-forest">
          <CheckCircle className="h-5 w-5 text-leaf" /> Settings saved successfully.
        </div>
      )}

      {/* quick links across the platform */}
      <div className="rounded-2xl border border-ink/5 bg-white p-5 shadow-sm">
        <h3 className="font-display text-base font-extrabold text-ink">Quick links across Brikoh</h3>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { to: "#/website-builder", label: "Edit your website", icon: <Globe className="h-4 w-4" /> },
            { to: "#/storefront", label: "View your storefront", icon: <Storefront className="h-4 w-4" /> },
            { to: "#/inventory", label: "Inventory dashboard", icon: <Box className="h-4 w-4" /> },
            { to: "#/money/wallet", label: "Money & accounting", icon: <Wallet className="h-4 w-4" /> },
            { to: "#/dashboard/marketing", label: "Marketing", icon: <Megaphone className="h-4 w-4" /> },
            { to: "#/dashboard/analytics", label: "Analytics", icon: <ChartUp className="h-4 w-4" /> },
            { to: "#/inventory/customers", label: "Customers", icon: <Users className="h-4 w-4" /> },
            { to: "#/inventory/products", label: "Products", icon: <ShoppingBag className="h-4 w-4" /> },
          ].map((l) => (
            <a key={l.to} href={l.to} className="flex items-center gap-2 rounded-xl bg-cream px-3 py-2.5 text-xs font-bold text-ink/75 transition-all hover:bg-brand/[0.06] hover:text-brand">
              <span className="text-brand">{l.icon}</span> {l.label}
            </a>
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHead title="Business settings" action={<Pencil className="h-4 w-4 text-ink/30" />} />
          <div className="mt-4 space-y-4">
            {([
              ["Business name", business.name],
              ["Currency", business.currency],
              ["Phone", business.phone],
              ["Location", `${business.city}, ${business.country}`],
            ] as const).map(([label, value]) => (
              <div key={label} className="flex items-center justify-between border-b border-ink/5 pb-3 last:border-0">
                <span className="text-sm font-medium text-muted">{label}</span>
                <span className="text-sm font-bold text-ink">{value}</span>
              </div>
            ))}
          </div>
          <button onClick={save} className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-white">
            <Check className="h-4 w-4" /> Save changes
          </button>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHead title="Account" />
            <div className="mt-4 flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-brand-light to-brand font-display text-lg font-extrabold text-white">
                {user.name.charAt(0)}
              </span>
              <div>
                <p className="font-bold text-ink">{user.name}</p>
                <p className="text-xs text-muted">{user.email}</p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {["Change password", "Two-factor authentication", "Notification preferences"].map((s) => (
                <button
                  key={s}
                  onClick={save}
                  className="flex w-full items-center justify-between rounded-xl bg-cream px-4 py-3 text-sm font-semibold text-ink transition-colors hover:bg-ink/5"
                >
                  {s} <span className="text-brand">→</span>
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <CardHead title="Danger zone" />
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <button onClick={logout} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-100">
                <Trash className="h-4 w-4" /> Log out
              </button>
              <button onClick={save} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-ink/10 px-4 py-2.5 text-sm font-semibold text-muted hover:border-red-300 hover:text-red-500">
                Delete account
              </button>
            </div>
          </Card>
        </div>
      </div>

      {/* toggles */}
      <Card>
        <CardHead title="Preferences" />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {[
            { k: "Payment alerts", d: "Get notified on every transaction", on: true },
            { k: "Low stock alerts", d: "Email me when stock runs low", on: true },
            { k: "Order updates to customers", d: "Auto-send shipping & delivery emails", on: true },
            { k: "Marketing emails", d: "Tips, product news and offers", on: false },
          ].map((t) => (
            <div key={t.k} className="flex items-center justify-between rounded-xl bg-cream p-4">
              <div>
                <p className="text-sm font-bold text-ink">{t.k}</p>
                <p className="text-xs text-muted">{t.d}</p>
              </div>
              <button onClick={save} className={`relative h-6 w-11 rounded-full transition-colors ${t.on ? "bg-forest" : "bg-ink/15"}`}>
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${t.on ? "left-[22px]" : "left-0.5"}`} />
              </button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

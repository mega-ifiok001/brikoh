"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, Check } from "./icons";
import { loadInventoryDB, totalStock, walletBalances, fmtMoney } from "@/inventory/lib";
import { timeAgo } from "@/lib/admin";

type Notif = { id: string; emoji: string; tint: string; title: string; message: string; href: string; at: string };

const READ_KEY = "brikoh_notif_read";

function buildNotifs(): Notif[] {
  const db = loadInventoryDB();
  const live = db.products.filter((p) => p.status !== "archived");
  const n: Notif[] = [];
  const in7 = new Date();
  in7.setDate(in7.getDate() + 7);

  live.forEach((p) => {
    const s = totalStock(db, p.id);
    if (s === 0) n.push({ id: `out-${p.id}`, emoji: "🟥", tint: "bg-red-100 text-red-500", title: "Out of stock", message: `${p.name} is sold out`, href: "#/inventory", at: p.createdAt });
    else if (s <= p.threshold) n.push({ id: `low-${p.id}`, emoji: "🟠", tint: "bg-sun/20 text-[#b7791f]", title: "Low stock", message: `${p.name} — only ${s} left (alert at ${p.threshold})`, href: "#/inventory", at: p.createdAt });
    if (p.expiry && new Date(p.expiry) >= new Date() && new Date(p.expiry) <= in7) n.push({ id: `exp-${p.id}`, emoji: "⏰", tint: "bg-brand/15 text-brand", title: "Expiring soon", message: `${p.name} expires ${p.expiry}`, href: "#/inventory", at: p.expiry });
  });

  const pendingPO = db.purchaseOrders.filter((po) => po.status === "pending");
  if (pendingPO.length) n.push({ id: "po", emoji: "📦", tint: "bg-pine/15 text-pine", title: "Purchase orders awaiting approval", message: `${pendingPO.length} PO(s) pending`, href: "#/inventory", at: pendingPO[0].createdAt });

  const { pending } = walletBalances(db);
  if (pending > 0) n.push({ id: "settle", emoji: "💳", tint: "bg-leaf/15 text-leaf", title: "Pending settlement", message: `${fmtMoney("NGN", pending)} settles tomorrow`, href: "#/money", at: new Date().toISOString() });

  const activeWd = db.withdrawals.filter((w) => w.status !== "SUCCESSFUL" && w.status !== "FAILED");
  if (activeWd.length) n.push({ id: "wd", emoji: "🏦", tint: "bg-brand/15 text-brand", title: "Withdrawal in progress", message: `${activeWd.length} request(s) processing`, href: "#/money", at: activeWd[0].requestedAt });

  const owing = db.sales.filter((s) => s.status !== "paid").reduce((x, s) => x + (s.total - s.paid), 0);
  if (owing > 0) n.push({ id: "owing", emoji: "💰", tint: "bg-sun/20 text-[#b7791f]", title: "Credit balance outstanding", message: `Customers owe ${fmtMoney("NGN", owing)}`, href: "#/inventory", at: db.sales[0]?.at ?? new Date().toISOString() });

  const last = db.sales[0];
  if (last) n.push({ id: "sale", emoji: "🛍️", tint: "bg-leaf/15 text-leaf", title: "New sale recorded", message: `${last.id} · ${last.customerName} · ${fmtMoney("NGN", last.total)}`, href: "#/inventory", at: last.at });

  return n.slice(0, 9);
}

/** Functional notification bell — live alerts across inventory, money & marketing. */
export default function NotificationBell({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [tick, setTick] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const [readIds, setReadIds] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(READ_KEY) || "[]"); } catch { return []; }
  });

  // refresh alerts periodically so the bell stays live
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 8000);
    return () => clearInterval(id);
  }, []);

  // close on outside click
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const notifs = useMemo(() => buildNotifs(), [tick]); // eslint-disable-line react-hooks/exhaustive-deps
  const unread = notifs.filter((x) => !readIds.includes(x.id)).length;

  const persist = (ids: string[]) => {
    setReadIds(ids);
    localStorage.setItem(READ_KEY, JSON.stringify(ids));
  };

  const markAll = () => persist(notifs.map((x) => x.id));

  const openNotif = (n: Notif) => {
    if (!readIds.includes(n.id)) persist([...readIds, n.id]);
    setOpen(false);
    window.location.hash = n.href;
  };

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        className={`relative grid h-10 w-10 place-items-center rounded-full border border-ink/10 bg-white text-ink transition-colors hover:border-brand hover:text-brand ${open ? "border-brand text-brand" : ""}`}
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-[10px] font-bold text-white ring-2 ring-white dark:ring-[#111a15]">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-[min(92vw,380px)] overflow-hidden rounded-2xl border border-ink/5 bg-white shadow-2xl shadow-ink/15">
          <div className="flex items-center justify-between border-b border-ink/5 px-4 py-3">
            <p className="font-display text-sm font-extrabold text-ink">
              Notifications
              {unread > 0 && <span className="ml-2 rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-bold text-brand">{unread} new</span>}
            </p>
            <button onClick={markAll} className="inline-flex items-center gap-1 text-xs font-bold text-brand hover:text-brand-light">
              <Check className="h-3.5 w-3.5" /> Mark all read
            </button>
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {notifs.length === 0 && <p className="py-10 text-center text-sm text-muted">You're all caught up 🎉</p>}
            {notifs.map((n) => {
              const isRead = readIds.includes(n.id);
              return (
                <button
                  key={n.id}
                  onClick={() => openNotif(n)}
                  className={`flex w-full items-start gap-3 border-b border-ink/5 px-4 py-3 text-left transition-colors last:border-0 hover:bg-cream ${isRead ? "opacity-60" : ""}`}
                >
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-base ${n.tint}`}>{n.emoji}</span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-bold text-ink">{n.title}</span>
                      {!isRead && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />}
                    </span>
                    <span className="block truncate text-xs text-muted">{n.message}</span>
                    <span className="text-[10px] text-ink/40">{timeAgo(n.at)}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

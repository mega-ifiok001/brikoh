"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { InventoryProvider, useInventory, walletBalances, fmtMoney } from "@/inventory/lib";
import { Logo } from "@/components/ui";
import ThemeToggle from "@/components/ThemeToggle";
import NotificationBell from "@/components/NotificationBell";
import {
  Wallet, CreditCard, ArrowRightLeft, Coins, ChartUp, Menu, Close, LogOut, Plus, CheckCircle, Trash, ArrowUpRight, ArrowDownRight, Download, Building,
} from "@/components/icons";

const Landmark = (p: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={p.className}>
    <path d="M4 21h16M5 17h14M6 17V9M10 17V9M14 17V9M18 17V9M3 9l9-5 9 5M12 3v1.5" />
  </svg>
);

export type MoneyView =
  | { name: "wallet" }
  | { name: "transactions" }
  | { name: "bank-accounts" }
  | { name: "withdrawals" }
  | { name: "expenses" }
  | { name: "reports" };

const NAV: { key: string; label: string; icon: ReactNode; view: MoneyView }[] = [
  { key: "wallet", label: "Wallet", icon: <Wallet className="h-5 w-5" />, view: { name: "wallet" } },
  { key: "transactions", label: "Payments", icon: <CreditCard className="h-5 w-5" />, view: { name: "transactions" } },
  { key: "bank-accounts", label: "Bank accounts", icon: <Landmark className="h-5 w-5" />, view: { name: "bank-accounts" } },
  { key: "withdrawals", label: "Withdrawals", icon: <ArrowRightLeft className="h-5 w-5" />, view: { name: "withdrawals" } },
  { key: "expenses", label: "Expenses", icon: <Coins className="h-5 w-5" />, view: { name: "expenses" } },
  { key: "reports", label: "Reports", icon: <ChartUp className="h-5 w-5" />, view: { name: "reports" } },
];

/** Deep-link: #/money/<view> → open that section directly. */
function moneyViewFromHash(): MoneyView | null {
  if (typeof window === "undefined") return null;
  const m = window.location.hash.match(/^#\/money\/([a-z-]+)/);
  if (!m) return null;
  const v = m[1];
  const map: Record<string, MoneyView> = {
    wallet: { name: "wallet" },
    transactions: { name: "transactions" },
    "bank-accounts": { name: "bank-accounts" },
    withdrawals: { name: "withdrawals" },
    expenses: { name: "expenses" },
    reports: { name: "reports" },
  };
  return map[v] ?? null;
}

function Shell() {
  const { user, business, logout } = useAuth();
  const { db } = useInventory();
  const [view, setView] = useState<MoneyView>(() => moneyViewFromHash() ?? { name: "wallet" });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onHash = () => {
      const v = moneyViewFromHash();
      if (v) { setView(v); setOpen(false); }
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => { window.scrollTo({ top: 0 }); }, [view]);
  if (!user || !business) return <div className="grid min-h-screen place-items-center"><a href="#/login" className="font-semibold text-brand">Please log in</a></div>;

  const current = NAV.find((n) => n.view.name === view.name);
  const { available, pending } = walletBalances(db);

  const Sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between px-5">
        <a href="#/dashboard" className="inline-flex items-center gap-2">
          <Logo />
          <span className="rounded-full bg-pine/10 px-2.5 py-1 text-[10px] font-bold text-pine">Money & Accounting</span>
        </a>
      </div>
      <div className="mx-4 mb-4 rounded-2xl bg-gradient-to-br from-forest to-pine p-4 text-white">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-white/60">Wallet balance</p>
        <p className="mt-1 font-display text-2xl font-extrabold">{fmtMoney(business.currency, available)}</p>
        <p className="mt-1 text-[11px] text-white/70">{fmtMoney(business.currency, pending)} pending settlement</p>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3">
        {NAV.map((n) => (
          <button key={n.key} onClick={() => { setView(n.view); setOpen(false); }} className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all ${view.name === n.view.name ? "bg-forest text-white shadow-lg shadow-forest/20" : "text-ink/65 hover:bg-ink/5 hover:text-ink"}`}>
            {n.icon} {n.label}
          </button>
        ))}
      </nav>
      <div className="border-t border-ink/5 p-4">
        <a href="#/dashboard" className="mb-3 flex items-center gap-2 rounded-xl bg-cream px-3.5 py-2.5 text-sm font-semibold text-ink/70 transition-colors hover:text-brand">
          <LayoutGridIcon /> Main dashboard overview
        </a>
        <a href="#/inventory" className="mb-3 flex items-center gap-2 rounded-xl bg-cream px-3.5 py-2.5 text-sm font-semibold text-ink/70 transition-colors hover:text-brand">
          <BoxIcon /> Inventory dashboard
        </a>
        <a href="#/dashboard/marketing" className="mb-3 flex items-center gap-2 rounded-xl bg-cream px-3.5 py-2.5 text-sm font-semibold text-ink/70 transition-colors hover:text-brand">
          <MegaphoneIcon /> Marketing
        </a>
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-light to-brand text-sm font-bold text-white">{user.name.charAt(0)}</span>
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-ink">{user.name.split(" ")[0]}</p><p className="truncate text-xs text-muted">{user.email}</p></div>
          <button onClick={logout} aria-label="Log out" className="grid h-8 w-8 place-items-center rounded-lg text-ink/40 hover:bg-red-50 hover:text-red-500"><LogOut className="h-4 w-4" /></button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-cream">
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-white shadow-2xl">
            <button onClick={() => setOpen(false)} className="absolute right-3 top-4 grid h-8 w-8 place-items-center rounded-lg text-ink/50 hover:bg-ink/5" aria-label="Close"><Close className="h-5 w-5" /></button>
            {Sidebar}
          </aside>
        </div>
      )}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-ink/5 bg-white lg:block">{Sidebar}</aside>
      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-ink/5 bg-cream/85 backdrop-blur-xl">
          <div className="flex h-16 min-w-0 items-center gap-2 px-3 sm:gap-4 sm:px-8">
            <button onClick={() => setOpen(true)} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-ink/10 bg-white text-ink lg:hidden" aria-label="Open menu"><Menu className="h-5 w-5" /></button>
            <div className="min-w-0 flex-1">
              <h1 className="truncate font-display text-base font-extrabold tracking-tight text-ink sm:text-lg">{current?.label ?? "Money"}</h1>
              <p className="hidden truncate text-xs text-muted sm:block">Payments · Wallet · Accounting</p>
            </div>
            <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2.5">
              <ThemeToggle />
              <NotificationBell />
              <span className="hidden h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-brand-light to-brand text-sm font-bold text-white sm:grid">{user.name.charAt(0)}</span>
            </div>
          </div>
        </header>
        <main className="px-5 py-6 sm:px-8 sm:py-8">
          {view.name === "wallet" && <WalletView />}
          {view.name === "transactions" && <TransactionsView />}
          {view.name === "bank-accounts" && <BankAccountsView />}
          {view.name === "withdrawals" && <WithdrawalsView />}
          {view.name === "expenses" && <ExpensesView />}
          {view.name === "reports" && <ReportsView />}
        </main>
      </div>
    </div>
  );
}

function LayoutGridIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4"><rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/></svg>;
}
function BoxIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4"><path d="M12 3 4 7.2v9.6L12 21l8-4.2V7.2z"/><path d="M4 7.2 12 11.4l8-4.2M12 11.4V21"/></svg>;
}
function MegaphoneIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4"><path d="M3 10v4a1 1 0 0 0 1 1h2l4 5V4L6 9H4a1 1 0 0 0-1 1z"/><path d="M14 8.5a4.5 4.5 0 0 1 0 7M17 6a8 8 0 0 1 0 12"/></svg>;
}

/* ------------------------------- Wallet ------------------------------- */

function WalletView() {
  const { db, withdraw } = useInventory();
  const { business } = useAuth();
  const cur = business?.currency ?? "NGN";
  const { available, pending } = walletBalances(db);
  const [amount, setAmount] = useState("");
  const [bankId, setBankId] = useState(db.bankAccounts.find((b) => b.isDefault)?.id ?? db.bankAccounts[0]?.id ?? "");
  const [err, setErr] = useState("");
  const [wdId, setWdId] = useState<string | null>(null);

  const bank = db.bankAccounts.find((b) => b.id === bankId);
  const fee = 50;
  const n = Number(amount);

  const submitWithdraw = () => {
    setErr("");
    if (!n || n <= 0) return setErr("Enter an amount.");
    if (n + fee > available) return setErr(`Insufficient available balance (fee included). Max ${fmtMoney(cur, available - fee)}.`);
    if (!bank) return setErr("Add a bank account first.");
    if (!bank.isVerified) return setErr("This bank account is not verified. Verify it before withdrawing.");
    const wd = withdraw(n, bank.id);
    setWdId(wd.id);
    setAmount("");
  };

  const recent = db.ledger.slice(0, 8);

  return (
    <div className="space-y-6">
      {wdId && (
        <div className="flex items-center gap-2 rounded-2xl border border-leaf/30 bg-leaf/10 px-4 py-3 text-sm font-semibold text-forest">
          <CheckCircle className="h-5 w-5 text-leaf" /> Withdrawal {wdId} initiated — transferring to {bank?.accountName} via Paystack. You'll be notified when it completes.
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
        {/* balance + withdraw */}
        <div className="space-y-4">
          <div className="rounded-3xl bg-gradient-to-br from-forest to-pine p-7 text-white shadow-xl shadow-forest/20">
            <p className="text-sm font-medium text-white/70">Available balance</p>
            <p className="mt-1 font-display text-4xl font-extrabold tracking-tight">{fmtMoney(cur, available)}</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white/10 p-3">
                <p className="text-[11px] text-white/60">Pending settlement</p>
                <p className="mt-0.5 font-display text-lg font-extrabold">{fmtMoney(cur, pending)}</p>
              </div>
              <div className="rounded-xl bg-white/10 p-3">
                <p className="text-[11px] text-white/60">Settles by</p>
                <p className="mt-0.5 font-display text-lg font-extrabold">Tomorrow</p>
              </div>
            </div>
            <p className="mt-4 text-[11px] leading-relaxed text-white/60">
              Phase 1 wallet: Brikoh doesn't hold your funds — this mirrors what Paystack has collected & settled to you. Withdrawals trigger a Paystack transfer.
            </p>
          </div>

          <div className="rounded-3xl border border-ink/5 bg-white p-6 shadow-sm">
            <h3 className="font-display text-base font-extrabold text-ink">Withdraw to bank</h3>
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-ink">Amount</label>
                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="w-full rounded-xl border border-ink/10 bg-white px-4 py-3 text-[15px] outline-none focus:border-brand focus:ring-4 focus:ring-brand/10" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-ink">Destination (verified accounts only)</label>
                <select value={bankId} onChange={(e) => setBankId(e.target.value)} className="w-full rounded-xl border border-ink/10 bg-white px-4 py-3 text-[15px] outline-none focus:border-brand">
                  {db.bankAccounts.map((b) => <option key={b.id} value={b.id}>{b.bankName} · {b.accountNumber}{b.isVerified ? "" : " (unverified)"}</option>)}
                </select>
              </div>
              <div className="rounded-xl bg-cream px-4 py-3 text-sm">
                <div className="flex justify-between text-muted"><span>Withdrawal fee</span><span className="font-bold text-ink">{fmtMoney(cur, fee)}</span></div>
                <div className="mt-1 flex justify-between font-bold text-ink"><span>You'll receive</span><span>{fmtMoney(cur, Math.max(0, n - fee))}</span></div>
              </div>
              {err && <p className="text-xs font-medium text-red-500">{err}</p>}
              <button onClick={submitWithdraw} className="w-full rounded-full bg-gradient-to-br from-brand-light to-brand py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand/25 transition-transform hover:-translate-y-0.5">
                Withdraw {fmtMoney(cur, n || 0)}
              </button>
            </div>
          </div>
        </div>

        {/* ledger activity */}
        <div className="rounded-3xl border border-ink/5 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-extrabold text-ink">Wallet activity</h3>
            <span className="rounded-full bg-brand/10 px-2.5 py-1 text-[10px] font-bold text-brand">Ledger</span>
          </div>
          <p className="mt-1 text-xs text-muted">Balance is always the sum of these entries — never a stored number.</p>
          <div className="mt-4 space-y-2">
            {recent.map((l) => {
              const credit = l.amount > 0;
              const tint = l.type === "WITHDRAWAL" || l.type === "FEE" ? "bg-brand/15 text-brand" : l.type === "SALE_SETTLEMENT" && !l.settled ? "bg-sun/20 text-[#b7791f]" : "bg-leaf/15 text-leaf";
              return (
                <div key={l.id} className="flex items-center gap-3 rounded-xl bg-cream p-3.5">
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${tint}`}>{credit ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-ink">{l.note}</p>
                    <p className="text-[11px] text-muted">{l.type.replace(/_/g, " ")} · {l.settled ? "settled" : "pending"} · {new Date(l.at).toLocaleDateString()}</p>
                  </div>
                  <span className={`font-extrabold ${credit ? "text-forest" : "text-ink"}`}>{credit ? "+" : "−"}{fmtMoney(cur, Math.abs(l.amount))}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------- Transactions ---------------------------- */

function TransactionsView() {
  const { db } = useInventory();
  const { business } = useAuth();
  const cur = business?.currency ?? "NGN";
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");

  const list = db.payments.filter((p) => (filter === "all" || p.channel === filter) && (!q || p.paystackReference.toLowerCase().includes(q.toLowerCase()) || p.saleId.toLowerCase().includes(q.toLowerCase())));
  const chanTint: Record<string, string> = { CARD: "bg-leaf/15 text-leaf", BANK_TRANSFER: "bg-pine/15 text-pine", USSD: "bg-sun/20 text-[#b7791f]", QR: "bg-brand/15 text-brand" };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink">Payment transactions</h2>
          <p className="mt-1 text-sm text-muted">Every Paystack payment, reconciled to its sale — nothing silently accepted.</p>
        </div>
        <div className="flex gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search ref or sale…" className="rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand" />
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded-xl border border-ink/10 bg-white px-3 py-2.5 text-sm font-medium outline-none">
            <option value="all">All channels</option>
            <option value="CARD">Card</option>
            <option value="BANK_TRANSFER">Bank transfer</option>
            <option value="USSD">USSD</option>
            <option value="QR">QR</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-ink/5 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="tbl-mobile w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ink/5 text-[11px] font-bold uppercase tracking-wider text-muted">
                <th className="px-5 py-3.5">Reference</th><th className="px-5 py-3.5">Sale</th><th className="px-5 py-3.5">Channel</th><th className="px-5 py-3.5">Amount</th><th className="px-5 py-3.5">Fee</th><th className="px-5 py-3.5">Net</th><th className="px-5 py-3.5">Settlement</th><th className="px-5 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id} className="border-b border-ink/5 last:border-0 hover:bg-cream/50">
                  <td data-label="Ref" className="px-5 py-3.5 font-mono text-xs font-bold text-ink">{p.paystackReference}</td>
                  <td data-label="Sale" className="px-5 py-3.5 font-semibold text-ink">{p.saleId}</td>
                  <td data-label="Channel" className="px-5 py-3.5"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${chanTint[p.channel]}`}>{p.channel}</span></td>
                  <td data-label="Amount" className="px-5 py-3.5 font-extrabold text-ink">{fmtMoney(cur, p.amount)}</td>
                  <td data-label="Fee" className="px-5 py-3.5 text-muted">−{fmtMoney(cur, p.paystackFee)}</td>
                  <td data-label="Net" className="px-5 py-3.5 font-extrabold text-forest">{fmtMoney(cur, p.netAmount)}</td>
                  <td data-label="Settlement" className="px-5 py-3.5 text-muted">{p.settledAt ? new Date(p.settledAt).toLocaleDateString() : <span className="font-bold text-[#b7791f]">Pending</span>}</td>
                  <td data-label="Status" className="px-5 py-3.5"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${p.status === "SUCCESS" ? "bg-leaf/15 text-leaf" : p.status === "PENDING" ? "bg-sun/20 text-[#b7791f]" : "bg-red-100 text-red-500"}`}>{p.status}</span></td>
                </tr>
              ))}
              {list.length === 0 && <tr><td colSpan={8} className="px-5 py-12 text-center text-muted">No payments found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------- Bank accounts ---------------------------- */

function BankAccountsView() {
  const { db, addBankAccount, verifyBankAccount, setDefaultBankAccount } = useInventory();
  const [show, setShow] = useState(false);
  const [acct, setAcct] = useState({ accountNumber: "", bankName: "Guaranty Trust Bank", accountName: "" });
  const [resolved, setResolved] = useState<string | null>(null);

  const submit = () => {
    if (acct.accountNumber.replace(/\D/g, "").length !== 10) return;
    addBankAccount({ ...acct, accountNumber: acct.accountNumber.replace(/\D/g, ""), bankCode: "000" });
    setShow(false); setAcct({ accountNumber: "", bankName: "Guaranty Trust Bank", accountName: "" }); setResolved(null);
  };

  const input = "w-full rounded-xl border border-ink/10 bg-white px-4 py-3 text-[15px] outline-none focus:border-brand focus:ring-4 focus:ring-brand/10";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink">Bank accounts</h2>
          <p className="mt-1 text-sm text-muted">Withdrawals can only go to verified accounts.</p>
        </div>
        <button onClick={() => setShow(true)} className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-brand-light to-brand px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand/25"><Plus className="h-4 w-4" /> Add account</button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {db.bankAccounts.map((b) => (
          <div key={b.id} className={`rounded-2xl border-2 p-5 transition-all ${b.isDefault ? "border-forest/30 bg-forest/[0.03]" : "border-ink/8 bg-white"}`}>
            <div className="flex items-center justify-between">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-pine/10 text-pine"><Building className="h-5 w-5" /></span>
              {b.isVerified ? <span className="rounded-full bg-leaf/15 px-2.5 py-1 text-[10px] font-bold text-leaf">✓ Verified</span> : <span className="rounded-full bg-sun/20 px-2.5 py-1 text-[10px] font-bold text-[#b7791f]">Unverified</span>}
            </div>
            <p className="mt-3 font-display text-lg font-extrabold text-ink">{b.bankName}</p>
            <p className="text-sm text-muted">{b.accountNumber} · {b.accountName || "—"}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {!b.isVerified && <button onClick={() => verifyBankAccount(b.id)} className="rounded-full bg-forest px-4 py-1.5 text-xs font-bold text-white">Verify via Paystack</button>}
              {!b.isDefault && <button onClick={() => setDefaultBankAccount(b.id)} className="rounded-full border border-ink/15 px-4 py-1.5 text-xs font-bold text-ink hover:border-brand hover:text-brand">Set default</button>}
              {b.isDefault && <span className="rounded-full bg-brand/10 px-3 py-1.5 text-xs font-bold text-brand">Default</span>}
            </div>
          </div>
        ))}
      </div>

      {show && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm" onClick={() => setShow(false)}>
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-lg font-extrabold text-ink">Add bank account</h3>
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-ink">Account number</label>
                <input value={acct.accountNumber} onChange={(e) => { setAcct((a) => ({ ...a, accountNumber: e.target.value })); setResolved(null); }} className={input} placeholder="0123456789" maxLength={10} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-ink">Bank</label>
                <select value={acct.bankName} onChange={(e) => setAcct((a) => ({ ...a, bankName: e.target.value }))} className={input}>
                  {["Guaranty Trust Bank", "Kuda Bank", "Access Bank", "Zenith Bank", "First Bank", "UBA", "Opay", "Palmpay"].map((b) => <option key={b}>{b}</option>)}
                </select>
              </div>
              {acct.accountNumber.replace(/\D/g, "").length === 10 && !resolved && (
                <button onClick={() => setResolved("Amara Obi")} className="w-full rounded-full bg-pine/10 py-2.5 text-sm font-bold text-pine hover:bg-pine/20">Resolve account name (Paystack)</button>
              )}
              {resolved && (
                <div className="flex items-center gap-2 rounded-xl bg-leaf/10 px-4 py-3 text-sm font-semibold text-forest">
                  <CheckCircle className="h-4 w-4 text-leaf" /> Account name: {resolved}
                </div>
              )}
            </div>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setShow(false)} className="flex-1 rounded-full border border-ink/15 py-2.5 text-sm font-semibold text-muted">Cancel</button>
              <button onClick={submit} disabled={acct.accountNumber.replace(/\D/g, "").length !== 10} className="flex-1 rounded-full bg-forest py-2.5 text-sm font-semibold text-white disabled:opacity-50">Save & verify</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ----------------------------- Withdrawals ----------------------------- */

function WithdrawalsView() {
  const { db, completeWithdrawal } = useInventory();
  const { business } = useAuth();
  const cur = business?.currency ?? "NGN";
  const statusTint: Record<string, string> = { PENDING: "bg-sun/20 text-[#b7791f]", PROCESSING: "bg-pine/15 text-pine", SUCCESSFUL: "bg-leaf/15 text-leaf", FAILED: "bg-red-100 text-red-500" };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink">Withdrawals</h2>
          <p className="mt-1 text-sm text-muted">Flat ₦50 fee per withdrawal — shown before you confirm, never a surprise.</p>
        </div>
        <button onClick={() => { db.withdrawals.filter((w) => w.status !== "SUCCESSFUL").forEach((w) => completeWithdrawal(w.id)); }} className="rounded-full border border-ink/15 bg-white px-4 py-2.5 text-sm font-semibold text-ink hover:border-brand hover:text-brand">
          Refresh statuses
        </button>
      </div>

      <div className="space-y-3">
        {db.withdrawals.map((w) => {
          const bank = db.bankAccounts.find((b) => b.id === w.bankAccountId);
          return (
            <div key={w.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink/5 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand/10 text-brand"><ArrowRightLeft className="h-5 w-5" /></span>
                <div>
                  <p className="font-bold text-ink">{w.id} · <span className="font-extrabold text-forest">{fmtMoney(cur, w.amount)}</span></p>
                  <p className="text-xs text-muted">To {bank?.bankName} {bank?.accountNumber} · fee {fmtMoney(cur, w.fee)} · {new Date(w.requestedAt).toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${statusTint[w.status]}`}>{w.status}</span>
                {w.completedAt && <span className="text-xs text-muted">{new Date(w.completedAt).toLocaleDateString()}</span>}
              </div>
            </div>
          );
        })}
        {db.withdrawals.length === 0 && <p className="rounded-2xl border border-dashed border-ink/15 bg-white py-12 text-center text-sm text-muted">No withdrawals yet.</p>}
      </div>
    </div>
  );
}

/* ------------------------------ Expenses ------------------------------ */

function ExpensesView() {
  const { db, addExpense, deleteExpense, addExpenseCategory } = useInventory();
  const { business } = useAuth();
  const cur = business?.currency ?? "NGN";
  const [show, setShow] = useState(false);
  const [cat, setCat] = useState(db.expenseCategories[0] ?? "");
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [newCat, setNewCat] = useState("");
  const [filter, setFilter] = useState("all");

  const submit = () => {
    if (!Number(amount) || Number(amount) <= 0 || !cat) return;
    addExpense({ category: cat, amount: Number(amount), description: desc.trim(), date });
    setShow(false); setAmount(""); setDesc("");
  };

  const list = db.expenses.filter((e) => filter === "all" || e.category === filter);
  const total = list.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink">Expenses</h2>
          <p className="mt-1 text-sm text-muted">Record every cost — they feed straight into your Profit & Loss.</p>
        </div>
        <button onClick={() => setShow(true)} className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-brand-light to-brand px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand/25"><Plus className="h-4 w-4" /> Add expense</button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-red-50 p-5 text-center">
          <p className="font-display text-2xl font-extrabold text-red-500">{fmtMoney(cur, total)}</p>
          <p className="text-xs font-semibold text-muted">Filtered total</p>
        </div>
        <div className="rounded-2xl bg-cream p-5 text-center">
          <p className="font-display text-2xl font-extrabold text-ink">{list.length}</p>
          <p className="text-xs font-semibold text-muted">Expenses</p>
        </div>
        <div className="rounded-2xl bg-sun/15 p-5 text-center">
          <p className="font-display text-2xl font-extrabold text-[#b7791f]">{db.expenseCategories.length}</p>
          <p className="text-xs font-semibold text-muted">Categories</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => setFilter("all")} className={`rounded-full px-3.5 py-1.5 text-xs font-bold ${filter === "all" ? "bg-forest text-white" : "bg-white text-ink/70 ring-1 ring-ink/10"}`}>All</button>
        {db.expenseCategories.map((c) => <button key={c} onClick={() => setFilter(c)} className={`rounded-full px-3.5 py-1.5 text-xs font-bold ${filter === c ? "bg-forest text-white" : "bg-white text-ink/70 ring-1 ring-ink/10"}`}>{c}</button>)}
      </div>

      <div className="overflow-hidden rounded-2xl border border-ink/5 bg-white shadow-sm">
        {list.map((e) => (
          <div key={e.id} className="flex items-center gap-3 border-b border-ink/5 px-5 py-3.5 last:border-0 hover:bg-cream/50">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-red-50 text-red-500"><Coins className="h-5 w-5" /></span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-ink">{e.description || e.category}</p>
              <p className="text-xs text-muted">{e.category} · {new Date(e.date).toLocaleDateString()}</p>
            </div>
            <span className="font-extrabold text-ink">−{fmtMoney(cur, e.amount)}</span>
            <button onClick={() => deleteExpense(e.id)} className="grid h-8 w-8 place-items-center rounded-lg text-ink/35 hover:bg-red-50 hover:text-red-500" aria-label="Delete"><Trash className="h-4 w-4" /></button>
          </div>
        ))}
        {list.length === 0 && <p className="py-12 text-center text-sm text-muted">No expenses in this category.</p>}
      </div>

      {/* add category */}
      <div className="flex items-center gap-2 rounded-2xl border border-dashed border-ink/15 bg-white px-4 py-3">
        <input value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="New expense category (e.g. Insurance)" className="flex-1 bg-transparent text-sm outline-none placeholder:text-ink/30" />
        <button onClick={() => { if (newCat.trim()) { addExpenseCategory(newCat.trim()); setNewCat(""); } }} className="inline-flex items-center gap-1 rounded-full bg-pine/10 px-4 py-2 text-xs font-bold text-pine hover:bg-pine/20"><Plus className="h-3.5 w-3.5" /> Add</button>
      </div>

      {show && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm" onClick={() => setShow(false)}>
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-lg font-extrabold text-ink">Add expense</h3>
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-ink">Category</label>
                <select value={cat} onChange={(e) => setCat(e.target.value)} className="w-full rounded-xl border border-ink/10 px-4 py-3 text-[15px] outline-none focus:border-brand">{db.expenseCategories.map((c) => <option key={c}>{c}</option>)}</select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="mb-1.5 block text-xs font-semibold text-ink">Amount</label><input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full rounded-xl border border-ink/10 px-4 py-3 text-[15px] outline-none focus:border-brand" placeholder="0.00" /></div>
                <div><label className="mb-1.5 block text-xs font-semibold text-ink">Date</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full rounded-xl border border-ink/10 px-4 py-3 text-[15px] outline-none focus:border-brand" /></div>
              </div>
              <div><label className="mb-1.5 block text-xs font-semibold text-ink">Description (optional)</label><input value={desc} onChange={(e) => setDesc(e.target.value)} className="w-full rounded-xl border border-ink/10 px-4 py-3 text-[15px] outline-none focus:border-brand" placeholder="e.g. Shop rent — June" /></div>
            </div>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setShow(false)} className="flex-1 rounded-full border border-ink/15 py-2.5 text-sm font-semibold text-muted">Cancel</button>
              <button onClick={submit} className="flex-1 rounded-full bg-forest py-2.5 text-sm font-semibold text-white">Save expense</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------- Reports ------------------------------- */

function csvDownload(filename: string, rows: (string | number)[][]) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function ReportsView() {
  const { db } = useInventory();
  const { business } = useAuth();
  const cur = business?.currency ?? "NGN";
  const [period, setPeriod] = useState<"week" | "month" | "quarter" | "year">("month");

  const days = period === "week" ? 7 : period === "month" ? 30 : period === "quarter" ? 90 : 365;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const inPeriod = (d: string) => new Date(d) >= cutoff;

  const paidSales = db.sales.filter((s) => s.status === "paid" && inPeriod(s.at));
  const revenue = paidSales.reduce((s, x) => s + x.total, 0);
  const cogs = paidSales.reduce((s, sale) => s + sale.items.reduce((a, it) => a + it.qty * (db.products.find((p) => p.id === it.productId)?.costPrice ?? 0), 0), 0);
  const expenses = db.expenses.filter((e) => inPeriod(e.date)).reduce((s, e) => s + e.amount, 0);
  const netProfit = revenue - cogs - expenses;

  const byCategory = db.expenses.filter((e) => inPeriod(e.date)).reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + e.amount;
    return acc;
  }, {});

  const revenueByDay: { label: string; value: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = d.toDateString();
    const val = db.sales.filter((s) => s.status === "paid" && new Date(s.at).toDateString() === key).reduce((s, x) => s + x.total, 0);
    revenueByDay.push({ label: d.toLocaleDateString(undefined, { day: "numeric", month: "short" }), value: val });
  }
  const maxDay = Math.max(...revenueByDay.map((d) => d.value), 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink">Accounting reports</h2>
          <p className="mt-1 text-sm text-muted">Revenue, expenses and profit — calculated live, filterable by the same periods.</p>
        </div>
        <div className="flex rounded-full bg-white p-1 ring-1 ring-ink/10">
          {(["week", "month", "quarter", "year"] as const).map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className={`rounded-full px-3.5 py-1.5 text-xs font-bold capitalize transition-all ${period === p ? "bg-forest text-white" : "text-muted hover:text-ink"}`}>{p}</button>
          ))}
        </div>
      </div>

      {/* P&L */}
      <div className="rounded-3xl border border-ink/5 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-extrabold text-ink">Profit & Loss</h3>
          <button onClick={() => csvDownload(`brikoh-pnl-${period}.csv`, [["Metric", "Amount"], ["Revenue", revenue], ["COGS", cogs], ["Expenses", expenses], ["Net Profit", netProfit]])} className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-4 py-2 text-xs font-bold text-ink hover:border-brand hover:text-brand"><Download className="h-3.5 w-3.5" /> Export CSV</button>
        </div>
        <div className="mt-4 space-y-2">
          {[
            { k: "Total revenue (paid sales)", v: revenue, tint: "text-forest" },
            { k: "− Cost of goods sold", v: -cogs, tint: "text-muted" },
            { k: "− Total expenses", v: -expenses, tint: "text-muted" },
          ].map((r) => (
            <div key={r.k} className="flex items-center justify-between rounded-xl bg-cream px-4 py-3 text-sm">
              <span className="text-ink/75">{r.k}</span>
              <span className={`font-extrabold ${r.tint}`}>{fmtMoney(cur, r.v)}</span>
            </div>
          ))}
          <div className={`mt-2 flex items-center justify-between rounded-2xl px-5 py-4 ${netProfit >= 0 ? "bg-leaf/10" : "bg-red-50"}`}>
            <span className="font-display text-base font-extrabold text-ink">Net profit</span>
            <span className={`font-display text-xl font-extrabold ${netProfit >= 0 ? "text-forest" : "text-red-500"}`}>{fmtMoney(cur, netProfit)}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* revenue trend */}
        <div className="rounded-3xl border border-ink/5 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-extrabold text-ink">Revenue trend</h3>
            <button onClick={() => csvDownload("brikoh-revenue.csv", [["Day", "Revenue"], ...revenueByDay.map((d) => [d.label, d.value])])} className="inline-flex items-center gap-1 rounded-full border border-ink/15 px-3 py-1.5 text-[11px] font-bold text-ink hover:text-brand"><Download className="h-3 w-3" /> Export</button>
          </div>
          <div className="mt-5 flex h-40 items-end gap-1">
            {revenueByDay.map((d, i) => (
              <div key={i} className="group relative flex-1">
                <div className="w-full rounded-t bg-gradient-to-t from-brand/20 to-brand" style={{ height: `${Math.max(4, (d.value / maxDay) * 100)}%` }} />
                {i % Math.max(1, Math.floor(days / 8)) === 0 && <p className="mt-1 text-center text-[9px] text-muted">{d.label}</p>}
              </div>
            ))}
          </div>
        </div>

        {/* expenses by category */}
        <div className="rounded-3xl border border-ink/5 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-extrabold text-ink">Expenses by category</h3>
            <button onClick={() => csvDownload("brikoh-expenses.csv", [["Category", "Amount"], ...Object.entries(byCategory)])} className="inline-flex items-center gap-1 rounded-full border border-ink/15 px-3 py-1.5 text-[11px] font-bold text-ink hover:text-brand"><Download className="h-3 w-3" /> Export</button>
          </div>
          <div className="mt-5 space-y-3">
            {Object.entries(byCategory).map(([cat, val]) => (
              <div key={cat}>
                <div className="flex justify-between text-sm"><span className="font-medium text-ink/80">{cat}</span><span className="font-bold text-ink">{fmtMoney(cur, val)}</span></div>
                <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-ink/5"><div className="h-full rounded-full bg-gradient-to-r from-brand to-sun" style={{ width: `${(val / Math.max(1, Math.max(...Object.values(byCategory)))) * 100}%` }} /></div>
              </div>
            ))}
            {Object.keys(byCategory).length === 0 && <p className="py-6 text-center text-sm text-muted">No expenses in this period.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MoneyApp() {
  return (
    <InventoryProvider>
      <Shell />
    </InventoryProvider>
  );
}

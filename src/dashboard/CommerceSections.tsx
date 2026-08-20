"use client";

import { useState } from "react";
import { useApi } from "@/api/useApi";
import { ApiError } from "@/api/types";
import { discountsService, expensesService, invoicesService, customersService, productsService } from "@/api/services";
import type { DiscountType, ExpenseCategory, InvoiceDetail } from "@/api/types";
import { SkeletonRows } from "@/components/Skeleton";
import { Plus, Trash, X, Refresh, AlertCircle, Tag, Coins, FileText, Send, Ban } from "@/components/icons";

const input = "w-full rounded-xl border border-ink/10 bg-white px-4 py-3 text-[15px] text-ink outline-none transition-all focus:border-brand focus:ring-4 focus:ring-brand/10";

function ErrorCard({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed border-red-200 bg-red-50/50 px-6 py-12 text-center">
      <AlertCircle className="h-8 w-8 text-red-400" />
      <p className="mt-3 text-sm font-semibold text-red-500">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-white">
          <Refresh className="h-4 w-4" /> Retry
        </button>
      )}
    </div>
  );
}

function SectionHead({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink">{title}</h2>
        {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-extrabold text-ink">{title}</h3>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-ink/40 hover:bg-ink/5"><X className="h-5 w-5" /></button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}

function useSubmit(onSaved: () => void) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const run = async (fn: () => Promise<unknown>) => {
    setError("");
    setBusy(true);
    try { await fn(); onSaved(); return true; }
    catch (e) { setError(e instanceof ApiError ? e.message : (e as Error).message); return false; }
    finally { setBusy(false); }
  };
  return { error, busy, run };
}

/* ============================== Discounts ============================== */

export function DiscountsSection() {
  const list = useApi(() => discountsService.list());
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<DiscountType>("PERCENTAGE");
  const [value, setValue] = useState("");
  const [code, setCode] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const submit = useSubmit(() => { setOpen(false); list.refetch(); });

  const create = () => submit.run(async () => {
    if (name.trim().length < 1) throw new Error("Discount name required.");
    if (!Number(value) || Number(value) <= 0) throw new Error("Value must be > 0.");
    await discountsService.create({
      name: name.trim(), type, value,
      code: code.trim() || undefined,
      maxUses: maxUses ? Number(maxUses) : undefined,
    });
    setName(""); setValue(""); setCode(""); setMaxUses("");
  });

  const toggleActive = async (id: string, isActive: boolean) => {
    try { await discountsService.update(id, { isActive: !isActive }); list.refetch(); } catch (e) { alert((e as Error).message); }
  };
  const del = async (id: string) => { if (confirm("Delete this discount?")) { try { await discountsService.del(id); list.refetch(); } catch (e) { alert((e as Error).message); } } };

  return (
    <div className="space-y-5">
      <SectionHead
        title="Discounts"
        sub="discounts.manage · percentage/fixed, coupon limits & auto-applied via groups"
        action={
          <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-brand-light to-brand px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand/25">
            <Plus className="h-4 w-4" /> New discount
          </button>
        }
      />

      {list.loading ? <SkeletonRows rows={4} /> : list.error ? <ErrorCard message={list.error} onRetry={list.refetch} /> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(list.data?.items ?? []).map((d) => (
            <div key={d.id} className={`rounded-2xl border p-5 shadow-sm ${d.isActive ? "border-leaf/25 bg-white" : "border-ink/5 bg-white/60"}`}>
              <div className="flex items-center justify-between">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand/10 text-brand"><Tag className="h-5 w-5" /></span>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${d.isActive ? "bg-leaf/15 text-leaf" : "bg-ink/10 text-muted"}`}>{d.isActive ? "Active" : "Paused"}</span>
              </div>
              <p className="mt-3 font-display text-base font-extrabold text-ink">{d.name}</p>
              <p className="text-sm font-bold text-forest">{d.type === "PERCENTAGE" ? `${d.value}% off` : `${d.value} off`}</p>
              {d.code && (
                <p className="mt-2 inline-block rounded-lg border-2 border-dashed border-forest/30 bg-white px-2.5 py-1 font-mono text-xs font-extrabold text-forest">{d.code}</p>
              )}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {d.maxUses != null && <span className="rounded-full bg-cream px-2 py-0.5 text-[10px] font-semibold text-muted">max {d.maxUses} uses</span>}
                {d.firstOrderOnly && <span className="rounded-full bg-cream px-2 py-0.5 text-[10px] font-semibold text-muted">first order only</span>}
                {d.minSubtotal && <span className="rounded-full bg-cream px-2 py-0.5 text-[10px] font-semibold text-muted">min {d.minSubtotal}</span>}
              </div>
              <div className="mt-4 flex gap-2">
                <button onClick={() => toggleActive(d.id, d.isActive)} className="rounded-full border border-ink/15 px-3.5 py-1.5 text-xs font-bold text-ink hover:border-brand hover:text-brand">{d.isActive ? "Pause" : "Activate"}</button>
                <button onClick={() => del(d.id)} className="rounded-full border border-red-200 px-3.5 py-1.5 text-xs font-bold text-red-400 hover:bg-red-50">Delete</button>
              </div>
            </div>
          ))}
          {(list.data?.items ?? []).length === 0 && <p className="py-8 text-center text-sm text-muted sm:col-span-3">No discounts yet.</p>}
        </div>
      )}

      {open && (
        <Modal title="New discount" onClose={() => setOpen(false)}>
          {submit.error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-500">{submit.error}</p>}
          <div className="space-y-3">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Discount name" className={input} />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-ink">Type</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(["PERCENTAGE", "FIXED"] as const).map((t) => (
                    <button key={t} onClick={() => setType(t)} className={`rounded-xl border-2 py-2 text-xs font-bold ${type === t ? "border-brand bg-brand/[0.06] text-brand" : "border-ink/8 text-muted"}`}>{t === "PERCENTAGE" ? "%" : "₦"}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-ink">Value</label>
                <input type="number" value={value} onChange={(e) => setValue(e.target.value)} placeholder={type === "PERCENTAGE" ? "10" : "2000"} className={input} />
              </div>
            </div>
            <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Coupon code (optional, e.g. SAVE10)" className={input} />
            <input type="number" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} placeholder="Max uses (optional, makes it a coupon)" className={input} />
          </div>
          <button onClick={create} disabled={submit.busy} className="mt-4 w-full rounded-full bg-forest py-3 text-sm font-bold text-white disabled:opacity-60">{submit.busy ? "Creating…" : "Create discount"}</button>
        </Modal>
      )}
    </div>
  );
}

/* ============================== Expenses ============================== */

const EXPENSE_CATS: ExpenseCategory[] = ["RENT", "TRANSPORT", "PACKAGING", "SALARIES", "MARKETING", "UTILITIES", "OTHER"];

export function ExpensesSection() {
  const list = useApi(() => expensesService.list());
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<ExpenseCategory>("OTHER");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [filterCat, setFilterCat] = useState("");
  const submit = useSubmit(() => { setOpen(false); list.refetch(); });

  const create = () => submit.run(async () => {
    if (!Number(amount) || Number(amount) <= 0) throw new Error("Amount must be > 0.");
    await expensesService.create({ category, amount, description: description.trim() || null, date });
    setAmount(""); setDescription("");
  });

  const del = async (id: string) => { if (confirm("Delete this expense?")) { try { await expensesService.del(id); list.refetch(); } catch (e) { alert((e as Error).message); } } };

  const expenses = (list.data?.expenses ?? []).filter((e) => !filterCat || e.category === filterCat);
  const total = expenses.reduce((s, e) => s + Number(e.amount), 0);

  return (
    <div className="space-y-5">
      <SectionHead
        title="Expenses"
        sub="analytics.manage · feeds the Profit & Loss report"
        action={
          <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-brand-light to-brand px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand/25">
            <Plus className="h-4 w-4" /> Add expense
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-red-50 p-5 text-center">
          <p className="font-display text-2xl font-extrabold text-red-500">{total.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
          <p className="text-xs font-semibold text-muted">Filtered total</p>
        </div>
        <div className="rounded-2xl bg-cream p-5 text-center">
          <p className="font-display text-2xl font-extrabold text-ink">{expenses.length}</p>
          <p className="text-xs font-semibold text-muted">Expenses</p>
        </div>
        <div className="rounded-2xl bg-sun/15 p-5 text-center">
          <p className="font-display text-2xl font-extrabold text-[#b7791f]">{EXPENSE_CATS.length}</p>
          <p className="text-xs font-semibold text-muted">Categories</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => setFilterCat("")} className={`rounded-full px-3.5 py-1.5 text-xs font-bold ${!filterCat ? "bg-forest text-white" : "bg-white text-ink/70 ring-1 ring-ink/10"}`}>All</button>
        {EXPENSE_CATS.map((c) => (
          <button key={c} onClick={() => setFilterCat(c)} className={`rounded-full px-3.5 py-1.5 text-xs font-bold ${filterCat === c ? "bg-forest text-white" : "bg-white text-ink/70 ring-1 ring-ink/10"}`}>{c}</button>
        ))}
      </div>

      {list.loading ? <SkeletonRows rows={4} /> : list.error ? <ErrorCard message={list.error} onRetry={list.refetch} /> : (
        <div className="space-y-2.5">
          {expenses.map((e) => (
            <div key={e.id} className="flex items-center gap-3 rounded-2xl border border-ink/5 bg-white p-4 shadow-sm">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-red-50 text-red-500"><Coins className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-ink">{e.description ?? e.category}</p>
                <p className="text-xs text-muted">{e.category} · {e.date}</p>
              </div>
              <span className="font-extrabold text-ink">−{e.amount}</span>
              <button onClick={() => del(e.id)} className="grid h-8 w-8 place-items-center rounded-lg text-ink/35 hover:text-red-500"><Trash className="h-4 w-4" /></button>
            </div>
          ))}
          {expenses.length === 0 && <p className="py-8 text-center text-sm text-muted">No expenses{filterCat ? ` in ${filterCat}` : ""}.</p>}
        </div>
      )}

      {open && (
        <Modal title="Add expense" onClose={() => setOpen(false)}>
          {submit.error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-500">{submit.error}</p>}
          <div className="space-y-3">
            <select value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)} className={input}>
              {EXPENSE_CATS.map((c) => <option key={c}>{c}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-3">
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" className={input} />
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={input} />
            </div>
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" className={input} />
          </div>
          <button onClick={create} disabled={submit.busy} className="mt-4 w-full rounded-full bg-forest py-3 text-sm font-bold text-white disabled:opacity-60">{submit.busy ? "Saving…" : "Save expense"}</button>
        </Modal>
      )}
    </div>
  );
}

/* ============================== Invoices ============================== */

export function InvoicesSection() {
  const list = useApi(() => invoicesService.list());
  const [open, setOpen] = useState(false);
  const [customers, setCustomers] = useState<Awaited<ReturnType<typeof customersService.list>>["items"]>([]);
  const [products, setProducts] = useState<Awaited<ReturnType<typeof productsService.list>>["items"]>([]);
  const [customerId, setCustomerId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [lines, setLines] = useState<{ productId: string; quantity: string; unitPriceAtIssue: string }[]>([{ productId: "", quantity: "1", unitPriceAtIssue: "" }]);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<InvoiceDetail | null>(null);
  const [payAmt, setPayAmt] = useState("");
  const [filter, setFilter] = useState("");
  const submit = useSubmit(() => { setOpen(false); list.refetch(); });
  const detailSubmit = useSubmit(async () => { if (detailId) setDetail(await invoicesService.get(detailId)); });

  const loadRefs = async () => {
    try {
      const [c, p] = await Promise.all([customersService.list({ limit: 50 }), productsService.list(100)]);
      setCustomers(c.items); setProducts(p.items);
    } catch { /* ignore */ }
  };

  const openModal = () => { setOpen(true); loadRefs(); };

  const create = () => submit.run(async () => {
    if (!customerId) throw new Error("Select a customer.");
    const cleaned = lines.filter((l) => l.productId && Number(l.quantity) > 0);
    if (cleaned.length === 0) throw new Error("Add at least one line item.");
    await invoicesService.create({
      customerId,
      dueDate: dueDate ? new Date(dueDate + "T00:00:00Z").toISOString() : null,
      lineItems: cleaned.map((l) => ({ productId: l.productId, quantity: Number(l.quantity), unitPriceAtIssue: l.unitPriceAtIssue })),
    });
    setCustomerId(""); setDueDate(""); setLines([{ productId: "", quantity: "1", unitPriceAtIssue: "" }]);
  });

  const openDetail = async (id: string) => { setDetailId(id); setDetail(null); setPayAmt(""); try { setDetail(await invoicesService.get(id)); } catch (e) { alert((e as Error).message); setDetailId(null); } };

  const issue = async (id: string) => { try { await invoicesService.issue(id); list.refetch(); } catch (e) { alert((e as Error).message); } };
  const voidInvoice = async (id: string) => { if (confirm("Void this invoice? It must have no payments.")) { try { await invoicesService.void(id); list.refetch(); } catch (e) { alert((e as Error).message); } } };
  const delDraft = async (id: string) => { if (confirm("Delete this draft invoice?")) { try { await invoicesService.del(id); list.refetch(); } catch (e) { alert((e as Error).message); } } };

  const pay = () => detailSubmit.run(async () => {
    if (!detailId || !Number(payAmt)) throw new Error("Enter a payment amount.");
    await invoicesService.pay(detailId, { amount: payAmt });
    setPayAmt("");
  });

  const invoices = (list.data?.items ?? []).filter((i) => !filter || i.status === filter);
  const statusTint: Record<string, string> = { DRAFT: "bg-ink/10 text-muted", ISSUED: "bg-sun/20 text-[#b7791f]", PAID: "bg-leaf/15 text-leaf", VOID: "bg-red-100 text-red-500" };

  return (
    <div className="space-y-5">
      <SectionHead
        title="Invoices"
        sub="invoices.manage · DRAFT → ISSUED → PAID (or VOID); payments are append-only"
        action={
          <div className="flex gap-2">
            <select value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded-xl border border-ink/10 bg-white px-3 py-2.5 text-sm font-medium outline-none">
              <option value="">All statuses</option>
              {(["DRAFT", "ISSUED", "PAID", "VOID"] as const).map((s) => <option key={s}>{s}</option>)}
            </select>
            <button onClick={openModal} className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-brand-light to-brand px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand/25">
              <Plus className="h-4 w-4" /> New invoice
            </button>
          </div>
        }
      />

      {list.loading ? <SkeletonRows rows={4} /> : list.error ? <ErrorCard message={list.error} onRetry={list.refetch} /> : (
        <div className="space-y-2.5">
          {invoices.map((inv) => (
            <div key={inv.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-ink/5 bg-white p-4 shadow-sm">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand"><FileText className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-ink">{inv.number ?? "Draft"} · {inv.customer.name}</p>
                <p className="text-xs text-muted">{inv.itemCount} item(s) · {new Date(inv.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-extrabold text-ink">{inv.total}</p>
                {Number(inv.balanceDue) > 0 && inv.status === "ISSUED" && <p className="text-[10px] font-bold text-[#b7791f]">due {inv.balanceDue}</p>}
                {inv.status === "PAID" && <p className="text-[10px] font-bold text-leaf">Paid</p>}
              </div>
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${statusTint[inv.status]}`}>{inv.status}</span>
              <div className="flex gap-1.5">
                <button onClick={() => openDetail(inv.id)} className="rounded-full border border-ink/15 px-3.5 py-1.5 text-xs font-bold text-ink hover:border-brand hover:text-brand">View</button>
                {inv.status === "DRAFT" && (
                  <>
                    <button onClick={() => issue(inv.id)} className="inline-flex items-center gap-1 rounded-full bg-forest px-3.5 py-1.5 text-xs font-bold text-white"><Send className="h-3 w-3" /> Issue</button>
                    <button onClick={() => delDraft(inv.id)} className="grid h-7 w-7 place-items-center rounded-lg text-ink/35 hover:text-red-500"><Trash className="h-4 w-4" /></button>
                  </>
                )}
                {inv.status === "ISSUED" && (
                  <button onClick={() => voidInvoice(inv.id)} className="inline-flex items-center gap-1 rounded-full border border-red-200 px-3.5 py-1.5 text-xs font-bold text-red-400 hover:bg-red-50"><Ban className="h-3 w-3" /> Void</button>
                )}
              </div>
            </div>
          ))}
          {invoices.length === 0 && <p className="py-8 text-center text-sm text-muted">No invoices{filter ? ` with status ${filter}` : ""}.</p>}
        </div>
      )}

      {open && (
        <Modal title="New invoice (DRAFT)" onClose={() => setOpen(false)}>
          {submit.error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-500">{submit.error}</p>}
          <div className="space-y-3">
            <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className={input}>
              <option value="">Select customer…</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={input} />
            <p className="text-xs font-bold uppercase tracking-wider text-muted">Line items</p>
            {lines.map((l, i) => (
              <div key={i} className="grid grid-cols-[1fr_60px_80px_28px] items-center gap-2">
                <select value={l.productId} onChange={(e) => setLines((ls) => ls.map((x, j) => (j === i ? { ...x, productId: e.target.value } : x)))} className="rounded-xl border border-ink/10 px-3 py-2.5 text-sm outline-none">
                  <option value="">Product…</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <input type="number" value={l.quantity} onChange={(e) => setLines((ls) => ls.map((x, j) => (j === i ? { ...x, quantity: e.target.value } : x)))} placeholder="Qty" className="rounded-xl border border-ink/10 px-3 py-2.5 text-sm outline-none" />
                <input value={l.unitPriceAtIssue} onChange={(e) => setLines((ls) => ls.map((x, j) => (j === i ? { ...x, unitPriceAtIssue: e.target.value } : x)))} placeholder="Price" className="rounded-xl border border-ink/10 px-3 py-2.5 text-sm outline-none" />
                <button onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))} className="grid h-9 w-9 place-items-center rounded-lg text-ink/40 hover:text-red-500">✕</button>
              </div>
            ))}
            <button onClick={() => setLines((ls) => [...ls, { productId: "", quantity: "1", unitPriceAtIssue: "" }])} className="inline-flex items-center gap-1 text-xs font-bold text-brand"><Plus className="h-3.5 w-3.5" /> Add line</button>
          </div>
          <button onClick={create} disabled={submit.busy} className="mt-4 w-full rounded-full bg-forest py-3 text-sm font-bold text-white disabled:opacity-60">{submit.busy ? "Creating…" : "Create draft"}</button>
        </Modal>
      )}

      {detailId && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm" onClick={() => setDetailId(null)}>
          <div className="max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-extrabold text-ink">{detail?.invoice.number ?? "Invoice"}</h3>
                <p className="text-xs text-muted">{detail?.invoice.customer.name}</p>
              </div>
              <button onClick={() => setDetailId(null)} className="grid h-8 w-8 place-items-center rounded-lg text-ink/40 hover:bg-ink/5"><X className="h-5 w-5" /></button>
            </div>
            {!detail ? <div className="mt-4"><SkeletonRows rows={4} /></div> : (
              <div className="mt-4 space-y-5">
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl bg-cream p-3"><p className="text-[11px] text-muted">Total</p><p className="font-extrabold text-ink">{detail.invoice.total}</p></div>
                  <div className="rounded-xl bg-cream p-3"><p className="text-[11px] text-muted">Paid</p><p className="font-extrabold text-leaf">{detail.invoice.amountPaid}</p></div>
                  <div className="rounded-xl bg-cream p-3"><p className="text-[11px] text-muted">Due</p><p className="font-extrabold text-[#b7791f]">{detail.invoice.balanceDue}</p></div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted">Line items</h4>
                  <div className="mt-2 space-y-1.5">
                    {detail.lineItems.map((li) => (
                      <div key={li.id} className="flex items-center justify-between rounded-xl bg-cream px-4 py-2.5 text-sm">
                        <span className="font-semibold text-ink">{li.productName} × {li.quantity}</span>
                        <span className="font-bold text-ink">{li.lineTotal}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {detail.invoice.status === "ISSUED" && (
                  <div className="rounded-xl bg-sun/10 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#b7791f]">Record payment</p>
                    {detailSubmit.error && <p className="mt-1 text-xs font-medium text-red-500">{detailSubmit.error}</p>}
                    <div className="mt-2 flex gap-2">
                      <input value={payAmt} onChange={(e) => setPayAmt(e.target.value)} placeholder="Amount" className={input} />
                      <button onClick={pay} disabled={detailSubmit.busy} className="shrink-0 rounded-full bg-forest px-5 text-sm font-bold text-white disabled:opacity-60">{detailSubmit.busy ? "…" : "Pay"}</button>
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted">Payment history</h4>
                  <div className="mt-2 space-y-1.5">
                    {detail.payments.map((p) => (
                      <div key={p.id} className="flex items-center justify-between rounded-xl bg-cream px-4 py-2.5 text-sm">
                        <span className="font-semibold text-ink">{p.amount} <span className="text-xs text-muted">· {p.recordedByName}</span></span>
                        <span className="text-xs text-muted">{new Date(p.createdAt).toLocaleString()}</span>
                      </div>
                    ))}
                    {detail.payments.length === 0 && <p className="py-2 text-center text-xs text-muted">No payments yet.</p>}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

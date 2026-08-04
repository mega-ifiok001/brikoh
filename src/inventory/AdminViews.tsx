"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useInventory, fmtMoney } from "./lib";
import { Plus, Tag, Box, Percent, Badge, ScrollText, Coins, Shield, CheckCircle } from "@/components/icons";

const input = "w-full rounded-xl border border-ink/10 bg-white px-4 py-3 text-[15px] outline-none focus:border-brand focus:ring-4 focus:ring-brand/10";

/* ------------------------- Categories & units ------------------------- */

export function CategoriesUnits() {
  const { db, addCategory, addUnit, addBranch } = useInventory();
  const [cat, setCat] = useState("");
  const [unit, setUnit] = useState("");
  const [branchName, setBranchName] = useState("");
  const [branchLoc, setBranchLoc] = useState("");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink">Categories, units & branches</h2>
        <p className="mt-1 text-sm text-muted">Keep your catalogue tidy — used across products, discounts and reports.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-ink/5 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2"><Tag className="h-5 w-5 text-brand" /><h3 className="font-display text-base font-extrabold text-ink">Categories</h3></div>
          <div className="mt-4 flex flex-wrap gap-2">
            {db.categories.map((c) => <span key={c} className="rounded-full bg-cream px-3 py-1.5 text-xs font-bold text-ink/75 ring-1 ring-ink/5">{c}</span>)}
          </div>
          <div className="mt-4 flex gap-2">
            <input value={cat} onChange={(e) => setCat(e.target.value)} placeholder="New category" className="flex-1 rounded-xl border border-ink/10 px-3.5 py-2.5 text-sm outline-none focus:border-brand" />
            <button onClick={() => { if (cat.trim()) { addCategory(cat.trim()); setCat(""); } }} className="grid h-10 w-10 place-items-center rounded-xl bg-forest text-white"><Plus className="h-4 w-4" /></button>
          </div>
        </div>

        <div className="rounded-3xl border border-ink/5 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2"><Box className="h-5 w-5 text-pine" /><h3 className="font-display text-base font-extrabold text-ink">Units</h3></div>
          <div className="mt-4 flex flex-wrap gap-2">
            {db.units.map((u) => <span key={u} className="rounded-full bg-cream px-3 py-1.5 text-xs font-bold text-ink/75 ring-1 ring-ink/5">{u}</span>)}
          </div>
          <div className="mt-4 flex gap-2">
            <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="New unit (e.g. Dozen)" className="flex-1 rounded-xl border border-ink/10 px-3.5 py-2.5 text-sm outline-none focus:border-brand" />
            <button onClick={() => { if (unit.trim()) { addUnit(unit.trim()); setUnit(""); } }} className="grid h-10 w-10 place-items-center rounded-xl bg-forest text-white"><Plus className="h-4 w-4" /></button>
          </div>
        </div>

        <div className="rounded-3xl border border-ink/5 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2"><Shield className="h-5 w-5 text-brand" /><h3 className="font-display text-base font-extrabold text-ink">Branches</h3></div>
          <div className="mt-4 space-y-2">
            {db.branches.map((b) => <div key={b.id} className="flex items-center justify-between rounded-xl bg-cream px-3.5 py-2.5 text-sm"><span className="font-bold text-ink">{b.name}</span><span className="text-xs text-muted">{b.location}</span></div>)}
          </div>
          <div className="mt-4 flex gap-2">
            <input value={branchName} onChange={(e) => setBranchName(e.target.value)} placeholder="Branch name" className="flex-1 rounded-xl border border-ink/10 px-3.5 py-2.5 text-sm outline-none focus:border-brand" />
            <input value={branchLoc} onChange={(e) => setBranchLoc(e.target.value)} placeholder="Location" className="w-24 rounded-xl border border-ink/10 px-3 py-2.5 text-sm outline-none focus:border-brand" />
            <button onClick={() => { if (branchName.trim()) { addBranch(branchName.trim(), branchLoc.trim()); setBranchName(""); setBranchLoc(""); } }} className="grid h-10 w-10 place-items-center rounded-xl bg-forest text-white"><Plus className="h-4 w-4" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ Discounts ------------------------------ */

export function Discounts() {
  const { db, addDiscount, toggleDiscount } = useInventory();
  const [show, setShow] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<"percentage" | "fixed">("percentage");
  const [value, setValue] = useState("10");
  const [appliesTo, setAppliesTo] = useState<"product" | "category" | "group" | "all">("all");
  const [target, setTarget] = useState("");

  const submit = () => {
    if (name.trim().length < 2 || !Number(value)) return;
    addDiscount({ name: name.trim(), type, value: Number(value), appliesTo, target: appliesTo === "all" ? "All products" : target, start: null, end: null, active: true });
    setShow(false); setName(""); setTarget("");
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink">Discounts</h2>
          <p className="mt-1 text-sm text-muted">Percentage or fixed discounts for products, categories, groups or everything.</p>
        </div>
        <button onClick={() => setShow(true)} className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-brand-light to-brand px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand/25"><Plus className="h-4 w-4" /> Create discount</button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {db.discounts.map((d) => (
          <div key={d.id} className="rounded-2xl border border-ink/5 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand/10 text-brand"><Percent className="h-5 w-5" /></span>
              <div className="flex-1">
                <p className="font-bold text-ink">{d.name}</p>
                <p className="text-xs capitalize text-muted">{d.appliesTo === "group" ? `Group: ${db.groups.find((g) => g.id === d.target)?.name ?? d.target}` : `${d.appliesTo}: ${d.target}`}</p>
              </div>
              <span className="font-display text-lg font-extrabold text-forest">{d.type === "percentage" ? `${d.value}%` : `₦${d.value}`}</span>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-ink/5 pt-3">
              <button onClick={() => toggleDiscount(d.id)} className={`rounded-full px-3 py-1 text-[11px] font-bold ${d.active ? "bg-leaf/15 text-leaf" : "bg-ink/10 text-muted"}`}>{d.active ? "Active" : "Paused"}</button>
              {d.end && <span className="text-[11px] text-muted">Until {d.end}</span>}
            </div>
          </div>
        ))}
      </div>

      {show && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm" onClick={() => setShow(false)}>
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-lg font-extrabold text-ink">Create discount</h3>
            <div className="mt-4 space-y-3">
              <div><label className="mb-1.5 block text-xs font-semibold text-ink">Name</label><input autoFocus value={name} onChange={(e) => setName(e.target.value)} className={input} placeholder="e.g. Beauty week 15%" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-ink">Type</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(["percentage", "fixed"] as const).map((t) => <button key={t} onClick={() => setType(t)} className={`rounded-xl border-2 py-2 text-xs font-bold capitalize ${type === t ? "border-brand bg-brand/[0.06] text-brand" : "border-ink/8 text-muted"}`}>{t}</button>)}
                  </div>
                </div>
                <div><label className="mb-1.5 block text-xs font-semibold text-ink">Value</label><input type="number" value={value} onChange={(e) => setValue(e.target.value)} className={input} /></div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-ink">Applies to</label>
                <select value={appliesTo} onChange={(e) => setAppliesTo(e.target.value as typeof appliesTo)} className={input}>
                  <option value="all">All products</option>
                  <option value="product">Specific product</option>
                  <option value="category">Category</option>
                  <option value="group">Customer group</option>
                </select>
              </div>
              {appliesTo !== "all" && (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-ink">{appliesTo === "group" ? "Customer group" : appliesTo === "category" ? "Category" : "Product"}</label>
                  <select value={target} onChange={(e) => setTarget(e.target.value)} className={input}>
                    <option value="">Select…</option>
                    {appliesTo === "category" && db.categories.map((c) => <option key={c}>{c}</option>)}
                    {appliesTo === "group" && db.groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                    {appliesTo === "product" && db.products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              )}
            </div>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setShow(false)} className="flex-1 rounded-full border border-ink/15 py-2.5 text-sm font-semibold text-muted">Cancel</button>
              <button onClick={submit} className="flex-1 rounded-full bg-forest py-2.5 text-sm font-semibold text-white">Create discount</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------- Staff -------------------------------- */

const ROLES: { id: "owner" | "admin" | "manager" | "cashier"; label: string; perms: string[] }[] = [
  { id: "owner", label: "Owner", perms: ["all"] },
  { id: "admin", label: "Admin", perms: ["all"] },
  { id: "manager", label: "Manager", perms: ["view_profit", "manage_products", "record_sales", "manage_staff"] },
  { id: "cashier", label: "Cashier", perms: ["record_sales"] },
];

export function Staff() {
  const { db, addStaff, toggleStaff, setStaffRole } = useInventory();
  const [show, setShow] = useState(false);
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [phone, setPhone] = useState(""); const [role, setRole] = useState<(typeof ROLES)[number]["id"]>("cashier");

  const submit = () => {
    if (name.trim().length < 2) return;
    const r = ROLES.find((x) => x.id === role)!;
    addStaff({ name: name.trim(), email: email.trim(), phone: phone.trim(), role, permissions: r.perms, active: true });
    setShow(false); setName(""); setEmail(""); setPhone("");
  };

  const roleTint: Record<string, string> = { owner: "bg-brand/15 text-brand", admin: "bg-pine/15 text-pine", manager: "bg-sun/20 text-[#b7791f]", cashier: "bg-leaf/15 text-leaf" };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink">Staff & roles</h2>
          <p className="mt-1 text-sm text-muted">Invite team members with role-based permissions — every action is audited.</p>
        </div>
        <button onClick={() => setShow(true)} className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-brand-light to-brand px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand/25"><Plus className="h-4 w-4" /> Invite staff</button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {db.staff.map((s) => (
          <div key={s.id} className="rounded-2xl border border-ink/5 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-brand-light to-brand font-bold text-white">{s.name.charAt(0)}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-ink">{s.name}</p>
                <p className="truncate text-xs text-muted">{s.email || s.phone || s.id}</p>
              </div>
              <span className={`grid h-8 w-8 place-items-center rounded-full ${s.active ? "bg-leaf/15 text-leaf" : "bg-ink/10 text-muted"}`} title={s.active ? "Active" : "Inactive"}><Badge className="h-4 w-4" /></span>
            </div>
            <div className="mt-4 flex items-center justify-between gap-2">
              <select value={s.role} onChange={(e) => setStaffRole(s.id, e.target.value as typeof s.role)} className={`rounded-full px-3 py-1.5 text-[11px] font-bold outline-none ${roleTint[s.role]}`}>
                {ROLES.map((r) => <option key={r.id} value={r.id} className="text-ink">{r.label}</option>)}
              </select>
              <button onClick={() => toggleStaff(s.id)} className="text-[11px] font-bold text-muted hover:text-brand">{s.active ? "Deactivate" : "Activate"}</button>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {s.permissions.map((p) => <span key={p} className="rounded-full bg-cream px-2 py-0.5 text-[10px] font-semibold text-muted">{p.replace(/_/g, " ")}</span>)}
            </div>
          </div>
        ))}
      </div>

      {show && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm" onClick={() => setShow(false)}>
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-lg font-extrabold text-ink">Invite staff member</h3>
            <div className="mt-4 space-y-3">
              <div><label className="mb-1.5 block text-xs font-semibold text-ink">Name</label><input autoFocus value={name} onChange={(e) => setName(e.target.value)} className={input} placeholder="Chidi Nwosu" /></div>
              <div><label className="mb-1.5 block text-xs font-semibold text-ink">Email</label><input value={email} onChange={(e) => setEmail(e.target.value)} className={input} placeholder="chidi@…" /></div>
              <div><label className="mb-1.5 block text-xs font-semibold text-ink">Phone</label><input value={phone} onChange={(e) => setPhone(e.target.value)} className={input} placeholder="+234…" /></div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-ink">Role</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {ROLES.map((r) => <button key={r.id} onClick={() => setRole(r.id)} className={`rounded-xl border-2 py-2 text-xs font-bold capitalize ${role === r.id ? "border-brand bg-brand/[0.06] text-brand" : "border-ink/8 text-muted"}`}>{r.label}</button>)}
                </div>
                <p className="mt-2 text-xs text-muted">Permissions: {ROLES.find((r) => r.id === role)?.perms.join(", ")}</p>
              </div>
            </div>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setShow(false)} className="flex-1 rounded-full border border-ink/15 py-2.5 text-sm font-semibold text-muted">Cancel</button>
              <button onClick={submit} className="flex-1 rounded-full bg-forest py-2.5 text-sm font-semibold text-white">Send invite</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------ Repayments ----------------------------- */

export function Repayments() {
  const { db, repay } = useInventory();
  const { business } = useAuth();
  const cur = business?.currency ?? "NGN";
  const [pay, setPay] = useState<Record<string, string>>({});

  const owing = db.sales.filter((s) => s.status !== "paid");

  const submit = (id: string, total: number, paid: number) => {
    const amt = Number(pay[id]) || 0;
    if (amt <= 0) return;
    repay(id, Math.min(amt, total - paid));
    setPay((p) => ({ ...p, [id]: "" }));
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink">Credit repayments</h2>
        <p className="mt-1 text-sm text-muted">Record full or partial payments against credit (owing) sales.</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl bg-brand/10 p-5 text-center">
          <p className="font-display text-2xl font-extrabold text-brand">{fmtMoney(cur, owing.reduce((s, x) => s + (x.total - x.paid), 0))}</p>
          <p className="text-xs font-semibold text-muted">Total outstanding</p>
        </div>
        <div className="rounded-2xl bg-leaf/10 p-5 text-center">
          <p className="font-display text-2xl font-extrabold text-forest">{owing.length}</p>
          <p className="text-xs font-semibold text-muted">Owing sales</p>
        </div>
        <div className="rounded-2xl bg-sun/15 p-5 text-center">
          <p className="font-display text-2xl font-extrabold text-[#b7791f]">{owing.filter((s) => s.status === "partial").length}</p>
          <p className="text-xs font-semibold text-muted">Partially paid</p>
        </div>
      </div>

      <div className="space-y-3">
        {owing.map((s) => {
          const left = s.total - s.paid;
          const customer = db.customers.find((c) => c.id === s.customerId);
          return (
            <div key={s.id} className="rounded-2xl border border-ink/5 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-ink">{s.id} · {s.customerName}</p>
                  <p className="text-xs text-muted">{customer?.phone} · {new Date(s.at).toLocaleDateString()} · {s.items.map((i) => `${i.name} ×${i.qty}`).join(", ")}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted">Total <span className="font-bold text-ink">{fmtMoney(cur, s.total)}</span> · Paid <span className="font-bold text-leaf">{fmtMoney(cur, s.paid)}</span></p>
                  <p className="font-display text-lg font-extrabold text-brand">{fmtMoney(cur, left)} left</p>
                </div>
              </div>
              <div className="mt-3 flex gap-2 border-t border-ink/5 pt-3">
                <input type="number" value={pay[s.id] ?? ""} onChange={(e) => setPay((p) => ({ ...p, [s.id]: e.target.value }))} placeholder={`Amount (max ${fmtMoney(cur, left)})`} className="flex-1 rounded-xl border border-ink/10 px-4 py-2.5 text-sm outline-none focus:border-brand" />
                <button onClick={() => submit(s.id, s.total, s.paid)} className="inline-flex items-center gap-1.5 rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-white"><Coins className="h-4 w-4" /> Record payment</button>
              </div>
            </div>
          );
        })}
        {owing.length === 0 && <p className="rounded-2xl border border-dashed border-ink/15 bg-white py-12 text-center text-sm text-muted">No outstanding credit sales 🎉</p>}
      </div>
    </div>
  );
}

/* ------------------------------- Audit log ----------------------------- */

export function AuditLog() {
  const { db } = useInventory();
  const { user } = useAuth();
  const [filter, setFilter] = useState("all");
  const actions = [...new Set(db.audit.map((a) => a.action))];
  const list = db.audit.filter((a) => filter === "all" || a.action === filter);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink">Audit log</h2>
          <p className="mt-1 text-sm text-muted">Every stock change, sale and setting is recorded here for accountability.</p>
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded-xl border border-ink/10 bg-white px-3 py-2.5 text-sm font-medium outline-none">
          <option value="all">All actions</option>
          {actions.map((a) => <option key={a}>{a}</option>)}
        </select>
      </div>

      <div className="rounded-2xl border border-ink/5 bg-white shadow-sm">
        <div className="divide-y divide-ink/5">
          {list.map((a) => (
            <div key={a.id} className="flex items-start gap-3 px-5 py-3.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-cream text-ink/60"><ScrollText className="h-4 w-4" /></span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-ink capitalize">{a.action.replace(/_/g, " ")}</p>
                <p className="text-xs text-muted">{a.detail}</p>
              </div>
              <div className="text-right text-xs text-muted">
                <p className="font-semibold text-ink/70">{a.user}</p>
                <p>{new Date(a.at).toLocaleString()}</p>
              </div>
            </div>
          ))}
          {list.length === 0 && <p className="py-10 text-center text-sm text-muted">No audit entries.</p>}
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-2xl bg-leaf/10 px-4 py-3 text-sm text-forest">
        <CheckCircle className="h-4 w-4 shrink-0 text-leaf" />
        All changes are attributed to <span className="font-bold">{user?.name ?? "you"}</span> — tamper-proof for accountability.
      </div>
    </div>
  );
}

export default { CategoriesUnits, Discounts, Staff, Repayments, AuditLog };

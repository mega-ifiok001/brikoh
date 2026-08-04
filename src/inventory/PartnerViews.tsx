"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useInventory, fmtMoney } from "./lib";
import type { InvView } from "./InventoryApp";
import { Plus, Truck, Mail, Phone, ArrowLeft, CheckCircle, Users } from "@/components/icons";

const DownloadIcon = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 4v11M7 10l5 5 5-5M4 19h16" /></svg>
);
const UploadIcon = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 16V5M7 9.5 12 4.5l5 5M4 20h16" /></svg>
);
const StickyNoteIcon = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M6 3h12a1 1 0 0 1 1 1v11l-5 5H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" /><path d="M14 20v-5h5" /></svg>
);
const SourceBadge = ({ source }: { source: string }) => {
  const tint: Record<string, string> = { STOREFRONT: "bg-leaf/15 text-leaf", POS: "bg-brand/15 text-brand", MANUAL: "bg-pine/15 text-pine", IMPORTED: "bg-sun/20 text-[#b7791f]" };
  return <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${tint[source] ?? "bg-ink/10 text-muted"}`}>{source}</span>;
};

/* ------------------------------ Suppliers ------------------------------ */

export function Suppliers() {
  const { db, addSupplier } = useInventory();
  const [show, setShow] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const submit = () => {
    if (name.trim().length < 2) return;
    addSupplier({ name: name.trim(), phone: phone.trim(), email: email.trim() });
    setName(""); setPhone(""); setEmail(""); setShow(false);
  };

  const input = "w-full rounded-xl border border-ink/10 bg-white px-4 py-3 text-[15px] outline-none focus:border-brand focus:ring-4 focus:ring-brand/10";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink">Suppliers</h2>
          <p className="mt-1 text-sm text-muted">{db.suppliers.length} suppliers · linked to restocks & purchase orders</p>
        </div>
        <button onClick={() => setShow(true)} className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-brand-light to-brand px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand/25">
          <Plus className="h-4 w-4" /> Add supplier
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {db.suppliers.map((s) => (
          <div key={s.id} className="rounded-2xl border border-ink/5 bg-white p-5 shadow-sm transition-shadow hover:shadow-lg hover:shadow-forest/10">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-pine/10 text-pine"><Truck className="h-5 w-5" /></span>
              <div>
                <p className="font-bold text-ink">{s.name}</p>
                <p className="text-xs text-muted">{s.id}</p>
              </div>
            </div>
            <div className="mt-4 space-y-1.5 text-sm text-muted">
              {s.phone && <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> {s.phone}</p>}
              {s.email && <p className="flex items-center gap-2 truncate"><Mail className="h-3.5 w-3.5" /> {s.email}</p>}
            </div>
          </div>
        ))}
      </div>

      {show && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm" onClick={() => setShow(false)}>
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-lg font-extrabold text-ink">Add supplier</h3>
            <div className="mt-4 space-y-3">
              <div><label className="mb-1.5 block text-xs font-semibold text-ink">Name</label><input autoFocus value={name} onChange={(e) => setName(e.target.value)} className={input} placeholder="Kente Fabrics Ltd" /></div>
              <div><label className="mb-1.5 block text-xs font-semibold text-ink">Phone (optional)</label><input value={phone} onChange={(e) => setPhone(e.target.value)} className={input} placeholder="+234…" /></div>
              <div><label className="mb-1.5 block text-xs font-semibold text-ink">Email (optional)</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={input} placeholder="hello@…" /></div>
            </div>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setShow(false)} className="flex-1 rounded-full border border-ink/15 py-2.5 text-sm font-semibold text-muted">Cancel</button>
              <button onClick={submit} className="flex-1 rounded-full bg-forest py-2.5 text-sm font-semibold text-white">Add supplier</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------------------- Purchase orders --------------------------- */

const PO_STATUS: Record<string, string> = {
  pending: "bg-sun/20 text-[#b7791f]",
  approved: "bg-pine/15 text-pine",
  received: "bg-leaf/15 text-leaf",
  cancelled: "bg-ink/10 text-muted",
};

export function PurchaseOrders() {
  const { db, addPO, setPOStatus } = useInventory();
  const { business } = useAuth();
  const cur = business?.currency ?? "NGN";
  const [show, setShow] = useState(false);
  const [supplierId, setSupplierId] = useState(db.suppliers[0]?.id ?? "");
  const [branchId, setBranchId] = useState(db.branches[0]?.id ?? "");
  const [lines, setLines] = useState<{ productId: string; qty: string; cost: string }[]>([{ productId: db.products[0]?.id ?? "", qty: "10", cost: "" }]);

  const submit = () => {
    const items = lines.map((l) => {
      const p = db.products.find((x) => x.id === l.productId);
      return { productId: l.productId, name: p?.name ?? "?", qty: Number(l.qty) || 0, cost: Number(l.cost) || (p?.costPrice ?? 0) };
    }).filter((i) => i.qty > 0);
    if (items.length === 0) return;
    addPO({ supplierId, branchId, items });
    setShow(false);
    setLines([{ productId: db.products[0]?.id ?? "", qty: "10", cost: "" }]);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink">Purchase orders</h2>
          <p className="mt-1 text-sm text-muted">Create, approve and receive orders — receiving restocks inventory automatically.</p>
        </div>
        <button onClick={() => setShow(true)} className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-brand-light to-brand px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand/25">
          <Plus className="h-4 w-4" /> New purchase order
        </button>
      </div>

      <div className="space-y-3">
        {db.purchaseOrders.map((po) => {
          const sup = db.suppliers.find((s) => s.id === po.supplierId);
          const branch = db.branches.find((b) => b.id === po.branchId);
          return (
            <div key={po.id} className="rounded-2xl border border-ink/5 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-pine/10 text-pine"><Truck className="h-5 w-5" /></span>
                  <div>
                    <p className="font-bold text-ink">{po.id} · {sup?.name}</p>
                    <p className="text-xs text-muted">{branch?.name} · {new Date(po.createdAt).toLocaleDateString()} · {po.items.length} line item(s)</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-extrabold text-ink">{fmtMoney(cur, po.total)}</span>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${PO_STATUS[po.status]}`}>{po.status}</span>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-ink/5 pt-3">
                <p className="text-xs text-muted">{po.items.map((i) => `${i.name} ×${i.qty}`).join(", ")}</p>
                <div className="flex gap-2">
                  {po.status === "pending" && <button onClick={() => setPOStatus(po.id, "approved")} className="rounded-full bg-pine/10 px-3.5 py-1.5 text-xs font-bold text-pine hover:bg-pine/20">Approve</button>}
                  {po.status === "pending" && <button onClick={() => setPOStatus(po.id, "cancelled")} className="rounded-full bg-ink/5 px-3.5 py-1.5 text-xs font-bold text-muted hover:bg-ink/10">Cancel</button>}
                  {(po.status === "approved" || po.status === "pending") && (
                    <button onClick={() => setPOStatus(po.id, "received")} className="inline-flex items-center gap-1 rounded-full bg-leaf/15 px-3.5 py-1.5 text-xs font-bold text-leaf hover:bg-leaf/25">
                      <CheckCircle className="h-3.5 w-3.5" /> Mark received (restocks inventory)
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {show && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm" onClick={() => setShow(false)}>
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-lg font-extrabold text-ink">Create purchase order</h3>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div><label className="mb-1.5 block text-xs font-semibold text-ink">Supplier</label>
                <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="w-full rounded-xl border border-ink/10 px-3 py-2.5 text-sm outline-none">{db.suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
              <div><label className="mb-1.5 block text-xs font-semibold text-ink">Branch</label>
                <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="w-full rounded-xl border border-ink/10 px-3 py-2.5 text-sm outline-none">{db.branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
            </div>
            <p className="mt-4 text-xs font-bold uppercase tracking-wider text-muted">Line items</p>
            <div className="mt-2 space-y-2">
              {lines.map((l, i) => (
                <div key={i} className="grid grid-cols-[1fr_70px_90px_32px] items-center gap-2">
                  <select value={l.productId} onChange={(e) => setLines((ls) => ls.map((x, j) => (j === i ? { ...x, productId: e.target.value } : x)))} className="rounded-xl border border-ink/10 px-3 py-2.5 text-sm outline-none">
                    {db.products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <input type="number" value={l.qty} onChange={(e) => setLines((ls) => ls.map((x, j) => (j === i ? { ...x, qty: e.target.value } : x)))} placeholder="Qty" className="rounded-xl border border-ink/10 px-3 py-2.5 text-sm outline-none" />
                  <input type="number" value={l.cost} onChange={(e) => setLines((ls) => ls.map((x, j) => (j === i ? { ...x, cost: e.target.value } : x)))} placeholder="Cost" className="rounded-xl border border-ink/10 px-3 py-2.5 text-sm outline-none" />
                  <button onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))} className="grid h-9 w-9 place-items-center rounded-lg text-ink/40 hover:bg-red-50 hover:text-red-500">✕</button>
                </div>
              ))}
            </div>
            <button onClick={() => setLines((ls) => [...ls, { productId: db.products[0]?.id ?? "", qty: "10", cost: "" }])} className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-brand"><Plus className="h-3.5 w-3.5" /> Add line</button>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setShow(false)} className="flex-1 rounded-full border border-ink/15 py-2.5 text-sm font-semibold text-muted">Cancel</button>
              <button onClick={submit} className="flex-1 rounded-full bg-forest py-2.5 text-sm font-semibold text-white">Create PO</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------ Customers ------------------------------ */

const SEGMENT: Record<string, string> = {
  VIP: "bg-brand/15 text-brand",
  Regular: "bg-pine/15 text-pine",
  New: "bg-leaf/15 text-leaf",
};

function customerSegment(db: ReturnType<typeof useInventory>["db"], c: { id: string; createdAt: string }) {
  const orders = db.sales.filter((s) => s.customerId === c.id).length;
  const spent = db.sales.filter((s) => s.customerId === c.id).reduce((s, x) => s + x.total, 0);
  if (spent > 300000) return { seg: "VIP" as const, orders, spent };
  if (orders >= 3) return { seg: "Regular" as const, orders, spent };
  return { seg: "New" as const, orders, spent };
}

export function Customers({ go }: { go: (v: InvView) => void }) {
  const { db, addCustomer, findOrCreateCustomer } = useInventory();
  const { business } = useAuth();
  const cur = business?.currency ?? "NGN";
  const [show, setShow] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importPreview, setImportPreview] = useState<{ name: string; phone: string; email: string; error?: string }[] | null>(null);
  const [name, setName] = useState(""); const [phone, setPhone] = useState(""); const [email, setEmail] = useState(""); const [groupId, setGroupId] = useState("");

  const exportCsv = () => {
    const rows = [["Name", "Phone", "Email", "Source", "Group"]];
    db.customers.forEach((c) => {
      const g = db.groups.filter((x) => c.groupIds.includes(x.id)).map((x) => x.name).join("; ");
      rows.push([c.name, c.phone, c.email, c.source, g]);
    });
    const csv = rows.map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "brikoh-customers.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const parseImport = () => {
    const lines = importText.split(/\r?\n/).filter((l) => l.trim());
    const rows = lines.map((line) => {
      const [n, ph, em] = line.split(",").map((s) => s.trim());
      const err = !n || !ph ? "Missing name or phone" : db.customers.some((c) => c.phone.replace(/\D/g, "") === ph.replace(/\D/g, "")) ? "Duplicate phone (skip or merge)" : undefined;
      return { name: n ?? "", phone: ph ?? "", email: em ?? "", error: err };
    });
    setImportPreview(rows);
  };

  const confirmImport = () => {
    if (!importPreview) return;
    let ok = 0;
    importPreview.forEach((r) => {
      if (r.error) return;
      findOrCreateCustomer(r.name, r.phone, r.email, "IMPORTED");
      ok++;
    });
    setImportOpen(false); setImportText(""); setImportPreview(null);
    alert(`${ok} customers imported. Duplicates/errors skipped.`);
  };

  const submit = () => {
    if (name.trim().length < 2) return;
    addCustomer({ name: name.trim(), phone: phone.trim(), email: email.trim(), groupId: groupId || null, groupIds: groupId ? [groupId] : [], source: "MANUAL" });
    setName(""); setPhone(""); setEmail(""); setGroupId(""); setShow(false);
  };

  const owing = (id: string) => db.sales.filter((s) => s.customerId === id && s.status !== "paid").reduce((s, x) => s + (x.total - x.paid), 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink">Customers</h2>
          <p className="mt-1 text-sm text-muted">{db.customers.length} customers · auto-created from storefront & POS sales · click one for history & balance</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={exportCsv} className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 bg-white px-4 py-2.5 text-sm font-semibold text-ink hover:border-brand hover:text-brand"><DownloadIcon className="h-4 w-4" /> Export</button>
          <button onClick={() => setImportOpen(true)} className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 bg-white px-4 py-2.5 text-sm font-semibold text-ink hover:border-brand hover:text-brand"><UploadIcon className="h-4 w-4" /> Import</button>
          <button onClick={() => setShow(true)} className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-brand-light to-brand px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand/25"><Plus className="h-4 w-4" /> Add customer</button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-ink/5 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="tbl-mobile w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ink/5 text-[11px] font-bold uppercase tracking-wider text-muted">
                <th className="px-5 py-3.5">Customer</th><th className="px-5 py-3.5">Orders</th><th className="px-5 py-3.5">Total spent</th><th className="px-5 py-3.5">Owing</th><th className="px-5 py-3.5">Segment</th>
              </tr>
            </thead>
            <tbody>
              {db.customers.map((c) => {
                const { seg, orders, spent } = customerSegment(db, c);
                const ow = owing(c.id);
                return (
                  <tr key={c.id} className="cursor-pointer border-b border-ink/5 last:border-0 hover:bg-cream/50" onClick={() => go({ name: "customer-detail", customerId: c.id })}>
                    <td data-label="Customer" className="px-5 py-3.5">
                      <span className="flex items-center gap-2 font-bold text-ink">{c.name} <SourceBadge source={c.source} /></span>
                      <span className="block text-xs text-muted">{c.phone}</span>
                    </td>
                    <td data-label="Orders" className="px-5 py-3.5 text-muted">{orders}</td>
                    <td data-label="Spent" className="px-5 py-3.5 font-extrabold text-ink">{fmtMoney(cur, spent)}</td>
                    <td data-label="Owing" className={`px-5 py-3.5 font-extrabold ${ow > 0 ? "text-brand" : "text-muted"}`}>{ow > 0 ? fmtMoney(cur, ow) : "—"}</td>
                    <td data-label="Segment" className="px-5 py-3.5"><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${SEGMENT[seg]}`}>{seg}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {show && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm" onClick={() => setShow(false)}>
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-lg font-extrabold text-ink">Add customer</h3>
            <div className="mt-4 space-y-3">
              <div><label className="mb-1.5 block text-xs font-semibold text-ink">Name</label><input autoFocus value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl border border-ink/10 px-4 py-3 text-[15px] outline-none focus:border-brand" placeholder="Adaeze Okafor" /></div>
              <div><label className="mb-1.5 block text-xs font-semibold text-ink">Phone</label><input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-xl border border-ink/10 px-4 py-3 text-[15px] outline-none focus:border-brand" placeholder="+234…" /></div>
              <div><label className="mb-1.5 block text-xs font-semibold text-ink">Email (optional)</label><input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-ink/10 px-4 py-3 text-[15px] outline-none focus:border-brand" /></div>
              <div><label className="mb-1.5 block text-xs font-semibold text-ink">Group (optional)</label>
                <select value={groupId} onChange={(e) => setGroupId(e.target.value)} className="w-full rounded-xl border border-ink/10 px-4 py-3 text-[15px] outline-none">
                  <option value="">No group</option>
                  {db.groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select></div>
            </div>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setShow(false)} className="flex-1 rounded-full border border-ink/15 py-2.5 text-sm font-semibold text-muted">Cancel</button>
              <button onClick={submit} className="flex-1 rounded-full bg-forest py-2.5 text-sm font-semibold text-white">Add customer</button>
            </div>
          </div>
        </div>
      )}

      {/* import modal */}
      {importOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm" onClick={() => setImportOpen(false)}>
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-lg font-extrabold text-ink">Bulk import customers</h3>
            <p className="mt-1 text-xs text-muted">Format: <span className="font-mono font-bold">Name, Phone, Email</span> — one per line. Duplicate phones are flagged, never overwritten.</p>
            <textarea rows={6} value={importText} onChange={(e) => setImportText(e.target.value)} placeholder={"Adaeze Okafor, +234 805 555 0011, adaeze@example.com\nKwame Mensah, +233 20 111 2233, kwame@example.com"} className="mt-3 w-full resize-none rounded-xl border border-ink/10 bg-cream px-4 py-3 text-sm outline-none focus:border-brand" />
            <div className="mt-3 flex gap-2">
              <button onClick={parseImport} className="flex-1 rounded-full bg-forest py-2.5 text-sm font-semibold text-white">Preview</button>
              <button onClick={() => setImportOpen(false)} className="rounded-full border border-ink/15 px-5 py-2.5 text-sm font-semibold text-muted">Cancel</button>
            </div>
            {importPreview && (
              <div className="mt-4">
                <p className="text-xs font-bold text-muted">
                  {importPreview.filter((r) => !r.error).length} ready · {importPreview.filter((r) => r.error).length} with errors
                </p>
                <div className="mt-2 max-h-44 space-y-1.5 overflow-y-auto">
                  {importPreview.map((r, i) => (
                    <div key={i} className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs ${r.error ? "bg-red-50 text-red-500" : "bg-leaf/10 text-forest"}`}>
                      <span className="font-semibold">{r.name} · {r.phone}</span>
                      <span>{r.error ?? "✓ ready"}</span>
                    </div>
                  ))}
                </div>
                <button onClick={confirmImport} className="mt-3 w-full rounded-full bg-gradient-to-br from-brand-light to-brand py-2.5 text-sm font-semibold text-white">
                  Import {importPreview.filter((r) => !r.error).length} valid customer(s)
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function CustomerDetail({ customerId, go }: { customerId: string; go: (v: InvView) => void }) {
  const { db, addCustomerNote, updateCustomer } = useInventory();
  const { business } = useAuth();
  const cur = business?.currency ?? "NGN";
  const [noteText, setNoteText] = useState("");
  const c = db.customers.find((x) => x.id === customerId);
  if (!c) return <p className="py-10 text-center text-muted">Customer not found.</p>;
  const notes = db.notes.filter((n) => n.customerId === c.id);

  const sales = db.sales.filter((s) => s.customerId === c.id);
  const totalSpent = sales.reduce((s, x) => s + x.total, 0);
  const owing = sales.filter((s) => s.status !== "paid").reduce((s, x) => s + (x.total - x.paid), 0);
  const group = db.groups.find((g) => g.id === c.groupId);

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <button onClick={() => go({ name: "customers" })} className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-brand"><ArrowLeft className="h-4 w-4" /> Back to customers</button>

      <div className="rounded-3xl border border-ink/5 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-brand-light to-brand font-display text-xl font-extrabold text-white">{c.name.charAt(0)}</span>
          <div className="flex-1">
            <h2 className="font-display text-2xl font-extrabold text-ink">{c.name}</h2>
            <p className="text-sm text-muted">{c.phone}{c.email ? ` · ${c.email}` : ""}</p>
            {group && <span className="mt-1.5 inline-block rounded-full bg-pine/10 px-2.5 py-0.5 text-[11px] font-bold text-pine">{group.name} · {group.discountPct}% off</span>}
          </div>
          {owing > 0 && (
            <div className="rounded-2xl bg-brand/10 px-5 py-3 text-center">
              <p className="text-[11px] font-bold uppercase tracking-wider text-brand">Owes you</p>
              <p className="font-display text-xl font-extrabold text-brand">{fmtMoney(cur, owing)}</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { k: "Total orders", v: sales.length.toString() },
          { k: "Total spent", v: fmtMoney(cur, totalSpent) },
          { k: "Outstanding", v: fmtMoney(cur, owing) },
        ].map((s) => (
          <div key={s.k} className="rounded-2xl border border-ink/5 bg-white p-4 text-center shadow-sm">
            <p className="font-display text-xl font-extrabold text-ink">{s.v}</p>
            <p className="text-xs text-muted">{s.k}</p>
          </div>
        ))}
      </div>

      {/* message + notes */}
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-ink/5 bg-white p-6 shadow-sm sm:p-8">
          <h3 className="font-display text-lg font-extrabold text-ink">Notes</h3>
          <div className="mt-4 space-y-2.5">
            {notes.map((n) => (
              <div key={n.id} className="flex items-start gap-3 rounded-xl bg-cream px-4 py-3 text-sm">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-pine/10 text-pine"><StickyNoteIcon className="h-4 w-4" /></span>
                <div>
                  <p className="text-ink/85">{n.note}</p>
                  <p className="mt-0.5 text-[11px] text-muted">{new Date(n.at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
            {notes.length === 0 && <p className="py-4 text-center text-sm text-muted">No notes yet.</p>}
          </div>
          <div className="mt-3 flex gap-2">
            <input value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Add a note, e.g. prefers WhatsApp…" className="flex-1 rounded-xl border border-ink/10 px-3.5 py-2.5 text-sm outline-none focus:border-brand" />
            <button onClick={() => { if (noteText.trim()) { addCustomerNote(c.id, noteText); setNoteText(""); } }} className="rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-white">Add</button>
          </div>
        </div>

        <div className="rounded-3xl border border-ink/5 bg-white p-6 shadow-sm sm:p-8">
          <h3 className="font-display text-lg font-extrabold text-ink">Groups & contact</h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {db.groups.map((g) => {
              const on = c.groupIds.includes(g.id);
              return (
                <button key={g.id} onClick={() => updateCustomer(c.id, { groupIds: on ? c.groupIds.filter((x) => x !== g.id) : [...c.groupIds, g.id], groupId: on ? (c.groupIds.length === 1 ? null : c.groupId) : g.id })} className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ${on ? "bg-forest text-white" : "bg-cream text-ink/70 ring-1 ring-ink/10 hover:ring-brand/40"}`}>
                  {g.name} {on ? "✓" : "+"}
                </button>
              );
            })}
          </div>
          <div className="mt-5 space-y-2.5">
            <a href={`https://wa.me/${c.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 rounded-xl bg-[#25D366]/10 px-4 py-3 text-sm font-semibold text-[#128C4B]">💬 Message on WhatsApp</a>
            {c.email && <a href={`mailto:${c.email}`} className="flex items-center gap-2.5 rounded-xl bg-cream px-4 py-3 text-sm font-semibold text-ink">✉️ Send email</a>}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-ink/5 bg-white p-6 shadow-sm sm:p-8">
        <h3 className="font-display text-lg font-extrabold text-ink">Purchase history</h3>
        <div className="mt-4 space-y-2.5">
          {sales.map((s) => (
            <div key={s.id} className="flex items-center gap-3 rounded-xl bg-cream px-4 py-3 text-sm">
              <span className="font-bold text-ink">{s.id}</span>
              <span className="text-muted">{new Date(s.at).toLocaleDateString()}</span>
              <span className="text-muted">{s.items.map((i) => `${i.name} ×${i.qty}`).join(", ")}</span>
              <span className="ml-auto font-extrabold text-ink">{fmtMoney(cur, s.total)}</span>
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${s.status === "paid" ? "bg-leaf/15 text-leaf" : s.status === "partial" ? "bg-sun/20 text-[#b7791f]" : "bg-red-100 text-red-500"}`}>{s.status}</span>
            </div>
          ))}
          {sales.length === 0 && <p className="py-6 text-center text-sm text-muted">No purchases yet.</p>}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------- Customer groups --------------------------- */

export function Groups() {
  const { db, addGroup } = useInventory();
  const [show, setShow] = useState(false);
  const [name, setName] = useState("");
  const [pct, setPct] = useState("10");

  const members = (id: string) => db.customers.filter((c) => c.groupIds.includes(id)).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink">Customer groups</h2>
          <p className="mt-1 text-sm text-muted">Group customers to offer automatic discounts & target campaigns.</p>
        </div>
        <button onClick={() => setShow(true)} className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-brand-light to-brand px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand/25"><Plus className="h-4 w-4" /> New group</button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {db.groups.map((g) => (
          <div key={g.id} className="rounded-2xl border border-ink/5 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand/10 text-brand"><Users className="h-5 w-5" /></span>
              <div>
                <p className="font-bold text-ink">{g.name}</p>
                <p className="text-xs text-muted">{members(g.id)} member(s)</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-ink/5 pt-3 text-sm">
              <span className="text-muted">Automatic discount</span>
              <span className="font-extrabold text-forest">{g.discountPct}%</span>
            </div>
          </div>
        ))}
      </div>

      {show && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm" onClick={() => setShow(false)}>
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-lg font-extrabold text-ink">New customer group</h3>
            <div className="mt-4 space-y-3">
              <div><label className="mb-1.5 block text-xs font-semibold text-ink">Group name</label><input autoFocus value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl border border-ink/10 px-4 py-3 text-[15px] outline-none focus:border-brand" placeholder="e.g. Wholesale" /></div>
              <div><label className="mb-1.5 block text-xs font-semibold text-ink">Discount %</label><input type="number" value={pct} onChange={(e) => setPct(e.target.value)} className="w-full rounded-xl border border-ink/10 px-4 py-3 text-[15px] outline-none focus:border-brand" /></div>
            </div>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setShow(false)} className="flex-1 rounded-full border border-ink/15 py-2.5 text-sm font-semibold text-muted">Cancel</button>
              <button onClick={() => { if (name.trim()) { addGroup({ name: name.trim(), discountPct: Number(pct) || 0 }); setShow(false); setName(""); } }} className="flex-1 rounded-full bg-forest py-2.5 text-sm font-semibold text-white">Create group</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default { Suppliers, PurchaseOrders, Customers, CustomerDetail, Groups };

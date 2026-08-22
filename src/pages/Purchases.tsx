import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { asList, fd, pick, rawNum, titleCase } from "../lib/format";
import {
  Badge,
  Button,
  Confirm,
  EmptyState,
  ErrorState,
  Field,
  IconBtn,
  Input,
  KV,
  LoadMore,
  Modal,
  Money,
  PageHead,
  Select,
  StatusBadge,
  Tabs,
  toast,
} from "../components/ui";

export default function Purchases() {
  const { me } = useAuth();
  const currency: string = (me.store as any)?.currency || "NGN";
  const [tab, setTab] = useState("pos");

  return (
    <div>
      <PageHead
        title="Purchases"
        sub="Suppliers, purchase orders and goods receiving — stock goes in through here."
      />
      <Tabs
        tabs={[
          { id: "pos", label: "Purchase orders" },
          { id: "suppliers", label: "Suppliers" },
        ]}
        active={tab}
        onChange={setTab}
      />
      {tab === "pos" ? <POs currency={currency} /> : <Suppliers currency={currency} />}
    </div>
  );
}

/* --------------------------------- Suppliers -------------------------------- */

function Suppliers({ currency }: { currency: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({
    name: "",
    contactName: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
    isActive: true,
  });
  const [formBusy, setFormBusy] = useState(false);
  const [formErr, setFormErr] = useState("");
  const [delFor, setDelFor] = useState<any | null>(null);
  const [delBusy, setDelBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/api/dashboard/suppliers");
      setItems(asList(res, "items", "suppliers", "data"));
    } catch (e: any) {
      setError(e?.message || "Couldn't load suppliers.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      name: "",
      contactName: "",
      phone: "",
      email: "",
      address: "",
      notes: "",
      isActive: true,
    });
    setFormErr("");
    setFormOpen(true);
  };

  const openEdit = (s: any) => {
    setEditing(s);
    setForm({
      name: s.name || "",
      contactName: s.contactName || "",
      phone: s.phone || "",
      email: s.email || "",
      address: s.address || "",
      notes: s.notes || "",
      isActive: s.isActive !== false,
    });
    setFormErr("");
    setFormOpen(true);
  };

  const submit = async () => {
    if (!form.name.trim()) return setFormErr("Supplier name is required.");
    setFormBusy(true);
    setFormErr("");
    const payload = {
      name: form.name.trim(),
      contactName: form.contactName.trim() || undefined,
      phone: form.phone.trim() || undefined,
      email: form.email.trim() || undefined,
      address: form.address.trim() || undefined,
      notes: form.notes.trim() || undefined,
      isActive: form.isActive,
    };
    try {
      if (editing) {
        await api.put(`/api/dashboard/suppliers/${editing.id}`, payload);
        toast.success("Supplier updated.");
      } else {
        await api.post("/api/dashboard/suppliers", payload);
        toast.success("Supplier added.");
      }
      setFormOpen(false);
      load();
    } catch (e: any) {
      const msg =
        e?.code === "SUPPLIER_NAME_TAKEN"
          ? "Another supplier already uses that name."
          : e?.message || "Couldn't save the supplier.";
      setFormErr(msg);
    } finally {
      setFormBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!delFor) return;
    setDelBusy(true);
    try {
      await api.del(`/api/dashboard/suppliers/${delFor.id}`);
      toast.success("Supplier removed.");
      setDelFor(null);
      load();
    } catch (e: any) {
      const msg =
        e?.code === "SUPPLIER_HAS_ORDERS"
          ? "This supplier has purchase orders. Mark them inactive instead."
          : e?.message || "Couldn't remove the supplier.";
      toast.error(msg);
    } finally {
      setDelBusy(false);
    }
  };

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button icon="plus" onClick={openCreate}>
          Add supplier
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-14" />
          ))}
        </div>
      ) : error ? (
        <div className="card">
          <ErrorState message={error} onRetry={load} />
        </div>
      ) : items.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="truck"
            title="No suppliers yet"
            hint="Add the people and companies you buy from — you'll order against them here."
            action={
              <Button icon="plus" onClick={openCreate}>
                Add a supplier
              </Button>
            }
          />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto scrollbar-slim">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Supplier</th>
                  <th>Contact</th>
                  <th>Phone</th>
                  <th className="text-right">Orders</th>
                  <th className="text-right">Balance due</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <p className="font-bold">{s.name}</p>
                      {s.notes && (
                        <p className="max-w-[220px] truncate text-xs text-ink-400">
                          {s.notes}
                        </p>
                      )}
                    </td>
                    <td className="text-ink-500">
                      {s.contactName || s.email || "—"}
                    </td>
                    <td className="whitespace-nowrap text-ink-500">
                      {s.phone || "—"}
                    </td>
                    <td className="text-right tabular-nums">
                      {s.purchaseOrderCount ?? "—"}
                    </td>
                    <td className="text-right">
                      {rawNum(s.balanceDue) > 0 ? (
                        <span className="font-bold text-gold-600">
                          <Money v={s.balanceDue} currency={currency} />
                        </span>
                      ) : (
                        <span className="text-ink-300">—</span>
                      )}
                    </td>
                    <td>
                      <Badge
                        tone={s.isActive !== false ? "green" : "neutral"}
                      >
                        {s.isActive !== false ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td>
                      <div className="flex justify-end gap-0.5">
                        <IconBtn
                          name="edit"
                          label="Edit"
                          onClick={() => openEdit(s)}
                        />
                        <IconBtn
                          name="trash"
                          label="Remove"
                          className="hover:bg-danger-100 hover:text-danger-500"
                          onClick={() => setDelFor(s)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? `Edit — ${editing.name}` : "Add supplier"}
        wide
        footer={
          <>
            <Button variant="ghost" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button loading={formBusy} onClick={submit} icon="check">
              Save supplier
            </Button>
          </>
        }
      >
        {formErr && (
          <p className="mb-3 rounded-xl bg-danger-100 px-3.5 py-2.5 text-sm font-semibold text-danger-700">
            {formErr}
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name">
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Mama Ada Wholesale"
              autoFocus
            />
          </Field>
          <Field label="Contact person">
            <Input
              value={form.contactName}
              onChange={(e) =>
                setForm({ ...form, contactName: e.target.value })
              }
            />
          </Field>
          <Field label="Phone">
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              type="tel"
            />
          </Field>
          <Field label="Email">
            <Input
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              type="email"
            />
          </Field>
          <Field label="Address" className="sm:col-span-2">
            <Input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </Field>
          <Field label="Notes" className="sm:col-span-2">
            <Input
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Anything worth remembering"
            />
          </Field>
        </div>
        <label className="mt-4 flex items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) =>
              setForm({ ...form, isActive: e.target.checked })
            }
            className="h-4 w-4 accent-brand-500"
          />
          Active — available for new purchase orders
        </label>
      </Modal>

      <Confirm
        open={!!delFor}
        onClose={() => setDelFor(null)}
        onConfirm={confirmDelete}
        loading={delBusy}
        title={`Remove “${delFor?.name || ""}”?`}
        body="Suppliers with purchase orders can't be removed. Mark them inactive instead."
        confirmLabel="Remove supplier"
      />
    </div>
  );
}

/* -------------------------------- Purchase orders ---------------------------- */

interface LineRow {
  key: number;
  productId: string;
  variantId: string;
  quantity: string;
  unitCost: string;
}

const STATUSES = [
  "ALL",
  "DRAFT",
  "ORDERED",
  "PARTIALLY_RECEIVED",
  "RECEIVED",
  "CANCELLED",
] as const;

function POs({ currency }: { currency: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusF, setStatusF] = useState<(typeof STATUSES)[number]>("ALL");

  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  const [formOpen, setFormOpen] = useState(false);
  const [formBusy, setFormBusy] = useState(false);
  const [formErr, setFormErr] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [expected, setExpected] = useState("");
  const [notes, setNotes] = useState("");
  const [rows, setRows] = useState<LineRow[]>([]);

  const [detail, setDetail] = useState<any | null>(null);
  const [lineItems, setLineItems] = useState<any[]>([]);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [detailBusy, setDetailBusy] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);

  const [cancelFor, setCancelFor] = useState<any | null>(null);
  const [delFor, setDelFor] = useState<any | null>(null);
  const [delBusy, setDelBusy] = useState(false);

  const [receiveOpen, setReceiveOpen] = useState(false);
  const [recQty, setRecQty] = useState<Record<string, string>>({});
  const [recNote, setRecNote] = useState("");
  const [recBusy, setRecBusy] = useState(false);

  const [payOpen, setPayOpen] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payNote, setPayNote] = useState("");
  const [payBusy, setPayBusy] = useState(false);

  const load = useCallback(
    async (cursor?: string | null) => {
      if (!cursor) setLoading(true);
      else setLoadingMore(true);
      setError(null);
      try {
        const qs = new URLSearchParams();
        qs.set("limit", "24");
        if (statusF !== "ALL") qs.set("status", statusF);
        if (cursor) qs.set("cursor", cursor);
        const res = await api.get(
          `/api/dashboard/purchase-orders?${qs.toString()}`
        );
        const list = asList(res, "items", "purchaseOrders", "orders", "data");
        setItems((prev) => (cursor ? [...prev, ...list] : list));
        setNextCursor(
          pick(res, ["nextCursor", "after", "cursor", "next"]) ?? null
        );
      } catch (e: any) {
        setError(e?.message || "Couldn't load purchase orders.");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [statusF]
  );

  const loadCatalog = useCallback(async () => {
    try {
      const [sRes, bRes, pRes] = await Promise.all([
        api.get("/api/dashboard/suppliers"),
        api.get("/api/dashboard/branches"),
        api.get("/api/dashboard/products?limit=100"),
      ]);
      setSuppliers(
        asList(sRes, "items", "suppliers", "data").filter(
          (s: any) => s.isActive !== false
        )
      );
      const bl = asList(bRes, "items", "branches", "data");
      setBranches(bl);
      setBranchId((cur) => cur || bl[0]?.id || "");
      setProducts(asList(pRes, "items", "products", "data"));
    } catch {
      /* optional */
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const openCreate = () => {
    setSupplierId(suppliers[0]?.id || "");
    setExpected("");
    setNotes("");
    setRows([
      { key: Date.now(), productId: "", variantId: "", quantity: "1", unitCost: "" },
    ]);
    setFormErr("");
    setFormOpen(true);
  };

  const total = rows.reduce(
    (a, r) =>
      a + (parseFloat(r.quantity) || 0) * (parseFloat(r.unitCost) || 0),
    0
  );

  const submit = async () => {
    const lineItemsPayload = rows
      .filter((r) => r.productId)
      .map((r) => {
        const prod = products.find((p) => p.id === r.productId);
        const hasVariants = prod?.variants?.length > 0;
        return {
          productId: r.productId,
          variantId: hasVariants ? r.variantId || undefined : undefined,
          quantity: parseInt(r.quantity, 10) || 1,
          unitCostAtOrder: String(parseFloat(r.unitCost) || 0),
        };
      });

    if (!supplierId) return setFormErr("Pick a supplier.");
    if (!branchId) return setFormErr("Pick the branch the goods will land in.");
    if (!lineItemsPayload.length) return setFormErr("Add at least one line.");
    if (
      lineItemsPayload.some((li) => {
        const prod = products.find((p) => p.id === li.productId);
        return prod?.variants?.length > 0 && !li.variantId;
      })
    ) {
      return setFormErr("Pick a variant for every product that has variants.");
    }

    setFormBusy(true);
    setFormErr("");
    try {
      await api.post("/api/dashboard/purchase-orders", {
        supplierId,
        branchId,
        expectedDeliveryDate: expected
          ? new Date(expected + "T00:00:00.000Z").toISOString()
          : undefined,
        notes: notes.trim() || undefined,
        lineItems: lineItemsPayload,
      });
      toast.success("Draft purchase order saved.");
      setFormOpen(false);
      load();
    } catch (e: any) {
      setFormErr(e?.message || "Couldn't create the purchase order.");
    } finally {
      setFormBusy(false);
    }
  };

  const openDetail = async (id: string) => {
    setDetailBusy(true);
    setDetail({ id });
    setLineItems([]);
    setReceipts([]);
    setPayments([]);
    try {
      const res: any = await api.get(`/api/dashboard/purchase-orders/${id}`);
      const po = res?.purchaseOrder ?? res;
      setDetail(po);
      setLineItems(Array.isArray(res?.lineItems) ? res.lineItems : []);
      setReceipts(Array.isArray(res?.receipts) ? res.receipts : []);
      setPayments(Array.isArray(res?.payments) ? res.payments : []);
    } catch (e: any) {
      setDetail(null);
      toast.error(e?.message || "Couldn't open that purchase order.");
    } finally {
      setDetailBusy(false);
    }
  };

  const issue = async (po: any) => {
    setActionBusy(true);
    try {
      await api.post(`/api/dashboard/purchase-orders/${po.id}/issue`);
      toast.success("Purchase order issued.");
      openDetail(po.id);
      load();
    } catch (e: any) {
      toast.error(e?.message || "Couldn't issue the order.");
    } finally {
      setActionBusy(false);
    }
  };

  const openReceive = () => {
    const initial: Record<string, string> = {};
    lineItems.forEach((l: any) => {
      const remaining =
        l.remainingToReceive != null
          ? rawNum(l.remainingToReceive)
          : rawNum(l.quantity) - rawNum(l.quantityReceived);
      if (remaining > 0) initial[l.id] = String(remaining);
    });
    setRecQty(initial);
    setRecNote("");
    setReceiveOpen(true);
  };

  const submitReceive = async () => {
    const payloadLines = lineItems
      .map((l: any) => {
        const q = parseInt(recQty[l.id] || "0", 10) || 0;
        return q > 0
          ? { lineItemId: l.id, quantityReceived: q }
          : null;
      })
      .filter(Boolean) as { lineItemId: string; quantityReceived: number }[];

    if (!payloadLines.length) {
      toast.error("Enter how much arrived on at least one line.");
      return;
    }

    setRecBusy(true);
    try {
      await api.post(`/api/dashboard/purchase-orders/${detail.id}/receive`, {
        note: recNote.trim() || undefined,
        lineItems: payloadLines,
      });
      toast.success("Receipt recorded — stock updated.");
      setReceiveOpen(false);
      openDetail(detail.id);
      load();
    } catch (e: any) {
      const msg =
        e?.code === "ORDER_NOT_RECEIVABLE"
          ? "This order can't receive stock in its current status."
          : e?.message || "Couldn't record the receipt.";
      toast.error(msg);
    } finally {
      setRecBusy(false);
    }
  };

  const recordPayment = async () => {
    const amount = payAmount.trim();
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error("Enter a positive amount.");
      return;
    }
    setPayBusy(true);
    try {
      await api.post(`/api/dashboard/purchase-orders/${detail.id}/payments`, {
        amount, // decimal string
        note: payNote.trim() || undefined,
      });
      toast.success("Payment recorded.");
      setPayOpen(false);
      setPayAmount("");
      setPayNote("");
      openDetail(detail.id);
      load();
    } catch (e: any) {
      const msg =
        e?.code === "PAYMENT_EXCEEDS_BALANCE"
          ? "Amount exceeds the balance due."
          : e?.code === "ORDER_NOT_PAYABLE"
          ? "This order can't accept payments in its current status."
          : e?.message || "Couldn't record the payment.";
      toast.error(msg);
    } finally {
      setPayBusy(false);
    }
  };

  const doCancel = async () => {
    if (!cancelFor) return;
    setActionBusy(true);
    try {
      await api.post(`/api/dashboard/purchase-orders/${cancelFor.id}/cancel`);
      toast.success("Purchase order cancelled.");
      setCancelFor(null);
      if (detail?.id === cancelFor.id) openDetail(cancelFor.id);
      load();
    } catch (e: any) {
      const msg =
        e?.code === "ORDER_NOT_CANCELLABLE"
          ? "Orders with receipts can't be cancelled."
          : e?.message || "Couldn't cancel the order.";
      toast.error(msg);
    } finally {
      setActionBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!delFor) return;
    setDelBusy(true);
    try {
      await api.del(`/api/dashboard/purchase-orders/${delFor.id}`);
      toast.success("Draft deleted.");
      setDelFor(null);
      if (detail?.id === delFor.id) setDetail(null);
      load();
    } catch (e: any) {
      toast.error(e?.message || "Only draft orders can be deleted.");
    } finally {
      setDelBusy(false);
    }
  };

  const supplierName = (p: any) =>
    p.supplier?.name || p.supplierName || "—";

  const balanceOf = (po: any) =>
    po?.balanceDue != null
      ? rawNum(po.balanceDue)
      : rawNum(po?.total) - rawNum(po?.amountPaid);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              className={`chip ${statusF === s ? "chip-on" : ""}`}
              onClick={() => setStatusF(s)}
            >
              {s === "ALL"
                ? "All"
                : titleCase(s).replace("Partially Received", "Partial")}
            </button>
          ))}
        </div>
        <Button icon="plus" onClick={openCreate}>
          New purchase order
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-14" />
          ))}
        </div>
      ) : error ? (
        <div className="card">
          <ErrorState message={error} onRetry={() => load()} />
        </div>
      ) : items.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="truck"
            title="No purchase orders"
            hint="Order goods from a supplier, then record the delivery — stock lands in your chosen branch automatically."
            action={
              <Button icon="plus" onClick={openCreate}>
                Create a purchase order
              </Button>
            }
          />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto scrollbar-slim">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Supplier</th>
                  <th>Branch</th>
                  <th>Expected</th>
                  <th className="text-right">Paid</th>
                  <th className="text-right">Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((po) => (
                  <tr
                    key={po.id}
                    className="cursor-pointer"
                    onClick={() => openDetail(po.id)}
                  >
                    <td className="font-bold">{po.number || "Draft"}</td>
                    <td className="max-w-[160px] truncate">
                      {supplierName(po)}
                    </td>
                    <td className="text-ink-500">
                      {po.branch?.name || "—"}
                    </td>
                    <td className="whitespace-nowrap text-ink-500">
                      {fd(po.expectedDeliveryDate)}
                    </td>
                    <td className="text-right">
                      <Money v={po.amountPaid} currency={currency} />
                    </td>
                    <td className="text-right">
                      <Money v={po.total} currency={currency} strong />
                    </td>
                    <td>
                      <StatusBadge status={po.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <LoadMore
            onClick={() => load(nextCursor)}
            loading={loadingMore}
            hasMore={!!nextCursor}
          />
        </div>
      )}

      {/* New PO */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title="New purchase order"
        sub="Saved as a draft — issuing stamps a PO number and freezes the lines."
        wide
        footer={
          <>
            <div className="mr-auto flex items-center gap-2 text-sm">
              <span className="font-bold text-ink-500">Total cost</span>
              <span className="font-display text-lg font-extrabold tabular-nums">
                <Money v={total} currency={currency} />
              </span>
            </div>
            <Button variant="ghost" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button loading={formBusy} onClick={submit} icon="check">
              Save draft
            </Button>
          </>
        }
      >
        {formErr && (
          <p className="mb-3 rounded-xl bg-danger-100 px-3.5 py-2.5 text-sm font-semibold text-danger-700">
            {formErr}
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Supplier">
            <Select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
            >
              <option value="">Choose…</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Goods land in">
            <Select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Expected delivery">
            <Input
              type="date"
              value={expected}
              onChange={(e) => setExpected(e.target.value)}
            />
          </Field>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between">
            <label className="lbl !mb-0">Lines</label>
            <Button
              variant="ghost"
              size="sm"
              icon="plus"
              onClick={() =>
                setRows((r) => [
                  ...r,
                  {
                    key: Date.now(),
                    productId: "",
                    variantId: "",
                    quantity: "1",
                    unitCost: "",
                  },
                ])
              }
            >
              Add line
            </Button>
          </div>
          <div className="mt-2 space-y-2">
            {rows.map((r) => {
              const prod = products.find((p) => p.id === r.productId);
              return (
                <div key={r.key} className="flex flex-wrap items-center gap-2">
                  <Select
                    className="min-w-[150px] flex-1"
                    value={r.productId}
                    onChange={(e) => {
                      const p = products.find((x) => x.id === e.target.value);
                      setRows((rs) =>
                        rs.map((x) =>
                          x.key === r.key
                            ? {
                                ...x,
                                productId: e.target.value,
                                variantId: "",
                                unitCost: String(
                                  p?.costPrice ?? p?.price ?? x.unitCost
                                ),
                              }
                            : x
                        )
                      );
                    }}
                  >
                    <option value="">Choose a product…</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </Select>
                  {prod?.variants?.length > 0 && (
                    <Select
                      className="w-36"
                      value={r.variantId}
                      onChange={(e) =>
                        setRows((rs) =>
                          rs.map((x) =>
                            x.key === r.key
                              ? { ...x, variantId: e.target.value }
                              : x
                          )
                        )
                      }
                    >
                      <option value="">Variant…</option>
                      {prod.variants.map((v: any) => (
                        <option key={v.id} value={v.id}>
                          {v.name}
                        </option>
                      ))}
                    </Select>
                  )}
                  <Input
                    className="w-20"
                    type="number"
                    min="1"
                    value={r.quantity}
                    placeholder="Qty"
                    onChange={(e) =>
                      setRows((rs) =>
                        rs.map((x) =>
                          x.key === r.key
                            ? { ...x, quantity: e.target.value }
                            : x
                        )
                      )
                    }
                  />
                  <Input
                    className="w-28"
                    type="number"
                    min="0"
                    step="0.01"
                    value={r.unitCost}
                    placeholder={`Cost (${currency})`}
                    onChange={(e) =>
                      setRows((rs) =>
                        rs.map((x) =>
                          x.key === r.key
                            ? { ...x, unitCost: e.target.value }
                            : x
                        )
                      )
                    }
                  />
                  <span className="w-24 text-right text-sm font-bold tabular-nums">
                    <Money
                      v={
                        (parseFloat(r.quantity) || 0) *
                        (parseFloat(r.unitCost) || 0)
                      }
                      currency={currency}
                    />
                  </span>
                  <IconBtn
                    name="trash"
                    label="Remove line"
                    onClick={() =>
                      setRows((rs) =>
                        rs.length > 1
                          ? rs.filter((x) => x.key !== r.key)
                          : rs
                      )
                    }
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-4">
          <Field label="Notes">
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything the supplier should know"
            />
          </Field>
        </div>
      </Modal>

      {/* Detail */}
      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail?.number || "Purchase order"}
        sub={
          detail
            ? `${supplierName(detail)} · ${titleCase(detail.status || "")}`
            : undefined
        }
        wide
        footer={
          detail ? (
            <>
              {detail.status === "DRAFT" && (
                <>
                  <Button
                    variant="danger"
                    className="mr-auto"
                    onClick={() => setDelFor(detail)}
                  >
                    Delete draft
                  </Button>
                  <Button
                    loading={actionBusy}
                    onClick={() => issue(detail)}
                    icon="send"
                  >
                    Issue order
                  </Button>
                </>
              )}
              {(detail.status === "ORDERED" ||
                detail.status === "PARTIALLY_RECEIVED") && (
                <>
                  <Button
                    variant="outline"
                    className="mr-auto"
                    onClick={() => setCancelFor(detail)}
                  >
                    Cancel order
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setPayAmount("");
                      setPayNote("");
                      setPayOpen(true);
                    }}
                    icon="banknote"
                  >
                    Record payment
                  </Button>
                  <Button
                    loading={actionBusy}
                    onClick={openReceive}
                    icon="truck"
                  >
                    Record delivery
                  </Button>
                </>
              )}
              {detail.status === "RECEIVED" && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setPayAmount("");
                    setPayNote("");
                    setPayOpen(true);
                  }}
                  icon="banknote"
                >
                  Record payment
                </Button>
              )}
            </>
          ) : undefined
        }
      >
        {detailBusy || !detail ? (
          <div className="space-y-3 py-4">
            <div className="skeleton h-24" />
            <div className="skeleton h-16" />
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto rounded-xl border border-cream-200">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th className="text-right">Qty</th>
                    <th className="text-right">Unit cost</th>
                    <th className="text-right">Received</th>
                    <th className="text-right">Remaining</th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((li: any, i: number) => {
                    const remaining =
                      li.remainingToReceive != null
                        ? rawNum(li.remainingToReceive)
                        : rawNum(li.quantity) - rawNum(li.quantityReceived);
                    return (
                      <tr key={li.id || i}>
                        <td className="font-bold">
                          {li.productName || li.product?.name || "Item"}
                          {li.variantName || li.variant?.name
                            ? ` · ${li.variantName || li.variant?.name}`
                            : ""}
                        </td>
                        <td className="text-right tabular-nums">
                          {rawNum(li.quantity)}
                        </td>
                        <td className="text-right">
                          <Money
                            v={li.unitCostAtOrder}
                            currency={currency}
                          />
                        </td>
                        <td className="text-right tabular-nums">
                          {rawNum(li.quantityReceived)}
                        </td>
                        <td className="text-right tabular-nums">
                          <span
                            className={
                              remaining <= 0
                                ? "text-leaf-600"
                                : "text-gold-600"
                            }
                          >
                            {remaining}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-4 grid gap-x-8 sm:grid-cols-2">
              <div>
                <KV label="Branch" value={detail.branch?.name || "—"} />
                <KV
                  label="Expected"
                  value={fd(detail.expectedDeliveryDate)}
                />
                <KV label="Issued" value={fd(detail.orderedAt)} />
                <KV label="Fully received" value={fd(detail.receivedAt)} />
              </div>
              <div>
                <KV
                  label="Total"
                  value={
                    <Money v={detail.total} currency={currency} strong />
                  }
                />
                <KV
                  label="Paid"
                  value={
                    <Money v={detail.amountPaid} currency={currency} />
                  }
                />
                <KV
                  label="Owed"
                  value={
                    <Money
                      v={balanceOf(detail)}
                      currency={currency}
                      strong
                    />
                  }
                />
              </div>
            </div>

            {payments.length > 0 && (
              <div className="mt-4">
                <label className="lbl">Payments</label>
                {payments.map((p: any, i: number) => (
                  <div
                    key={p.id || i}
                    className="flex justify-between border-b border-cream-100 py-2 text-sm last:border-0"
                  >
                    <span className="text-ink-500">
                      {fd(p.createdAt)}
                      {p.note ? ` · ${p.note}` : ""}
                      {p.recordedByName ? ` · ${p.recordedByName}` : ""}
                    </span>
                    <Money v={p.amount} currency={currency} strong />
                  </div>
                ))}
              </div>
            )}

            {receipts.length > 0 && (
              <div className="mt-4">
                <label className="lbl">Deliveries</label>
                {receipts.map((r: any, i: number) => (
                  <div
                    key={r.id || i}
                    className="border-b border-cream-100 py-2 text-sm last:border-0"
                  >
                    <span className="text-ink-500">{fd(r.createdAt)}</span>
                    {r.note && (
                      <span className="ml-2 text-ink-400">{r.note}</span>
                    )}
                    {r.recordedByName && (
                      <span className="ml-2 text-ink-300">
                        · {r.recordedByName}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {detail.notes && (
              <p className="mt-3 rounded-xl bg-gold-100 px-4 py-2.5 text-sm text-gold-700">
                {detail.notes}
              </p>
            )}
          </div>
        )}
      </Modal>

      {/* Receive */}
      <Modal
        open={receiveOpen}
        onClose={() => setReceiveOpen(false)}
        title="Record delivery"
        sub="What actually arrived today — stock moves into the branch as you save."
        footer={
          <>
            <Button variant="ghost" onClick={() => setReceiveOpen(false)}>
              Cancel
            </Button>
            <Button loading={recBusy} onClick={submitReceive} icon="check">
              Save receipt
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          {lineItems.map((l: any) => {
            const remaining =
              l.remainingToReceive != null
                ? rawNum(l.remainingToReceive)
                : rawNum(l.quantity) - rawNum(l.quantityReceived);
            if (remaining <= 0) return null;
            return (
              <div
                key={l.id}
                className="flex items-center justify-between gap-3 rounded-xl bg-cream-100 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">
                    {l.productName || l.product?.name || "Item"}
                    {l.variantName || l.variant?.name
                      ? ` · ${l.variantName || l.variant?.name}`
                      : ""}
                  </p>
                  <p className="text-xs text-ink-400">
                    {rawNum(l.quantityReceived)}/{rawNum(l.quantity)} in ·{" "}
                    {remaining} to go
                  </p>
                </div>
                <Input
                  type="number"
                  min="0"
                  max={remaining}
                  value={recQty[l.id] || ""}
                  onChange={(e) =>
                    setRecQty((m) => ({ ...m, [l.id]: e.target.value }))
                  }
                  className="w-24"
                />
              </div>
            );
          })}
          <Field label="Note">
            <Input
              value={recNote}
              onChange={(e) => setRecNote(e.target.value)}
              placeholder="e.g. came in 2 boxes, one was dented"
            />
          </Field>
        </div>
      </Modal>

      {/* Pay */}
      <Modal
        open={payOpen}
        onClose={() => setPayOpen(false)}
        title="Record supplier payment"
        sub={
          detail ? (
            <span>
              Owed:{" "}
              <Money v={balanceOf(detail)} currency={currency} strong />
            </span>
          ) : undefined
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setPayOpen(false)}>
              Cancel
            </Button>
            <Button loading={payBusy} onClick={recordPayment} icon="check">
              Save payment
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label={`Amount (${currency})`}>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              autoFocus
              placeholder="0.00"
            />
          </Field>
          <Field label="Note">
            <Input
              value={payNote}
              onChange={(e) => setPayNote(e.target.value)}
              placeholder="e.g. transfer ref"
            />
          </Field>
        </div>
      </Modal>

      <Confirm
        open={!!cancelFor}
        onClose={() => setCancelFor(null)}
        onConfirm={doCancel}
        loading={actionBusy}
        title="Cancel this purchase order?"
        body="Only possible while no deliveries have been recorded."
        confirmLabel="Cancel order"
      />
      <Confirm
        open={!!delFor}
        onClose={() => setDelFor(null)}
        onConfirm={confirmDelete}
        loading={delBusy}
        title="Delete this draft?"
        body="Issued orders can't be deleted — cancel them instead."
        confirmLabel="Delete draft"
      />
    </div>
  );
}
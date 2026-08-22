import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { asList, cls, fd, pick, rawNum, titleCase } from "../lib/format";
import {
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
  toast,
} from "../components/ui";

const STATUSES = ["ALL", "DRAFT", "ISSUED", "PAID", "VOID"] as const;

interface LineRow {
  key: number;
  productId: string;
  quantity: string;
  unitPrice: string;
}

export default function Invoices() {
  const { me } = useAuth();
  const currency: string = (me.store as any)?.currency || "NGN";

  // List
  const [items, setItems] = useState<any[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusF, setStatusF] = useState<(typeof STATUSES)[number]>("ALL");

  // Catalog
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  // Create
  const [formOpen, setFormOpen] = useState(false);
  const [formBusy, setFormBusy] = useState(false);
  const [formErr, setFormErr] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [rows, setRows] = useState<LineRow[]>([]);

  // Detail
  const [detail, setDetail] = useState<any | null>(null);
  const [detailBusy, setDetailBusy] = useState(false);
  const [lineItems, setLineItems] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [actionBusy, setActionBusy] = useState(false);

  // Payment
  const [payOpen, setPayOpen] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payNote, setPayNote] = useState("");
  const [payBusy, setPayBusy] = useState(false);

  // Void / Delete
  const [voidFor, setVoidFor] = useState<any | null>(null);
  const [delFor, setDelFor] = useState<any | null>(null);
  const [delBusy, setDelBusy] = useState(false);

  // ---------- Catalog ----------
  const loadCatalog = useCallback(async () => {
    try {
      const [cRes, pRes] = await Promise.all([
        api.get("/api/dashboard/customers?limit=100"),
        api.get("/api/dashboard/products?limit=100"),
      ]);
      setCustomers(asList(cRes, "items", "customers", "data"));
      setProducts(asList(pRes, "items", "products", "data"));
    } catch {
      /* optional */
    }
  }, []);

  // ---------- List ----------
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
        const res = await api.get(`/api/dashboard/invoices?${qs.toString()}`);
        const list = asList(res, "items", "invoices", "data");
        setItems((prev) => (cursor ? [...prev, ...list] : list));
        setNextCursor(pick(res, ["nextCursor", "after", "cursor", "next"]) ?? null);
      } catch (e: any) {
        setError(e?.message || "Couldn't load invoices.");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [statusF]
  );

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  // ---------- Create ----------
  const openCreate = () => {
    setCustomerId(customers[0]?.id || "");
    setDueDate("");
    setRows([{ key: Date.now(), productId: "", quantity: "1", unitPrice: "" }]);
    setFormErr("");
    setFormOpen(true);
  };

  const total = rows.reduce(
    (a, r) => a + (parseFloat(r.quantity) || 0) * (parseFloat(r.unitPrice) || 0),
    0
  );

  const submit = async () => {
    const lineItemsPayload = rows
      .filter((r) => r.productId)
      .map((r) => ({
        productId: r.productId,
        quantity: parseInt(r.quantity, 10) || 1,
        unitPriceAtIssue: String(parseFloat(r.unitPrice) || 0), // decimal string
      }));

    if (!customerId) return setFormErr("Pick a customer.");
    if (!lineItemsPayload.length) return setFormErr("Add at least one line.");
    if (lineItemsPayload.some((li) => parseFloat(li.unitPriceAtIssue) <= 0)) {
      return setFormErr("Every line needs a price greater than zero.");
    }

    setFormBusy(true);
    setFormErr("");
    try {
      await api.post("/api/dashboard/invoices", {
        customerId,
        dueDate: dueDate
          ? new Date(dueDate + "T00:00:00.000Z").toISOString()
          : undefined,
        lineItems: lineItemsPayload,
      });
      toast.success("Draft invoice saved — issue it when you're ready.");
      setFormOpen(false);
      load();
    } catch (e: any) {
      setFormErr(e?.message || "Couldn't create the invoice.");
    } finally {
      setFormBusy(false);
    }
  };

  // ---------- Detail ----------
  const openDetail = async (id: string) => {
    setDetailBusy(true);
    setDetail({ id });
    setLineItems([]);
    setPayments([]);
    try {
      const res: any = await api.get(`/api/dashboard/invoices/${id}`);
      const inv = res?.invoice ?? res;
      setDetail(inv);
      setLineItems(Array.isArray(res?.lineItems) ? res.lineItems : inv?.lineItems || []);
      setPayments(Array.isArray(res?.payments) ? res.payments : inv?.payments || []);
    } catch (e: any) {
      setDetail(null);
      toast.error(e?.message || "Couldn't open the invoice.");
    } finally {
      setDetailBusy(false);
    }
  };

  // ---------- Issue ----------
  const issue = async (inv: any) => {
    setActionBusy(true);
    try {
      await api.post(`/api/dashboard/invoices/${inv.id}/issue`);
      toast.success("Invoice issued.");
      openDetail(inv.id);
      load();
    } catch (e: any) {
      toast.error(e?.message || "Couldn't issue the invoice.");
    } finally {
      setActionBusy(false);
    }
  };

  // ---------- Payment ----------
  const recordPayment = async () => {
    const amount = payAmount.trim();
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error("Enter a positive amount.");
      return;
    }
    setPayBusy(true);
    try {
      await api.post(`/api/dashboard/invoices/${detail.id}/payments`, {
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
          ? "Amount exceeds the remaining balance."
          : e?.code === "INVOICE_NOT_ISSUED"
          ? "Only issued invoices can receive payments."
          : e?.message || "Couldn't record the payment.";
      toast.error(msg);
    } finally {
      setPayBusy(false);
    }
  };

  // ---------- Void ----------
  const doVoid = async () => {
    if (!voidFor) return;
    setActionBusy(true);
    try {
      await api.post(`/api/dashboard/invoices/${voidFor.id}/void`);
      toast.success("Invoice voided.");
      setVoidFor(null);
      if (detail?.id === voidFor.id) openDetail(voidFor.id);
      load();
    } catch (e: any) {
      const msg =
        e?.code === "INVOICE_HAS_PAYMENTS"
          ? "Invoices with payments can't be voided."
          : e?.code === "INVOICE_NOT_ISSUED"
          ? "Only issued invoices can be voided."
          : e?.message || "Couldn't void the invoice.";
      toast.error(msg);
    } finally {
      setActionBusy(false);
    }
  };

  // ---------- Delete (draft only) ----------
  const confirmDelete = async () => {
    if (!delFor) return;
    setDelBusy(true);
    try {
      await api.del(`/api/dashboard/invoices/${delFor.id}`);
      toast.success("Draft deleted.");
      setDelFor(null);
      if (detail?.id === delFor.id) setDetail(null);
      load();
    } catch (e: any) {
      const msg =
        e?.code === "INVOICE_NOT_DRAFT"
          ? "Only draft invoices can be deleted. Issued invoices must be voided."
          : e?.message || "Couldn't delete the invoice.";
      toast.error(msg);
    } finally {
      setDelBusy(false);
    }
  };

  const custName = (i: any) =>
    i.customer?.name || i.customerName || "—";

  const balanceOf = (inv: any) => {
    if (inv?.balanceDue != null) return rawNum(inv.balanceDue);
    return rawNum(inv?.total) - rawNum(inv?.amountPaid);
  };

  return (
    <div>
      <PageHead
        title="Invoices"
        sub="Money owed, tracked from draft to paid — with a proper payment ledger."
      >
        <Button icon="plus" onClick={openCreate}>
          New invoice
        </Button>
      </PageHead>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            className={cls("chip", statusF === s && "chip-on")}
            onClick={() => setStatusF(s)}
          >
            {s === "ALL" ? "All" : titleCase(s)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
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
            icon="file"
            title="No invoices yet"
            hint="Invoice a customer on account — issue it, then record payments until it's settled."
            action={
              <Button icon="plus" onClick={openCreate}>
                Create an invoice
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
                  <th>Invoice</th>
                  <th>Customer</th>
                  <th>Issued</th>
                  <th>Due</th>
                  <th className="text-right">Paid</th>
                  <th className="text-right">Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((i) => (
                  <tr
                    key={i.id}
                    className="cursor-pointer"
                    onClick={() => openDetail(i.id)}
                  >
                    <td className="font-bold">{i.number || "Draft"}</td>
                    <td className="max-w-[180px] truncate">{custName(i)}</td>
                    <td className="whitespace-nowrap text-ink-500">
                      {fd(i.issuedAt)}
                    </td>
                    <td className="whitespace-nowrap text-ink-500">
                      {fd(i.dueDate)}
                    </td>
                    <td className="text-right">
                      <Money v={i.amountPaid} currency={currency} />
                    </td>
                    <td className="text-right">
                      <Money v={i.total} currency={currency} strong />
                    </td>
                    <td>
                      <StatusBadge status={i.status} />
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

      {/* ---------- New invoice ---------- */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title="New invoice"
        sub="Saved as a draft — issue it to stamp a number."
        wide
        footer={
          <>
            <div className="mr-auto flex items-center gap-2 text-sm">
              <span className="font-bold text-ink-500">Total</span>
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
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Customer">
            <Select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
            >
              <option value="">Choose a customer…</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Due date">
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </Field>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between">
            <label className="lbl !mb-0">Line items</label>
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
                    quantity: "1",
                    unitPrice: "",
                  },
                ])
              }
            >
              Add line
            </Button>
          </div>
          <div className="mt-2 space-y-2">
            {rows.map((r) => (
              <div key={r.key} className="flex flex-wrap items-center gap-2">
                <Select
                  className="min-w-[160px] flex-1"
                  value={r.productId}
                  onChange={(e) => {
                    const p = products.find((x) => x.id === e.target.value);
                    setRows((rs) =>
                      rs.map((x) =>
                        x.key === r.key
                          ? {
                              ...x,
                              productId: e.target.value,
                              unitPrice: String(
                                p?.discountPrice ?? p?.price ?? x.unitPrice
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
                <Input
                  className="w-20"
                  type="number"
                  min="1"
                  value={r.quantity}
                  onChange={(e) =>
                    setRows((rs) =>
                      rs.map((x) =>
                        x.key === r.key ? { ...x, quantity: e.target.value } : x
                      )
                    )
                  }
                  placeholder="Qty"
                />
                <Input
                  className="w-28"
                  type="number"
                  min="0"
                  step="0.01"
                  value={r.unitPrice}
                  onChange={(e) =>
                    setRows((rs) =>
                      rs.map((x) =>
                        x.key === r.key ? { ...x, unitPrice: e.target.value } : x
                      )
                    )
                  }
                  placeholder={`Price (${currency})`}
                />
                <span className="w-24 text-right text-sm font-bold tabular-nums">
                  <Money
                    v={
                      (parseFloat(r.quantity) || 0) *
                      (parseFloat(r.unitPrice) || 0)
                    }
                    currency={currency}
                  />
                </span>
                <IconBtn
                  name="trash"
                  label="Remove line"
                  onClick={() =>
                    setRows((rs) =>
                      rs.length > 1 ? rs.filter((x) => x.key !== r.key) : rs
                    )
                  }
                />
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* ---------- Detail ---------- */}
      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail?.number || "Invoice"}
        sub={
          detail
            ? `${custName(detail)} · ${fd(detail.issuedAt || detail.createdAt)}`
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
                    Issue invoice
                  </Button>
                </>
              )}
              {detail.status === "ISSUED" && (
                <>
                  <Button
                    variant="outline"
                    className="mr-auto"
                    onClick={() => setVoidFor(detail)}
                  >
                    Void
                  </Button>
                  <Button
                    loading={payBusy}
                    onClick={() => {
                      setPayAmount("");
                      setPayNote("");
                      setPayOpen(true);
                    }}
                    icon="banknote"
                  >
                    Record payment
                  </Button>
                </>
              )}
              {detail.status === "PAID" && (
                <span className="text-sm font-semibold text-leaf-600">
                  Fully paid
                </span>
              )}
              {detail.status === "VOID" && (
                <span className="text-sm font-semibold text-ink-400">
                  This invoice has been voided.
                </span>
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
                    <th>Item</th>
                    <th className="text-right">Qty</th>
                    <th className="text-right">Price</th>
                    <th className="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((li: any, i: number) => (
                    <tr key={li.id || i}>
                      <td className="font-bold">
                        {li.productName || li.product?.name || "Item"}
                      </td>
                      <td className="text-right tabular-nums">
                        {rawNum(li.quantity)}
                      </td>
                      <td className="text-right">
                        <Money v={li.unitPriceAtIssue} currency={currency} />
                      </td>
                      <td className="text-right font-bold">
                        <Money
                          v={
                            li.lineTotal ??
                            rawNum(li.unitPriceAtIssue) * rawNum(li.quantity)
                          }
                          currency={currency}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 grid gap-x-8 sm:grid-cols-2">
              <div>
                <KV
                  label="Status"
                  value={<StatusBadge status={detail.status} />}
                />
                <KV label="Due date" value={fd(detail.dueDate)} />
                <KV label="Issued" value={fd(detail.issuedAt)} />
              </div>
              <div>
                <KV
                  label="Total"
                  value={<Money v={detail.total} currency={currency} strong />}
                />
                <KV
                  label="Amount paid"
                  value={
                    detail.amountPaid != null && rawNum(detail.amountPaid) > 0 ? (
                      <span className="text-leaf-600">
                        <Money v={detail.amountPaid} currency={currency} />
                      </span>
                    ) : (
                      "—"
                    )
                  }
                />
                <KV
                  label="Balance"
                  value={
                    <Money v={balanceOf(detail)} currency={currency} strong />
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
                    className="flex items-center justify-between border-b border-cream-100 py-2 text-sm last:border-0"
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
          </div>
        )}
      </Modal>

      {/* ---------- Record payment ---------- */}
      <Modal
        open={payOpen}
        onClose={() => setPayOpen(false)}
        title="Record payment"
        sub={
          detail ? (
            <span>
              Balance:{" "}
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
              placeholder="e.g. bank transfer ref"
            />
          </Field>
        </div>
      </Modal>

      {/* ---------- Confirms ---------- */}
      <Confirm
        open={!!voidFor}
        onClose={() => setVoidFor(null)}
        onConfirm={doVoid}
        loading={actionBusy}
        title="Void this invoice?"
        body="Voiding cancels the invoice. Invoices with recorded payments can't be voided."
        confirmLabel="Void invoice"
      />
      <Confirm
        open={!!delFor}
        onClose={() => setDelFor(null)}
        onConfirm={confirmDelete}
        loading={delBusy}
        title="Delete this draft?"
        body="Only drafts can be deleted. Issued invoices must be voided instead."
        confirmLabel="Delete draft"
      />
    </div>
  );
}
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { apiErrorMessage, asList, cls, fd, pick, rawNum, titleCase } from "../lib/format";
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
  Toggle,
  toast,
} from "../components/ui";

const STATUSES = ["ALL", "DRAFT", "ISSUED", "PAID", "VOID"] as const;

const MAX_QTY = 1_000_000;
const MAX_PRICE = 99999999.99;

interface LineRow {
  key: number;
  productId: string;
  quantity: string;
  unitPrice: string;
}

// `apiErrorMessage` (shared error -> message mapping) lives in lib/format so
// every dashboard page maps the contract's error codes the same way.

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
  const [q, setQ] = useState("");
  const [qDebounced, setQDebounced] = useState("");

  // Catalog
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  // Create / Edit (PUT only touches dueDate + lineItems, never customerId)
  const [formOpen, setFormOpen] = useState(false);
  const [formBusy, setFormBusy] = useState(false);
  const [formErr, setFormErr] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
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

  // Public share link (disable/enable without voiding)
  const [linkBusy, setLinkBusy] = useState(false);
  const [linkOffFor, setLinkOffFor] = useState<any | null>(null);

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

  // ---------- Search debounce ----------
  useEffect(() => {
    const t = setTimeout(() => setQDebounced(q.trim()), 350);
    return () => clearTimeout(t);
  }, [q]);

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
        if (qDebounced) qs.set("q", qDebounced);
        if (cursor) qs.set("cursor", cursor);
        const res = await api.get(`/api/dashboard/invoices?${qs.toString()}`);
        const list = asList(res, "items", "invoices", "data");
        setItems((prev) => (cursor ? [...prev, ...list] : list));
        setNextCursor(pick(res, ["nextCursor", "after", "cursor", "next"]) ?? null);
      } catch (e: any) {
        setError(apiErrorMessage(e, "Couldn't load invoices."));
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [statusF, qDebounced]
  );

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  // ---------- Create ----------
  const openCreate = () => {
    setEditingId(null);
    setCustomerId(customers[0]?.id || "");
    setDueDate("");
    setRows([{ key: Date.now(), productId: "", quantity: "1", unitPrice: "" }]);
    setFormErr("");
    setFormOpen(true);
  };

  // Edit only ever applies to a DRAFT, and PUT never changes the customer.
  const openEdit = (inv: any, currentLineItems: any[]) => {
    setEditingId(inv.id);
    setCustomerId(inv.customer?.id || inv.customerId || "");
    setDueDate(inv.dueDate ? String(inv.dueDate).slice(0, 10) : "");
    setRows(
      (currentLineItems.length
        ? currentLineItems
        : [{ productId: "", quantity: 1, unitPriceAtIssue: "" }]
      ).map((li: any, idx: number) => ({
        key: Date.now() + idx,
        productId: li.productId,
        quantity: String(li.quantity ?? 1),
        unitPrice: String(li.unitPriceAtIssue ?? ""),
      }))
    );
    setFormErr("");
    setFormOpen(true);
  };

  const total = rows.reduce(
    (a, r) => a + (parseFloat(r.quantity) || 0) * (parseFloat(r.unitPrice) || 0),
    0
  );

  const validateRows = () => {
    const cleaned = rows.filter((r) => r.productId);
    if (!cleaned.length) return { err: "Add at least one line." };
    for (const r of cleaned) {
      const qty = parseInt(r.quantity, 10);
      const price = parseFloat(r.unitPrice);
      if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) {
        return { err: `Quantity must be between 1 and ${MAX_QTY.toLocaleString()}.` };
      }
      if (!(price > 0) || price > MAX_PRICE) {
        return { err: `Price must be greater than 0 and at most ${MAX_PRICE.toLocaleString()}.` };
      }
    }
    return {
      cleaned: cleaned.map((r) => ({
        productId: r.productId,
        quantity: parseInt(r.quantity, 10),
        unitPriceAtIssue: String(parseFloat(r.unitPrice)),
      })),
    };
  };

  const submit = async () => {
    const { cleaned, err } = validateRows();
    if (err) return setFormErr(err);
    if (!editingId && !customerId) return setFormErr("Pick a customer.");

    setFormBusy(true);
    setFormErr("");
    try {
      const dueDateIso = dueDate
        ? new Date(dueDate + "T00:00:00.000Z").toISOString()
        : editingId
        ? null // PUT allows explicit null to clear
        : undefined;

      if (editingId) {
        await api.put(`/api/dashboard/invoices/${editingId}`, {
          dueDate: dueDateIso,
          lineItems: cleaned,
        });
        toast.success("Draft updated.");
      } else {
        await api.post("/api/dashboard/invoices", {
          customerId,
          dueDate: dueDateIso,
          lineItems: cleaned,
        });
        toast.success("Draft invoice saved — issue it when you're ready.");
      }
      setFormOpen(false);
      if (editingId) openDetail(editingId);
      load();
    } catch (e: any) {
      setFormErr(
        apiErrorMessage(e, editingId ? "Couldn't update the invoice." : "Couldn't create the invoice.", {
          INVOICE_NOT_DRAFT: "This invoice is no longer a draft and can't be edited.",
          PRODUCT_NOT_FOUND: "One of the selected products no longer exists.",
          CUSTOMER_NOT_FOUND: "That customer no longer exists.",
        })
      );
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
      toast.error(apiErrorMessage(e, "Couldn't open the invoice."));
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
      toast.error(
        apiErrorMessage(e, "Couldn't issue the invoice.", {
          INVOICE_NOT_DRAFT: "This invoice has already been issued.",
        })
      );
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
    if (Number(amount) > MAX_PRICE) {
      toast.error(`Amount can't exceed ${MAX_PRICE.toLocaleString()}.`);
      return;
    }
    setPayBusy(true);
    try {
      const res: any = await api.post(`/api/dashboard/invoices/${detail.id}/payments`, {
        amount, // decimal string
        note: payNote.trim() || undefined,
      });
      const settled = res?.status === "PAID";
      toast.success(settled ? "Payment recorded — invoice fully paid." : "Payment recorded.");
      setPayOpen(false);
      setPayAmount("");
      setPayNote("");
      openDetail(detail.id);
      load();
    } catch (e: any) {
      toast.error(
        apiErrorMessage(e, "Couldn't record the payment.", {
          PAYMENT_EXCEEDS_BALANCE: "Amount exceeds the remaining balance.",
          INVOICE_NOT_ISSUED: "Only issued invoices can receive payments.",
        })
      );
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
      toast.error(
        apiErrorMessage(e, "Couldn't void the invoice.", {
          INVOICE_HAS_PAYMENTS: "Invoices with payments can't be voided.",
          INVOICE_NOT_ISSUED: "Only issued invoices can be voided.",
        })
      );
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
      toast.error(
        apiErrorMessage(e, "Couldn't delete the invoice.", {
          INVOICE_NOT_DRAFT: "Only draft invoices can be deleted. Issued invoices must be voided.",
        })
      );
    } finally {
      setDelBusy(false);
    }
  };

  // ---------- Public share link ----------
  // Disabling 404s the public read WITHOUT voiding the invoice, so a link that
  // was shared too widely can be revoked with no financial side effect.
  const setLinkEnabled = async (enabled: boolean) => {
    if (!detail?.id) return;
    setLinkBusy(true);
    try {
      const res: any = await api.post(
        `/api/dashboard/invoices/${detail.id}/${
          enabled ? "enable-link" : "disable-link"
        }`
      );
      const inv = res?.invoice ?? res;
      if (inv?.id) setDetail(inv);
      toast.success(
        enabled ? "Customer link is live again." : "Customer link turned off."
      );
      setLinkOffFor(null);
      load();
    } catch (e: any) {
      toast.error(
        apiErrorMessage(e, "Couldn't change the customer link.", {
          INVOICE_NOT_ISSUED: "Only issued invoices have a link to toggle.",
          INVOICE_NOT_FOUND: "That invoice no longer exists.",
        })
      );
    } finally {
      setLinkBusy(false);
    }
  };

  const custName = (i: any) => i.customer?.name || i.customerName || "—";

  const balanceOf = (inv: any) => {
    if (inv?.balanceDue != null) return rawNum(inv.balanceDue);
    return rawNum(inv?.total) - rawNum(inv?.amountPaid);
  };

  // Defensive: the backend builds shareUrl from a configured origin env var.
  // If that var is ever set without a scheme (e.g. "brikoh.com" instead of
  // "https://brikoh.com"), fall back to https:// rather than showing/copying
  // a broken relative link.
  const normalizedShareUrl = (url: string | null | undefined) => {
    if (!url) return null;
    return /^https?:\/\//i.test(url) ? url : `https://${url}`;
  };

  const copyShareLink = async () => {
    const url = normalizedShareUrl(detail?.shareUrl);
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied.");
    } catch {
      toast.error("Couldn't copy the link — copy it manually.");
    }
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

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1.5">
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
        <div className="ml-auto w-full max-w-[240px]">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search customer name or phone…"
          />
        </div>
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

      {/* ---------- New / Edit invoice ---------- */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingId ? "Edit draft" : "New invoice"}
        sub={
          editingId
            ? "Line items and due date only — the customer can't be changed on a draft."
            : "Saved as a draft — issue it to stamp a number."
        }
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
              {editingId ? "Save changes" : "Save draft"}
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
            {editingId ? (
              <Input value={custName(detail || {})} disabled readOnly />
            ) : (
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
            )}
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
                  max={MAX_QTY}
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
                  max={MAX_PRICE}
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
                    variant="outline"
                    onClick={() => openEdit(detail, lineItems)}
                    icon="pencil"
                  >
                    Edit
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
                    disabled={rawNum(detail.amountPaid) > 0}
                    title={
                      rawNum(detail.amountPaid) > 0
                        ? "Invoices with payments can't be voided"
                        : undefined
                    }
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
            {/* Public link — shared out-of-band by the merchant, and revocable
                without voiding the invoice. */}
            {detail.status !== "DRAFT" && (
              <div className="mb-4 rounded-xl border border-cream-200 bg-cream-50 px-3.5 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wide text-ink-400">
                      Customer link
                    </p>
                    {normalizedShareUrl(detail.shareUrl) ? (
                      <p className="truncate text-sm text-ink-600">
                        {normalizedShareUrl(detail.shareUrl)}
                      </p>
                    ) : (
                      <p className="text-sm font-semibold text-ink-500">
                        Turned off — the public link now looks like an unknown
                        invoice.
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {normalizedShareUrl(detail.shareUrl) && (
                      <Button
                        variant="outline"
                        size="sm"
                        icon="copy"
                        onClick={copyShareLink}
                      >
                        Copy
                      </Button>
                    )}

                    <Toggle
                      checked={detail.linkEnabled !== false}
                      onChange={(v) =>
                        v ? setLinkEnabled(true) : setLinkOffFor(detail)
                      }
                      label="Link on"
                    />
                  </div>
                </div>

                {detail.linkEnabled === false && (
                  <p className="mt-2 text-xs text-ink-400">
                    Nothing financial changed — the invoice is still payable and
                    still lists here. Switch the link back on whenever you like.
                  </p>
                )}
              </div>
            )}

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
      {/* Revoke a shared link — 404s the public read without voiding, so it
          carries no financial side effect. */}
      <Confirm
        open={!!linkOffFor}
        onClose={() => setLinkOffFor(null)}
        onConfirm={() => setLinkEnabled(false)}
        loading={linkBusy}
        title="Turn the customer link off?"
        body="The public link stops working immediately and looks like an unknown invoice. Nothing else changes — the invoice stays payable, keeps its payments, and you can switch the link back on at any time."
        confirmLabel="Turn link off"
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
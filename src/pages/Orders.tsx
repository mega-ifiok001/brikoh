import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { cls, fdt, titleCase } from "../lib/format";
import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  Field,
  Input,
  KV,
  LoadMore,
  Modal,
  Money,
  PageHead,
  SearchInput,
  StatusBadge,
  toast,
} from "../components/ui";

const STATUSES = [
  "ALL",
  "PENDING",
  "AWAITING_PAYMENT",
  "PAID",
  "SHIPPED",
  "CANCELLED",
  "REFUNDED",
  "FAILED",
];

const PAYMENT_METHODS = [
  "ALL",
  "CASH",
  "TRANSFER",
  "CREDIT",
  "CARD",
];

const SOURCES = [
  "ALL",
  "STOREFRONT",
  "POS",
  "DIRECT",
  "SOCIAL",
  "MARKETPLACE",
  "REFERRAL",
];

export default function Orders() {
  const { me } = useAuth();
  const currency: string = (me.store || {}).currency || "NGN";

  const [items, setItems] = useState<any[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [status, setStatus] = useState("ALL");
  const [paymentMethod, setPaymentMethod] = useState("ALL");
  const [source, setSource] = useState("ALL");
  const [q, setQ] = useState("");

  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  const [detail, setDetail] = useState<any | null>(null);
  const [detailBusy, setDetailBusy] = useState(false);

  // Deep-link: /dashboard/orders?customerId=<id> pre-filters to one customer's
  // orders (the Customers page links here). Read once on mount.
  const [searchParams] = useSearchParams();
  const [customerId] = useState(
    () => searchParams.get("customerId") || ""
  );

  const [paymentBusy, setPaymentBusy] = useState(false);
  const [confirmAmount, setConfirmAmount] = useState("");

  const load = useCallback(
    async (cursor?: string | null) => {
      if (!cursor) setLoading(true);
      else setLoadingMore(true);

      setError(null);

      try {
        const qs = new URLSearchParams();

        qs.set("limit", "20");

        if (status !== "ALL") {
          qs.set("status", status);
        }

        if (paymentMethod !== "ALL") {
          qs.set("paymentMethod", paymentMethod);
        }

        if (source !== "ALL") {
          qs.set("source", source);
        }

        if (q.trim()) {
          qs.set("q", q.trim());
        }

        if (start) {
          qs.set("start", start);
        }

        if (end) {
          qs.set("end", end);
        }

        if (customerId) {
          qs.set("customerId", customerId);
        }

        if (cursor) {
          qs.set("cursor", cursor);
        }

        const res: any = await api.get(
          `/api/dashboard/orders?${qs.toString()}`
        );

        setItems((prev) =>
          cursor
            ? [...prev, ...(res?.items ?? [])]
            : res?.items ?? []
        );

        setNextCursor(res?.nextCursor ?? null);
      } catch (e: any) {
        setError(e?.message || "Couldn't load orders.");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [status, paymentMethod, source, q, start, end, customerId]
  );

  useEffect(() => {
    const t = setTimeout(() => {
      load();
    }, 350);

    return () => clearTimeout(t);
  }, [load]);

  const openDetail = async (id: string) => {
    setDetailBusy(true);
    setDetail({ id });

    try {
      const res: any = await api.get(
        `/api/dashboard/orders/${id}`
      );

      setDetail({
        ...res.order,
        repayments: res?.repayments ?? [],
        lineItems: res?.lineItems ?? [],
      });

      if (res?.order?.total != null) {
        setConfirmAmount(String(res.order.total));
      }
    } catch (e: any) {
      setDetail(null);
      toast.error(e?.message || "Couldn't open that order.");
    } finally {
      setDetailBusy(false);
    }
  };

  const confirmPayment = async () => {
    if (!detail?.id) return;

    const amount =
      confirmAmount.trim() === ""
        ? undefined
        : Number(confirmAmount);

    if (
      confirmAmount.trim() !== "" &&
      (amount === undefined || !Number.isFinite(amount) || amount <= 0)
    ) {
      toast.error("Enter a valid confirmed amount.");
      return;
    }

    setPaymentBusy(true);

    try {
      const body =
        amount === undefined
          ? {}
          : { confirmedAmount: amount };

      const res: any = await api.post(
        `/api/dashboard/orders/${detail.id}/confirm-payment`,
        body
      );

      setDetail({
        ...res.order,
        repayments: res?.repayments ?? [],
        lineItems: res?.lineItems ?? [],
      });

      toast.success("Payment confirmed — order marked as paid.");

      await load();
    } catch (e: any) {
      const msg =
        e?.code === "AMOUNT_MISMATCH"
          ? "The confirmed amount must exactly match the order total."
          : e?.code === "ORDER_NOT_AWAITING_PAYMENT"
          ? "This order is no longer awaiting payment."
          : e?.code === "CONFIRM_CONFLICT"
          ? "This order was updated by another action. Please refresh."
          : e?.message || "Couldn't confirm payment.";

      toast.error(msg);
    } finally {
      setPaymentBusy(false);
    }
  };

  const rejectPayment = async () => {
    if (!detail?.id) return;

    setPaymentBusy(true);

    try {
      const res: any = await api.post(
        `/api/dashboard/orders/${detail.id}/reject-payment`
      );

      setDetail({
        ...res.order,
        repayments: res?.repayments ?? [],
        lineItems: res?.lineItems ?? [],
      });

      toast.success("Payment claim rejected.");

      await load();
    } catch (e: any) {
      const msg =
        e?.code === "ORDER_NOT_AWAITING_PAYMENT"
          ? "This order is no longer awaiting payment."
          : e?.message || "Couldn't reject payment.";

      toast.error(msg);
    } finally {
      setPaymentBusy(false);
    }
  };

  const custName = (o: any) =>
    o.customer?.name || "Walk-in";

  // Manual-confirmation orders: the customer says they've paid into
  // your bank account, but there's no automated payout yet, so you
  // confirm it yourself once you see it land.
  const isAwaitingManualConfirmation =
    detail?.status === "AWAITING_PAYMENT";

  return (
    <div>
      <PageHead
        title="Orders"
        sub="Everything sold through POS and your storefront."
      />

      {/* Filters */}
      <div className="mb-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput
            value={q}
            onChange={setQ}
            placeholder="Search customer name or phone…"
            className="w-full sm:w-72"
          />

          <div className="flex flex-wrap gap-1.5">
            {STATUSES.map((s) => (
              <button
                key={s}
                className={cls(
                  "chip",
                  status === s && "chip-on"
                )}
                onClick={() => setStatus(s)}
              >
                {s === "ALL" ? "All" : titleCase(s)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {PAYMENT_METHODS.map((method) => (
            <button
              key={method}
              className={cls(
                "chip",
                paymentMethod === method && "chip-on"
              )}
              onClick={() => setPaymentMethod(method)}
            >
              {method === "ALL"
                ? "All payments"
                : titleCase(method)}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {SOURCES.map((s) => (
            <button
              key={s}
              className={cls(
                "chip",
                source === s && "chip-on"
              )}
              onClick={() => setSource(s)}
            >
              {s === "ALL"
                ? "All channels"
                : titleCase(s)}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <Field label="From">
            <Input
              type="datetime-local"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </Field>

          <Field label="To">
            <Input
              type="datetime-local"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
          </Field>

          {(start || end) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStart("");
                setEnd("");
              }}
            >
              Clear dates
            </Button>
          )}
        </div>
      </div>

      {/* Orders */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="skeleton h-14"
            />
          ))}
        </div>
      ) : error ? (
        <div className="card">
          <ErrorState
            message={error}
            onRetry={() => load()}
          />
        </div>
      ) : items.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="receipt"
            title="No orders found"
            hint="POS sales and storefront checkouts will appear here."
          />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto scrollbar-slim">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Source</th>
                  <th className="text-right">
                    Items
                  </th>
                  <th>Paid by</th>
                  <th className="text-right">
                    Total
                  </th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {items.map((o) => {
                  const needsConfirmation =
                    o.status === "AWAITING_PAYMENT";

                  return (
                    <tr
                      key={o.id}
                      className={cls(
                        "cursor-pointer",
                        needsConfirmation &&
                          "bg-gold-50/60"
                      )}
                      onClick={() =>
                        openDetail(o.id)
                      }
                    >
                      <td className="font-bold">
                        {o.orderNumber}
                      </td>

                      <td className="whitespace-nowrap text-ink-500">
                        {fdt(o.createdAt)}
                      </td>

                      <td className="max-w-[180px] truncate">
                        {custName(o)}
                      </td>

                      <td>
                        <Badge tone="neutral">
                          {titleCase(o.source)}
                        </Badge>
                      </td>

                      <td className="text-right tabular-nums">
                        {o.itemCount ?? "—"}
                      </td>

                      <td className="text-ink-500">
                        {o.paymentMethod
                          ? titleCase(
                              o.paymentMethod
                            )
                          : "Online"}
                      </td>

                      <td className="text-right">
                        <Money
                          v={o.total}
                          currency={currency}
                          strong
                        />
                      </td>

                      <td>
                        <div className="flex items-center gap-1.5">
                          <StatusBadge
                            status={o.status}
                          />

                          {needsConfirmation && (
                            <span className="inline-flex rounded-full bg-gold-100 px-2 py-0.5 text-[10px] font-extrabold uppercase text-gold-700">
                              Check bank
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
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

      {/* Order detail */}
      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={
          detail?.orderNumber || "Order"
        }
        sub={
          detail
            ? `${titleCase(
                detail.status || ""
              )} · ${fdt(
                detail.createdAt
              )}`
            : undefined
        }
        wide
        footer={
          <Button
            variant="ghost"
            onClick={() => setDetail(null)}
          >
            Close
          </Button>
        }
      >
        {detailBusy || !detail?.lineItems ? (
          <div className="space-y-3 py-4">
            <div className="skeleton h-8" />
            <div className="skeleton h-24" />
            <div className="skeleton h-24" />
          </div>
        ) : (
          <div>
            {/* Order information */}
            <div className="grid gap-x-8 sm:grid-cols-2">
              <div>
                <KV
                  label="Order number"
                  value={detail.orderNumber}
                />

                <KV
                  label="Customer"
                  value={custName(detail)}
                />

                <KV
                  label="Phone"
                  value={
                    detail.customer?.phone ||
                    "—"
                  }
                />

                <KV
                  label="Source"
                  value={titleCase(
                    detail.source
                  )}
                />

                <KV
                  label="Branch"
                  value={
                    detail.branch?.name ||
                    "—"
                  }
                />

                <KV
                  label="Sold by"
                  value={
                    detail.soldBy?.name ||
                    "—"
                  }
                />
              </div>

              <div>
                <KV
                  label="Status"
                  value={
                    <StatusBadge
                      status={detail.status}
                    />
                  }
                />

                {detail.paymentMethod && (
                  <KV
                    label="Payment"
                    value={titleCase(
                      detail.paymentMethod
                    )}
                  />
                )}

                <KV
                  label="Total"
                  value={
                    <Money
                      v={detail.total}
                      currency={currency}
                      strong
                      className="font-display text-base"
                    />
                  }
                />

                <KV
                  label="Discount"
                  value={
                    <Money
                      v={
                        detail.discountAmount ??
                        "0.00"
                      }
                      currency={currency}
                    />
                  }
                />

                <KV
                  label="Amount paid"
                  value={
                    <Money
                      v={
                        detail.amountPaid ??
                        "0.00"
                      }
                      currency={currency}
                    />
                  }
                />

                <KV
                  label="Balance due"
                  value={
                    <Money
                      v={
                        detail.balanceDue ??
                        (detail.total != null &&
                        detail.amountPaid != null
                          ? String(
                              Number(
                                detail.total
                              ) -
                                Number(
                                  detail.amountPaid
                                )
                            )
                          : "0.00")
                      }
                      currency={currency}
                    />
                  }
                />
              </div>
            </div>

            {/* Manual payment confirmation */}
            {isAwaitingManualConfirmation && (
              <div className="mt-5 rounded-xl border border-gold-200 bg-gold-50 p-4">
                <p className="mb-1 text-sm font-bold text-gold-800">
                  Waiting on you to confirm this payment
                </p>

                <p className="mb-3 text-xs text-gold-700">
                  The customer says they've paid. Check your
                  bank app or SMS alert — if you see the money,
                  confirm it below to mark this order as paid.
                  If nothing has come in, reject it instead.
                </p>

                <Field
                  label="Confirmed amount"
                  hint="What actually landed in your account. Defaults to the order total."
                >
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={confirmAmount}
                    onChange={(e) =>
                      setConfirmAmount(
                        e.target.value
                      )
                    }
                  />
                </Field>

                <div className="mt-3 flex flex-wrap justify-end gap-2">
                  <Button
                    variant="danger"
                    loading={paymentBusy}
                    onClick={rejectPayment}
                  >
                    No money received — reject
                  </Button>

                  <Button
                    icon="check"
                    loading={paymentBusy}
                    onClick={confirmPayment}
                  >
                    I've seen it — confirm payment
                  </Button>
                </div>
              </div>
            )}

            {/* Bank transfer details, if the order has them */}
            {detail.bankDetails && (
              <div className="mt-5 rounded-xl border border-cream-200 p-4">
                <p className="mb-1 text-xs font-extrabold uppercase tracking-wide text-ink-400">
                  Bank transfer details
                </p>

                <p className="mb-3 text-xs text-ink-400">
                  The customer was shown this account number
                  at checkout and told to pay into it directly.
                </p>

                <div className="grid gap-x-8 sm:grid-cols-2">
                  <KV
                    label="Payment reference"
                    value={
                      detail.paymentReference ||
                      "—"
                    }
                  />

                  <KV
                    label="Bank"
                    value={
                      detail.bankDetails
                        ?.bankName || "—"
                    }
                  />

                  <KV
                    label="Account name"
                    value={
                      detail.bankDetails
                        ?.accountName || "—"
                    }
                  />

                  <KV
                    label="Account number"
                    value={
                      detail.bankDetails
                        ?.accountNumber || "—"
                    }
                  />
                </div>
              </div>
            )}

            {/* Line items */}
            <div className="mt-5">
              <p className="mb-2 text-xs font-extrabold uppercase tracking-wide text-ink-400">
                Line items
              </p>

              {detail.lineItems.length >
              0 ? (
                <div className="overflow-x-auto rounded-xl border border-cream-200">
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th className="text-right">
                          Qty
                        </th>
                        <th className="text-right">
                          Unit price
                        </th>
                        <th className="text-right">
                          Line total
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {detail.lineItems.map(
                        (li: any) => (
                          <tr key={li.id}>
                            <td className="font-bold">
                              {li.productName}

                              {li.variantName
                                ? ` · ${li.variantName}`
                                : ""}
                            </td>

                            <td className="text-right tabular-nums">
                              {li.quantity}
                            </td>

                            <td className="text-right">
                              <Money
                                v={
                                  li.unitPriceAtPurchase
                                }
                                currency={
                                  currency
                                }
                              />
                            </td>

                            <td className="text-right font-bold">
                              <Money
                                v={
                                  li.lineTotal
                                }
                                currency={
                                  currency
                                }
                              />
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="rounded-xl border border-dashed border-cream-200 px-4 py-6 text-center text-sm text-ink-400">
                  No line items attached
                  to this order.
                </p>
              )}
            </div>

            {/* Repayment history — READ ONLY */}
            {detail.repayments?.length >
              0 && (
              <div className="mt-5">
                <p className="mb-2 text-xs font-extrabold uppercase tracking-wide text-ink-400">
                  Repayment history
                </p>

                <div className="space-y-1.5">
                  {detail.repayments.map(
                    (r: any) => (
                      <div
                        key={r.id}
                        className="flex items-center justify-between rounded-lg bg-cream-50 px-3 py-2 text-sm"
                      >
                        <div>
                          <span className="font-bold">
                            <Money
                              v={r.amount}
                              currency={
                                currency
                              }
                            />
                          </span>

                          {r.note && (
                            <span className="ml-2 text-ink-400">
                              {r.note}
                            </span>
                          )}
                        </div>

                        <div className="text-right text-xs text-ink-400">
                          {r.recordedByName && (
                            <div className="font-semibold">
                              {
                                r.recordedByName
                              }
                            </div>
                          )}

                          <div>
                            {fdt(
                              r.createdAt
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
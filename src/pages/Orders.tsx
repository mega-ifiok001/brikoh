import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { cls, fdt, rawNum, titleCase } from "../lib/format";
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

const STATUSES = ["ALL", "PENDING", "PAID", "SHIPPED", "CANCELLED", "REFUNDED", "FAILED"];
const SOURCES = ["ALL", "STOREFRONT", "POS"];

export default function Orders() {
  const { me } = useAuth();
  const currency: string = (me.store || {}).currency || "NGN";

  const [items, setItems] = useState<any[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("ALL");
  const [source, setSource] = useState("ALL");
  const [q, setQ] = useState("");
  const [detail, setDetail] = useState<any | null>(null);
  const [detailBusy, setDetailBusy] = useState(false);
  const [repayOpen, setRepayOpen] = useState(false);
  const [repayAmount, setRepayAmount] = useState("");
  const [repayNote, setRepayNote] = useState("");
  const [repayBusy, setRepayBusy] = useState(false);

  const load = useCallback(
    async (cursor?: string | null) => {
      if (!cursor) setLoading(true);
      else setLoadingMore(true);
      setError(null);
      try {
        const qs = new URLSearchParams();
        qs.set("limit", "20"); // contract max 100, default 20
        if (status !== "ALL") qs.set("status", status);
        if (source !== "ALL") qs.set("source", source);
        if (q.trim()) qs.set("q", q.trim()); // contract param is "q", not "search"
        if (cursor) qs.set("cursor", cursor);

        const res: any = await api.get(`/api/dashboard/orders?${qs.toString()}`);
        // Contract response is flat: { items, nextCursor } — no wrapper key.
        setItems((prev) => (cursor ? [...prev, ...(res?.items ?? [])] : res?.items ?? []));
        setNextCursor(res?.nextCursor ?? null);
      } catch (e: any) {
        setError(e?.message || "Couldn't load orders.");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [status, source, q]
  );

  useEffect(() => {
    const t = setTimeout(() => load(), 350);
    return () => clearTimeout(t);
  }, [load]);

  const openDetail = async (id: string) => {
    setDetailBusy(true);
    setDetail({ id });
    try {
      const res: any = await api.get(`/api/dashboard/orders/${id}`);
      // Contract shape: { order, repayments, lineItems }
      setDetail({
        ...res.order,
        lineItems: res?.lineItems ?? [],
        repayments: res?.repayments ?? [],
      });
    } catch (e: any) {
      setDetail(null);
      toast.error(e?.message || "Couldn't open that order.");
    } finally {
      setDetailBusy(false);
    }
  };

  // Contract guarantees balanceDue is always kept consistent with
  // total - amountPaid after every repayment — trust it directly
  // rather than recomputing.
  const detailOutstanding = rawNum(detail?.balanceDue ?? 0);

  const recordRepay = async () => {
    const amount = parseFloat(repayAmount);
    if (!isFinite(amount) || amount <= 0) {
      toast.error("Enter a positive amount.");
      return;
    }
    setRepayBusy(true);
    try {
      // ⚠️ UNCONFIRMED ENDPOINT — not in the orders contract you've shared.
      // The contract only documents reading `repayments`, not writing them.
      // Swap this for the real route + body shape once you confirm it.
      await api.post(`/api/dashboard/orders/${detail.id}/repayments`, {
        amount,
        note: repayNote.trim() || undefined,
      });
      toast.success("Repayment recorded.");
      setRepayOpen(false);
      setRepayAmount("");
      setRepayNote("");
      openDetail(detail.id);
    } catch (e: any) {
      toast.error(e?.message || "Couldn't record the repayment.");
    } finally {
      setRepayBusy(false);
    }
  };

  const custName = (o: any) => o.customer?.name || "Walk-in";

  return (
    <div>
      <PageHead title="Orders" sub="Everything sold in the shop and through your storefront." />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchInput value={q} onChange={setQ} placeholder="Search by customer name or phone…" className="w-full sm:w-72" />
        <div className="flex flex-wrap gap-1.5">
          {STATUSES.map((s) => (
            <button key={s} className={cls("chip", status === s && "chip-on")} onClick={() => setStatus(s)}>
              {s === "ALL" ? "All" : titleCase(s)}
            </button>
          ))}
        </div>
        <div className="ml-auto flex flex-wrap gap-1.5">
          {SOURCES.map((s) => (
            <button key={s} className={cls("chip", source === s && "chip-on")} onClick={() => setSource(s)}>
              {s === "ALL" ? "All channels" : titleCase(s)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
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
            icon="receipt"
            title="No orders yet"
            hint="Sales made at the POS and checkouts on your storefront will land here."
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
                  <th className="text-right">Items</th>
                  <th>Paid by</th>
                  <th className="text-right">Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((o) => (
                  <tr key={o.id} className="cursor-pointer" onClick={() => openDetail(o.id)}>
                    <td className="font-bold">{o.orderNumber}</td>
                    <td className="whitespace-nowrap text-ink-500">{fdt(o.createdAt)}</td>
                    <td className="max-w-[180px] truncate">{custName(o)}</td>
                    <td>
                      <Badge tone="neutral">{titleCase(o.source)}</Badge>
                    </td>
                    <td className="text-right tabular-nums">{o.itemCount ?? "—"}</td>
                    <td className="text-ink-500">{o.paymentMethod ? titleCase(o.paymentMethod) : "Online"}</td>
                    <td className="text-right">
                      <Money v={o.total} currency={currency} strong />
                    </td>
                    <td>
                      <StatusBadge status={o.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <LoadMore onClick={() => load(nextCursor)} loading={loadingMore} hasMore={!!nextCursor} />
        </div>
      )}

      {/* Detail */}
      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail?.orderNumber || "Order"}
        sub={detail ? `${titleCase(detail.status || "")} · ${fdt(detail.createdAt)}` : undefined}
        wide
        footer={
          detail && detailOutstanding > 0 ? (
            <>
              <Button variant="ghost" onClick={() => setDetail(null)}>
                Close
              </Button>
              <Button icon="banknote" onClick={() => setRepayOpen(true)}>
                Record repayment
              </Button>
            </>
          ) : (
            <Button variant="ghost" onClick={() => setDetail(null)}>
              Close
            </Button>
          )
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
            {detail.lineItems.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-cream-200">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th className="text-right">Qty</th>
                      <th className="text-right">Price</th>
                      <th className="text-right">Line total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.lineItems.map((li: any) => (
                      <tr key={li.id}>
                        <td className="font-bold">
                          {li.productName}
                          {li.variantName ? ` · ${li.variantName}` : ""}
                        </td>
                        <td className="text-right tabular-nums">{rawNum(li.quantity)}</td>
                        <td className="text-right">
                          <Money v={li.unitPriceAtPurchase} currency={currency} />
                        </td>
                        <td className="text-right font-bold">
                          <Money v={li.lineTotal} currency={currency} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mb-3 text-sm text-ink-400">No line items attached to this order.</p>
            )}

            <div className="mt-4 grid gap-x-8 sm:grid-cols-2">
              <div>
                <KV label="Customer" value={custName(detail)} />
                <KV label="Phone" value={detail.customer?.phone || "—"} />
                <KV label="Source" value={titleCase(detail.source)} />
                <KV label="Branch" value={detail.branch?.name || "—"} />
                <KV label="Sold by" value={detail.soldBy?.name || "—"} />
              </div>
              <div>
                {rawNum(detail.discountAmount) > 0 && (
                  <KV label="Discount" value={<Money v={detail.discountAmount} currency={currency} />} />
                )}
                <KV
                  label="Total"
                  value={<Money v={detail.total} currency={currency} strong className="font-display text-base" />}
                />
              </div>
            </div>

            {(detail.paymentMethod || detailOutstanding > 0 || detail.amountPaid != null) && (
              <div className="mt-4 rounded-xl bg-cream-100 px-4 py-3">
                <div className="grid gap-x-8 sm:grid-cols-2">
                  {detail.paymentMethod && <KV label="Payment" value={titleCase(detail.paymentMethod)} />}
                  {detail.amountPaid != null && (
                    <KV label="Amount paid" value={<Money v={detail.amountPaid} currency={currency} />} />
                  )}
                  {detailOutstanding > 0 && (
                    <KV
                      label="Outstanding (credit)"
                      value={
                        <span className="text-gold-600">
                          <Money v={detailOutstanding} currency={currency} />
                        </span>
                      }
                    />
                  )}
                </div>
              </div>
            )}

            {detail.repayments?.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-extrabold uppercase tracking-wide text-ink-400">Repayment history</p>
                <div className="space-y-1.5">
                  {detail.repayments.map((r: any) => (
                    <div key={r.id} className="flex items-center justify-between rounded-lg bg-cream-50 px-3 py-2 text-sm">
                      <div>
                        <span className="font-bold">
                          <Money v={r.amount} currency={currency} />
                        </span>
                        {r.note && <span className="ml-2 text-ink-400">{r.note}</span>}
                      </div>
                      <div className="text-right text-xs text-ink-400">
                        {r.recordedByName && <div className="font-semibold">{r.recordedByName}</div>}
                        <div>{fdt(r.createdAt)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Repay */}
      <Modal
        open={repayOpen}
        onClose={() => setRepayOpen(false)}
        title="Record repayment"
        sub={
          <span>
            Against {detail?.orderNumber || "this credit sale"} — outstanding{" "}
            {detailOutstanding ? <Money v={detailOutstanding} currency={currency} /> : "—"}
          </span>
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setRepayOpen(false)}>
              Cancel
            </Button>
            <Button loading={repayBusy} onClick={recordRepay} icon="check">
              Save repayment
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label={`Amount (${currency})`}>
            <Input type="number" min="0" step="0.01" value={repayAmount} onChange={(e) => setRepayAmount(e.target.value)} placeholder="0.00" autoFocus />
          </Field>
          <Field label="Note">
            <Input value={repayNote} onChange={(e) => setRepayNote(e.target.value)} placeholder="e.g. paid at the counter" />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
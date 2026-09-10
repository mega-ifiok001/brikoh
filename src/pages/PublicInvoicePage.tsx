import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../lib/api";
import { fd } from "../lib/format";
import { Money, PageLoader, StatusBadge } from "../components/ui";

interface PublicInvoiceLineItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
}

interface PublicInvoiceData {
  id: string;
  number: string;
  status: "DRAFT" | "ISSUED" | "PAID" | "VOID";
  storeName: string;
  currency: string;
  customerName: string;
  total: string;
  amountPaid: string;
  balanceDue: string;
  dueDate: string | null;
  issuedAt: string | null;
  isPayable: boolean;
  bankDetails: {
    bankName: string;
    accountName: string;
    accountNumber: string;
  } | null;
  lineItems: PublicInvoiceLineItem[];
}

export default function PublicInvoicePage() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const [data, setData] = useState<PublicInvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!invoiceId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res: any = await api.publicPost(`/api/public/invoices/${invoiceId}`);
        if (!cancelled) setData(res);
      } catch (e: any) {
        if (!cancelled) {
          setError(
            e?.status === 404
              ? "This invoice link is invalid, or the invoice no longer exists."
              : e?.message || "We couldn't load this invoice right now."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [invoiceId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-50">
        <PageLoader label="Loading invoice…" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-cream-50 px-6 text-center">
        <p className="font-display text-5xl font-extrabold text-brand-500">404</p>
        <h1 className="text-xl font-bold">Invoice not found</h1>
        <p className="max-w-sm text-sm text-ink-400">{error}</p>
      </div>
    );
  }

  const isSettled = data.status === "PAID";
  const isVoid = data.status === "VOID";
  const showPaymentInstructions =
    !isSettled && !isVoid && data.isPayable && !!data.bankDetails;

  return (
    <div className="min-h-screen bg-cream-50 px-4 py-10">
      <div className="mx-auto max-w-xl">
        <div className="card p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-ink-400">
                {data.storeName}
              </p>
              <h1 className="font-display text-2xl font-extrabold">{data.number}</h1>
            </div>
            <StatusBadge status={data.status} />
          </div>

          <p className="mt-4 text-sm text-ink-500">
            Billed to <span className="font-bold text-ink-700">{data.customerName}</span>
          </p>

          <div className="mt-6 overflow-x-auto rounded-xl border border-cream-200">
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
                {data.lineItems.map((li) => (
                  <tr key={li.id}>
                    <td className="font-bold">{li.productName}</td>
                    <td className="text-right tabular-nums">{li.quantity}</td>
                    <td className="text-right">
                      <Money v={li.unitPrice} currency={data.currency} />
                    </td>
                    <td className="text-right font-bold">
                      <Money v={li.lineTotal} currency={data.currency} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex flex-col items-end gap-1 text-sm">
            <div className="flex w-full max-w-[220px] justify-between">
              <span className="text-ink-500">Total</span>
              <Money v={data.total} currency={data.currency} strong />
            </div>
            <div className="flex w-full max-w-[220px] justify-between">
              <span className="text-ink-500">Paid</span>
              <Money v={data.amountPaid} currency={data.currency} />
            </div>
            <div className="flex w-full max-w-[220px] justify-between border-t border-cream-200 pt-1">
              <span className="font-bold">Balance due</span>
              <Money v={data.balanceDue} currency={data.currency} strong />
            </div>
          </div>

          {data.dueDate && (
            <p className="mt-2 text-right text-xs text-ink-400">Due {fd(data.dueDate)}</p>
          )}

          {isVoid && (
            <p className="mt-6 rounded-xl bg-cream-100 px-4 py-3 text-sm font-semibold text-ink-400">
              This invoice has been voided.
            </p>
          )}

          {isSettled && (
            <p className="mt-6 rounded-xl bg-leaf-100 px-4 py-3 text-sm font-semibold text-leaf-700">
              This invoice has been paid in full. Thank you!
            </p>
          )}

          {showPaymentInstructions && (
            <div className="mt-6 rounded-xl border border-cream-200 bg-cream-50 px-4 py-4">
              <p className="text-xs font-bold uppercase tracking-wide text-ink-400">
                Pay by bank transfer
              </p>
              <div className="mt-2 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-ink-500">Bank</span>
                  <span className="font-bold">{data.bankDetails!.bankName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-500">Account name</span>
                  <span className="font-bold">{data.bankDetails!.accountName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-500">Account number</span>
                  <span className="font-bold tabular-nums">
                    {data.bankDetails!.accountNumber}
                  </span>
                </div>
              </div>
              <p className="mt-3 text-xs text-ink-400">
                After paying, share your receipt with {data.storeName} to confirm.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
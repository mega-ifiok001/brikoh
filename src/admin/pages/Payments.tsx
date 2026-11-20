import { Link } from "react-router-dom";
import { Button, Icon, PageHead } from "../../components/ui";
import { fdt, fm } from "../../lib/format";
import { dur, ListShell, TableWrap } from "../components/bits";
import { useAdmin } from "../AdminContext";
import { useGet } from "../lib/hooks";

interface Claim {
  orderId: string;
  orderNumber: string;
  storeId: string;
  storeName: string;
  amount: string;
  currency: string;
  paymentSubmittedAt: string | null;
  waitingSeconds: number | null;
}

export default function Payments() {
  const { p, can } = useAdmin();
  const { data, loading, error, reload } = useGet<{ items: Claim[] }>("/api/admin/payments/awaiting-confirmation");
  const items = data?.items ?? [];

  return (
    <>
      <PageHead title="Awaiting payment confirmation" sub="Bank-transfer orders waiting on the merchant, longest-waiting first.">
        <Button variant="outline" size="sm" icon="refresh" loading={loading} onClick={reload}>
          Refresh
        </Button>
      </PageHead>

      <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-cream-200 bg-white p-3 text-sm text-ink-500">
        <Icon name="info" size={16} className="mt-0.5 text-brand-500" />
        <p>
          Read-only queue. Confirming or rejecting a transfer is done by the merchant in their dashboard; there is no
          admin mutation endpoint. Rows with no claim timestamp are legacy orders and sort last.
        </p>
      </div>

      <div className="card overflow-hidden">
        <ListShell
          loading={loading}
          error={error}
          onRetry={reload}
          count={items.length}
          emptyIcon="banknote"
          emptyTitle="Queue is clear"
          emptyHint="No bank-transfer orders are waiting for confirmation."
        >
          <TableWrap>
            <thead>
              <tr>
                <th>Order</th>
                <th>Store</th>
                <th className="text-right">Amount</th>
                <th>Claim submitted</th>
                <th className="text-right">Waiting</th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => {
                const late = (c.waitingSeconds ?? 0) > 24 * 3600;
                return (
                  <tr key={c.orderId}>
                    <td className="font-mono text-[13px] font-bold">{c.orderNumber}</td>
                    <td>
                      {can("stores:view") ? (
                        <Link to={p(`/stores/${c.storeId}`)} className="font-semibold text-brand-700 hover:underline">
                          {c.storeName}
                        </Link>
                      ) : (
                        c.storeName
                      )}
                    </td>
                    <td className="text-right tabular-nums font-semibold">{fm(c.amount, c.currency)}</td>
                    <td className="whitespace-nowrap text-ink-500">
                      {c.paymentSubmittedAt ? fdt(c.paymentSubmittedAt) : <span className="text-ink-300">Legacy</span>}
                    </td>
                    <td className={`text-right tabular-nums font-bold ${late ? "text-danger-500" : "text-ink-800"}`}>
                      {dur(c.waitingSeconds)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </TableWrap>
        </ListShell>
      </div>
    </>
  );
}
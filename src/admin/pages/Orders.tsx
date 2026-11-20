import { useState } from "react";
import { Link } from "react-router-dom";
import { PageHead, SearchInput } from "../../components/ui";
import { fdt, fm, titleCase } from "../../lib/format";
import { cls } from "../../lib/format";
import { ListShell, Pager, Pill, TableWrap } from "../components/bits";
import { useAdmin } from "../AdminContext";
import { useDebounced, usePaged } from "../lib/hooks";

const STATUSES = ["PENDING", "AWAITING_PAYMENT", "PAID", "SHIPPED", "CANCELLED", "REFUNDED", "FAILED"];

interface OrderRow {
  id: string;
  orderNumber: string;
  storeId: string;
  storeName: string;
  customerName: string;
  total: number;
  currency: string;
  status: string;
  paymentMethod: string | null;
  paymentProvider: string | null;
  source: string;
  createdAt: string;
}

export default function Orders() {
  const { p, can } = useAdmin();
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const dq = useDebounced(q.trim());
  const list = usePaged<OrderRow>("/api/admin/orders", { status: status || undefined, q: dq || undefined, limit: 50 });

  return (
    <>
      <PageHead title="Orders" sub="Cross-tenant order log, newest first." />

      <div className="mb-3 max-w-md">
        <SearchInput value={q} onChange={setQ} placeholder="Search order number…" />
      </div>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {["", ...STATUSES].map((s) => (
          <button key={s || "all"} className={cls("chip", status === s && "chip-on")} onClick={() => setStatus(s)}>
            {s ? titleCase(s) : "All"}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <ListShell
          loading={list.loading}
          error={list.error}
          onRetry={list.reload}
          count={list.items.length}
          emptyIcon="receipt"
          emptyTitle="No orders match"
        >
          <TableWrap>
            <thead>
              <tr>
                <th>Order</th>
                <th>Store</th>
                <th>Customer</th>
                <th className="text-right">Total</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Source</th>
                <th>Placed</th>
              </tr>
            </thead>
            <tbody>
              {list.items.map((o) => (
                <tr key={o.id}>
                  <td className="font-mono text-[13px] font-bold">{o.orderNumber}</td>
                  <td>
                    {can("stores:view") ? (
                      <Link to={p(`/stores/${o.storeId}`)} className="font-semibold text-brand-700 hover:underline">
                        {o.storeName}
                      </Link>
                    ) : (
                      o.storeName
                    )}
                  </td>
                  <td>{o.customerName}</td>
                  <td className="text-right tabular-nums font-semibold">{fm(o.total, o.currency)}</td>
                  <td>
                    <Pill value={o.status} />
                  </td>
                  <td className="text-xs text-ink-500">
                    {o.paymentProvider || o.paymentMethod ? (
                      <>
                        {titleCase(o.paymentMethod)}
                        {o.paymentProvider && <span className="text-ink-300"> · {titleCase(o.paymentProvider)}</span>}
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="text-xs text-ink-500">{titleCase(o.source)}</td>
                  <td className="whitespace-nowrap text-ink-500">{fdt(o.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
          <Pager hasMore={list.hasMore} loading={list.loadingMore} onMore={list.loadMore} shown={list.items.length} />
        </ListShell>
      </div>
    </>
  );
}
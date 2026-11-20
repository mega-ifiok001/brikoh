import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHead, SearchInput } from "../../components/ui";
import { fd, fm } from "../../lib/format";
import { ListShell, Pager, Pill, TableWrap } from "../components/bits";
import { useAdmin } from "../AdminContext";
import { useDebounced, usePaged } from "../lib/hooks";

interface Merchant {
  id: string;
  storeName: string;
  ownerName: string;
  ownerEmail: string;
  tier: string | null;
  subscriptionStatus: string | null;
  gmvLast30d: number;
  gmvCurrency: string;
  orderCount: number;
  createdAt: string;
}

export default function Merchants() {
  const { p, can } = useAdmin();
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const dq = useDebounced(q.trim());
  const list = usePaged<Merchant>("/api/admin/merchants", { q: dq || undefined, limit: 50 });
  const canOpen = can("stores:view");

  return (
    <>
      <PageHead title="Merchants" sub="Every store with its owner and trailing-30-day GMV, newest first." />

      <div className="mb-4 max-w-md">
        <SearchInput value={q} onChange={setQ} placeholder="Search store name or owner email…" />
      </div>

      <div className="card overflow-hidden">
        <ListShell
          loading={list.loading}
          error={list.error}
          onRetry={list.reload}
          count={list.items.length}
          emptyIcon="users"
          emptyTitle="No merchants found"
          emptyHint={dq ? "Try a different name or email." : undefined}
        >
          <TableWrap>
            <thead>
              <tr>
                <th>Store</th>
                <th>Owner</th>
                <th>Plan</th>
                <th>Status</th>
                <th className="text-right">GMV (30d)</th>
                <th className="text-right">Orders</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {list.items.map((m) => (
                <tr
                  key={m.id}
                  className={canOpen ? "cursor-pointer" : ""}
                  onClick={() => canOpen && nav(p(`/stores/${m.id}`))}
                >
                  <td className="font-bold text-ink-900">{m.storeName}</td>
                  <td>
                    <div className="font-semibold text-ink-800">{m.ownerName}</div>
                    <div className="text-xs text-ink-400">{m.ownerEmail}</div>
                  </td>
                  <td>
                    <Pill value={m.tier} />
                  </td>
                  <td>
                    <Pill value={m.subscriptionStatus} />
                  </td>
                  <td className="text-right tabular-nums font-semibold">{fm(m.gmvLast30d, m.gmvCurrency)}</td>
                  <td className="text-right tabular-nums">{m.orderCount.toLocaleString("en")}</td>
                  <td className="whitespace-nowrap text-ink-500">{fd(m.createdAt)}</td>
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
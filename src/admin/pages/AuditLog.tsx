import { useState } from "react";
import { Button, Input, Modal, PageHead } from "../../components/ui";
import { fdt } from "../../lib/format";
import { ListShell, Pager, TableWrap } from "../components/bits";
import { useDebounced, usePaged } from "../lib/hooks";

interface Entry {
  id: string;
  adminUserId: string;
  adminEmail: string;
  action: string;
  storeId: string | null;
  detail: Record<string, unknown> | null;
  createdAt: string;
}

const KNOWN = [
  "admin.overview.viewed",
  "admin.merchants.viewed",
  "admin.stores.viewed",
  "admin.orders.viewed",
  "billing.pricing.updated",
  "admin.2fa.reset",
];

const toStart = (d: string) => (d ? `${d}T00:00:00.000Z` : undefined);
const toEnd = (d: string) => {
  if (!d) return undefined;
  const e = new Date(`${d}T00:00:00.000Z`);
  e.setUTCDate(e.getUTCDate() + 1);
  return e.toISOString();
};

export default function AuditLog() {
  const [action, setAction] = useState("");
  const [adminId, setAdminId] = useState("");
  const [storeId, setStoreId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [open, setOpen] = useState<Entry | null>(null);

  const dAction = useDebounced(action.trim());
  const dAdmin = useDebounced(adminId.trim());
  const dStore = useDebounced(storeId.trim());

  // The server defaults to the last 30 days when no range is sent.
  const list = usePaged<Entry>("/api/admin/audit-log", {
    action: dAction || undefined,
    adminId: dAdmin || undefined,
    storeId: dStore || undefined,
    start: toStart(from),
    end: toEnd(to),
    limit: 50,
  });

  const filtered = !!(action || adminId || storeId || from || to);

  return (
    <>
      <PageHead title="Audit log" sub="Append-only record of admin actions. Defaults to the last 30 days." />

      <div className="card mb-4 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <p className="lbl">Action</p>
          <Input list="audit-actions" value={action} onChange={(e) => setAction(e.target.value)} placeholder="exact action key" />
          <datalist id="audit-actions">
            {KNOWN.map((k) => (
              <option key={k} value={k} />
            ))}
          </datalist>
        </div>
        <div>
          <p className="lbl">Admin ID</p>
          <Input value={adminId} onChange={(e) => setAdminId(e.target.value)} placeholder="uuid" className="font-mono" />
        </div>
        <div>
          <p className="lbl">Store ID</p>
          <Input value={storeId} onChange={(e) => setStoreId(e.target.value)} placeholder="uuid" className="font-mono" />
        </div>
        <div>
          <p className="lbl">From (UTC)</p>
          <Input type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <p className="lbl">To (UTC)</p>
          <Input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} />
        </div>
        {filtered && (
          <div className="sm:col-span-2 lg:col-span-5">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setAction("");
                setAdminId("");
                setStoreId("");
                setFrom("");
                setTo("");
              }}
            >
              Clear filters
            </Button>
          </div>
        )}
      </div>

      <div className="card overflow-hidden">
        <ListShell
          loading={list.loading}
          error={list.error}
          onRetry={list.reload}
          count={list.items.length}
          emptyIcon="file"
          emptyTitle="No audit entries"
          emptyHint="Nothing matches these filters in the selected range."
        >
          <TableWrap>
            <thead>
              <tr>
                <th>When</th>
                <th>Admin</th>
                <th>Action</th>
                <th>Store</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              {list.items.map((e) => (
                <tr key={e.id} className="cursor-pointer" onClick={() => setOpen(e)}>
                  <td className="whitespace-nowrap text-ink-500">{fdt(e.createdAt)}</td>
                  <td className="font-semibold">{e.adminEmail}</td>
                  <td className="font-mono text-[12px] font-bold text-ink-800">{e.action}</td>
                  <td className="font-mono text-[11px] text-ink-400">{e.storeId ? e.storeId.slice(0, 8) + "…" : "—"}</td>
                  <td className="max-w-[260px] truncate font-mono text-[11px] text-ink-400">
                    {e.detail && Object.keys(e.detail).length ? JSON.stringify(e.detail) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
          <Pager hasMore={list.hasMore} loading={list.loadingMore} onMore={list.loadMore} shown={list.items.length} />
        </ListShell>
      </div>

      <Modal open={!!open} onClose={() => setOpen(null)} title={open?.action} sub={open ? fdt(open.createdAt) : undefined}>
        {open && (
          <div className="space-y-3 text-sm">
            <div>
              <p className="lbl">Performed by</p>
              <p className="font-semibold">{open.adminEmail}</p>
              <code className="text-xs text-ink-400">{open.adminUserId}</code>
            </div>
            {open.storeId && (
              <div>
                <p className="lbl">Store</p>
                <code className="text-xs text-ink-600">{open.storeId}</code>
              </div>
            )}
            <div>
              <p className="lbl">Detail</p>
              <pre className="scrollbar-slim max-h-72 overflow-auto rounded-xl bg-ink-900 p-3 text-xs leading-relaxed text-cream-100">
                {JSON.stringify(open.detail ?? {}, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
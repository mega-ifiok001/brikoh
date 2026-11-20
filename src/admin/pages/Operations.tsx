import { useState } from "react";
import { Link } from "react-router-dom";
import { Button, Confirm, Field, Input, PageHead, Tabs, toast } from "../../components/ui";
import { fdt } from "../../lib/format";
import { ListShell, Panel, Pill, TableWrap } from "../components/bits";
import { useAdmin } from "../AdminContext";
import { adminApi, errMsg } from "../lib/adminApi";
import { useGet } from "../lib/hooks";

const TABS = [
  { id: "ledger", label: "Ledger anomalies" },
  { id: "orphans", label: "Orphaned orders" },
  { id: "webhook", label: "Webhook replay" },
  { id: "moderation", label: "Moderation queue" },
];

export default function Operations() {
  const [tab, setTab] = useState("ledger");
  return (
    <>
      <PageHead title="Integrity & webhooks" sub="Diagnostics and recovery tools. Only the open tab is fetched." />
      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      {tab === "ledger" && <Ledger />}
      {tab === "orphans" && <Orphans />}
      {tab === "webhook" && <Replay />}
      {tab === "moderation" && <Moderation />}
    </>
  );
}

function StoreLink({ id, name }: { id: string; name: string }) {
  const { p, can } = useAdmin();
  return can("stores:view") ? (
    <Link to={p(`/stores/${id}`)} className="font-semibold text-brand-700 hover:underline">
      {name}
    </Link>
  ) : (
    <>{name}</>
  );
}

function Ledger() {
  const { data, loading, error, reload } = useGet<{ items: any[] }>("/api/admin/integrity/ledger-anomalies");
  const items = data?.items ?? [];
  return (
    <Panel
      flush
      title="Stock ledger anomalies"
      sub="NEGATIVE_STOCK: quantity below zero · LEDGER_MISMATCH: ledger sum ≠ product quantity"
      action={
        <Button size="sm" variant="outline" icon="refresh" loading={loading} onClick={reload}>
          Re-run
        </Button>
      }
    >
      <ListShell loading={loading} error={error} onRetry={reload} count={items.length} emptyIcon="check" emptyTitle="No anomalies" emptyHint="Every product's stock reconciles with its ledger.">
        <TableWrap>
          <thead>
            <tr>
              <th>Store</th>
              <th>Product</th>
              <th>Issue</th>
              <th className="text-right">Quantity</th>
              <th className="text-right">Ledger total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((a) => (
              <tr key={`${a.productId}-${a.issue}`}>
                <td>
                  <StoreLink id={a.storeId} name={a.storeName} />
                </td>
                <td className="font-semibold">{a.productName}</td>
                <td>
                  <Pill value={a.issue} />
                </td>
                <td className={`text-right tabular-nums font-bold ${a.quantity < 0 ? "text-danger-500" : ""}`}>{a.quantity}</td>
                <td className="text-right tabular-nums">{a.ledgerTotal ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </ListShell>
    </Panel>
  );
}

function Orphans() {
  const [hours, setHours] = useState("24");
  const [applied, setApplied] = useState(24);
  const { data, loading, error, reload } = useGet<{ items: any[]; windowHours: number }>(
    "/api/admin/integrity/orphaned-orders",
    { hours: applied }
  );
  const items = data?.items ?? [];
  const h = Number(hours);
  const ok = Number.isInteger(h) && h >= 1 && h <= 720;

  return (
    <Panel
      flush
      title="Orphaned orders"
      sub="PENDING orders older than the window — the payment webhook never confirmed them."
      action={
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (ok) setApplied(h);
          }}
        >
          <Input
            className="w-20"
            inputMode="numeric"
            value={hours}
            onChange={(e) => setHours(e.target.value.replace(/\D/g, ""))}
            aria-label="Window in hours"
          />
          <span className="text-xs font-semibold text-ink-400">hours</span>
          <Button type="submit" size="sm" variant="outline" disabled={!ok}>
            Apply
          </Button>
        </form>
      }
    >
      <ListShell loading={loading} error={error} onRetry={reload} count={items.length} emptyIcon="check" emptyTitle="No orphaned orders" emptyHint={`Nothing has been PENDING for more than ${applied}h.`}>
        <TableWrap>
          <thead>
            <tr>
              <th>Order</th>
              <th>Store</th>
              <th>Status</th>
              <th>Payment reference</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {items.map((o) => (
              <tr key={o.orderId}>
                <td className="font-mono text-[12px]">{String(o.orderId).slice(0, 8)}…</td>
                <td>
                  <StoreLink id={o.storeId} name={o.storeName} />
                </td>
                <td>
                  <Pill value={o.status} />
                </td>
                <td className="font-mono text-[12px] text-ink-500">{o.paymentReference ?? "—"}</td>
                <td className="whitespace-nowrap text-ink-500">{fdt(o.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </ListShell>
    </Panel>
  );
}

function Replay() {
  const [id, setId] = useState("");
  const [ask, setAsk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setResult(null);
    try {
      const r = await adminApi.post<{ outcome: string }>(`/api/admin/webhook-events/${id.trim()}/reprocess`);
      setResult(r?.outcome ?? "PROCESSED");
      toast.success("Webhook reprocessed");
      setAsk(false);
    } catch (e: any) {
      setAsk(false);
      toast.error(
        e?.status === 409
          ? "That event was already processed — replay has no business effect."
          : e?.status === 400
            ? "The stored payload no longer parses."
            : errMsg(e)
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel title="Reprocess a webhook event" sub="Only PENDING or FAILED events can be replayed. Find event ids on a store's detail page.">
      <div className="max-w-lg space-y-4">
        <Field label="Webhook event id">
          <Input value={id} onChange={(e) => setId(e.target.value)} placeholder="uuid" className="font-mono" />
        </Field>
        <Button disabled={!id.trim()} onClick={() => setAsk(true)}>
          Reprocess…
        </Button>
        {result && (
          <p className="text-sm font-semibold text-leaf-700">
            Outcome: <Pill value={result} />
          </p>
        )}
      </div>
      <Confirm
        open={ask}
        onClose={() => setAsk(false)}
        loading={busy}
        onConfirm={run}
        title="Reprocess this event?"
        confirmLabel="Reprocess"
        body="The stored payload is re-run through the order-fulfilment pipeline with its guarded transitions."
      />
    </Panel>
  );
}

function Moderation() {
  const { data, loading, error, reload } = useGet<{ queue: any[]; reviewPolicy: string }>(
    "/api/admin/moderation/flagged-content"
  );
  return (
    <Panel title="Flagged content">
      <ListShell
        loading={loading}
        error={error}
        onRetry={reload}
        count={1}
        emptyTitle=""
      >
        <div className="flex flex-col items-center gap-1 py-8 text-center">
          <p className="text-base font-bold text-ink-800">Queue is empty</p>
          <p className="max-w-md text-sm text-ink-400">
            {data?.reviewPolicy ?? "No moderation pipeline wired yet."}
          </p>
          {(data?.queue?.length ?? 0) > 0 && (
            <p className="mt-2 text-sm font-semibold text-gold-700">{data!.queue.length} items returned.</p>
          )}
        </div>
      </ListShell>
    </Panel>
  );
}
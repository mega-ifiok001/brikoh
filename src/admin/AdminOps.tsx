"use client";

import { useState } from "react";
import { useApi } from "@/api/useApi";
import { adminService } from "@/api/services";
import { SkeletonRows } from "@/components/Skeleton";
import { Refresh, AlertCircle, Key } from "@/components/icons";

const input = "w-full rounded-xl border border-ink/10 bg-white px-4 py-3 text-[15px] text-ink outline-none transition-all focus:border-brand focus:ring-4 focus:ring-brand/10";

function ErrorCard({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed border-red-200 bg-red-50/50 px-6 py-10 text-center">
      <AlertCircle className="h-7 w-7 text-red-400" />
      <p className="mt-3 text-sm font-semibold text-red-500">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-white">
          <Refresh className="h-4 w-4" /> Retry
        </button>
      )}
    </div>
  );
}

/* ========================= 2FA rotation ========================= */

export function Rotate2faCard() {
  const [secret, setSecret] = useState<{ secret: string; otpauthUrl: string; provisioningNotice: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const rotate = async () => {
    if (!confirm("Rotate your 2FA secret? The current secret is replaced immediately — you must re-add the new one to your authenticator.")) return;
    setBusy(true); setError("");
    try {
      const res = await adminService.rotate2fa();
      setSecret(res);
    } catch (e) { setError((e as Error).message); }
    setBusy(false);
  };

  return (
    <div className="rounded-3xl border border-ink/5 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-forest/10 text-forest"><Key className="h-5 w-5" /></span>
        <div className="flex-1">
          <h3 className="font-display text-base font-extrabold text-ink">Two-factor authentication</h3>
          <p className="text-xs text-muted">POST /api/admin/auth/2fa/rotate — the new secret is shown exactly once.</p>
        </div>
        <button onClick={rotate} disabled={busy} className="rounded-full bg-forest px-4 py-2 text-xs font-bold text-white disabled:opacity-60">{busy ? "Rotating…" : "Rotate secret"}</button>
      </div>
      {error && <p className="mt-3 text-xs font-medium text-red-500">{error}</p>}
      {secret && (
        <div className="mt-4 rounded-xl bg-amber-50 px-4 py-4 ring-1 ring-amber-200">
          <p className="flex items-center gap-1.5 text-xs font-bold text-amber-700"><AlertCircle className="h-3.5 w-3.5" /> {secret.provisioningNotice}</p>
          <p className="mt-2 break-all font-mono text-sm font-bold text-ink">{secret.secret}</p>
          <p className="mt-2 break-all text-[10px] text-muted">{secret.otpauthUrl}</p>
        </div>
      )}
    </div>
  );
}

/* ========================= Operations ========================= */

export function OperationsSection() {
  const anomalies = useApi(() => adminService.ledgerAnomalies());
  const orphans = useApi(() => adminService.orphanedOrders(24));
  const moderation = useApi(() => adminService.flaggedContent());
  const [eventId, setEventId] = useState("");
  const [reprocessMsg, setReprocessMsg] = useState("");
  const [reprocessErr, setReprocessErr] = useState("");
  const [busy, setBusy] = useState(false);

  const reprocess = async () => {
    setReprocessMsg(""); setReprocessErr(""); setBusy(true);
    try {
      const res = await adminService.reprocessWebhook(eventId.trim());
      setReprocessMsg(`Outcome: ${res.outcome}`);
    } catch (e) { setReprocessErr((e as Error).message); }
    setBusy(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink">Operations</h2>
        <p className="mt-1 text-sm text-muted">operations:run · webhook reprocessing & integrity diagnostics</p>
      </div>

      {/* webhook reprocess */}
      <div className="rounded-3xl border border-ink/5 bg-white p-6 shadow-sm">
        <h3 className="font-display text-base font-extrabold text-ink">Reprocess webhook event</h3>
        <p className="text-xs text-muted">POST /api/admin/webhook-events/:eventId/reprocess — only PENDING/FAILED events (processedAt null) replay.</p>
        {reprocessMsg && <p className="mt-3 rounded-xl bg-leaf/10 px-4 py-2.5 text-sm font-semibold text-forest">{reprocessMsg}</p>}
        {reprocessErr && <p className="mt-3 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-500">{reprocessErr}</p>}
        <div className="mt-3 flex gap-2">
          <input value={eventId} onChange={(e) => setEventId(e.target.value)} placeholder="Webhook event id" className={`${input} flex-1`} />
          <button onClick={reprocess} disabled={busy || !eventId.trim()} className="shrink-0 rounded-xl bg-forest px-5 text-sm font-bold text-white disabled:opacity-50">{busy ? "…" : "Reprocess"}</button>
        </div>
      </div>

      {/* ledger anomalies */}
      <div className="rounded-3xl border border-ink/5 bg-white p-6 shadow-sm">
        <h3 className="font-display text-base font-extrabold text-ink">Ledger anomalies</h3>
        <p className="text-xs text-muted">NEGATIVE_STOCK & LEDGER_MISMATCH — stock ledger reconciliation.</p>
        {anomalies.loading ? <div className="mt-4"><SkeletonRows rows={3} /></div> : anomalies.error ? <ErrorCard message={anomalies.error} onRetry={anomalies.refetch} /> : (
          <div className="mt-4 space-y-2">
            {(anomalies.data?.items ?? []).map((a) => (
              <div key={`${a.productId}-${a.issue}`} className="flex items-center gap-3 rounded-xl bg-cream px-4 py-3 text-sm">
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${a.issue === "NEGATIVE_STOCK" ? "bg-red-100 text-red-500" : "bg-sun/20 text-[#b7791f]"}`}>{a.issue}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-ink">{a.productName}</p>
                  <p className="text-xs text-muted">{a.storeName} · quantity {a.quantity}{a.ledgerTotal != null ? ` · ledger ${a.ledgerTotal}` : ""}</p>
                </div>
              </div>
            ))}
            {(anomalies.data?.items ?? []).length === 0 && <p className="py-6 text-center text-sm text-muted">No anomalies — ledger is clean. ✅</p>}
          </div>
        )}
      </div>

      {/* orphaned orders */}
      <div className="rounded-3xl border border-ink/5 bg-white p-6 shadow-sm">
        <h3 className="font-display text-base font-extrabold text-ink">Orphaned orders</h3>
        <p className="text-xs text-muted">PENDING orders older than the window (default 24h) — payment webhook never confirmed them.</p>
        {orphans.loading ? <div className="mt-4"><SkeletonRows rows={3} /></div> : orphans.error ? <ErrorCard message={orphans.error} onRetry={orphans.refetch} /> : (
          <div className="mt-4 space-y-2">
            {(orphans.data?.items ?? []).map((o) => (
              <div key={o.orderId} className="flex items-center gap-3 rounded-xl bg-cream px-4 py-3 text-sm">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-sun/20 text-xs">⏳</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-xs font-bold text-ink">{o.orderId}</p>
                  <p className="text-xs text-muted">{o.storeName} · ref {o.paymentReference ?? "—"} · {new Date(o.createdAt).toLocaleString()}</p>
                </div>
              </div>
            ))}
            {(orphans.data?.items ?? []).length === 0 && <p className="py-6 text-center text-sm text-muted">No orphaned orders (window: {orphans.data?.windowHours ?? 24}h).</p>}
          </div>
        )}
      </div>

      {/* moderation */}
      <div className="rounded-3xl border border-ink/5 bg-white p-6 shadow-sm">
        <h3 className="font-display text-base font-extrabold text-ink">Content moderation</h3>
        {moderation.loading ? <div className="mt-4"><SkeletonRows rows={2} /></div> : moderation.error ? <ErrorCard message={moderation.error} onRetry={moderation.refetch} /> : (
          <div className="mt-3 rounded-xl bg-cream px-4 py-4 text-sm text-muted">
            <p className="font-bold text-ink">Review queue: {(moderation.data?.queue ?? []).length} item(s)</p>
            <p className="mt-1 text-xs">{moderation.data?.reviewPolicy}</p>
          </div>
        )}
      </div>
    </div>
  );
}

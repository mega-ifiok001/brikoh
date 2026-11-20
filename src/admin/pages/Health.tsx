import { useMemo, useState } from "react";
import { PageHead, StatCard, Tabs } from "../../components/ui";
import { fm } from "../../lib/format";
import {
  Bars,
  defaultRange,
  ListShell,
  Panel,
  pct,
  RangePicker,
  rangeToISO,
  type DateRange,
} from "../components/bits";
import { useGet } from "../lib/hooks";

const TABS = [
  { id: "signups", label: "Signups" },
  { id: "activation", label: "Activation" },
  { id: "subscriptions", label: "Subscriptions & MRR" },
  { id: "churn", label: "Churn" },
];

export default function Health() {
  const [tab, setTab] = useState("signups");
  const [range, setRange] = useState<DateRange>(defaultRange(30));
  const iso = useMemo(() => rangeToISO(range), [range]);

  return (
    <>
      <PageHead title="Platform health" sub="Shared KPI definitions — computed once, server-side. Only the open tab is fetched." />
      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {tab !== "subscriptions" && (
        <div className="mb-4">
          <RangePicker value={range} onChange={setRange} />
        </div>
      )}

      {tab === "signups" && <Signups iso={iso} />}
      {tab === "activation" && <Activation iso={iso} />}
      {tab === "subscriptions" && <Subscriptions />}
      {tab === "churn" && <Churn iso={iso} />}
    </>
  );
}

type Iso = { start: string; end: string };

function Signups({ iso }: { iso: Iso }) {
  const [gran, setGran] = useState<"daily" | "weekly">("daily");
  const { data, loading, error, reload } = useGet<{ buckets: { start: string; end: string; count: number }[] }>(
    "/api/admin/health/signups",
    { ...iso, granularity: gran }
  );
  const buckets = data?.buckets ?? [];
  const total = buckets.reduce((n, b) => n + b.count, 0);
  const max = Math.max(1, ...buckets.map((b) => b.count));

  return (
    <Panel
      title="Store signups"
      sub={`${total.toLocaleString("en")} stores created in range`}
      action={
        <div className="flex gap-1">
          {(["daily", "weekly"] as const).map((g) => (
            <button key={g} className={`chip ${gran === g ? "chip-on" : ""}`} onClick={() => setGran(g)}>
              {g}
            </button>
          ))}
        </div>
      }
    >
      <ListShell loading={loading} error={error} onRetry={reload} count={buckets.length} emptyIcon="chart" emptyTitle="No data in range">
        <div className="flex h-44 items-end gap-[3px]">
          {buckets.map((b) => (
            <div
              key={b.start}
              className="group relative flex-1 rounded-t bg-brand-500/85 transition-colors hover:bg-brand-600"
              style={{ height: `${Math.max(b.count ? 4 : 1, (b.count / max) * 100)}%`, minWidth: 2 }}
              title={`${b.start.slice(0, 10)} — ${b.count}`}
            />
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[11px] font-semibold text-ink-400">
          <span>{buckets[0]?.start.slice(0, 10)}</span>
          <span>peak {max}</span>
          <span>{buckets[buckets.length - 1]?.start.slice(0, 10)}</span>
        </div>
      </ListShell>
    </Panel>
  );
}

function Activation({ iso }: { iso: Iso }) {
  const { data, loading, error, reload } = useGet<{
    createdStores: number;
    activatedStores: number;
    activationRate: number | null;
  }>("/api/admin/health/activation", iso);

  return (
    <ListShell loading={loading} error={error} onRetry={reload} count={data ? 1 : 0}>
      {data && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatCard label="Stores created" value={data.createdStores.toLocaleString("en")} icon="store" />
            <StatCard label="Activated" value={data.activatedStores.toLocaleString("en")} icon="check" tone="green" />
            <StatCard label="Activation rate" value={pct(data.activationRate)} icon="zap" tone="dark" />
          </div>
          <p className="rounded-xl border border-cream-200 bg-white p-3 text-sm text-ink-500">
            <b>Operational proxy:</b> a store counts as activated when it has at least one published, non-deleted
            product created within 24 hours of the store itself. This will be replaced by a true activation event
            without changing this API.
          </p>
        </div>
      )}
    </ListShell>
  );
}

function Subscriptions() {
  const { data, loading, error, reload } = useGet<{
    byStatus: { status: string; count: number }[];
    byTier: { tier: string; count: number; monthlyPrice: number | null }[];
    metrics: { activeSubscriptions: number; mrr: number };
  }>("/api/admin/health/subscriptions");

  return (
    <ListShell loading={loading} error={error} onRetry={reload} count={data ? 1 : 0}>
      {data && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="MRR" value={fm(data.metrics.mrr, "NGN")} sub="Active subscriptions × current plan price" icon="banknote" tone="green" />
            <StatCard label="Active subscriptions" value={data.metrics.activeSubscriptions.toLocaleString("en")} icon="shield" tone="dark" />
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            <Panel title="By status">
              <Bars items={data.byStatus.map((s) => ({ label: s.status.replace(/_/g, " "), value: s.count }))} />
            </Panel>
            <Panel title="By tier">
              <Bars
                items={data.byTier.map((t) => ({
                  label: t.tier,
                  value: t.count,
                  sub: t.monthlyPrice === null ? "free" : `${fm(t.monthlyPrice, "NGN")}/mo`,
                }))}
              />
            </Panel>
          </div>
        </div>
      )}
    </ListShell>
  );
}

function Churn({ iso }: { iso: Iso }) {
  const { data, loading, error, reload } = useGet<{
    activeAtPeriodStart: number;
    churned: number;
    churnRate: number | null;
  }>("/api/admin/health/churn", iso);

  return (
    <ListShell loading={loading} error={error} onRetry={reload} count={data ? 1 : 0}>
      {data && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatCard label="Active at period start" value={data.activeAtPeriodStart.toLocaleString("en")} icon="users" />
            <StatCard label="Churned" value={data.churned.toLocaleString("en")} icon="logout" tone="danger" />
            <StatCard label="Churn rate" value={pct(data.churnRate)} icon="chart" tone="dark" />
          </div>
          <p className="rounded-xl border border-cream-200 bg-white p-3 text-sm text-ink-500">
            <b>Definition:</b> stores whose subscription went from ACTIVE to a non-active state during the period, divided
            by stores ACTIVE at the <i>start</i> of the period. Subscriptions created during the period are excluded
            from the denominator.
          </p>
        </div>
      )}
    </ListShell>
  );
}
import { useMemo, useState } from "react";
import { Icon, PageHead, StatCard } from "../../components/ui";
import { defaultRange, dur, ListShell, Panel, pct, RangePicker, rangeToISO, type DateRange } from "../components/bits";
import { useGet } from "../lib/hooks";

const STEP_LABELS: Record<string, string> = {
  registered: "Registered",
  firstProductPublished: "First product published",
  firstOrderPlaced: "First order placed",
  firstOrderPaid: "First order paid",
  upgradedToPaidTier: "Upgraded to a paid tier",
};

interface Step {
  key: string;
  count: number;
  conversionFromPrevious: number | null;
}

export default function Telemetry() {
  const [range, setRange] = useState<DateRange>(defaultRange(30));
  const iso = useMemo(() => rangeToISO(range), [range]);

  const funnel = useGet<{ steps: Step[] }>("/api/admin/telemetry/funnel", iso);
  const median = useGet<{ cohortStoreCount: number; storesWithFirstOrder: number; medianSeconds: number | null }>(
    "/api/admin/telemetry/median-time-to-first-order",
    iso
  );

  const steps = funnel.data?.steps ?? [];
  const top = Math.max(1, steps[0]?.count ?? 0);

  return (
    <>
      <PageHead title="Funnel & telemetry" sub="Cohort = stores registered inside the selected UTC range (start inclusive, end exclusive)." />
      <div className="mb-4">
        <RangePicker value={range} onChange={setRange} />
      </div>

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          label="Median time to first order"
          value={median.loading ? "…" : dur(median.data?.medianSeconds)}
          sub={median.error || "Registration → first order, any status"}
          icon="clock"
          tone="dark"
        />
        <StatCard label="Cohort stores" value={median.data ? median.data.cohortStoreCount.toLocaleString("en") : "…"} icon="store" />
        <StatCard
          label="Stores with an order"
          value={median.data ? median.data.storesWithFirstOrder.toLocaleString("en") : "…"}
          icon="receipt"
          tone="green"
        />
      </div>

      <Panel title="Lifecycle funnel" sub="Each step shows its count and conversion from the previous step.">
        <ListShell
          loading={funnel.loading}
          error={funnel.error}
          onRetry={funnel.reload}
          count={steps.length}
          emptyIcon="chart"
          emptyTitle="No stores registered in this range"
        >
          <div className="space-y-4">
            {steps.map((s, i) => (
              <div key={s.key}>
                <div className="mb-1.5 flex items-baseline justify-between gap-3">
                  <span className="text-sm font-bold text-ink-800">
                    <span className="mr-2 text-ink-300">{i + 1}</span>
                    {STEP_LABELS[s.key] ?? s.key}
                  </span>
                  <span className="flex items-baseline gap-3 tabular-nums">
                    <span className="font-display text-lg font-extrabold">{s.count.toLocaleString("en")}</span>
                    <span className="w-14 text-right text-xs font-bold text-ink-400">
                      {i === 0 ? "" : pct(s.conversionFromPrevious)}
                    </span>
                  </span>
                </div>
                <div className="h-6 overflow-hidden rounded-lg bg-cream-100">
                  <div
                    className="h-full rounded-lg bg-brand-500 transition-all"
                    style={{ width: `${Math.max(s.count ? 1.5 : 0, (s.count / top) * 100)}%`, opacity: 1 - i * 0.12 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </ListShell>
      </Panel>

      <p className="mt-4 flex items-start gap-2 text-xs text-ink-400">
        <Icon name="info" size={14} className="mt-0.5 shrink-0" />
        "First product published" is approximated from the earliest <code>updatedAt</code> of a published product — status
        history isn't stored. "First order paid" is exact only for payments recorded after the <code>paidAt</code> migration.
      </p>
    </>
  );
}
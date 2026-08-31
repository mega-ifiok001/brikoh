import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { cls, fd, rawNum, titleCase } from "../lib/format";
import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  Icon,
  Money,
  PageHead,
  PageLoader,
  StatCard,
  Tabs,
} from "../components/ui";

// ── Date-range presets ──────────────────────────────────────────────────
// The contract requires `start`/`end` as UTC ISO-8601 with an explicit
// offset and a half-open range (`end` exclusive), max 366 days. We turn
// a friendly preset into that shape client-side rather than exposing raw
// timestamps in the UI.
const RANGES = [
  { key: "7d", label: "Last 7 days", days: 7 },
  { key: "30d", label: "Last 30 days", days: 30 },
  { key: "90d", label: "Last 90 days", days: 90 },
  { key: "365d", label: "Last 12 months", days: 365 },
] as const;
type RangeKey = (typeof RANGES)[number]["key"];

function rangeFor(key: RangeKey): { start: string; end: string } {
  const days = RANGES.find((r) => r.key === key)?.days ?? 30;
  const now = new Date();
  // `end` is exclusive — use the UTC midnight *after* today so today's
  // orders are still included in the window.
  const endUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
  const startUtc = endUtc - days * 86_400_000;
  return { start: new Date(startUtc).toISOString(), end: new Date(endUtc).toISOString() };
}

type Granularity = "daily" | "weekly";
type TabKey = "overview" | "trends" | "staff" | "channels";

// A 403 from the advanced endpoints just means "not on this plan" — it's
// an upsell state, not a real error, so it never triggers the page-level
// ErrorState. Any other failure (network, 500, permissions) still does.
const LOCK_CODES = new Set(["SUBSCRIPTION_INACTIVE", "ADVANCED_ANALYTICS_REQUIRED"]);

interface Locked {
  locked: true;
  code: string;
  message: string;
}
function isLocked(x: any): x is Locked {
  return !!x && x.locked === true;
}

async function getAdvanced(path: string): Promise<any | Locked> {
  try {
    return await api.get(path);
  } catch (e: any) {
    if (LOCK_CODES.has(e?.code)) {
      return { locked: true, code: e.code, message: e.message };
    }
    throw e;
  }
}

export default function Analytics() {
  const { me } = useAuth();
  const currency: string = (me.store as any)?.currency || "NGN";

  // For the tier badge only — which advanced endpoints actually respond is
  // still decided purely by the 403 codes from getAdvanced() below, same as
  // the rest of this app. This duplicates the same GET Layout.tsx's
  // SidebarContent already makes; kept as two independent fetches rather
  // than sharing a hook, so this page has no cross-file dependency.
  const [planTier, setPlanTier] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    api
      .get("/api/dashboard/subscriptions/usage")
      .then((res: any) => {
        if (!cancelled) setPlanTier(res?.plan?.tier ?? null);
      })
      .catch(() => {
        /* badge just won't show — not worth surfacing as a page error */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const [rangeKey, setRangeKey] = useState<RangeKey>("30d");
  const [granularity, setGranularity] = useState<Granularity>("daily");
  const [tab, setTab] = useState<TabKey>("overview");

  const { start, end } = useMemo(() => rangeFor(rangeKey), [rangeKey]);
  const qs = `start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`;

  const [summary, setSummary] = useState<any>(null);
  const [timeseries, setTimeseries] = useState<any>(null);
  const [trends, setTrends] = useState<any | Locked | null>(null);
  const [staff, setStaff] = useState<any | Locked | null>(null);
  const [channels, setChannels] = useState<any | Locked | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryRes, tsRes, trendsRes, staffRes, channelsRes] = await Promise.all([
        api.get(`/api/dashboard/analytics/summary?${qs}&top=5`),
        api.get(`/api/dashboard/analytics/timeseries?${qs}&granularity=${granularity}`),
        getAdvanced(`/api/dashboard/analytics/trends?${qs}&granularity=${granularity}`),
        getAdvanced(`/api/dashboard/analytics/staff-performance?${qs}`),
        getAdvanced(`/api/dashboard/analytics/channels?${qs}`),
      ]);
      setSummary(summaryRes);
      setTimeseries(tsRes);
      setTrends(trendsRes);
      setStaff(staffRes);
      setChannels(channelsRes);
    } catch (e: any) {
      if (e?.status === 403 && e?.code === "INSUFFICIENT_PERMISSIONS") {
        setError(
          "You need the “manage analytics” permission to see this. Ask an owner to grant it."
        );
      } else {
        setError(e?.message || "Couldn't load analytics.");
      }
      setSummary(null);
      setTimeseries(null);
      setTrends(null);
      setStaff(null);
      setChannels(null);
    } finally {
      setLoading(false);
    }
  }, [qs, granularity]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <PageLoader label="Crunching the numbers…" />;

  if (error) {
    return (
      <div>
        <PageHead title="Analytics" sub="Sales performance, trends and channels." />
        <div className="card">
          <ErrorState message={error} onRetry={load} />
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div>
        <PageHead title="Analytics" sub="Sales performance, trends and channels." />
        <div className="card">
          <EmptyState
            icon="chart"
            title="Nothing to analyze yet"
            hint="Once you record a sale, your analytics come alive here."
          />
        </div>
      </div>
    );
  }

  const totalSales = rawNum(summary.totalSales);
  const orderCount: number = summary.orderCount ?? 0;
  const avgOrderValue = orderCount > 0 ? totalSales / orderCount : 0;
  const bestSellers: any[] = summary.bestSellers || [];
  const buckets: any[] = timeseries?.buckets || [];

  return (
    <div>
      <PageHead title="Analytics" sub={`${fd(start)} → ${fd(end)}`}>
        <div className="flex flex-wrap items-center gap-1.5">
          {planTier && <Badge tone="brand">{titleCase(planTier)}</Badge>}
          {RANGES.map((r) => (
            <button
              key={r.key}
              type="button"
              className={cls("chip", rangeKey === r.key && "chip-on")}
              onClick={() => setRangeKey(r.key)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </PageHead>

      <Tabs
        tabs={[
          { id: "overview", label: "Overview" },
          { id: "trends", label: "Trends" },
          { id: "staff", label: "Staff performance" },
          { id: "channels", label: "Channels" },
        ]}
        active={tab}
        onChange={(id) => setTab(id as TabKey)}
      />

      {tab === "overview" && (
        <OverviewTab
          currency={currency}
          totalSales={totalSales}
          orderCount={orderCount}
          avgOrderValue={avgOrderValue}
          bestSellers={bestSellers}
          buckets={buckets}
          granularity={granularity}
          onGranularity={setGranularity}
        />
      )}
      {tab === "trends" && <TrendsTab data={trends} currency={currency} />}
      {tab === "staff" && <StaffTab data={staff} currency={currency} />}
      {tab === "channels" && <ChannelsTab data={channels} currency={currency} />}
    </div>
  );
}

/* ------------------------------- Shared bits ------------------------------ */

function UpsellCard({ message }: { message?: string }) {
  return (
    <div className="card anim-rise p-8 text-center">
      <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
        <Icon name="sparkle" size={22} />
      </span>
      <h3 className="font-display text-base font-extrabold">
        Advanced analytics is a Pro feature
      </h3>
      <p className="mx-auto mt-1.5 max-w-sm text-sm text-ink-400">
        {message ||
          "Upgrade to Pro or Enterprise to unlock trends, staff performance and channel breakdowns."}
      </p>
      <Button
        className="mt-4"
        icon="sparkle"
        onClick={() => {
          location.hash = "#/dashboard/settings";
        }}
      >
        View plans
      </Button>
    </div>
  );
}

function BucketChart({
  buckets,
  currency,
}: {
  buckets: Array<{ start: string; totalSales: any; orderCount: number }>;
  currency: string;
}) {
  if (buckets.length === 0) {
    return <p className="mt-6 text-sm font-semibold text-ink-400">No data in this range.</p>;
  }
  const max = Math.max(1, ...buckets.map((b) => rawNum(b.totalSales)));
  return (
    <div className="mt-4 flex items-end gap-1.5 overflow-x-auto pb-1 scrollbar-slim">
      {buckets.map((b) => {
        const v = rawNum(b.totalSales);
        const pct = Math.max(2, (v / max) * 100);
        return (
          <div
            key={b.start}
            className="group relative flex w-8 shrink-0 flex-col items-center justify-end"
            style={{ height: 140 }}
            title={`${fd(b.start)} · ${b.orderCount} order${b.orderCount === 1 ? "" : "s"}`}
          >
            <div className="pointer-events-none absolute -top-8 hidden whitespace-nowrap rounded-md bg-ink-900 px-2 py-1 text-[10px] font-bold text-cream-50 group-hover:block">
              <Money v={b.totalSales} currency={currency} />
            </div>
            <div
              className="w-4 rounded-t-full bg-brand-500/80 transition-colors group-hover:bg-brand-500"
              style={{ height: `${pct}%` }}
            />
            <span className="mt-1.5 text-[9px] font-bold text-ink-300">
              {new Date(b.start).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* -------------------------------- Overview -------------------------------- */

function OverviewTab({
  currency,
  totalSales,
  orderCount,
  avgOrderValue,
  bestSellers,
  buckets,
  granularity,
  onGranularity,
}: {
  currency: string;
  totalSales: number;
  orderCount: number;
  avgOrderValue: number;
  bestSellers: any[];
  buckets: any[];
  granularity: Granularity;
  onGranularity: (g: Granularity) => void;
}) {
  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Total sales"
          value={<Money v={totalSales} currency={currency} />}
          icon="banknote"
          tone="green"
          sub="PAID + SHIPPED orders"
        />
        <StatCard label="Orders" value={orderCount} icon="receipt" tone="brand" />
        <StatCard
          label="Avg. order value"
          value={<Money v={avgOrderValue} currency={currency} />}
          icon="chart"
          tone="gold"
        />
      </div>

      <div className="card anim-rise mt-5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-display text-base font-extrabold">Sales over time</h3>
          <div className="flex gap-1.5">
            {(["daily", "weekly"] as Granularity[]).map((g) => (
              <button
                key={g}
                type="button"
                className={cls("chip", granularity === g && "chip-on")}
                onClick={() => onGranularity(g)}
              >
                {titleCase(g)}
              </button>
            ))}
          </div>
        </div>
        <BucketChart buckets={buckets} currency={currency} />
      </div>

      <div className="card anim-rise mt-5 p-5">
        <h3 className="font-display text-base font-extrabold">Best sellers</h3>
        {bestSellers.length === 0 ? (
          <p className="mt-4 text-sm font-semibold text-ink-400">No sales in this range yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto scrollbar-slim">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Product</th>
                  <th className="text-right">Units sold</th>
                  <th className="text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {bestSellers.map((p: any) => (
                  <tr key={p.productId}>
                    <td className="font-bold">{p.name}</td>
                    <td className="text-right tabular-nums">{p.units}</td>
                    <td className="text-right font-bold">
                      <Money v={p.revenue} currency={currency} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* --------------------------------- Trends ---------------------------------- */

function TrendsTab({ data, currency }: { data: any | Locked | null; currency: string }) {
  if (isLocked(data)) return <UpsellCard message={data.message} />;
  if (!data) return <EmptyState icon="chart" title="No trend data" />;

  const current = rawNum(data.totals?.totalSales);
  const previous = rawNum(data.previousPeriod?.totalSales);
  const change = data.changePercent;
  const up = typeof change === "number" && change >= 0;

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="This period"
          value={<Money v={current} currency={currency} />}
          icon="banknote"
          tone="green"
          sub={`${data.totals?.orderCount ?? 0} orders`}
        />
        <StatCard
          label="Previous period"
          value={<Money v={previous} currency={currency} />}
          icon="clock"
          tone="neutral"
          sub={`${fd(data.previousPeriod?.start)} → ${fd(data.previousPeriod?.end)}`}
        />
        <div className="card anim-rise p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400">
            Change
          </p>
          <p
            className={cls(
              "mt-1.5 font-display text-2xl font-extrabold tabular-nums",
              change == null ? "text-ink-400" : up ? "text-leaf-600" : "text-danger-500"
            )}
          >
            {change == null ? "—" : `${up ? "+" : ""}${change.toFixed(1)}%`}
          </p>
          <p className="mt-0.5 text-xs text-ink-400">vs. previous period</p>
        </div>
      </div>

      <div className="card anim-rise mt-5 p-5">
        <h3 className="font-display text-base font-extrabold">Trend</h3>
        <BucketChart buckets={data.buckets || []} currency={currency} />
      </div>
    </div>
  );
}

/* ------------------------------ Staff performance -------------------------- */

function StaffTab({ data, currency }: { data: any | Locked | null; currency: string }) {
  if (isLocked(data)) return <UpsellCard message={data.message} />;
  if (!data) return <EmptyState icon="users" title="No staff data" />;

  const staff: any[] = data.staff || [];

  return (
    <div className="card anim-rise p-5">
      <h3 className="font-display text-base font-extrabold">Staff performance</h3>
      {staff.length === 0 ? (
        <p className="mt-4 text-sm font-semibold text-ink-400">
          No sales or inventory activity attributed to staff in this range.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto scrollbar-slim">
          <table className="tbl">
            <thead>
              <tr>
                <th>Staff member</th>
                <th className="text-right">Orders</th>
                <th className="text-right">Revenue</th>
                <th className="text-right">Stock entries</th>
                <th className="text-right">Units adjusted</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((s: any) => (
                <tr key={s.staffMemberId}>
                  <td className="font-bold">{s.name}</td>
                  <td className="text-right tabular-nums">{s.sales?.orderCount ?? 0}</td>
                  <td className="text-right font-bold">
                    <Money v={s.sales?.revenue ?? 0} currency={currency} />
                  </td>
                  <td className="text-right tabular-nums">
                    {s.inventoryActivity?.entries ?? 0}
                  </td>
                  <td className="text-right tabular-nums">
                    {(s.inventoryActivity?.unitsAdjusted ?? 0) > 0 ? "+" : ""}
                    {s.inventoryActivity?.unitsAdjusted ?? 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------- Channels -------------------------------- */

function ChannelsTab({ data, currency }: { data: any | Locked | null; currency: string }) {
  if (isLocked(data)) return <UpsellCard message={data.message} />;
  if (!data) return <EmptyState icon="store" title="No channel data" />;

  const channels: any[] = data.channels || [];
  const max = Math.max(1, ...channels.map((c: any) => rawNum(c.revenue)));

  return (
    <div className="card anim-rise p-5">
      <h3 className="font-display text-base font-extrabold">Revenue by channel</h3>
      <div className="mt-4 space-y-3">
        {channels.map((c: any) => (
          <div key={c.source} className="flex items-center gap-3">
            <span className="w-28 shrink-0 text-xs font-extrabold text-ink-500">
              {titleCase(c.source)}
              <span className="ml-1 font-normal text-ink-300">×{c.orderCount}</span>
            </span>
            <div className="h-3 flex-1 overflow-hidden rounded-full bg-cream-100">
              <div
                className="h-full rounded-full bg-ink-700"
                style={{ width: `${Math.max(c.orderCount > 0 ? 4 : 0, (rawNum(c.revenue) / max) * 100)}%` }}
              />
            </div>
            <span className="w-28 shrink-0 text-right text-xs font-extrabold tabular-nums">
              <Money v={c.revenue} currency={currency} />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
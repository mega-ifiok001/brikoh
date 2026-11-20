import { Button, PageHead, StatCard } from "../../components/ui";
import { fm } from "../../lib/format";
import { Bars, ListShell, Panel } from "../components/bits";
import { useGet } from "../lib/hooks";

interface OverviewRes {
  totalStores: number;
  subscriptionsByStatus: Record<string, number>;
  orderCountsByStatus: Record<string, number>;
  revenueByCurrency: { currency: string; total: number }[];
  mrr: number;
  mrrCurrency: string;
}

const label = (s: string) => s.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());

export default function Overview() {
  const { data, loading, error, reload } = useGet<OverviewRes>("/api/admin/overview");

  const subs = Object.entries(data?.subscriptionsByStatus ?? {});
  const orders = Object.entries(data?.orderCountsByStatus ?? {});
  const totalOrders = orders.reduce((n, [, v]) => n + v, 0);

  return (
    <>
      <PageHead title="Platform overview" sub="Live across all tenants. Each refresh is written to the audit log.">
        <Button variant="outline" size="sm" icon="refresh" loading={loading} onClick={reload}>
          Refresh
        </Button>
      </PageHead>

      <ListShell loading={loading} error={error} onRetry={reload} count={data ? 1 : 0}>
        {data && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard label="Stores" value={data.totalStores.toLocaleString("en")} icon="store" />
              <StatCard
                label="MRR"
                value={fm(data.mrr, data.mrrCurrency)}
                sub={`${data.mrrCurrency} · active subscriptions only`}
                icon="banknote"
                tone="green"
              />
              <StatCard
                label="Active subscriptions"
                value={(data.subscriptionsByStatus.ACTIVE ?? 0).toLocaleString("en")}
                sub={`${data.subscriptionsByStatus.TRIALING ?? 0} trialing`}
                icon="shield"
                tone="dark"
              />
              <StatCard label="Orders (all time)" value={totalOrders.toLocaleString("en")} icon="receipt" tone="gold" />
            </div>

            <Panel
              title="Paid revenue by currency"
              sub="Sum of PAID order totals, grouped by store currency. Never blended — no FX conversion."
            >
              {data.revenueByCurrency.length === 0 ? (
                <p className="text-sm text-ink-400">No paid orders yet.</p>
              ) : (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {data.revenueByCurrency.map((r) => (
                    <div key={r.currency} className="rounded-xl border border-cream-200 bg-cream-50 p-3.5">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400">{r.currency}</p>
                      <p className="mt-1 truncate font-display text-xl font-extrabold tabular-nums">
                        {fm(r.total, r.currency)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Panel>

            <div className="grid gap-5 lg:grid-cols-2">
              <Panel title="Subscriptions by status">
                <Bars items={subs.map(([k, v]) => ({ label: label(k), value: v }))} />
              </Panel>
              <Panel title="Orders by status">
                <Bars items={orders.map(([k, v]) => ({ label: label(k), value: v }))} />
              </Panel>
            </div>
          </div>
        )}
      </ListShell>
    </>
  );
}
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { cls, fd, rawNum, titleCase } from "../lib/format";
import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  Money,
  PageHead,
  PageLoader,
  StatCard,
  toast,
} from "../components/ui";

const PERIODS = [
  { key: "week", label: "This week" },
  { key: "month", label: "This month" },
  { key: "quarter", label: "This quarter" },
  { key: "year", label: "This year" },
] as const;

type PeriodKey = (typeof PERIODS)[number]["key"];

export default function Reports() {
  const { me } = useAuth();
  const currency: string = (me.store as any)?.currency || "NGN";

  const [period, setPeriod] = useState<PeriodKey>("week");
  const [pnl, setPnl] = useState<any>(null);
  const [byCategory, setByCategory] = useState<any[]>([]);
  const [grandTotal, setGrandTotal] = useState<string>("0.00");
  const [inventory, setInventory] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = `period=${period}`;

      const [pnlRes, expRes, invRes] = await Promise.all([
        api.get(`/api/dashboard/reports/pnl?${qs}`),
        api.get(`/api/dashboard/reports/expenses-by-category?${qs}`),
        api.get(`/api/dashboard/reports/inventory-valuation`).catch(() => null),
      ]);

      setPnl(pnlRes);
      setByCategory(
        Array.isArray(expRes?.categories) ? expRes.categories : []
      );
      setGrandTotal(expRes?.grandTotal ?? "0.00");
      setInventory(invRes);
    } catch (e: any) {
      if (e?.status === 403 || e?.code === "INSUFFICIENT_PERMISSIONS") {
        setError(
          "You need the “view profit” permission to see these reports. Ask an owner to grant it."
        );
      } else {
        setError(e?.message || "Couldn't load reports.");
      }
      setPnl(null);
      setByCategory([]);
      setInventory(null);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    load();
  }, [load]);

  const downloadCsv = async (
    path: string,
    fallbackName: string
  ) => {
    try {
      const token =
        localStorage.getItem("token") ||
        sessionStorage.getItem("token") ||
        "";
      const res = await fetch(
        `${(api as any).baseUrl || ""}${path}?period=${period}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fallbackName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      toast.error(e?.message || "Couldn't download the CSV.");
    }
  };

  if (loading) return <PageLoader label="Crunching the numbers…" />;

  if (error) {
    return (
      <div>
        <PageHead title="Reports" sub="Profit & loss and inventory valuation." />
        <div className="card">
          <ErrorState message={error} onRetry={load} />
        </div>
      </div>
    );
  }

  if (!pnl) {
    return (
      <div>
        <PageHead title="Reports" sub="Profit & loss and inventory valuation." />
        <div className="card">
          <EmptyState
            icon="chart"
            title="Nothing to report yet"
            hint="Once you make a sale and record an expense, your P&L comes alive here."
          />
        </div>
      </div>
    );
  }

  const revenue = rawNum(pnl.revenue);
  const cogs = rawNum(pnl.cogs);
  const expenses = rawNum(pnl.expenses);
  const netProfit = rawNum(pnl.netProfit);
  const unpriced = pnl.cogsUnpricedLineItems ?? 0;
  const periodLabel =
    PERIODS.find((p) => p.key === period)?.label || period;
  const rangeLabel = pnl.period
    ? `${fd(pnl.period.start)} → ${fd(pnl.period.end)}`
    : "";

  const maxCat = Math.max(
    1,
    ...byCategory.map((c: any) => rawNum(c.total))
  );

  return (
    <div>
      <PageHead
        title="Reports"
        sub={`Profit & loss · ${periodLabel}${rangeLabel ? ` · ${rangeLabel}` : ""}`}
      >
        <div className="flex flex-wrap gap-1.5">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              type="button"
              className={cls("chip", period === p.key && "chip-on")}
              onClick={() => setPeriod(p.key)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </PageHead>

      {/* Unpriced cost warning */}
      {unpriced > 0 && (
        <div className="anim-rise mb-4 rounded-xl border border-gold-200 bg-gold-100 px-4 py-3 text-sm font-semibold text-gold-800">
          <strong>{unpriced}</strong> item{unpriced === 1 ? "" : "s"} sold this
          period {unpriced === 1 ? "has" : "have"} no recorded cost price —
          profit may be <strong>overstated</strong>. Set cost prices on your
          products to fix this.
        </div>
      )}

      {/* P&L cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Revenue"
          value={<Money v={revenue} currency={currency} />}
          icon="banknote"
          tone="green"
          sub="PAID + SHIPPED orders"
        />
        <StatCard
          label="Cost of goods"
          value={<Money v={cogs} currency={currency} />}
          icon="package"
          tone="neutral"
          sub={unpriced > 0 ? `${unpriced} unpriced` : "At cost price"}
        />
        <StatCard
          label="Expenses"
          value={<Money v={expenses} currency={currency} />}
          icon="banknote"
          tone="gold"
          sub={`${byCategory.length} categor${byCategory.length === 1 ? "y" : "ies"}`}
        />
        <div
          className={cls(
            "card anim-rise p-4",
            netProfit < 0 && "!border-danger-100"
          )}
        >
          <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400">
            Net profit
          </p>
          <p
            className={cls(
              "mt-1.5 font-display text-2xl font-extrabold tabular-nums",
              netProfit < 0 && "text-danger-500"
            )}
          >
            <Money v={netProfit} currency={currency} />
          </p>
          <p className="mt-0.5 text-xs text-ink-400">
            {revenue > 0
              ? `${((netProfit / revenue) * 100).toFixed(1)}% margin`
              : "No revenue yet"}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          icon="download"
          onClick={() =>
            downloadCsv(
              "/api/dashboard/reports/pnl/export.csv",
              `pnl-${period}.csv`
            )
          }
        >
          Export P&L CSV
        </Button>
        <Button
          variant="outline"
          size="sm"
          icon="download"
          onClick={() =>
            downloadCsv(
              "/api/dashboard/reports/expenses-by-category/export.csv",
              `expenses-${period}.csv`
            )
          }
        >
          Export expenses CSV
        </Button>
      </div>

      {/* Expenses by category */}
      <div className="card anim-rise mt-5 p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-base font-extrabold">
              Expenses by category
            </h3>
            <p className="text-xs text-ink-400">
              Total{" "}
              <Money v={grandTotal} currency={currency} strong />
            </p>
          </div>
        </div>

        {byCategory.length === 0 ? (
          <p className="mt-6 text-sm font-semibold text-ink-400">
            No expenses recorded in this period.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {byCategory.map((c: any) => (
              <div key={c.category} className="flex items-center gap-3">
                <span className="w-28 shrink-0 text-xs font-extrabold text-ink-500">
                  {titleCase(c.category)}
                  <span className="ml-1 font-normal text-ink-300">
                    ×{c.count}
                  </span>
                </span>
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-cream-100">
                  <div
                    className="h-full rounded-full bg-ink-700"
                    style={{
                      width: `${Math.max(
                        4,
                        (rawNum(c.total) / maxCat) * 100
                      )}%`,
                    }}
                  />
                </div>
                <span className="w-28 shrink-0 text-right text-xs font-extrabold tabular-nums">
                  <Money v={c.total} currency={currency} />
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Inventory valuation */}
      {inventory && (
        <div className="card anim-rise mt-5 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cream-200 px-5 py-3.5">
            <div>
              <h3 className="font-display text-base font-extrabold">
                Inventory valuation
              </h3>
              <p className="text-xs text-ink-400">
                Snapshot · {fd(inventory.generatedAt)}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span>
                At cost:{" "}
                <strong>
                  <Money
                    v={inventory.totals?.atCost}
                    currency={currency}
                  />
                </strong>
              </span>
              <span>
                At retail:{" "}
                <strong>
                  <Money
                    v={inventory.totals?.atRetail}
                    currency={currency}
                  />
                </strong>
              </span>
              {inventory.unpricedProducts > 0 && (
                <Badge tone="gold">
                  {inventory.unpricedProducts} without cost
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                icon="download"
                onClick={() =>
                  downloadCsv(
                    "/api/dashboard/reports/inventory-valuation/export.csv",
                    "inventory-valuation.csv"
                  )
                }
              >
                CSV
              </Button>
            </div>
          </div>

          {Array.isArray(inventory.items) && inventory.items.length > 0 ? (
            <div className="overflow-x-auto scrollbar-slim">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th className="text-right">Qty</th>
                    <th className="text-right">Cost</th>
                    <th className="text-right">Retail</th>
                    <th className="text-right">Value @ cost</th>
                    <th className="text-right">Value @ retail</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.items.slice(0, 50).map((item: any) => (
                    <tr key={item.productId}>
                      <td className="font-bold">{item.name}</td>
                      <td className="font-mono text-xs text-ink-400">
                        {item.sku || "—"}
                      </td>
                      <td className="text-right tabular-nums">
                        {item.quantity}
                      </td>
                      <td className="text-right">
                        {item.costPrice != null ? (
                          <Money v={item.costPrice} currency={currency} />
                        ) : (
                          <span className="text-gold-600">—</span>
                        )}
                      </td>
                      <td className="text-right">
                        <Money v={item.price} currency={currency} />
                      </td>
                      <td className="text-right">
                        <Money v={item.valueAtCost} currency={currency} />
                      </td>
                      <td className="text-right font-bold">
                        <Money v={item.valueAtRetail} currency={currency} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {inventory.items.length > 50 && (
                <p className="px-5 py-2 text-xs text-ink-400">
                  Showing first 50 of {inventory.items.length} products.
                  Download the CSV for the full list.
                </p>
              )}
            </div>
          ) : (
            <p className="px-5 py-8 text-center text-sm font-semibold text-ink-400">
              No products in stock yet.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
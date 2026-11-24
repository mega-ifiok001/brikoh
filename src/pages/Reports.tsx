import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api, API_BASE, getAccessToken } from "../lib/api";
import { asList, cls, fd, pick, rawNum, titleCase, toISODate } from "../lib/format";
import DatePicker from "../components/DatePicker";
import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  Money,
  PageHead,
  PageLoader,
  Spinner,
  StatCard,
  toast,
} from "../components/ui";

function dateQuery(date: string): string {
  // These are calendar dates. Leave timezone-boundary interpretation to the API
  // so a browser's UTC offset cannot shift a transaction onto another day.
  return new URLSearchParams({ date }).toString();
}

function displayDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  return new Date(year, month - 1, day).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function ReportDateField({ date, setDate }: { date: string; setDate: (value: string) => void }) {
  return <div data-tour-id="reports-period"><DatePicker label="Report date" value={date} onChange={setDate} /></div>;
}

export default function Reports() {
  const { me } = useAuth();
  const currency: string = (me.store as any)?.currency || "NGN";

  const [date, setDate] = useState(() => toISODate(new Date()));
  const [pnl, setPnl] = useState<any>(null);
  const [byCategory, setByCategory] = useState<any[]>([]);
  const [grandTotal, setGrandTotal] = useState<string>("0.00");
  const [inventory, setInventory] = useState<any>(null);
  const [invoicePaymentsReceived, setInvoicePaymentsReceived] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    if (!date) {
      setError("Choose a report date.");
      setLoading(false);
      return;
    }
    try {
      const qs = dateQuery(date);

      const [pnlRes, expRes] = await Promise.all([
        api.get(`/api/dashboard/reports/pnl?${qs}`),
        api.get(`/api/dashboard/reports/expenses-by-category?${qs}`).catch(() => null),
      ]);

      setPnl(pnlRes);
      setByCategory(
        Array.isArray(expRes?.categories) ? expRes.categories : []
      );
      setGrandTotal(expRes?.grandTotal ?? "0.00");
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
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    api.get("/api/dashboard/reports/inventory-valuation")
      .then((res) => { if (!cancelled) setInventory(res); })
      .catch(() => { if (!cancelled) setInventory(null); });

    (async () => {
      try {
        let cursor: string | null = null;
        let totalInvoicePayments = 0;
        do {
          const invQs = new URLSearchParams({ limit: "100" });
          if (cursor) invQs.set("cursor", cursor);
          const res: any = await api.get(`/api/dashboard/invoices?${invQs.toString()}`);
          const list = asList(res, "items", "invoices", "data");
          for (const inv of list) {
            if (inv.status === "PAID" || inv.status === "ISSUED") totalInvoicePayments += rawNum(inv.amountPaid);
          }
          cursor = pick(res, ["nextCursor", "after", "cursor", "next"]) ?? null;
        } while (cursor && !cancelled);
        if (!cancelled) setInvoicePaymentsReceived(totalInvoicePayments);
      } catch {
        if (!cancelled) setInvoicePaymentsReceived(0);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  const downloadCsv = async (
    path: string,
    fallbackName: string,
    withDate = true
  ) => {
    try {
      // Tokens live under `brikoh.at` (see lib/api.ts); use the real helpers
      // so the Authorization header and host are correct.
      const token = getAccessToken() || "";
      if (withDate && !date) {
        toast.error("Choose a report date before exporting.");
        return;
      }
      const query = withDate ? `?${dateQuery(date)}` : "";
      const res = await fetch(`${API_BASE}${path}${query}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
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

  if (loading && !pnl) return <PageLoader label="Crunching the numbers…" />;

  if (error) {
    return (
      <div>
        <PageHead title="Reports" sub="Profit & loss and inventory valuation.">
          <ReportDateField date={date} setDate={setDate} />
        </PageHead>
        <div className="card">
          <ErrorState message={error} onRetry={load} />
        </div>
      </div>
    );
  }

  if (!pnl) {
    return (
      <div>
        <PageHead title="Reports" sub="Profit & loss and inventory valuation.">
          <ReportDateField date={date} setDate={setDate} />
        </PageHead>
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
  const dateLabel = displayDate(date);

  const maxCat = Math.max(
    1,
    ...byCategory.map((c: any) => rawNum(c.total))
  );

  return (
    <div>
      <PageHead
        title="Reports"
        sub={`Profit & loss · ${dateLabel}`}
      >
        <ReportDateField date={date} setDate={setDate} />
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
      <div className="relative">
      <div className={cls("grid gap-4 sm:grid-cols-2 lg:grid-cols-4 transition-opacity", loading && "opacity-60")}>
        <StatCard
          label="Revenue"
          value={<Money v={revenue} currency={currency} compact />}
          icon="banknote"
          tone="green"
          sub="PAID + SHIPPED orders"
        />
        <StatCard
          label="Cost of goods"
          value={<Money v={cogs} currency={currency} compact />}
          icon="package"
          tone="neutral"
          sub={unpriced > 0 ? `${unpriced} unpriced` : "At cost price"}
        />
        <StatCard
          label="Expenses"
          value={<Money v={expenses} currency={currency} compact />}
          icon="banknote"
          tone="gold"
          sub={`${byCategory.length} categor${byCategory.length === 1 ? "y" : "ies"}`}
        />
        <StatCard
          label="Invoice payments received"
          value={<Money v={invoicePaymentsReceived} currency={currency} compact />}
          icon="file"
          tone="brand"
          sub="All payments recorded on invoices"
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
      {loading && <div className="absolute inset-0 z-10 flex justify-center rounded-xl bg-white/45 pt-4 backdrop-blur-[1px]"><span className="flex h-fit items-center gap-2 rounded-full border border-cream-200 bg-white px-3 py-2 text-xs font-bold text-ink-500 shadow-md"><Spinner size={14} />Refreshing report…</span></div>}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          icon="download"
          onClick={() =>
            downloadCsv(
              "/api/dashboard/reports/pnl/export.csv",
              `pnl-${date}.csv`
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
              `expenses-${date}.csv`
            )
          }
        >
          Export expenses CSV
        </Button>
      </div>

      {/* Expenses by category */}
      <div className="relative mt-5">
      <div className={cls("card anim-rise p-5 transition-opacity", loading && "opacity-60")}>
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
      {loading && <div className="absolute inset-0 z-10 flex justify-center rounded-xl bg-white/45 pt-4 backdrop-blur-[1px]"><span className="flex h-fit items-center gap-2 rounded-full border border-cream-200 bg-white px-3 py-2 text-xs font-bold text-ink-500 shadow-md"><Spinner size={14} />Refreshing expenses…</span></div>}
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
                    "inventory-valuation.csv",
                    false
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

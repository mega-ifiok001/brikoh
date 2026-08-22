import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { ago, asList, pick, rawNum, titleCase } from "../lib/format";
import {
  Badge,
  Button,
  ErrorState,
  Icon,
  Money,
  PageLoader,
  PageHead,
  StatCard,
  StatusBadge,
  Thumb,
} from "../components/ui";

interface Part {
  overview: any | null;
  activity: any[];
  wallet: any;
  loaded: number;
  total: number;
}

export default function Overview() {
  const { me } = useAuth();
  const store = me.store || {};
  const currency: string = store.currency || "NGN";
  const [p, setP] = useState<Part>({ overview: null, activity: [], wallet: null, loaded: 0, total: 3 });
  const [fatal, setFatal] = useState<string | null>(null);

  const load = useCallback(async () => {
    setFatal(null);
    setP({ overview: null, activity: [], wallet: null, loaded: 0, total: 3 });

    const tasks: Array<Promise<void>> = [
      api
        .get("/api/dashboard/overview")
        .then((res) => setP((s) => ({ ...s, overview: res, loaded: s.loaded + 1 })))
        .catch((e) => {
          setFatal(e?.message || "Couldn't load your dashboard.");
          setP((s) => ({ ...s, loaded: s.loaded + 1 }));
        }),
      // NOTE: no contract shared for this route — kept as-is, best effort.
      api
        .get("/api/dashboard/activity?limit=10")
        .then((res) =>
          setP((s) => ({ ...s, activity: asList(res, "activities", "items", "logs", "entries"), loaded: s.loaded + 1 }))
        )
        .catch(() => setP((s) => ({ ...s, loaded: s.loaded + 1 }))),
      // NOTE: no contract shared for this route — kept as-is, best effort.
      api
        .get("/api/dashboard/wallet")
        .then((res) => setP((s) => ({ ...s, wallet: res, loaded: s.loaded + 1 })))
        .catch(() => setP((s) => ({ ...s, loaded: s.loaded + 1 }))),
    ];
    await Promise.allSettled(tasks);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (p.loaded < p.total && !fatal) return <PageLoader label="Warming up your dashboard…" />;
  if (fatal) return <ErrorState message={fatal} onRetry={load} />;

  const ov = p.overview || {};
  const kpis = ov.kpis || {};
  // Per contract: revenue-bearing fields are OMITTED (key absent), not
  // null, for staff without viewProfit. Distinguish "hidden" from "zero".
  const canViewProfit = "revenue" in kpis;

  const lowStock: any[] = ov.lowStock || [];
  const expiringSoon: any[] = ov.expiringSoon || [];
  const topProducts: any[] = ov.topProducts || [];
  const recentOrders: any[] = ov.recentOrders || [];
  const quickStats = ov.quickStats || {};

  const walletBalance =
    pick(p.wallet, ["balance", "availableBalance", "available"]) ?? (p.wallet && (p.wallet as any).wallet?.balance);

  const firstName = me.account?.firstName || "";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const hasStorefront = !!store.subdomain;
  const hasNoProducts = (quickStats.productCount ?? 0) === 0;

  return (
    <div>
      <PageHead
        title={`${greeting}${firstName ? ", " + firstName : ""}`}
        sub={new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
      >
        <Link to="/dashboard/pos">
          <Button icon="pos">New sale</Button>
        </Link>
        <Link to="/dashboard/products?new=1">
          <Button variant="outline" icon="plus">
            Add product
          </Button>
        </Link>
        {hasStorefront && (
          <Button
            variant="dark"
            icon="external"
            onClick={() => window.open(`${location.origin}${location.pathname}#/s/${store.subdomain}`, "_blank")}
          >
            View storefront
          </Button>
        )}
      </PageHead>

      {hasNoProducts && (
        <div className="anim-rise mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-200 bg-brand-50 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-white">
              <Icon name="sparkle" size={19} />
            </span>
            <div>
              <p className="font-display text-base font-extrabold text-brand-800">Your shelves are empty</p>
              <p className="text-sm text-brand-700/70">Add your first product to start selling in the shop and online.</p>
            </div>
          </div>
          <Link to="/dashboard/products?new=1">
            <Button size="sm" icon="plus">
              Add your first product
            </Button>
          </Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Revenue (30 days)"
          value={canViewProfit ? <Money v={kpis.revenue} currency={currency} /> : "Hidden"}
          icon="banknote"
          tone={canViewProfit ? "green" : "neutral"}
          sub={canViewProfit ? `Avg order ${kpis.avgOrderValue ? `${currency} ${kpis.avgOrderValue}` : "—"}` : "Ask an owner for access"}
        />
        <StatCard label="Orders (30 days)" value={kpis.orders ?? "—"} icon="receipt" tone="brand" sub={`${kpis.customers ?? 0} customers total`} />
        <StatCard
          label="Low stock"
          value={lowStock.length}
          icon="alert"
          tone={lowStock.length > 0 ? "gold" : "neutral"}
          sub={lowStock.length ? "Needs restocking" : "All healthy"}
        />
        <StatCard
          label="Credit owing"
          value={<Money v={quickStats.creditOwing ?? 0} currency={currency} />}
          icon="clock"
          tone={rawNum(quickStats.creditOwing) > 0 ? "gold" : "neutral"}
          sub={`${quickStats.pendingOrderCount ?? 0} order${quickStats.pendingOrderCount === 1 ? "" : "s"} pending`}
        />
        <StatCard
          label="Wallet"
          value={walletBalance !== undefined ? <Money v={walletBalance} currency="NGN" /> : "—"}
          icon="wallet"
          tone="dark"
          sub="Online sales land here"
        />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        {/* Recent orders */}
        <div className="card anim-rise overflow-hidden">
          <div className="flex items-center justify-between border-b border-cream-200 px-5 py-3.5">
            <h3 className="font-display text-base font-extrabold">Recent orders</h3>
            <Link to="/dashboard/orders" className="text-xs font-bold text-brand-600 hover:underline">
              All orders →
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-sm font-semibold text-ink-400">No orders yet.</p>
              <Link to="/dashboard/pos" className="mt-2 inline-block text-sm font-bold text-brand-600 hover:underline">
                Make the first sale →
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-slim">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Source</th>
                    <th className="text-right">Items</th>
                    <th className="text-right">Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((o) => (
                    <tr key={o.id}>
                      <td className="max-w-[160px] truncate font-bold">{o.customerName || "Walk-in"}</td>
                      <td>
                        <Badge tone="neutral">{titleCase(o.source)}</Badge>
                      </td>
                      <td className="text-right tabular-nums">{o.lineItemCount ?? "—"}</td>
                      <td className="text-right">
                        <Money v={o.total} currency={currency} strong />
                      </td>
                      <td>
                        <StatusBadge status={o.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="space-y-5">
          {/* Low stock */}
          <div className="card anim-rise overflow-hidden">
            <div className="flex items-center justify-between border-b border-cream-200 px-5 py-3.5">
              <h3 className="font-display text-base font-extrabold">Low stock</h3>
              <Link to="/dashboard/products" className="text-xs font-bold text-brand-600 hover:underline">
                Products →
              </Link>
            </div>
            {lowStock.length === 0 ? (
              <p className="px-5 py-6 text-sm font-semibold text-ink-400">
                Nothing running low. Set a low-stock threshold on any product to get alerts.
              </p>
            ) : (
              <div>
                {lowStock.slice(0, 5).map((x, i) => (
                  <div key={x.productId + (x.branchId || "") || i} className="flex items-center gap-3 border-b border-cream-100 px-5 py-3 last:border-0">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">{x.name}</p>
                      <p className="text-xs text-ink-400">{x.branchName || "Branch"}</p>
                    </div>
                    <Badge tone={x.quantity <= 0 ? "danger" : "gold"}>{x.quantity <= 0 ? "Out" : `${x.quantity} left`}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Expiring */}
          {expiringSoon.length > 0 && (
            <div className="card anim-rise overflow-hidden">
              <div className="border-b border-cream-200 px-5 py-3.5">
                <h3 className="font-display text-base font-extrabold">Expiring soon</h3>
              </div>
              {expiringSoon.map((x, i) => {
                const days = Math.ceil((new Date(x.expiryDate).getTime() - Date.now()) / 86400000);
                return (
                  <div key={x.productId + (i as any)} className="flex items-center justify-between gap-3 border-b border-cream-100 px-5 py-3 last:border-0">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{x.name}</p>
                      <p className="text-xs text-ink-400">
                        {days < 0 ? "Expired" : days === 0 ? "Expires today" : `Expires in ${days}d`} · {x.quantity} on hand
                      </p>
                    </div>
                    <Badge tone={days <= 3 ? "danger" : "gold"}>{days}d</Badge>
                  </div>
                );
              })}
            </div>
          )}

          {/* Top products */}
          {topProducts.length > 0 && (
            <div className="card anim-rise overflow-hidden">
              <div className="border-b border-cream-200 px-5 py-3.5">
                <h3 className="font-display text-base font-extrabold">Top products (30d)</h3>
              </div>
              {topProducts.map((tp, i) => (
                <div key={tp.productId} className="flex items-center gap-3 border-b border-cream-100 px-5 py-3 last:border-0">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cream-100 text-xs font-extrabold text-ink-500">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{tp.name}</p>
                    <p className="text-xs text-ink-400">{tp.units} sold</p>
                  </div>
                  {"revenue" in tp && (
                    <span className="text-sm font-extrabold tabular-nums">
                      <Money v={tp.revenue} currency={currency} />
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Activity — no contract shared for this route */}
          <div className="card anim-rise overflow-hidden">
            <div className="flex items-center justify-between border-b border-cream-200 px-5 py-3.5">
              <h3 className="font-display text-base font-extrabold">Activity</h3>
            </div>
            {p.activity.length === 0 ? (
              <p className="px-5 py-6 text-sm font-semibold text-ink-400">Recent actions will show up here.</p>
            ) : (
              <div>
                {p.activity.slice(0, 7).map((a, i) => (
                  <div key={(a.id as string) || i} className="flex items-start gap-3 border-b border-cream-100 px-5 py-3 last:border-0">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cream-100 text-ink-500">
                      <Icon name="zap" size={13} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold" title={a.action}>
                        {titleCase(a.action || a.event || "activity")}
                      </p>
                      <p className="text-xs text-ink-400">
                        {a.staffMember?.account?.firstName || a.staffMember?.name || a.performedBy || "Someone"} · {ago(a.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
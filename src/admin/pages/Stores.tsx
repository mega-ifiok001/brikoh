import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHead, SearchInput, Select } from "../../components/ui";
import { fd } from "../../lib/format";
import { ListShell, Pager, Pill, TableWrap } from "../components/bits";
import { useAdmin } from "../AdminContext";
import { useDebounced, usePaged } from "../lib/hooks";

/**
 * Two backing endpoints, one table:
 *  - GET /api/admin/stores          → fleet view (cap utilisation); `admin:stores.view`
 *  - GET /api/admin/stores/search   → tier / subscription filters;  `stores:view`
 * The search endpoint is used only while a tier or status filter is set.
 */
export default function Stores() {
  const { p, can } = useAdmin();
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [tier, setTier] = useState("");
  const [subStatus, setSubStatus] = useState("");
  const dq = useDebounced(q.trim());

  const filtered = !!(tier || subStatus);
  const fleet = usePaged<any>("/api/admin/stores", { q: dq || undefined, limit: 50 }, !filtered);
  const search = usePaged<any>(
    "/api/admin/stores/search",
    { q: dq || undefined, tier: tier || undefined, subscriptionStatus: subStatus || undefined, limit: 25 },
    filtered
  );
  const list = filtered ? search : fleet;
  const canOpen = can("stores:view");

  return (
    <>
      <PageHead title="Stores" sub="Store fleet — plan, status and product-cap utilisation." />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchInput
          className="w-full max-w-sm"
          value={q}
          onChange={setQ}
          placeholder="Search name, subdomain or domain…"
        />
        {can("stores:view") && (
          <>
            <Select className="w-36" value={tier} onChange={(e) => setTier(e.target.value)} aria-label="Tier">
              <option value="">Any tier</option>
              <option value="starter">Starter</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </Select>
            <Select
              className="w-40"
              value={subStatus}
              onChange={(e) => setSubStatus(e.target.value)}
              aria-label="Subscription"
            >
              <option value="">Any subscription</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </>
        )}
      </div>

      <div className="card overflow-hidden">
        <ListShell
          loading={list.loading}
          error={list.error}
          onRetry={list.reload}
          count={list.items.length}
          emptyIcon="store"
          emptyTitle="No stores match"
        >
          <TableWrap>
            <thead>
              <tr>
                <th>Store</th>
                {filtered && <th>Owner</th>}
                <th>Plan</th>
                <th>Status</th>
                {!filtered && <th>Products</th>}
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {list.items.map((s) => {
                const count = s.productCount as number | undefined;
                const cap = s.productCap as number | null | undefined;
                const usage = count !== undefined && cap ? Math.min(100, (count / cap) * 100) : null;
                const status = s.status ?? s.subscriptionStatus ?? null;
                return (
                  <tr
                    key={s.id}
                    className={canOpen ? "cursor-pointer" : ""}
                    onClick={() => canOpen && nav(p(`/stores/${s.id}`))}
                  >
                    <td>
                      <div className="font-bold text-ink-900">{s.name}</div>
                      <div className="text-xs text-ink-400">
                        {s.customDomain || (s.subdomain ? `${s.subdomain}.brikoh.com` : "—")}
                        {s.currency ? ` · ${s.currency}` : ""}
                      </div>
                    </td>
                    {filtered && <td className="text-ink-600">{s.ownerEmail}</td>}
                    <td>
                      <Pill value={s.tier} />
                    </td>
                    <td>
                      <Pill value={status} />
                    </td>
                    {!filtered && (
                      <td className="min-w-[150px]">
                        <div className="text-sm font-semibold tabular-nums">
                          {count ?? 0} <span className="font-normal text-ink-400">/ {cap ?? "∞"}</span>
                        </div>
                        {usage !== null && (
                          <div className="mt-1 h-1.5 w-28 overflow-hidden rounded-full bg-cream-100">
                            <div
                              className={usage >= 90 ? "h-full bg-danger-500" : usage >= 70 ? "h-full bg-gold-600" : "h-full bg-leaf-500"}
                              style={{ width: `${usage}%` }}
                            />
                          </div>
                        )}
                      </td>
                    )}
                    <td className="whitespace-nowrap text-ink-500">{fd(s.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </TableWrap>
          <Pager hasMore={list.hasMore} loading={list.loadingMore} onMore={list.loadMore} shown={list.items.length} />
        </ListShell>
      </div>
    </>
  );
}
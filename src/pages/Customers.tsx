import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { asList, fd, fdt, pick, rawNum, titleCase } from "../lib/format";
import {
  Badge,
  Button,
  Confirm,
  EmptyState,
  ErrorState,
  Field,
  Input,
  LoadMore,
  Modal,
  Money,
  PageHead,
  SearchInput,
  Select,
  StatusBadge,
  toast,
} from "../components/ui";

export default function Customers() {
  const { me } = useAuth();
  const currency: string = (me.store as any)?.currency || "NGN";

  // List
  const [items, setItems] = useState<any[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");

  // Groups
  const [groups, setGroups] = useState<any[]>([]);
  const [groupDraft, setGroupDraft] = useState("");

  // Create / Edit
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", groupId: "" });
  const [formBusy, setFormBusy] = useState(false);
  const [formErr, setFormErr] = useState("");

  // Detail
  const [detail, setDetail] = useState<any | null>(null);
  const [detailBusy, setDetailBusy] = useState(false);
  const [repayments, setRepayments] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  // Delete
  const [delFor, setDelFor] = useState<any | null>(null);
  const [delBusy, setDelBusy] = useState(false);

  // Repayment
  const [repay, setRepay] = useState("");
  const [repayNote, setRepayNote] = useState("");
  const [repayBusy, setRepayBusy] = useState(false);

  // ---------- Load groups ----------
  const loadGroups = useCallback(async () => {
    try {
      const res = await api.get("/api/dashboard/customer-groups");
      setGroups(asList(res, "items", "groups", "data"));
    } catch {
      /* optional */
    }
  }, []);

  // ---------- Load customers ----------
  const load = useCallback(
    async (cursor?: string | null) => {
      if (!cursor) setLoading(true);
      else setLoadingMore(true);
      setError(null);
      try {
        const qs = new URLSearchParams();
        qs.set("limit", "24");
        if (q.trim()) qs.set("q", q.trim());
        if (cursor) qs.set("cursor", cursor);
        const res = await api.get(`/api/dashboard/customers?${qs.toString()}`);
        const list = asList(res, "items", "customers", "data");
        setItems((prev) => (cursor ? [...prev, ...list] : list));
        setNextCursor(pick(res, ["nextCursor", "after", "cursor", "next"]) ?? null);
      } catch (e: any) {
        setError(e?.message || "Couldn't load customers.");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [q]
  );

  useEffect(() => {
    const t = setTimeout(() => load(), 350);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  // ---------- Add group ----------
  const addGroup = async () => {
    if (!groupDraft.trim()) return;
    try {
      await api.post("/api/dashboard/customer-groups", { name: groupDraft.trim() });
      setGroupDraft("");
      toast.success("Group added.");
      loadGroups();
    } catch (e: any) {
      toast.error(e?.message || "Couldn't add the group.");
    }
  };

  // ---------- Create / Edit ----------
  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", phone: "", email: "", groupId: "" });
    setFormErr("");
    setFormOpen(true);
  };

  const openEdit = (c: any) => {
    setEditing(c);
    setForm({
      name: c.name || "",
      phone: c.phone || "",
      email: c.email || "",
      groupId: c.group?.id || c.groupId || "",
    });
    setFormErr("");
    setFormOpen(true);
  };

  const submit = async () => {
    if (!form.name.trim()) return setFormErr("Name is required.");
    setFormBusy(true);
    setFormErr("");
    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      groupId: form.groupId || null,
    };
    try {
      if (editing) {
        await api.put(`/api/dashboard/customers/${editing.id}`, payload);
        toast.success("Customer updated.");
      } else {
        await api.post("/api/dashboard/customers", payload);
        toast.success("Customer added.");
      }
      setFormOpen(false);
      load();
    } catch (e: any) {
      setFormErr(e?.message || "Couldn't save the customer.");
    } finally {
      setFormBusy(false);
    }
  };

  // ---------- Detail ----------
  const openDetail = async (c: any) => {
    setDetailBusy(true);
    setDetail({ ...c });
    setRepayments([]);
    setRecentOrders([]);
    try {
      const res: any = await api.get(`/api/dashboard/customers/${c.id}`);
      const full = res?.customer ?? res;
      setDetail(full);
      setRepayments(Array.isArray(res?.repayments) ? res.repayments : []);
      setRecentOrders(Array.isArray(res?.recentOrders) ? res.recentOrders : []);
    } catch {
      /* keep list row data */
    } finally {
      setDetailBusy(false);
    }
  };

  // ---------- Delete ----------
  const confirmDelete = async () => {
    if (!delFor) return;
    setDelBusy(true);
    try {
      await api.del(`/api/dashboard/customers/${delFor.id}`);
      toast.success("Customer removed.");
      if (detail?.id === delFor.id) setDetail(null);
      setDelFor(null);
      load();
    } catch (e: any) {
      const msg =
        e?.code === "CUSTOMER_HAS_RECORDS"
          ? "This customer has orders or invoices and can't be deleted."
          : e?.message || "Couldn't delete the customer.";
      toast.error(msg);
    } finally {
      setDelBusy(false);
    }
  };

  // ---------- Repayment ----------
  const doRepay = async () => {
    const amount = repay.trim();
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error("Enter a positive amount.");
      return;
    }
    setRepayBusy(true);
    try {
      await api.post(`/api/dashboard/customers/${detail.id}/credits/repayments`, {
        amount, // API expects string decimal
        note: repayNote.trim() || undefined,
      });
      toast.success("Repayment recorded.");
      setRepay("");
      setRepayNote("");
      openDetail(detail); // refresh
    } catch (e: any) {
      toast.error(e?.message || "Couldn't record the repayment.");
    } finally {
      setRepayBusy(false);
    }
  };

  const openCreditOf = (c: any) => {
    const val = c?.openCredit ?? c?.outstandingBalance ?? c?.creditBalance;
    return val != null ? rawNum(val) : null;
  };

  return (
    <div>
      <PageHead
        title="Customers"
        sub="Your address book — walk-ins, regulars and credit accounts."
      >
        <Button icon="plus" onClick={openCreate}>
          Add customer
        </Button>
      </PageHead>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchInput
          value={q}
          onChange={setQ}
          placeholder="Search name, phone or email…"
          className="w-full sm:w-72"
        />
        <div className="flex items-center gap-2">
          <Input
            value={groupDraft}
            onChange={(e) => setGroupDraft(e.target.value)}
            placeholder="New group (e.g. VIP)"
            className="w-44"
            onKeyDown={(e) => e.key === "Enter" && addGroup()}
          />
          <Button variant="outline" size="sm" onClick={addGroup}>
            Add group
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-14" />
          ))}
        </div>
      ) : error ? (
        <div className="card">
          <ErrorState message={error} onRetry={() => load()} />
        </div>
      ) : items.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="users"
            title="No customers yet"
            hint="Customers are created automatically when named people buy through POS or your storefront — or add them by hand."
            action={
              <Button icon="plus" onClick={openCreate}>
                Add a customer
              </Button>
            }
          />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto scrollbar-slim">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Group</th>
                  <th>Source</th>
                  <th>Added</th>
                  <th className="text-right">Owes</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((c) => {
                  const owes = openCreditOf(c);
                  return (
                    <tr
                      key={c.id}
                      className="cursor-pointer"
                      onClick={() => openDetail(c)}
                    >
                      <td className="font-bold">{c.name}</td>
                      <td className="whitespace-nowrap text-ink-500">
                        {c.phone || "—"}
                      </td>
                      <td className="max-w-[180px] truncate text-ink-500">
                        {c.email || "—"}
                      </td>
                      <td>
                        <Badge tone={c.group ? "brand" : "neutral"}>
                          {c.group?.name || "General"}
                        </Badge>
                      </td>
                      <td className="text-xs text-ink-400">
                        {titleCase(c.source || "MANUAL")}
                      </td>
                      <td className="whitespace-nowrap text-ink-500">
                        {fd(c.createdAt)}
                      </td>
                      <td className="text-right">
                        {owes != null && owes > 0 ? (
                          <span className="font-bold text-gold-600">
                            <Money v={owes} currency={currency} />
                          </span>
                        ) : (
                          <span className="text-ink-300">—</span>
                        )}
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-0.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(c)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-danger-500 hover:bg-danger-100"
                            onClick={() => setDelFor(c)}
                          >
                            Remove
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <LoadMore
            onClick={() => load(nextCursor)}
            loading={loadingMore}
            hasMore={!!nextCursor}
          />
        </div>
      )}

      {/* ---------- Create / Edit ---------- */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? `Edit — ${editing.name}` : "Add customer"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button loading={formBusy} onClick={submit} icon="check">
              Save
            </Button>
          </>
        }
      >
        {formErr && (
          <p className="mb-3 rounded-xl bg-danger-100 px-3.5 py-2.5 text-sm font-semibold text-danger-700">
            {formErr}
          </p>
        )}
        <div className="space-y-4">
          <Field label="Name">
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Full name"
              autoFocus
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Phone">
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                type="tel"
              />
            </Field>
            <Field label="Email">
              <Input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                type="email"
              />
            </Field>
          </div>
          <Field
            label="Group"
            hint="Groups can carry an automatic discount set on the Discounts page."
          >
            <Select
              value={form.groupId}
              onChange={(e) => setForm({ ...form, groupId: e.target.value })}
            >
              <option value="">General</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Modal>

      {/* ---------- Detail ---------- */}
      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail?.name || "Customer"}
        sub={
          detail
            ? `${detail.phone || "no phone"} · ${detail.email || "no email"}`
            : undefined
        }
        wide
      >
        {detailBusy ? (
          <div className="space-y-3 py-4">
            <div className="skeleton h-10" />
            <div className="skeleton h-24" />
          </div>
        ) : detail ? (
          <div className="space-y-5">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="neutral">
                {titleCase(detail.source || "MANUAL")}
              </Badge>
              <Badge tone="brand">
                {detail.group?.name || "General"}
              </Badge>
              {detail.segment && (
                <Badge tone={detail.segment === "VIP" ? "gold" : "muted"}>
                  {detail.segment}
                </Badge>
              )}
              <span className="text-xs text-ink-400">
                since {fd(detail.createdAt)}
              </span>
            </div>

            {/* Stats */}
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-cream-100 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-wide text-ink-400">
                  Orders
                </p>
                <p className="mt-1 font-display text-2xl font-extrabold tabular-nums">
                  {detail.ordersCount ?? "—"}
                </p>
              </div>
              <div className="rounded-xl bg-cream-100 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-wide text-ink-400">
                  Lifetime spend
                </p>
                <p className="mt-1 font-display text-xl font-extrabold tabular-nums">
                  <Money
                    v={rawNum(detail.totalSpent)}
                    currency={currency}
                  />
                </p>
              </div>
              <div className="rounded-xl bg-cream-100 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-wide text-ink-400">
                  Open credit
                </p>
                <p className="mt-1 font-display text-xl font-extrabold tabular-nums text-gold-700">
                  {openCreditOf(detail) != null && openCreditOf(detail)! > 0 ? (
                    <Money v={openCreditOf(detail)} currency={currency} />
                  ) : (
                    "—"
                  )}
                </p>
              </div>
            </div>

            {/* Recent orders */}
            {recentOrders.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-bold text-ink-700">
                  Recent orders
                </p>
                <div className="overflow-x-auto rounded-xl border border-cream-200">
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th>Order</th>
                        <th>Date</th>
                        <th className="text-right">Total</th>
                        <th className="text-right">Balance</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.slice(0, 10).map((o: any, i: number) => (
                        <tr key={o.id || i}>
                          <td className="font-bold">
                            {o.orderNumber || o.number || o.id?.slice?.(0, 8) || "—"}
                          </td>
                          <td className="whitespace-nowrap text-ink-500">
                            {fdt(o.createdAt)}
                          </td>
                          <td className="text-right">
                            <Money v={o.total} currency={currency} strong />
                          </td>
                          <td className="text-right">
                            {rawNum(o.balanceDue) > 0 ? (
                              <span className="font-bold text-gold-600">
                                <Money v={o.balanceDue} currency={currency} />
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td>
                            <StatusBadge status={o.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Outstanding credit + repay */}
            {openCreditOf(detail) != null && openCreditOf(detail)! > 0 && (
              <div className="rounded-xl bg-gold-100 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-wider text-gold-700">
                      Outstanding credit
                    </p>
                    <p className="font-display text-2xl font-extrabold text-gold-700">
                      <Money v={openCreditOf(detail)} currency={currency} />
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={repay}
                      onChange={(e) => setRepay(e.target.value)}
                      placeholder="Amount"
                      className="w-28"
                    />
                    <Input
                      value={repayNote}
                      onChange={(e) => setRepayNote(e.target.value)}
                      placeholder="Note (optional)"
                      className="w-36"
                    />
                    <Button
                      size="sm"
                      loading={repayBusy}
                      onClick={doRepay}
                      icon="banknote"
                    >
                      Record repayment
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Repayment history */}
            {repayments.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-bold text-ink-700">
                  Repayment history
                </p>
                <ul className="max-h-48 space-y-2 overflow-y-auto">
                  {repayments.map((r: any) => (
                    <li
                      key={r.id}
                      className="flex items-center justify-between rounded-xl bg-cream-100 px-3 py-2 text-sm"
                    >
                      <div>
                        <p className="font-bold">
                          <Money v={r.amount} currency={currency} />
                        </p>
                        <p className="text-xs text-ink-400">
                          {r.note || "—"} · {r.recordedByName || "Staff"} ·{" "}
                          {fdt(r.createdAt)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2 border-t border-ink-50 pt-4">
              <Button variant="outline" icon="edit" onClick={() => openEdit(detail)}>
                Edit
              </Button>
              <Button
                variant="ghost"
                className="text-danger-600 hover:bg-danger-100"
                onClick={() => setDelFor(detail)}
              >
                Delete customer
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* ---------- Delete confirm ---------- */}
      <Confirm
        open={!!delFor}
        onClose={() => setDelFor(null)}
        onConfirm={confirmDelete}
        loading={delBusy}
        title={`Remove “${delFor?.name || ""}”?`}
        body="Customers with orders or invoices can't be removed — their financial history must stay."
        confirmLabel="Remove"
      />
    </div>
  );
}
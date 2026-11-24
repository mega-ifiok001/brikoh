import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { asList, cls, fd, rawNum, titleCase, toISODate } from "../lib/format";
import DatePicker from "../components/DatePicker";
import {
  Badge,
  Button,
  Confirm,
  EmptyState,
  ErrorState,
  Field,
  IconBtn,
  Input,
  Modal,
  Money,
  PageHead,
  Select,
  Spinner,
  StatCard,
  toast,
} from "../components/ui";

const CATEGORIES = [
  "RENT",
  "TRANSPORT",
  "PACKAGING",
  "SALARIES",
  "MARKETING",
  "UTILITIES",
  "OTHER",
] as const;

const CAT_COLOR: Record<string, string> = {
  RENT: "bg-brand-500",
  TRANSPORT: "bg-ink-700",
  PACKAGING: "bg-gold-600",
  SALARIES: "bg-leaf-500",
  MARKETING: "bg-brand-300",
  UTILITIES: "bg-ink-400",
  OTHER: "bg-cream-300",
};

export default function Expenses() {
  const { me } = useAuth();
  const currency: string = (me.store as any)?.currency || "NGN";

  const [date, setDate] = useState(() => toISODate(new Date()));
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({
    category: "OTHER" as string,
    amount: "",
    date: toISODate(new Date()),
    description: "",
  });
  const [formBusy, setFormBusy] = useState(false);
  const [formErr, setFormErr] = useState("");

  const [delFor, setDelFor] = useState<any | null>(null);
  const [delBusy, setDelBusy] = useState(false);

  const dateLabel = new Date(`${date}T00:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  // ---------- Load ----------
 const load = useCallback(async () => {
  setLoading(true);
  setError(null);
  if (!date) {
    setError("Choose an expense date.");
    setLoading(false);
    return;
  }
  try {
    const qs = new URLSearchParams({ date, limit: "100" });

    const res = await api.get(`/api/dashboard/expenses?${qs.toString()}`);
    let list = asList(res, "expenses", "items", "data");

    list = list.filter((x) => {
      return String(x.date || "").slice(0, 10) === date;
    });

    list.sort(
      (a, b) =>
        new Date(b.date || b.createdAt).getTime() -
        new Date(a.date || a.createdAt).getTime()
    );
    setItems(list);
  } catch (e: any) {
    setError(e?.message || "Couldn't load expenses.");
  } finally {
    setLoading(false);
  }
}, [date]);

  useEffect(() => {
    load();
  }, [load]);

  // ---------- Stats ----------
  const total = items.reduce((a, x) => a + rawNum(x.amount), 0);

  const byCat = useMemo(() => {
    const m: Record<string, number> = {};
    items.forEach((x) => {
      const c = (x.category || "OTHER").toUpperCase();
      m[c] = (m[c] || 0) + rawNum(x.amount);
    });
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [items]);

  // ---------- Create / Edit ----------
  const openCreate = () => {
    setEditing(null);
    setForm({
      category: "OTHER",
      amount: "",
      date,
      description: "",
    });
    setFormErr("");
    setFormOpen(true);
  };

  const openEdit = (x: any) => {
    setEditing(x);
    setForm({
      category: (x.category || "OTHER").toUpperCase(),
      amount: String(x.amount ?? ""),
      date: x.date ? String(x.date).slice(0, 10) : toISODate(new Date()),
      description: x.description || "",
    });
    setFormErr("");
    setFormOpen(true);
  };

  const submit = async () => {
    const amountNum = parseFloat(form.amount);
    if (!isFinite(amountNum) || amountNum <= 0) {
      return setFormErr("Enter an amount greater than zero.");
    }
    if (!form.date) return setFormErr("Pick the date the expense belongs to.");
    if (!CATEGORIES.includes(form.category as any)) {
      return setFormErr("Pick a valid category.");
    }

    setFormBusy(true);
    setFormErr("");

    // API expects amount as decimal string, date as YYYY-MM-DD
    const payload = {
      category: form.category,
      amount: String(amountNum.toFixed(2)),
      date: form.date,
      description: form.description.trim() || undefined,
    };

    try {
      if (editing) {
        await api.put(`/api/dashboard/expenses/${editing.id}`, payload);
        toast.success("Expense updated.");
      } else {
        await api.post("/api/dashboard/expenses", payload);
        toast.success("Expense recorded.");
      }
      setFormOpen(false);
      load();
    } catch (e: any) {
      setFormErr(e?.message || "Couldn't save the expense.");
    } finally {
      setFormBusy(false);
    }
  };

  // ---------- Delete ----------
  const confirmDelete = async () => {
    if (!delFor) return;
    setDelBusy(true);
    try {
      await api.del(`/api/dashboard/expenses/${delFor.id}`);
      toast.success("Expense deleted.");
      setDelFor(null);
      load();
    } catch (e: any) {
      toast.error(e?.message || "Couldn't delete the expense.");
    } finally {
      setDelBusy(false);
    }
  };

  return (
    <div>
      <PageHead
        title="Expenses"
        sub="What you spent on running the business — feeds your profit & loss report."
      >
        <div data-tour-id="expenses-period"><DatePicker label="Expense date" value={date} onChange={setDate} /></div>
        <Button data-tour-id="expenses-new" icon="plus" onClick={openCreate}>
          Record expense
        </Button>
      </PageHead>

      {/* Summary */}
      <div className="relative mb-5">
      <div className={cls("grid gap-4 sm:grid-cols-3 transition-opacity", loading && "opacity-60")}>
        <StatCard
          label="Spent on selected date"
          value={<Money v={total} currency={currency} compact />}
          icon="banknote"
          tone="brand"
          sub={`${items.length} expense${items.length === 1 ? "" : "s"}`}
        />
        <div className="card anim-rise col-span-2 p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400">
            Where it went
          </p>
          {byCat.length === 0 ? (
            <p className="mt-3 text-sm font-semibold text-ink-400">
              Nothing recorded on this date.
            </p>
          ) : (
            <div className="mt-3 space-y-2.5">
              {byCat.map(([cat, amt]) => (
                <div key={cat} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 text-xs font-extrabold text-ink-500">
                    {titleCase(cat)}
                  </span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-cream-100">
                    <div
                      className={cls(
                        "h-full rounded-full",
                        CAT_COLOR[cat] || "bg-ink-400"
                      )}
                      style={{
                        width: `${Math.max(6, (amt / (total || 1)) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="w-24 shrink-0 text-right text-xs font-extrabold tabular-nums">
                    <Money v={amt} currency={currency} />
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {loading && <div className="pointer-events-none absolute inset-0 z-10 flex justify-center rounded-xl bg-white/35 pt-3 backdrop-blur-[1px]"><span className="flex h-fit items-center gap-2 rounded-full border border-cream-200 bg-white px-3 py-2 text-xs font-bold text-ink-500 shadow-md"><Spinner size={14} />Refreshing expenses…</span></div>}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-12" />
          ))}
        </div>
      ) : error ? (
        <div className="card">
          <ErrorState message={error} onRetry={load} />
        </div>
      ) : items.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="banknote"
            title={`No expenses on ${dateLabel}`}
            hint="Rent, transport, packaging, salaries, data — record them here and the P&L does the maths."
            action={
              <Button icon="plus" onClick={openCreate}>
                Record an expense
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
                  <th>Date</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th className="text-right">Amount</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((x) => (
                  <tr key={x.id}>
                    <td className="whitespace-nowrap text-ink-500">
                      {fd(x.date || x.createdAt)}
                    </td>
                    <td>
                      <Badge tone="neutral">{titleCase(x.category)}</Badge>
                    </td>
                    <td className="max-w-[320px] truncate text-ink-500">
                      {x.description || "—"}
                    </td>
                    <td className="text-right">
                      <Money v={x.amount} currency={currency} strong />
                    </td>
                    <td>
                      <div className="flex justify-end gap-0.5">
                        <IconBtn
                          name="edit"
                          label="Edit"
                          onClick={() => openEdit(x)}
                        />
                        <IconBtn
                          name="trash"
                          label="Delete"
                          className="hover:bg-danger-100 hover:text-danger-500"
                          onClick={() => setDelFor(x)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Form */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Edit expense" : "Record expense"}
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
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <Select
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value })
                }
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {titleCase(c)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={`Amount (${currency})`}>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(e) =>
                  setForm({ ...form, amount: e.target.value })
                }
                placeholder="0.00"
                autoFocus
              />
            </Field>
          </div>
          <Field
            label="Date"
            hint="The day it belongs to — not when you're typing it in."
          >
            <Input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </Field>
          <Field label="Description">
            <Input
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="e.g. keke to market, 20 cartons"
            />
          </Field>
        </div>
      </Modal>

      <Confirm
        open={!!delFor}
        onClose={() => setDelFor(null)}
        onConfirm={confirmDelete}
        loading={delBusy}
        title="Delete this expense?"
        body="It will drop out of the P&L on your next read."
        confirmLabel="Delete"
      />
    </div>
  );
}

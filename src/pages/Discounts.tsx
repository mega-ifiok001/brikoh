import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { asList, cls, fd, pick, rawNum } from "../lib/format";
import {
  Badge,
  Button,
  Confirm,
  EmptyState,
  ErrorState,
  Field,
  Icon,
  IconBtn,
  Input,
  LoadMore,
  Modal,
  Money,
  PageHead,
  Select,
  toast,
} from "../components/ui";

interface FormState {
  name: string;
  type: "PERCENTAGE" | "FIXED";
  value: string;
  code: string;
  startsAt: string;
  endsAt: string;
  maxUses: string;
  perCustomerUses: string;
  minSubtotal: string;
  firstOrderOnly: boolean;
  isActive: boolean;
}

const BLANK: FormState = {
  name: "",
  type: "PERCENTAGE",
  value: "",
  code: "",
  startsAt: "",
  endsAt: "",
  maxUses: "",
  perCustomerUses: "",
  minSubtotal: "",
  firstOrderOnly: false,
  isActive: true,
};

export default function Discounts() {
  const { me } = useAuth();
  const currency: string = (me.store as any)?.currency || "NGN";

  const [items, setItems] = useState<any[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<FormState>(BLANK);
  const [formBusy, setFormBusy] = useState(false);
  const [formErr, setFormErr] = useState("");

  const [delFor, setDelFor] = useState<any | null>(null);
  const [delBusy, setDelBusy] = useState(false);

  // ---------- List ----------
  const load = useCallback(async (cursor?: string | null) => {
    if (!cursor) setLoading(true);
    else setLoadingMore(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      qs.set("limit", "24");
      if (cursor) qs.set("cursor", cursor);
      const res = await api.get(`/api/dashboard/discounts?${qs.toString()}`);
      const list = asList(res, "items", "discounts", "data");
      setItems((prev) => (cursor ? [...prev, ...list] : list));
      setNextCursor(pick(res, ["nextCursor", "after", "cursor", "next"]) ?? null);
    } catch (e: any) {
      setError(e?.message || "Couldn't load discounts.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ---------- Create / Edit ----------
  const openCreate = () => {
    setEditing(null);
    setForm(BLANK);
    setFormErr("");
    setFormOpen(true);
  };

  const openEdit = (d: any) => {
    setEditing(d);
    setForm({
      name: d.name || "",
      type: d.type === "FIXED" ? "FIXED" : "PERCENTAGE",
      value: String(d.value ?? ""),
      code: d.code || "",
      startsAt: d.startsAt ? String(d.startsAt).slice(0, 10) : "",
      endsAt: d.endsAt ? String(d.endsAt).slice(0, 10) : "",
      maxUses: d.maxUses != null ? String(d.maxUses) : "",
      perCustomerUses: d.perCustomerUses != null ? String(d.perCustomerUses) : "",
      minSubtotal: d.minSubtotal != null ? String(d.minSubtotal) : "",
      firstOrderOnly: !!d.firstOrderOnly,
      isActive: d.isActive !== false,
    });
    setFormErr("");
    setFormOpen(true);
  };

  const isCoupon = (d: any) =>
    !!d.code &&
    (d.maxUses != null ||
      d.firstOrderOnly === true ||
      d.minSubtotal != null ||
      d.perCustomerUses != null);

const submit = async () => {
  const v = parseFloat(form.value);
  if (!form.name.trim()) return setFormErr("Give the discount a name.");
  if (!isFinite(v) || v <= 0) return setFormErr("Enter a value greater than zero.");
  if (form.type === "PERCENTAGE" && v > 100) {
    return setFormErr("Percentage can't be over 100.");
  }
  if (form.startsAt && form.endsAt && form.endsAt < form.startsAt) {
    return setFormErr("End date must be after the start date.");
  }

  setFormBusy(true);
  setFormErr("");

  const payload: any = {
    name: form.name.trim(),
    type: form.type,
    value: String(v),                 // decimal string
    isActive: form.isActive,
  };

  // code
  if (editing) {
    payload.code = form.code.trim() ? form.code.trim().toUpperCase() : null;
  } else if (form.code.trim()) {
    payload.code = form.code.trim().toUpperCase();
  }

  // validity window
  payload.startsAt = form.startsAt
    ? new Date(form.startsAt + "T00:00:00.000Z").toISOString()
    : null;
  payload.endsAt = form.endsAt
    ? new Date(form.endsAt + "T23:59:59.000Z").toISOString()
    : null;

  // ⚠️ Coupon fields intentionally omitted — backend currently rejects them

  try {
    if (editing) {
      await api.put(`/api/dashboard/discounts/${editing.id}`, payload);
      toast.success("Discount updated.");
    } else {
      await api.post("/api/dashboard/discounts", payload);
      toast.success("Discount created.");
    }
    setFormOpen(false);
    load();
  } catch (e: any) {
    const msg =
      e?.code === "DISCOUNT_CODE_TAKEN"
        ? "That code is already in use."
        : e?.message || "Couldn't save the discount.";
    setFormErr(msg);
  } finally {
    setFormBusy(false);
  }
};

  // ---------- Toggle active ----------
  const toggleActive = async (d: any) => {
    try {
      const next = d.isActive === false;
      await api.put(`/api/dashboard/discounts/${d.id}`, { isActive: next });
      setItems((list) =>
        list.map((x) => (x.id === d.id ? { ...x, isActive: next } : x))
      );
      toast.success(next ? "Discount activated." : "Discount paused.");
    } catch (e: any) {
      toast.error(e?.message || "Couldn't change the discount.");
    }
  };

  // ---------- Delete ----------
  const confirmDelete = async () => {
    if (!delFor) return;
    setDelBusy(true);
    try {
      await api.del(`/api/dashboard/discounts/${delFor.id}`);
      toast.success("Discount deleted.");
      setDelFor(null);
      load();
    } catch (e: any) {
      toast.error(e?.message || "Couldn't delete the discount.");
    } finally {
      setDelBusy(false);
    }
  };

  const valueLabel = (d: any) =>
    d.type === "PERCENTAGE" ? (
      `${rawNum(d.value)}% off`
    ) : (
      <Money v={d.value} currency={currency} />
    );

  return (
    <div>
      <PageHead
        title="Discounts"
        sub="Cart-wide promos and coupon codes your customers can use at checkout."
      >
        <Button icon="plus" onClick={openCreate}>
          New discount
        </Button>
      </PageHead>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-16" />
          ))}
        </div>
      ) : error ? (
        <div className="card">
          <ErrorState message={error} onRetry={() => load()} />
        </div>
      ) : items.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="tag"
            title="No discounts yet"
            hint="Create a code like SAVE10 to hand out at the counter, or link one to a customer group for automatic discounts."
            action={
              <Button icon="plus" onClick={openCreate}>
                Create a discount
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
                  <th>Discount</th>
                  <th>Code</th>
                  <th>Value</th>
                  <th>Window</th>
                  <th>Rules</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <p className="font-bold">{d.name}</p>
                    </td>
                    <td>
                      {d.code ? (
                        <span className="rounded-md bg-cream-100 px-2 py-1 font-mono text-xs font-extrabold tracking-wider">
                          {d.code}
                        </span>
                      ) : (
                        <span className="text-ink-300">—</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap font-bold">
                      {valueLabel(d)}
                    </td>
                    <td className="whitespace-nowrap text-xs text-ink-500">
                      {d.startsAt || d.endsAt
                        ? `${fd(d.startsAt)} → ${fd(d.endsAt)}`
                        : "Evergreen"}
                    </td>
                    <td className="text-xs text-ink-500">
                      {isCoupon(d) ? (
                        <span className="flex flex-wrap gap-1">
                          <Badge tone="brand">
                            {d.maxUses ? `max ${d.maxUses}` : "coupon"}
                          </Badge>
                          {d.minSubtotal != null && (
                            <Badge tone="neutral">
                              min {rawNum(d.minSubtotal)}
                            </Badge>
                          )}
                          {d.firstOrderOnly === true && (
                            <Badge tone="neutral">1st order</Badge>
                          )}
                          {d.perCustomerUses != null && d.perCustomerUses !== 1 && (
                            <Badge tone="neutral">
                              {d.perCustomerUses}× / customer
                            </Badge>
                          )}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      <Badge
                        tone={d.isActive !== false ? "green" : "neutral"}
                      >
                        {d.isActive !== false ? "Active" : "Paused"}
                      </Badge>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-0.5">
                        <IconBtn
                          name="edit"
                          label="Edit"
                          onClick={() => openEdit(d)}
                        />
                        <IconBtn
                          name={d.isActive !== false ? "eye" : "refresh"}
                          label={d.isActive !== false ? "Pause" : "Activate"}
                          onClick={() => toggleActive(d)}
                        />
                        <IconBtn
                          name="trash"
                          label="Delete"
                          className="hover:bg-danger-100 hover:text-danger-500"
                          onClick={() => setDelFor(d)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
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

      {/* ---------- Form ---------- */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? `Edit — ${editing.name}` : "New discount"}
        sub="Applies to the whole cart at POS and storefront checkout."
        wide
        footer={
          <>
            <Button variant="ghost" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button loading={formBusy} onClick={submit} icon="check">
              {editing ? "Save changes" : "Create discount"}
            </Button>
          </>
        }
      >
        {formErr && (
          <p className="mb-3 rounded-xl bg-danger-100 px-3.5 py-2.5 text-sm font-semibold text-danger-700">
            {formErr}
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name">
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Weekend flash sale"
              autoFocus
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Type">
              <Select
                value={form.type}
                onChange={(e) =>
                  setForm({ ...form, type: e.target.value as any })
                }
              >
                <option value="PERCENTAGE">Percentage</option>
                <option value="FIXED">Fixed amount</option>
              </Select>
            </Field>
            <Field
              label={
                form.type === "PERCENTAGE"
                  ? "Percent off"
                  : `Amount off (${currency})`
              }
            >
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                placeholder="10"
              />
            </Field>
          </div>

          <Field
            label="Code"
            hint="Optional. Without a code this is a rule (e.g. group discount), not a coupon."
          >
            <Input
              value={form.code}
              onChange={(e) =>
                setForm({ ...form, code: e.target.value.toUpperCase() })
              }
              placeholder="SAVE10"
              className="font-mono uppercase"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Starts">
              <Input
                type="date"
                value={form.startsAt}
                onChange={(e) =>
                  setForm({ ...form, startsAt: e.target.value })
                }
              />
            </Field>
            <Field label="Ends">
              <Input
                type="date"
                value={form.endsAt}
                onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
              />
            </Field>
          </div>
        </div>

        {/* Coupon limits */}
        <div className="mt-5 rounded-xl border border-cream-200 p-4">
          <p className="flex items-center gap-2 text-sm font-extrabold">
            <Icon name="shield" size={15} className="text-brand-500" />
            Coupon limits
            <span className="text-xs font-semibold text-ink-400">
              — any of these turns the code into a tracked coupon
            </span>
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <Field label="Max redemptions">
              <Input
                type="number"
                min="1"
                value={form.maxUses}
                onChange={(e) =>
                  setForm({ ...form, maxUses: e.target.value })
                }
                placeholder="Unlimited"
              />
            </Field>
            <Field label="Per customer">
              <Input
                type="number"
                min="1"
                value={form.perCustomerUses}
                onChange={(e) =>
                  setForm({ ...form, perCustomerUses: e.target.value })
                }
                placeholder="1"
              />
            </Field>
            <Field label={`Min subtotal (${currency})`}>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.minSubtotal}
                onChange={(e) =>
                  setForm({ ...form, minSubtotal: e.target.value })
                }
                placeholder="None"
              />
            </Field>
          </div>
          <label className="mt-3 flex items-center gap-2 text-sm font-semibold text-ink-700">
            <input
              type="checkbox"
              checked={form.firstOrderOnly}
              onChange={(e) =>
                setForm({ ...form, firstOrderOnly: e.target.checked })
              }
              className="h-4 w-4 accent-brand-500"
            />
            First order only
          </label>
        </div>

        <div className="mt-4 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            id="disc-active"
            checked={form.isActive}
            onChange={(e) =>
              setForm({ ...form, isActive: e.target.checked })
            }
            className="h-4 w-4 accent-brand-500"
          />
          <label htmlFor="disc-active" className="font-semibold text-ink-700">
            Active
          </label>
          <span
            className={cls(
              "text-xs font-bold",
              form.isActive ? "text-leaf-600" : "text-ink-400"
            )}
          >
            {form.isActive ? "Available now" : "Paused until re-activated"}
          </span>
        </div>
      </Modal>

      <Confirm
        open={!!delFor}
        onClose={() => setDelFor(null)}
        onConfirm={confirmDelete}
        loading={delBusy}
        title={`Delete “${delFor?.name || ""}”?`}
        body="Past orders keep their recorded discount amounts. New checkouts won't be able to use this code."
        confirmLabel="Delete discount"
      />
    </div>
  );
}
import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";
import { apiErrorMessage, asList, cls } from "../lib/format";
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
  Modal,
  Money,
  Select,
  Textarea,
  Toggle,
  toast,
} from "../components/ui";

type DeliveryZoneRow = { name: string; fee: string };

/**
 * Validate + normalize a fee into a 2dp decimal string (>= 0, <= 99,999,999.99).
 * Returns null when the input isn't a clean money value.
 */
function normalizeFee(raw: string): string | null {
  const t = String(raw ?? "")
    .trim()
    .replace(/,/g, "");
  if (!t) return "0.00";
  if (!/^\d+(\.\d{1,2})?$/.test(t)) return null;
  const n = Number(t);
  if (n > 99999999.99) return null;
  return n.toFixed(2);
}

const BLANK_OPTION_FORM = {
  name: "",
  kind: "DELIVERY" as "PICKUP" | "DELIVERY",
  description: "",
  baseFee: "",
  isActive: true,
  pickupAddressText: "",
  zones: [] as DeliveryZoneRow[],
};

export default function DeliveryOptions() {
  const currency = "NGN";
  const [options, setOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({ ...BLANK_OPTION_FORM });
  const [formBusy, setFormBusy] = useState(false);
  const [formErr, setFormErr] = useState("");
  const [delFor, setDelFor] = useState<any | null>(null);
  const [delBusy, setDelBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res: any = await api.get("/api/dashboard/settings/delivery-options");
      setOptions(asList(res, "deliveryOptions", "items", "data"));
    } catch (e: any) {
      setError(e?.message || "Couldn't load delivery options.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...BLANK_OPTION_FORM });
    setFormErr("");
    setFormOpen(true);
  };

  const openEdit = (o: any) => {
    setEditing(o);
    setForm({
      name: o.name || "",
      kind: o.kind === "PICKUP" ? "PICKUP" : "DELIVERY",
      description: o.description || "",
      baseFee: o.baseFee != null ? String(o.baseFee) : "",
      isActive: o.isActive !== false,
      pickupAddressText: o.pickupAddressText || "",
      zones: (Array.isArray(o.zones) ? o.zones : []).map((z: any) => ({
        name: z?.name || "",
        fee: z?.fee != null ? String(z.fee) : "",
      })),
    });
    setFormErr("");
    setFormOpen(true);
  };

  const setZone = (index: number, patch: Partial<DeliveryZoneRow>) =>
    setForm((f) => ({
      ...f,
      zones: f.zones.map((z, i) => (i === index ? { ...z, ...patch } : z)),
    }));

  const submit = async () => {
    const name = form.name.trim();
    if (!name) return setFormErr("Give the option a name.");
    if (name.length > 200)
      return setFormErr("The name must be 200 characters or fewer.");

    const baseFee = normalizeFee(form.baseFee);
    if (baseFee === null)
      return setFormErr(
        "Base fee must be a number with at most 2 decimal places (max 99,999,999.99)."
      );

    const zones: DeliveryZoneRow[] = [];
    if (form.kind === "DELIVERY") {
      if (form.zones.length > 50)
        return setFormErr("An option can have at most 50 zones.");
      const seen = new Set<string>();
      for (const zone of form.zones) {
        const zoneName = zone.name.trim();
        if (!zoneName) return setFormErr("Every zone needs a name.");
        if (zoneName.length > 200)
          return setFormErr("Zone names must be 200 characters or fewer.");
        const key = zoneName.toLowerCase();
        if (seen.has(key))
          return setFormErr(`Duplicate zone name: “${zoneName}”.`);
        seen.add(key);
        const fee = normalizeFee(zone.fee);
        if (fee === null)
          return setFormErr(
            `Zone “${zoneName}” needs a fee with at most 2 decimal places.`
          );
        zones.push({ name: zoneName, fee });
      }
    }

    setFormBusy(true);
    setFormErr("");

    const payload: any = {
      name,
      kind: form.kind,
      description: form.description.trim() || null,
      baseFee,
      isActive: form.isActive,
      // zones always replace the full list on PUT (dropped zones are deleted);
      // PICKUP options carry none.
      zones: form.kind === "DELIVERY" ? zones : [],
      ...(form.kind === "PICKUP"
        ? { pickupAddressText: form.pickupAddressText.trim() || null }
        : {}),
    };

    try {
      if (editing) {
        await api.put(
          `/api/dashboard/settings/delivery-options/${editing.id}`,
          payload
        );
        toast.success("Delivery option updated.");
      } else {
        await api.post("/api/dashboard/settings/delivery-options", payload);
        toast.success("Delivery option created.");
      }
      setFormOpen(false);
      load();
    } catch (e: any) {
      setFormErr(
        apiErrorMessage(e, "Couldn't save the delivery option.", {
          DELIVERY_OPTION_EXISTS: "An option with that name already exists.",
          ACCESS_DENIED: "Only the store owner can manage delivery options.",
          NOT_FOUND: "That option no longer exists — the list has changed.",
        })
      );
    } finally {
      setFormBusy(false);
    }
  };

  const toggleActive = async (o: any) => {
    try {
      await api.put(`/api/dashboard/settings/delivery-options/${o.id}`, {
        isActive: o.isActive === false,
      });
      toast.success(
        o.isActive === false
          ? "Option is live on your storefront."
          : "Option hidden from your storefront."
      );
      load();
    } catch (e: any) {
      toast.error(apiErrorMessage(e, "Couldn't update the option."));
    }
  };

  const confirmDelete = async () => {
    if (!delFor) return;
    setDelBusy(true);
    try {
      await api.del(`/api/dashboard/settings/delivery-options/${delFor.id}`);
      toast.success("Delivery option deleted.");
      setDelFor(null);
      load();
    } catch (e: any) {
      toast.error(apiErrorMessage(e, "Couldn't delete the delivery option."));
    } finally {
      setDelBusy(false);
    }
  };


  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-ink-400">
          The fulfilment choices buyers pick at checkout. The fee charged is
          the base fee plus the selected zone's fee. With at least one live
          option, checkout requires a selection.
        </p>
        <Button icon="plus" onClick={openCreate}>
          New option
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-20" />
          ))}
        </div>
      ) : error ? (
        <div className="card">
          <ErrorState message={error} onRetry={load} />
        </div>
      ) : options.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="truck"
            title="No delivery options"
            hint="Add pickup or delivery choices so buyers can tell you how to get their order to them."
            action={
              <Button icon="plus" onClick={openCreate}>
                Add a delivery or pickup option
              </Button>
            }
          />
        </div>
      ) : (
        <div className="space-y-3">
          {options.map((o) => (
            <div
              key={o.id}
              className="card anim-rise flex flex-wrap items-start gap-4 p-4"
            >
              <span
                className={cls(
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                  o.kind === "PICKUP"
                    ? "bg-leaf-50 text-leaf-600"
                    : "bg-brand-50 text-brand-600"
                )}
              >
                <Icon name={o.kind === "PICKUP" ? "store" : "truck"} size={20} />
              </span>

              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 font-extrabold">
                  {o.name}
                  <Badge tone={o.kind === "PICKUP" ? "neutral" : "brand"}>
                    {o.kind === "PICKUP" ? "Pickup" : "Delivery"}
                  </Badge>
                  {o.isActive === false && <Badge tone="muted">Hidden</Badge>}
                </p>
                <p className="text-sm text-ink-400">
                  Base fee:{" "}
                  <Money v={o.baseFee || "0"} currency={currency} strong />
                  {o.description ? ` · ${o.description}` : ""}
                </p>

                {Array.isArray(o.zones) && o.zones.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {o.zones.map((z: any) => (
                      <span
                        key={z.id}
                        className="rounded-full bg-cream-100 px-2.5 py-1 text-xs font-bold text-ink-600"
                      >
                        {z.name} +<Money v={z.fee} currency={currency} />
                      </span>
                    ))}
                  </div>
                )}

                {o.kind === "PICKUP" &&
                  (o.pickupAddressText || o.pickupLocation?.address) && (
                    <p className="mt-1.5 flex items-start gap-1.5 text-xs text-ink-400">
                      <Icon name="pin" size={13} className="mt-0.5 shrink-0" />
                      {o.pickupAddressText || o.pickupLocation?.address}
                    </p>
                  )}
              </div>

              <div className="flex items-center gap-3">
                <Toggle
                  checked={o.isActive !== false}
                  onChange={() => toggleActive(o)}
                  label="Live on storefront"
                />
                <div className="flex gap-0.5">
                  <IconBtn name="edit" label="Edit" onClick={() => openEdit(o)} />
                  <IconBtn
                    name="trash"
                    label="Delete"
                    className="hover:bg-danger-100 hover:text-danger-500"
                    onClick={() => setDelFor(o)}
                  />
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? `Edit — ${editing.name}` : "New delivery option"}
        sub="Buyers pick one of these at checkout — the fee charged is the base fee plus the zone fee."
        wide
        footer={
          <>
            <Button variant="ghost" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button loading={formBusy} onClick={submit} icon="check">
              Save option
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
          <Field label="Name" hint='e.g. "Delivery rider", "Pick up at store".'>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Delivery rider"
              maxLength={200}
              autoFocus
            />
          </Field>
          <Field label="Kind">
            <Select
              value={form.kind}
              onChange={(e) =>
                setForm({ ...form, kind: e.target.value as "PICKUP" | "DELIVERY" })
              }
            >
              <option value="DELIVERY">Delivery — bring it to the buyer</option>
              <option value="PICKUP">Pickup — the buyer collects</option>
            </Select>
          </Field>
          <Field label="Base fee (NGN)" hint="Flat component — always charged.">
            <Input
              value={form.baseFee}
              onChange={(e) => setForm({ ...form, baseFee: e.target.value })}
              placeholder="0.00"
              inputMode="decimal"
            />
          </Field>
          <div className="flex items-end pb-1.5">
            <Toggle
              checked={form.isActive}
              onChange={(v) => setForm({ ...form, isActive: v })}
              label="Live on storefront"
            />
          </div>
          <Field
            label="Description"
            className="sm:col-span-2"
            hint="Optional — e.g. “2-4 working days”."
          >
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              maxLength={500}
            />
          </Field>

          {form.kind === "PICKUP" ? (
            <Field
              label="Pickup address"
              className="sm:col-span-2"
              hint="Shown to the buyer at checkout. Optional."
            >
              <Textarea
                value={form.pickupAddressText}
                onChange={(e) =>
                  setForm({ ...form, pickupAddressText: e.target.value })
                }
                rows={2}
                maxLength={500}
                placeholder="12 Marina Rd, Lagos Island — Mon–Fri, 10am–4pm"
              />
            </Field>
          ) : (
            <div className="sm:col-span-2">
              <div className="mb-1 flex items-center justify-between">
                <label className="lbl">Delivery zones</label>
                <span className="text-xs font-semibold text-ink-400">
                  {form.zones.length}/50
                </span>
              </div>
              <p className="mb-2.5 text-xs text-ink-400">
                Named areas with their own fee, added on top of the base fee.
                Saving replaces the whole list — orders already placed keep the
                fee they were charged.
              </p>
              {form.zones.length === 0 ? (
                <p className="rounded-xl border border-dashed border-cream-300 px-4 py-3 text-xs text-ink-400">
                  No zones — buyers are charged just the base fee.
                </p>
              ) : (
                <div className="space-y-2">
                  {form.zones.map((z, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Input
                        value={z.name}
                        onChange={(e) => setZone(i, { name: e.target.value })}
                        placeholder="e.g. Lekki"
                        maxLength={200}
                      />
                      <Input
                        value={z.fee}
                        onChange={(e) => setZone(i, { fee: e.target.value })}
                        placeholder="0.00"
                        inputMode="decimal"
                        className="w-28 shrink-0"
                      />
                      <IconBtn
                        name="trash"
                        label="Remove zone"
                        onClick={() =>
                          setForm((f) => ({
                            ...f,
                            zones: f.zones.filter((_, idx) => idx !== i),
                          }))
                        }
                      />
                    </div>
                  ))}
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                icon="plus"
                className="mt-2.5"
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    zones: [...f.zones, { name: "", fee: "" }],
                  }))
                }
              >
                Add zone
              </Button>
            </div>
          )}
        </div>
      </Modal>

      <Confirm
        open={!!delFor}
        onClose={() => setDelFor(null)}
        onConfirm={confirmDelete}
        loading={delBusy}
        title={`Delete “${delFor?.name || ""}”?`}
        body="Buyers can no longer choose it at checkout. Orders already placed keep the delivery name and fee they were charged."
        confirmLabel="Delete option"
      />



    </div>
  );
}

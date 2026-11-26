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
  provider: "MANUAL" as "MANUAL" | "SHIPBUBBLE",
  description: "",
  baseFee: "",
  isActive: true,
  pickupAddressText: "",
};

const BLANK_SHIPBUBBLE = { name: "", email: "", phone: "", address: "", categoryId: "", length: "", width: "", height: "" };

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
  const [shipbubble, setShipbubble] = useState({ ...BLANK_SHIPBUBBLE });
  const [shipbubbleConfigured, setShipbubbleConfigured] = useState(false);
  const [shipbubbleBusy, setShipbubbleBusy] = useState(false);
  const [shipbubbleError, setShipbubbleError] = useState("");

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

  useEffect(() => {
    api.get("/api/dashboard/settings/shipbubble").then((raw: any) => {
      const data = raw?.data || raw || {};
      setShipbubbleConfigured(Boolean(data.configured));
      setShipbubble((current) => ({ ...current, categoryId: data.categoryId ? String(data.categoryId) : "", length: data.packageDimension?.length ? String(data.packageDimension.length) : "", width: data.packageDimension?.width ? String(data.packageDimension.width) : "", height: data.packageDimension?.height ? String(data.packageDimension.height) : "" }));
    }).catch(() => {});
  }, []);

  const saveShipbubble = async () => {
    setShipbubbleError("");
    const categoryId = Number(shipbubble.categoryId);
    const dimensions = [shipbubble.length, shipbubble.width, shipbubble.height].map(Number);
    if (!shipbubble.name.trim() || !shipbubble.email.trim() || !shipbubble.phone.trim() || !shipbubble.address.trim() || !Number.isInteger(categoryId) || categoryId <= 0 || dimensions.some((n) => !Number.isFinite(n) || n <= 0)) return setShipbubbleError("Complete the pickup contact, address, category and package dimensions.");
    setShipbubbleBusy(true);
    try {
      const raw: any = await api.put("/api/dashboard/settings/shipbubble", { sender: { name: shipbubble.name.trim(), email: shipbubble.email.trim(), phone: shipbubble.phone.trim(), address: shipbubble.address.trim() }, categoryId, packageDimension: { length: dimensions[0], width: dimensions[1], height: dimensions[2] } });
      setShipbubbleConfigured(Boolean(raw?.configured ?? raw?.data?.configured ?? true));
      toast.success("Shipbubble settings saved.");
    } catch (e: any) { setShipbubbleError(apiErrorMessage(e, "Couldn't save Shipbubble settings.")); }
    finally { setShipbubbleBusy(false); }
  };

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
      provider: o.provider === "SHIPBUBBLE" ? "SHIPBUBBLE" : "MANUAL",
      description: o.description || "",
      baseFee: o.baseFee != null ? String(o.baseFee) : "",
      isActive: o.isActive !== false,
      pickupAddressText: o.pickupAddressText || "",
    });
    setFormErr("");
    setFormOpen(true);
  };

  const submit = async () => {
    const name = form.name.trim();
    if (!name) return setFormErr("Give the option a name.");
    if (name.length > 200)
      return setFormErr("The name must be 200 characters or fewer.");

    const baseFee = normalizeFee(form.baseFee);
    if (!(form.kind === "DELIVERY" && form.provider === "SHIPBUBBLE") && baseFee === null)
      return setFormErr(
        "Base fee must be a number with at most 2 decimal places (max 99,999,999.99)."
      );

    setFormBusy(true);
    setFormErr("");

    const payload: any = {
      name,
      kind: form.kind,
      provider: form.kind === "DELIVERY" ? form.provider : "MANUAL",
      description: form.description.trim() || null,
      ...(form.provider === "SHIPBUBBLE" && form.kind === "DELIVERY" ? {} : { baseFee }),
      isActive: form.isActive,
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
          Buyers choose a fulfilment option at checkout. Manual choices use a flat fee; Shipbubble choices show live courier rates. With at least one live option, checkout requires a selection.
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
                  {o.provider === "SHIPBUBBLE" ? <Badge tone="brand">Shipbubble live rates</Badge> : <>Base fee: <Money v={o.baseFee || "0"} currency={currency} strong /></>}
                  {o.description ? ` · ${o.description}` : ""}
                </p>

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

      <section className="card mb-4 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div><h2 className="font-extrabold">Shipbubble courier rates</h2><p className="mt-1 text-sm text-ink-400">Configure your store pickup contact and the default package used to request courier quotes. Your Shipbubble API key stays on the backend.</p>{shipbubbleConfigured && <p className="mt-1 text-xs text-ink-400">To update the sender address, enter the sender contact details again; the API does not return them.</p>}</div>
          {shipbubbleConfigured && <Badge tone="brand">Configured</Badge>}
        </div>
        {shipbubbleError && <p className="mb-3 rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-700">{shipbubbleError}</p>}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Input value={shipbubble.name} onChange={(e) => setShipbubble({ ...shipbubble, name: e.target.value })} placeholder="Pickup contact name" />
          <Input type="email" value={shipbubble.email} onChange={(e) => setShipbubble({ ...shipbubble, email: e.target.value })} placeholder="Contact email" />
          <Input value={shipbubble.phone} onChange={(e) => setShipbubble({ ...shipbubble, phone: e.target.value })} placeholder="Contact phone" />
          <Input value={shipbubble.address} onChange={(e) => setShipbubble({ ...shipbubble, address: e.target.value })} placeholder="Pickup address" className="sm:col-span-2" />
          <Input type="number" min="1" step="1" value={shipbubble.categoryId} onChange={(e) => setShipbubble({ ...shipbubble, categoryId: e.target.value })} placeholder="Shipbubble category ID" />
          <Input type="number" min="0.1" step="0.1" value={shipbubble.length} onChange={(e) => setShipbubble({ ...shipbubble, length: e.target.value })} placeholder="Package length (cm)" />
          <Input type="number" min="0.1" step="0.1" value={shipbubble.width} onChange={(e) => setShipbubble({ ...shipbubble, width: e.target.value })} placeholder="Package width (cm)" />
          <Input type="number" min="0.1" step="0.1" value={shipbubble.height} onChange={(e) => setShipbubble({ ...shipbubble, height: e.target.value })} placeholder="Package height (cm)" />
        </div>
        <div className="mt-3 flex justify-end"><Button loading={shipbubbleBusy} onClick={saveShipbubble}>Save Shipbubble settings</Button></div>
      </section>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? `Edit — ${editing.name}` : "New delivery option"}
        sub="Buyers pick one of these at checkout — the fee charged is the option's flat base fee."
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
          {form.kind === "DELIVERY" && <Field label="Courier provider">
            <Select value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value as "MANUAL" | "SHIPBUBBLE" })}>
              <option value="MANUAL">Manual delivery</option>
              <option value="SHIPBUBBLE">Shipbubble live courier rates</option>
            </Select>
          </Field>}
          {form.provider === "SHIPBUBBLE" && form.kind === "DELIVERY" ? <p className="rounded-lg bg-brand-50 p-3 text-sm text-brand-800 sm:col-span-2">Buyers will see courier choices and current prices after entering their delivery address. Configure Shipbubble above and add each product’s shipping weight.</p> : <Field label="Base fee (NGN)" hint="Flat component — always charged.">
            <Input
              value={form.baseFee}
              onChange={(e) => setForm({ ...form, baseFee: e.target.value })}
              placeholder="0.00"
              inputMode="decimal"
            />
          </Field>}
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

          {form.kind === "PICKUP" && (
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

// Post-create variant management for a product:
//
//   PUT    /products/:id/options                      — reconcile dimensions + regenerate the grid
//   POST   /products/:id/variants                     — add one variant outside the grid
//   PATCH  /products/:id/variants/:variantId          — rename / re-price / re-SKU
//   POST   /products/:id/variants/:variantId/archive  — retire it from the storefront
//   POST   /products/:id/variants/:variantId/restore  — un-retire it
//
// Variants are NEVER hard-deleted — order and ledger history reference them,
// so unwanted ones are archived. Every one of those routes answers with the
// full Product shape, which is handed back through `onChanged` so the caller
// renders the reconciled state instead of guessing.
import { useEffect, useState } from "react";

import { api } from "../lib/api";
import { apiErrorMessage, cls, rawNum } from "../lib/format";
import { Badge, Button, Field, Icon, IconBtn, Input, toast } from "./ui";

const MAX_VARIANTS = 50;
const MAX_OPTIONS = 2;
const MAX_OPTION_NAME = 40;
const MAX_VARIANT_NAME = 80;
const MAX_SKU = 64;
const MAX_MONEY = 99999999.99;
const MAX_STOCK = 1_000_000;

interface DimDraft {
  key: number;
  name: string;
  values: string;
}

/** Split the comma-separated value box, trimming and de-duplicating. */
function parseValues(raw: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.split(",")) {
    const v = part.trim();
    if (!v) continue;
    const k = v.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(v);
  }
  return out;
}

function productOf(res: any): any | null {
  return res?.product ?? (res && res.id ? res : null);
}

/** `null` = clear the override, `"invalid"` = rejected, number = the value. */
function validPrice(raw: string): number | null | "invalid" {
  const t = raw.trim();
  if (!t) return null;
  const n = Number(t);
  if (
    !Number.isFinite(n) ||
    n < 0 ||
    n > MAX_MONEY ||
    Math.round(n * 100) !== n * 100
  ) {
    return "invalid";
  }
  return n;
}

export default function ProductVariantsPanel({
  product,
  currency,
  onChanged,
}: {
  /** The product detail being edited (freshly fetched is best). */
  product: any;
  currency: string;
  onChanged: (next: any) => void;
}) {
  const options: any[] = Array.isArray(product?.options) ? product.options : [];
  const variants: any[] = Array.isArray(product?.variants) ? product.variants : [];

  // Re-seed the dimension drafts whenever the server's definitions change.
  const dimSig = options
    .map(
      (o: any) =>
        `${o.name}[${(o.values || []).map((v: any) => v.value).join(",")}]`
    )
    .join("|");

  const [dims, setDims] = useState<DimDraft[]>([]);
  const [dimErr, setDimErr] = useState("");
  const [dimBusy, setDimBusy] = useState(false);
  const [wipeArmed, setWipeArmed] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [nv, setNv] = useState({
    name: "",
    sellingPrice: "",
    sku: "",
    initialStock: "",
  });
  const [nvOpts, setNvOpts] = useState<Record<string, string>>({});
  const [addBusy, setAddBusy] = useState(false);
  const [addErr, setAddErr] = useState("");

  const [editId, setEditId] = useState<string | null>(null);
  const [edit, setEdit] = useState({ name: "", sellingPrice: "", sku: "" });
  const [rowBusy, setRowBusy] = useState(false);
  const [archiveArmed, setArchiveArmed] = useState<string | null>(null);

  useEffect(() => {
    setDims(
      options.map((o: any, i: number) => ({
        key: i,
        name: o.name || "",
        values: (o.values || []).map((v: any) => v.value).join(", "),
      }))
    );
    setDimErr("");
    setWipeArmed(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dimSig, product?.id]);

  const cleanDims = dims
    .map((d) => ({ name: d.name.trim(), values: parseValues(d.values) }))
    .filter((d) => d.name || d.values.length > 0);

  const gridSize = cleanDims.reduce(
    (a, d) => a * Math.max(d.values.length, 1),
    cleanDims.length ? 1 : 0
  );

  const applyProduct = (res: any) => {
    const next = productOf(res);
    if (next) onChanged(next);
  };

  /* ------------------------------ dimensions ------------------------------ */

  const saveDimensions = async () => {
    setDimErr("");

    if (cleanDims.length > MAX_OPTIONS) {
      return setDimErr(`A product can have at most ${MAX_OPTIONS} dimensions.`);
    }

    for (const d of cleanDims) {
      if (!d.name) {
        return setDimErr("Every dimension needs a name — e.g. Colour or Size.");
      }
      if (d.name.length > MAX_OPTION_NAME) {
        return setDimErr(
          `"${d.name}" is too long — dimensions are ${MAX_OPTION_NAME} characters or fewer.`
        );
      }
      if (d.values.length === 0) {
        return setDimErr(`Add at least one value for "${d.name}".`);
      }
      for (const v of d.values) {
        if (v.length > MAX_OPTION_NAME) {
          return setDimErr(
            `The value "${v}" is too long — values are ${MAX_OPTION_NAME} characters or fewer.`
          );
        }
      }
    }

    // Removing every dimension archives all variants — make that deliberate.
    if (cleanDims.length === 0 && options.length > 0 && !wipeArmed) {
      setWipeArmed(true);
      return;
    }

    if (gridSize > MAX_VARIANTS) {
      return setDimErr(
        `That grid works out at ${gridSize} variants — the limit is ${MAX_VARIANTS} per product.`
      );
    }

    setDimBusy(true);
    try {
      const res: any = await api.put(
        `/api/dashboard/products/${product.id}/options`,
        { options: cleanDims }
      );
      applyProduct(res);
      toast.success(
        cleanDims.length === 0
          ? "Dimensions removed — every variant was archived."
          : "Options saved — the variant grid was reconciled."
      );
      setWipeArmed(false);
    } catch (e: any) {
      setDimErr(
        apiErrorMessage(e, "Couldn't save the options.", {
          VARIANT_LIMIT_REACHED: `That grid would exceed ${MAX_VARIANTS} variants.`,
          VALIDATION_ERROR:
            "The server rejected those dimensions — check for empty or duplicated values.",
          NOT_FOUND: "That product no longer exists.",
        })
      );
    } finally {
      setDimBusy(false);
    }
  };

  /* -------------------------------- variants ------------------------------- */

  const addVariant = async () => {
    setAddErr("");
    const price = validPrice(nv.sellingPrice);
    if (price === "invalid") {
      return setAddErr("Enter a valid selling price with at most 2 decimals.");
    }
    if (nv.name.trim().length > MAX_VARIANT_NAME) {
      return setAddErr(`Variant names are ${MAX_VARIANT_NAME} characters or fewer.`);
    }
    if (nv.sku.trim().length > MAX_SKU) {
      return setAddErr(`SKUs are ${MAX_SKU} characters or fewer.`);
    }

    const stock = nv.initialStock.trim() ? Number(nv.initialStock) : null;
    if (
      stock != null &&
      (!Number.isInteger(stock) || stock < 1 || stock > MAX_STOCK)
    ) {
      return setAddErr(
        `Opening stock must be between 1 and ${MAX_STOCK.toLocaleString()}.`
      );
    }

    if (variants.length + 1 > MAX_VARIANTS) {
      return setAddErr(`A product can have at most ${MAX_VARIANTS} variants.`);
    }

    const optionValues = options
      .map((o: any) => ({
        option: o.name,
        value: (nvOpts[o.name] || "").trim(),
      }))
      .filter((x) => x.value);

    setAddBusy(true);
    try {
      const body: Record<string, unknown> = {};
      if (nv.name.trim()) body.name = nv.name.trim();
      if (price != null) body.sellingPrice = price;
      if (nv.sku.trim()) body.sku = nv.sku.trim();
      if (stock != null) body.initialStock = stock;
      if (optionValues.length) body.optionValues = optionValues;

      const res: any = await api.post(
        `/api/dashboard/products/${product.id}/variants`,
        body
      );
      applyProduct(res);
      toast.success("Variant added.");
      setAddOpen(false);
      setNv({ name: "", sellingPrice: "", sku: "", initialStock: "" });
      setNvOpts({});
    } catch (e: any) {
      setAddErr(
        apiErrorMessage(e, "Couldn't add the variant.", {
          VARIANT_LIMIT_REACHED: `A product can have at most ${MAX_VARIANTS} variants.`,
          NOT_FOUND: "That product no longer exists.",
        })
      );
    } finally {
      setAddBusy(false);
    }
  };

  const startEdit = (v: any) => {
    setEditId(v.id);
    setEdit({
      name: v.name || "",
      sellingPrice: v.sellingPrice != null ? String(v.sellingPrice) : "",
      sku: v.sku || "",
    });
  };

  const saveVariant = async () => {
    if (!editId) return;
    const price = validPrice(edit.sellingPrice);
    if (price === "invalid") {
      return toast.error("Enter a valid selling price with at most 2 decimals.");
    }
    setRowBusy(true);
    try {
      const res: any = await api.patch(
        `/api/dashboard/products/${product.id}/variants/${editId}`,
        {
          name: edit.name.trim() || undefined,
          // null clears the override (the variant falls back to the product price)
          sellingPrice: price,
          sku: edit.sku.trim() || null,
        }
      );
      applyProduct(res);
      toast.success("Variant updated.");
      setEditId(null);
    } catch (e: any) {
      toast.error(
        apiErrorMessage(e, "Couldn't update the variant.", {
          VARIANT_NOT_FOUND: "That variant no longer exists.",
          NOT_FOUND: "That product no longer exists.",
        })
      );
    } finally {
      setRowBusy(false);
    }
  };

  const setArchived = async (v: any, archived: boolean) => {
    setRowBusy(true);
    try {
      const res: any = await api.post(
        `/api/dashboard/products/${product.id}/variants/${v.id}/${
          archived ? "archive" : "restore"
        }`
      );
      applyProduct(res);
      toast.success(archived ? "Variant retired." : "Variant restored.");
      setArchiveArmed(null);
    } catch (e: any) {
      toast.error(
        apiErrorMessage(e, "Couldn't change the variant.", {
          VARIANT_NOT_FOUND: "That variant no longer exists.",
          NOT_FOUND: "That product no longer exists.",
        })
      );
    } finally {
      setRowBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* ------------------------------ dimensions ------------------------------ */}
      <div className="rounded-xl border border-cream-200 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-extrabold">Option dimensions</p>
            <p className="mt-0.5 text-xs text-ink-400">
              Up to {MAX_OPTIONS}. The values of each dimension are combined into
              the variant grid — Colour [Red, Blue] × Size [S, M] makes 4
              variants.
            </p>
          </div>
          <Badge tone="neutral">
            {options.length}/{MAX_OPTIONS}
          </Badge>
        </div>

        {dimErr && (
          <div className="mt-3 rounded-xl border border-danger-100 bg-danger-100/60 px-3 py-2.5 text-xs font-semibold text-danger-700">
            <Icon name="alert" size={14} className="mr-1.5 inline" />
            {dimErr}
          </div>
        )}

        {wipeArmed && (
          <div className="mt-3 rounded-xl border border-gold-200 bg-gold-100/50 px-3 py-2.5 text-xs font-semibold text-ink-700">
            Removing every dimension archives all {variants.length} variant
            {variants.length === 1 ? "" : "s"} and returns this product to a
            plain product. Their history and stock rows are kept — nothing is
            deleted. Press “Save options” again to confirm.
          </div>
        )}

        <div className="mt-3 space-y-2.5">
          {dims.map((d) => (
            <div
              key={d.key}
              className="grid items-center gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_auto]"
            >
              <Input
                value={d.name}
                maxLength={MAX_OPTION_NAME}
                placeholder="Colour"
                onChange={(e) =>
                  setDims((ds) =>
                    ds.map((x) =>
                      x.key === d.key ? { ...x, name: e.target.value } : x
                    )
                  )
                }
              />
              <Input
                value={d.values}
                placeholder="Red, Blue"
                onChange={(e) =>
                  setDims((ds) =>
                    ds.map((x) =>
                      x.key === d.key ? { ...x, values: e.target.value } : x
                    )
                  )
                }
              />
              <IconBtn
                name="trash"
                label="Remove dimension"
                onClick={() =>
                  setDims((ds) => ds.filter((x) => x.key !== d.key))
                }
              />
            </div>
          ))}

          {dims.length === 0 && (
            <p className="text-xs text-ink-400">
              No dimensions yet — add one to generate a variant grid, or add
              variants one at a time below.
            </p>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            icon="plus"
            disabled={dims.length >= MAX_OPTIONS}
            onClick={() =>
              setDims((ds) => [
                ...ds,
                { key: Date.now() + ds.length, name: "", values: "" },
              ])
            }
          >
            Add dimension
          </Button>

          <Button
            size="sm"
            loading={dimBusy}
            onClick={saveDimensions}
            icon="check"
            variant={wipeArmed ? "danger" : "primary"}
          >
            {wipeArmed ? "Yes, remove all dimensions" : "Save options"}
          </Button>

          {wipeArmed && (
            <Button size="sm" variant="ghost" onClick={() => setWipeArmed(false)}>
              Cancel
            </Button>
          )}

          {cleanDims.length > 0 && gridSize > 0 && (
            <span className="text-xs font-semibold text-ink-400">
              {gridSize} variant{gridSize === 1 ? "" : "s"} in this grid
            </span>
          )}
        </div>

        <p className="mt-2.5 text-xs text-ink-400">
          Combinations that already exist keep their price, SKU, per-branch stock
          and archive state — renaming a value keeps its variants. Combinations
          dropped from the definition are archived, never deleted, because orders
          and the stock ledger still reference them.
        </p>
      </div>

      {/* ------------------------------- variants ------------------------------- */}
      <div className="rounded-xl border border-cream-200 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-extrabold">Variants</p>
            <p className="mt-0.5 text-xs text-ink-400">
              {variants.length} of {MAX_VARIANTS} used. Each variant holds its own
              stock and can be re-priced, re-SKU&rsquo;d, retired or restored at
              any time — retiring keeps its history and stock.
            </p>
          </div>
          <Button
            size="sm"
            variant={addOpen ? "ghost" : "outline"}
            icon={addOpen ? "x" : "plus"}
            onClick={() => {
              setAddErr("");
              setAddOpen((v) => !v);
            }}
          >
            {addOpen ? "Close" : "Add variant"}
          </Button>
        </div>

        {addOpen && (
          <div className="mt-3 rounded-xl border border-cream-200 bg-cream-50 p-3">
            {addErr && (
              <div className="mb-3 rounded-lg border border-danger-100 bg-danger-100/60 px-3 py-2 text-xs font-semibold text-danger-700">
                <Icon name="alert" size={14} className="mr-1.5 inline" />
                {addErr}
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="Name"
                hint={
                  options.length
                    ? "Leave blank to derive it from the option values."
                    : "e.g. 50cl or 1 Litre"
                }
              >
                <Input
                  value={nv.name}
                  maxLength={MAX_VARIANT_NAME}
                  onChange={(e) => setNv({ ...nv, name: e.target.value })}
                  placeholder={options.length ? "Red / M" : "1 Litre"}
                />
              </Field>

              <Field
                label={`Selling price (${currency})`}
                hint="Blank falls back to the product price."
              >
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={nv.sellingPrice}
                  onChange={(e) =>
                    setNv({ ...nv, sellingPrice: e.target.value })
                  }
                  placeholder="0.00"
                />
              </Field>

              <Field label="SKU" hint={`Up to ${MAX_SKU} characters.`}>
                <Input
                  value={nv.sku}
                  maxLength={MAX_SKU}
                  onChange={(e) => setNv({ ...nv, sku: e.target.value })}
                  placeholder="AGB-001-RED-M"
                />
              </Field>

              <Field
                label="Opening stock"
                hint={`Optional, 1–${MAX_STOCK.toLocaleString()}. Stock only ever moves through the stock ledger.`}
              >
                <Input
                  type="number"
                  min="1"
                  step="1"
                  value={nv.initialStock}
                  onChange={(e) =>
                    setNv({ ...nv, initialStock: e.target.value })
                  }
                  placeholder="e.g. 20"
                />
              </Field>
            </div>

            {options.length > 0 && (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {options.map((o: any) => (
                  <Field
                    key={o.id || o.name}
                    label={o.name}
                    hint={`Existing values: ${(o.values || [])
                      .map((v: any) => v.value)
                      .join(", ")} — a new one is created if you type it.`}
                  >
                    <Input
                      list={`variant-opt-${o.id || o.name}`}
                      value={nvOpts[o.name] || ""}
                      onChange={(e) =>
                        setNvOpts({ ...nvOpts, [o.name]: e.target.value })
                      }
                      placeholder={(o.values || [])[0]?.value || "Value"}
                    />
                    <datalist id={`variant-opt-${o.id || o.name}`}>
                      {(o.values || []).map((v: any) => (
                        <option key={v.id || v.value} value={v.value} />
                      ))}
                    </datalist>
                  </Field>
                ))}
              </div>
            )}

            <div className="mt-3 flex justify-end">
              <Button size="sm" loading={addBusy} onClick={addVariant} icon="check">
                Add variant
              </Button>
            </div>
          </div>
        )}

        <div className="mt-3 space-y-2">
          {variants.length === 0 && (
            <p className="rounded-xl border border-dashed border-cream-300 px-3 py-4 text-center text-xs font-semibold text-ink-400">
              No variants yet. Add one above, or define option dimensions to
              generate the grid automatically.
            </p>
          )}

          {variants.map((v: any) => {
            const archived = !!v.archivedAt;
            const vOpts: any[] = Array.isArray(v.options) ? v.options : [];

            return (
              <div
                key={v.id}
                className={cls(
                  "rounded-xl border px-3 py-3",
                  archived
                    ? "border-cream-200 bg-cream-50"
                    : "border-cream-200 bg-white"
                )}
              >
                {editId === v.id ? (
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Field label="Name">
                      <Input
                        value={edit.name}
                        maxLength={MAX_VARIANT_NAME}
                        onChange={(e) =>
                          setEdit({ ...edit, name: e.target.value })
                        }
                      />
                    </Field>
                    <Field
                      label={`Price (${currency})`}
                      hint="Blank uses the product price."
                    >
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={edit.sellingPrice}
                        onChange={(e) =>
                          setEdit({ ...edit, sellingPrice: e.target.value })
                        }
                      />
                    </Field>
                    <Field label="SKU">
                      <Input
                        value={edit.sku}
                        maxLength={MAX_SKU}
                        onChange={(e) =>
                          setEdit({ ...edit, sku: e.target.value })
                        }
                      />
                    </Field>
                    <div className="flex flex-wrap items-center gap-2 sm:col-span-3">
                      <Button
                        size="sm"
                        loading={rowBusy}
                        onClick={saveVariant}
                        icon="check"
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditId(null)}
                      >
                        Cancel
                      </Button>
                      <span className="text-xs text-ink-400">
                        Option values aren&rsquo;t editable here — change them
                        through the dimensions above.
                      </span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center gap-2">
                      <p
                        className={cls(
                          "text-sm font-bold",
                          archived && "text-ink-400"
                        )}
                      >
                        {v.name}
                      </p>
                      {archived && <Badge tone="muted">Archived</Badge>}
                      {vOpts.map((o: any, i: number) => (
                        <span
                          key={`${o.name}-${o.value}-${i}`}
                          className="rounded-full bg-cream-100 px-2 py-0.5 text-[11px] font-bold text-ink-500"
                        >
                          {o.name}: {o.value}
                        </span>
                      ))}
                    </div>

                    <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-500">
                      <span>{v.sku || "No SKU"}</span>
                      <span className="font-bold tabular-nums">
                        {rawNum(v.quantity).toLocaleString()} in stock
                      </span>
                      <span>
                        {v.sellingPrice != null
                          ? `${currency} ${v.sellingPrice}`
                          : "Uses the product price"}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        icon="edit"
                        onClick={() => startEdit(v)}
                      >
                        Edit
                      </Button>

                      {archived ? (
                        <Button
                          size="sm"
                          variant="outline"
                          icon="refresh"
                          loading={rowBusy}
                          onClick={() => setArchived(v, false)}
                        >
                          Restore
                        </Button>
                      ) : archiveArmed === v.id ? (
                        <>
                          <Button
                            size="sm"
                            variant="danger"
                            loading={rowBusy}
                            onClick={() => setArchived(v, true)}
                          >
                            Confirm retire
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setArchiveArmed(null)}
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setArchiveArmed(v.id)}
                        >
                          Retire
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        <p className="mt-3 text-xs text-ink-400">
          Stock is never edited here — use <strong>Adjust stock</strong> so the
          movement goes through the stock ledger with a reason (and stays
          per-branch).
        </p>
      </div>
    </div>
  );
}
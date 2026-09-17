// Signed stock movement — the ONLY approved way to change stock
// (`POST /api/dashboard/products/:productId/stock-adjustments`).
//
// Stock is per-branch: every movement names the branch it happens in and the
// ledger row records it. `SALE` is deliberately not offered here — sale
// movements originate exclusively from order fulfillment, so a `SALE` entry
// in the ledger can always be trusted to correspond to a real order.
//
// Variant rules mirror the contract: a product with variants has no
// product-level stock, so a variant MUST be named — and archived variants
// stay adjustable (they still hold real stock and need write-offs).
import { useEffect, useMemo, useState } from "react";

import { api } from "../lib/api";
import { apiErrorMessage, rawNum, titleCase } from "../lib/format";
import { Button, Field, Icon, Input, Modal, Select, toast } from "./ui";

const REASONS = ["MANUAL_ADJUSTMENT", "RESTOCK", "REFUND", "WRITE_OFF"] as const;
type Reason = (typeof REASONS)[number];

const REASON_HINT: Record<Reason, string> = {
  MANUAL_ADJUSTMENT: "Correcting the count after a physical stock take.",
  RESTOCK: "Stock arriving outside a purchase order.",
  REFUND: "Goods a customer brought back, going onto the shelf again.",
  WRITE_OFF: "Damaged, expired or lost stock leaving the shelf.",
};

const MAX_QTY = 1_000_000;

function defaultBranchId(branches: any[]): string {
  return branches.find((b: any) => b.isDefault)?.id || branches[0]?.id || "";
}

export default function StockAdjustModal({
  open,
  onClose,
  product,
  branches,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  /** The product being adjusted — a list row or a freshly fetched detail. */
  product: any | null;
  /** The store's branches (`GET /api/dashboard/branches`). */
  branches: any[];
  onDone?: (result: any) => void;
}) {
  const [branchId, setBranchId] = useState("");
  const [variantId, setVariantId] = useState("");
  const [mode, setMode] = useState<"add" | "remove">("add");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState<Reason>("MANUAL_ADJUSTMENT");
  const [referenceId, setReferenceId] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const variants: any[] = useMemo(
    () => (Array.isArray(product?.variants) ? product.variants : []),
    [product]
  );
  const hasVariants = variants.length > 0;

  // Reset the whole form each time the modal opens for a product.
  useEffect(() => {
    if (!open) return;
    setBranchId(defaultBranchId(branches));
    setVariantId("");
    setMode("add");
    setAmount("");
    setReason("MANUAL_ADJUSTMENT");
    setReferenceId("");
    setErr("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, product?.id]);

  // Branches usually arrive with the catalog; backfill the default if the
  // modal was opened before they landed.
  useEffect(() => {
    if (open && !branchId && branches.length > 0) {
      setBranchId(defaultBranchId(branches));
    }
  }, [open, branchId, branches]);

  const selectedVariant = variants.find((v: any) => v.id === variantId) || null;
  const currentQty = hasVariants
    ? rawNum(selectedVariant?.quantity)
    : rawNum(product?.quantity);
  const targetPicked = !hasVariants || !!variantId;
  const signed = (parseInt(amount, 10) || 0) * (mode === "remove" ? -1 : 1);

  const submit = async () => {
    if (!product?.id) return;
    if (!branchId) return setErr("Pick the branch this movement happens in.");

    const abs = parseInt(amount, 10);
    if (!Number.isInteger(abs) || abs < 1 || abs > MAX_QTY) {
      return setErr(
        `Enter a whole number between 1 and ${MAX_QTY.toLocaleString()}.`
      );
    }
    if (hasVariants && !variantId) {
      return setErr(
        "This product has variants, so it has no product-level stock — pick the variant that moved."
      );
    }

    setBusy(true);
    setErr("");
    try {
      const body: Record<string, unknown> = {
        branchId,
        quantityChange: signed,
        reason,
      };
      if (hasVariants) body.variantId = variantId;
      if (referenceId.trim()) body.referenceId = referenceId.trim();

      const res: any = await api.post(
        `/api/dashboard/products/${product.id}/stock-adjustments`,
        body
      );

      // `branchStockAfter` is the authoritative figure — always report it
      // rather than the client's own arithmetic.
      toast.success(
        `Stock updated — that branch now holds ${rawNum(
          res?.branchStockAfter
        ).toLocaleString()}.`
      );
      onDone?.(res);
      onClose();
    } catch (e: any) {
      setErr(
        apiErrorMessage(e, "Couldn't adjust the stock.", {
          INSUFFICIENT_STOCK:
            "That would drive the branch's stock below zero, so nothing was changed.",
          VARIANT_REQUIRED:
            "This product has variants — pick the variant that moved.",
          INVALID_STOCK_REASON:
            "That reason can't be used here. Sales only enter stock through the order flow.",
          BRANCH_NOT_FOUND: "That branch no longer exists.",
          VARIANT_NOT_FOUND: "That variant no longer exists.",
          NOT_FOUND: "That product no longer exists.",
        })
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Adjust stock"
      sub={product?.name}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            loading={busy}
            onClick={submit}
            icon={mode === "remove" ? "minus" : "plus"}
            variant={mode === "remove" ? "danger" : "primary"}
          >
            {mode === "remove" ? "Remove stock" : "Add stock"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {err && (
          <div className="rounded-xl border border-danger-100 bg-danger-100/60 px-3.5 py-3 text-sm font-semibold text-danger-700">
            <Icon name="alert" size={16} className="mr-2 inline" />
            {err}
          </div>
        )}

        <div className="rounded-xl border border-cream-200 bg-cream-50 px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-wide text-ink-400">
            {hasVariants
              ? selectedVariant?.name || "No variant picked yet"
              : "Product stock"}
          </p>
          <p className="mt-1 font-display text-xl font-extrabold tabular-nums">
            {currentQty.toLocaleString()}
            <span className="ml-2 text-xs font-bold text-ink-400">
              {hasVariants ? "in this variant" : "cached product total"}
            </span>
          </p>
          <p className="mt-1 text-xs text-ink-400">
            Stock is tracked per branch — the number this changes is the named
            branch&rsquo;s own count, and the server returns it after the move.
          </p>
        </div>

        <Field label="Branch">
          <Select value={branchId} onChange={(e) => setBranchId(e.target.value)}>
            {branches.length === 0 && <option value="">No branches yet</option>}
            {branches.map((b: any) => (
              <option key={b.id} value={b.id}>
                {b.name}
                {b.isDefault ? " (default)" : ""}
              </option>
            ))}
          </Select>
        </Field>

        {hasVariants && (
          <Field
            label="Variant"
            hint="Retired (archived) variants still hold real stock, so they can still be adjusted — e.g. to write stock off."
          >
            <Select
              value={variantId}
              onChange={(e) => setVariantId(e.target.value)}
            >
              <option value="">Pick a variant…</option>
              {variants.map((v: any) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                  {v.archivedAt ? " (archived)" : ""} ·{" "}
                  {rawNum(v.quantity).toLocaleString()} in stock
                </option>
              ))}
            </Select>
          </Field>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Direction">
            <div className="flex gap-2">
              <Button
                variant={mode === "add" ? "success" : "outline"}
                icon="plus"
                onClick={() => setMode("add")}
                className="flex-1"
              >
                Add
              </Button>
              <Button
                variant={mode === "remove" ? "danger" : "outline"}
                icon="minus"
                onClick={() => setMode("remove")}
                className="flex-1"
              >
                Remove
              </Button>
            </div>
          </Field>

          <Field label="Quantity" hint={`1 – ${MAX_QTY.toLocaleString()}`}>
            <Input
              type="number"
              min="1"
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 12"
            />
          </Field>
        </div>

        {signed !== 0 && branchId && targetPicked && (
          <p className="text-xs font-semibold text-ink-500">
            {mode === "add" ? "Adding" : "Removing"}{" "}
            {Math.abs(signed).toLocaleString()} → about{" "}
            {(currentQty + signed).toLocaleString()}
            <span className="text-ink-400">
              {" "}
              (the exact per-branch figure is returned by the server)
            </span>
          </p>
        )}

        <Field label="Reason" hint={REASON_HINT[reason]}>
          <Select
            value={reason}
            onChange={(e) => setReason(e.target.value as Reason)}
          >
            {REASONS.map((r) => (
              <option key={r} value={r}>
                {titleCase(r)}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="Reference"
          hint="Optional — a free-form pointer to whatever caused this, e.g. a purchase order id or a note."
        >
          <Input
            value={referenceId}
            onChange={(e) => setReferenceId(e.target.value)}
            placeholder="Optional"
          />
        </Field>
      </div>
    </Modal>
  );
}
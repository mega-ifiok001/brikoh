import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { asList, fd } from "../lib/format";
import {
  Badge,
  Button,
  Confirm,
  EmptyState,
  ErrorState,
  Field,
  Input,
  Modal,
  PageHead,
  Select,
  toast,
} from "../components/ui";

export default function Branches() {
  const { me } = useAuth();

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Detail
  const [detail, setDetail] = useState<any | null>(null);

  // Create / Edit
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({ name: "", address: "" });
  const [formBusy, setFormBusy] = useState(false);
  const [formErr, setFormErr] = useState("");

  // Delete
  const [delFor, setDelFor] = useState<any | null>(null);
  const [delBusy, setDelBusy] = useState(false);

  // Transfer
  const [transferOpen, setTransferOpen] = useState(false);
  const [tFrom, setTFrom] = useState("");
  const [tTo, setTTo] = useState("");
  const [tProductId, setTProductId] = useState("");
  const [tVariantId, setTVariantId] = useState("");
  const [tQty, setTQty] = useState("1");
  const [tBusy, setTBusy] = useState(false);
  const [tErr, setTErr] = useState("");
  const [products, setProducts] = useState<any[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/api/dashboard/branches");
      setItems(asList(res, "items", "branches", "data"));
    } catch (e: any) {
      setError(e?.message || "Couldn't load branches.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const isDefaultBranch = (b: any) =>
    !!b && (b.isDefault === true || b.id === me.store?.defaultBranchId);

  // ---------- Detail ----------
  const openDetail = async (b: any) => {
    setDetail(b);
    try {
      const res = await api.get(`/api/dashboard/branches/${b.id}`);
      setDetail(res?.branch ?? res ?? b);
    } catch {
      // keep list row data
    }
  };

  // ---------- Create / Edit ----------
  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", address: "" });
    setFormErr("");
    setFormOpen(true);
  };

  const openEdit = (b: any) => {
    setEditing(b);
    setForm({ name: b.name || "", address: b.address || "" });
    setFormErr("");
    setFormOpen(true);
  };

  const submit = async () => {
    if (!form.name.trim()) return setFormErr("Branch name is required.");
    setFormBusy(true);
    setFormErr("");
    try {
      const payload = {
        name: form.name.trim(),
        address: form.address.trim() || null,
      };
      if (editing) {
        await api.patch(`/api/dashboard/branches/${editing.id}`, payload);
        toast.success("Branch updated.");
      } else {
        await api.post("/api/dashboard/branches", payload);
        toast.success("Branch added.");
      }
      setFormOpen(false);
      await load();
      if (editing && detail?.id === editing.id) {
        setDetail((d: any) => (d ? { ...d, ...payload } : d));
      }
    } catch (e: any) {
      setFormErr(e?.message || "Couldn't save the branch.");
    } finally {
      setFormBusy(false);
    }
  };

  // ---------- Set default ----------
  const setDefault = async (b: any) => {
    try {
      await api.put(`/api/dashboard/branches/${b.id}/default`);
      toast.success(`${b.name} is now your default branch.`);
      await load();
      if (detail?.id === b.id) {
        setDetail((d: any) => (d ? { ...d, isDefault: true } : d));
      }
    } catch (e: any) {
      toast.error(e?.message || "Couldn't change the default branch.");
    }
  };

  // ---------- Delete ----------
  const confirmDelete = async () => {
    if (!delFor) return;
    setDelBusy(true);
    try {
      await api.del(`/api/dashboard/branches/${delFor.id}`);
      toast.success("Branch deleted.");
      if (detail?.id === delFor.id) setDetail(null);
      setDelFor(null);
      load();
    } catch (e: any) {
      const msg =
        e?.code === "DEFAULT_BRANCH"
          ? "You can't delete the default branch. Make another branch default first."
          : e?.code === "BRANCH_HAS_STOCK"
          ? "This branch still holds stock. Transfer everything out first."
          : e?.code === "BRANCH_HAS_ORDERS"
          ? "This branch has order history and can't be deleted."
          : e?.message ||
            "Couldn't delete the branch. It may still hold stock or have orders.";
      toast.error(msg);
    } finally {
      setDelBusy(false);
    }
  };

  // ---------- Transfer ----------
  const openTransfer = (fromBranchId?: string) => {
    if (items.length < 2) {
      toast.info("You need at least two branches to transfer stock.");
      return;
    }
    const from =
      items.find((b) => b.id === fromBranchId) ||
      items.find((b) => isDefaultBranch(b)) ||
      items[0];
    const other = items.find((b) => b.id !== from?.id) || items[0];
    setTFrom(from?.id || "");
    setTTo(other?.id || "");
    setTProductId("");
    setTVariantId("");
    setTQty("1");
    setTErr("");
    setTransferOpen(true);

    api
      .get("/api/dashboard/products?limit=100")
      .then((res) => setProducts(asList(res, "products", "items", "data")))
      .catch(() => setProducts([]));
  };

  const tProduct = products.find((p) => p.id === tProductId);

  const submitTransfer = async () => {
    const qty = parseInt(tQty, 10) || 0;
    if (!tProductId) return setTErr("Pick the product to move.");
    if (qty < 1) return setTErr("Quantity must be at least 1.");
    if (tFrom === tTo) return setTErr("Source and destination must be different.");
    if (tProduct?.variants?.length && !tVariantId) {
      return setTErr("This product has variants — pick one.");
    }

    setTBusy(true);
    setTErr("");
    try {
      await api.post("/api/dashboard/branches/transfers", {
        productId: tProductId,
        variantId: tVariantId || undefined,
        sourceBranchId: tFrom,
        destinationBranchId: tTo,
        quantity: qty,
      });
      toast.success(
        `Moved ${qty} × ${tProduct?.name || "product"} to ${
          items.find((b) => b.id === tTo)?.name
        }.`
      );
      setTransferOpen(false);
      load();
    } catch (e: any) {
      setTErr(e?.message || "Couldn't record the transfer.");
    } finally {
      setTBusy(false);
    }
  };

  return (
    <div>
      <PageHead
        title="Branches"
        sub="Shops, warehouses and stalls where your stock lives. Checkout and new product stock use the default branch."
      >
        <Button variant="outline" icon="refresh" onClick={() => openTransfer()}>
          Transfer stock
        </Button>
        <Button icon="plus" onClick={openCreate}>
          New branch
        </Button>
      </PageHead>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-16" />
          ))}
        </div>
      ) : error ? (
        <div className="card">
          <ErrorState message={error} onRetry={load} />
        </div>
      ) : items.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="building"
            title="No branches"
            hint="Every store starts with a Main Branch. Add more locations to track stock separately."
            action={
              <Button icon="plus" onClick={openCreate}>
                Add a branch
              </Button>
            }
          />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((b) => {
            const isDef = isDefaultBranch(b);
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => openDetail(b)}
                className="card anim-rise p-5 text-left transition hover:ring-2 hover:ring-brand-200 focus:outline-none focus:ring-2 focus:ring-brand-400"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                      {isDef ? <IconDefaultBranch /> : <IconBranch />}
                    </span>
                    <div>
                      <p className="flex items-center gap-2 font-display text-lg font-extrabold">
                        {b.name}
                        {isDef && <Badge tone="dark">Default</Badge>}
                      </p>
                      <p className="text-sm text-ink-400">
                        {b.address || "No address set"}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-ink-300">View →</span>
                </div>
                <p className="mt-3 text-xs text-ink-300">
                  Added {fd(b.createdAt)}
                </p>
              </button>
            );
          })}
        </div>
      )}

      {/* ---------- Detail ---------- */}
      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail?.name || "Branch"}
        sub={
          isDefaultBranch(detail)
            ? "Default branch — checkout and new product stock land here."
            : "Stock location for this store."
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setDetail(null)}>
              Close
            </Button>
            <Button
              variant="outline"
              icon="refresh"
              onClick={() => {
                const id = detail?.id;
                setDetail(null);
                openTransfer(id);
              }}
            >
              Transfer from here
            </Button>
            <Button icon="edit" onClick={() => openEdit(detail)}>
              Edit
            </Button>
          </>
        }
      >
        {detail && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {isDefaultBranch(detail) ? (
                <Badge tone="dark">Default branch</Badge>
              ) : (
                <Badge tone="muted">Secondary branch</Badge>
              )}
            </div>

            <div className="rounded-xl bg-cream-100 px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-wide text-ink-400">
                Address
              </p>
              <p className="mt-1 font-semibold text-ink-800">
                {detail.address || "No address set"}
              </p>
              <p className="mt-1 text-xs text-ink-400">
                Created {fd(detail.createdAt)}
                {detail.updatedAt ? ` · Updated ${fd(detail.updatedAt)}` : ""}
              </p>
            </div>

            <div className="rounded-xl border border-ink-100 px-4 py-3 text-sm text-ink-600">
              <p className="font-bold text-ink-800">About this branch</p>
              <ul className="mt-2 list-disc space-y-1 pl-4">
                <li>
                  Stock transferred here can be sold from this location.
                </li>
                {isDefaultBranch(detail) ? (
                  <li>
                    <strong>Default</strong> — online checkout and new product
                    opening stock use this branch automatically.
                  </li>
                ) : (
                  <li>
                    Not the default. Use <strong>Make default</strong> if you
                    want sales and new stock to land here.
                  </li>
                )}
                <li>
                  You can’t delete a branch that still holds stock or has past
                  orders — transfer stock out first.
                </li>
              </ul>
            </div>

            <div className="flex flex-wrap gap-2 border-t border-ink-50 pt-4">
              {!isDefaultBranch(detail) && (
                <Button variant="outline" onClick={() => setDefault(detail)}>
                  Make default
                </Button>
              )}
              <Button
                variant="outline"
                icon="edit"
                onClick={() => openEdit(detail)}
              >
                Edit name / address
              </Button>
              <Button
                variant="ghost"
                className="text-danger-600 hover:bg-danger-100"
                onClick={() => setDelFor(detail)}
              >
                Delete branch
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ---------- Create / Edit ---------- */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? `Edit — ${editing.name}` : "New branch"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button loading={formBusy} onClick={submit} icon="check">
              Save branch
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
              placeholder="e.g. Balogun Market Stall"
              autoFocus
            />
          </Field>
          <Field label="Address" hint="Optional — helps staff know which location.">
            <Input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Street, town"
            />
          </Field>
        </div>
      </Modal>

      {/* ---------- Transfer ---------- */}
      <Modal
        open={transferOpen}
        onClose={() => setTransferOpen(false)}
        title="Transfer stock"
        sub="Moves quantity between branches in one step. Source stock can never go negative."
        footer={
          <>
            <Button variant="ghost" onClick={() => setTransferOpen(false)}>
              Cancel
            </Button>
            <Button loading={tBusy} onClick={submitTransfer} icon="refresh">
              Move stock
            </Button>
          </>
        }
      >
        {tErr && (
          <p className="mb-3 rounded-xl bg-danger-100 px-3.5 py-2.5 text-sm font-semibold text-danger-700">
            {tErr}
          </p>
        )}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="From">
              <Select value={tFrom} onChange={(e) => setTFrom(e.target.value)}>
                {items.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="To">
              <Select value={tTo} onChange={(e) => setTTo(e.target.value)}>
                {items.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label="Product">
            <Select
              value={tProductId}
              onChange={(e) => {
                setTProductId(e.target.value);
                setTVariantId("");
              }}
            >
              <option value="">Choose a product…</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </Field>

          {tProduct?.variants?.length > 0 && (
            <Field label="Variant">
              <Select
                value={tVariantId}
                onChange={(e) => setTVariantId(e.target.value)}
              >
                <option value="">Choose variant…</option>
                {tProduct.variants.map((v: any) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </Select>
            </Field>
          )}

          <Field label="Quantity">
            <Input
              type="number"
              min="1"
              value={tQty}
              onChange={(e) => setTQty(e.target.value)}
            />
          </Field>
        </div>
      </Modal>

      {/* ---------- Delete confirm ---------- */}
      <Confirm
        open={!!delFor}
        onClose={() => setDelFor(null)}
        onConfirm={confirmDelete}
        loading={delBusy}
        title={`Delete “${delFor?.name || ""}”?`}
        body="The default branch can’t be deleted. A branch that still holds stock or has order history must be emptied first."
        confirmLabel="Delete branch"
      />
    </div>
  );
}

function IconBranch() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 21V5.5L12 3l8 2.5V21" />
      <path d="M2 21h20M9 9h.01M15 9h.01M9 13h.01M15 13h.01M10 21v-4h4v4" />
    </svg>
  );
}

function IconDefaultBranch() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 9.5 5.5 4h13L20 9.5M4.5 9.5V20h15V9.5" />
      <path d="M9.5 20v-6h5v6M2.8 9.5h18.4" />
    </svg>
  );
}
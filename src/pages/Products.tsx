import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
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
  SearchInput,
  Select,
  StatusBadge,
  Textarea,
  Thumb,
  toast,
} from "../components/ui";

const PAGE = 24;

interface VariantRow {
  key: number;
  name: string;
  sellingPrice: string;
  sku: string;
  stock: string;
}

interface FormState {
  name: string;
  sku: string;
  price: string;
  costPrice: string;
  discountPrice: string;
  description: string;
  categoryId: string;
  unitId: string;
  status: string;
  lowStockThreshold: string;
  expiryDate: string;
  initialStock: string;
  images: string[];
  variantRows: VariantRow[];
}

const BLANK: FormState = {
  name: "",
  sku: "",
  price: "",
  costPrice: "",
  discountPrice: "",
  description: "",
  categoryId: "",
  unitId: "",
  status: "DRAFT",
  lowStockThreshold: "",
  expiryDate: "",
  initialStock: "",
  images: [],
  variantRows: [],
};

export default function Products() {
  const { me } = useAuth();
  const store = me.store || {};
  const currency: string = store.currency || "NGN";
  const [params, setParams] = useSearchParams();

  const [items, setItems] = useState<any[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [qDeb, setQDeb] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [statusF, setStatusF] = useState("ALL");

  const [cats, setCats] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<FormState>(BLANK);
  const [formBusy, setFormBusy] = useState(false);
  const [formErr, setFormErr] = useState("");
  const [newCat, setNewCat] = useState("");
  const [newUnit, setNewUnit] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [stockFor, setStockFor] = useState<any | null>(null);
  const [delFor, setDelFor] = useState<any | null>(null);
  const [delBusy, setDelBusy] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setQDeb(q), 350);
    return () => clearTimeout(t);
  }, [q]);

  const loadCatalog = useCallback(async () => {
    try {
      const res = await api.get("/api/dashboard/categories");
      setCats(asList(res, "categories", "items", "data"));
    } catch {
      /* optional */
    }
    try {
      const res = await api.get("/api/dashboard/units");
      setUnits(asList(res, "units", "items", "data"));
    } catch {
      /* optional */
    }
  }, []);

  const load = useCallback(
    async (cursor?: string | null) => {
      if (!cursor) setLoading(true);
      else setLoadingMore(true);
      setError(null);
      try {
        const qs = new URLSearchParams();
        qs.set("limit", String(PAGE));
        if (qDeb.trim()) qs.set("search", qDeb.trim());
        if (categoryId) qs.set("categoryId", categoryId);
        if (statusF !== "ALL") qs.set("status", statusF);
        if (cursor) qs.set("cursor", cursor);
        const res = await api.get(`/api/dashboard/products?${qs.toString()}`);
        const list = asList(res, "products", "items", "data");
        setItems((prev) => (cursor ? [...prev, ...list] : list));
        setNextCursor(pick(res, ["nextCursor", "after", "cursor", "next"]) ?? null);
      } catch (e: any) {
        setError(e?.message || "Couldn't load products.");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [qDeb, categoryId, statusF]
  );

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  // ?new=1 opens the create form (from Overview quick actions)
  useEffect(() => {
    if (params.get("new") === "1") {
      openCreate();
      params.delete("new");
      setParams(params, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const openCreate = () => {
    setEditing(null);
    setForm(BLANK);
    setFormErr("");
    setFormOpen(true);
  };

  const openEdit = (x: any) => {
    setEditing(x);
    setForm({
      name: x.name || "",
      sku: x.sku || "",
      price: String(x.price ?? ""),
      costPrice: x.costPrice != null ? String(x.costPrice) : "",
      discountPrice: x.discountPrice != null ? String(x.discountPrice) : "",
      description: x.description || "",
      categoryId: x.categoryId || x.category?.id || "",
      unitId: x.unitId || x.unit?.id || "",
      status: x.status || "DRAFT",
      lowStockThreshold: x.lowStockThreshold != null ? String(x.lowStockThreshold) : "",
      expiryDate: x.expiryDate ? String(x.expiryDate).slice(0, 10) : "",
      initialStock: "",
      images: x.images && x.images.length ? [...x.images] : x.coverImageUrl ? [x.coverImageUrl] : [],
      variantRows: (x.variants || []).map((v: any, i: number) => ({
        key: i,
        name: v.name || "",
        sellingPrice: v.sellingPrice != null ? String(v.sellingPrice) : "",
        sku: v.sku || "",
        stock: v.quantity != null ? String(v.quantity) : "",
      })),
    });
    setFormErr("");
    setFormOpen(true);
  };

  const submitForm = async () => {
    setFormErr("");
    if (!form.name.trim()) return setFormErr("Give the product a name.");
    const price = parseFloat(form.price);
    if (!isFinite(price) || price <= 0) return setFormErr("Enter a selling price greater than zero.");
    const dp = form.discountPrice ? parseFloat(form.discountPrice) : null;
    if (dp != null && (isNaN(dp) || dp >= price)) return setFormErr("Discount price must be lower than the price.");

    // Handle inline category / unit creation
    let categoryId = form.categoryId;
    let unitId = form.unitId;
    setFormBusy(true);
    try {
      if (categoryId === "__new") {
        if (!newCat.trim()) return setFormErr("Name the new category, or pick an existing one.");
        const res = await api.post("/api/dashboard/categories", { name: newCat.trim() });
        categoryId = pick(res, ["id"]) || res?.category?.id || res?.data?.id || "";
        if (!categoryId) return setFormErr("Couldn't create that category.");
        await loadCatalog();
      }
      if (unitId === "__new") {
        if (!newUnit.trim()) return setFormErr("Name the new unit, or pick an existing one.");
        const res = await api.post("/api/dashboard/units", { name: newUnit.trim() });
        unitId = pick(res, ["id"]) || res?.unit?.id || res?.data?.id || "";
        if (!unitId) return setFormErr("Couldn't create that unit.");
        await loadCatalog();
      }

    const payload: any = {
  name: form.name.trim(),
  sku: form.sku.trim() || undefined,
  price,
  costPrice: form.costPrice ? parseFloat(form.costPrice) : undefined,
  discountPrice: dp ?? undefined,
  description: form.description.trim() || undefined,
  categoryId: categoryId || undefined,
  unitId: unitId || undefined,
  // status is NOT allowed on create
  lowStockThreshold: form.lowStockThreshold
    ? parseInt(form.lowStockThreshold, 10)
    : undefined,
  expiryDate: form.expiryDate
    ? new Date(form.expiryDate + "T00:00:00").toISOString()
    : undefined,
  images: form.images.length ? form.images : undefined,
  coverImageUrl: form.images[0] || undefined,
};

if (editing) {
  // status is only allowed on update
  payload.status = form.status;
}

const vRows = form.variantRows.filter((v) => v.name.trim());
if (vRows.length) {
  payload.variants = vRows.map((v) => ({
    name: v.name.trim(),
    sellingPrice: v.sellingPrice ? parseFloat(v.sellingPrice) : undefined,
    sku: v.sku.trim() || undefined,
    ...(editing ? {} : { quantity: parseInt(v.stock, 10) || 0 }),
  }));
}

if (editing) {
  await api.patch(`/api/dashboard/products/${editing.id}`, payload);  // ← was put
  toast.success("Product updated.");
} else {
  // create stays POST
  payload.initialStock = parseInt(form.initialStock, 10) || 0;
  await api.post("/api/dashboard/products", payload);
  toast.success("Product created.");
}
      setFormOpen(false);
      load();
    } catch (e: any) {
      setFormErr(e?.message || "Couldn't save the product.");
    } finally {
      setFormBusy(false);
    }
  };

const toggleStatus = async (x: any) => {
  const next = x.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
  const id = x.id;

  try {
    // Prefer explicit action endpoints first
    if (next === "PUBLISHED") {
      await api.tryRoutes(
        [
          `/api/dashboard/products/${id}/publish`,
          `/api/dashboard/products/${id}/status`,
        ],
        "POST",
        next === "PUBLISHED" ? { status: "PUBLISHED" } : undefined
      );
    } else {
      await api.tryRoutes(
        [
          `/api/dashboard/products/${id}/unpublish`,
          `/api/dashboard/products/${id}/status`,
        ],
        "POST",
        { status: "DRAFT" }
      );
    }

    setItems((l) => l.map((it) => (it.id === id ? { ...it, status: next } : it)));
    toast.success(
      next === "PUBLISHED"
        ? "Product published — it's now buyable."
        : "Product moved to draft."
    );
  } catch (e: any) {
    toast.error(e?.message || "Couldn't change status.");
  }
};

  const confirmDelete = async () => {
    if (!delFor) return;
    setDelBusy(true);
    try {
      await api.del(`/api/dashboard/products/${delFor.id}`);
      toast.success("Product deleted.");
      setDelFor(null);
      load();
    } catch (e: any) {
      toast.error(e?.message || "Couldn't delete the product.");
    } finally {
      setDelBusy(false);
    }
  };

 const addImageUrl = () => {
  const u = imageUrl.trim();

  if (!u) return;

  if (!/^https?:\/\/.+/.test(u)) {
    toast.error("Image must be a full URL (https://…).");
    return;
  }

  if (u.length > 2048) {
    toast.error("Image URL must be 2048 characters or fewer.");
    return;
  }

  setForm((f) => ({
    ...f,
    images: [...f.images, u].slice(0, 6),
  }));

  setImageUrl("");
};

 const handleFiles = async (files: FileList | null) => {
  if (!files || !files.length) return;

  setUploading(true);

  try {
    for (const f of Array.from(files).slice(0, 3)) {
      try {
        // Validate file type before asking the backend for a presigned URL.
        const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

        if (!allowedTypes.includes(f.type)) {
          throw new Error("Only JPEG, PNG, and WebP images are supported.");
        }

        // The API contract has a 10 MB limit.
        if (f.size < 1 || f.size > 10_485_760) {
          throw new Error("Each image must be between 1 byte and 10 MB.");
        }

        // 1. Ask the backend for a presigned PUT URL.
        const preset: any = await api.post(
          "/api/dashboard/uploads/presign-product-image",
          {
            fileName: f.name,
            contentType: f.type,
            declaredSizeBytes: f.size,
          }
        );

        const uploadUrl = preset?.uploadUrl;
        const publicUrl = preset?.publicUrl;

        if (!uploadUrl || !publicUrl) {
          throw new Error("The upload service did not return the required URLs.");
        }

        // 2. Upload the actual image directly to Cloudflare R2.
        const response = await fetch(uploadUrl, {
          method: "PUT",
          headers: {
            "Content-Type": f.type,
          },
          body: f,
        });

        if (!response.ok) {
          throw new Error(
            `Image upload failed (${response.status}). Please try again.`
          );
        }

        // 3. Store the final public R2 URL in the form.
        if (publicUrl.length > 2048) {
          throw new Error("The returned image URL is too long.");
        }

        setForm((current) => ({
          ...current,
          images: [...current.images, publicUrl].slice(0, 6),
        }));
      } catch (e: any) {
        toast.error(e?.message || "Image upload failed.");
      }
    }
  } finally {
    setUploading(false);

    if (fileRef.current) {
      fileRef.current.value = "";
    }
  }
};

  const catName = useMemo(() => {
    const m: Record<string, string> = {};
    cats.forEach((c) => (m[c.id] = c.name));
    return (id: string) => m[id] || "";
  }, [cats]);

  if (loading) {
    return (
      <div>
        <PageHead title="Products" sub="Your catalog — what you sell in the shop and online." />
        <div className="grid gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-16" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHead title="Products" sub={`${items.length} shown · money in ${currency}`}>
        <Button icon="plus" onClick={openCreate}>
          New product
        </Button>
      </PageHead>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchInput value={q} onChange={setQ} placeholder="Search products or SKUs…" className="w-full sm:w-72" />
        <select className="inp w-auto" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">All categories</option>
          {cats.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <div className="flex gap-1.5">
          {["ALL", "PUBLISHED", "DRAFT"].map((s) => (
            <button key={s} className={cls("chip", statusF === s && "chip-on")} onClick={() => setStatusF(s)}>
              {s === "ALL" ? "All" : s === "PUBLISHED" ? "Live" : "Draft"}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <div className="card">
          <ErrorState message={error} onRetry={() => load()} />
        </div>
      ) : items.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="box"
            title="No products yet"
            hint="Add what you're selling — price, stock and a photo — then publish it to your storefront."
            action={
              <Button icon="plus" onClick={openCreate}>
                Add your first product
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
                  <th>Product</th>
                  <th>Category</th>
                  <th className="text-right">Price</th>
                  <th className="text-right">Stock</th>
                  <th>Status</th>
                  <th>Expiry</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((x) => {
                  const variants = x.variants || [];
                  const low = x.lowStockThreshold != null && rawNum(x.quantity) <= rawNum(x.lowStockThreshold);
                  return (
                    <tr key={x.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <Thumb src={x.coverImageUrl || (x.images || [])[0]} alt={x.name} className="h-10 w-10" />
                          <div className="min-w-0">
                            <p className="max-w-[220px] truncate font-bold">{x.name}</p>
                            <p className="text-xs text-ink-400">
                              {x.sku ? `${x.sku} · ` : ""}
                              {x.unit?.symbol || x.unit?.name || x.unitName || ""}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap text-ink-500">{x.category?.name || x.categoryName || "—"}</td>
                      <td className="whitespace-nowrap text-right">
                        <Money v={x.discountPrice ?? x.price} currency={currency} strong />
                        {x.discountPrice != null && (
                          <span className="ml-1.5 text-xs text-ink-300 line-through">{fmSafe(x.price, currency)}</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap text-right">
                        {variants.length ? (
                          <span className="text-xs font-bold text-ink-500">{variants.length} variants</span>
                        ) : (
                          <span className={cls("font-bold tabular-nums", low && "text-gold-600")}>{rawNum(x.quantity)}</span>
                        )}
                        {low && !variants.length && <Badge tone="gold" className="ml-1.5">low</Badge>}
                      </td>
                      <td>
                        <StatusBadge status={x.status} />
                      </td>
                      <td className="whitespace-nowrap text-xs text-ink-500">
                        {x.expiryDate ? (
                          <span className={new Date(x.expiryDate).getTime() < Date.now() + 7 * 86400000 ? "font-bold text-danger-500" : ""}>
                            {fd(x.expiryDate)}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-0.5">
                          <IconBtn name="edit" label="Edit" onClick={() => openEdit(x)} />
                          <IconBtn name="box" label="Adjust stock" onClick={() => setStockFor(x)} />
                          <IconBtn
                            name={x.status === "PUBLISHED" ? "eye" : "store"}
                            label={x.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                            onClick={() => toggleStatus(x)}
                          />
                          <IconBtn name="trash" label="Delete" className="hover:bg-danger-100 hover:text-danger-500" onClick={() => setDelFor(x)} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <LoadMore onClick={() => load(nextCursor)} loading={loadingMore} hasMore={!!nextCursor} />
        </div>
      )}

      {/* ------------------------------ Create / edit ----------------------------- */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? `Edit — ${editing.name}` : "New product"}
        sub={editing ? "Changes go live on your storefront immediately." : "Start as a draft, publish when it's ready to sell."}
        wide
        footer={
          <>
            <Button variant="ghost" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button loading={formBusy} onClick={submitForm} icon="check">
              {editing ? "Save changes" : "Create product"}
            </Button>
          </>
        }
      >
        {formErr && (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-danger-100 bg-danger-100/60 px-3.5 py-3 text-sm font-semibold text-danger-700">
            <Icon name="alert" size={16} className="mt-0.5 shrink-0" />
            {formErr}
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" className="sm:col-span-2">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Agbalumo, 1 carton" autoFocus />
          </Field>
          <Field label="SKU" hint="Optional reference code.">
            <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="AGB-001" />
          </Field>
          <Field label="Status">
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="DRAFT">Draft (hidden)</option>
              <option value="PUBLISHED">Published (live)</option>
            </Select>
          </Field>
          <Field label={`Selling price (${currency})`}>
            <Input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0.00" />
          </Field>
          <Field label={`Cost price (${currency})`} hint="What you paid — used for reports.">
            <Input type="number" min="0" step="0.01" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} placeholder="0.00" />
          </Field>
          <Field label={`Discount price (${currency})`} hint="Shown instead of the price when set.">
            <Input type="number" min="0" step="0.01" value={form.discountPrice} onChange={(e) => setForm({ ...form, discountPrice: e.target.value })} placeholder="0.00" />
          </Field>
          {!editing && (
            <Field label="Opening stock" hint="How many you have on the shelf today.">
              <Input type="number" min="0" value={form.initialStock} onChange={(e) => setForm({ ...form, initialStock: e.target.value })} placeholder="0" />
            </Field>
          )}
          <Field label="Category">
            <Select
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            >
              <option value="">No category</option>
              {cats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
              <option value="__new">+ New category…</option>
            </Select>
          </Field>
          {form.categoryId === "__new" && (
            <Field label="New category name">
              <Input value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="e.g. Beverages" />
            </Field>
          )}
          <Field label="Unit">
            <Select value={form.unitId} onChange={(e) => setForm({ ...form, unitId: e.target.value })}>
              <option value="">No unit</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                  {u.symbol ? ` (${u.symbol})` : ""}
                </option>
              ))}
              <option value="__new">+ New unit…</option>
            </Select>
          </Field>
          {form.unitId === "__new" && (
            <Field label="New unit name">
              <Input value={newUnit} onChange={(e) => setNewUnit(e.target.value)} placeholder="e.g. carton" />
            </Field>
          )}
          <Field label="Low-stock alert at" hint="We email you when stock hits this.">
            <Input type="number" min="0" value={form.lowStockThreshold} onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })} placeholder="e.g. 5" />
          </Field>
          <Field label="Expiry date" hint="For perishables — leave empty if it never expires.">
            <Input type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} />
          </Field>
          <Field label="Description" className="sm:col-span-2">
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What customers should know…" />
          </Field>
        </div>

        {/* Images */}
        <div className="mt-5">
          <label className="lbl">Photos</label>
          <div className="flex flex-wrap gap-2.5">
            {form.images.map((src, i) => (
              <div key={i} className="group relative">
                <Thumb src={src} className="h-16 w-16" />
                {i === 0 && (
                  <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 rounded-full bg-ink-900 px-1.5 py-px text-[9px] font-extrabold uppercase text-cream-50">
                    Cover
                  </span>
                )}
                <button
                  className="absolute -right-1.5 -top-1.5 hidden h-5 w-5 items-center justify-center rounded-full bg-danger-500 text-white group-hover:flex"
                  onClick={() => setForm((f) => ({ ...f, images: f.images.filter((_, j) => j !== i) }))}
                  aria-label="Remove image"
                >
                  <Icon name="x" size={10} strokeWidth={3} />
                </button>
                {i !== 0 && (
                  <button
                    className="absolute -left-1.5 -top-1.5 hidden rounded-full bg-ink-900 px-1 text-[9px] font-bold text-white group-hover:block"
                    title="Make cover"
                    onClick={() =>
                      setForm((f) => {
                        const imgs = [...f.images];
                        imgs.splice(i, 1);
                        imgs.unshift(src);
                        return { ...f, images: imgs };
                      })
                    }
                  >
                    ↑
                  </button>
                )}
              </div>
            ))}
            <div className="flex flex-col gap-1.5">
              <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => handleFiles(e.target.files)} />
              <Button variant="outline" size="sm" icon="upload" loading={uploading} onClick={() => fileRef.current?.click()}>
                Upload
              </Button>
            </div>
          </div>
          <div className="mt-2.5 flex gap-2">
            <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="…or paste an image URL" className="flex-1" />
            <Button variant="ghost" onClick={addImageUrl}>
              Add
            </Button>
          </div>
        </div>

        {/* Variants */}
        <div className="mt-5">
          <div className="flex items-center justify-between">
            <label className="lbl !mb-0">Variants</label>
            <Button
              variant="ghost"
              size="sm"
              icon="plus"
              onClick={() =>
                setForm((f) => ({
                  ...f,
                  variantRows: [...f.variantRows, { key: Date.now(), name: "", sellingPrice: "", sku: "", stock: "" }],
                }))
              }
            >
              Add variant
            </Button>
          </div>
          <p className="mb-2 mt-1 text-xs text-ink-400">
            For things like sizes or colours. With variants, stock is tracked per variant.
          </p>
          {form.variantRows.length > 0 && (
            <div className="space-y-2">
              {form.variantRows.map((v) => (
                <div key={v.key} className="flex flex-wrap items-center gap-2 rounded-xl bg-cream-100 p-2">
                  <Input
                    className="w-40 flex-1"
                    placeholder="Variant name (e.g. Large)"
                    value={v.name}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        variantRows: f.variantRows.map((r) => (r.key === v.key ? { ...r, name: e.target.value } : r)),
                      }))
                    }
                  />
                  <Input
                    className="w-28"
                    placeholder={`Price (${currency})`}
                    type="number"
                    min="0"
                    value={v.sellingPrice}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        variantRows: f.variantRows.map((r) => (r.key === v.key ? { ...r, sellingPrice: e.target.value } : r)),
                      }))
                    }
                  />
                  <Input
                    className="w-24"
                    placeholder="SKU"
                    value={v.sku}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        variantRows: f.variantRows.map((r) => (r.key === v.key ? { ...r, sku: e.target.value } : r)),
                      }))
                    }
                  />
                  {!editing && (
                    <Input
                      className="w-20"
                      placeholder="Stock"
                      type="number"
                      min="0"
                      value={v.stock}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          variantRows: f.variantRows.map((r) => (r.key === v.key ? { ...r, stock: e.target.value } : r)),
                        }))
                      }
                    />
                  )}
                  <IconBtn
                    name="trash"
                    label="Remove variant"
                    onClick={() => setForm((f) => ({ ...f, variantRows: f.variantRows.filter((r) => r.key !== v.key) }))}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      <StockModal product={stockFor} onClose={() => setStockFor(null)} onDone={() => load()} catLabel={catName} />

      <Confirm
        open={!!delFor}
        onClose={() => setDelFor(null)}
        onConfirm={confirmDelete}
        loading={delBusy}
        title={`Delete “${delFor?.name || ""}”?`}
        body="This removes the product from your catalog and storefront. Past orders and their money stay intact."
        confirmLabel="Delete product"
      />
    </div>
  );
}

function fmSafe(v: any, currency: string) {
  try {
    return new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 0 }).format(parseFloat(v));
  } catch {
    return String(v ?? "");
  }
}

/* ------------------------------ Stock adjustment ----------------------------- */

function StockModal({
  product,
  onClose,
  onDone,
  catLabel,
}: {
  product: any;
  onClose: () => void;
  onDone: () => void;
  catLabel: (id: string) => string;
}) {
  const { me } = useAuth();
  const [branches, setBranches] = useState<any[]>([]);
  const [branchId, setBranchId] = useState("");
  const [variantId, setVariantId] = useState("");
  const [dir, setDir] = useState<"add" | "remove">("add");
  const [reason, setReason] = useState("RESTOCK");
  const [qty, setQty] = useState("1");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!product) return;
    setBranchId((me.store?.defaultBranchId as string) || "");
    (async () => {
      try {
        const res = await api.get("/api/dashboard/branches");
        const list = asList(res, "branches", "items", "data");
        setBranches(list);
        if (!me.store?.defaultBranchId && list[0]) setBranchId(list[0].id);
      } catch {
        /* branches optional */
      }
    })();
  }, [product, me.store]);

  if (!product) return null;
  const variants = product.variants || [];

  const submit = async () => {
    const n = Math.abs(parseInt(qty, 10) || 0);
    if (!n) return setErr("Quantity must be a positive number.");
    setBusy(true);
    setErr("");
    try {
      await api.post(`/api/dashboard/products/${product.id}/stock-adjustments`, {
        branchId: branchId || undefined,
        variantId: variantId || undefined,
        quantityChange: dir === "add" ? n : -n,
        reason,
        note: note.trim() || undefined,
      });
      toast.success(dir === "add" ? `Added ${n} to stock.` : `Removed ${n} from stock.`);
      onClose();
      onDone();
    } catch (e: any) {
      setErr(e?.message || "Couldn't adjust stock.");
    } finally {
      setBusy(false);
    }
  };

  const reasons = dir === "add" ? ["RESTOCK", "MANUAL_ADJUSTMENT", "REFUND"] : ["WRITE_OFF", "MANUAL_ADJUSTMENT", "SALE"];

  return (
    <Modal
      open={!!product}
      onClose={onClose}
      title="Adjust stock"
      sub={
        <>
          {product.name}
          {catLabel(product.categoryId) ? ` · ${catLabel(product.categoryId)}` : ""} — currently{" "}
          <b>{variants.length ? "per variant" : rawNum(product.quantity)}</b>
        </>
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={busy} onClick={submit} icon="check">
            Save adjustment
          </Button>
        </>
      }
    >
      {err && (
        <div className="mb-4 rounded-xl border border-danger-100 bg-danger-100/60 px-3.5 py-2.5 text-sm font-semibold text-danger-700">
          {err}
        </div>
      )}
      <div className="space-y-4">
        <div className="grid grid-cols-2 rounded-xl bg-cream-100 p-1 text-sm font-extrabold">
          {(["add", "remove"] as const).map((d) => (
            <button
              key={d}
              onClick={() => {
                setDir(d);
                setReason(d === "add" ? "RESTOCK" : "WRITE_OFF");
              }}
              className={cls(
                "rounded-lg py-2 transition-colors",
                dir === d ? "bg-white text-ink-900 shadow-sm" : "text-ink-400 hover:text-ink-700"
              )}
            >
              {d === "add" ? "Add stock" : "Remove stock"}
            </button>
          ))}
        </div>

        {branches.length > 0 && (
          <Field label="Branch">
            <Select value={branchId} onChange={(e) => setBranchId(e.target.value)}>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          </Field>
        )}

        {variants.length > 0 && (
          <Field label="Variant">
            <Select value={variantId} onChange={(e) => setVariantId(e.target.value)}>
              <option value="">Whole product</option>
              {variants.map((v: any) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({rawNum(v.quantity)} in stock)
                </option>
              ))}
            </Select>
          </Field>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Quantity">
            <Input type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} />
          </Field>
          <Field label="Reason">
            <Select value={reason} onChange={(e) => setReason(e.target.value)}>
              {reasons.map((r) => (
                <option key={r} value={r}>
                  {r.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Note" hint="Optional — kept in the stock ledger.">
          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. restocked from Mama Ada" />
        </Field>
      </div>
    </Modal>
  );
}

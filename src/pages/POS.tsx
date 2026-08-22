import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { asList, cls, fm, rawNum } from "../lib/format";
import {
  Badge,
  Button,
  EmptyState,
  Field,
  Icon,
  IconBtn,
  Input,
  Modal,
  Money,
  PageHead,
  SearchInput,
  Thumb,
  toast,
} from "../components/ui";

interface Line {
  key: string;
  productId: string;
  variantId?: string;
  name: string;
  variantName?: string;
  price: number;
  qty: number;
  max: number;
}

const METHODS = [
  { id: "CASH", label: "Cash", icon: "banknote" },
  { id: "TRANSFER", label: "Transfer", icon: "send" },
  { id: "CARD", label: "Card", icon: "key" },
  { id: "CREDIT", label: "Credit", icon: "clock" },
];

function posErrorMessage(e: any): string {
  const code = e?.code || e?.body?.error?.code;
  const map: Record<string, string> = {
    VALIDATION_ERROR: "Check the sale details and try again.",
    DISCOUNT_UNAVAILABLE: "That discount code isn't active right now.",
    DISCOUNT_NOT_FOUND: "That discount code doesn't exist for this store.",
    VARIANT_REQUIRED: "Pick a variant for that item.",
    VARIANT_NOT_FOUND: "That item has no variants.",
    CUSTOMER_NOT_FOUND: "That customer couldn't be found.",
    STORE_NOT_CONFIGURED: "No branch is set up to sell from yet.",
    PRODUCT_UNAVAILABLE: "Something in the ticket is unpublished or no longer available — refresh the shelf.",
    INSUFFICIENT_STOCK: "Not enough stock left for one of the items — refresh the shelf.",
    PAYMENT_NOT_CONFIGURED: "Card payments aren't set up for this store yet.",
    ORDER_LIMIT_REACHED: "You've hit your plan's order limit for this billing period.",
    PAYMENT_PROVIDER_ERROR: "Card payment couldn't be started — please try again.",
  };
  if (e?.status === 429) return "Too many sales in a short time — wait a moment and try again.";
  return map[code] || e?.message || "Couldn't record the sale.";
}

export default function POS() {
  const { me } = useAuth();
  const store = me.store || {};
  const currency: string = store.currency || "NGN";

  const [products, setProducts] = useState<any[]>([]);
  const [cats, setCats] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [branchId, setBranchId] = useState("");
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [catF, setCatF] = useState("");

  const [lines, setLines] = useState<Line[]>([]);
  const [variantPick, setVariantPick] = useState<any | null>(null);
  // NOTE: name/phone are NOT sent to the backend — the order-creation
  // contract only accepts an existing `customerId`, with no way to
  // create/look up a walk-in customer inline. Kept here for the
  // cashier's own reference until a customer-lookup endpoint exists.
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custEmail, setCustEmail] = useState(""); // required by contract for CARD sales
  const [code, setCode] = useState("");
  const [method, setMethod] = useState("CASH");
  const [amountPaid, setAmountPaid] = useState("");
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState<any | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, cRes, bRes] = await Promise.all([
        // "status" is not a documented query param on this route — filtered client-side below.
        api.get("/api/dashboard/products?limit=200").catch(() => null),
        api.get("/api/dashboard/categories").catch(() => null),
        api.get("/api/dashboard/branches").catch(() => null),
      ]);
      const list = pRes ? asList(pRes, "items", "products", "data") : [];
      setProducts(list.filter((p: any) => p.status === "PUBLISHED"));
      if (cRes) setCats(asList(cRes, "categories", "items", "data"));
      const bl = bRes ? asList(bRes, "branches", "items", "data") : [];
      setBranches(bl);
      setBranchId(store.defaultBranchId || bl[0]?.id || "");
      if (!list.length && pRes === null) toast.error("Couldn't load products.");
    } catch (e: any) {
      toast.error(e?.message || "Couldn't load the shop.");
    } finally {
      setLoading(false);
    }
  }, [store.defaultBranchId]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return products.filter((p) => {
      if (catF && p.categoryId !== catF) return false;
      if (s && !(p.name || "").toLowerCase().includes(s) && !(p.sku || "").toLowerCase().includes(s)) return false;
      return true;
    });
  }, [products, q, catF]);

  const effPrice = useCallback((p: any) => rawNum(p.discountPrice ?? p.price ?? 0), []);

  const stockOf = useCallback((p: any, variantId?: string) => {
    if (p.variants?.length && variantId) {
      const v = p.variants.find((x: any) => x.id === variantId);
      return rawNum(v?.quantity);
    }
    return p.variants?.length ? 0 : rawNum(p.quantity);
  }, []);

  const addToCart = (p: any) => {
    if (p.variants?.length) {
      setVariantPick(p);
      return;
    }
    const max = stockOf(p);
    setLines((ls) => {
      const ex = ls.find((l) => l.productId === p.id && !l.variantId);
      if (ex) {
        if (ex.qty >= max) {
          toast.error("No more stock on this product.");
          return ls;
        }
        return ls.map((l) => (l.key === ex.key ? { ...l, qty: l.qty + 1 } : l));
      }
      if (max <= 0) {
        toast.error(`${p.name} is out of stock.`);
        return ls;
      }
      return [...ls, { key: p.id, productId: p.id, name: p.name, price: effPrice(p), qty: 1, max }];
    });
  };

  const addVariant = (p: any, v: any) => {
    const max = rawNum(v.quantity);
    if (max <= 0) {
      toast.error(`${v.name} is out of stock.`);
      return;
    }
    setLines((ls) => {
      const ex = ls.find((l) => l.productId === p.id && l.variantId === v.id);
      if (ex) {
        if (ex.qty >= max) {
          toast.error("No more stock on this variant.");
          return ls;
        }
        return ls.map((l) => (l.key === ex.key ? { ...l, qty: l.qty + 1 } : l));
      }
      return [
        ...ls,
        {
          key: p.id + v.id,
          productId: p.id,
          variantId: v.id,
          name: p.name,
          variantName: v.name,
          price: rawNum(v.sellingPrice ?? p.discountPrice ?? p.price),
          qty: 1,
          max,
        },
      ];
    });
    setVariantPick(null);
  };

  const bump = (key: string, d: number) => {
    setLines((ls) =>
      ls
        .map((l) => (l.key === key ? { ...l, qty: Math.min(l.max, Math.max(0, l.qty + d)) } : l))
        .filter((l) => l.qty > 0)
    );
  };

  // Pre-discount total. The server applies any discount code and
  // returns the real `total` — treat this as an estimate whenever a
  // discount code is entered.
  const subtotal = lines.reduce((a, l) => a + l.price * l.qty, 0);
  const hasDiscountCode = !!code.trim();
  const paidTendered = parseFloat(amountPaid) || 0;

  const canSubmit = useMemo(() => {
    if (!lines.length) return false;
    if (method === "CARD") return !!custEmail.trim();
    if (method === "CREDIT") return true; // 0 is valid — fully on credit
    // CASH / TRANSFER: require at least the estimated subtotal, unless
    // a discount code is active (real total may be lower — server will confirm).
    if (!hasDiscountCode && paidTendered < subtotal) return false;
    return true;
  }, [lines.length, method, custEmail, hasDiscountCode, paidTendered, subtotal]);

  const charge = async () => {
    if (!canSubmit) {
      if (method === "CARD") toast.error("An email is required for card payments.");
      else toast.error("Amount received is less than the total.");
      return;
    }
    setBusy(true);
    try {
      const payload: any = {
        items: lines.map((l) => ({
          productId: l.productId,
          variantId: l.variantId || undefined,
          quantity: l.qty,
        })),
        branchId: branchId || undefined,
        paymentMethod: method,
        discountCode: code.trim() || undefined,
      };
      if (method === "CREDIT") {
        // Explicit partial (or zero) payment now; contract defaults to 0.00 if omitted.
        payload.amountPaid = paidTendered;
      }
      // CASH/TRANSFER: amountPaid intentionally omitted — the contract
      // defaults it to the (correctly discounted) total, avoiding a
      // mismatch with our pre-discount `subtotal` estimate.
      if (method === "CARD") {
        payload.email = custEmail.trim();
      }

      const res: any = await api.post("/api/dashboard/orders", payload);
      const order = res?.order ?? {};
      const payment = res?.payment ?? null;
      const total = rawNum(order.total ?? subtotal);

      setReceipt({
        // ⚠️ The contract's create response only returns order.id, not
        // orderNumber — confirm with backend whether that's intentional,
        // since a printed receipt needs something human-readable.
        number: order.id ? order.id.slice(0, 8).toUpperCase() : "—",
        total,
        method,
        change: method === "CASH" ? Math.max(0, paidTendered - total) : 0,
        outstanding: rawNum(order.balanceDue ?? 0),
        redirectUrl: payment?.redirectUrl ?? null,
      });
      setLines([]);
      setCustName("");
      setCustPhone("");
      setCustEmail("");
      setCode("");
      setAmountPaid("");
      load();
    } catch (e: any) {
      toast.error(posErrorMessage(e));
      const code = e?.code || e?.body?.error?.code;
      if (code === "INSUFFICIENT_STOCK" || code === "PRODUCT_UNAVAILABLE") load();
    } finally {
      setBusy(false);
    }
  };

  const resetAll = () => {
    setReceipt(null);
    setLines([]);
  };

  const amountLabel =
    method === "CASH" ? "Cash received" : method === "TRANSFER" ? "Amount received" : "Amount paid now (optional)";

  return (
    <div>
      <PageHead title="Point of sale" sub="Ring up a sale in the shop — stock updates as you go." />

      <div className="grid gap-5 xl:grid-cols-[1fr_400px]">
        {/* Catalog */}
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <SearchInput value={q} onChange={setQ} placeholder="Search the shelf…" className="w-full sm:w-64" />
            {branches.length > 0 && (
              <select className="inp w-auto" value={branchId} onChange={(e) => setBranchId(e.target.value)}>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          {cats.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1.5">
              <button className={cls("chip", !catF && "chip-on")} onClick={() => setCatF("")}>
                All
              </button>
              {cats.map((c) => (
                <button key={c.id} className={cls("chip", catF === c.id && "chip-on")} onClick={() => setCatF(c.id)}>
                  {c.name}
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton h-40" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="card">
              <EmptyState
                icon="box"
                title={products.length === 0 ? "Nothing to sell yet" : "No match on the shelf"}
                hint={
                  products.length === 0
                    ? "Publish products first — only PUBLISHED products can be sold here or on your storefront."
                    : "Try a different search or category."
                }
                action={
                  products.length === 0 ? (
                    <Link to="/dashboard/products?new=1">
                      <Button icon="plus">Add product</Button>
                    </Link>
                  ) : undefined
                }
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {filtered.map((p) => {
                const stock = stockOf(p);
                const out = stock <= 0 && !p.variants?.length;
                return (
                  <button
                    key={p.id}
                    onClick={() => addToCart(p)}
                    disabled={out}
                    className="card anim-rise group p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50"
                  >
                    <div className="relative">
                      <Thumb src={p.coverImageUrl || (p.images || [])[0]} className="h-24 w-full" />
                      {p.discountPrice != null && (
                        <span className="absolute left-1.5 top-1.5 rounded-full bg-brand-500 px-2 py-0.5 text-[10px] font-extrabold uppercase text-white">
                          Sale
                        </span>
                      )}
                      {out && (
                        <span className="absolute inset-0 flex items-center justify-center rounded-lg bg-ink-900/50 text-xs font-extrabold uppercase tracking-wider text-white">
                          Out of stock
                        </span>
                      )}
                    </div>
                    <p className="mt-2 truncate text-sm font-bold">{p.name}</p>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-sm font-extrabold tabular-nums text-brand-600">{fm(effPrice(p), currency)}</span>
                      <span className={cls("text-[11px] font-bold", stock <= 5 ? "text-gold-600" : "text-ink-300")}>
                        {p.variants?.length ? `${p.variants.length} opts` : `${stock} left`}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Ticket */}
        <div className="card anim-rise self-start overflow-hidden xl:sticky xl:top-20">
          <div className="flex items-center justify-between border-b border-cream-200 px-4 py-3">
            <h3 className="flex items-center gap-2 font-display text-base font-extrabold">
              <Icon name="receipt" size={17} className="text-brand-500" />
              Current ticket
            </h3>
            {lines.length > 0 && (
              <button className="text-xs font-bold text-danger-500 hover:underline" onClick={() => setLines([])}>
                Clear all
              </button>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto scrollbar-slim">
            {lines.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm font-semibold text-ink-400">Tap products to add them.</p>
            ) : (
              lines.map((l) => (
                <div key={l.key} className="flex items-center gap-2.5 border-b border-cream-100 px-4 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{l.name}</p>
                    <p className="text-xs text-ink-400">
                      {l.variantName ? `${l.variantName} · ` : ""}
                      {fm(l.price, currency)} each
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <IconBtn name="minus" label="Less" className="!p-1.5" onClick={() => bump(l.key, -1)} />
                    <span className="w-6 text-center text-sm font-extrabold tabular-nums">{l.qty}</span>
                    <IconBtn name="plus" label="More" className="!p-1.5" onClick={() => bump(l.key, 1)} />
                  </div>
                  <span className="w-20 text-right text-sm font-extrabold tabular-nums">{fm(l.price * l.qty, currency)}</span>
                </div>
              ))
            )}
          </div>

          <div className="space-y-3.5 border-t border-cream-200 px-4 py-4">
            <div>
              <div className="grid grid-cols-2 gap-2.5">
                <Input value={custName} onChange={(e) => setCustName(e.target.value)} placeholder="Customer name (for your reference)" />
                <Input value={custPhone} onChange={(e) => setCustPhone(e.target.value)} placeholder="Phone (for your reference)" type="tel" />
              </div>
              {(custName || custPhone) && (
                <p className="mt-1 text-[11px] text-ink-300">
                  Not saved to the order yet — this needs a customer lookup/create endpoint.
                </p>
              )}
            </div>

            <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Discount code (optional)" />

            <div className="grid grid-cols-4 gap-1.5">
              {METHODS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setMethod(m.id);
                    setAmountPaid(m.id === "CREDIT" ? "" : String(subtotal || ""));
                  }}
                  className={cls(
                    "flex flex-col items-center gap-1 rounded-xl border py-2.5 text-[11px] font-extrabold uppercase tracking-wide transition-all",
                    method === m.id
                      ? "border-brand-500 bg-brand-50 text-brand-600"
                      : "border-cream-200 bg-white text-ink-400 hover:border-cream-300"
                  )}
                >
                  <Icon name={m.icon} size={16} />
                  {m.label}
                </button>
              ))}
            </div>

            {method === "CARD" ? (
              <Field label="Customer email (required for card)">
                <Input type="email" value={custEmail} onChange={(e) => setCustEmail(e.target.value)} placeholder="customer@email.com" />
              </Field>
            ) : (
              <Field label={amountLabel}>
                <Input type="number" min="0" step="0.01" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} placeholder="0.00" />
              </Field>
            )}

            <div className="space-y-1 rounded-xl bg-cream-100 px-4 py-3 text-sm">
              <div className="flex justify-between text-ink-500">
                <span>Subtotal ({lines.reduce((a, l) => a + l.qty, 0)} items)</span>
                <Money v={subtotal} currency={currency} />
              </div>
              {hasDiscountCode && (
                <div className="flex justify-between text-xs text-ink-400">
                  <span>Code {code}</span>
                  <span>final total confirmed after checkout</span>
                </div>
              )}
              {method === "CASH" && paidTendered > subtotal && (
                <div className="flex justify-between font-bold text-leaf-600">
                  <span>Change due (est.)</span>
                  <Money v={paidTendered - subtotal} currency={currency} />
                </div>
              )}
              {method === "CREDIT" && paidTendered < subtotal && (
                <div className="flex justify-between font-bold text-gold-600">
                  <span>Customer owes (est.)</span>
                  <Money v={subtotal - paidTendered} currency={currency} />
                </div>
              )}
              <div className="flex justify-between border-t border-cream-200 pt-1.5 font-display text-lg font-extrabold">
                <span>Total</span>
                <Money v={subtotal} currency={currency} />
              </div>
            </div>

            <Button size="lg" className="w-full" loading={busy} disabled={!canSubmit} icon="check" onClick={charge}>
              {method === "CARD" ? "Record card sale" : "Complete sale"}
            </Button>
          </div>
        </div>
      </div>

      {/* Variant picker */}
      <Modal open={!!variantPick} onClose={() => setVariantPick(null)} title={variantPick?.name || ""} sub="Choose a variant to add to the ticket.">
        {variantPick?.variants?.map((v: any) => {
          const st = rawNum(v.quantity);
          return (
            <button
              key={v.id}
              disabled={st <= 0}
              onClick={() => addVariant(variantPick, v)}
              className="mb-2 flex w-full items-center justify-between gap-3 rounded-xl border border-cream-200 px-4 py-3 text-left transition-colors hover:border-brand-300 disabled:opacity-50"
            >
              <div>
                <p className="text-sm font-bold">{v.name}</p>
                <p className="text-xs text-ink-400">
                  {v.sku ? `${v.sku} · ` : ""}
                  {fm(rawNum(v.sellingPrice ?? variantPick.discountPrice ?? variantPick.price), currency)}
                </p>
              </div>
              <Badge tone={st <= 0 ? "danger" : st <= 5 ? "gold" : "green"}>{st <= 0 ? "Out" : `${st} left`}</Badge>
            </button>
          );
        })}
      </Modal>

      {/* Receipt */}
      <Modal
        open={!!receipt}
        onClose={resetAll}
        title="Sale recorded"
        wide={false}
        footer={
          <>
            <Link to="/dashboard/orders" onClick={resetAll}>
              <Button variant="ghost">All orders</Button>
            </Link>
            <Button onClick={resetAll} icon="plus">
              New sale
            </Button>
          </>
        }
      >
        <div className="flex flex-col items-center gap-4 py-2 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-leaf-100 text-leaf-700">
            <Icon name="check" size={30} strokeWidth={2.6} />
          </span>
          <div>
            <p className="font-display text-2xl font-extrabold">{receipt?.number}</p>
            <p className="mt-1 text-sm text-ink-400">
              {METHODS.find((m) => m.id === receipt?.method)?.label} · <Money v={receipt?.total ?? 0} currency={currency} strong />
            </p>
          </div>
          {receipt?.change > 0 && (
            <div className="w-full rounded-xl bg-leaf-100 px-4 py-3">
              <p className="text-xs font-extrabold uppercase tracking-wider text-leaf-700">Change due</p>
              <p className="font-display text-2xl font-extrabold text-leaf-700">{fm(receipt.change, currency)}</p>
            </div>
          )}
          {receipt?.outstanding > 0 && (
            <div className="w-full rounded-xl bg-gold-100 px-4 py-3">
              <p className="text-xs font-extrabold uppercase tracking-wider text-gold-700">On credit — customer owes</p>
              <p className="font-display text-2xl font-extrabold text-gold-700">{fm(receipt.outstanding, currency)}</p>
            </div>
          )}
          {receipt?.redirectUrl && (
            
            <a  href={receipt.redirectUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-ink-900 px-5 py-3 text-sm font-extrabold text-cream-50"
            >
              <Icon name="external" size={15} /> Complete card payment
            </a>
          )}
        </div>
      </Modal>
    </div>
  );
}
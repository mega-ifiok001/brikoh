"use client";

import { useMemo, useState } from "react";
import { storefrontSubdomainFromHash } from "@/lib/hashRouter";
import { useApi } from "@/api/useApi";
import { publicService } from "@/api/services";
import { ApiError } from "@/api/types";
import type { PublicStorefrontData } from "@/api/types";
import { Skeleton } from "@/components/Skeleton";
import { ShoppingBag, Trash, Plus, Minus, Lock, CheckCircle, ArrowLeft, X, WhatsApp } from "@/components/icons";

const SYM: Record<string, string> = { NGN: "₦", USD: "$", GHS: "GH₵", KES: "KSh", ZAR: "R" };
const fmt = (cur: string, n: number) => `${SYM[cur] ?? ""}${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

type CartItem = { product: PublicStorefrontData["products"][number]; qty: number };

export default function Storefront() {
  const subdomain = storefrontSubdomainFromHash() ?? "";
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [done, setDone] = useState<{ orderId: string; reference: string; redirectUrl: string; total: string } | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [err, setErr] = useState("");

  const storeData = useApi(() => publicService.storefront(subdomain), [subdomain]);

  const s = storeData.data;
  const products = s?.products ?? [];
  const cur = s?.currency ?? "NGN";
  const accent = s?.accentColor ?? "#E86100";
  const bg = "#fff";
  const card = "#faf8f4";
  const ink = "#11231a";
  const muted = "#5c6b62";

  const count = cart.reduce((a, c) => a + c.qty, 0);
  const subtotal = useMemo(() => cart.reduce((a, c) => a + c.qty * Number(c.product.price), 0), [cart]);
  const delivery = subtotal >= 50000 || subtotal === 0 ? 0 : 2500;
  const total = subtotal + delivery;

  const add = (p: PublicStorefrontData["products"][number]) => {
    setErr("");
    setCart((c) => {
      const have = c.find((x) => x.product.id === p.id)?.qty ?? 0;
      if (have + 1 > p.stock) { setErr(`Only ${p.stock} in stock.`); return c; }
      return have ? c.map((x) => (x.product.id === p.id ? { ...x, qty: x.qty + 1 } : x)) : [...c, { product: p, qty: 1 }];
    });
  };
  const setQty = (id: string, n: number) =>
    setCart((c) => c.map((x) => (x.product.id === id ? { ...x, qty: Math.max(0, n) } : x)).filter((x) => x.qty > 0));

  const checkout = async () => {
    setErr("");
    if (cart.length === 0) return setErr("Your cart is empty.");
    if (name.trim().length < 1) return setErr("Name is required.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setErr("A valid email is required.");
    try {
      const res = await publicService.checkout(subdomain, {
        customer: { name, email, phone: phone || undefined },
        items: cart.map((c) => ({ productId: c.product.id, quantity: c.qty })),
      });
      setDone({ orderId: res.order.id, reference: res.payment.reference, redirectUrl: res.payment.redirectUrl, total: res.order.total });
      setCart([]);
      setCartOpen(false);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : (e as Error).message);
    }
  };

  if (!subdomain) {
    return (
      <div className="grid min-h-[100dvh] place-items-center bg-cream">
        <div className="text-center">
          <p className="text-lg font-bold text-ink">Store not found</p>
          <a href="#/" className="mt-3 inline-block rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white">Back to Brikoh</a>
        </div>
      </div>
    );
  }

  /* ------------------------- success ------------------------- */
  if (done) {
    return (
      <div className="min-h-screen" style={{ background: bg }}>
        <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-5 py-16 text-center">
          <span className="grid h-20 w-20 animate-pop place-items-center rounded-full bg-[#25D366]/15 text-[#25D366]"><CheckCircle className="h-10 w-10" /></span>
          <h1 className="mt-6 font-display text-3xl font-extrabold" style={{ color: ink }}>Order started! 🎉</h1>
          <p className="mt-2 text-sm" style={{ color: muted }}>
            Order <span className="font-bold">{done.orderId}</span> · reference <span className="font-mono font-bold">{done.reference}</span>
          </p>
          <div className="mt-7 w-full rounded-2xl p-6 text-left" style={{ background: card }}>
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: accent }}>Complete payment</p>
            <p className="mt-2 text-sm" style={{ color: muted }}>
              Total <span className="font-extrabold">{fmt(cur, Number(done.total))}</span>. Your order is PENDING — stock is not reserved until Paystack confirms via webhook.
            </p>
            <a href={done.redirectUrl} target="_blank" rel="noreferrer" className="mt-4 block w-full rounded-full px-6 py-3.5 text-center text-sm font-bold text-white" style={{ background: accent }}>
              Pay now on Paystack
            </a>
          </div>
          <button onClick={() => setDone(null)} className="mt-6 text-sm font-bold" style={{ color: accent }}>← Back to shopping</button>
        </div>
      </div>
    );
  }

  /* ------------------------- main store ------------------------- */
  return (
    <div className="min-h-screen" style={{ background: bg }}>
      {/* header */}
      <header className="sticky top-0 z-20 border-b" style={{ background: bg, borderColor: "rgba(128,128,128,.15)" }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <span className="font-display text-lg font-extrabold" style={{ color: ink }}>
            {storeData.loading ? <Skeleton className="h-6 w-32" /> : s?.name ?? subdomain}
          </span>
          <div className="flex items-center gap-2">
            {s?.whatsapp && (
              <a href={`https://wa.me/${s.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="hidden items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold text-white sm:inline-flex" style={{ background: "#25D366" }}>
                <WhatsApp className="h-4 w-4" /> Chat
              </a>
            )}
            <button onClick={() => setCartOpen(true)} className="relative grid h-10 w-10 place-items-center rounded-full border" style={{ borderColor: `${accent}40`, color: ink }} aria-label="Cart">
              <ShoppingBag className="h-5 w-5" />
              {count > 0 && <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold text-white" style={{ background: accent }}>{count}</span>}
            </button>
          </div>
        </div>
      </header>

      {/* hero */}
      <section className="mx-auto max-w-6xl px-5 py-10 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: accent }}>{s?.tagline ?? "Fresh arrivals"}</p>
        <h1 className="mx-auto mt-3 max-w-2xl font-display text-3xl font-extrabold leading-tight sm:text-5xl" style={{ color: ink }}>
          {storeData.loading ? <Skeleton className="mx-auto h-10 w-64" /> : s?.heroTitle ?? s?.name ?? subdomain}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm sm:text-base" style={{ color: muted }}>
          {s?.heroSubtitle ?? "Order online — we deliver. Or chat with us on WhatsApp."}
        </p>
      </section>

      {/* products */}
      <section className="mx-auto max-w-6xl px-5 pb-12">
        <h2 className="font-display text-2xl font-extrabold" style={{ color: ink }}>Shop</h2>
        {storeData.loading ? (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-2xl p-4" style={{ background: card }}>
                <Skeleton className="h-32 w-full rounded-xl" />
                <Skeleton className="mt-3 h-4 w-3/4" />
                <Skeleton className="mt-2 h-4 w-1/3" />
              </div>
            ))}
          </div>
        ) : storeData.error ? (
          <div className="mt-8 rounded-3xl border border-dashed p-10 text-center" style={{ borderColor: "rgba(128,128,128,.3)", color: muted }}>
            <p className="font-semibold">Couldn't load store.</p>
            <p className="mt-1 text-sm">{storeData.error}</p>
            <button onClick={storeData.refetch} className="mt-4 rounded-full px-6 py-2.5 text-sm font-bold text-white" style={{ background: accent }}>Retry</button>
          </div>
        ) : products.length === 0 ? (
          <p className="mt-8 rounded-3xl border border-dashed p-10 text-center text-sm" style={{ borderColor: "rgba(128,128,128,.3)", color: muted }}>
            No products available yet — check back soon, or message us on WhatsApp.
          </p>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <div key={p.id} className="flex flex-col overflow-hidden rounded-2xl" style={{ background: card }}>
                <div className="grid h-32 place-items-center text-5xl sm:h-36" style={{ background: `${accent}14` }}>
                  {p.images?.[0] ? <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover" /> : "🛍️"}
                </div>
                <div className="flex flex-1 flex-col p-3.5">
                  <p className="truncate text-sm font-bold" style={{ color: ink }}>{p.name}</p>
                  {p.description && <p className="mt-0.5 line-clamp-2 text-[11px]" style={{ color: muted }}>{p.description}</p>}
                  <div className="mt-3 flex items-center justify-between">
                    <span className="font-display text-base font-extrabold" style={{ color: accent }}>{fmt(cur, Number(p.price))}</span>
                    <button onClick={() => add(p)} className="rounded-full px-3.5 py-2 text-[11px] font-bold text-white disabled:opacity-40" style={{ background: accent }} disabled={p.stock === 0}>
                      {p.stock === 0 ? "Sold out" : "Add to cart"}
                    </button>
                  </div>
                  {p.stock > 0 && p.stock <= 5 && <p className="mt-1 text-[10px] font-bold text-[#b7791f]">Only {p.stock} left!</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* footer */}
      <footer className="border-t py-6 text-center text-xs" style={{ borderColor: "rgba(128,128,128,.15)", color: muted }}>
        © {new Date().getFullYear()} {s?.name ?? subdomain} · Powered by Brikoh
      </footer>

      {/* cart drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={() => setCartOpen(false)} />
          <div className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-ink/5 px-5 py-4">
              <h3 className="font-display text-lg font-extrabold text-ink">Your cart ({count})</h3>
              <button onClick={() => setCartOpen(false)} className="grid h-9 w-9 place-items-center rounded-lg text-ink/40 hover:bg-ink/5"><X className="h-5 w-5" /></button>
            </div>

            {checkingOut ? (
              <div className="flex-1 space-y-3 overflow-y-auto px-5 py-5">
                <p className="text-sm font-bold text-ink">Delivery details</p>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name *" className="w-full rounded-xl border border-ink/10 px-4 py-3 text-sm outline-none focus:border-brand" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email * (for the payment receipt)" className="w-full rounded-xl border border-ink/10 px-4 py-3 text-sm outline-none focus:border-brand" />
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone (optional)" className="w-full rounded-xl border border-ink/10 px-4 py-3 text-sm outline-none focus:border-brand" />
                {err && <p className="text-xs font-medium text-red-500">{err}</p>}
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto px-5 py-4">
                {cart.length === 0 ? (
                  <p className="py-16 text-center text-sm text-muted">Your cart is empty.</p>
                ) : (
                  <div className="space-y-3">
                    {cart.map((c) => (
                      <div key={c.product.id} className="flex items-center gap-3 rounded-2xl bg-cream p-3">
                        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white text-2xl shadow-sm">
                          {c.product.images?.[0] ? <img src={c.product.images[0]} alt="" className="h-full w-full rounded-xl object-cover" /> : "🛍️"}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-ink">{c.product.name}</p>
                          <p className="text-xs text-muted">{fmt(cur, Number(c.product.price))}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => setQty(c.product.id, c.qty - 1)} className="grid h-7 w-7 place-items-center rounded-lg bg-white shadow-sm"><Minus className="h-3.5 w-3.5" /></button>
                          <span className="w-6 text-center text-sm font-bold text-ink">{c.qty}</span>
                          <button onClick={() => setQty(c.product.id, c.qty + 1)} className="grid h-7 w-7 place-items-center rounded-lg bg-white shadow-sm"><Plus className="h-3.5 w-3.5" /></button>
                        </div>
                        <span className="w-16 text-right text-sm font-extrabold text-ink">{fmt(cur, c.qty * Number(c.product.price))}</span>
                        <button onClick={() => setQty(c.product.id, 0)} className="grid h-7 w-7 place-items-center rounded-lg text-ink/35 hover:text-red-500"><Trash className="h-3.5 w-3.5" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {cart.length > 0 && (
              <div className="border-t border-ink/5 px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4">
                {checkingOut ? (
                  <button onClick={checkout} className="flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm font-bold text-white" style={{ background: accent }}>
                    <Lock className="h-4 w-4" /> Pay {fmt(cur, total)} via Paystack
                  </button>
                ) : (
                  <>
                    <div className="mb-3 flex justify-between font-display text-lg font-extrabold text-ink"><span>Total</span><span>{fmt(cur, total)}</span></div>
                    <button onClick={() => setCheckingOut(true)} className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-br from-brand-light to-brand py-3.5 text-sm font-semibold text-white">
                      <Lock className="h-4 w-4" /> Secure checkout
                    </button>
                  </>
                )}
                {checkingOut && (
                  <button onClick={() => setCheckingOut(false)} className="mt-2 flex w-full items-center justify-center gap-1.5 py-2 text-sm font-bold text-ink/60">
                    <ArrowLeft className="h-4 w-4" /> Back to cart
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* floating WhatsApp */}
      {s?.whatsapp && (
        <a href={`https://wa.me/${s.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" aria-label="Chat on WhatsApp" className="group fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 z-40 flex items-center gap-0 rounded-full bg-[#25D366] text-white shadow-2xl shadow-black/20 transition-all hover:pr-5 sm:bottom-6 sm:right-6">
          <span className="grid h-14 w-14 place-items-center"><WhatsApp className="h-8 w-8" /></span>
          <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-bold opacity-0 transition-all duration-300 group-hover:max-w-[180px] group-hover:opacity-100">Chat with us</span>
          <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-[#25D366]/40" />
        </a>
      )}
    </div>
  );
}

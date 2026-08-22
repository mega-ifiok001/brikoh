import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../lib/api";
import { asList, cls, fm, rawNum } from "../lib/format";
import { Badge, Button, Icon, Input, Modal, Spinner, Thumb, toast } from "../components/ui";

interface CartLine {
  key: string;
  productId: string;
  variantId?: string;
  name: string;
  variantName?: string;
  price: number;
  qty: number;
  max: number;
  image?: string;
}

// Storefront currency isn't part of the public projection (see contract:
// "business phone, location, currency ... never appear here"). Default to
// NGN, or wire this to a store-level constant if you support multi-currency
// storefronts later.
const DEFAULT_CURRENCY = "NGN";

function checkoutErrorMessage(e: any): string {
  const code = e?.code || e?.body?.error?.code;
  const map: Record<string, string> = {
    VARIANT_REQUIRED: "Please pick an option for that item.",
    VARIANT_NOT_FOUND: "That option isn't available anymore.",
    STORE_NOT_FOUND: "This store isn't available right now.",
    STORE_NOT_CONFIGURED: "This store isn't set up to take orders yet.",
    PRODUCT_UNAVAILABLE: "Something in your basket is no longer available.",
    INSUFFICIENT_STOCK: "One of your items just sold out — check your basket and try again.",
    DISCOUNT_UNAVAILABLE: "That discount code isn't active right now.",
    DISCOUNT_NOT_FOUND: "That discount code doesn't exist for this store.",
    PAYMENT_NOT_CONFIGURED: "This store hasn't set up payments yet.",
    PAYMENT_PROVIDER_ERROR: "Payment couldn't be started — please try again.",
  };
  if (e?.status === 429 || code === "RATE_LIMITED") return "Too many attempts — please wait a moment and try again.";
  return map[code] || e?.message || "Checkout failed — please try again.";
}

export default function StoreView() {
  const { subdomain = "" } = useParams();

  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [campaign, setCampaign] = useState<any>(null);
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);

  const [catF, setCatF] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [variantPick, setVariantPick] = useState<any | null>(null);
  const [code, setCode] = useState("");
  const [customer, setCustomer] = useState({ name: "", phone: "", email: "" });
  const [checkingOut, setCheckingOut] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setNotFound(false);
    setRateLimited(false);
    try {
      const res: any = await api.publicGet(`/api/public/storefront/${encodeURIComponent(subdomain)}`);

      // Contract shape is flat: { storeName, subdomain, template, tagline,
      // heroTitle, heroSubtitle, accentColor, whatsappButtonEnabled,
      // whatsappNumber, showPoweredByBadge, ga4MeasurementId, socialLinks,
      // campaign }. There is no nested "store"/"business" key.
      if (!res?.storeName) throw new Error("no store");

      setStore({ name: res.storeName, subdomain: res.subdomain });

      setSettings({
        template: res.template,
        tagline: res.tagline,
        heroTitle: res.heroTitle,
        heroSubtitle: res.heroSubtitle,
        accentColor: res.accentColor,
        whatsappButtonEnabled: res.whatsappButtonEnabled,
        whatsappNumber: res.whatsappNumber,
        showPoweredByBadge: res.showPoweredByBadge,
        ga4MeasurementId: res.ga4MeasurementId,
        socialLinks: res.socialLinks || {},
      });

      setCampaign(res.campaign ?? null);

      // ASSUMPTION: products aren't on this endpoint per the contract note
      // ("Products are NOT on this endpoint — load them separately if you
      // have a public catalog route"). Point this at your real public
      // products route once you confirm its path/shape.
      try {
        const pRes: any = await api.publicGet(
          `/api/public/storefront/${encodeURIComponent(subdomain)}/products`
        );
        setProducts(
          asList(pRes, "products", "items", "data").filter((p: any) => p.status === "PUBLISHED" || !p.status)
        );
      } catch {
        setProducts([]);
      }
    } catch (e: any) {
      if (e?.status === 429) setRateLimited(true);
      else setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [subdomain]);

  useEffect(() => {
    load();
  }, [load]);

  // Inject GA4 if the storefront has a measurement id configured.
  useEffect(() => {
    const id = settings.ga4MeasurementId;
    if (!id || (window as any).gtag) return;
    const s1 = document.createElement("script");
    s1.async = true;
    s1.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
    document.head.appendChild(s1);
    const s2 = document.createElement("script");
    s2.innerHTML = `window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', '${id}');`;
    document.head.appendChild(s2);
  }, [settings.ga4MeasurementId]);

  const accent: string = settings.accentColor || "#D9532A";
  const categories = useMemo(() => {
    const m: Record<string, any> = {};
    products.forEach((p) => {
      const c = p.category?.name || p.categoryName;
      if (c) m[c] = c;
    });
    return Object.values(m) as string[];
  }, [products]);

  const filtered = products.filter((p) => {
    const c = p.category?.name || p.categoryName;
    if (catF && c !== catF) return false;
    return true;
  });

  const effPrice = (p: any) => rawNum(p.discountPrice ?? p.price);

  const stockOf = (p: any, variantId?: string) => {
    if (p.variants?.length && variantId) {
      const v = p.variants.find((x: any) => x.id === variantId);
      return rawNum(v?.quantity);
    }
    return p.variants?.length ? 0 : rawNum(p.quantity);
  };

  const add = (p: any, variant?: any) => {
    const max = stockOf(p, variant?.id);
    if (max <= 0) {
      toast.error("That's out of stock right now.");
      return;
    }
    const price = variant ? rawNum(variant.sellingPrice ?? p.discountPrice ?? p.price) : effPrice(p);
    const key = p.id + (variant?.id || "");
    setCart((c) => {
      const ex = c.find((l) => l.key === key);
      if (ex) {
        if (ex.qty >= max) {
          toast.error("No more in stock.");
          return c;
        }
        return c.map((l) => (l.key === key ? { ...l, qty: l.qty + 1 } : l));
      }
      return [
        ...c,
        {
          key,
          productId: p.id,
          variantId: variant?.id,
          name: p.name,
          variantName: variant?.name,
          price,
          qty: 1,
          max,
          image: p.coverImageUrl || p.images?.[0],
        },
      ];
    });
    if (!variant) setCartOpen(true);
  };

  const bump = (key: string, d: number) => {
    setCart((c) =>
      c
        .map((l) => (l.key === key ? { ...l, qty: Math.min(l.max, Math.max(0, l.qty + d)) } : l))
        .filter((l) => l.qty > 0)
    );
  };

  const subtotal = cart.reduce((a, l) => a + l.price * l.qty, 0);
  const count = cart.reduce((a, l) => a + l.qty, 0);

  const campaignLive = useMemo(() => {
    if (!campaign || campaign.isActive === false) return false;
    const now = Date.now();
    if (campaign.startsAt && new Date(campaign.startsAt).getTime() > now) return false;
    if (campaign.endsAt && new Date(campaign.endsAt).getTime() < now) return false;
    return true;
  }, [campaign]);

  const checkout = async () => {
    if (!cart.length) return;
    // Checkout contract requires customer.name + customer.email; phone is optional.
    if (!customer.name.trim() || !customer.email.trim()) {
      setErr("We need your name and email to send the order confirmation.");
      return;
    }
    setErr("");
    setCheckingOut(true);
    try {
      const res: any = await api.publicPost(`/api/public/checkout/${encodeURIComponent(subdomain)}`, {
        customer: {
          name: customer.name.trim(),
          email: customer.email.trim(),
          phone: customer.phone.trim() || undefined,
        },
        items: cart.map((l) => ({
          productId: l.productId,
          variantId: l.variantId || undefined,
          quantity: l.qty,
        })),
        discountCode: code.trim() || undefined,
        origin: "DIRECT",
      });

      // Contract shape: { order: { id, orderNumber, total, status }, payment: { provider, reference, redirectUrl } }
      setResult({
        number: res?.order?.orderNumber ?? "—",
        total: res?.order?.total ?? subtotal,
        redirectUrl: res?.payment?.redirectUrl ?? null,
      });
      setCart([]);
      setCode("");
    } catch (e: any) {
      setErr(checkoutErrorMessage(e));
    } finally {
      setCheckingOut(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream-50">
        <div className="flex flex-col items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: "#D9532A" }}>
            <Icon name="logo" size={26} className="text-white" />
          </span>
          <Spinner size={22} className="text-ink-400" />
        </div>
      </div>
    );
  }

  if (rateLimited) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-cream-50 px-6 text-center">
        <h1 className="font-display text-2xl font-extrabold">Hold on a moment</h1>
        <p className="max-w-sm text-sm text-ink-400">This page is getting a lot of traffic — try again in a few seconds.</p>
        <Button onClick={load}>Retry</Button>
      </div>
    );
  }

  if (notFound || !store) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-cream-50 px-6 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-500">
          <Icon name="store" size={28} />
        </span>
        <h1 className="font-display text-3xl font-extrabold">This store isn't here</h1>
        <p className="max-w-sm text-sm text-ink-400">
          The store "{subdomain}" doesn't exist or isn't live yet. Ask the seller for the right link.
        </p>
        <Link to="/" className="mt-2 text-sm font-bold text-brand-600 hover:underline">
          ← Back to brikoh.com
        </Link>
      </div>
    );
  }

  const social = settings.socialLinks || {};
  const hasSocial = social.instagram || social.facebook || social.tiktok;

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-cream-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl text-white" style={{ background: accent }}>
            <span className="font-display text-lg font-extrabold">
              {(store.name || "S").slice(0, 1).toUpperCase()}
            </span>
          </span>
          <div className="leading-tight">
            <p className="font-display text-lg font-extrabold">{store.name}</p>
          </div>
          <button
            onClick={() => setCartOpen(true)}
            className="relative ml-auto flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-extrabold text-white"
            style={{ background: accent }}
          >
            <Icon name="cart" size={17} />
            Cart
            {count > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-ink-900 px-1 text-[10px] font-extrabold text-white">
                {count}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
        <div className="anim-rise max-w-2xl">
          {settings.tagline && (
            <p className="text-xs font-extrabold uppercase tracking-[0.16em]" style={{ color: accent }}>
              {settings.tagline}
            </p>
          )}
          <h1 className="mt-2 font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            {settings.heroTitle || `Shop ${store.name}`}
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-500">
            {settings.heroSubtitle || "Browse the shelf, fill your basket, pay your way."}
          </p>
        </div>
      </section>

      {/* Campaign banner */}
      {campaignLive && (
        <section className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
          <div className="anim-rise relative overflow-hidden rounded-2xl px-6 py-6 text-white" style={{ background: accent }}>
            <div className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-white/10" />
            <p className="font-display text-2xl font-extrabold">{campaign.bannerTitle || campaign.name}</p>
            {campaign.bannerSubtitle && <p className="mt-1 text-sm font-semibold opacity-90">{campaign.bannerSubtitle}</p>}
            {campaign.ctaLabel && (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span className="rounded-lg bg-white px-4 py-2 text-sm font-extrabold" style={{ color: accent }}>
                  {campaign.ctaLabel}
                </span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Categories + grid */}
      <section className="mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-6">
        {categories.length > 1 && (
          <div className="mb-5 flex flex-wrap gap-2">
            <button className={cls("chip", !catF && "chip-on")} onClick={() => setCatF("")}>
              All
            </button>
            {categories.map((c) => (
              <button key={c} className={cls("chip", catF === c && "chip-on")} onClick={() => setCatF(c)}>
                {c}
              </button>
            ))}
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="card flex flex-col items-center gap-2 px-6 py-16 text-center">
            <Icon name="box" size={28} className="text-brand-300" />
            <p className="font-display text-lg font-extrabold">The shelf is empty right now</p>
            <p className="text-sm text-ink-400">Check back soon — fresh stock is on its way.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((p, i) => {
              const hasVariants = !!p.variants?.length;
              const stock = stockOf(p);
              return (
                <div
                  key={p.id}
                  className="card anim-rise group overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md"
                  style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
                >
                  <div className="relative">
                    <Thumb src={p.coverImageUrl || p.images?.[0]} alt={p.name} className="h-40 w-full" />
                    {p.discountPrice != null && (
                      <span className="absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase text-white" style={{ background: accent }}>
                        Sale
                      </span>
                    )}
                    {stock <= 0 && !hasVariants && (
                      <span className="absolute inset-0 flex items-center justify-center bg-ink-900/45 text-xs font-extrabold uppercase tracking-wider text-white">
                        Sold out
                      </span>
                    )}
                  </div>
                  <div className="p-3.5">
                    <p className="truncate text-sm font-bold">{p.name}</p>
                    <div className="mt-1.5 flex items-center justify-between">
                      <span className="text-sm font-extrabold tabular-nums">
                        <span style={{ color: accent }}>{fm(effPrice(p), DEFAULT_CURRENCY)}</span>
                        {p.discountPrice != null && (
                          <span className="ml-1.5 text-xs font-semibold text-ink-300 line-through">{fm(p.price, DEFAULT_CURRENCY)}</span>
                        )}
                      </span>
                    </div>
                    <button
                      disabled={stock <= 0 && !hasVariants}
                      onClick={() => (hasVariants ? setVariantPick(p) : add(p))}
                      className="mt-2.5 w-full rounded-lg py-2 text-xs font-extrabold uppercase tracking-wide text-white transition-opacity disabled:opacity-40"
                      style={{ background: accent }}
                    >
                      {hasVariants ? "Choose" : "Add to cart"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-cream-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 sm:flex-row sm:px-6">
          <p className="text-sm font-extrabold">{store.name}</p>
          {hasSocial && (
            <div className="flex items-center gap-3">
              {social.instagram && (
                <a href={social.instagram} target="_blank" rel="noreferrer" className="text-ink-400 hover:text-ink-700">
                  <Icon name="instagram" size={16} />
                </a>
              )}
              {social.facebook && (
                <a href={social.facebook} target="_blank" rel="noreferrer" className="text-ink-400 hover:text-ink-700">
                  <Icon name="facebook" size={16} />
                </a>
              )}
              {social.tiktok && (
                <a href={social.tiktok} target="_blank" rel="noreferrer" className="text-ink-400 hover:text-ink-700">
                  <Icon name="tiktok" size={16} />
                </a>
              )}
            </div>
          )}
          {settings.showPoweredByBadge && (
            <Link to="/" className="flex items-center gap-2 text-xs font-bold text-ink-400 hover:text-ink-700">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-brand-500 text-white">
                <Icon name="logo" size={13} />
              </span>
              Powered by Brikoh
            </Link>
          )}
        </div>
      </footer>

      {/* WhatsApp float button */}
          {settings.whatsappButtonEnabled && settings.whatsappNumber && (
        
       <a   href={`https://wa.me/${settings.whatsappNumber.replace(/\D/g, "")}`}
          target="_blank"
          rel="noreferrer"
          className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105"
          aria-label="Chat on WhatsApp"
        >
          <Icon name="whatsapp" size={26} />
        </a>
      )}

      {/* Variant modal */}
      <Modal open={!!variantPick} onClose={() => setVariantPick(null)} title={variantPick?.name || ""} sub="Pick your size.">
        {variantPick?.variants?.map((v: any) => {
          const st = rawNum(v.quantity);
          return (
            <button
              key={v.id}
              disabled={st <= 0}
              onClick={() => {
                add(variantPick, v);
                setVariantPick(null);
              }}
              className="mb-2 flex w-full items-center justify-between gap-3 rounded-xl border border-cream-200 px-4 py-3 text-left transition-colors hover:border-brand-300 disabled:opacity-50"
            >
              <div>
                <p className="text-sm font-bold">{v.name}</p>
                <p className="text-xs text-ink-400">{fm(rawNum(v.sellingPrice ?? variantPick.discountPrice ?? variantPick.price), DEFAULT_CURRENCY)}</p>
              </div>
              <Badge tone={st <= 0 ? "danger" : st <= 5 ? "gold" : "green"}>{st <= 0 ? "Out" : `${st} left`}</Badge>
            </button>
          );
        })}
      </Modal>

      {/* Cart drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-ink-900/45 backdrop-blur-[2px]" onClick={() => setCartOpen(false)} />
          <div className="anim-rise absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-cream-200 px-5 py-4">
              <h3 className="font-display text-lg font-extrabold">Your basket</h3>
              <button className="rounded-lg p-2 text-ink-400 hover:bg-cream-100" onClick={() => setCartOpen(false)} aria-label="Close cart">
                <Icon name="x" size={18} />
              </button>
            </div>

            <div className="scrollbar-slim flex-1 overflow-y-auto">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
                  <Icon name="cart" size={26} className="text-ink-300" />
                  <p className="font-bold text-ink-500">Your basket is empty</p>
                  <p className="text-xs text-ink-400">Tap "Add to cart" on anything you like.</p>
                </div>
              ) : (
                cart.map((l) => (
                  <div key={l.key} className="flex items-center gap-3 border-b border-cream-100 px-5 py-3.5">
                    <Thumb src={l.image} className="h-12 w-12" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">{l.name}</p>
                      <p className="text-xs text-ink-400">
                        {l.variantName ? `${l.variantName} · ` : ""}
                        {fm(l.price, DEFAULT_CURRENCY)}
                      </p>
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <button className="flex h-6 w-6 items-center justify-center rounded-md bg-cream-100 font-extrabold" onClick={() => bump(l.key, -1)} aria-label="Less">
                          −
                        </button>
                        <span className="w-6 text-center text-sm font-extrabold tabular-nums">{l.qty}</span>
                        <button className="flex h-6 w-6 items-center justify-center rounded-md bg-cream-100 font-extrabold" onClick={() => bump(l.key, 1)} aria-label="More">
                          +
                        </button>
                      </div>
                    </div>
                    <span className="text-sm font-extrabold tabular-nums">{fm(l.price * l.qty, DEFAULT_CURRENCY)}</span>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="space-y-3.5 border-t border-cream-200 bg-cream-50 px-5 py-4">
                {result ? (
                  <div className="text-center">
                    <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-leaf-100 text-leaf-700">
                      <Icon name="check" size={26} strokeWidth={2.6} />
                    </span>
                    <p className="mt-3 font-display text-xl font-extrabold">Order {result.number}</p>
                    {result.redirectUrl ? (
                      
                       <a href={result.redirectUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-extrabold text-white"
                        style={{ background: accent }}
                      >
                        <Icon name="external" size={15} /> Pay {fm(result.total, DEFAULT_CURRENCY)} online
                      </a>
                    ) : (
                      <p className="mt-1 text-sm text-ink-400">
                        {fm(result.total, DEFAULT_CURRENCY)} — the seller will follow up with you next.
                      </p>
                    )}
                    <Button variant="ghost" className="mt-3" onClick={() => { setCartOpen(false); setResult(null); }}>
                      Keep shopping
                    </Button>
                  </div>
                ) : (
                  <>
                    <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Discount code (if you have one)" className="uppercase" />
                    <div className="grid grid-cols-2 gap-2">
                      <Input value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} placeholder="Full name" />
                      <Input value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} placeholder="Email" type="email" />
                    </div>
                    <Input value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} placeholder="Phone (optional)" type="tel" />
                    {err && <p className="text-xs font-bold text-danger-500">{err}</p>}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-ink-500">Total</span>
                      <span className="font-display text-xl font-extrabold tabular-nums">{fm(subtotal, DEFAULT_CURRENCY)}</span>
                    </div>
                    <button
                      onClick={checkout}
                      disabled={checkingOut}
                      className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-[15px] font-extrabold text-white transition-opacity disabled:opacity-60"
                      style={{ background: accent }}
                    >
                      {checkingOut ? <Spinner size={16} /> : <Icon name="shield" size={16} />}
                      Pay securely
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
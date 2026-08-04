"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useInventory, totalStock, fmtMoney } from "@/inventory/lib";
import { getTemplate, waLink } from "./templates";
import { useTheme } from "@/lib/theme";
import { WhatsApp, MapPin, Phone, ShoppingBag, Trash, Plus, Minus, Lock, CheckCircle, ArrowLeft, X } from "@/components/icons";

type CartItem = { productId: string; name: string; emoji: string; price: number; qty: number; unit: string };
type View = "browse" | "checkout" | "success";
type PayChannel = "CARD" | "BANK_TRANSFER" | "USSD" | "QR";

export default function Storefront() {
  const { business } = useAuth();
  const { db, recordSale, recordPayment, findOrCreateCustomer } = useInventory();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [view, setView] = useState<View>("browse");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");
  const [paying, setPaying] = useState(false);
  const [channel, setChannel] = useState<PayChannel>("CARD");
  const [receipt, setReceipt] = useState<{ saleId: string; ref: string; total: number; name: string } | null>(null);

  /* product detail */
  const [detail, setDetail] = useState<string | null>(null);
  const [dQty, setDQty] = useState(1);
  const [dImg, setDImg] = useState(0);
  const [addedFlash, setAddedFlash] = useState<string | null>(null);
  const detailProduct = detail ? db.products.find((p) => p.id === detail) ?? null : null;
  const detailStock = detailProduct ? totalStock(db, detailProduct.id) : 0;
  const detailImgs = detailProduct && detailProduct.images?.length > 0 ? detailProduct.images : detailProduct ? [detailProduct.emoji] : [];

  useEffect(() => {
    setDQty(1);
    setDImg(0);
  }, [detail]);

  const cartKey = `brikoh_cart_${business?.websiteName ?? "store"}`;

  // load cart from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(cartKey);
      if (raw) setCart(JSON.parse(raw));
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try { localStorage.setItem(cartKey, JSON.stringify(cart)); } catch { /* ignore */ }
  }, [cart, cartKey]);

  const whatsapp = business?.whatsapp || business?.phone || "";
  const tpl = getTemplate(business?.template);
  const accent = business?.accent ?? tpl.accent;
  const heroTitle = business?.heroTitle ?? business?.name ?? "My Store";
  const heroSubtitle = business?.heroSubtitle ?? "Handcrafted with love — explore our collection and order today.";
  const tagline = business?.tagline ?? "Fresh arrivals every week";
  // editorial template is always dark; other templates follow the global theme
  const dark = tpl.heroStyle === "editorial" || isDark;
  const pageBg = dark ? "#0d1512" : "#fff";
  const cardBg = dark ? "#16251d" : "#faf8f4";
  const textMain = dark ? "#eef4f0" : "#11231A";
  const textMuted = dark ? "rgba(238,244,240,.66)" : "#5c6b62";

  const products = useMemo(() => db.products.filter((p) => p.status === "active" && totalStock(db, p.id) > 0), [db]);

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  const addToCart = (id: string) => {
    addQty(id, 1);
  };

  const addQty = (id: string, qty: number) => {
    const p = db.products.find((x) => x.id === id);
    if (!p || qty < 1) return;
    const stock = totalStock(db, id);
    setCart((c) => {
      const existing = c.find((x) => x.productId === id);
      const next = Math.min((existing?.qty ?? 0) + qty, stock);
      return existing
        ? c.map((x) => (x.productId === id ? { ...x, qty: next } : x))
        : [...c, { productId: id, name: p.name, emoji: p.emoji, price: p.sellingPrice, qty: next, unit: p.unit }];
    });
    setAddedFlash(p.name);
    setTimeout(() => setAddedFlash(null), 1500);
  };

  const setQty = (id: string, n: number) => {
    const stock = totalStock(db, id);
    setCart((c) => c.map((x) => (x.productId === id ? { ...x, qty: Math.min(Math.max(1, n), stock) } : x)));
  };

  const subtotal = cart.reduce((s, i) => s + i.qty * i.price, 0);
  const delivery = subtotal >= 50000 || subtotal === 0 ? 0 : 2500;
  const total = subtotal + delivery;

  const checkout = () => {
    setErr("");
    if (cart.length === 0) return;
    if (name.trim().length < 2) return setErr("Please enter your name so we know who to deliver to.");
    if (phone.replace(/\D/g, "").length < 7) return setErr("Please enter a valid phone number.");
    setView("checkout");
  };

  const payNow = async () => {
    setErr("");
    if (!name.trim() || !phone.trim()) return;
    setPaying(true);
    // simulate Paystack processing
    await new Promise((r) => setTimeout(r, 1800));
    try {
      const customer = findOrCreateCustomer(name, phone, email, "STOREFRONT");
      const sale = recordSale({
        customerId: customer.id,
        customerName: customer.name,
        branchId: db.branches[0].id,
        items: cart.map((c) => ({ productId: c.productId, name: c.name, qty: c.qty, price: c.price })),
        subtotal,
        discount: 0,
        total,
        method: "card",
        paid: total,
      });
      const payment = recordPayment(sale.id, channel);
      setReceipt({ saleId: sale.id, ref: payment.paystackReference, total, name: customer.name });
      setCart([]);
      setCartOpen(false);
      setView("success");
    } catch {
      setErr("Payment failed. Please try again.");
    } finally {
      setPaying(false);
    }
  };

  if (!business) {
    return (
      <div className="grid min-h-screen place-items-center bg-cream">
        <div className="text-center">
          <p className="text-lg font-bold text-ink">Please log in to view your store</p>
          <a href="#/login" className="mt-3 inline-block rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white">Log in</a>
        </div>
      </div>
    );
  }

  /* ------------------------- success screen ------------------------- */
  if (view === "success" && receipt) {
    return (
      <div className="min-h-screen" style={{ background: pageBg }}>
        <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-5 py-16 text-center">
          <span className="grid h-20 w-20 animate-pop place-items-center rounded-full bg-[#25D366]/15 text-[#25D366]"><CheckCircle className="h-10 w-10" /></span>
          <h1 className="mt-6 font-display text-3xl font-extrabold" style={{ color: textMain }}>Order confirmed! 🎉</h1>
          <p className="mt-2 text-sm" style={{ color: textMuted }}>Thanks {receipt.name.split(" ")[0]} — we've received your payment and your order is being prepared.</p>
          <div className="mt-7 w-full rounded-2xl p-6 text-left" style={{ background: cardBg }}>
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: accent }}>Receipt</p>
            <div className="mt-3 space-y-1.5 text-sm">
              <div className="flex justify-between"><span style={{ color: textMuted }}>Order</span><span className="font-bold" style={{ color: textMain }}>{receipt.saleId}</span></div>
              <div className="flex justify-between"><span style={{ color: textMuted }}>Paystack ref</span><span className="font-mono font-bold" style={{ color: textMain }}>{receipt.ref}</span></div>
              <div className="flex justify-between"><span style={{ color: textMuted }}>Payment</span><span className="font-bold text-[#25D366]">Successful ✓</span></div>
              <div className="mt-2 flex justify-between border-t pt-2 font-display text-lg font-extrabold" style={{ borderColor: `${accent}33`, color: textMain }}>
                <span>Total paid</span><span style={{ color: accent }}>{fmtMoney(business.currency, receipt.total)}</span>
              </div>
            </div>
          </div>
          <div className="mt-6 flex w-full gap-3">
            <button onClick={() => { setView("browse"); setReceipt(null); }} className="flex-1 rounded-full px-6 py-3 text-sm font-bold text-white" style={{ background: accent }}>Continue shopping</button>
            <a href={waLink(whatsapp, `Hi! I just placed order ${receipt.saleId}. Can I get an update?`)} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-full border px-6 py-3 text-sm font-bold" style={{ borderColor: "#25D366", color: "#25D366" }}><WhatsApp className="h-4 w-4" /> Track on WhatsApp</a>
          </div>
          <p className="mt-6 text-xs" style={{ color: textMuted }}>A receipt has been emailed to you. Questions? Message us on WhatsApp.</p>
        </div>
      </div>
    );
  }

  /* ------------------------- checkout screen ------------------------- */
  if (view === "checkout") {
    return (
      <div className="min-h-screen" style={{ background: pageBg }}>
        <header className="sticky top-0 z-20 border-b" style={{ background: pageBg, borderColor: `${accent}22` }}>
          <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4">
            <button onClick={() => setView("browse")} className="inline-flex items-center gap-1.5 text-sm font-bold" style={{ color: textMain }}><ArrowLeft className="h-4 w-4" /> Back</button>
            <span className="font-display text-base font-extrabold" style={{ color: textMain }}>Checkout</span>
            <span className="text-sm font-bold" style={{ color: accent }}>{fmtMoney(business.currency, total)}</span>
          </div>
        </header>

        <div className="mx-auto max-w-4xl px-5 py-10">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <h2 className="font-display text-xl font-extrabold" style={{ color: textMain }}>Delivery details</h2>
              {err && <p className="mt-3 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-500">{err}</p>}
              <div className="mt-4 space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold" style={{ color: textMain }}>Full name</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Adaeze Okafor" className="w-full rounded-xl border bg-transparent px-4 py-3 text-[15px] outline-none transition-all focus:ring-4" style={{ borderColor: `${accent}40`, color: textMain, caretColor: accent }} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold" style={{ color: textMain }}>Phone number</label>
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+234 800 123 4567" className="w-full rounded-xl border bg-transparent px-4 py-3 text-[15px] outline-none transition-all focus:ring-4" style={{ borderColor: `${accent}40`, color: textMain, caretColor: accent }} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold" style={{ color: textMain }}>Email (for receipt, optional)</label>
                  <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full rounded-xl border bg-transparent px-4 py-3 text-[15px] outline-none transition-all focus:ring-4" style={{ borderColor: `${accent}40`, color: textMain, caretColor: accent }} />
                </div>
              </div>

              <h2 className="mt-9 font-display text-xl font-extrabold" style={{ color: textMain }}>Payment</h2>
              <p className="mt-1 text-xs" style={{ color: textMuted }}>Secured by Paystack — card, bank transfer, USSD or QR.</p>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {(["CARD", "BANK_TRANSFER", "USSD", "QR"] as PayChannel[]).map((ch) => (
                  <button key={ch} onClick={() => setChannel(ch)} className={`rounded-2xl border-2 px-4 py-3 text-center text-xs font-bold transition-all ${channel === ch ? "text-white" : "bg-transparent"}`} style={channel === ch ? { background: accent, borderColor: accent } : { borderColor: `${accent}30`, color: textMain }}>
                    {ch === "CARD" ? "💳 Card" : ch === "BANK_TRANSFER" ? "🏦 Transfer" : ch === "USSD" ? "📱 USSD" : "🔳 QR"}
                  </button>
                ))}
              </div>

              <button onClick={payNow} disabled={paying} className="mt-7 flex w-full items-center justify-center gap-2 rounded-full px-6 py-4 text-sm font-bold text-white transition-transform hover:-translate-y-0.5 disabled:opacity-70" style={{ background: "#25D366" }}>
                {paying ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Processing payment…
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" /> Pay {fmtMoney(business.currency, total)} with Paystack
                  </>
                )}
              </button>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs" style={{ color: textMuted }}>
                <Lock className="h-3.5 w-3.5" /> Your payment is encrypted & PCI-DSS compliant. Stock updates instantly.
              </p>
            </div>

            {/* order summary */}
            <div className="h-fit rounded-3xl p-6 lg:sticky lg:top-24" style={{ background: cardBg }}>
              <h3 className="font-display text-base font-extrabold" style={{ color: textMain }}>Order summary</h3>
              <div className="mt-4 space-y-3">
                {cart.map((c) => (
                  <div key={c.productId} className="flex items-center gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-xl" style={{ background: `${accent}14` }}>{c.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold" style={{ color: textMain }}>{c.name}</p>
                      <p className="text-xs" style={{ color: textMuted }}>Qty {c.qty} · {fmtMoney(business.currency, c.price)}</p>
                    </div>
                    <span className="text-sm font-extrabold" style={{ color: textMain }}>{fmtMoney(business.currency, c.qty * c.price)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 space-y-1.5 border-t pt-4 text-sm" style={{ borderColor: `${accent}22` }}>
                <div className="flex justify-between" style={{ color: textMuted }}><span>Subtotal</span><span style={{ color: textMain }}>{fmtMoney(business.currency, subtotal)}</span></div>
                <div className="flex justify-between" style={{ color: textMuted }}><span>Delivery</span><span style={{ color: textMain }}>{delivery === 0 ? "Free" : fmtMoney(business.currency, delivery)}</span></div>
                <div className="flex justify-between pt-2 font-display text-lg font-extrabold" style={{ color: textMain }}><span>Total</span><span style={{ color: accent }}>{fmtMoney(business.currency, total)}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ------------------------- browse (main store) ------------------------- */
  const related = detailProduct
    ? products.filter((p) => p.category === detailProduct.category && p.id !== detailProduct.id).slice(0, 3)
    : [];
  return (
    <div className="min-h-screen" style={{ background: pageBg, fontFamily: "Inter, sans-serif" }}>
      <div className="py-2 text-center text-xs font-semibold text-white" style={{ background: dark ? accent : "#145A32" }}>
        {tagline} · Free delivery on orders above {fmtMoney(business.currency, 50000)} 🚚
      </div>

      <header className="sticky top-0 z-20 border-b" style={{ background: pageBg, borderColor: dark ? "rgba(255,255,255,.1)" : "rgba(17,35,26,.08)" }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <span className={`font-display text-lg font-extrabold ${tpl.font}`} style={{ color: textMain }}>{business.name}</span>
          <nav className="hidden items-center gap-6 text-sm font-semibold sm:flex" style={{ color: textMuted }}>
            <a href="#shop" style={{ color: textMain }}>Shop</a>
            <a href="#about">About</a>
            <a href="#contact">Contact</a>
          </nav>
          <div className="flex items-center gap-2">
            <a href={waLink(whatsapp)} target="_blank" rel="noreferrer" className="hidden items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold text-white sm:inline-flex" style={{ background: "#25D366" }}>
              <WhatsApp className="h-4 w-4" /> Chat
            </a>
            <button onClick={() => setCartOpen(true)} className="relative grid h-10 w-10 place-items-center rounded-full border" style={{ borderColor: `${accent}40`, color: textMain }} aria-label="Cart">
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold text-white" style={{ background: accent }}>{cartCount}</span>}
            </button>
          </div>
        </div>
      </header>

      {/* hero */}
      <section className="mx-auto max-w-6xl px-5">
        {tpl.heroStyle === "centered" ? (
          <div className="my-6 rounded-3xl px-6 py-16 text-center" style={{ background: `linear-gradient(135deg, ${tpl.swatch[0]}, ${tpl.swatch[1]})` }}>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/85">{tagline}</p>
            <h1 className={`mx-auto mt-4 max-w-2xl font-display text-4xl font-extrabold leading-tight text-white sm:text-5xl ${tpl.font}`}>{heroTitle}</h1>
            <p className="mx-auto mt-4 max-w-xl text-sm text-white/85 sm:text-base">{heroSubtitle}</p>
            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a href="#shop" className="rounded-full px-7 py-3 text-sm font-bold text-white shadow-lg" style={{ background: accent }}>Shop now</a>
              <a href={waLink(whatsapp)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/40 px-7 py-3 text-sm font-semibold text-white"><WhatsApp className="h-4 w-4" /> Order on WhatsApp</a>
            </div>
          </div>
        ) : tpl.heroStyle === "editorial" ? (
          <div className="my-6 grid items-center gap-10 rounded-3xl px-6 py-14 sm:grid-cols-2" style={{ background: "#11231A" }}>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: accent }}>{tagline}</p>
              <h1 className={`mt-4 font-display text-4xl font-extrabold leading-tight text-white sm:text-5xl ${tpl.font}`}>{heroTitle}</h1>
              <p className="mt-4 max-w-md text-sm text-white/70 sm:text-base">{heroSubtitle}</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <a href="#shop" className="rounded-full px-7 py-3 text-sm font-bold text-black" style={{ background: accent }}>Explore collection</a>
                <a href={waLink(whatsapp)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/30 px-7 py-3 text-sm font-semibold text-white"><WhatsApp className="h-4 w-4" /> WhatsApp us</a>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {products.slice(0, 4).map((p) => (
                <button key={p.id} onClick={() => addToCart(p.id)} className="rounded-2xl p-4 text-center transition-transform hover:-translate-y-1" style={{ background: `${accent}14` }}>
                  <span className="text-5xl">{p.images?.[0] ?? p.emoji}</span>
                  <p className="mt-2 truncate text-xs font-bold text-white">{p.name}</p>
                  <p className="text-[11px]" style={{ color: accent }}>{fmtMoney(business.currency, p.sellingPrice)}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="my-6 grid items-center gap-10 rounded-3xl border px-6 py-14 sm:grid-cols-2" style={{ borderColor: `${accent}30`, background: cardBg }}>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: accent }}>{tagline}</p>
              <h1 className={`mt-4 font-display text-4xl font-extrabold leading-tight sm:text-5xl ${tpl.font}`} style={{ color: textMain }}>{heroTitle}</h1>
              <p className="mt-4 max-w-md text-sm sm:text-base" style={{ color: textMuted }}>{heroSubtitle}</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <a href="#shop" className="rounded-full px-7 py-3 text-sm font-bold text-white" style={{ background: accent }}>Shop now</a>
                <a href={waLink(whatsapp)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border px-7 py-3 text-sm font-semibold" style={{ borderColor: `${accent}55`, color: textMain }}><WhatsApp className="h-4 w-4" style={{ color: "#25D366" }} /> Chat on WhatsApp</a>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {products.slice(0, 4).map((p) => (
                <button key={p.id} onClick={() => addToCart(p.id)} className="rounded-2xl p-4 text-center transition-transform hover:-translate-y-1" style={{ background: isDark ? "#16251d" : "#fff", boxShadow: isDark ? "0 10px 30px rgba(0,0,0,.3)" : "0 10px 30px rgba(17,35,26,.06)" }}>
                  <span className="text-5xl">{p.images?.[0] ?? p.emoji}</span>
                  <p className="mt-2 truncate text-xs font-bold" style={{ color: textMain }}>{p.name}</p>
                  <p className="text-[11px] font-bold" style={{ color: accent }}>{fmtMoney(business.currency, p.sellingPrice)}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* products */}
      <section id="shop" className="mx-auto max-w-6xl px-5 py-10">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: accent }}>Shop</p>
            <h2 className={`mt-2 font-display text-2xl font-extrabold sm:text-3xl ${tpl.font}`} style={{ color: textMain }}>Our products</h2>
          </div>
          <span className="text-xs font-semibold" style={{ color: textMuted }}>{products.length} items</span>
        </div>
        <div className="mt-7 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => {
            const stock = totalStock(db, p.id);
            const inCart = cart.find((c) => c.productId === p.id)?.qty ?? 0;
            const imgs = p.images && p.images.length > 0 ? p.images : [p.emoji];
            return (
              <div key={p.id} className="group flex flex-col overflow-hidden rounded-2xl transition-transform duration-300 hover:-translate-y-1" style={{ background: cardBg }}>
                <button onClick={() => setDetail(p.id)} className="relative block text-left" aria-label={`View ${p.name}`}>
                  <div className="grid h-36 place-items-center text-6xl transition-transform duration-300 group-hover:scale-105" style={{ background: `${accent}12` }}>{imgs[0]}</div>
                  {imgs.length > 1 && (
                    <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/50 px-2 py-1 text-[9px] font-bold text-white backdrop-blur">
                      🖼️ +{imgs.length - 1} more
                    </span>
                  )}
                  {imgs.length > 1 && (
                    <span className="absolute bottom-2 left-2 flex -space-x-2">
                      {imgs.slice(1, 3).map((im, i) => (
                        <span key={i} className="grid h-6 w-6 place-items-center rounded-full bg-white text-xs shadow ring-1 ring-black/10">{im}</span>
                      ))}
                    </span>
                  )}
                </button>
                <div className="flex flex-1 flex-col p-4">
                  <button onClick={() => setDetail(p.id)} className="truncate text-left text-sm font-bold transition-colors hover:underline" style={{ color: textMain }}>{p.name}</button>
                  <button onClick={() => setDetail(p.id)} className="text-left text-[11px]" style={{ color: textMuted }}>{p.category} · {p.unit}</button>
                  <button onClick={() => setDetail(p.id)} className="mt-0.5 text-left text-[10px] font-bold" style={{ color: accent }}>View details →</button>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="font-display text-base font-extrabold" style={{ color: accent }}>{fmtMoney(business.currency, p.sellingPrice)}</span>
                    <button
                      onClick={() => addToCart(p.id)}
                      disabled={inCart >= stock}
                      className="rounded-full px-3.5 py-2 text-[11px] font-bold text-white transition-transform group-hover:scale-105 disabled:opacity-40"
                      style={{ background: accent }}
                    >
                      {inCart >= stock ? "In cart" : "Add to cart"}
                    </button>
                  </div>
                  {stock <= 5 && <p className="mt-1.5 text-[10px] font-bold text-[#b7791f]">Only {stock} left!</p>}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section id="about" className="mx-auto max-w-6xl px-5 py-10">
        <div className="grid gap-6 rounded-3xl p-8 sm:grid-cols-2" style={{ background: cardBg }}>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: accent }}>About us</p>
            <h3 className={`mt-2 font-display text-xl font-extrabold ${tpl.font}`} style={{ color: textMain }}>{business.name}</h3>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: textMuted }}>{heroSubtitle} Questions about sizing, delivery or custom orders? We're one message away.</p>
          </div>
          <div id="contact" className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: accent }}>Contact & order</p>
            <a href={waLink(whatsapp)} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm font-semibold" style={{ color: textMain }}>
              <span className="grid h-9 w-9 place-items-center rounded-full bg-[#25D366] text-white"><WhatsApp className="h-5 w-5" /></span>
              {whatsapp || "WhatsApp us"}
            </a>
            {business.phone && <p className="flex items-center gap-3 text-sm" style={{ color: textMuted }}><span className="grid h-9 w-9 place-items-center rounded-full" style={{ background: `${accent}22`, color: accent }}><Phone className="h-4 w-4" /></span>{business.phone}</p>}
            {business.city && <p className="flex items-center gap-3 text-sm" style={{ color: textMuted }}><span className="grid h-9 w-9 place-items-center rounded-full" style={{ background: `${accent}22`, color: accent }}><MapPin className="h-4 w-4" /></span>{business.city}, {business.country}</p>}
          </div>
        </div>
      </section>

      <footer className="border-t py-6 text-center text-xs" style={{ borderColor: dark ? "rgba(255,255,255,.1)" : "rgba(17,35,26,.08)", color: textMuted }}>
        © {new Date().getFullYear()} {business.name} · Built with <span className="font-bold" style={{ color: accent }}>Brikoh</span>
      </footer>

      <a href={waLink(whatsapp)} target="_blank" rel="noreferrer" aria-label="Chat on WhatsApp" className="group fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 z-40 flex items-center gap-0 rounded-full bg-[#25D366] text-white shadow-2xl shadow-black/20 transition-all hover:pr-5 sm:bottom-6 sm:right-6">
        <span className="grid h-14 w-14 place-items-center"><WhatsApp className="h-8 w-8" /></span>
        <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-bold opacity-0 transition-all duration-300 group-hover:max-w-[180px] group-hover:opacity-100">Chat with us</span>
        <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-[#25D366]/40" />
      </a>

      {/* product detail modal */}
      {detailProduct && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6" onClick={() => setDetail(null)}>
          <div className="absolute inset-0 bg-ink/60 backdrop-blur-sm" />
          <div className="relative max-h-[92dvh] w-full max-w-3xl overflow-y-auto rounded-t-3xl shadow-2xl sm:rounded-3xl" style={{ color: textMain, background: cardBg }} onClick={(e) => e.stopPropagation()}>
            {/* image gallery */}
            <div className="relative">
              <div className="grid h-52 place-items-center text-8xl transition-all duration-300 sm:h-64" style={{ background: `linear-gradient(135deg, ${accent}28, ${accent}08)` }}>
                <span key={dImg} className="animate-pop">{detailImgs[dImg] ?? detailProduct.emoji}</span>
              </div>
              {detailImgs.length > 1 && (
                <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2 rounded-full bg-black/45 px-3 py-1.5 backdrop-blur">
                  {detailImgs.map((im, i) => (
                    <button key={i} onClick={() => setDImg(i)} aria-label={`Photo ${i + 1}`} className={`grid h-9 w-9 place-items-center rounded-full text-lg transition-all ${i === dImg ? "bg-white ring-2 ring-brand" : "bg-white/25 hover:bg-white/40"}`}>
                      {im}
                    </button>
                  ))}
                  <span className="self-center pl-1 text-[10px] font-bold text-white">{dImg + 1}/{detailImgs.length}</span>
                </div>
              )}
              <button onClick={() => setDetail(null)} className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/90 text-ink shadow-lg backdrop-blur" aria-label="Close details"><X className="h-5 w-5" /></button>
              <span className={`absolute left-4 top-4 rounded-full px-3 py-1 text-[11px] font-bold ${detailStock === 0 ? "bg-red-100 text-red-500" : detailStock <= detailProduct.threshold ? "bg-sun/90 text-white" : "bg-leaf/90 text-white"}`}>
                {detailStock === 0 ? "Out of stock" : detailStock <= detailProduct.threshold ? `Only ${detailStock} left` : "In stock"}
              </span>
            </div>

            <div className="p-6 sm:p-8">
              {/* name + meta */}
              <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: accent }}>{detailProduct.category} · sold per {detailProduct.unit}</p>
              <h2 className="mt-1.5 font-display text-2xl font-extrabold tracking-tight sm:text-3xl">{detailProduct.name}</h2>

              {/* price */}
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span className="font-display text-3xl font-extrabold" style={{ color: accent }}>{fmtMoney(business.currency, detailProduct.sellingPrice)}</span>
                {detailProduct.discountPrice != null && detailProduct.discountPrice < detailProduct.sellingPrice && (
                  <>
                    <span className="text-base text-ink/35 line-through">{fmtMoney(business.currency, detailProduct.discountPrice)}</span>
                    <span className="rounded-full bg-[#25D366]/15 px-2.5 py-1 text-[10px] font-bold text-[#128C4B]">
                      Save {fmtMoney(business.currency, detailProduct.sellingPrice - detailProduct.discountPrice)}
                    </span>
                  </>
                )}
              </div>

              {/* description */}
              <p className="mt-4 text-[15px] leading-relaxed text-ink/75">
                {detailProduct.description ||
                  `Handcrafted with care by ${business.name}. This ${detailProduct.category.toLowerCase()} is made from quality materials and available per ${detailProduct.unit}. Order now and we'll deliver it to your door — or chat with us on WhatsApp for custom requests, sizing and bulk orders.`}
              </p>

              {/* qty + add */}
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2 rounded-full border border-ink/10 p-1.5">
                  <button onClick={() => setDQty((q) => Math.max(1, q - 1))} className="grid h-10 w-10 place-items-center rounded-full bg-cream text-ink transition-colors hover:bg-ink/10" aria-label="Decrease quantity"><Minus className="h-4 w-4" /></button>
                  <span className="w-10 text-center font-display text-lg font-extrabold">{dQty}</span>
                  <button onClick={() => setDQty((q) => Math.min(detailStock, q + 1))} className="grid h-10 w-10 place-items-center rounded-full bg-cream text-ink transition-colors hover:bg-ink/10" aria-label="Increase quantity"><Plus className="h-4 w-4" /></button>
                </div>
                <button
                  onClick={() => addQty(detailProduct.id, dQty)}
                  disabled={detailStock === 0}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-bold text-white shadow-lg transition-transform hover:-translate-y-0.5 disabled:opacity-40"
                  style={{ background: accent }}
                >
                  {addedFlash ? <><CheckCircle className="h-4 w-4" /> Added to cart ✓</> : <><ShoppingBag className="h-4 w-4" /> Add {dQty > 1 ? `${dQty} ` : ""}to cart — {fmtMoney(business.currency, detailProduct.sellingPrice * dQty)}</>}
                </button>
              </div>
              <p className="mt-2 text-xs text-ink/45">{dQty > 1 && detailStock > 0 ? `${dQty} × ${fmtMoney(business.currency, detailProduct.sellingPrice)}` : "Quantity updates in your cart — stock is reserved at checkout."}</p>

              {/* whatsapp */}
              <a
                href={waLink(whatsapp, `Hello! I'm interested in *${detailProduct.name}* (${fmtMoney(business.currency, detailProduct.sellingPrice)}${detailStock > 0 ? ` · ${detailStock} in stock` : " · out of stock"}) — is it available?`)}
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full border-2 border-[#25D366] py-3.5 text-sm font-bold text-[#128C4B] transition-colors hover:bg-[#25D366]/10"
              >
                <WhatsApp className="h-5 w-5" /> Order this item on WhatsApp
              </a>

              {/* meta */}
              <div className="mt-6 grid gap-3 rounded-2xl bg-cream p-5 text-sm sm:grid-cols-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-ink/45">Delivery</p>
                  <p className="mt-1 font-semibold">Free over {fmtMoney(business.currency, 50000)} · else {fmtMoney(business.currency, 2500)}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-ink/45">Payment</p>
                  <p className="mt-1 font-semibold">Card, transfer, USSD or QR — via Paystack</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-ink/45">Availability</p>
                  <p className={`mt-1 font-semibold ${detailStock === 0 ? "text-red-500" : detailStock <= detailProduct.threshold ? "text-[#b7791f]" : "text-forest"}`}>
                    {detailStock === 0 ? "Sold out — ask us on WhatsApp" : `${detailStock} in stock · ships in 1–2 days`}
                  </p>
                </div>
              </div>

              {/* related */}
              {related.length > 0 && (
                <div className="mt-7">
                  <h3 className="font-display text-base font-extrabold">You may also like</h3>
                  <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
                    {related.map((r) => (
                      <button key={r.id} onClick={() => setDetail(r.id)} className="flex w-36 shrink-0 flex-col items-center rounded-2xl border border-ink/5 p-3 text-center transition-all hover:-translate-y-0.5 hover:shadow-lg" style={{ background: cardBg }}>
                        <span className="grid h-14 w-14 place-items-center rounded-xl text-3xl" style={{ background: `${accent}12` }}>{r.emoji}</span>
                        <span className="mt-2 line-clamp-2 text-xs font-bold leading-snug">{r.name}</span>
                        <span className="mt-1 text-xs font-extrabold" style={{ color: accent }}>{fmtMoney(business.currency, r.sellingPrice)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* cart drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={() => setCartOpen(false)} />
          <div className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-ink/5 px-5 py-4">
              <h3 className="font-display text-lg font-extrabold text-ink">Your cart ({cartCount})</h3>
              <button onClick={() => setCartOpen(false)} className="grid h-9 w-9 place-items-center rounded-lg text-ink/40 hover:bg-ink/5" aria-label="Close"><X className="h-5 w-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {cart.length === 0 ? (
                <p className="py-16 text-center text-sm text-muted">Your cart is empty — add some products!</p>
              ) : (
                <div className="space-y-3">
                  {cart.map((c) => {
                    const stock = totalStock(db, c.productId);
                    return (
                      <div key={c.productId} className="flex items-center gap-3 rounded-2xl bg-cream p-3">
                        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white text-2xl shadow-sm">{c.emoji}</span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-ink">{c.name}</p>
                          <p className="text-xs text-muted">{fmtMoney(business.currency, c.price)} · {stock} in stock</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => setQty(c.productId, c.qty - 1)} className="grid h-7 w-7 place-items-center rounded-lg bg-white text-sm font-bold shadow-sm"><Minus className="h-3.5 w-3.5" /></button>
                          <span className="w-6 text-center text-sm font-bold text-ink">{c.qty}</span>
                          <button onClick={() => setQty(c.productId, c.qty + 1)} className="grid h-7 w-7 place-items-center rounded-lg bg-white text-sm font-bold shadow-sm"><Plus className="h-3.5 w-3.5" /></button>
                        </div>
                        <span className="w-16 text-right text-sm font-extrabold text-ink">{fmtMoney(business.currency, c.qty * c.price)}</span>
                        <button onClick={() => setCart((x) => x.filter((y) => y.productId !== c.productId))} className="grid h-7 w-7 place-items-center rounded-lg text-ink/35 hover:bg-red-50 hover:text-red-500" aria-label="Remove"><Trash className="h-3.5 w-3.5" /></button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            {cart.length > 0 && (
              <div className="border-t border-ink/5 px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4">
                <div className="mb-1 flex justify-between text-sm text-muted"><span>Subtotal</span><span className="font-bold text-ink">{fmtMoney(business.currency, subtotal)}</span></div>
                <div className="mb-3 flex justify-between text-sm text-muted"><span>Delivery</span><span className="font-bold text-ink">{delivery === 0 ? "Free" : fmtMoney(business.currency, delivery)}</span></div>
                <div className="mb-4 flex justify-between font-display text-lg font-extrabold text-ink"><span>Total</span><span>{fmtMoney(business.currency, total)}</span></div>
                <button onClick={checkout} className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-br from-brand-light to-brand py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand/25 transition-transform hover:-translate-y-0.5">
                  <Lock className="h-4 w-4" /> Secure checkout
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

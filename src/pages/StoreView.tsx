import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api";
import { cls, fm, rawNum } from "../lib/format";
import {
  Badge,
  Button,
  Icon,
  Input,
  Modal,
  Spinner,
  Thumb,
  toast,
} from "../components/ui";

interface StorefrontCategory {
  id: string;
  name: string;
}

interface StorefrontVariant {
  id: string;
  name: string;
  sellingPrice: string | null;
  stockStatus: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
}

interface StorefrontProduct {
  id: string;
  name: string;
  description: string | null;
  price: string;
  discountPrice: string | null;
  coverImageUrl: string | null;
  images: string[];
  category: StorefrontCategory | null;
  unit: { id: string; name: string } | null;
  variants: StorefrontVariant[];
  stockStatus: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
}

interface StorefrontCampaign {
  bannerTitle?: string | null;
  bannerSubtitle?: string | null;
  ctaLabel?: string | null;
  name?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
}

interface AnnouncementBar {
  enabled: boolean;
  text: string;
}

interface StorefrontResponse {
  storeName: string;
  subdomain: string;
  template: string;
  tagline: string | null;
  heroTitle: string | null;
  heroSubtitle: string | null;
  accentColor: string;
  whatsappButtonEnabled: boolean;
  whatsappNumber: string | null;
  showPoweredByBadge: boolean;
  ga4MeasurementId: string | null;

  socialLinks: {
    instagram: string | null;
    facebook: string | null;
    tiktok: string | null;
  };

  campaign: StorefrontCampaign | null;

  /*
   * IMPORTANT: these two may not exist on older backend deployments,
   * same as availablePaymentMethods below — read defensively.
   */
  logoUrl?: string | null;
  announcementBar?: AnnouncementBar | null;

  /*
   * IMPORTANT:
   * This property may not exist on older backend deployments.
   */
  availablePaymentMethods?: Array<"paystack" | "bank_transfer">;
}

interface StorefrontProductsResponse {
  items: StorefrontProduct[];
  nextCursor: string | null;
  total: number;
  message?: string;
}

interface BankDetails {
  bankName: string;
  accountName: string;
  accountNumber: string;
  reference: string;
}

interface PublicOrderView {
  id: string;
  status:
    | "PENDING"
    | "AWAITING_PAYMENT"
    | "PAID"
    | "SHIPPED"
    | "CANCELLED"
    | "REFUNDED"
    | "FAILED";
  paymentProvider: "paystack" | "bank_transfer";
  paymentReference: string;
  bankDetails: BankDetails | null;
}

interface CartLine {
  key: string;
  productId: string;
  variantId?: string;
  name: string;
  variantName?: string;
  price: number;
  qty: number;
  image?: string;
  stockStatus: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
}

type PaymentMethod = "paystack" | "bank_transfer";
type TemplateSlug = "classic" | "modern-grid" | "minimal-boutique";

const DEFAULT_CURRENCY = "NGN";

/*
 * ------------------------------------------------------------
 * Template tokens
 * ------------------------------------------------------------
 *
 * Each of the three seeded templates (classic / modern-grid /
 * minimal-boutique) gets its own structural + type treatment,
 * not just a recolor. Unknown/missing slugs fall back to
 * "classic" so old stores and template-less onboarding still
 * render correctly.
 */
function normalizeTemplate(slug?: string | null): TemplateSlug {
  if (slug === "modern-grid" || slug === "minimal-boutique") return slug;
  return "classic";
}

const TEMPLATE_TOKENS: Record<
  TemplateSlug,
  {
    pageBg: string;
    headerBg: string;
    headerText: string;
    headerBorder: string;
    logoBoxRadius: string;
    cardRadius: string;
    cardBorder: string;
    cardShadow: string;
    thumbRadius: string;
    ctaRadius: string;
    ctaCase: string;
    chipStyle: (active: boolean) => string;
    gridCols: string;
    gridGap: string;
    heroAlign: string;
    heroEyebrowCase: string;
    heroTitleClass: string;
    heroWrap: string;
    heroFrame: string;
    heroImgRadius: string;
    ctaHover: string;
    footerBg: string;
    footerText: string;
    footerBorder: string;
    productNameClass: string;
  }
> = {
  classic: {
    pageBg: "bg-cream-50",
    headerBg: "bg-white/90 backdrop-blur",
    headerText: "text-ink-900",
    headerBorder: "border-cream-200",
    logoBoxRadius: "rounded-xl",
    cardRadius: "rounded-2xl",
    cardBorder: "",
    cardShadow: "hover:-translate-y-0.5 hover:shadow-md",
    thumbRadius: "",
    ctaRadius: "rounded-lg",
    ctaCase: "uppercase tracking-wide",
    chipStyle: (active) => cls("chip", active && "chip-on"),
    gridCols: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
    gridGap: "gap-4",
    heroAlign: "text-left",
    heroEyebrowCase: "uppercase tracking-[0.16em]",
    heroTitleClass: "font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl",
    heroWrap: "max-w-2xl",
    heroFrame:
      "rounded-[1.4rem] border border-cream-200 bg-white p-2 shadow-2xl shadow-ink-900/10",
    heroImgRadius: "rounded-2xl",
    ctaHover: "hover:brightness-95",
    footerBg: "bg-white",
    footerText: "text-ink-900",
    footerBorder: "border-cream-200",
    productNameClass: "text-sm font-bold",
  },
  "modern-grid": {
    pageBg: "bg-white",
    headerBg: "bg-ink-900",
    headerText: "text-white",
    headerBorder: "border-ink-900",
    logoBoxRadius: "rounded-none",
    cardRadius: "rounded-none",
    cardBorder: "border border-ink-100",
    cardShadow: "hover:shadow-lg",
    thumbRadius: "rounded-none",
    ctaRadius: "rounded-none",
    ctaCase: "uppercase tracking-[0.1em]",
    chipStyle: (active) =>
      cls(
        "rounded-none border px-3.5 py-1.5 text-xs font-extrabold uppercase tracking-wide transition-colors",
        active
          ? "border-ink-900 bg-ink-900 text-white"
          : "border-ink-200 text-ink-500 hover:border-ink-900"
      ),
    gridCols: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
    gridGap: "gap-2.5",
    heroAlign: "text-left",
    heroEyebrowCase: "uppercase tracking-[0.25em]",
    heroTitleClass:
      "font-display text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-7xl",
    heroWrap: "max-w-3xl",
    heroFrame: "rounded-none border border-ink-100 bg-white p-1.5 shadow-lg",
    heroImgRadius: "rounded-sm",
    ctaHover: "hover:bg-ink-800",
    footerBg: "bg-ink-900",
    footerText: "text-white",
    footerBorder: "border-ink-800",
    productNameClass: "text-xs font-extrabold uppercase tracking-wide",
  },
  "minimal-boutique": {
    pageBg: "bg-white",
    headerBg: "bg-white",
    headerText: "text-ink-900",
    headerBorder: "border-ink-100",
    logoBoxRadius: "rounded-full",
    cardRadius: "rounded-none",
    cardBorder: "",
    cardShadow: "",
    thumbRadius: "",
    ctaRadius: "rounded-none",
    ctaCase: "",
    chipStyle: (active) =>
      cls(
        "border-b-2 px-1 pb-1 text-xs font-semibold uppercase tracking-[0.14em] transition-colors",
        active
          ? "border-ink-900 text-ink-900"
          : "border-transparent text-ink-300 hover:text-ink-600"
      ),
    gridCols: "grid-cols-2 lg:grid-cols-3",
    gridGap: "gap-x-8 gap-y-12",
    heroAlign: "text-center",
    heroEyebrowCase: "uppercase tracking-[0.3em]",
    heroTitleClass: "font-serif text-5xl italic leading-tight tracking-tight sm:text-6xl",
    heroWrap: "mx-auto max-w-xl",
    heroFrame:
      "rounded-none border border-ink-100 bg-white p-3 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.25)]",
    heroImgRadius: "rounded-[2px]",
    ctaHover: "hover:opacity-90",
    footerBg: "bg-white",
    footerText: "text-ink-900",
    footerBorder: "border-ink-100",
    productNameClass: "font-serif text-[15px]",
  },
};

/*
 * ------------------------------------------------------------
 * Payment-method normalization
 * ------------------------------------------------------------
 *
 * This is the important fix.
 *
 * We distinguish between:
 *
 * 1. availablePaymentMethods exists and is []
 *    -> backend explicitly says no methods.
 *
 * 2. availablePaymentMethods does not exist
 *    -> older backend contract/deployment.
 *
 * In case #2 we keep Paystack visible because Paystack is the
 * established Brikoh online checkout provider.
 *
 * The backend remains the final authority when checkout runs.
 */
function normalizePaymentMethods(response: any): PaymentMethod[] {
  const source =
    response?.availablePaymentMethods !== undefined ? response : response?.data;

  const fieldExists =
    source && Object.prototype.hasOwnProperty.call(source, "availablePaymentMethods");

  if (fieldExists) {
    if (!Array.isArray(source.availablePaymentMethods)) return [];
    return source.availablePaymentMethods.filter(
      (method: any): method is PaymentMethod =>
        method === "paystack" || method === "bank_transfer"
    );
  }

  // Backwards compatibility: expose Paystack instead of silently hiding checkout.
  return ["paystack"];
}

function checkoutErrorMessage(e: any): string {
  const code = e?.code || e?.body?.error?.code || e?.body?.code;

  const map: Record<string, string> = {
    VALIDATION_ERROR: "Please check your details and make sure everything is valid.",
    VARIANT_REQUIRED: "Please pick an option for that item.",
    VARIANT_NOT_FOUND: "That option isn't available anymore.",
    STORE_NOT_FOUND: "This store isn't available right now.",
    STORE_NOT_CONFIGURED: "This store isn't set up to take orders yet.",
    PRODUCT_UNAVAILABLE: "Something in your basket is no longer available.",
    INSUFFICIENT_STOCK: "One of your items just sold out — check your basket and try again.",
    DISCOUNT_UNAVAILABLE: "That discount code isn't active right now.",
    DISCOUNT_NOT_FOUND: "That discount code doesn't exist for this store.",
    PAYMENT_NOT_CONFIGURED: "This store hasn't configured Paystack payments yet.",
    PAYMENT_PROVIDER_ERROR: "Payment couldn't be started — please try again.",
    BANK_ACCOUNT_NOT_CONFIGURED: "This store hasn't configured bank-transfer payments yet.",
    INVALID_PAYMENT_METHOD: "This payment method isn't available for this store.",
    ORDER_ALREADY_PAID: "This order has already been paid.",
    ORDER_NOT_PENDING: "This order can no longer be marked as awaiting payment.",
    ORDER_NOT_FOUND: "We couldn't find that order.",
    RATE_LIMITED: "Too many attempts — please wait a moment and try again.",
  };

  if (e?.status === 429 || code === "RATE_LIMITED") return map.RATE_LIMITED;

  return map[code] || e?.message || "Checkout failed — please try again.";
}

function isAvailableStatus(status?: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK") {
  return status === "IN_STOCK" || status === "LOW_STOCK";
}

function stockLabel(status?: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK") {
  if (status === "OUT_OF_STOCK") return "Out";
  if (status === "LOW_STOCK") return "Low";
  return "In stock";
}

/* ----------------------------------------------------------
 * Product detail view — shown at #/s/:subdomain/p/:productId
 * Reuses the parent's `add()` so cart + checkout keep working.
 * ---------------------------------------------------------- */
function ProductDetail({
  product,
  accent,
  currency,
  onAdd,
  onBack,
}: {
  product: StorefrontProduct;
  accent: string;
  currency: string;
  onAdd: (p: StorefrontProduct, v?: StorefrontVariant) => void;
  onBack: () => void;
}) {
  const hasVariants = product.variants?.length > 0;
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    hasVariants ? (product.variants[0]?.id ?? null) : null
  );
  const [qty, setQty] = useState(1);

  const selectedVariant = hasVariants
    ? product.variants.find((v) => v.id === selectedVariantId)
    : undefined;

  const stock = selectedVariant ? selectedVariant.stockStatus : product.stockStatus;
  const out = stock === "OUT_OF_STOCK";
  const low = stock === "LOW_STOCK";

  const price = rawNum(
    selectedVariant?.sellingPrice ?? product.discountPrice ?? product.price
  );
  const original = rawNum(product.price);

  const images = product.images?.length
    ? product.images
    : product.coverImageUrl
    ? [product.coverImageUrl]
    : [];
  const [activeImg, setActiveImg] = useState(images[0] || "");

  const handleAdd = () => {
    if (out) return;
    if (hasVariants && !selectedVariant) return;
    for (let i = 0; i < qty; i++) onAdd(product, selectedVariant);
  };

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <button
        onClick={onBack}
        className="anim-rise mb-6 inline-flex items-center gap-1.5 text-sm font-bold text-ink-500 transition-colors hover:text-ink-900"
      >
        <Icon name="chevronLeft" size={16} />
        Back to shop
      </button>

      <div className="anim-rise grid gap-8 lg:grid-cols-2 lg:gap-12">
        {/* Gallery */}
        <div>
          <div className="group relative overflow-hidden rounded-3xl border border-cream-200 bg-white shadow-[0_20px_60px_-24px_rgba(20,15,10,0.18)]">
            <div
              className="pointer-events-none absolute -inset-10 -z-10 opacity-[0.08] blur-2xl"
              style={{ background: accent }}
            />
            <Thumb
              src={activeImg}
              alt={product.name}
              className="aspect-square w-full rounded-none transition-transform duration-700 group-hover:scale-[1.03]"
            />
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(img)}
                  className={cls(
                    "h-16 w-16 shrink-0 cursor-pointer overflow-hidden rounded-xl border-2 bg-white transition-all duration-200",
                    activeImg === img
                      ? "shadow-md"
                      : "border-cream-200 opacity-70 hover:opacity-100 hover:border-ink-300"
                  )}
                  style={activeImg === img ? { borderColor: accent } : undefined}
                >
                  <Thumb src={img} alt="" className="h-full w-full rounded-none" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          {product.category?.name && (
            <p
              className="text-xs font-extrabold uppercase tracking-[0.16em]"
              style={{ color: accent }}
            >
              {product.category.name}
            </p>
          )}

          <h1 className="mt-1.5 font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
            {product.name}
          </h1>

          <div className="mt-4 flex items-baseline gap-2.5">
            <span className="text-3xl font-extrabold tabular-nums" style={{ color: accent }}>
              {fm(price, currency)}
            </span>
            {product.discountPrice != null && (
              <span className="text-sm font-semibold text-ink-300 line-through">
                {fm(original, currency)}
              </span>
            )}
          </div>

          <div className="mt-4">
            {out ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-ink-100 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-ink-600">
                <span className="h-1.5 w-1.5 rounded-full bg-ink-400" />
                Sold out
              </span>
            ) : low ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-amber-700">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                Low stock
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-leaf-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-leaf-700">
                <span className="h-1.5 w-1.5 rounded-full bg-leaf-500" />
                In stock
              </span>
            )}
          </div>

          {hasVariants && (
            <div className="mt-6">
              <p className="text-sm font-extrabold">Select option</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.variants.map((v) => {
                  const vOut = v.stockStatus === "OUT_OF_STOCK";
                  const active = selectedVariantId === v.id;
                  return (
                    <button
                      key={v.id}
                      disabled={vOut}
                      onClick={() => setSelectedVariantId(v.id)}
                      className={cls(
                        "rounded-xl border-2 px-4 py-2.5 text-sm font-bold transition-all duration-150",
                        active
                          ? "text-white shadow-md"
                          : "border-cream-300 text-ink-600 hover:border-ink-900",
                        vOut && "cursor-not-allowed opacity-40"
                      )}
                      style={active ? { background: accent, borderColor: accent } : undefined}
                    >
                      {v.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-7 flex items-center gap-3">
            <div className="flex items-center rounded-xl border border-cream-300 bg-white">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="px-3.5 py-2.5 text-lg font-bold text-ink-500 transition-colors hover:text-ink-900"
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="w-10 text-center font-bold tabular-nums">{qty}</span>
              <button
                onClick={() => setQty((q) => Math.min(9999, q + 1))}
                className="px-3.5 py-2.5 text-lg font-bold text-ink-500 transition-colors hover:text-ink-900"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>

            <button
              onClick={handleAdd}
              disabled={out}
              className="relative flex flex-1 items-center justify-center gap-2 overflow-hidden rounded-xl py-3.5 text-[15px] font-extrabold text-white shadow-lg transition-all active:scale-[.99] disabled:cursor-not-allowed disabled:opacity-50"
              style={{ background: accent, boxShadow: `0 14px 30px -12px ${accent}` }}
            >
              <Icon name="cart" size={17} />
              {out ? "Sold out" : "Add to cart"}
            </button>
          </div>

          {product.description && (
            <div className="mt-8 border-t border-cream-200 pt-6">
              <p className="text-xs font-extrabold uppercase tracking-wide text-ink-400">
                Details
              </p>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-600">
                {product.description}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default function StoreView() {
  const { subdomain = "", productId } = useParams();
  const navigate = useNavigate();

  const [store, setStore] = useState<{ name: string; subdomain: string } | null>(null);
  const [products, setProducts] = useState<StorefrontProduct[]>([]);
  const [categories, setCategories] = useState<StorefrontCategory[]>([]);
  const [campaign, setCampaign] = useState<StorefrontCampaign | null>(null);

  const [settings, setSettings] = useState<{
    template?: string;
    tagline?: string | null;
    heroTitle?: string | null;
    heroSubtitle?: string | null;
    accentColor?: string;
    logoUrl?: string | null;
    announcementBar?: AnnouncementBar | null;
    whatsappButtonEnabled?: boolean;
    whatsappNumber?: string | null;
    showPoweredByBadge?: boolean;
    ga4MeasurementId?: string | null;
    socialLinks?: {
      instagram?: string | null;
      facebook?: string | null;
      tiktok?: string | null;
    };
  }>({});

  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<PaymentMethod[]>([]);

  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);

  const [productsCursor, setProductsCursor] = useState<string | null>(null);
  const [productsTotal, setProductsTotal] = useState(0);
  const [productsMessage, setProductsMessage] = useState<string | null>(null);

  const [catF, setCatF] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [variantPick, setVariantPick] = useState<StorefrontProduct | null>(null);
  const [code, setCode] = useState("");
  const [customer, setCustomer] = useState({ name: "", phone: "", email: "" });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("paystack");
  const [checkingOut, setCheckingOut] = useState(false);

  const [result, setResult] = useState<{
    number: string;
    orderId: string;
    total: string | number;
    provider: PaymentMethod;
    reference: string;
    redirectUrl: string | null;
    bankDetails: BankDetails | null;
    status: string;
  } | null>(null);

  const [orderView, setOrderView] = useState<PublicOrderView | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [markingPaid, setMarkingPaid] = useState(false);
  const [err, setErr] = useState("");

  /* ------------------------------------------------------------ Load storefront */

  const loadStorefront = useCallback(async () => {
    if (!subdomain.trim()) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setNotFound(false);
    setRateLimited(false);

    try {
      const rawResponse: any = await api.publicGet(
        `/api/public/storefront/${encodeURIComponent(subdomain)}`
      );

      // Some API clients return the body directly; others wrap it in { data }.
      const res: StorefrontResponse = rawResponse?.storeName ? rawResponse : rawResponse?.data;

      if (!res?.storeName) throw new Error("Store not found");

      setStore({ name: res.storeName, subdomain: res.subdomain || subdomain });

      setSettings({
        template: res.template,
        tagline: res.tagline,
        heroTitle: res.heroTitle,
        heroSubtitle: res.heroSubtitle,
        accentColor: res.accentColor,
        logoUrl: res.logoUrl ?? null,
        announcementBar: res.announcementBar ?? null,
        whatsappButtonEnabled: res.whatsappButtonEnabled,
        whatsappNumber: res.whatsappNumber,
        showPoweredByBadge: res.showPoweredByBadge,
        ga4MeasurementId: res.ga4MeasurementId,
        socialLinks: res.socialLinks || {},
      });

      setCampaign(res.campaign ?? null);

      // Do NOT do `Array.isArray(...) ? ... : []` — that hides Paystack
      // whenever an older backend doesn't yet return the new field.
      const methods = normalizePaymentMethods(rawResponse);
      setAvailablePaymentMethods(methods);

      if (methods.includes("paystack")) {
        setPaymentMethod("paystack");
      } else if (methods.includes("bank_transfer")) {
        setPaymentMethod("bank_transfer");
      } else {
        setPaymentMethod("paystack");
      }
    } finally {
      setLoading(false);
    }
  }, [subdomain]);

  /* ------------------------------------------------------------ Categories */

  const loadCategories = useCallback(async () => {
    try {
      const res: StorefrontCategory[] = await api.publicGet(
        `/api/public/storefront/${encodeURIComponent(subdomain)}/categories`
      );
      setCategories(Array.isArray(res) ? res : []);
    } catch (e: any) {
      if (e?.status === 429) setRateLimited(true);
      setCategories([]);
    }
  }, [subdomain]);

  /* ------------------------------------------------------------ Products */

  const loadProducts = useCallback(
    async (categoryId?: string) => {
      setProductsLoading(true);
      setProductsMessage(null);
      setProductsCursor(null);

      try {
        const params = new URLSearchParams();
        params.set("limit", "200");
        if (categoryId) params.set("categoryId", categoryId);

        const rawResponse: any = await api.publicGet(
          `/api/public/storefront/${encodeURIComponent(subdomain)}/products?${params.toString()}`
        );

        const res: StorefrontProductsResponse = rawResponse?.items
          ? rawResponse
          : rawResponse?.data || rawResponse;

        setProducts(Array.isArray(res?.items) ? res.items : []);
        setProductsCursor(res?.nextCursor ?? null);
        setProductsTotal(Number(res?.total ?? 0));
        setProductsMessage(res?.message ?? null);
      } catch (e: any) {
        if (e?.status === 429) setRateLimited(true);
        setProducts([]);
        setProductsCursor(null);
        setProductsTotal(0);
      } finally {
        setProductsLoading(false);
      }
    },
    [subdomain]
  );

  /* ------------------------------------------------------------ Load more products */

  const loadMoreProducts = useCallback(async () => {
    if (!productsCursor || loadingMore) return;
    setLoadingMore(true);

    try {
      const params = new URLSearchParams();
      params.set("limit", "200");
      params.set("cursor", productsCursor);

      const rawResponse: any = await api.publicGet(
        `/api/public/storefront/${encodeURIComponent(subdomain)}/products?${params.toString()}`
      );

      const res: StorefrontProductsResponse = rawResponse?.items
        ? rawResponse
        : rawResponse?.data || rawResponse;

      const incoming = Array.isArray(res?.items) ? res.items : [];
      setProducts((current) => [...current, ...incoming]);
      setProductsCursor(res?.nextCursor ?? null);
      setProductsTotal(Number(res?.total ?? productsTotal));
      setProductsMessage(res?.message ?? null);
    } catch (e: any) {
      if (e?.status === 429) setRateLimited(true);
      toast.error("Couldn't load more products.");
    } finally {
      setLoadingMore(false);
    }
  }, [subdomain, productsCursor, loadingMore, productsTotal]);

  /* ------------------------------------------------------------ Initial loading */

  useEffect(() => {
    loadStorefront();
    loadCategories();
    loadProducts();
  }, [loadStorefront, loadCategories, loadProducts]);

  /* ------------------------------------------------------------ Category filtering */

  useEffect(() => {
    if (!store) return;
    const categoryId = categories.find((category) => category.name === catF)?.id || "";
    loadProducts(categoryId || undefined);
  }, [catF, categories, store, loadProducts]);

  /* ------------------------------------------------------------ GA4 */

  useEffect(() => {
    const id = settings.ga4MeasurementId;
    if (!id || (window as any).gtag) return;

    const s1 = document.createElement("script");
    s1.async = true;
    s1.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
    document.head.appendChild(s1);

    const s2 = document.createElement("script");
    s2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${String(id).replace(/'/g, "\\'")}');
    `;
    document.head.appendChild(s2);

    return () => {
      s1.remove();
      s2.remove();
    };
  }, [settings.ga4MeasurementId]);

  /*
   * ------------------------------------------------------------
   * Payment-method self-heal
   * ------------------------------------------------------------
   * MOVED ABOVE THE EARLY RETURNS BELOW — this used to live after
   * the `notFound`/`loading`/`rateLimited` early `return`s, which
   * meant React skipped this hook on some renders and called it on
   * others ("Rendered more hooks than during the previous render").
   * Every hook must run unconditionally, on every render, in the
   * same order — so it lives here with the rest.
   */
  useEffect(() => {
    if (availablePaymentMethods.length === 0) return;
    if (availablePaymentMethods.includes(paymentMethod)) return;

    if (availablePaymentMethods.includes("paystack")) {
      setPaymentMethod("paystack");
      return;
    }
    if (availablePaymentMethods.includes("bank_transfer")) {
      setPaymentMethod("bank_transfer");
    }
  }, [availablePaymentMethods, paymentMethod]);

  const accent: string = settings.accentColor || "#D9532A";
  const tpl = normalizeTemplate(settings.template);
  const t = TEMPLATE_TOKENS[tpl];

  /* ------------------------------------------------------------ Stock helpers */

  const stockOf = (
    p: StorefrontProduct,
    variantId?: string
  ): "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" => {
    if (p.variants?.length && variantId) {
      const variant = p.variants.find((v) => v.id === variantId);
      return variant?.stockStatus || "OUT_OF_STOCK";
    }
    return p.stockStatus;
  };

  const effPrice = (p: StorefrontProduct) => rawNum(p.discountPrice ?? p.price);

  const variantPrice = (p: StorefrontProduct, variant?: StorefrontVariant) =>
    rawNum(variant?.sellingPrice ?? p.discountPrice ?? p.price);

  /* ------------------------------------------------------------ Add to cart */

  const add = (p: StorefrontProduct, variant?: StorefrontVariant) => {
    const status = stockOf(p, variant?.id);

    if (!isAvailableStatus(status)) {
      toast.error("That's out of stock right now.");
      return;
    }

    const price = variant ? variantPrice(p, variant) : effPrice(p);
    const key = `${p.id}:${variant?.id || "base"}`;

    setCart((current) => {
      const existing = current.find((line) => line.key === key);

      if (existing) {
        if (existing.qty >= 9999) {
          toast.error("You can't add more than 9,999 of an item.");
          return current;
        }
        return current.map((line) =>
          line.key === key ? { ...line, qty: line.qty + 1 } : line
        );
      }

      return [
        ...current,
        {
          key,
          productId: p.id,
          variantId: variant?.id,
          name: p.name,
          variantName: variant?.name,
          price,
          qty: 1,
          image: p.coverImageUrl || p.images?.[0],
          stockStatus: status,
        },
      ];
    });

    if (!variant) setCartOpen(true);
  };

  /* ------------------------------------------------------------ Quantity */

  const bump = (key: string, d: number) => {
    setCart((current) =>
      current
        .map((line) => {
          if (line.key !== key) return line;
          const nextQty = Math.min(9999, Math.max(0, line.qty + d));
          return { ...line, qty: nextQty };
        })
        .filter((line) => line.qty > 0)
    );
  };

  const subtotal = cart.reduce((total, line) => total + line.price * line.qty, 0);
  const count = cart.reduce((total, line) => total + line.qty, 0);

  /* ------------------------------------------------------------ Campaign */

  const campaignLive = useMemo(() => {
    if (!campaign) return false;
    const now = Date.now();
    if (campaign.startsAt && new Date(campaign.startsAt).getTime() > now) return false;
    if (campaign.endsAt && new Date(campaign.endsAt).getTime() < now) return false;
    return true;
  }, [campaign]);

  /* ------------------------------------------------------------ Get order */

  const fetchOrder = useCallback(async (orderId: string) => {
    setLoadingOrder(true);
    try {
      const rawResponse: any = await api.publicGet(
        `/api/public/orders/${encodeURIComponent(orderId)}`
      );
      const res: PublicOrderView = rawResponse?.id ? rawResponse : rawResponse?.data;
      setOrderView(res);
      return res;
    } catch (e: any) {
      setErr(checkoutErrorMessage(e));
      return null;
    } finally {
      setLoadingOrder(false);
    }
  }, []);

  /* ------------------------------------------------------------ Mark bank transfer paid */

  const markPaid = async () => {
    if (!result?.orderId) return;
    setMarkingPaid(true);
    setErr("");

    try {
      const rawResponse: any = await api.publicPost(
        `/api/public/orders/${encodeURIComponent(result.orderId)}/mark-paid`,
        {}
      );
      const res: PublicOrderView = rawResponse?.id ? rawResponse : rawResponse?.data;
      setOrderView(res);
      setResult((current) => (current ? { ...current, status: res.status } : current));
      toast.success("Payment marked as sent.");
    } catch (e: any) {
      setErr(checkoutErrorMessage(e));
      const code = e?.code || e?.body?.error?.code;
      if (code === "ORDER_ALREADY_PAID") await fetchOrder(result.orderId);
    } finally {
      setMarkingPaid(false);
    }
  };

  /* ------------------------------------------------------------ Checkout */

  const checkout = async () => {
    if (!cart.length) return;
    setErr("");

    if (!customer.name.trim()) return setErr("Please enter your name.");
    if (!customer.email.trim()) return setErr("Please enter your email.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email.trim())) {
      return setErr("Please enter a valid email address.");
    }

    // Only block when the backend explicitly said there are no payment methods.
    // If Paystack was supplied as the backwards-compatible default, proceed.
    if (availablePaymentMethods.length === 0) {
      return setErr("This store hasn't configured a payment method yet.");
    }
    if (!availablePaymentMethods.includes(paymentMethod)) {
      return setErr("That payment method isn't currently available for this store.");
    }

    setCheckingOut(true);

    try {
      const payload = {
        customer: {
          name: customer.name.trim(),
          email: customer.email.trim(),
          ...(customer.phone.trim() ? { phone: customer.phone.trim() } : {}),
        },
        items: cart.map((line) => ({
          productId: line.productId,
          ...(line.variantId ? { variantId: line.variantId } : {}),
          quantity: line.qty,
        })),
        ...(code.trim() ? { discountCode: code.trim().toUpperCase() } : {}),
        origin: "DIRECT",
        paymentMethod,
      };

      const rawResponse: any = await api.publicPost(
        `/api/public/checkout/${encodeURIComponent(subdomain)}`,
        payload
      );

      const res = rawResponse?.order ? rawResponse : rawResponse?.data || rawResponse;
      const order = res?.order;
      const payment = res?.payment;

      if (!order?.id || !order?.orderNumber) {
        throw new Error("Invalid checkout response.");
      }

      const provider: PaymentMethod =
        payment?.provider === "bank_transfer" ? "bank_transfer" : "paystack";

      setResult({
        number: order.orderNumber,
        orderId: order.id,
        total: order.total,
        provider,
        reference: payment?.reference || "",
        redirectUrl: payment?.redirectUrl || null,
        bankDetails: payment?.bankDetails || null,
        status: order.status || "PENDING",
      });

      setOrderView(null);
      setCart([]);
      setCode("");

      // Paystack: never mark paid from the frontend.
      if (provider === "paystack" && payment?.redirectUrl) {
        window.location.assign(payment.redirectUrl);
        return;
      }

      if (provider === "paystack" && !payment?.redirectUrl) {
        setErr("Paystack checkout was created, but no payment URL was returned. Please try again.");
        return;
      }

      if (provider === "bank_transfer") setCartOpen(true);
    } catch (e: any) {
      setErr(checkoutErrorMessage(e));
    } finally {
      setCheckingOut(false);
    }
  };

  /* ------------------------------------------------------------ Loading */

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-cream-50 to-cream-100">
        <div className="flex flex-col items-center gap-4">
          <span
            className="flex h-14 w-14 items-center justify-center rounded-2xl shadow-xl"
            style={{ background: "#D9532A", boxShadow: "0 16px 40px -16px #D9532A" }}
          >
            <Icon name="logo" size={28} className="text-white" />
          </span>
          <Spinner size={20} className="text-ink-300" />
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------ Rate limit */

  if (rateLimited) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-gradient-to-b from-cream-50 to-cream-100 px-6 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-amber-600 shadow-sm">
          <Icon name="clock" size={26} />
        </span>
        <h1 className="font-display text-2xl font-extrabold">Hold on a moment</h1>
        <p className="max-w-sm text-sm text-ink-400">
          This page is getting a lot of traffic — try again in a few seconds.
        </p>
        <Button
          onClick={() => {
            loadStorefront();
            loadCategories();
            loadProducts();
          }}
        >
          Retry
        </Button>
      </div>
    );
  }

  /* ------------------------------------------------------------ Not found */

  if (notFound || !store) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-gradient-to-b from-cream-50 to-cream-100 px-6 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-500 shadow-sm">
          <Icon name="store" size={28} />
        </span>
        <h1 className="font-display text-3xl font-extrabold">This store isn't here</h1>
        <p className="max-w-sm text-sm text-ink-400">
          The store "{subdomain}" doesn't exist or isn't live yet. Ask the seller for the right
          link.
        </p>
        <Link to="/" className="mt-2 text-sm font-bold text-brand-600 hover:underline">
          ← Back to brikoh.com
        </Link>
      </div>
    );
  }

  const social = settings.socialLinks || {};
  const hasSocial = !!(social.instagram || social.facebook || social.tiktok);

  const filtered = products.filter((product) => {
    if (!catF) return true;
    return product.category?.name === catF;
  });

  const showDetail = !!productId;
  const detail = productId ? products.find((p) => p.id === productId) : undefined;

  const paystackAvailable = availablePaymentMethods.includes("paystack");
  const bankTransferAvailable = availablePaymentMethods.includes("bank_transfer");
  const announcement = settings.announcementBar;
  const showAnnouncement = !!(announcement?.enabled && announcement?.text?.trim());

  const scrollToProducts = () =>
    document.getElementById("products")?.scrollIntoView({ behavior: "smooth", block: "start" });

  const heroProducts = products.filter((p) => p.coverImageUrl || p.images?.[0]);
  const heroImg = heroProducts[0]?.coverImageUrl || heroProducts[0]?.images?.[0] || "";
  const heroProd = heroImg ? heroProducts[0] : undefined;
  const heroPrice = heroProd ? rawNum(heroProd.discountPrice ?? heroProd.price) : null;
  const heroUnit = heroProd?.unit?.name || "";

  return (
    <div className={cls("min-h-screen", t.pageBg)}>
      <style>{`
        @keyframes storefrontShine {
          0% { transform: translateX(-120%) skewX(-12deg); }
          100% { transform: translateX(220%) skewX(-12deg); }
        }
        @keyframes storefrontFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes storefrontDrift {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(2%, -3%) scale(1.05); }
          100% { transform: translate(0, 0) scale(1); }
        }
        .sf-shine { position: relative; overflow: hidden; }
        .sf-shine::after {
          content: "";
          position: absolute;
          top: 0; left: 0;
          height: 100%; width: 40%;
          background: linear-gradient(115deg, transparent, rgba(255,255,255,0.32), transparent);
          transform: translateX(-120%) skewX(-12deg);
          pointer-events: none;
        }
        .sf-shine:hover::after { animation: storefrontShine 1.1s ease; }
        .sf-float { animation: storefrontFloat 4.5s ease-in-out infinite; }
        .sf-drift { animation: storefrontDrift 14s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .sf-shine::after, .sf-float, .sf-drift { animation: none !important; }
        }
      `}</style>

      {/* ANNOUNCEMENT BAR */}
      {showAnnouncement && (
        <div
          className="sf-shine px-4 py-2.5 text-center text-xs font-extrabold uppercase tracking-wide text-white"
          style={{ background: `linear-gradient(90deg, ${accent}, ${accent}CC)` }}
        >
          {announcement!.text}
        </div>
      )}

      {/* HEADER */}
      <header
        className={cls(
          "sticky top-0 z-30 border-b shadow-[0_1px_0_rgba(0,0,0,0.02)]",
          t.headerBg,
          t.headerText,
          t.headerBorder
        )}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
          {settings.logoUrl ? (
            <img
              src={settings.logoUrl}
              alt={store.name}
              className={cls("h-10 w-10 object-cover ring-1 ring-black/5", t.logoBoxRadius)}
            />
          ) : tpl === "minimal-boutique" ? (
            <span className="font-serif text-xl italic tracking-tight">{store.name}</span>
          ) : (
            <span
              className={cls(
                "flex h-10 w-10 items-center justify-center text-white shadow-sm",
                t.logoBoxRadius
              )}
              style={{ background: `linear-gradient(135deg, ${accent}, ${accent}CC)` }}
            >
              <span className="font-display text-lg font-extrabold">
                {(store.name || "S").slice(0, 1).toUpperCase()}
              </span>
            </span>
          )}

          {tpl !== "minimal-boutique" && (
            <div className="leading-tight">
              <p
                className={cls(
                  "font-display text-lg font-extrabold",
                  tpl === "modern-grid" && "uppercase tracking-[0.08em]"
                )}
              >
                {store.name}
              </p>
            </div>
          )}

          {tpl === "minimal-boutique" ? (
            <button
              onClick={() => setCartOpen(true)}
              className="relative ml-auto flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] transition-opacity hover:opacity-70"
            >
              <Icon name="cart" size={16} />
              Cart{count > 0 ? ` (${count})` : ""}
            </button>
          ) : (
            <button
              onClick={() => setCartOpen(true)}
              className={cls(
                "sf-shine relative ml-auto flex items-center gap-2 px-4 py-2.5 text-sm font-extrabold text-white shadow-sm transition-transform active:scale-[.97]",
                t.ctaRadius
              )}
              style={{ background: `linear-gradient(135deg, ${accent}, ${accent}DD)` }}
            >
              <Icon name="cart" size={17} />
              Cart
              {count > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-ink-900 px-1 text-[10px] font-extrabold text-white shadow-sm ring-2 ring-white">
                  {count}
                </span>
              )}
            </button>
          )}
        </div>
      </header>

      {/* PRODUCT DETAIL (when a product is opened) */}
      {showDetail ? (
        detail ? (
          <ProductDetail
            key={detail.id}
            product={detail}
            accent={accent}
            currency={DEFAULT_CURRENCY}
            onAdd={add}
            onBack={() => navigate(`/s/${store.subdomain}`)}
          />
        ) : productsLoading ? (
          <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <div className="card flex flex-col items-center gap-3 px-6 py-16 text-center">
              <Spinner size={24} className="text-ink-400" />
              <p className="text-sm font-bold text-ink-500">Loading product…</p>
            </div>
          </section>
        ) : (
          <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <div className="card flex flex-col items-center gap-2 px-6 py-16 text-center">
              <Icon name="box" size={28} className="text-brand-300" />
              <p className="font-display text-lg font-extrabold">That product isn't here</p>
              <p className="text-sm text-ink-400">It may have sold out or been removed.</p>
              <button
                onClick={() => navigate(`/s/${store.subdomain}`)}
                className="mt-2 text-sm font-bold text-brand-600 hover:underline"
              >
                ← Back to the shop
              </button>
            </div>
          </section>
        )
      ) : (
        <>
      {/* HERO */}
      <section
        className={cls(
          "relative overflow-hidden",
          tpl === "minimal-boutique" ? "pt-14 pb-10" : "pt-12 pb-10"
        )}
      >
        {/* soft page wash behind the hero */}
        <div
          className="sf-drift pointer-events-none absolute -right-24 -top-24 -z-10 h-[26rem] w-[26rem] rounded-full opacity-[0.14] blur-3xl"
          style={{ background: accent }}
        />
        <div
          className={cls(
            "pointer-events-none absolute inset-0 -z-10",
            tpl === "classic"
              ? "bg-gradient-to-b from-brand-50/60 via-transparent to-transparent"
              : tpl === "modern-grid"
              ? "bg-gradient-to-b from-ink-900/[0.04] via-transparent to-transparent"
              : ""
          )}
        />

        <div
          className={cls(
            "mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-14"
          )}
        >
          {/* LEFT — copy */}
          <div
            className={cls(
              "anim-rise relative",
              tpl === "minimal-boutique" ? "mx-auto text-center" : t.heroAlign
            )}
          >
            {tpl !== "minimal-boutique" && settings.tagline && (
              <p
                className={cls(
                  "inline-flex items-center gap-1.5 text-xs font-extrabold",
                  t.heroEyebrowCase
                )}
                style={{ color: accent }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: accent }} />
                {settings.tagline}
              </p>
            )}

            <h1 className={cls("mt-2", t.heroTitleClass)}>
              {settings.heroTitle || `Shop ${store.name}`}
            </h1>

            {tpl === "minimal-boutique" && settings.tagline && (
              <p className={cls("mt-4 text-xs font-extrabold", t.heroEyebrowCase)} style={{ color: accent }}>
                {settings.tagline}
              </p>
            )}

            {tpl === "minimal-boutique" && (
              <div className="mx-auto mt-4 h-px w-12" style={{ background: accent }} />
            )}

            <p
              className={cls(
                "mt-3 leading-relaxed text-ink-500",
                tpl === "minimal-boutique" ? "text-sm" : "text-[15px]"
              )}
            >
              {settings.heroSubtitle || "Browse the shelf, fill your basket, pay your way."}
            </p>

            {/* CTA row */}
            <div
              className={cls(
                "mt-7 flex flex-wrap items-center gap-3",
                tpl === "minimal-boutique" && "justify-center"
              )}
            >
              <button
                onClick={scrollToProducts}
                className={cls(
                  "sf-shine inline-flex items-center gap-2 px-6 py-3.5 text-sm font-extrabold text-white shadow-lg transition-all active:scale-[.99]",
                  t.ctaRadius,
                  t.ctaCase,
                  t.ctaHover
                )}
                style={{
                  background: `linear-gradient(135deg, ${accent}, ${accent}DD)`,
                  boxShadow: `0 14px 32px -10px ${accent}`,
                }}
              >
                Shop now
                <Icon name="arrowRight" size={16} />
              </button>
              <button
                onClick={scrollToProducts}
                className={cls(
                  "inline-flex items-center gap-2 rounded-xl border px-6 py-3.5 text-sm font-extrabold backdrop-blur transition-colors",
                  tpl === "modern-grid"
                    ? "border-ink-200 text-ink-700 hover:border-ink-900"
                    : "border-cream-300 bg-white/60 text-ink-700 hover:border-ink-900"
                )}
              >
                Browse categories
              </button>
            </div>

            {/* Trust row */}
            <div
              className={cls(
                "mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] font-semibold text-ink-500",
                tpl === "minimal-boutique" && "justify-center"
              )}
            >
              <span className="inline-flex items-center gap-1.5">
                <Icon name="shield" size={14} className="text-leaf-600" />
                Secure checkout
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Icon name="wallet" size={14} className="text-leaf-600" />
                Pay your way
              </span>
              {productsTotal > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="box" size={14} className="text-leaf-600" />
                  {productsTotal} on the shelf
                </span>
              )}
            </div>
          </div>

          {/* RIGHT — featured product visual */}
          <div
            className={cls(
              "anim-rise",
              tpl === "minimal-boutique" ? "order-first lg:order-none" : ""
            )}
          >
            <div className={cls("sf-float relative mx-auto max-w-md", t.heroFrame)}>
              <div
                className="pointer-events-none absolute -inset-6 -z-10 rounded-[2rem] opacity-30 blur-2xl"
                style={{ background: accent }}
              />
              {heroImg ? (
                <>
                  <Thumb
                    src={heroImg}
                    alt={store.name}
                    className={cls("aspect-[4/3] w-full object-cover", t.heroImgRadius)}
                  />
                  {heroPrice != null && (
                    <span
                      className={cls(
                        "absolute -bottom-4 left-4 inline-flex items-baseline gap-1 rounded-xl bg-white px-3.5 py-2 shadow-xl ring-1 ring-black/5",
                        tpl === "modern-grid" && "rounded-none"
                      )}
                    >
                      <span className="text-sm font-extrabold tabular-nums" style={{ color: accent }}>
                        {fm(heroPrice, DEFAULT_CURRENCY)}
                      </span>
                      {heroUnit && (
                        <span className="text-[11px] font-semibold text-ink-400">/ {heroUnit}</span>
                      )}
                    </span>
                  )}
                  {heroProd?.discountPrice != null && (
                    <span
                      className="absolute right-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase text-white shadow-md"
                      style={{ background: `linear-gradient(135deg, ${accent}, ${accent}DD)` }}
                    >
                      Sale
                    </span>
                  )}
                </>
              ) : (
                <div
                  className="flex aspect-[4/3] w-full items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${accent}, ${accent}CC)` }}
                >
                  <Icon name="store" size={56} className="text-white" />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CAMPAIGN */}
     {/* CAMPAIGN */}
{campaignLive && (
  <section className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
    <div
      className={cls(
        "sf-shine anim-rise relative overflow-hidden px-6 py-8 text-white shadow-xl",
        tpl === "classic" ? "rounded-2xl" : tpl === "modern-grid" ? "rounded-none" : "rounded-2xl"
      )}
      style={{
        background: `linear-gradient(120deg, ${accent}, ${accent}CC 60%, ${accent})`,
        boxShadow: `0 24px 50px -20px ${accent}`,
      }}
    >
      <div className="pointer-events-none absolute -right-8 -top-10 h-52 w-52 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-black/10" />
      <div className="relative">
        <p className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.18em] opacity-90">
          <span className="h-1.5 w-1.5 rounded-full bg-white" />
          Limited offer
        </p>
        <p className="mt-1 font-display text-2xl font-extrabold sm:text-3xl">
          {campaign?.bannerTitle || campaign?.name}
        </p>
        {campaign?.bannerSubtitle && (
          <p className="mt-1 max-w-xl text-sm font-semibold opacity-90">{campaign.bannerSubtitle}</p>
        )}
        {campaign?.ctaLabel && (
          <div className="mt-5">
            <button
              onClick={scrollToProducts}
              className={cls(
                "inline-flex items-center gap-2 bg-white px-5 py-2.5 text-sm font-extrabold shadow-lg transition-transform hover:scale-105 active:scale-[.98]",
                tpl === "modern-grid" ? "rounded-none" : "rounded-xl"
              )}
              style={{ color: accent }}
            >
              {campaign.ctaLabel}
              <Icon name="arrowRight" size={15} />
            </button>
          </div>
        )}
      </div>
    </div>
  </section>
)}


      {/* CATEGORIES + PRODUCTS */}
      <section id="products" className="mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-6">
        {categories.length > 0 && (
          <div
            className={cls(
              "mb-6 flex flex-wrap gap-2",
              tpl === "minimal-boutique" && "justify-center gap-6"
            )}
          >
            <button className={t.chipStyle(!catF)} onClick={() => setCatF("")}>
              All
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                className={t.chipStyle(catF === category.name)}
                onClick={() => setCatF(category.name)}
              >
                {category.name}
              </button>
            ))}
          </div>
        )}

        {productsLoading ? (
          <div className="card flex flex-col items-center gap-3 px-6 py-16 text-center">
            <Spinner size={24} className="text-ink-400" />
            <p className="text-sm font-bold text-ink-500">Loading products…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card flex flex-col items-center gap-3 px-6 py-16 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-400">
              <Icon name="box" size={26} />
            </span>
            <p className="font-display text-lg font-extrabold">The shelf is empty right now</p>
            <p className="text-sm text-ink-400">
              {productsMessage || "Check back soon — fresh stock is on its way."}
            </p>
          </div>
        ) : (
          <>
            <div className={cls("grid", t.gridCols, t.gridGap)}>
              {filtered.map((p, i) => {
                const hasVariants = p.variants?.length > 0;
                const stock = p.stockStatus;

                return (
                <div
  key={p.id}
  className={cls(
    "anim-rise group relative overflow-hidden transition-all duration-300",
    tpl === "minimal-boutique"
      ? ""
      : "hover:-translate-y-1.5 hover:shadow-[0_22px_46px_-18px_rgba(0,0,0,0.3)]",
    t.cardRadius,
    t.cardBorder,
    t.cardShadow,
    tpl === "classic" && "card"
  )}
  style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
>
  {tpl !== "minimal-boutique" && (
    <span
      className="pointer-events-none absolute inset-x-0 top-0 z-10 h-0.5 origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100"
      style={{ background: accent }}
    />
  )}


                    <Link
                      to={`/s/${store.subdomain}/p/${p.id}`}
                      className="relative block overflow-hidden"
                    >
                      <Thumb
                        src={p.coverImageUrl || p.images?.[0]}
                        alt={p.name}
                        className={cls(
                          "w-full transition-transform duration-500 group-hover:scale-[1.07]",
                          tpl === "minimal-boutique" ? "h-56 sm:h-64" : "h-40",
                          t.thumbRadius
                        )}
                      />

                      {p.discountPrice != null && (
                        <span
                          className={cls(
                            "absolute left-2 top-2 px-2 py-0.5 text-[10px] font-extrabold uppercase text-white shadow-sm",
                            tpl === "modern-grid" ? "rounded-none" : "rounded-full"
                          )}
                          style={{ background: `linear-gradient(135deg, ${accent}, ${accent}DD)` }}
                        >
                          Sale
                        </span>
                      )}

                      {stock === "OUT_OF_STOCK" && !hasVariants && (
                        <span className="absolute inset-0 flex items-center justify-center bg-ink-900/50 text-xs font-extrabold uppercase tracking-wider text-white backdrop-blur-[1px]">
                          Sold out
                        </span>
                      )}
                    </Link>

                    <div className={cls(tpl === "minimal-boutique" ? "pt-3" : "p-3.5")}>
                      <p>
                        <Link
                          to={`/s/${store.subdomain}/p/${p.id}`}
                          className={cls(
                            "block truncate transition-colors hover:opacity-70",
                            t.productNameClass
                          )}
                        >
                          {p.name}
                        </Link>
                      </p>

                      <div className="mt-1.5 flex items-center justify-between">
                        <span
                          className={cls(
                            "tabular-nums",
                            tpl === "minimal-boutique"
                              ? "font-serif text-sm"
                              : "text-sm font-extrabold"
                          )}
                        >
                          <span style={{ color: accent }}>
                            {fm(effPrice(p), DEFAULT_CURRENCY)}
                          </span>
                          {p.discountPrice != null && (
                            <span className="ml-1.5 text-xs font-semibold text-ink-300 line-through">
                              {fm(rawNum(p.price), DEFAULT_CURRENCY)}
                            </span>
                          )}
                        </span>
                      </div>

                      {!hasVariants && stock === "LOW_STOCK" && (
                        <p className="mt-1 inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wide text-amber-600">
                          <span className="h-1 w-1 rounded-full bg-amber-500" />
                          Low stock
                        </p>
                      )}

                      {tpl === "minimal-boutique" ? (
                        <button
                          disabled={!hasVariants && stock === "OUT_OF_STOCK"}
                          onClick={() => (hasVariants ? setVariantPick(p) : add(p))}
                          className="group/cta mt-2.5 inline-flex items-center gap-1.5 border-b border-ink-900 pb-0.5 text-xs font-semibold uppercase tracking-[0.1em] transition-colors hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          Add to cart
                          <Icon name="arrowRight" size={12} className="transition-transform group-hover/cta:translate-x-0.5" />
                        </button>
                      ) : (
                        <button
                          disabled={!hasVariants && stock === "OUT_OF_STOCK"}
                          onClick={() => (hasVariants ? setVariantPick(p) : add(p))}
                          className={cls(
                            "group/cta mt-2.5 flex w-full items-center justify-center gap-2 py-2 text-xs font-extrabold text-white shadow-sm transition-all active:scale-[.98] disabled:opacity-40",
                            t.ctaRadius,
                            t.ctaCase,
                            t.ctaHover
                          )}
                          style={{ background: `linear-gradient(135deg, ${accent}, ${accent}DD)` }}
                        >
                          <Icon name="cart" size={14} className="transition-transform group-hover/cta:-translate-x-0.5" />
                          Add to cart
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {productsCursor && (
              <div className="mt-8 flex justify-center">
                <Button variant="ghost" onClick={loadMoreProducts} disabled={loadingMore}>
                  {loadingMore ? (
                    <span className="flex items-center gap-2">
                      <Spinner size={15} />
                      Loading…
                    </span>
                  ) : (
                    "Load more products"
                  )}
                </Button>
              </div>
            )}

            {productsTotal > products.length && (
              <p className="mt-3 text-center text-xs text-ink-400">
                Showing {products.length} of {productsTotal} products
              </p>
            )}
          </>
        )}
      </section>
      </>
      )}

      {/* FOOTER */}
      <footer className={cls("border-t", t.footerBg, t.footerText, t.footerBorder)}>
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 sm:flex-row sm:px-6">
          <p
            className={cls(
              "text-sm font-extrabold",
              tpl === "minimal-boutique" && "font-serif italic tracking-tight"
            )}
          >
            {store.name}
          </p>

          {hasSocial && (
            <div className="flex items-center gap-3">
              {social.instagram && (
                <a
                  href={social.instagram}
                  target="_blank"
                  rel="noreferrer"
                  className={cls(
                    "hover:opacity-70",
                    tpl === "modern-grid" ? "text-white/60" : "text-ink-400"
                  )}
                >
                  <Icon name="instagram" size={16} />
                </a>
              )}
              {social.facebook && (
                <a
                  href={social.facebook}
                  target="_blank"
                  rel="noreferrer"
                  className={cls(
                    "hover:opacity-70",
                    tpl === "modern-grid" ? "text-white/60" : "text-ink-400"
                  )}
                >
                  <Icon name="facebook" size={16} />
                </a>
              )}
              {social.tiktok && (
                <a
                  href={social.tiktok}
                  target="_blank"
                  rel="noreferrer"
                  className={cls(
                    "hover:opacity-70",
                    tpl === "modern-grid" ? "text-white/60" : "text-ink-400"
                  )}
                >
                  <Icon name="tiktok" size={16} />
                </a>
              )}
            </div>
          )}

          {settings.showPoweredByBadge && (
            <Link
              to="/"
              className={cls(
                "flex items-center gap-2 text-xs font-bold hover:opacity-70",
                tpl === "modern-grid" ? "text-white/60" : "text-ink-400"
              )}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-brand-500 text-white">
                <Icon name="logo" size={13} />
              </span>
              Powered by Brikoh
            </Link>
          )}
        </div>
      </footer>

      {/* WHATSAPP */}
      {settings.whatsappButtonEnabled && settings.whatsappNumber && (
        <a
          href={`https://wa.me/${settings.whatsappNumber.replace(/\D/g, "")}`}
          target="_blank"
          rel="noreferrer"
          className="sf-float fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105"
          aria-label="Chat on WhatsApp"
        >
          <Icon name="whatsapp" size={26} />
        </a>
      )}

      {/* VARIANT MODAL */}
      <Modal
        open={!!variantPick}
        onClose={() => setVariantPick(null)}
        title={variantPick?.name || ""}
        sub="Pick your option."
      >
        {variantPick?.variants?.map((v) => {
          const status = v.stockStatus;
          return (
            <button
              key={v.id}
              disabled={status === "OUT_OF_STOCK"}
              onClick={() => {
                add(variantPick, v);
                setVariantPick(null);
              }}
              className="mb-2 flex w-full items-center justify-between gap-3 rounded-xl border border-cream-200 px-4 py-3 text-left transition-all hover:border-brand-300 hover:shadow-sm disabled:opacity-50"
            >
              <div>
                <p className="text-sm font-bold">{v.name}</p>
                <p className="text-xs text-ink-400">
                  {fm(variantPrice(variantPick, v), DEFAULT_CURRENCY)}
                </p>
              </div>
              <Badge
                tone={status === "OUT_OF_STOCK" ? "danger" : status === "LOW_STOCK" ? "gold" : "green"}
              >
                {stockLabel(status)}
              </Badge>
            </button>
          );
        })}
      </Modal>

      {/* CART DRAWER */}
      {cartOpen && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-ink-900/50 backdrop-blur-[3px]"
            onClick={() => setCartOpen(false)}
          />

          <div className="anim-rise absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-cream-200 px-5 py-4">
              <h3 className="font-display text-lg font-extrabold">
                {result ? "Order & payment" : "Your basket"}
              </h3>
              <button
                className="rounded-lg p-2 text-ink-400 transition-colors hover:bg-cream-100 hover:text-ink-700"
                onClick={() => setCartOpen(false)}
                aria-label="Close cart"
              >
                <Icon name="x" size={18} />
              </button>
            </div>

            <div className="scrollbar-slim flex-1 overflow-y-auto">
              {result ? (
                <div className="px-5 py-6">
                  <div className="text-center">
                    <span
                      className={cls(
                        "mx-auto flex h-16 w-16 items-center justify-center rounded-full shadow-md",
                        result.provider === "bank_transfer"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-leaf-100 text-leaf-700"
                      )}
                    >
                      <Icon
                        name={result.provider === "bank_transfer" ? "bank" : "check"}
                        size={28}
                        strokeWidth={2.6}
                      />
                    </span>
                    <p className="mt-3 font-display text-xl font-extrabold">
                      Order {result.number}
                    </p>
                    <p className="mt-1 text-sm text-ink-400">
                      Total: {fm(rawNum(result.total), DEFAULT_CURRENCY)}
                    </p>
                  </div>

                  {result.provider === "paystack" && (
                    <div className="mt-6">
                      <div className="rounded-2xl border border-cream-200 bg-cream-50 p-4">
                        <div className="flex items-start gap-3">
                          <span
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
                            style={{ background: `linear-gradient(135deg, ${accent}, ${accent}DD)` }}
                          >
                            <Icon name="shield" size={19} />
                          </span>
                          <div>
                            <p className="text-sm font-extrabold">Secure Paystack checkout</p>
                            <p className="mt-1 text-xs leading-relaxed text-ink-400">
                              You'll be redirected to Paystack to complete your payment securely.
                            </p>
                          </div>
                        </div>
                      </div>

                      {result.redirectUrl && (
                        <a
                          href={result.redirectUrl}
                          className="sf-shine mt-4 flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-extrabold text-white shadow-lg"
                          style={{
                            background: `linear-gradient(135deg, ${accent}, ${accent}DD)`,
                            boxShadow: `0 14px 30px -12px ${accent}`,
                          }}
                        >
                          <Icon name="external" size={15} />
                          Continue to Paystack
                        </a>
                      )}

                      {!result.redirectUrl && (
                        <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-center text-xs font-bold text-red-600">
                          Paystack could not provide a payment link. Please try checkout again.
                        </div>
                      )}

                      <p className="mt-3 text-center text-[11px] leading-relaxed text-ink-400">
                        Your order is not considered paid until Paystack confirms the payment to
                        Brikoh.
                      </p>
                    </div>
                  )}

                  {result.provider === "bank_transfer" && result.bankDetails && (
                    <div className="mt-6">
                      <div className="rounded-2xl border border-cream-200 bg-white p-4 text-left shadow-sm">
                        <p className="text-xs font-extrabold uppercase tracking-wide text-ink-400">
                          Bank transfer
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-ink-400">
                          Transfer the exact order amount to the account below.
                        </p>

                        <div className="mt-4 space-y-3 text-sm">
                          <div className="flex justify-between gap-4">
                            <span className="text-ink-400">Bank</span>
                            <span className="font-bold">{result.bankDetails.bankName}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-ink-400">Account name</span>
                            <span className="text-right font-bold">
                              {result.bankDetails.accountName}
                            </span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-ink-400">Account number</span>
                            <span className="font-bold tabular-nums">
                              {result.bankDetails.accountNumber}
                            </span>
                          </div>

                          <div className="mt-3 rounded-xl bg-cream-50 p-3">
                            <p className="text-[10px] font-extrabold uppercase tracking-wide text-ink-400">
                              Payment reference
                            </p>
                            <p className="mt-1 text-lg font-extrabold tracking-wide" style={{ color: accent }}>
                              {result.bankDetails.reference}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4">
                        {orderView?.status === "AWAITING_PAYMENT" ? (
                          <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                            Payment submitted. The seller will review your payment.
                          </div>
                        ) : orderView?.status === "PAID" ? (
                          <div className="rounded-xl bg-leaf-50 px-4 py-3 text-sm font-semibold text-leaf-700">
                            Payment confirmed. Your order is paid.
                          </div>
                        ) : (
                          <>
                            <Button
                              onClick={markPaid}
                              disabled={markingPaid || loadingOrder}
                              className="mt-3 w-full"
                            >
                              {markingPaid ? (
                                <span className="flex items-center justify-center gap-2">
                                  <Spinner size={15} />
                                  Submitting…
                                </span>
                              ) : (
                                "I've paid"
                              )}
                            </Button>

                            <Button
                              variant="ghost"
                              onClick={() => fetchOrder(result.orderId)}
                              disabled={loadingOrder}
                              className="mt-2 w-full"
                            >
                              {loadingOrder ? "Checking…" : "Check payment status"}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {err && (
                    <p className="mt-4 text-center text-xs font-bold text-danger-500">{err}</p>
                  )}

                  <Button
                    variant="ghost"
                    className="mt-4 w-full"
                    onClick={() => {
                      setCartOpen(false);
                      setResult(null);
                      setOrderView(null);
                      setErr("");
                    }}
                  >
                    Keep shopping
                  </Button>
                </div>
              ) : cart.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-cream-100 text-ink-300">
                    <Icon name="cart" size={24} />
                  </span>
                  <p className="font-bold text-ink-500">Your basket is empty</p>
                  <p className="text-xs text-ink-400">Tap "Add to cart" on anything you like.</p>
                </div>
              ) : (
                cart.map((l) => (
                  <div
                    key={l.key}
                    className="flex items-center gap-3 border-b border-cream-100 px-5 py-3.5 transition-colors hover:bg-cream-50/60"
                  >
                    <Thumb src={l.image} className="h-12 w-12 rounded-lg ring-1 ring-black/5" />

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">{l.name}</p>
                      <p className="text-xs text-ink-400">
                        {l.variantName ? `${l.variantName} · ` : ""}
                        {fm(l.price, DEFAULT_CURRENCY)}
                      </p>

                      <div className="mt-1.5 flex items-center gap-1.5">
                        <button
                          className="flex h-6 w-6 items-center justify-center rounded-md bg-cream-100 font-extrabold transition-colors hover:bg-cream-200"
                          onClick={() => bump(l.key, -1)}
                          aria-label="Less"
                        >
                          −
                        </button>
                        <span className="w-6 text-center text-sm font-extrabold tabular-nums">
                          {l.qty}
                        </span>
                        <button
                          className="flex h-6 w-6 items-center justify-center rounded-md bg-cream-100 font-extrabold transition-colors hover:bg-cream-200"
                          onClick={() => bump(l.key, 1)}
                          aria-label="More"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <span className="text-sm font-extrabold tabular-nums">
                      {fm(l.price * l.qty, DEFAULT_CURRENCY)}
                    </span>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && !result && (
              <div className="space-y-3.5 border-t border-cream-200 bg-cream-50 px-5 py-4 shadow-[0_-8px_20px_-16px_rgba(0,0,0,0.2)]">
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="Discount code (if you have one)"
                  className="uppercase"
                />

                <div className="grid grid-cols-2 gap-2">
                  <Input
                    value={customer.name}
                    onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                    placeholder="Full name"
                  />
                  <Input
                    value={customer.email}
                    onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                    placeholder="Email"
                    type="email"
                  />
                </div>

                <Input
                  value={customer.phone}
                  onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                  placeholder="Phone (optional)"
                  type="tel"
                />

                {availablePaymentMethods.length > 0 && (
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs font-extrabold uppercase tracking-wide text-ink-400">
                        Payment method
                      </p>
                      {paystackAvailable && (
                        <span className="text-[10px] font-bold text-leaf-600">
                          Secure checkout
                        </span>
                      )}
                    </div>

                    <div className="grid gap-2">
                      {paystackAvailable && (
                        <button
                          type="button"
                          onClick={() => {
                            setPaymentMethod("paystack");
                            setErr("");
                          }}
                          disabled={checkingOut}
                          className={cls(
                            "flex items-center justify-between rounded-xl border-2 px-4 py-3 text-left transition-all",
                            paymentMethod === "paystack"
                              ? "border-brand-500 bg-brand-50 shadow-sm"
                              : "border-cream-200 bg-white hover:border-brand-300",
                            checkingOut && "cursor-not-allowed opacity-70"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-sm"
                              style={{ background: `linear-gradient(135deg, ${accent}, ${accent}DD)` }}
                            >
                              <Icon name="shield" size={18} />
                            </span>
                            <div>
                              <p className="text-sm font-extrabold">Pay online</p>
                              <p className="mt-0.5 text-xs text-ink-400">
                                Card, bank & other Paystack options
                              </p>
                            </div>
                          </div>
                          <span
                            className="flex h-5 w-5 items-center justify-center rounded-full border-2"
                            style={
                              paymentMethod === "paystack"
                                ? { borderColor: accent, background: accent }
                                : undefined
                            }
                          >
                            {paymentMethod === "paystack" && (
                              <span className="h-2 w-2 rounded-full bg-white" />
                            )}
                          </span>
                        </button>
                      )}

                      {bankTransferAvailable && (
                        <button
                          type="button"
                          onClick={() => {
                            setPaymentMethod("bank_transfer");
                            setErr("");
                          }}
                          disabled={checkingOut}
                          className={cls(
                            "flex items-center justify-between rounded-xl border-2 px-4 py-3 text-left transition-all",
                            paymentMethod === "bank_transfer"
                              ? "border-brand-500 bg-brand-50 shadow-sm"
                              : "border-cream-200 bg-white hover:border-brand-300",
                            checkingOut && "cursor-not-allowed opacity-70"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cream-100 text-ink-600">
                              <Icon name="bank" size={18} />
                            </span>
                            <div>
                              <p className="text-sm font-extrabold">Bank transfer</p>
                              <p className="mt-0.5 text-xs text-ink-400">
                                Pay directly to the seller
                              </p>
                            </div>
                          </div>
                          <span
                            className="flex h-5 w-5 items-center justify-center rounded-full border-2"
                            style={
                              paymentMethod === "bank_transfer"
                                ? { borderColor: accent, background: accent }
                                : undefined
                            }
                          >
                            {paymentMethod === "bank_transfer" && (
                              <span className="h-2 w-2 rounded-full bg-white" />
                            )}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {availablePaymentMethods.length === 0 && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                    <p className="text-xs font-extrabold text-amber-800">
                      Payment isn't configured
                    </p>
                    <p className="mt-1 text-[11px] leading-relaxed text-amber-700">
                      This store hasn't configured a payment method yet.
                    </p>
                  </div>
                )}

                {err && <p className="text-xs font-bold text-danger-500">{err}</p>}

                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-ink-500">Total</span>
                  <span className="font-display text-xl font-extrabold tabular-nums">
                    {fm(subtotal, DEFAULT_CURRENCY)}
                  </span>
                </div>

                <button
                  onClick={checkout}
                  disabled={checkingOut || availablePaymentMethods.length === 0}
                  className="sf-shine flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-[15px] font-extrabold text-white shadow-lg transition-all disabled:cursor-not-allowed disabled:opacity-60"
                  style={{
                    background: `linear-gradient(135deg, ${accent}, ${accent}DD)`,
                    boxShadow: `0 14px 30px -12px ${accent}`,
                  }}
                >
                  {checkingOut ? (
                    <>
                      <Spinner size={16} />
                      {paymentMethod === "paystack" ? "Connecting to Paystack…" : "Placing order…"}
                    </>
                  ) : (
                    <>
                      <Icon name="shield" size={16} />
                      {paymentMethod === "bank_transfer" ? "Place order" : "Pay securely with Paystack"}
                    </>
                  )}
                </button>

                {paymentMethod === "paystack" && paystackAvailable && (
                  <div className="flex items-center justify-center gap-2 text-center">
                    <Icon name="shield" size={12} className="text-ink-300" />
                    <p className="text-[10px] leading-relaxed text-ink-400">
                      Secure payment powered by Paystack. You'll be redirected to Paystack to
                      complete payment.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
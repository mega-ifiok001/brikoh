// Formatting + defensive data helpers. API money values are strings
// (Decimal) so everything funnels through rawNum first.

export function cls(...xs: Array<string | false | null | undefined>): string {
  return xs.filter(Boolean).join(" ");
}

export function rawNum(v: any): number {
  if (typeof v === "number") return isFinite(v) ? v : 0;
  if (typeof v === "string") {
    const n = parseFloat(v);
    return isFinite(n) ? n : 0;
  }
  return 0;
}

const SYMBOLS: Record<string, string> = {
  NGN: "₦",
  USD: "$",
  GHS: "GH₵",
  KES: "KSh ",
  ZAR: "R",
};

export function fm(v: any, currency = "NGN", opts: { compact?: boolean } = {}): string {
  const n = rawNum(v);
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: Math.abs(n) >= 1000 ? (opts.compact ? 0 : 0) : 2,
    }).format(n);
  } catch {
    return `${SYMBOLS[currency] ?? currency + " "}${n.toLocaleString("en", { maximumFractionDigits: 2 })}`;
  }
}

export function fd(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function fdt(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ago(iso?: string | null): string {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (isNaN(t)) return "—";
  const s = Math.max(0, (Date.now() - t) / 1000);
  if (s < 45) return "just now";
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  if (s < 7 * 86400) return `${Math.round(s / 86400)}d ago`;
  return fd(iso);
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

// First defined value among candidate keys — the server's field naming
// varies between modules, so every read goes through this.
export function pick<T = any>(obj: any, keys: string[]): T | undefined {
  if (!obj || typeof obj !== "object") return undefined;
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null) return obj[k] as T;
  }
  return undefined;
}

export function asList(res: any, ...keys: string[]): any[] {
  if (Array.isArray(res)) return res;
  if (!res || typeof res !== "object") return [];
  for (const k of keys) {
    if (Array.isArray(res[k])) return res[k];
  }
  for (const k of keys) {
    const v = res[k];
    if (v && typeof v === "object" && Array.isArray(v.items)) return v.items;
  }
  return [];
}

export function initialsOf(name?: string | null): string {
  const parts = (name || "?").trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() || "").join("") || "?";
}

export function prettyDetail(d: any): string {
  if (d === null || d === undefined) return "";
  if (typeof d === "string") return d;
  try {
    const s = JSON.stringify(d);
    return s.length > 90 ? s.slice(0, 90) + "…" : s;
  } catch {
    return "";
  }
}

export function toISODate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function titleCase(s?: string | null): string {
  if (!s) return "—";
  return String(s)
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

import type { ComponentProps, ReactNode } from "react";
import { Badge, Button, CopyBtn, EmptyState, ErrorState, Icon, Input, Spinner } from "../../components/ui";
import { cls } from "../../lib/format";

type Tone = NonNullable<ComponentProps<typeof Badge>["tone"]>;

const TONES: Record<string, Tone> = {
  // subscription
  ACTIVE: "green",
  TRIALING: "brand",
  PAST_DUE: "danger",
  CANCELLED: "neutral",
  NO_SUBSCRIPTION: "muted",
  // orders
  PENDING: "gold",
  AWAITING_PAYMENT: "gold",
  PAID: "green",
  SHIPPED: "dark",
  REFUNDED: "gold",
  FAILED: "danger",
  // tickets
  OPEN: "brand",
  IN_PROGRESS: "gold",
  RESOLVED: "green",
  CLOSED: "neutral",
  // priority
  URGENT: "danger",
  HIGH: "gold",
  MEDIUM: "neutral",
  LOW: "muted",
  // tiers
  STARTER: "neutral",
  PRO: "brand",
  ENTERPRISE: "dark",
  // webhooks / announcements
  PROCESSED: "green",
  DRAFT: "neutral",
  LIVE: "green",
  HIDDEN: "muted",
  // ledger
  NEGATIVE_STOCK: "danger",
  LEDGER_MISMATCH: "gold",
};

export function Pill({ value, tone }: { value?: string | null; tone?: Tone }) {
  if (!value) return <span className="text-ink-300">—</span>;
  const key = String(value).toUpperCase();
  return <Badge tone={tone ?? TONES[key] ?? "neutral"}>{String(value).replace(/_/g, " ")}</Badge>;
}

export function Panel({
  title,
  sub,
  action,
  children,
  className,
  flush,
}: {
  title?: ReactNode;
  sub?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  flush?: boolean;
}) {
  return (
    <section className={cls("card overflow-hidden", className)}>
      {(title || action) && (
        <div className="flex items-start justify-between gap-3 border-b border-cream-200 px-4 py-3">
          <div className="min-w-0">
            {title && <h3 className="text-[15px] font-bold">{title}</h3>}
            {sub && <p className="mt-0.5 text-xs text-ink-400">{sub}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={flush ? "" : "p-4"}>{children}</div>
    </section>
  );
}

/** Loading / error / empty handling for a list or table body. */
export function ListShell({
  loading,
  error,
  onRetry,
  count,
  emptyTitle = "Nothing here yet",
  emptyHint,
  emptyIcon = "box",
  children,
}: {
  loading: boolean;
  error?: string;
  onRetry?: () => void;
  count: number;
  emptyTitle?: string;
  emptyHint?: string;
  emptyIcon?: string;
  children: ReactNode;
}) {
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (loading && count === 0)
    return (
      <div className="flex items-center justify-center gap-3 py-16 text-ink-400">
        <Spinner size={22} className="text-brand-500" />
        <span className="text-sm font-semibold">Loading…</span>
      </div>
    );
  if (count === 0) return <EmptyState icon={emptyIcon} title={emptyTitle} hint={emptyHint} />;
  return <>{children}</>;
}

export function TableWrap({ children }: { children: ReactNode }) {
  return (
    <div className="scrollbar-slim overflow-x-auto">
      <table className="tbl">{children}</table>
    </div>
  );
}

/** Horizontal distribution bars (label · bar · value). */
export function Bars({
  items,
  format = (n) => n.toLocaleString("en"),
}: {
  items: { label: string; value: number; sub?: string }[];
  format?: (n: number) => string;
}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="space-y-2.5">
      {items.map((i) => (
        <div key={i.label}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate font-semibold text-ink-700">{i.label}</span>
            <span className="tabular-nums font-bold text-ink-900">
              {format(i.value)}
              {i.sub && <span className="ml-1.5 text-xs font-semibold text-ink-400">{i.sub}</span>}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-cream-100">
            <div
              className="h-full rounded-full bg-brand-500 transition-all"
              style={{ width: `${Math.max(i.value > 0 ? 2 : 0, (i.value / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------- date ranges ------------------------------ */

export interface DateRange {
  from: string; // YYYY-MM-DD (UTC, inclusive)
  to: string; // YYYY-MM-DD (UTC, inclusive)
}

const day = (d: Date) => d.toISOString().slice(0, 10);

export function defaultRange(days = 30): DateRange {
  const to = new Date();
  const from = new Date(Date.now() - (days - 1) * 86400_000);
  return { from: day(from), to: day(to) };
}

/** Inclusive dates -> the API's half-open UTC interval [start, end). */
export function rangeToISO(r: DateRange): { start: string; end: string } {
  const end = new Date(`${r.to}T00:00:00.000Z`);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start: `${r.from}T00:00:00.000Z`, end: end.toISOString() };
}

export function RangePicker({ value, onChange }: { value: DateRange; onChange: (r: DateRange) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {[7, 30, 90].map((d) => (
        <button key={d} type="button" className="chip" onClick={() => onChange(defaultRange(d))}>
          {d}d
        </button>
      ))}
      <Input
        type="date"
        className="w-40"
        value={value.from}
        max={value.to}
        onChange={(e) => e.target.value && onChange({ ...value, from: e.target.value })}
        aria-label="From (UTC)"
      />
      <span className="text-ink-300">→</span>
      <Input
        type="date"
        className="w-40"
        value={value.to}
        min={value.from}
        onChange={(e) => e.target.value && onChange({ ...value, to: e.target.value })}
        aria-label="To (UTC)"
      />
      <span className="text-[11px] font-bold uppercase tracking-wide text-ink-300">UTC</span>
    </div>
  );
}

/** 3600 -> "1h", 5400 -> "1h 30m", 200000 -> "2d 7h" */
export function dur(seconds?: number | null): string {
  if (seconds === null || seconds === undefined || !isFinite(seconds)) return "—";
  const s = Math.max(0, Math.round(seconds));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return m % 60 ? `${h}h ${m % 60}m` : `${h}h`;
  const d = Math.floor(h / 24);
  return h % 24 ? `${d}d ${h % 24}h` : `${d}d`;
}

export function pct(v?: number | null): string {
  return v === null || v === undefined ? "—" : `${v}%`;
}

/** One-time secret display (2FA rotate / reset). */
export function SecretBox({ secret, otpauthUrl, note }: { secret: string; otpauthUrl?: string; note?: string }) {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2.5 rounded-xl border border-gold-100 bg-gold-100/60 p-3 text-sm text-gold-700">
        <Icon name="alert" size={16} className="mt-0.5" />
        <p className="font-semibold">{note ?? "This secret is shown once. Add it to an authenticator app now."}</p>
      </div>
      <div>
        <p className="lbl">Secret (base32)</p>
        <div className="flex items-center gap-2">
          <code className="inp flex-1 select-all break-all font-mono text-[13px]">{secret}</code>
          <CopyBtn text={secret} />
        </div>
      </div>
      {otpauthUrl && (
        <div>
          <p className="lbl">otpauth URL</p>
          <div className="flex items-center gap-2">
            <code className="inp flex-1 select-all break-all font-mono text-[11px]">{otpauthUrl}</code>
            <CopyBtn text={otpauthUrl} />
          </div>
          <p className="mt-1 text-xs text-ink-400">
            Most authenticator apps accept this via "enter setup key" — paste the base32 secret above.
          </p>
        </div>
      )}
    </div>
  );
}

export function Pager({
  hasMore,
  loading,
  onMore,
  shown,
}: {
  hasMore: boolean;
  loading: boolean;
  onMore: () => void;
  shown: number;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-cream-100 px-4 py-3">
      <p className="text-xs font-semibold text-ink-400">
        {shown} loaded{hasMore ? " · more available" : ""}
      </p>
      {hasMore && (
        <Button variant="outline" size="sm" loading={loading} onClick={onMore}>
          Load more
        </Button>
      )}
    </div>
  );
}
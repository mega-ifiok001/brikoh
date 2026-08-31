import {
  useEffect,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { cls, fm, titleCase } from "../lib/format";

/* ---------------------------------- Icons --------------------------------- */

const P: Record<string, ReactNode> = {
  logo: (
    <g fill="currentColor" stroke="none">
      <rect x="2" y="2" width="20" height="20" rx="6" opacity="0.15" />
      <path d="M7 5h4.4c2.1 0 3.6 1.3 3.6 3.1 0 1.2-.6 2.1-1.6 2.6 1.4.3 2.2 1.4 2.2 2.8 0 2-1.6 3.4-3.9 3.4H7V5zm2.4 4.3h2.1c.9 0 1.5-.5 1.5-1.3S12.4 6.8 11.5 6.8H9.4v2.5zm0 4.7h2.4c1 0 1.6-.5 1.6-1.4 0-.8-.6-1.3-1.6-1.3H9.4V14z" />
    </g>
  ),
  grid: (
    <>
      <rect x="3" y="3" width="7.5" height="7.5" rx="1.6" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.6" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.6" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.6" />
    </>
  ),
  pos: (
    <>
      <path d="M6 7h12l1.5 13.5a1 1 0 0 1-1 1.5h-13a1 1 0 0 1-1-1.5L6 7Z" />
      <path d="M9 10V6a3 3 0 0 1 6 0v4" />
    </>
  ),
  receipt: (
    <>
      <path d="M6 2.5h12v19l-2.4-1.6-2.4 1.6-1.2-.9-1.2.9-2.4-1.6L6 21.5v-19Z" />
      <path d="M9 7.5h6M9 11h6M9 14.5h3.5" />
    </>
  ),
  box: (
    <>
      <path d="M21 8.2 12 3 3 8.2v7.6L12 21l9-5.2V8.2Z" />
      <path d="m3.3 8.3 8.7 5 8.7-5M12 21v-7.7" />
    </>
  ),
  building: (
    <>
      <path d="M4 21V5.5L12 3l8 2.5V21" />
      <path d="M2 21h20M9 9h.01M15 9h.01M9 13h.01M15 13h.01M10 21v-4h4v4" />
    </>
  ),
  truck: (
    <>
      <path d="M1.5 5.5h13v11h-13zM14.5 9h4l3 3.5v4h-7" />
      <circle cx="5.5" cy="17.5" r="2" />
      <circle cx="17.5" cy="17.5" r="2" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c.8-3.2 3.4-5 6.5-5s5.7 1.8 6.5 5" />
      <path d="M15.5 4.9a3.5 3.5 0 0 1 0 6.2M18.6 15.4c1.7.8 2.6 2.4 2.9 4.6" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.8" />
      <path d="M4.5 20.5c1-3.6 4-5.5 7.5-5.5s6.5 1.9 7.5 5.5" />
    </>
  ),
  file: (
    <>
      <path d="M14 2.5H6.5A1.5 1.5 0 0 0 5 4v16a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 20V8l-5-5.5Z" />
      <path d="M14 2.5V8h5M9 13h6M9 16.5h4" />
    </>
  ),
  tag: (
    <>
      <path d="m3 11.5 8.5-8.5h8V11L11 19.5a1.4 1.4 0 0 1-2 0L3 13.5a1.4 1.4 0 0 1 0-2Z" />
      <circle cx="15.5" cy="8.5" r="1.3" fill="currentColor" stroke="none" />
    </>
  ),
  wallet: (
    <>
      <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5h12A2.5 2.5 0 0 1 20 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-12A2.5 2.5 0 0 1 3 16.5v-9Z" />
      <path d="M20 11h-4.5a2 2 0 0 0 0 4H20" />
    </>
  ),
  banknote: (
    <>
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.6" />
      <path d="M5.5 12h.01M18.5 12h.01" />
    </>
  ),
  chart: (
    <>
      <path d="M3.5 3.5v17h17" />
      <path d="M8 16v-5M12.5 16V7M17 16v-3" />
    </>
  ),
  store: (
    <>
      <path d="M4 9.5 5.5 4h13L20 9.5M4.5 9.5V20h15V9.5" />
      <path d="M9.5 20v-6h5v6M2.8 9.5h18.4" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M19 12a7 7 0 0 0-.14-1.4l2-1.55-2-3.46-2.36.95A7 7 0 0 0 14.07 5L13.7 2.5h-3.4L9.93 5a7 7 0 0 0-2.43 1.4l-2.36-.96-2 3.47 2 1.54a7 7 0 0 0 0 2.81l-2 1.55 2 3.46 2.36-.95a7 7 0 0 0 2.43 1.4l.37 2.55h3.4l.37-2.56a7 7 0 0 0 2.43-1.39l2.36.95 2-3.47-2-1.54A7 7 0 0 0 19 12Z" />
    </>
  ),
  bell: (
    <>
      <path d="M18 9a6 6 0 1 0-12 0c0 5-2 6.5-2 6.5h16S18 14 18 9ZM10 19a2.2 2.2 0 0 0 4 0" />
    </>
  ),
  logout: (
    <>
      <path d="M14 4h-8a1.5 1.5 0 0 0-1.5 1.5v13A1.5 1.5 0 0 0 6 20h8M10 12h10.5M17 8.5l3.5 3.5-3.5 3.5" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  x: <path d="m6 6 12 12M18 6 6 18" />,
  check: <path d="m4.5 12.5 5 5 10-11" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20.5 20.5-4.5-4.5" />
    </>
  ),
  edit: (
    <>
      <path d="M4 20h4l11-11a2.1 2.1 0 0 0-3-3L5 17l-1 4Z" />
      <path d="m13.5 6.5 3 3" />
    </>
  ),
  trash: (
    <>
      <path d="M4 7h16M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13M10 11v5M14 11v5" />
    </>
  ),
  copy: (
    <>
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15H4a1.5 1.5 0 0 1-1.5-1.5v-9A1.5 1.5 0 0 1 4 3h9A1.5 1.5 0 0 1 14.5 4.5V5" />
    </>
  ),
  external: (
    <>
      <path d="M14 4h6v6M20 4l-9 9M19 14v5.5A1.5 1.5 0 0 1 17.5 21h-13A1.5 1.5 0 0 1 3 19.5v-13A1.5 1.5 0 0 1 4.5 5H10" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 5v5h-5" />
      <path d="M20 10a8.2 8.2 0 1 0 .8 5" />
    </>
  ),
  upload: (
    <>
      <path d="M12 16V4M7.5 8.5 12 4l4.5 4.5" />
      <path d="M4 16v3.5A1.5 1.5 0 0 0 5.5 21h13a1.5 1.5 0 0 0 1.5-1.5V16" />
    </>
  ),
  chevronDown: <path d="m6 9 6 6 6-6" />,
  chevronRight: <path d="m9 6 6 6-6 6" />,
  chevronLeft: <path d="m15 6-6 6 6 6" />,
  arrowRight: <path d="M4 12h16M13.5 5.5 20 12l-6.5 6.5" />,
  alert: (
    <>
      <path d="M12 3.5 22 20H2L12 3.5Z" />
      <path d="M12 10v4.5M12 17.4h.01" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 7.6h.01" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </>
  ),
  phone: (
    <path d="M5.5 3.5h3.6l1.4 4.2-2.1 1.6a12.5 12.5 0 0 0 5.8 5.8l1.6-2.1 4.2 1.4v3.6a1.7 1.7 0 0 1-1.9 1.7C10.3 18.9 5.1 13.7 4.1 5.4a1.7 1.7 0 0 1 1.4-1.9Z" />
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3.5 7 8.5 6 8.5-6" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21.5S5 14.9 5 9.8a7 7 0 0 1 14 0c0 5.1-7 11.7-7 11.7Z" />
      <circle cx="12" cy="9.8" r="2.6" />
    </>
  ),
  shield: (
    <>
      <path d="M12 2.8 4.5 5.6v6c0 5 3.2 8.2 7.5 9.6 4.3-1.4 7.5-4.6 7.5-9.6v-6L12 2.8Z" />
      <path d="m8.8 11.8 2.3 2.3 4.2-4.6" />
    </>
  ),
  gift: (
    <>
      <rect x="3.5" y="8" width="17" height="4" rx="1" />
      <path d="M5 12v8.5h14V12M12 8v12.5M12 8S9 8 8 6.5 8.5 3 10 3.5 12 8 12 8ZM12 8s3 0 4-1.5S15.5 3 14 3.5 12 8 12 8Z" />
    </>
  ),
  send: <path d="M21 3.5 3 10.5l7 2.5M21 3.5 14 21l-4-8M21 3.5 10 13" />,
  key: (
    <>
      <circle cx="8" cy="15.5" r="4.5" />
      <path d="m11.5 12 8-8M16 7.5l2.5 2.5M13.5 10l2 2" />
    </>
  ),
  image: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="m4.5 17.5 4.8-4.5 3.2 3 3-2.7 4 4.2" />
    </>
  ),
  cart: (
    <>
      <circle cx="9.5" cy="19.5" r="1.6" />
      <circle cx="17.5" cy="19.5" r="1.6" />
      <path d="M3 4h2.5l2.3 11h10.4l2.3-8H6.2" />
    </>
  ),
  menu: <path d="M4 6.5h16M4 12h16M4 17.5h16" />,
  zap: <path d="M13 2.5 4.5 13.5H11l-1 8L18.5 10H12l1-7.5Z" />,
  sparkle: (
    <path d="M12 3.5 13.8 9 19.5 11 13.8 13 12 18.5 10.2 13 4.5 11 10.2 9 12 3.5ZM19 16.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z" />
  ),
  instagram: (
    <>
      <rect x="2.8" y="2.8" width="18.4" height="18.4" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none" />
    </>
  ),
  facebook: (
    <path d="M17.5 2.5h-3a5 5 0 0 0-5 5v3h-3v4h3v7h4v-7h3l1-4h-4V7.5a1 1 0 0 1 1-1h3v-4Z" />
  ),
  tiktok: (
    <g fill="currentColor" stroke="none">
      <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3a4.35 4.35 0 0 1-4.3-1.48Z" />
    </g>
  ),
  whatsapp: (
    <g fill="currentColor" stroke="none">
      <path d="M19.05 4.91A9.82 9.82 0 0 0 12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01Zm-7.01 15.24a8.22 8.22 0 0 1-4.19-1.15l-.3-.18-3.11.82.83-3.04-.2-.31a8.25 8.25 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.17.25-.64.8-.78.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.13-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43-.14-.01-.31-.01-.48-.01-.17 0-.44.06-.67.31-.23.25-.89.87-.89 2.12 0 1.25.91 2.46 1.04 2.63.12.17 1.79 2.73 4.34 3.83.6.26 1.07.42 1.44.5.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.1-.23-.17-.48-.29Z" />
    </g>
  ),
  dot: <circle cx="12" cy="12" r="5" fill="currentColor" stroke="none" />,
  lifebuoy: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3.2" />
      <path d="m8.6 8.6-3.9-3.9M15.4 8.6l3.9-3.9M8.6 15.4l-3.9 3.9M15.4 15.4l3.9 3.9" />
    </>
  ),
};

export function Icon({
  name,
  size = 18,
  className,
  strokeWidth = 1.8,
}: {
  name: string;
  size?: number;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cls("shrink-0", className)}
      aria-hidden
    >
      {P[name] || P.dot}
    </svg>
  );
}

/* --------------------------------- Buttons -------------------------------- */

type BtnVariant = "primary" | "dark" | "outline" | "ghost" | "danger" | "success";

export function Button({
  variant = "primary",
  size = "md",
  loading,
  icon,
  children,
  className,
  disabled,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: BtnVariant;
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: string;
}) {
  const v: Record<BtnVariant, string> = {
    primary:
      "bg-brand-500 text-white hover:bg-brand-600 shadow-[0_1px_2px_rgba(33,26,21,.15)]",
    dark: "bg-ink-900 text-cream-50 hover:bg-ink-700",
    outline: "bg-white text-ink-800 border border-cream-300 hover:border-brand-300 hover:text-brand-700",
    ghost: "text-ink-700 hover:bg-cream-100",
    danger: "bg-danger-500 text-white hover:bg-danger-700",
    success: "bg-leaf-500 text-white hover:bg-leaf-700",
  };
  const s = {
    sm: "px-2.5 py-1.5 text-xs rounded-lg gap-1.5",
    md: "px-3.5 py-2 text-sm rounded-[10px] gap-2",
    lg: "px-5 py-2.5 text-[15px] rounded-xl gap-2",
  }[size];
  return (
    <button
      className={cls(
        "inline-flex items-center justify-center font-bold transition-all duration-150 active:scale-[.98] disabled:opacity-50",
        v[variant],
        s,
        className
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <Spinner size={14} /> : icon ? <Icon name={icon} size={size === "sm" ? 14 : 16} /> : null}
      {children}
    </button>
  );
}

export function IconBtn({
  name,
  label,
  className,
  size = 16,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { name: string; label: string; size?: number }) {
  return (
    <button
      title={label}
      aria-label={label}
      className={cls(
        "p-2 rounded-lg text-ink-400 hover:text-ink-900 hover:bg-cream-100 transition-colors disabled:opacity-40",
        className
      )}
      {...rest}
    >
      <Icon name={name} size={size} />
    </button>
  );
}

/* --------------------------------- Inputs --------------------------------- */

export function Field({
  label,
  error,
  hint,
  children,
  className,
}: {
  label?: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      {label && <label className="lbl">{label}</label>}
      {children}
      {error ? (
        <p className="mt-1 text-xs font-semibold text-danger-500">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-ink-400">{hint}</p>
      ) : null}
    </div>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...rest } = props;
  return <input className={cls("inp", className)} {...rest} />;
}
export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  const { className, children, ...rest } = props;
  return (
    <select className={cls("inp", className)} {...rest}>
      {children}
    </select>
  );
}
export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className, ...rest } = props;
  return <textarea className={cls("inp", className)} {...rest} />;
}

export function SearchInput({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cls("relative", className)}>
      <Icon name="search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
      <input
        className="inp pl-9"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "Search…"}
      />
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-2.5"
    >
      <span
        className={cls(
          "relative h-5.5 w-10 rounded-full transition-colors",
          checked ? "bg-leaf-500" : "bg-cream-300"
        )}
        style={{ height: 22 }}
      >
        <span
          className="absolute top-[3px] h-4 w-4 rounded-full bg-white shadow transition-all"
          style={{ left: checked ? 22 : 3 }}
        />
      </span>
      {label && <span className="text-sm font-semibold text-ink-700">{label}</span>}
    </button>
  );
}

/* --------------------------------- Badges --------------------------------- */

type Tone = "neutral" | "brand" | "green" | "gold" | "danger" | "dark" | "muted";

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  const t: Record<Tone, string> = {
    neutral: "bg-cream-100 text-ink-500 border-cream-200",
    brand: "bg-brand-50 text-brand-700 border-brand-100",
    green: "bg-leaf-100 text-leaf-700 border-leaf-100",
    gold: "bg-gold-100 text-gold-700 border-gold-100",
    danger: "bg-danger-100 text-danger-700 border-danger-100",
    dark: "bg-ink-900 text-cream-50 border-ink-900",
    muted: "border-cream-200 bg-cream-50 text-ink-400",
  };
  return (
    <span
      className={cls(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold tracking-wide uppercase",
        t[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

const STATUS_TONE: Record<string, Tone> = {
  PENDING: "gold",
  PAID: "green",
  SHIPPED: "dark",
  CANCELLED: "neutral",
  REFUNDED: "gold",
  FAILED: "danger",
  DRAFT: "neutral",
  PUBLISHED: "green",
  ISSUED: "gold",
  VOID: "neutral",
  ORDERED: "gold",
  PARTIALLY_RECEIVED: "gold",
  RECEIVED: "green",
  REQUESTED: "gold",
  PROCESSING: "gold",
  SUCCESS: "green",
  TRIALING: "brand",
  ACTIVE: "green",
  PAST_DUE: "danger",
  CONFIRMED: "green",
};

export function StatusBadge({ status }: { status?: string | null }) {
  if (!status) return <span className="text-ink-300">—</span>;
  return <Badge tone={STATUS_TONE[status] || "neutral"}>{titleCase(status)}</Badge>;
}

/* ---------------------------------- Modal --------------------------------- */

export function Modal({
  open,
  onClose,
  title,
  sub,
  children,
  footer,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  sub?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-ink-900/45 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className={cls(
          "anim-pop relative m-0 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:m-4 sm:rounded-2xl",
          wide ? "sm:max-w-3xl" : "sm:max-w-lg"
        )}
      >
        {(title || sub) && (
          <div className="flex items-start justify-between gap-4 border-b border-cream-200 px-5 py-4">
            <div>
              {title && <h3 className="text-lg font-bold">{title}</h3>}
              {sub && <p className="mt-0.5 text-sm text-ink-400">{sub}</p>}
            </div>
            <IconBtn name="x" label="Close" onClick={onClose} />
          </div>
        )}
        <div className="scrollbar-slim flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-cream-200 bg-cream-50 px-5 py-3.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function Confirm({
  open,
  onClose,
  onConfirm,
  title,
  body,
  confirmLabel = "Delete",
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  body?: ReactNode;
  confirmLabel?: string;
  loading?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-sm text-ink-500">{body}</p>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="danger" loading={loading} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

/* --------------------------------- Feedback ------------------------------- */

export function Spinner({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={cls("animate-spin", className)} aria-label="Loading">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function PageLoader({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex h-full min-h-[50vh] flex-col items-center justify-center gap-3 text-ink-400">
      <Spinner size={26} className="text-brand-500" />
      <p className="text-sm font-semibold">{label}</p>
    </div>
  );
}

export function EmptyState({
  icon = "box",
  title,
  hint,
  action,
}: {
  icon?: string;
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="anim-rise flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-500">
        <Icon name={icon} size={22} />
      </div>
      <h4 className="mt-1 text-base font-bold text-ink-800">{title}</h4>
      {hint && <p className="max-w-sm text-sm text-ink-400">{hint}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="anim-rise flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-danger-100 text-danger-500">
        <Icon name="alert" size={22} />
      </div>
      <h4 className="mt-1 text-base font-bold text-ink-800">Something went wrong</h4>
      <p className="max-w-sm text-sm text-ink-400">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" icon="refresh" className="mt-3" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

/* --------------------------------- Layout bits ---------------------------- */

export function PageHead({
  title,
  sub,
  children,
}: {
  title: string;
  sub?: string;
  children?: ReactNode;
}) {
  return (
    <div className="anim-rise mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-[26px] font-extrabold leading-tight tracking-tight">{title}</h1>
        {sub && <p className="mt-0.5 text-sm text-ink-400">{sub}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  icon,
  tone = "brand",
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  icon: string;
  tone?: Tone;
}) {
  const bg: Record<Tone, string> = {
    neutral: "bg-cream-100 text-ink-500",
    brand: "bg-brand-50 text-brand-600",
    green: "bg-leaf-100 text-leaf-700",
    gold: "bg-gold-100 text-gold-600",
    danger: "bg-danger-100 text-danger-500",
    dark: "bg-ink-900 text-cream-50",
    muted: "bg-cream-100 text-ink-400",
  };
  return (
    <div className="card anim-rise p-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400">{label}</p>
        <span className={cls("flex h-8 w-8 items-center justify-center rounded-lg", bg[tone])}>
          <Icon name={icon} size={16} />
        </span>
      </div>
      <p className="mt-1.5 font-display text-2xl font-extrabold tabular-nums tracking-tight">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-ink-400">{sub}</p>}
    </div>
  );
}

export function KV({ label, value, mono }: { label: string; value: ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <span className="text-sm text-ink-400">{label}</span>
      <span className={cls("text-right text-sm font-semibold text-ink-800", mono && "tabular-nums")}>
        {value}
      </span>
    </div>
  );
}

export function Thumb({ src, alt, className }: { src?: string | null; alt?: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className={cls("flex items-center justify-center rounded-lg bg-brand-50 text-brand-300", className)}>
        <Icon name="box" size={18} />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt || ""}
      loading="lazy"
      onError={() => setFailed(true)}
      className={cls("rounded-lg object-cover", className)}
    />
  );
}

export function CopyBtn({ text, label = "Copy" }: { text: string; label?: string }) {
  const [ok, setOk] = useState(false);
  return (
    <Button
      variant="ghost"
      size="sm"
      icon={ok ? "check" : "copy"}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setOk(true);
          setTimeout(() => setOk(false), 1600);
        } catch {
          /* clipboard blocked */
        }
      }}
    >
      {ok ? "Copied" : label}
    </Button>
  );
}

export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: string; label: string; count?: number }[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="mb-4 flex gap-1 overflow-x-auto border-b border-cream-200 scrollbar-slim">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cls(
            "whitespace-nowrap border-b-2 px-3.5 py-2.5 text-sm font-bold transition-colors -mb-px",
            active === t.id
              ? "border-brand-500 text-brand-600"
              : "border-transparent text-ink-400 hover:text-ink-700"
          )}
        >
          {t.label}
          {t.count !== undefined && (
            <span className="ml-1.5 rounded-full bg-cream-100 px-1.5 py-0.5 text-[10px] font-extrabold text-ink-500">
              {t.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

export function LoadMore({
  onClick,
  loading,
  hasMore,
}: {
  onClick: () => void;
  loading?: boolean;
  hasMore: boolean;
}) {
  if (!hasMore) return null;
  return (
    <div className="flex justify-center py-4">
      <Button variant="outline" size="sm" loading={loading} onClick={onClick}>
        Load more
      </Button>
    </div>
  );
}

/* ---------------------------------- Toasts -------------------------------- */

type ToastType = "success" | "error" | "info";
interface ToastItem {
  id: number;
  type: ToastType;
  msg: string;
}

let pushToast: (t: Omit<ToastItem, "id">) => void = () => {};
let counter = 0;

export const toast = {
  success: (msg: string) => pushToast({ type: "success", msg }),
  error: (msg: string) => pushToast({ type: "error", msg }),
  info: (msg: string) => pushToast({ type: "info", msg }),
};

export function ToastHost() {
  const [items, setItems] = useState<ToastItem[]>([]);
  useEffect(() => {
    pushToast = (t) => {
      const id = ++counter;
      setItems((l) => [...l.slice(-3), { ...t, id }]);
      setTimeout(() => setItems((l) => l.filter((x) => x.id !== id)), 4500);
    };
    return () => {
      pushToast = () => {};
    };
  }, []);

  const meta: Record<ToastType, { icon: string; cls: string }> = {
    success: { icon: "check", cls: "bg-leaf-500" },
    error: { icon: "alert", cls: "bg-danger-500" },
    info: { icon: "info", cls: "bg-ink-900" },
  };

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[80] flex w-[min(92vw,380px)] flex-col gap-2">
      {items.map((t) => (
        <div
          key={t.id}
          className="anim-rise pointer-events-auto flex items-start gap-3 rounded-xl border border-cream-200 bg-white p-3.5 shadow-xl"
        >
          <span
            className={cls(
              "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white",
              meta[t.type].cls
            )}
          >
            <Icon name={meta[t.type].icon} size={13} strokeWidth={2.6} />
          </span>
          <p className="text-sm font-semibold leading-snug text-ink-800">{t.msg}</p>
          <button
            className="ml-auto text-ink-300 hover:text-ink-700"
            onClick={() => setItems((l) => l.filter((x) => x.id !== t.id))}
            aria-label="Dismiss"
          >
            <Icon name="x" size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

/* ---------------------------------- Money --------------------------------- */

export function Money({
  v,
  currency = "NGN",
  className,
  strong,
}: {
  v: any;
  currency?: string;
  className?: string;
  strong?: boolean;
}) {
  return (
    <span
      className={cls("tabular-nums", strong && "font-bold text-ink-900", className)}
    >
      {fm(v, currency)}
    </span>
  );
}

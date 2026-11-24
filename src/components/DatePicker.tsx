import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cls } from "../lib/format";
import { Icon } from "./ui";

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];
const pad = (value: number) => String(value).padStart(2, "0");

function toDateValue(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function fromDateValue(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return year && month && day ? new Date(year, month - 1, day) : null;
}

function monthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export default function DatePicker({
  value,
  onChange,
  label = "Date",
  allowClear = false,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  allowClear?: boolean;
  className?: string;
}) {
  const selected = fromDateValue(value);
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => monthStart(selected || new Date()));
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const monthLabel = visibleMonth.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const offset = (visibleMonth.getDay() + 6) % 7;
  const firstCell = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1 - offset);
  const days = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(firstCell.getFullYear(), firstCell.getMonth(), firstCell.getDate() + index);
    return { date, value: toDateValue(date), inMonth: date.getMonth() === visibleMonth.getMonth() };
  });

  useLayoutEffect(() => {
    if (!open) {
      setPosition(null);
      return;
    }

    const placePopover = () => {
      const anchor = triggerRef.current?.getBoundingClientRect();
      const popover = popoverRef.current;
      if (!anchor || !popover) return;

      const edge = 12;
      const width = Math.min(292, window.innerWidth - edge * 2);
      const height = popover.offsetHeight;
      const left = Math.max(edge, Math.min(anchor.left, window.innerWidth - width - edge));
      const below = anchor.bottom + 8;
      const above = anchor.top - height - 8;
      const top = below + height <= window.innerHeight - edge
        ? below
        : above >= edge
          ? above
          : Math.max(edge, window.innerHeight - height - edge);
      setPosition({ top, left });
    };

    placePopover();
    window.addEventListener("resize", placePopover);
    document.addEventListener("scroll", placePopover, true);
    return () => {
      window.removeEventListener("resize", placePopover);
      document.removeEventListener("scroll", placePopover, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target) && !popoverRef.current?.contains(target)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const choose = (dateValue: string) => {
    onChange(dateValue);
    const nextDate = fromDateValue(dateValue);
    if (nextDate) setVisibleMonth(monthStart(nextDate));
    setOpen(false);
  };

  return (
    <div ref={rootRef} className={cls("relative", className)}>
      <span className="mb-1 block text-xs font-bold text-ink-500">{label}</span>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((isOpen) => !isOpen)}
        className="flex min-h-11 min-w-[190px] items-center gap-3 rounded-xl border border-cream-300 bg-white px-3.5 py-2.5 text-left text-sm font-bold text-ink-800 shadow-sm transition hover:border-brand-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-200"
      >
        <span className="flex h-8 w-8 shrink-0 flex-col items-center justify-center rounded-lg bg-brand-50 text-brand-600">
          <span className="h-1 w-full rounded-t-lg bg-brand-500" />
          <span className="text-[10px] font-black leading-4">{selected ? pad(selected.getDate()) : "··"}</span>
        </span>
        <span className="flex-1">{selected ? selected.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : allowClear ? "All dates" : "Choose a date"}</span>
        <Icon name="chevronDown" size={15} className={cls("text-ink-400 transition-transform", open && "rotate-180")} />
      </button>

      {open && createPortal(
        <div
          ref={popoverRef}
          role="dialog"
          aria-label={`${label} calendar`}
          className="custom-date-popover anim-rise fixed z-[1000] max-h-[calc(100dvh-24px)] overflow-y-auto rounded-2xl border border-cream-200 bg-white p-4 shadow-2xl"
          style={{ top: position?.top ?? -1000, left: position?.left ?? -1000, width: Math.min(292, window.innerWidth - 24), visibility: position ? "visible" : "hidden" }}
        >
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              aria-label="Previous month"
              onClick={() => setVisibleMonth((month) => new Date(month.getFullYear(), month.getMonth() - 1, 1))}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-ink-500 transition hover:bg-cream-100 hover:text-ink-900"
            >
              <Icon name="chevronLeft" size={17} />
            </button>
            <p className="font-display text-sm font-extrabold text-ink-900">{monthLabel}</p>
            <button
              type="button"
              aria-label="Next month"
              onClick={() => setVisibleMonth((month) => new Date(month.getFullYear(), month.getMonth() + 1, 1))}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-ink-500 transition hover:bg-cream-100 hover:text-ink-900"
            >
              <Icon name="chevronRight" size={17} />
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7 text-center text-[10px] font-extrabold uppercase text-ink-300">
            {WEEKDAYS.map((weekday, index) => <span key={`${weekday}-${index}`} className="py-1">{weekday}</span>)}
          </div>
          <div className="grid grid-cols-7 gap-y-1">
            {days.map(({ date: day, value: dayValue, inMonth }) => {
              const isSelected = dayValue === value;
              const isToday = dayValue === toDateValue(new Date());
              return (
                <button
                  key={dayValue}
                  type="button"
                  aria-label={day.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                  aria-pressed={isSelected}
                  onClick={() => choose(dayValue)}
                  className={cls(
                    "mx-auto flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition",
                    isSelected ? "bg-brand-500 text-white shadow-md shadow-brand-500/25" : inMonth ? "text-ink-700 hover:bg-brand-50 hover:text-brand-700" : "text-ink-300 hover:bg-cream-100",
                    isToday && !isSelected && "ring-1 ring-brand-300"
                  )}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-cream-100 pt-3">
            {allowClear ? (
              <button type="button" onClick={() => { onChange(""); setOpen(false); }} className="text-xs font-bold text-ink-400 transition hover:text-ink-800">All dates</button>
            ) : <span />}
            <button type="button" onClick={() => choose(toDateValue(new Date()))} className="rounded-lg bg-brand-50 px-3 py-2 text-xs font-extrabold text-brand-700 transition hover:bg-brand-100">Today</button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

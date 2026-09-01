// Dashboard announcements banner — surfaces the active, published announcements
// targeted at this store's tier (see src/lib/announcements.ts for the contract).
//
// Behaviour:
//   • Fetches the announcement list once on mount (bearer auth via the shared
//     `api` client). Failures are swallowed on purpose — a banner is non-critical
//     and must never break the dashboard.
//   • Shows the newest un-dismissed announcement for this tenant. Dismissals are
//     remembered in localStorage so returning to the dashboard doesn't re-show
//     something the user has already seen.
//   • Records one idempotent view for the announcement as soon as it's displayed
//     (POST /view). Recording is best-effort and never surfaced as an error.

import { useEffect, useState } from "react";
import {
  listAnnouncements,
  markAnnouncementViewed,
  isEveryTier,
  type Announcement,
} from "../lib/announcements";
import { ago, titleCase } from "../lib/format";
import { Badge, Icon } from "./ui";

const SEEN_KEY = "brikoh:seenAnnouncements";

function readSeen(): string[] {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.map(String) : [];
  } catch {
    return [];
  }
}

function writeSeen(ids: string[]) {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify(ids));
  } catch {
    /* storage unavailable */
  }
}

// Pretty label for a raw targetTier value ("EVERY" -> "Everyone", else the tier).
function tierLabel(tier: string): string {
  return isEveryTier(tier) ? "Everyone" : titleCase(tier);
}

export default function AnnouncementsBanner() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const list = await listAnnouncements();
        if (!alive) return;
        const seen = new Set(readSeen());
        setItems(list.items.filter((a) => !seen.has(a.id)));
        setIndex(0);
      } catch {
        if (!alive) return;
        setItems([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const current = items[index];

  // Record one idempotent view whenever an announcement is shown to the user.
  useEffect(() => {
    if (current) {
      markAnnouncementViewed(current.id).catch(() => {
        /* view counters are best-effort — never break the dashboard */
      });
    }
  }, [current]);

  const dismiss = () => {
    if (!current) return;
    writeSeen([...readSeen(), current.id]);
    setIndex((i) => i + 1);
  };

  if (loading) {
    return <div className="skeleton anim-rise mb-5 h-24 rounded-2xl" />;
  }
  if (!current) return null;

  const publishedMeta = current.publishedAt
    ? `Published ${ago(current.publishedAt)}`
    : "From the Brikoh team";

  return (
    <div className="anim-rise mb-5 overflow-hidden rounded-2xl border border-brand-200 bg-white shadow-sm">
      <div className="flex items-start gap-3 p-4 sm:p-5">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white">
          <Icon name="sparkle" size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-display text-sm font-extrabold text-ink-900">
              {current.title || "Announcement"}
            </p>
            <Badge tone="brand">{tierLabel(current.targetTier)}</Badge>
          </div>
          {current.body && (
            <p className="mt-1 text-sm font-semibold leading-relaxed text-ink-500">
              {current.body}
            </p>
          )}
          <p className="mt-1.5 text-[11px] font-semibold text-ink-300">{publishedMeta}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 border-t border-cream-100 px-4 py-2">
        {items.length > 1 && (
          <span className="mr-auto text-[11px] font-bold tabular-nums text-ink-300">
            {index + 1} of {items.length}
          </span>
        )}
        <button
          onClick={dismiss}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-ink-600 transition-colors hover:bg-cream-100 hover:text-ink-900"
        >
          <Icon name="check" size={14} /> Got it
        </button>
      </div>
    </div>
  );
}
import { cls } from "../lib/format";

type ThemeKind = "classic" | "modern" | "bold";

function themeKind(slug = "", name = ""): ThemeKind {
  const value = `${slug} ${name}`.toLowerCase();
  if (value.includes("modern")) return "modern";
  if (value.includes("bold") || value.includes("boutique")) return "bold";
  return "classic";
}

/** A miniature storefront screenshot used when a template has no preview image. */
export default function StorefrontThemePreview({
  name,
  slug,
  previewUrl,
}: {
  name: string;
  slug?: string;
  previewUrl?: string | null;
}) {
  const kind = themeKind(slug, name);

  if (previewUrl) {
    return <img src={previewUrl} alt={`${name} storefront theme preview`} className="h-full w-full object-cover" loading="lazy" />;
  }

  return (
    <div
      role="img"
      aria-label={`${name} storefront theme preview`}
      className={cls("theme-preview h-full w-full overflow-hidden p-2.5", `theme-preview-${kind}`)}
    >
      <div className="theme-preview-window flex h-full flex-col overflow-hidden">
        <div className="theme-preview-topbar flex h-4 shrink-0 items-center gap-1 px-2">
          <i /><i /><i />
          <span className="ml-auto h-1.5 w-10 rounded-full opacity-30" />
        </div>
        <div className="theme-preview-nav flex h-6 shrink-0 items-center gap-1.5 px-2.5">
          <span className="theme-preview-mark flex h-3 w-3 items-center justify-center text-[6px] font-black">B</span>
          <span className="h-1.5 w-12 rounded-full opacity-80" />
          <span className="ml-auto h-3 w-8 rounded-full opacity-80" />
        </div>
        <div className="theme-preview-hero relative flex min-h-0 flex-1 items-center gap-2 overflow-hidden px-3 py-2">
          <div className="relative z-10 w-[55%]">
            <span className="mb-1 block h-1 w-9 rounded-full opacity-55" />
            <span className="theme-preview-headline block h-2 w-full" />
            <span className="theme-preview-headline mt-1 block h-2 w-4/5" />
            <span className="mt-2 block h-3 w-10 rounded-sm opacity-90" />
          </div>
          <div className="theme-preview-hero-art absolute right-2 top-2 h-[72%] w-[36%]" />
        </div>
        <div className="theme-preview-products grid shrink-0 grid-cols-3 gap-1.5 px-2.5 py-2">
          {(["one", "two", "three"] as const).map((item) => (
            <div key={item} className="theme-preview-product overflow-hidden">
              <div className={cls("theme-preview-product-art", `theme-preview-art-${item}`)} />
              <div className="space-y-1 p-1.5">
                <span className="block h-1 w-4/5 rounded-full opacity-65" />
                <span className="block h-1 w-2/5 rounded-full opacity-40" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <span className="absolute bottom-3 right-4 rounded-full bg-black/55 px-2 py-1 text-[9px] font-extrabold uppercase tracking-wider text-white backdrop-blur-sm">
        {name}
      </span>
    </div>
  );
}

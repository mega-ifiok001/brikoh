import { useTheme } from "../context/ThemeContext";
import { Icon } from "./ui";

export default function ThemeSwitch({ showLabel = false }: { showLabel?: boolean }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      data-theme-switch
      data-tour-id={showLabel ? "settings-theme" : "header-theme"}
      aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
      title={`Switch to ${isDark ? "light" : "dark"} theme`}
      onClick={toggleTheme}
      className={
        showLabel
          ? "inline-flex items-center gap-3 rounded-xl border border-cream-300 bg-white px-3 py-2 text-sm font-bold text-ink-700 transition-colors hover:border-brand-300"
          : "inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink-500 transition-colors hover:bg-cream-100 hover:text-ink-900"
      }
    >
      <Icon name={isDark ? "moon" : "sun"} size={showLabel ? 17 : 18} />
      {showLabel && <span>{isDark ? "Dark mode" : "Light mode"}</span>}
    </button>
  );
}

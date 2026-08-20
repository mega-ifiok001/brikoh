"use client";

import { useTheme } from "@/lib/theme";
import { Sun, Moon } from "./icons";

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={theme === "dark" ? "Light mode" : "Dark mode"}
      className={`grid h-10 w-10 place-items-center rounded-full border border-ink/10 bg-white text-ink transition-all hover:border-brand hover:text-brand ${className}`}
    >
      {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}

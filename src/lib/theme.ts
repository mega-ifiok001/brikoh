"use client";

import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark";
const KEY = "brikoh_theme";
const EVENT = "brikoh-theme-change";

export function getTheme(): Theme {
  if (typeof document !== "undefined" && document.documentElement.classList.contains("dark")) return "dark";
  if (typeof window !== "undefined") {
    try {
      const s = localStorage.getItem(KEY);
      if (s === "light" || s === "dark") return s;
    } catch { /* ignore */ }
  }
  return "light";
}

export function applyTheme(t: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", t === "dark");
  try { localStorage.setItem(KEY, t); } catch { /* ignore */ }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: t }));
}

/** Global theme hook — kept in sync across every mounted toggle. */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => getTheme());

  useEffect(() => {
    const onTheme = (e: Event) => setTheme((e as CustomEvent<Theme>).detail);
    window.addEventListener(EVENT, onTheme);
    return () => window.removeEventListener(EVENT, onTheme);
  }, []);

  useEffect(() => {
    applyTheme(theme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);

  const toggle = useCallback(() => setTheme((t) => (t === "dark" ? "light" : "dark")), []);
  return { theme, toggle };
}

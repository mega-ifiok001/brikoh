import { useEffect, useState } from "react";

export type AuthRoute = "login" | "signup" | "forgot-password" | "reset-password";

export type PageRoute =
  | "contact"
  | "blog"
  | "report"
  | "help"
  | "academy"
  | "privacy"
  | "terms"
  | "cookies"
  | "security"
  | "about"
  | "onboarding"
  | "dashboard"
  | "inventory"
  | "money"
  | "website-builder"
  | "storefront"
  | "admin"
  | "mobile";

export type Route = AuthRoute | PageRoute;

const AUTH_ROUTES: Record<string, AuthRoute> = {
  "/login": "login",
  "/signup": "signup",
  "/forgot-password": "forgot-password",
  "/reset-password": "reset-password",
};

const PAGE_ROUTES: Record<string, PageRoute> = {
  "/contact": "contact",
  "/blog": "blog",
  "/report": "report",
  "/help": "help",
  "/academy": "academy",
  "/privacy": "privacy",
  "/terms": "terms",
  "/cookies": "cookies",
  "/security": "security",
  "/about": "about",
  "/onboarding": "onboarding",
  "/dashboard": "dashboard",
  "/inventory": "inventory",
  "/money": "money",
  "/website-builder": "website-builder",
  "/storefront": "storefront",
  "/admin": "admin",
  "/mobile": "mobile",
};

const AUTH_VALUES: readonly string[] = ["login", "signup", "forgot-password", "reset-password"];

export function isAuthRoute(route: Route | null): route is AuthRoute {
  return route !== null && AUTH_VALUES.includes(route);
}

export function getRouteFromHash(): Route | null {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash.replace(/^#/, "");
  const direct = AUTH_ROUTES[hash] ?? PAGE_ROUTES[hash];
  if (direct) return direct;
  // Deep-links into app modules: #/dashboard/<section>, #/inventory/<view>, #/money/<view>
  if (hash.startsWith("/dashboard/")) return "dashboard";
  if (hash.startsWith("/inventory/")) return "inventory";
  if (hash.startsWith("/money/")) return "money";
  return null;
}

/** Subscribe to hash changes. Works in the static SPA preview AND Next.js. */
export function useHashRoute(): Route | null {
  const [route, setRoute] = useState<Route | null>(() => getRouteFromHash());

  useEffect(() => {
    const onHash = () => setRoute(getRouteFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  return route;
}

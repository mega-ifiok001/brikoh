import { useEffect, useState } from "react";

export type AuthRoute = "login" | "signup" | "accept-invite" | "verify";

export type PageRoute =
  | "contact" | "blog" | "report" | "help" | "academy" | "privacy"
  | "terms" | "cookies" | "security" | "about"
  | "dashboard" | "onboarding" | "storefront" | "admin";

export type Route = AuthRoute | PageRoute;

const AUTH_ROUTES: Record<string, AuthRoute> = {
  "/login": "login",
  "/signup": "signup",
  "/accept-invite": "accept-invite",
  "/verify": "verify",
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
  "/dashboard": "dashboard",
  "/onboarding": "onboarding",
  "/admin": "admin",
};

const AUTH_VALUES: readonly string[] = ["login", "signup", "accept-invite", "verify"];

export function isAuthRoute(route: Route | null): route is AuthRoute {
  return route !== null && AUTH_VALUES.includes(route);
}

export function getRouteFromHash(): Route | null {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash.replace(/^#/, "");
  return AUTH_ROUTES[hash] ?? PAGE_ROUTES[hash] ?? (hash.startsWith("/storefront") ? "storefront" : null);
}

/** Subdomain from a storefront hash, e.g. #/storefront/amara-co → "amara-co". */
export function storefrontSubdomainFromHash(): string | null {
  if (typeof window === "undefined") return null;
  const m = window.location.hash.match(/^#\/storefront(?:\/([a-z0-9-]+))?/);
  return m?.[1] ?? null;
}

export function useHashRoute(): Route | null {
  const [route, setRoute] = useState<Route | null>(() => getRouteFromHash());

  useEffect(() => {
    const onHash = () => setRoute(getRouteFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  return route;
}

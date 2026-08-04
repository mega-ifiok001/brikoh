"use client";

import { AuthProvider } from "@/context/AuthContext";
import { useHashRoute, isAuthRoute } from "@/lib/hashRouter";
import { InventoryProvider } from "@/inventory/lib";
import LandingPage from "./LandingPage";
import AuthPage from "./auth/AuthPage";
import PagesRouter from "@/pages/PagesRouter";
import OnboardingPage from "@/onboarding/OnboardingPage";
import DashboardPage from "@/dashboard/DashboardPage";
import WebsiteBuilder from "@/website/WebsiteBuilder";
import Storefront from "@/website/Storefront";
import MoneyApp from "@/payments/MoneyApp";
import AdminPanel from "@/admin/AdminPanel";
import MobileApp from "@/mobile/MobileApp";

/**
 * Root switcher used by both the Vite entry (src/App.tsx) and the
 * Next.js home route (app/page.tsx). Reads the URL hash so the static
 * preview can navigate between landing, auth, content, onboarding,
 * dashboard, website builder and storefront views.
 */
function RootSwitch() {
  const route = useHashRoute();
  if (!route) return <LandingPage />;
  if (isAuthRoute(route)) return <AuthPage />;
  if (route === "onboarding") return <OnboardingPage />;
  if (route === "dashboard") return <DashboardPage />;
  if (route === "money") return <MoneyApp />;
  if (route === "admin") return <AdminPanel />;
  if (route === "mobile") return <MobileApp />;
  if (route === "website-builder") return <WebsiteBuilder />;
  if (route === "storefront")
    return (
      <InventoryProvider>
        <Storefront />
      </InventoryProvider>
    );
  return <PagesRouter route={route} />;
}

export default function AppRoot() {
  return (
    <AuthProvider>
      <RootSwitch />
    </AuthProvider>
  );
}

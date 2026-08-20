"use client";

import { AuthProvider, useAuth } from "@/context/AuthContext";
import { useHashRoute, isAuthRoute } from "@/lib/hashRouter";
import LandingPage from "./LandingPage";
import AuthPage from "./auth/AuthPage";
import PagesRouter from "@/pages/PagesRouter";
import OnboardingPage from "@/onboarding/OnboardingPage";
import DashboardPage from "@/dashboard/DashboardPage";
import Storefront from "@/website/Storefront";
import AdminPanel from "@/admin/AdminPanel";
import { Skeleton } from "@/components/Skeleton";

/** Full-screen skeleton while the app restores the session from the API. */
function BootScreen() {
  return (
    <div className="grid min-h-[100dvh] place-items-center bg-cream">
      <div className="w-full max-w-sm space-y-6 px-6">
        <div className="flex justify-center">
          <Skeleton className="h-12 w-12 rounded-2xl" />
        </div>
        <Skeleton className="h-8 w-3/4 mx-auto" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-12 w-full rounded-full" />
        <p className="text-center text-xs text-muted">Restoring your session…</p>
      </div>
    </div>
  );
}

function RootSwitch() {
  const route = useHashRoute();
  const { booting } = useAuth();
  if (booting) return <BootScreen />;
  if (!route) return <LandingPage />;
  if (isAuthRoute(route)) return <AuthPage />;
  if (route === "dashboard") return <DashboardPage />;
  if (route === "onboarding") return <OnboardingPage />;
  if (route === "admin") return <AdminPanel />;
  if (route === "storefront") return <Storefront />;
  return <PagesRouter route={route} />;
}

export default function AppRoot() {
  return (
    <AuthProvider>
      <RootSwitch />
    </AuthProvider>
  );
}

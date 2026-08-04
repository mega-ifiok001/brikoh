"use client";

import { useEffect, useRef } from "react";
import { useHashRoute, isAuthRoute, type AuthRoute } from "@/lib/hashRouter";
import { AuthShell } from "./AuthUI";
import LoginScreen from "./LoginScreen";
import SignupScreen from "./SignupScreen";
import ForgotPasswordScreen from "./ForgotPasswordScreen";
import ResetPasswordScreen from "./ResetPasswordScreen";

const META: Record<AuthRoute, { title: string; subtitle: string }> = {
  login: {
    title: "Welcome back",
    subtitle: "Log in to your Brikoh account to keep growing.",
  },
  signup: {
    title: "Create your free account",
    subtitle: "Start selling in minutes — free forever, no credit card required.",
  },
  "forgot-password": {
    title: "Forgot your password?",
    subtitle: "No worries — enter your email and we'll send you a reset code.",
  },
  "reset-password": {
    title: "Set a new password",
    subtitle: "Enter the code from your email and choose a strong new password.",
  },
};

export default function AuthPage({ initialRoute }: { initialRoute?: AuthRoute }) {
  const hashRoute = useHashRoute();
  const route: AuthRoute =
    hashRoute && isAuthRoute(hashRoute) ? hashRoute : initialRoute ?? "login";
  const meta = META[route];
  const prevRoute = useRef(hashRoute);

  // Hybrid navigation: when running as a real Next.js route (e.g. /login),
  // "Back to home" (#/) should leave the auth page entirely. In the static
  // SPA preview (pathname === "/") the root switcher handles it instead.
  useEffect(() => {
    const prev = prevRoute.current;
    prevRoute.current = hashRoute;
    if (
      prev &&
      !hashRoute &&
      typeof window !== "undefined" &&
      window.location.pathname !== "/"
    ) {
      window.location.href = "/";
    }
  }, [hashRoute]);

  useEffect(() => {
    document.title = `${meta.title} — Brikoh`;
    window.scrollTo({ top: 0 });
  }, [route, meta.title]);

  return (
    <AuthShell title={meta.title} subtitle={meta.subtitle}>
      {route === "login" && <LoginScreen />}
      {route === "signup" && <SignupScreen />}
      {route === "forgot-password" && <ForgotPasswordScreen />}
      {route === "reset-password" && <ResetPasswordScreen />}
    </AuthShell>
  );
}

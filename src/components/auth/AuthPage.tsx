"use client";

import { useEffect } from "react";
import { useHashRoute, isAuthRoute, type AuthRoute } from "@/lib/hashRouter";
import { AuthShell } from "./AuthUI";
import LoginScreen from "./LoginScreen";
import SignupScreen from "./SignupScreen";
import AcceptInviteScreen from "./AcceptInviteScreen";
import VerifyEmailScreen from "./VerifyEmailScreen";

const META: Record<AuthRoute, { title: string; subtitle: string }> = {
  login: { title: "Welcome back", subtitle: "Log in to your Brikoh account to keep growing." },
  signup: { title: "Create your free account", subtitle: "Start selling in minutes — free forever, no credit card required." },
  "accept-invite": { title: "Accept your invite", subtitle: "You've been invited to a store workspace. Enter your token below." },
  verify: { title: "Verify your email", subtitle: "Confirm your email address to continue setting up your business." },
};

export default function AuthPage({ initialRoute }: { initialRoute?: AuthRoute }) {
  const hashRoute = useHashRoute();
  const route: AuthRoute =
    hashRoute && isAuthRoute(hashRoute) ? hashRoute : initialRoute ?? "login";
  const meta = META[route];

  useEffect(() => {
    document.title = `${meta.title} — Brikoh`;
    window.scrollTo({ top: 0 });
  }, [route, meta.title]);

  return (
    <AuthShell title={meta.title} subtitle={meta.subtitle}>
      {route === "login" && <LoginScreen />}
      {route === "signup" && <SignupScreen />}
      {route === "accept-invite" && <AcceptInviteScreen />}
      {route === "verify" && <VerifyEmailScreen />}
    </AuthShell>
  );
}

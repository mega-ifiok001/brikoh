import type { Metadata } from "next";
import { AuthProvider } from "@/context/AuthContext";
import OnboardingPage from "@/onboarding/OnboardingPage";

export const metadata: Metadata = { title: "Set up your business — Brikoh" };

export default function Page() {
  return (
    <AuthProvider>
      <OnboardingPage />
    </AuthProvider>
  );
}

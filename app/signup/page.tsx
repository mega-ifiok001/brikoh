import type { Metadata } from "next";
import { AuthProvider } from "@/context/AuthContext";
import AuthPage from "@/components/auth/AuthPage";

export const metadata: Metadata = { title: "Create account — Brikoh" };

export default function SignupPage() {
  return (
    <AuthProvider>
      <AuthPage initialRoute="signup" />
    </AuthProvider>
  );
}

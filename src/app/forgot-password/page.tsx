import type { Metadata } from "next";
import { AuthProvider } from "@/context/AuthContext";
import AuthPage from "@/components/auth/AuthPage";

export const metadata: Metadata = { title: "Forgot password — Brikoh" };

export default function ForgotPasswordPage() {
  return (
    <AuthProvider>
      <AuthPage initialRoute="forgot-password" />
    </AuthProvider>
  );
}

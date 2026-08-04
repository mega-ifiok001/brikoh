import type { Metadata } from "next";
import { AuthProvider } from "@/context/AuthContext";
import AuthPage from "@/components/auth/AuthPage";

export const metadata: Metadata = { title: "Reset password — Brikoh" };

export default function ResetPasswordPage() {
  return (
    <AuthProvider>
      <AuthPage initialRoute="reset-password" />
    </AuthProvider>
  );
}

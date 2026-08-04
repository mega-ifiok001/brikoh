import type { Metadata } from "next";
import { AuthProvider } from "@/context/AuthContext";
import AuthPage from "@/components/auth/AuthPage";

export const metadata: Metadata = { title: "Log in — Brikoh" };

export default function LoginPage() {
  return (
    <AuthProvider>
      <AuthPage initialRoute="login" />
    </AuthProvider>
  );
}

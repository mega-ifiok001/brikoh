import type { Metadata } from "next";
import { AuthProvider } from "@/context/AuthContext";
import AuthPage from "@/components/auth/AuthPage";

export const metadata: Metadata = { title: "Verify email — Brikoh" };

export default function Page() {
  return (
    <AuthProvider>
      <AuthPage initialRoute="verify" />
    </AuthProvider>
  );
}

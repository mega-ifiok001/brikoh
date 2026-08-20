import type { Metadata } from "next";
import { AuthProvider } from "@/context/AuthContext";
import AuthPage from "@/components/auth/AuthPage";

export const metadata: Metadata = { title: "Accept invite — Brikoh" };

export default function Page() {
  return (
    <AuthProvider>
      <AuthPage initialRoute="accept-invite" />
    </AuthProvider>
  );
}

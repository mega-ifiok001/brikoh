import type { Metadata } from "next";
import { AuthProvider } from "@/context/AuthContext";
import MoneyApp from "@/payments/MoneyApp";

export const metadata: Metadata = { title: "Money & Accounting — Brikoh" };

export default function Page() {
  return (
    <AuthProvider>
      <MoneyApp />
    </AuthProvider>
  );
}

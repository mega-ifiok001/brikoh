import type { Metadata } from "next";
import { AuthProvider } from "@/context/AuthContext";
import DashboardPage from "@/dashboard/DashboardPage";

export const metadata: Metadata = { title: "Dashboard — Brikoh" };

export default function Page() {
  return (
    <AuthProvider>
      <DashboardPage />
    </AuthProvider>
  );
}

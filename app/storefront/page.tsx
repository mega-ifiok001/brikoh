import type { Metadata } from "next";
import { AuthProvider } from "@/context/AuthContext";
import Storefront from "@/website/Storefront";

export const metadata: Metadata = { title: "My Store — Brikoh" };

export default function Page() {
  return (
    <AuthProvider>
      <Storefront />
    </AuthProvider>
  );
}

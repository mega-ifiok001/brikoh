import type { Metadata } from "next";
import { AuthProvider } from "@/context/AuthContext";
import InventoryApp from "@/inventory/InventoryApp";

export const metadata: Metadata = { title: "Inventory — Brikoh" };

export default function Page() {
  return (
    <AuthProvider>
      <InventoryApp />
    </AuthProvider>
  );
}

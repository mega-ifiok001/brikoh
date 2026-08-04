import type { Metadata } from "next";
import AdminPanel from "@/admin/AdminPanel";

export const metadata: Metadata = { title: "Brikoh Ops Console — Admin" };

export default function Page() {
  return <AdminPanel />;
}

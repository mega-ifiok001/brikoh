import type { Metadata } from "next";
import HelpCenterPage from "@/pages/HelpCenterPage";

export const metadata: Metadata = { title: "Help center — Brikoh" };

export default function Page() {
  return <HelpCenterPage />;
}

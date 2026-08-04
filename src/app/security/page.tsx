import type { Metadata } from "next";
import SecurityPage from "@/pages/SecurityPage";

export const metadata: Metadata = { title: "Security — Brikoh" };

export default function Page() {
  return <SecurityPage />;
}

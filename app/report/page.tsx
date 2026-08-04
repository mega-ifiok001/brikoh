import type { Metadata } from "next";
import ReportPage from "@/pages/ReportPage";

export const metadata: Metadata = { title: "E-commerce Report — Brikoh" };

export default function Page() {
  return <ReportPage />;
}

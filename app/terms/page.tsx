import type { Metadata } from "next";
import TermsPage from "@/pages/TermsPage";

export const metadata: Metadata = { title: "Terms of Service — Brikoh" };

export default function Page() {
  return <TermsPage />;
}

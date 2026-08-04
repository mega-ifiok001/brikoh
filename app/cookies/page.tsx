import type { Metadata } from "next";
import CookiesPage from "@/pages/CookiesPage";

export const metadata: Metadata = { title: "Cookie Policy — Brikoh" };

export default function Page() {
  return <CookiesPage />;
}

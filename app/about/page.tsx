import type { Metadata } from "next";
import AboutPage from "@/pages/AboutPage";

export const metadata: Metadata = { title: "About us — Brikoh" };

export default function Page() {
  return <AboutPage />;
}

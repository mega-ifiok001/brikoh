import type { Metadata } from "next";
import ContactPage from "@/pages/ContactPage";

export const metadata: Metadata = { title: "Contact us — Brikoh" };

export default function Page() {
  return <ContactPage />;
}

import type { Metadata } from "next";
import { AuthProvider } from "@/context/AuthContext";
import WebsiteBuilder from "@/website/WebsiteBuilder";

export const metadata: Metadata = { title: "Website Studio — Brikoh" };

export default function Page() {
  return (
    <AuthProvider>
      <WebsiteBuilder />
    </AuthProvider>
  );
}

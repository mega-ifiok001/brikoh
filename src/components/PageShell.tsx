"use client";

import { useEffect, type ReactNode } from "react";
import { AuthProvider } from "@/context/AuthContext";
import SiteHeader from "./SiteHeader";
import Footer from "./Footer";

/**
 * Standard shell for inner pages: shared header, content, footer.
 * Also sets the document title and scrolls to top on mount.
 */
export default function PageShell({ title, children }: { title: string; children: ReactNode }) {
  useEffect(() => {
    document.title = `${title} — Brikoh`;
    window.scrollTo({ top: 0 });
  }, [title]);

  return (
    <div className="min-h-screen bg-cream">
      <AuthProvider>
        <SiteHeader />
        <main>{children}</main>
        <Footer />
      </AuthProvider>
    </div>
  );
}

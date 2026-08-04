import type { Metadata } from "next";
import BlogPage from "@/pages/BlogPage";

export const metadata: Metadata = { title: "Blog — Brikoh" };

export default function Page() {
  return <BlogPage />;
}

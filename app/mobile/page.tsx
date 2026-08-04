import type { Metadata } from "next";
import MobileApp from "@/mobile/MobileApp";

export const metadata: Metadata = { title: "Brikoh Mobile" };

export default function Page() {
  return <MobileApp />;
}

"use client";

import type { ComponentType } from "react";
import type { PageRoute } from "@/lib/hashRouter";

type MarketingRoute = Exclude<PageRoute, "onboarding" | "dashboard" | "storefront" | "admin">;
import AboutPage from "./AboutPage";
import ContactPage from "./ContactPage";
import BlogPage from "./BlogPage";
import ReportPage from "./ReportPage";
import HelpCenterPage from "./HelpCenterPage";
import AcademyPage from "./AcademyPage";
import PrivacyPage from "./PrivacyPage";
import TermsPage from "./TermsPage";
import CookiesPage from "./CookiesPage";
import SecurityPage from "./SecurityPage";

const pages: Record<MarketingRoute, ComponentType> = {
  about: AboutPage,
  contact: ContactPage,
  blog: BlogPage,
  report: ReportPage,
  help: HelpCenterPage,
  academy: AcademyPage,
  privacy: PrivacyPage,
  terms: TermsPage,
  cookies: CookiesPage,
  security: SecurityPage,
};

export default function PagesRouter({ route }: { route: MarketingRoute }) {
  const Page = pages[route];
  return <Page />;
}

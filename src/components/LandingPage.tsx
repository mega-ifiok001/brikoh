import Navbar from "./Navbar";
import Hero from "./Hero";
import LogoCloud from "./LogoCloud";
import Features from "./Features";
import FeatureGrid from "./FeatureGrid";
import Stats from "./Stats";
import Testimonials from "./Testimonials";
import Pricing from "./Pricing";
import Ecosystem from "./Ecosystem";
import FAQ from "./FAQ";
import CTA from "./CTA";
import Footer from "./Footer";
import WelcomeToast from "./WelcomeToast";

/**
 * The full Brikoh landing page.
 * Rendered by the Next.js App Router (app/page.tsx) and by the
 * Vite entry (src/App.tsx) so both build pipelines share one source.
 */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      <main>
        <Hero />
        <LogoCloud />
        <Features />
        <FeatureGrid />
        <Stats />
        <Testimonials />
        <Pricing />
        <Ecosystem />
        <FAQ />
        <CTA />
      </main>
      <Footer />
      <WelcomeToast />
    </div>
  );
}

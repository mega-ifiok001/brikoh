import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button, Icon } from "./ui";
import { useProductTour } from "../context/ProductTourContext";

type TourStep = { target: string; path: string; title: string; description: string };

// A short tour of the core workflows. Each step spotlights a real control.
const TOUR_STEPS: TourStep[] = [
  { target: "nav-overview", path: "/dashboard", title: "Your business overview", description: "Start here for a quick view of sales, orders, stock, and recent activity." },
  { target: "overview-new-sale", path: "/dashboard", title: "Make a sale", description: "Use New sale for an in-person checkout. Add products, choose payment, then complete the sale." },
  { target: "nav-products", path: "/dashboard/products", title: "Products and inventory", description: "Manage your catalog, prices, and stock. Use Add product to create an item for sale." },
  { target: "nav-orders", path: "/dashboard/orders", title: "Orders", description: "Review and search sales from your shop and online storefront." },
  { target: "nav-storefront", path: "/dashboard/storefront", title: "Your online store", description: "Set up the storefront customers visit, including its look, delivery, and payment options." },
  { target: "nav-customers", path: "/dashboard/customers", title: "Customers", description: "Keep customer contact details and purchase relationships together; add a customer from this page." },
  { target: "nav-invoices", path: "/dashboard/invoices", title: "Invoices", description: "Create invoices and track what customers owe and what they have paid." },
  { target: "nav-wallet", path: "/dashboard/wallet", title: "Wallet and payouts", description: "Check your online sales balance, payout details, and withdrawal options." },
  { target: "nav-analytics", path: "/dashboard/analytics", title: "Business performance", description: "Use Analytics and Reports to understand sales trends, expenses, and profit." },
  { target: "nav-staff", path: "/dashboard/staff", title: "Your team", description: "Invite teammates and manage their access to your store." },
  { target: "nav-settings", path: "/dashboard/settings", title: "Settings", description: "Manage your business profile, storefront, bank details, notifications, account, and plan." },
  { target: "settings-theme", path: "/dashboard/settings/display", title: "Display and replay the tour", description: "Switch between light and dark themes here, or restart this tour whenever you need it." },
];

type Highlight = { left: number; top: number; width: number; height: number };
type Position = { left: number; top: number; width: number };

export default function ProductTour() {
  const { mode, setMode, setTarget } = useProductTour();
  const [step, setStep] = useState(0);
  const [highlight, setHighlight] = useState<Highlight | null>(null);
  const [position, setPosition] = useState<Position | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const activeStep = TOUR_STEPS[step];

  useEffect(() => {
    if (mode !== "tour" || !activeStep) {
      setTarget(null);
      return;
    }
    setTarget(activeStep.target);
    if (location.pathname !== activeStep.path) {
      navigate(activeStep.path);
      return;
    }

    let firstFrame = 0;
    let secondFrame = 0;
    const measure = () => {
      const target = document.querySelector<HTMLElement>(`[data-tour-id="${activeStep.target}"]`);
      if (!target || target.getClientRects().length === 0) {
        setHighlight(null);
        setPosition(null);
        return;
      }

      target.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
      const rect = target.getBoundingClientRect();
      const pad = 5;
      const nextHighlight = {
        left: Math.max(4, rect.left - pad),
        top: Math.max(4, rect.top - pad),
        width: Math.min(window.innerWidth - 8, rect.width + pad * 2),
        height: Math.min(window.innerHeight - 8, rect.height + pad * 2),
      };
      const popoverWidth = Math.min(420, window.innerWidth - 32);
      let left = rect.right + 16;
      if (left + popoverWidth > window.innerWidth - 16) left = rect.left - popoverWidth - 16;
      if (left < 16) left = Math.max(16, (window.innerWidth - popoverWidth) / 2);
      const top = Math.max(16, Math.min(rect.top - 16, window.innerHeight - 320));

      setHighlight(nextHighlight);
      setPosition({ left, top, width: popoverWidth });
    };

    firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(measure);
    });
    window.addEventListener("resize", measure);
    document.addEventListener("scroll", measure, true);
    return () => {
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
      window.removeEventListener("resize", measure);
      document.removeEventListener("scroll", measure, true);
    };
  }, [activeStep, location.pathname, mode, navigate, setTarget]);

  useEffect(() => {
    if (mode !== "tour") {
      setHighlight(null);
      setPosition(null);
      setTarget(null);
    }
  }, [mode, setTarget]);

  if (mode === "closed") return null;

  const close = () => setMode("closed");
  const start = () => {
    setStep(0);
    setMode("tour");
  };
  const previous = () => setStep((current) => Math.max(0, current - 1));
  const next = () => {
    if (step === TOUR_STEPS.length - 1) close();
    else setStep((current) => Math.min(TOUR_STEPS.length - 1, current + 1));
  };

  return (
    <>
      {mode === "tour" && highlight ? (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed z-[90] rounded-xl border-2 border-brand-400 transition-all duration-200"
          style={{
            left: highlight.left,
            top: highlight.top,
            width: highlight.width,
            height: highlight.height,
            boxShadow: "0 0 0 9999px rgba(0,0,0,.64), 0 0 0 5px rgba(236,100,5,.24)",
          }}
        />
      ) : null}

      {mode === "prompt" && <div className="fixed inset-0 z-[90] bg-black/55" />}

      <section
        aria-labelledby="product-tour-title"
        aria-describedby="product-tour-description"
        aria-modal="true"
        role="dialog"
        className={`anim-rise fixed z-[100] w-[min(420px,calc(100vw-32px))] rounded-2xl border border-cream-200 bg-white p-6 shadow-2xl sm:p-7 ${mode === "prompt" || !position ? "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" : ""}`}
        style={mode === "tour" && position ? { left: position.left, top: position.top, width: position.width } : undefined}
      >
        <button
          type="button"
          onClick={close}
          aria-label="Close tour"
          className="absolute right-3 top-3 rounded-lg p-2 text-ink-400 transition hover:bg-cream-100 hover:text-ink-900"
        >
          <Icon name="x" size={18} />
        </button>

        {mode === "prompt" ? (
          <>
            <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <Icon name="grid" size={22} />
            </span>
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-brand-600">Welcome to Brikoh</p>
            <h2 id="product-tour-title" className="mt-2 font-display text-2xl font-extrabold">Explore your dashboard</h2>
            <p id="product-tour-description" className="mt-2 text-sm leading-6 text-ink-500">
              Take a quick look at the key tools for running your store. You can skip at any time and restart the tour from Settings → Display.
            </p>
            <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={close}>Skip tour</Button>
              <Button onClick={start} icon="arrowRight">Start guided tour</Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between gap-4 pr-10">
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-brand-600">Guided tour</p>
              <span className="text-xs font-bold tabular-nums text-ink-400">{step + 1} of {TOUR_STEPS.length}</span>
            </div>
            <h2 id="product-tour-title" className="mt-4 font-display text-xl font-extrabold">{activeStep.title}</h2>
            <p id="product-tour-description" className="mt-2 text-sm leading-6 text-ink-500">{activeStep.description}</p>
            <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-cream-200" aria-hidden="true">
              <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${((step + 1) / TOUR_STEPS.length) * 100}%` }} />
            </div>
            <div className="mt-5 flex items-center justify-between gap-3">
              <Button variant="ghost" onClick={close}>Skip tour</Button>
              <div className="flex gap-2">
                {step > 0 && <Button variant="outline" onClick={previous}>Back</Button>}
                <Button onClick={next} icon={step === TOUR_STEPS.length - 1 ? "check" : "arrowRight"}>
                  {step === TOUR_STEPS.length - 1 ? "Finish" : "Next"}
                </Button>
              </div>
            </div>
          </>
        )}
      </section>
    </>
  );
}

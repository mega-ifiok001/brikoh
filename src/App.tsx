import { useEffect, type ReactNode } from "react";
import { HashRouter, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { PageLoader, ToastHost } from "./components/ui";
import Layout from "./components/Layout";
import Landing from "./pages/Landing";
import { AcceptInvitePage, AuthPage, VerifyPage } from "./pages/AuthPages";
import Onboarding from "./pages/Onboarding";
import Overview from "./pages/Overview";
import POS from "./pages/POS";
import Products from "./pages/Products";
import Branches from "./pages/Branches";
import Orders from "./pages/Orders";
import Customers from "./pages/Customers";
import Invoices from "./pages/Invoices";
import Discounts from "./pages/Discounts";
import Purchases from "./pages/Purchases";
import Wallet from "./pages/Wallet";
import Expenses from "./pages/Expenses";
import Reports from "./pages/Reports";
import Analytics from "./pages/Analytics";
import StorefrontStudio from "./pages/StorefrontStudio";
import Staff from "./pages/Staff";
import SettingsPage from "./pages/SettingsPage";
import StoreView from "./pages/StoreView";
import Tickets from "./pages/Tickets";

// ── Cross-subdomain config ────────────────────────────────────────────────
// The SAME build is deployed to brikoh.com, dashboard.brikoh.com, and every
// merchant's *.brikoh.com storefront subdomain (via the wildcard domain on
// Vercel). Which screens render is decided at runtime by checking
// window.location.hostname.
const DASHBOARD_HOST = "dashboard.brikoh.com";
const MAIN_HOST = "brikoh.com"; // change to "www.brikoh.com" if that's your canonical host

// Hostnames that are NOT a merchant storefront subdomain, even though they
// match "something.brikoh.com".
const RESERVED_SUBDOMAINS = new Set(["dashboard", "www", "api", "app"]);

const isDashboardHost = () =>
  typeof window !== "undefined" && window.location.hostname === DASHBOARD_HOST;

// Returns the merchant's subdomain if the current hostname is
// "<subdomain>.brikoh.com" and it's not a reserved/system subdomain.
// Returns null for brikoh.com itself, dashboard.brikoh.com, localhost, etc.
function getStoreSubdomain(): string | null {
  if (typeof window === "undefined") return null;
  const host = window.location.hostname;
  const parts = host.split(".");
  // "gemluxe.brikoh.com" -> ["gemluxe", "brikoh", "com"] (length 3)
  if (parts.length < 3) return null;
  const sub = parts[0];
  if (RESERVED_SUBDOMAINS.has(sub)) return null;
  return sub;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { loading, isAuthed } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-cream-50">
        <PageLoader label="Checking your session…" />
      </div>
    );
  }
  if (!isAuthed) {
    if (isDashboardHost()) {
      window.location.href = `https://${MAIN_HOST}/#/auth`;
      return (
        <div className="min-h-screen bg-cream-50">
          <PageLoader label="Redirecting to sign in…" />
        </div>
      );
    }
    return <Navigate to="/auth" replace />;
  }
  return <>{children}</>;
}

function RequireStore({ children }: { children: ReactNode }) {
  const { isOnboarded } = useAuth();
  if (!isOnboarded) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

function RedirectIfAuthed({ children }: { children: ReactNode }) {
  const { loading, isAuthed, isOnboarded } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-cream-50">
        <PageLoader label="One moment…" />
      </div>
    );
  }
  if (isAuthed) return <Navigate to={isOnboarded ? "/dashboard" : "/onboarding"} replace />;
  return <>{children}</>;
}

function Handoff() {
  const navigate = useNavigate();
  const { completeHandoff } = useAuth();

  useEffect(() => {
    const query = window.location.hash.split("?")[1] || "";
    const token = new URLSearchParams(query).get("token");
    if (token) {
      completeHandoff(token);
    }
    navigate(token ? "/dashboard" : "/", { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-cream-50">
      <PageLoader label="Signing you in…" />
    </div>
  );
}

function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-cream-50 px-6 text-center">
      <p className="font-display text-6xl font-extrabold text-brand-500">404</p>
      <h1 className="text-xl font-bold">This aisle doesn't exist</h1>
      <p className="max-w-sm text-sm text-ink-400">
        The page you're looking for moved or never made it to the market.
      </p>
      <a href="#/" className="mt-2 text-sm font-bold text-brand-600 hover:underline">
        Back to the storefront
      </a>
    </div>
  );
}

export default function App() {
  const onDashboardHost = isDashboardHost();
  const storeSubdomain = getStoreSubdomain();

  return (
    <AuthProvider>
      <HashRouter>
        <ScrollToTop />
        <ToastHost />
        <Routes>
          <Route
            path="/"
            element={
              onDashboardHost ? (
                <RequireAuth>
                  <RequireStore>
                    <Navigate to="/dashboard" replace />
                  </RequireStore>
                </RequireAuth>
              ) : storeSubdomain ? (
                // e.g. gemluxe.brikoh.com — render that merchant's storefront
                // directly instead of the marketing Landing page.
                <Navigate to={`/s/${storeSubdomain}`} replace />
              ) : (
                <Landing />
              )
            }
          />
          <Route path="/handoff" element={<Handoff />} />
          <Route
            path="/auth"
            element={
              <RedirectIfAuthed>
                <AuthPage />
              </RedirectIfAuthed>
            }
          />
          <Route path="/verify" element={<VerifyPage />} />
          <Route path="/accept-invite" element={<AcceptInvitePage />} />
          <Route path="/s/:subdomain" element={<StoreView />} />
          <Route path="/s/:subdomain/p/:productId" element={<StoreView />} />
          {/* On a merchant's own subdomain, also let bare "/p/:productId"
              (without repeating the subdomain) resolve to that store's
              product page — nicer links to hand out. */}
          {storeSubdomain && (
            <Route
              path="/p/:productId"
              element={<Navigate to={`/s/${storeSubdomain}`} replace />}
            />
          )}
          <Route
            path="/onboarding"
            element={
              <RequireAuth>
                <Onboarding />
              </RequireAuth>
            }
          />
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <RequireStore>
                  <Layout />
                </RequireStore>
              </RequireAuth>
            }
          >
            <Route index element={<Overview />} />
            <Route path="pos" element={<POS />} />
            <Route path="products" element={<Products />} />
            <Route path="branches" element={<Branches />} />
            <Route path="orders" element={<Orders />} />
            <Route path="customers" element={<Customers />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="discounts" element={<Discounts />} />
            <Route path="purchases" element={<Purchases />} />
            <Route path="wallet" element={<Wallet />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="reports" element={<Reports />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="storefront" element={<StorefrontStudio />} />
            <Route path="staff" element={<Staff />} />
            <Route path="tickets" element={<Tickets />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}
import { useEffect, type ReactNode } from "react";
import { HashRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
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
import StorefrontStudio from "./pages/StorefrontStudio";
import Staff from "./pages/Staff";
import SettingsPage from "./pages/SettingsPage";
import StoreView from "./pages/StoreView";

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
  if (!isAuthed) return <Navigate to="/auth" replace />;
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
  return (
    <AuthProvider>
      <HashRouter>
        <ScrollToTop />
        <ToastHost />
        <Routes>
          <Route path="/" element={<Landing />} />
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
            <Route path="storefront" element={<StorefrontStudio />} />
            <Route path="staff" element={<Staff />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}

import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { EmptyState, PageLoader, ToastHost } from "../components/ui";
import { AdminProvider, useAdmin } from "./AdminContext";
import AdminLayout, { useVisibleNav } from "./AdminLayout";
import Login from "./pages/Login";
import Overview from "./pages/Overview";
import Merchants from "./pages/Merchants";
import Stores from "./pages/Stores";
import StoreDetail from "./pages/StoreDetail";
import Orders from "./pages/Orders";
import Payments from "./pages/Payments";
import Tickets from "./pages/Tickets";
import TicketDetail from "./pages/TicketDetail";
import Announcements from "./pages/Announcements";
import Health from "./pages/Health";
import Telemetry from "./pages/Telemetry";
import Pricing from "./pages/Pricing";
import Operations from "./pages/Operations";
import AuditLog from "./pages/AuditLog";
import AdminStaff from "./pages/AdminStaff";
import Account from "./pages/Account";

/** Section-level guard. The API enforces the same rules; this just hides dead ends. */
function Need({ perm, superOnly, children }: { perm?: string; superOnly?: boolean; children: ReactNode }) {
  const { can, isSuper } = useAdmin();
  if ((perm && !can(perm)) || (superOnly && !isSuper)) {
    return (
      <div className="card">
        <EmptyState
          icon="shield"
          title="No access to this section"
          hint="Your admin role doesn't include the permission this page needs."
        />
      </div>
    );
  }
  return <>{children}</>;
}

function Protected() {
  const { me, loading, p } = useAdmin();
  if (loading)
    return (
      <div className="min-h-screen bg-cream-50">
        <PageLoader label="Checking your session…" />
      </div>
    );
  if (!me) return <Navigate to={p("/login")} replace />;
  return <AdminLayout />;
}

/** Index route: land on the first section this admin can actually open. */
function Home() {
  const { p } = useAdmin();
  const nav = useVisibleNav();
  const first = nav.flatMap((g) => g.items)[0];
  return <Navigate to={first ? p(first.to) : p("/account")} replace />;
}

function LoginRoute() {
  const { me, loading, p } = useAdmin();
  if (loading) return <PageLoader label="Checking your session…" />;
  if (me) return <Navigate to={p("/")} replace />;
  return <Login />;
}

function Inner() {
  const { p } = useAdmin();
  return (
    <>
      <ToastHost />
      <Routes>
        <Route path="login" element={<LoginRoute />} />
        <Route element={<Protected />}>
          <Route index element={<OverviewOrHome />} />
          <Route path="merchants" element={<Need perm="admin:merchants.view"><Merchants /></Need>} />
          <Route path="stores" element={<Need perm="admin:stores.view"><Stores /></Need>} />
          <Route path="stores/:storeId" element={<Need perm="stores:view"><StoreDetail /></Need>} />
          <Route path="orders" element={<Need perm="admin:orders.view"><Orders /></Need>} />
          <Route
            path="payments"
            element={<Need perm="admin:payments.awaiting-confirmation.view"><Payments /></Need>}
          />
          <Route path="tickets" element={<Need perm="admin:support.tickets.view"><Tickets /></Need>} />
          <Route
            path="tickets/:ticketId"
            element={<Need perm="admin:support.tickets.view"><TicketDetail /></Need>}
          />
          <Route
            path="announcements"
            element={<Need perm="admin:announcements.view" superOnly><Announcements /></Need>}
          />
          <Route path="health" element={<Need perm="stores:view"><Health /></Need>} />
          <Route path="telemetry" element={<Need perm="admin:telemetry.view" superOnly><Telemetry /></Need>} />
          <Route path="pricing" element={<Need perm="stores:view"><Pricing /></Need>} />
          <Route path="operations" element={<Need perm="operations:run"><Operations /></Need>} />
          <Route path="audit" element={<Need perm="audit:view" superOnly><AuditLog /></Need>} />
          <Route path="staff" element={<Need perm="admin:staff.view" superOnly><AdminStaff /></Need>} />
          <Route path="account" element={<Account />} />
        </Route>
        <Route path="*" element={<Navigate to={p("/")} replace />} />
      </Routes>
    </>
  );
}

/** "/" shows the financial overview for SUPER_ADMIN, otherwise redirects to the first allowed page. */
function OverviewOrHome() {
  const { isSuper, can } = useAdmin();
  return isSuper && can("admin:overview.view") ? <Overview /> : <Home />;
}

/**
 * `base` is "" on admin.brikoh.com (routes at the root) and "/admin" when the
 * panel is previewed from the main site at brikoh.com/#/admin.
 */
export default function AdminApp({ base = "" }: { base?: string }) {
  return (
    <AdminProvider base={base}>
      <Inner />
    </AdminProvider>
  );
}
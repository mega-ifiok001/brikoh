import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import AdminRoot from "./admin/AdminRoot";

// admin.brikoh.com serves the platform admin panel instead of the public app.
const ADMIN_HOST = "admin.brikoh.com";
const isAdminHost = window.location.hostname.toLowerCase() === ADMIN_HOST;

if (window.location.pathname !== "/" && !window.location.hash) {
  const target = "/#" + window.location.pathname + window.location.search;
  window.location.replace(target);
}


createRoot(document.getElementById("root")!).render(
  <StrictMode>{isAdminHost ? <AdminRoot /> : <App />}</StrictMode>
);
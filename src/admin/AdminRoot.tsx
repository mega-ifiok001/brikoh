import { useEffect } from "react";
import { HashRouter } from "react-router-dom";
import AdminApp from "./AdminApp";

/** Entry used on admin.brikoh.com — no merchant AuthProvider, no storefront logic. */
export default function AdminRoot() {
  useEffect(() => {
    document.title = "Brikoh Admin";
    let m = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (!m) {
      m = document.createElement("meta");
      m.name = "robots";
      document.head.appendChild(m);
    }
    m.content = "noindex, nofollow";
  }, []);

  return (
    <HashRouter>
      <AdminApp base="" />
    </HashRouter>
  );
}
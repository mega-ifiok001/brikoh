import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

if (window.location.pathname !== "/" && !window.location.hash) {
  const target = "/#" + window.location.pathname + window.location.search;
  window.location.replace(target);
}
 

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

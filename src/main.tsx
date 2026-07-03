import { createRoot } from "react-dom/client";
import { Router } from "wouter";
import App from "./App";
import { StoreProvider } from "@/hooks/useStore";
import "./index.css";

document.documentElement.classList.add("dark");
createRoot(document.getElementById("root")!).render(
  <Router>
    <StoreProvider>
      <App />
    </StoreProvider>
  </Router>
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.error("Service worker registration failed:", error);
    });
  });
}

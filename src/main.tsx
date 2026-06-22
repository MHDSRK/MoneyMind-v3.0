import { createRoot } from "react-dom/client";
import App from "./App";
import { StoreProvider } from "@/hooks/useStore";
import "./index.css";

document.documentElement.classList.add("dark");
createRoot(document.getElementById("root")!).render(
  <StoreProvider>
    <App />
  </StoreProvider>
);

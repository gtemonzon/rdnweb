// storageGuard MUST be the very first import so the fallback is in place
// before the Supabase client (or any other module) tries to read localStorage.
import "@/lib/storageGuard";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Suppress unhandled promise rejections caused by Supabase Auth's internal
// storage access when cookies/localStorage are blocked (incognito + "site data
// not allowed"). These are benign — the app simply runs with no session.
window.addEventListener("unhandledrejection", (event) => {
  const msg: string = (event.reason as Error)?.message ?? "";
  if (
    msg.includes("The request was denied") ||
    msg.includes("SecurityError") ||
    msg.includes("Access is denied for this document") ||
    msg.includes("localStorage")
  ) {
    event.preventDefault(); // prevents console error
  }
});

createRoot(document.getElementById("root")!).render(<App />);

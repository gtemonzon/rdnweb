// storageGuard MUST be the very first import so the fallback is in place
// before the Supabase client (or any other module) tries to read localStorage.
import "@/lib/storageGuard";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { Suspense, lazy } from "react";

// Eager load the main page for best LCP
import Index from "./pages/Index";

// Lazy load all other pages for code splitting
const QuienesSomos = lazy(() => import("./pages/QuienesSomos"));
const Programas = lazy(() => import("./pages/Programas"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const Transparencia = lazy(() => import("./pages/Transparencia"));
const Contacto = lazy(() => import("./pages/Contacto"));
const Donar = lazy(() => import("./pages/Donar"));
const Auth = lazy(() => import("./pages/Auth"));
const Admin = lazy(() => import("./pages/Admin"));
const AdminPostEditor = lazy(() => import("./pages/AdminPostEditor"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const AdminContenido = lazy(() => import("./pages/AdminContenido"));
const AdminAliados = lazy(() => import("./pages/AdminAliados"));
const AdminRecibos = lazy(() => import("./pages/AdminRecibos"));
const AdminDonaciones = lazy(() => import("./pages/AdminDonaciones"));
const AdminTransparencia = lazy(() => import("./pages/AdminTransparencia"));
const Vacantes = lazy(() => import("./pages/Vacantes"));
const AdminVacantes = lazy(() => import("./pages/AdminVacantes"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/quienes-somos" element={<QuienesSomos />} />
              <Route path="/programas" element={<Programas />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="/transparencia" element={<Transparencia />} />
              <Route path="/vacantes" element={<Vacantes />} />
              <Route path="/contacto" element={<Contacto />} />
              <Route path="/donar" element={<Donar />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/admin/nuevo" element={<AdminPostEditor />} />
              <Route path="/admin/editar/:id" element={<AdminPostEditor />} />
              <Route path="/admin/usuarios" element={<AdminUsers />} />
              <Route path="/admin/contenido" element={<AdminContenido />} />
              <Route path="/admin/aliados" element={<AdminAliados />} />
              <Route path="/admin/recibos" element={<AdminRecibos />} />
              <Route path="/admin/donaciones" element={<AdminDonaciones />} />
              <Route path="/admin/transparencia" element={<AdminTransparencia />} />
              <Route path="/admin/vacantes" element={<AdminVacantes />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

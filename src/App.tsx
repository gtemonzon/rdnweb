import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import QuienesSomos from "./pages/QuienesSomos";
import Programas from "./pages/Programas";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Transparencia from "./pages/Transparencia";
import Contacto from "./pages/Contacto";
import Donar from "./pages/Donar";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import AdminPostEditor from "./pages/AdminPostEditor";
import AdminUsers from "./pages/AdminUsers";
import AdminContenido from "./pages/AdminContenido";
import AdminAliados from "./pages/AdminAliados";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/quienes-somos" element={<QuienesSomos />} />
            <Route path="/programas" element={<Programas />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/transparencia" element={<Transparencia />} />
            <Route path="/contacto" element={<Contacto />} />
            <Route path="/donar" element={<Donar />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/nuevo" element={<AdminPostEditor />} />
            <Route path="/admin/editar/:id" element={<AdminPostEditor />} />
            <Route path="/admin/usuarios" element={<AdminUsers />} />
            <Route path="/admin/contenido" element={<AdminContenido />} />
            <Route path="/admin/aliados" element={<AdminAliados />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

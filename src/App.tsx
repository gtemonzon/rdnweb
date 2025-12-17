import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import QuienesSomos from "./pages/QuienesSomos";
import Programas from "./pages/Programas";
import Blog from "./pages/Blog";
import Transparencia from "./pages/Transparencia";
import Contacto from "./pages/Contacto";
import Donar from "./pages/Donar";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/quienes-somos" element={<QuienesSomos />} />
          <Route path="/programas" element={<Programas />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/transparencia" element={<Transparencia />} />
          <Route path="/contacto" element={<Contacto />} />
          <Route path="/donar" element={<Donar />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

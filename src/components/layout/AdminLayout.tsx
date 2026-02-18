import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";
import {
  FileText,
  Scale,
  PenSquare,
  Handshake,
  Briefcase,
  Heart,
  Receipt,
  Users,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  adminOnly?: boolean;
}

const navGroups: NavGroup[] = [
  {
    label: "Contenido",
    items: [
      { name: "Blog", href: "/admin", icon: PenSquare },
      { name: "Contenido del Sitio", href: "/admin/contenido", icon: FileText, adminOnly: true },
      { name: "Transparencia", href: "/admin/transparencia", icon: Scale, adminOnly: true },
    ],
  },
  {
    label: "Operaciones",
    items: [
      { name: "Donaciones", href: "/admin/donaciones", icon: Heart, adminOnly: true },
      { name: "Recibos FEL", href: "/admin/recibos", icon: Receipt, adminOnly: true },
    ],
  },
  {
    label: "Organización",
    items: [
      { name: "Aliados", href: "/admin/aliados", icon: Handshake, adminOnly: true },
      { name: "Vacantes", href: "/admin/vacantes", icon: Briefcase, adminOnly: true },
    ],
  },
  {
    label: "Sistema",
    items: [
      { name: "Usuarios", href: "/admin/usuarios", icon: Users, adminOnly: true },
    ],
  },
];

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { user, userRole, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) return null;

  if (userRole !== "admin" && userRole !== "editor") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Sin permisos</h1>
          <p className="text-muted-foreground mb-6">No tienes permisos para acceder al panel de administración.</p>
          <Button onClick={handleSignOut} variant="outline">
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar Sesión
          </Button>
        </div>
      </div>
    );
  }

  const isActive = (href: string) => {
    if (href === "/admin") return location.pathname === "/admin" || location.pathname === "/admin/nuevo" || location.pathname.startsWith("/admin/editar");
    return location.pathname.startsWith(href);
  };

  const filteredGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.adminOnly || userRole === "admin"),
    }))
    .filter((group) => group.items.length > 0);

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="El Refugio de la Niñez" className={cn("h-10 w-auto", collapsed && !isMobile && "h-8")} />
        </Link>
        {isMobile && (
          <button onClick={() => setSidebarOpen(false)} className="p-1 text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {filteredGroups.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {group.label}
              </p>
            )}
            <ul className="space-y-1">
              {group.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      to={item.href}
                      onClick={() => isMobile && setSidebarOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                        active
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                      title={collapsed && !isMobile ? item.name : undefined}
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      {(!collapsed || isMobile) && <span>{item.name}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="border-t border-border p-3 space-y-1">
        <Link
          to="/donar"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium bg-accent text-accent-foreground hover:bg-accent/90 transition-colors"
        >
          <Heart className="w-4 h-4 shrink-0" />
          {(!collapsed || isMobile) && <span>Ver Página Donar</span>}
        </Link>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {(!collapsed || isMobile) && <span>Cerrar Sesión</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-muted/30">
      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "bg-card border-r border-border flex-shrink-0 z-50 transition-all duration-300",
          isMobile
            ? cn("fixed inset-y-0 left-0 w-72", sidebarOpen ? "translate-x-0" : "-translate-x-full")
            : cn(collapsed ? "w-16" : "w-64", "sticky top-0 h-screen")
        )}
      >
        {sidebarContent}
        {/* Collapse toggle (desktop only) */}
        {!isMobile && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="absolute -right-3 top-20 bg-card border border-border rounded-full p-1 shadow-sm hover:bg-muted transition-colors"
          >
            {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        )}
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar (mobile hamburger) */}
        {isMobile && (
          <header className="sticky top-0 z-30 bg-card border-b border-border px-4 py-3 flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="p-1 text-foreground">
              <Menu className="w-5 h-5" />
            </button>
            <img src={logo} alt="El Refugio de la Niñez" className="h-8 w-auto" />
          </header>
        )}

        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

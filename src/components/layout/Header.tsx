import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";

const navLinks = [
  { name: "Inicio", href: "/" },
  { name: "Quiénes Somos", href: "/quienes-somos" },
  { name: "Programas", href: "/programas" },
  { name: "Blog", href: "/blog" },
  { name: "Transparencia", href: "/transparencia" },
  { name: "Contacto", href: "/contacto" },
  { name: "Vacantes", href: "/vacantes" },
];

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 border-b border-border">
      <div className="container flex h-20 items-center justify-between">
        <Link to="/" className="flex items-center">
          <img 
            src={logo} 
            alt="El Refugio de la Niñez" 
            className="h-14 w-auto"
            width={190}
            height={56}
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={`text-sm font-medium transition-colors hover:text-accent ${
                location.pathname === link.href
                  ? "text-accent"
                  : "text-primary"
              }`}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <Button asChild className="hidden sm:flex bg-accent hover:bg-accent/90">
            <Link to="/donar">
              <Heart className="w-4 h-4 mr-2" />
              Donar
            </Link>
          </Button>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 text-primary"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="lg:hidden border-t border-border bg-card">
          <nav className="container py-4 flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === link.href
                    ? "bg-primary/10 text-accent"
                    : "text-primary hover:bg-muted"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            <Button asChild className="mt-2 bg-accent hover:bg-accent/90">
              <Link to="/donar" onClick={() => setIsMenuOpen(false)}>
                <Heart className="w-4 h-4 mr-2" />
                Donar Ahora
              </Link>
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;

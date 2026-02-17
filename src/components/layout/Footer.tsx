import { Link } from "react-router-dom";
import { Heart, Mail, Phone, MapPin, Facebook, Instagram, Twitter, Youtube } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ContactInfo {
  address: string;
  phone: string;
  email: string;
  facebook: string;
  instagram: string;
  twitter: string;
  youtube: string;
}

const defaultContact: ContactInfo = {
  address: "Ciudad de Guatemala, Guatemala",
  phone: "+502 2200-0000",
  email: "info@refugiodelaninez.org",
  facebook: "https://facebook.com/RefugiodelaninezGT",
  instagram: "https://instagram.com",
  twitter: "https://twitter.com",
  youtube: "https://youtube.com",
};

const Footer = () => {
  const { data: contactData } = useQuery({
    queryKey: ["site-content", "contact_info"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_content")
        .select("content")
        .eq("section_key", "contact_info")
        .maybeSingle();
      if (error) throw error;
      return data?.content as unknown as ContactInfo | null;
    },
  });

  const contact = contactData || defaultContact;

  return (
    <footer className="bg-earth-brown text-cream">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                <Heart className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-heading font-bold text-lg">
                Refugio de la Niñez
              </span>
            </div>
            <p className="text-cream/80 text-sm leading-relaxed">
              Organización guatemalteca comprometida con la protección y restitución 
              de los derechos de niños, niñas y adolescentes víctimas de violencia.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-heading font-semibold text-lg mb-4">Enlaces Rápidos</h3>
            <ul className="space-y-2">
              {[
                { name: "Quiénes Somos", href: "/quienes-somos" },
                { name: "Programas", href: "/programas" },
                { name: "Transparencia", href: "/transparencia" },
                { name: "Blog", href: "/blog" },
                { name: "Preguntas Frecuentes", href: "/preguntas-frecuentes" },
                { name: "Contacto", href: "/contacto" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-cream/80 hover:text-primary transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-heading font-semibold text-lg mb-4">Contacto</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm text-cream/80">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
                <span>{contact.address}</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-cream/80">
                <Phone className="w-4 h-4 flex-shrink-0 text-primary" />
                <span>{contact.phone}</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-cream/80">
                <Mail className="w-4 h-4 flex-shrink-0 text-primary" />
                <span>{contact.email}</span>
              </li>
            </ul>
          </div>

          {/* Social & Donate */}
          <div>
            <h3 className="font-heading font-semibold text-lg mb-4">Síguenos</h3>
            <div className="flex gap-3 mb-6">
              {contact.facebook && (
                <a
                  href={contact.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-cream/10 flex items-center justify-center hover:bg-primary transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook className="w-5 h-5" />
                </a>
              )}
              {contact.instagram && (
                <a
                  href={contact.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-cream/10 flex items-center justify-center hover:bg-primary transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="w-5 h-5" />
                </a>
              )}
              {contact.twitter && (
                <a
                  href={contact.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-cream/10 flex items-center justify-center hover:bg-primary transition-colors"
                  aria-label="Twitter"
                >
                  <Twitter className="w-5 h-5" />
                </a>
              )}
              {contact.youtube && (
                <a
                  href={contact.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-cream/10 flex items-center justify-center hover:bg-primary transition-colors"
                  aria-label="YouTube"
                >
                  <Youtube className="w-5 h-5" />
                </a>
              )}
            </div>
            <Link
              to="/donar"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              <Heart className="w-4 h-4" />
              Donar Ahora
            </Link>
          </div>
        </div>

        <div className="border-t border-cream/20 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-cream/60 text-sm">
            © {new Date().getFullYear()} Refugio de la Niñez. Todos los derechos reservados.
          </p>
          <div className="flex gap-6 text-sm text-cream/60">
            <Link to="/privacidad" className="hover:text-cream transition-colors">
              Política de Privacidad
            </Link>
            <Link to="/terminos" className="hover:text-cream transition-colors">
              Términos de Uso
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
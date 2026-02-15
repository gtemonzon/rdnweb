import { useSearchParams, Link } from "react-router-dom";
import { Heart, Home, Facebook, Instagram, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Layout from "@/components/layout/Layout";

const GraciasDonacion = () => {
  const [searchParams] = useSearchParams();
  const name = searchParams.get("name") || "Donante";
  const amount = searchParams.get("amount") || "";
  const currency = searchParams.get("currency") || "GTQ";
  const reference = searchParams.get("reference") || "";
  const date = searchParams.get("date") || new Date().toLocaleDateString("es-GT");

  const currencySymbol = currency === "USD" ? "US$" : "Q";

  return (
    <Layout>
      <section className="py-16 md:py-24 gradient-hope min-h-[70vh] flex items-center">
        <div className="container max-w-2xl mx-auto">
          <Card className="border-0 shadow-xl bg-card">
            <CardContent className="p-8 md:p-12 text-center space-y-8">
              {/* Icon */}
              <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <Heart className="w-10 h-10 text-primary fill-primary" />
              </div>

              {/* Heading */}
              <div className="space-y-3">
                <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground">
                  ¡Gracias, {name}!
                </h1>
                <p className="text-muted-foreground text-lg">
                  Tu generosidad transforma la vida de niños, niñas y adolescentes.
                </p>
              </div>

              {/* Summary */}
              {amount && (
                <div className="rounded-xl bg-muted p-6 space-y-2">
                  <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">
                    Resumen de tu donación
                  </p>
                  <p className="text-4xl font-heading font-bold text-primary">
                    {currencySymbol}{amount}
                  </p>
                  <p className="text-sm text-muted-foreground">Fecha: {date}</p>
                  {reference && (
                    <p className="text-xs text-muted-foreground">
                      Referencia: {reference}
                    </p>
                  )}
                </div>
              )}

              {/* Message */}
              <p className="text-muted-foreground text-sm leading-relaxed max-w-md mx-auto">
                Recibirás un correo de confirmación con los detalles de tu donación.
                Tu recibo deducible de impuestos será enviado a tu correo electrónico.
              </p>

              {/* Social */}
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                  Síguenos en redes sociales
                </p>
                <div className="flex justify-center gap-3">
                  <Button variant="outline" size="icon" asChild>
                    <a
                      href="https://www.facebook.com/ElRefugioDeLaNinez"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Facebook"
                    >
                      <Facebook className="w-4 h-4" />
                    </a>
                  </Button>
                  <Button variant="outline" size="icon" asChild>
                    <a
                      href="https://www.instagram.com/refugiodelaninez/"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Instagram"
                    >
                      <Instagram className="w-4 h-4" />
                    </a>
                  </Button>
                  <Button variant="outline" size="icon" asChild>
                    <a
                      href="https://refugiodelaninez.org"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Sitio web"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                </div>
              </div>

              {/* CTA */}
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link to="/">
                  <Home className="w-4 h-4 mr-2" />
                  Volver al inicio
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </Layout>
  );
};

export default GraciasDonacion;

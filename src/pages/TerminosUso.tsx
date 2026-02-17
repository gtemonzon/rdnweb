import Layout from "@/components/layout/Layout";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface LegalSection {
  title: string;
  content: string;
}

interface LegalContent {
  sections: LegalSection[];
  last_updated: string;
}

const defaultSections: LegalSection[] = [
  { title: "Aceptación de los Términos", content: "Al acceder y utilizar el sitio web de la Asociación El Refugio de la Niñez, usted acepta estar sujeto a los presentes Términos y Condiciones de Uso." },
  { title: "Descripción del Servicio", content: "Este sitio informa sobre actividades y programas de protección de niños, niñas y adolescentes en Guatemala. Facilita donaciones en línea, acceso a información de transparencia, comunicación vía formularios, publicación de vacantes y difusión de noticias." },
  { title: "Donaciones", content: "Las donaciones son voluntarias y de carácter de liberalidad. Los fondos se destinan a programas de protección de la niñez. Los pagos se procesan mediante pasarelas certificadas. La Organización emitirá comprobantes fiscales cuando se solicite. Las donaciones son irrevocables, salvo cargos duplicados o errores (contactar a donaciones@refugiodelaninez.org dentro de 30 días)." },
  { title: "Propiedad Intelectual", content: "Todo el contenido del sitio está protegido por leyes de propiedad intelectual de Guatemala. Se permite reproducción parcial con fines informativos citando la fuente. Queda prohibida la reproducción comercial sin autorización." },
  { title: "Uso Aceptable", content: "No utilizar el sitio para fines ilícitos, no intentar acceso no autorizado, no introducir código malicioso, proporcionar información veraz y no suplantar identidades." },
  { title: "Protección de la Imagen de Menores", content: "Las imágenes de menores se usan con autorización y conforme a protocolos institucionales. Queda prohibida su descarga o uso fuera del contexto informativo." },
  { title: "Enlaces a Terceros", content: "La Organización no se responsabiliza por el contenido o políticas de sitios externos enlazados." },
  { title: "Disponibilidad del Servicio", content: "No se garantiza funcionamiento ininterrumpido. Podrán realizarse mantenimientos sin generar responsabilidad." },
  { title: "Limitación de Responsabilidad", content: "La Organización no será responsable por daños derivados del uso del sitio, salvo dolo o negligencia grave." },
  { title: "Legislación Aplicable y Jurisdicción", content: "Estos términos se rigen por las leyes de Guatemala. Las controversias se someten a los tribunales de la Ciudad de Guatemala." },
  { title: "Modificaciones", content: "La Organización puede modificar estos términos en cualquier momento. Las modificaciones entran en vigor desde su publicación." },
  { title: "Contacto", content: "Para consultas: info@refugiodelaninez.org" },
];

const TerminosUso = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["site-content", "terms_of_use"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_content")
        .select("content")
        .eq("section_key", "terms_of_use")
        .maybeSingle();
      if (error) throw error;
      return data?.content as unknown as LegalContent | null;
    },
  });

  const sections = data?.sections?.length ? data.sections : defaultSections;
  const lastUpdated = data?.last_updated || "febrero 2026";

  return (
    <Layout>
      <div className="bg-muted/30 py-12">
        <div className="container max-w-4xl">
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-2">
            Términos y Condiciones de Uso
          </h1>
          <p className="text-muted-foreground">
            Última actualización: {lastUpdated}
          </p>
        </div>
      </div>

      <div className="container max-w-4xl py-12">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-10">
            {sections.map((section, index) => (
              <section key={index} className="space-y-4">
                <h2 className="font-heading text-2xl font-semibold text-foreground">
                  {index + 1}. {section.title}
                </h2>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {section.content}
                </p>
              </section>
            ))}
            <p className="text-muted-foreground text-sm pt-6 border-t">
              ¿Tiene preguntas? Visite nuestra página de{" "}
              <Link to="/contacto" className="text-primary hover:underline">contacto</Link>.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TerminosUso;

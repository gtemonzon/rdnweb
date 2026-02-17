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
  { title: "Identidad del Responsable", content: "Asociación El Refugio de la Niñez, con domicilio en la Ciudad de Guatemala, República de Guatemala, es la entidad responsable del tratamiento de los datos personales recabados a través de este sitio web y sus servicios asociados." },
  { title: "Datos que Recopilamos", content: "Recopilamos datos de donantes (nombre, correo, teléfono, NIT, dirección), datos de contacto (nombre, correo, mensaje), datos de navegación (IP, navegador, páginas visitadas) y datos de postulantes a vacantes laborales." },
  { title: "Finalidad del Tratamiento", content: "Los datos se utilizan para procesar donaciones, emitir recibos y facturas electrónicas (FEL), responder consultas, gestionar reclutamiento, enviar comunicaciones institucionales (con consentimiento) y mejorar la experiencia del sitio." },
  { title: "Base Legal", content: "El tratamiento se fundamenta en el consentimiento del titular, el cumplimiento de obligaciones legales y el interés legítimo de la Organización, conforme al marco jurídico guatemalteco y buenas prácticas internacionales." },
  { title: "Procesamiento de Pagos", content: "Las donaciones se procesan a través de pasarelas certificadas PCI-DSS. La Organización no almacena datos de tarjetas de crédito o débito." },
  { title: "Compartición de Datos", content: "Los datos no se venden ni ceden a terceros con fines comerciales. Podrán compartirse con proveedores tecnológicos, autoridades fiscales guatemaltecas y autoridades judiciales cuando exista orden legal." },
  { title: "Seguridad de la Información", content: "Implementamos cifrado en tránsito (HTTPS/TLS), control de acceso basado en roles y respaldos periódicos." },
  { title: "Derechos del Titular", content: "Usted tiene derecho a acceder, rectificar, cancelar u oponerse al tratamiento de sus datos (derechos ARCO). Contacte a info@refugiodelaninez.org. Plazo máximo de respuesta: 30 días hábiles." },
  { title: "Cookies", content: "Este sitio utiliza cookies técnicas necesarias. No utilizamos cookies de seguimiento publicitario de terceros." },
  { title: "Protección de Datos de Menores", content: "No recopilamos datos de menores a través de este sitio. La información de niños atendidos se maneja bajo protocolos de la Ley PINA y estándares internacionales." },
  { title: "Modificaciones", content: "La Organización se reserva el derecho de actualizar esta política. Las modificaciones serán publicadas con la fecha de última actualización." },
  { title: "Contacto", content: "Para consultas: info@refugiodelaninez.org" },
];

const PoliticaPrivacidad = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["site-content", "privacy_policy"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_content")
        .select("content")
        .eq("section_key", "privacy_policy")
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
            Política de Privacidad
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

export default PoliticaPrivacidad;

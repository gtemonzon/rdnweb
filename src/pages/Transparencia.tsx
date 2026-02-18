import { useEffect, useState } from "react";
import { FileText, Download, Calendar, ExternalLink, ChevronDown, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface Numeral {
  id: number;
  title: string;
  description: string | null;
  is_active: boolean;
  display_order: number;
}

interface TransparencyDocument {
  id: string;
  numeral_id: number;
  year: number;
  title: string;
  description: string | null;
  file_url: string;
  file_type: string;
  is_active: boolean;
  created_at: string;
}

interface RegistroCertificacion {
  label: string;
  url: string;
  pdf_url: string;
  link_type: "url" | "pdf";
  is_active: boolean;
}

// Fallback defaults shown if DB has no data yet
const DEFAULT_REGISTROS: RegistroCertificacion[] = [
  { label: "Registro de ONG", url: "", pdf_url: "", link_type: "url", is_active: true },
  { label: "Certificación SAT", url: "", pdf_url: "", link_type: "url", is_active: true },
  { label: "Código de Ética", url: "", pdf_url: "", link_type: "url", is_active: true },
  { label: "Política Anticorrupción", url: "", pdf_url: "", link_type: "url", is_active: true },
];

const Transparencia = () => {
  const [numerals, setNumerals] = useState<Numeral[]>([]);
  const [documents, setDocuments] = useState<TransparencyDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [registros, setRegistros] = useState<RegistroCertificacion[]>(DEFAULT_REGISTROS);

  const getProxyUrl = (fileUrl: string) => {
    const base = import.meta.env.VITE_SUPABASE_URL;
    if (!base) return fileUrl;
    return `${base}/functions/v1/file-proxy?url=${encodeURIComponent(fileUrl)}`;
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    // Fetch registros y certificaciones from site_content
    const { data: registrosData } = await supabase
      .from("site_content")
      .select("content")
      .eq("section_key", "registros_certificaciones")
      .maybeSingle();

    if (registrosData?.content && Array.isArray(registrosData.content)) {
      setRegistros(registrosData.content as unknown as RegistroCertificacion[]);
    }

    // Fetch active numerals
    const { data: numeralsData } = await supabase
      .from("transparency_numerals")
      .select("*")
      .eq("is_active", true)
      .order("display_order");

    // Fetch active documents
    const { data: docsData } = await supabase
      .from("transparency_documents")
      .select("*")
      .eq("is_active", true)
      .order("year", { ascending: false })
      .order("display_order");

    setNumerals(numeralsData || []);
    setDocuments(docsData || []);
    setLoading(false);
  };

  // Get unique years from documents
  const years = [...new Set(documents.map((d) => d.year))].sort((a, b) => b - a);

  // Filter documents by year
  const filteredDocuments = selectedYear === "all"
    ? documents
    : documents.filter((d) => d.year.toString() === selectedYear);

  // Group documents by numeral, then by year
  const groupedByNumeral = numerals.reduce((acc, numeral) => {
    const numeralDocs = filteredDocuments.filter((d) => d.numeral_id === numeral.id);
    if (numeralDocs.length > 0) {
      const byYear = numeralDocs.reduce((yearAcc, doc) => {
        if (!yearAcc[doc.year]) yearAcc[doc.year] = [];
        yearAcc[doc.year].push(doc);
        return yearAcc;
      }, {} as Record<number, TransparencyDocument[]>);
      acc[numeral.id] = { numeral, byYear };
    }
    return acc;
  }, {} as Record<number, { numeral: Numeral; byYear: Record<number, TransparencyDocument[]> }>);

  const hasDocuments = Object.keys(groupedByNumeral).length > 0;

  // Only show active registros
  const activeRegistros = registros.filter((r) => r.is_active);

  return (
    <Layout>
      {/* Hero */}
      <section className="py-20 gradient-hope">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="font-heading text-4xl md:text-5xl font-bold text-foreground mb-6">
              Transparencia
            </h1>
            <p className="text-lg text-muted-foreground">
              Información Pública de Oficio conforme a la Ley de Acceso a la Información Pública (LAIP),
              Decreto 57-2008, Artículo 10.
            </p>
          </div>
        </div>
      </section>

      {/* Commitment */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-heading text-2xl md:text-3xl font-bold mb-4">
              Nuestro Compromiso con la Transparencia
            </h2>
            <p className="text-primary-foreground/90">
              Como organización sin fines de lucro, mantenemos los más altos
              estándares de transparencia y rendición de cuentas. Toda la información
              aquí publicada cumple con las obligaciones establecidas en la LAIP.
            </p>
          </div>
        </div>
      </section>

      {/* Year Filter */}
      {years.length > 0 && (
        <section className="py-8 bg-card border-b border-border">
          <div className="container">
            <div className="flex flex-wrap gap-2 justify-center">
              <Button
                variant={selectedYear === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedYear("all")}
              >
                Todos los años
              </Button>
              {years.map((year) => (
                <Button
                  key={year}
                  variant={selectedYear === year.toString() ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedYear(year.toString())}
                >
                  {year}
                </Button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Documents by Numeral */}
      <section className="py-16 bg-muted">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-heading text-2xl font-bold text-foreground mb-8 text-center">
              Artículo 10 - Información Pública de Oficio
            </h2>

            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Cargando información...</p>
              </div>
            ) : !hasDocuments ? (
              <div className="text-center py-12 bg-card rounded-xl">
                <FolderOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Próximamente se publicará la información de transparencia.
                </p>
              </div>
            ) : (
              <Accordion type="multiple" className="space-y-3">
                {Object.entries(groupedByNumeral)
                  .sort(([a], [b]) => parseInt(a) - parseInt(b))
                  .map(([numeralId, { numeral, byYear }]) => (
                    <AccordionItem
                      key={numeralId}
                      value={numeralId}
                      className="bg-card rounded-xl border-none shadow-sm overflow-hidden"
                    >
                      <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-4 text-left">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="font-bold text-primary">{numeral.id}</span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">{numeral.title}</h3>
                            {numeral.description && (
                              <p className="text-sm text-muted-foreground mt-0.5">
                                {numeral.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-6 pb-6">
                        <div className="space-y-6 pt-2">
                          {Object.entries(byYear)
                            .sort(([a], [b]) => parseInt(b) - parseInt(a))
                            .map(([year, docs]) => (
                              <div key={year}>
                                <div className="flex items-center gap-2 mb-3">
                                  <Calendar className="w-4 h-4 text-muted-foreground" />
                                  <span className="font-medium text-foreground">{year}</span>
                                </div>
                                <div className="space-y-2 pl-6">
                                  {docs.map((doc) => (
                                    <a
                                      key={doc.id}
                                      href={getProxyUrl(doc.file_url)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group cursor-pointer"
                                    >
                                      <div className="flex items-center gap-3 min-w-0">
                                        <FileText className="w-5 h-5 text-primary shrink-0" />
                                        <div className="min-w-0">
                                          <p className="font-medium text-foreground truncate">
                                            {doc.title}
                                          </p>
                                          {doc.description && (
                                            <p className="text-sm text-muted-foreground truncate">
                                              {doc.description}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                      <span className="shrink-0 flex items-center text-sm text-muted-foreground group-hover:text-primary transition-colors">
                                        <Download className="w-4 h-4 mr-1" />
                                        <span className="hidden sm:inline">Abrir</span>
                                      </span>
                                    </a>
                                  ))}
                                </div>
                              </div>
                            ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
              </Accordion>
            )}

            {/* Numerals without documents (informational) */}
            {!loading && hasDocuments && (
              <div className="mt-8">
                <details className="group">
                  <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground flex items-center gap-2">
                    <ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform" />
                    Ver todos los numerales del Artículo 10
                  </summary>
                  <div className="mt-4 grid gap-2">
                    {numerals.map((n) => {
                      const hasDocs = groupedByNumeral[n.id];
                      return (
                        <div
                          key={n.id}
                          className={`p-3 rounded-lg text-sm ${
                            hasDocs
                              ? "bg-primary/5 text-foreground"
                              : "bg-muted/30 text-muted-foreground"
                          }`}
                        >
                          <span className="font-medium">{n.id}.</span> {n.title}
                          {hasDocs && (
                            <span className="ml-2 text-xs text-primary">✓</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </details>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Registros y Certificaciones — dynamic from DB */}
      {activeRegistros.length > 0 && (
        <section className="py-16 bg-card">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="font-heading text-2xl font-bold text-foreground mb-8">
                Registros y Certificaciones
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {activeRegistros.map((registro, idx) => {
                  const href = registro.link_type === "pdf" ? registro.pdf_url : registro.url;
                  if (href) {
                    return (
                      <a
                        key={idx}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted transition-colors"
                      >
                        <span className="font-medium text-left">{registro.label}</span>
                        {registro.link_type === "pdf" ? (
                          <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                        ) : (
                          <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />
                        )}
                      </a>
                    );
                  }
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30 opacity-60 cursor-not-allowed"
                      title="Enlace próximamente disponible"
                    >
                      <span className="font-medium text-left text-muted-foreground">{registro.label}</span>
                      <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Contact for Information Requests */}
      <section className="py-16 bg-muted">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-heading text-2xl font-bold text-foreground mb-4">
              Solicitud de Información
            </h2>
            <p className="text-muted-foreground mb-6">
              Si necesitas información adicional que no se encuentra publicada,
              puedes realizar una solicitud formal conforme al Artículo 38 de la LAIP.
            </p>
            <Button asChild>
              <a href="/contacto">Contactar</a>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Transparencia;

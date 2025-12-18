import { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, MapPin, Calendar, Clock, FileText, ExternalLink, AlertCircle } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";

interface JobVacancy {
  id: string;
  title: string;
  description: string | null;
  temporality: string;
  contract_type: string;
  location: string;
  application_url: string | null;
  pdf_url: string | null;
  application_deadline: string;
  published_at: string;
  is_active: boolean;
}

const Vacantes = () => {
  const [vacancies, setVacancies] = useState<JobVacancy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVacancies();
  }, []);

  const fetchVacancies = async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from("job_vacancies")
      .select("*")
      .eq("is_active", true)
      .gte("application_deadline", new Date().toISOString())
      .order("application_deadline", { ascending: true });

    if (error) {
      console.error("Error fetching vacancies:", error);
    } else {
      setVacancies(data || []);
    }
    
    setLoading(false);
  };

  const getDaysRemaining = (deadline: string) => {
    const days = differenceInDays(new Date(deadline), new Date());
    return days;
  };

  const getDeadlineBadge = (deadline: string) => {
    const days = getDaysRemaining(deadline);
    
    if (days <= 0) {
      return <Badge variant="destructive">Vencida</Badge>;
    } else if (days <= 3) {
      return <Badge variant="destructive">¡Último día{days > 1 ? `s (${days})` : ""}!</Badge>;
    } else if (days <= 7) {
      return <Badge className="bg-amber-500 hover:bg-amber-600">Próxima a vencer ({days} días)</Badge>;
    }
    return null;
  };

  const getContractTypeBadge = (type: string) => {
    switch (type) {
      case "Planilla":
        return <Badge className="bg-green-600 hover:bg-green-700">{type}</Badge>;
      case "Servicios técnicos/Profesionales":
        return <Badge variant="secondary">{type}</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getTemporalityBadge = (temporality: string) => {
    switch (temporality) {
      case "Permanente":
        return <Badge className="bg-blue-600 hover:bg-blue-700">{temporality}</Badge>;
      case "Temporal":
        return <Badge variant="outline">{temporality}</Badge>;
      case "Por proyecto":
        return <Badge variant="secondary">{temporality}</Badge>;
      default:
        return <Badge variant="outline">{temporality}</Badge>;
    }
  };

  // Ensure external URLs have proper protocol
  const ensureExternalUrl = (url: string | null): string | null => {
    if (!url) return null;
    // If it already has a protocol, return as-is
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    // Add https:// if missing
    return `https://${url}`;
  };

  // Proxy PDFs through edge function to avoid browser extensions blocking the storage domain
  const getPdfProxyUrl = (url: string | null): string | null => {
    if (!url) return null;
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    return `${supabaseUrl}/functions/v1/file-proxy?url=${encodeURIComponent(url)}`;
  };

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-4 bg-accent/10 text-accent border-accent/20">
              Trabaja con Nosotros
            </Badge>
            <h1 className="font-heading text-4xl md:text-5xl font-bold text-foreground mb-6">
              Oportunidades Laborales
            </h1>
            <p className="text-lg text-muted-foreground">
              Únete a nuestro equipo y forma parte del cambio. Buscamos personas comprometidas 
              con la protección de la niñez y adolescencia en Guatemala.
            </p>
          </div>
        </div>
      </section>

      {/* Vacancies List */}
      <section className="py-16">
        <div className="container">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
            </div>
          ) : vacancies.length === 0 ? (
            <div className="text-center py-20">
              <Briefcase className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="font-heading text-2xl font-bold text-foreground mb-2">
                No hay vacantes disponibles
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Por el momento no tenemos plazas abiertas. Te invitamos a revisar esta página 
                periódicamente para conocer nuevas oportunidades.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-8">
                <p className="text-muted-foreground">
                  {vacancies.length} vacante{vacancies.length !== 1 ? "s" : ""} disponible{vacancies.length !== 1 ? "s" : ""}
                </p>
              </div>

              <div className="grid gap-6">
                {vacancies.map((vacancy) => (
                  <Card key={vacancy.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-4">
                      <div className="flex flex-wrap gap-2 mb-2">
                        {getDeadlineBadge(vacancy.application_deadline)}
                        {getContractTypeBadge(vacancy.contract_type)}
                        {getTemporalityBadge(vacancy.temporality)}
                      </div>
                      <CardTitle className="text-xl md:text-2xl">{vacancy.title}</CardTitle>
                      <CardDescription className="flex flex-wrap items-center gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {vacancy.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Publicada: {format(new Date(vacancy.published_at), "d MMM yyyy", { locale: es })}
                        </span>
                        <span className="flex items-center gap-1 text-accent font-medium">
                          <Clock className="w-4 h-4" />
                          Fecha límite: {format(new Date(vacancy.application_deadline), "d MMM yyyy", { locale: es })}
                        </span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {vacancy.description && (
                        <p className="text-muted-foreground mb-6 line-clamp-3">
                          {vacancy.description}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap gap-3">
                        {vacancy.pdf_url && getPdfProxyUrl(vacancy.pdf_url) && (
                          <Button variant="outline" asChild>
                            <a href={getPdfProxyUrl(vacancy.pdf_url)!} target="_blank" rel="noopener noreferrer">
                              <FileText className="w-4 h-4 mr-2" />
                              Ver detalles (PDF)
                            </a>
                          </Button>
                        )}
                        {vacancy.application_url && ensureExternalUrl(vacancy.application_url) && (
                          <Button className="bg-accent hover:bg-accent/90" asChild>
                            <a href={ensureExternalUrl(vacancy.application_url)!} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Postularme
                            </a>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Info Section */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <div className="max-w-3xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-accent" />
                  Información importante
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-4">
                <p>
                  El Refugio de la Niñez es una organización comprometida con la igualdad de oportunidades. 
                  Todos los procesos de selección se realizan de manera transparente y objetiva.
                </p>
                <p>
                  Para cualquier consulta sobre el proceso de selección, puedes escribirnos a través de 
                  nuestra página de <a href="/contacto" className="text-accent hover:underline">contacto</a>.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Vacantes;

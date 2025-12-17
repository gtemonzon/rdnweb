import { FileText, Download, Calendar, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/layout/Layout";

const years = ["2024", "2023", "2022", "2021", "2020"];

const reports = [
  {
    id: 1,
    title: "Informe Anual 2024",
    description: "Resumen de actividades, logros y estados financieros del año 2024.",
    date: "Diciembre 2024",
    type: "Informe Anual",
    year: "2024",
  },
  {
    id: 2,
    title: "Memoria de Labores - Tercer Trimestre 2024",
    description: "Detalle de actividades realizadas de julio a septiembre 2024.",
    date: "Octubre 2024",
    type: "Memoria Trimestral",
    year: "2024",
  },
  {
    id: 3,
    title: "Auditoría Financiera 2024",
    description: "Informe de auditoría externa sobre estados financieros.",
    date: "Septiembre 2024",
    type: "Auditoría",
    year: "2024",
  },
  {
    id: 4,
    title: "Informe de Impacto Social 2023",
    description: "Análisis del impacto de nuestros programas en beneficiarios.",
    date: "Marzo 2024",
    type: "Impacto",
    year: "2023",
  },
  {
    id: 5,
    title: "Informe Anual 2023",
    description: "Resumen completo de actividades y resultados del año 2023.",
    date: "Diciembre 2023",
    type: "Informe Anual",
    year: "2023",
  },
  {
    id: 6,
    title: "Estados Financieros 2023",
    description: "Balance general y estado de resultados auditados.",
    date: "Abril 2024",
    type: "Financiero",
    year: "2023",
  },
];

const Transparencia = () => {
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
              Creemos en la rendición de cuentas. Aquí encontrarás nuestros 
              informes, auditorías y documentos de transparencia institucional.
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
              estándares de transparencia y rendición de cuentas. Todos nuestros 
              fondos se utilizan de manera responsable para cumplir nuestra misión.
            </p>
          </div>
        </div>
      </section>

      {/* Year Filter */}
      <section className="py-8 bg-card border-b border-border">
        <div className="container">
          <div className="flex flex-wrap gap-2 justify-center">
            <Button variant="default" size="sm">
              Todos
            </Button>
            {years.map((year) => (
              <Button key={year} variant="outline" size="sm">
                {year}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Reports Grid */}
      <section className="py-16 bg-muted">
        <div className="container">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report) => (
              <div
                key={report.id}
                className="bg-card rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-muted text-muted-foreground">
                    {report.type}
                  </span>
                </div>
                <h3 className="font-heading font-semibold text-lg text-foreground mb-2">
                  {report.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {report.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {report.date}
                  </span>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-1" />
                    Descargar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* External Links */}
      <section className="py-16 bg-card">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-heading text-2xl font-bold text-foreground mb-8">
              Registros y Certificaciones
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <a
                href="#"
                className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted transition-colors"
              >
                <span className="font-medium">Registro de ONG</span>
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              </a>
              <a
                href="#"
                className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted transition-colors"
              >
                <span className="font-medium">Certificación SAT</span>
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              </a>
              <a
                href="#"
                className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted transition-colors"
              >
                <span className="font-medium">Código de Ética</span>
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              </a>
              <a
                href="#"
                className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted transition-colors"
              >
                <span className="font-medium">Política Anticorrupción</span>
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              </a>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Transparencia;

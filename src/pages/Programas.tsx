import { Shield, Users, BookOpen, Scale, Globe, HandHeart } from "lucide-react";
import Layout from "@/components/layout/Layout";

const programs = [
  {
    icon: Shield,
    title: "Protección Especial",
    color: "bg-primary/10 text-primary",
    description: "Atención integral a niños, niñas y adolescentes víctimas de violencia, trata de personas y explotación sexual comercial.",
    services: [
      "Hogares de protección temporal",
      "Atención psicológica especializada",
      "Acompañamiento legal",
      "Reintegración familiar",
    ],
  },
  {
    icon: Users,
    title: "Programa Social",
    color: "bg-secondary/20 text-secondary",
    description: "Fortalecimiento de familias y comunidades para prevenir la violencia y promover el desarrollo integral de la niñez.",
    services: [
      "Escuela para padres",
      "Talleres comunitarios",
      "Becas educativas",
      "Apoyo socioeconómico",
    ],
  },
  {
    icon: BookOpen,
    title: "Prevención",
    color: "bg-accent/20 text-accent-foreground",
    description: "Educación y sensibilización para prevenir la violencia contra la niñez en escuelas, familias y comunidades.",
    services: [
      "Campañas de sensibilización",
      "Capacitación a docentes",
      "Material educativo",
      "Jornadas en escuelas",
    ],
  },
  {
    icon: Scale,
    title: "Incidencia Política",
    color: "bg-soft-green/20 text-soft-green",
    description: "Promoción de políticas públicas y marcos legales que garanticen la protección efectiva de la niñez.",
    services: [
      "Propuestas de ley",
      "Mesas técnicas",
      "Alianzas estratégicas",
      "Investigación social",
    ],
  },
  {
    icon: Scale,
    title: "Programa Jurídico",
    color: "bg-warm-orange/20 text-warm-orange",
    description: "Asistencia legal y representación jurídica para garantizar el acceso a la justicia de niños, niñas y adolescentes.",
    services: [
      "Representación legal",
      "Acompañamiento en procesos",
      "Asesoría jurídica",
      "Capacitación legal",
    ],
  },
  {
    icon: Globe,
    title: "Movilidad Humana",
    color: "bg-golden-yellow/20 text-foreground",
    description: "Atención especializada a niñez migrante, refugiada y desplazada, garantizando su protección y derechos.",
    services: [
      "Atención humanitaria",
      "Documentación",
      "Integración local",
      "Reunificación familiar",
    ],
  },
];

const Programas = () => {
  return (
    <Layout>
      {/* Hero */}
      <section className="py-20 gradient-hope">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="font-heading text-4xl md:text-5xl font-bold text-foreground mb-6">
              Nuestros Programas
            </h1>
            <p className="text-lg text-muted-foreground">
              Trabajamos a través de programas especializados para brindar 
              atención integral a la niñez y adolescencia guatemalteca.
            </p>
          </div>
        </div>
      </section>

      {/* Programs Grid */}
      <section className="py-20 bg-card">
        <div className="container">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {programs.map((program) => (
              <div
                key={program.title}
                className="bg-muted rounded-2xl p-8 hover:shadow-lg transition-shadow"
              >
                <div className={`w-14 h-14 rounded-xl ${program.color} flex items-center justify-center mb-6`}>
                  <program.icon className="w-7 h-7" />
                </div>
                <h2 className="font-heading text-xl font-bold text-foreground mb-3">
                  {program.title}
                </h2>
                <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                  {program.description}
                </p>
                <div>
                  <h4 className="font-semibold text-sm text-foreground mb-3">
                    Servicios:
                  </h4>
                  <ul className="space-y-2">
                    {program.services.map((service) => (
                      <li
                        key={service}
                        className="flex items-center gap-2 text-sm text-muted-foreground"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        {service}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <HandHeart className="w-16 h-16 mx-auto mb-6 opacity-80" />
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
              Impacto de Nuestros Programas
            </h2>
            <p className="text-lg text-primary-foreground/90 mb-8">
              Cada año, nuestros programas benefician a miles de niños, niñas, 
              adolescentes y familias guatemaltecas, transformando vidas y 
              construyendo un futuro más seguro para la niñez.
            </p>
            <div className="grid grid-cols-3 gap-8">
              <div>
                <div className="text-4xl font-bold">5,000+</div>
                <div className="text-sm text-primary-foreground/80">Atenciones anuales</div>
              </div>
              <div>
                <div className="text-4xl font-bold">500+</div>
                <div className="text-sm text-primary-foreground/80">Familias fortalecidas</div>
              </div>
              <div>
                <div className="text-4xl font-bold">50+</div>
                <div className="text-sm text-primary-foreground/80">Comunidades alcanzadas</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Programas;

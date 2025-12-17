import { Link } from "react-router-dom";
import { Heart, Users, Shield, BookOpen, ArrowRight, HandHeart } from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/layout/Layout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface StatItem {
  number: string;
  label: string;
}

interface Partner {
  id: string;
  name: string;
  logo_url: string | null;
  website_url: string | null;
}

const defaultStats: StatItem[] = [
  { number: "30+", label: "Años de experiencia" },
  { number: "50,000+", label: "Niños atendidos" },
  { number: "6", label: "Programas activos" },
  { number: "200+", label: "Profesionales" },
];

const programs = [
  {
    icon: Shield,
    title: "Protección Especial",
    description: "Atención integral a víctimas de violencia, trata y explotación.",
  },
  {
    icon: Users,
    title: "Programa Social",
    description: "Fortalecimiento familiar y comunitario para la prevención.",
  },
  {
    icon: BookOpen,
    title: "Prevención",
    description: "Educación y sensibilización para prevenir la violencia.",
  },
  {
    icon: HandHeart,
    title: "Incidencia",
    description: "Políticas públicas para la protección de la niñez.",
  },
];

const Index = () => {
  // Fetch stats from database
  const { data: statsData } = useQuery({
    queryKey: ["site-content", "home_stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_content")
        .select("content")
        .eq("section_key", "home_stats")
        .single();
      if (error) throw error;
      return data?.content as unknown as StatItem[] | null;
    },
  });

  // Fetch mission from database
  const { data: missionData } = useQuery({
    queryKey: ["site-content", "mission"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_content")
        .select("content")
        .eq("section_key", "mission")
        .single();
      if (error) throw error;
      return data?.content as { text: string } | null;
    },
  });

  // Fetch partners from database
  const { data: partners } = useQuery({
    queryKey: ["partners-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partners")
        .select("id, name, logo_url, website_url")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data as Partner[];
    },
  });

  const stats = statsData || defaultStats;
  const missionText = missionData?.text || "Somos una organización guatemalteca que trabaja por la protección, restitución y defensa de los derechos de niños, niñas y adolescentes víctimas de cualquier forma de violencia, abuso, negligencia y explotación.";

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative gradient-hope py-20 lg:py-32">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center animate-fade-in">
            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 text-balance">
              Protegemos los derechos de la{" "}
              <span className="text-primary">niñez</span> guatemalteca
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Desde hace más de 30 años trabajamos por la restitución de derechos 
              de niños, niñas y adolescentes víctimas de violencia y explotación.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link to="/donar">
                  <Heart className="w-5 h-5 mr-2" />
                  Donar Ahora
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/quienes-somos">
                  Conoce Nuestra Historia
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="font-heading text-4xl md:text-5xl font-bold mb-2">
                  {stat.number}
                </div>
                <div className="text-primary-foreground/80 text-sm md:text-base">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-card">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
              Nuestra Misión
            </h2>
            <p className="text-lg text-muted-foreground">
              {missionText}
            </p>
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="py-20 bg-card">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
              Nuestra Visión
            </h2>
            <p className="text-lg text-muted-foreground">
              {visionText}
            </p>
          </div>
        </div>

      
      {/* Programs Section */}
      <section className="py-20 bg-muted">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
              Nuestros Programas
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Trabajamos a través de programas especializados para brindar 
              atención integral a la niñez y adolescencia.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {programs.map((program) => (
              <div
                key={program.title}
                className="bg-card rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <program.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-heading font-semibold text-lg mb-2">
                  {program.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {program.description}
                </p>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Button variant="outline" asChild>
              <Link to="/programas">
                Ver Todos los Programas
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 gradient-warm text-primary-foreground">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
              Tu apoyo transforma vidas
            </h2>
            <p className="text-lg mb-8 text-primary-foreground/90">
              Cada donación nos permite continuar protegiendo a niños, niñas 
              y adolescentes que más lo necesitan. Únete a nuestra causa.
            </p>
            <Button
              size="lg"
              variant="secondary"
              className="bg-card text-foreground hover:bg-card/90"
              asChild
            >
              <Link to="/donar">
                <Heart className="w-5 h-5 mr-2" />
                Hacer una Donación
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <section className="py-16 bg-card">
        <div className="container">
          <div className="text-center mb-8">
            <h2 className="font-heading text-2xl font-semibold text-foreground mb-2">
              Socios Cooperantes
            </h2>
            <p className="text-muted-foreground text-sm">
              Trabajamos junto a organizaciones comprometidas con la niñez
            </p>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
            {partners && partners.length > 0 ? (
              partners.map((partner) => (
                <div
                  key={partner.id}
                  className="flex items-center gap-3"
                >
                  {partner.logo_url && partner.logo_url !== "/placeholder.svg" ? (
                    <a 
                      href={partner.website_url || "#"} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="opacity-70 hover:opacity-100 transition-opacity"
                    >
                      <img 
                        src={partner.logo_url} 
                        alt={partner.name}
                        className="h-12 w-auto object-contain"
                      />
                    </a>
                  ) : (
                    <a 
                      href={partner.website_url || "#"} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-muted-foreground font-semibold text-lg opacity-60 hover:opacity-100 transition-opacity"
                    >
                      {partner.name}
                    </a>
                  )}
                </div>
              ))
            ) : (
              // Fallback partners if none in database
              ["ACNUR", "Plan International", "UNICEF", "Save the Children", "World Vision"].map((name) => (
                <div
                  key={name}
                  className="text-muted-foreground font-semibold text-lg opacity-60 hover:opacity-100 transition-opacity"
                >
                  {name}
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;

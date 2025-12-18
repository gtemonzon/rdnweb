import { Link } from "react-router-dom";
import { Heart, Users, Shield, BookOpen, ArrowRight, HandHeart } from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/layout/Layout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import CountUpStat from "@/components/CountUpStat";
import PartnersCarousel from "@/components/PartnersCarousel";
import misionImage from "@/assets/mision-refugio.png";
import visionImageAsset from "@/assets/vision-refugio.png";

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
  { number: "50000+", label: "Niños atendidos" },
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

// Stock images for the hero and sections
const heroImages = [
  "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&q=80",
  "https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=800&q=80",
  "https://images.unsplash.com/photo-1497486751825-1233686d5d80?w=800&q=80",
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
      return data?.content as { text: string; image_url?: string } | null;
    },
  });

  // Fetch vision from database
  const { data: visionData } = useQuery({
    queryKey: ["site-content", "vision"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_content")
        .select("content")
        .eq("section_key", "vision")
        .single();
      if (error) throw error;
      return data?.content as { text: string; image_url?: string } | null;
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
  const missionText =
    missionData?.text ||
    "Somos una organización guatemalteca que trabaja por la protección, restitución y defensa de los derechos de niños, niñas y adolescentes víctimas de cualquier forma de violencia, abuso, negligencia y explotación.";
  const missionImageUrl =
    missionData?.image_url || misionImage;
  const visionText =
    visionData?.text ||
    "Ser la organización líder en Guatemala en la protección integral de los derechos de la niñez y adolescencia, contribuyendo a una sociedad donde todos los niños y niñas vivan libres de violencia.";
  const visionImageUrl =
    visionData?.image_url || visionImageAsset;

  return (
    <Layout>
      {/* Hero Section with Background Image */}
      <section className="relative min-h-[80vh] flex items-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img src={heroImages[0]} alt="Niños felices" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/70 to-primary/50" />
        </div>

        <div className="container relative z-10">
          <div className="max-w-2xl animate-fade-in">
            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 text-balance drop-shadow-lg">
              Protegemos los derechos de la <span className="text-accent">niñez</span> guatemalteca
            </h1>
            <p className="text-lg md:text-xl text-white/90 mb-8 max-w-xl drop-shadow">
              Desde hace más de 16 años trabajamos por la restitución de derechos de niños, niñas y adolescentes
              víctimas de violencia y explotación.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg" asChild>
                <Link to="/donar">
                  <Heart className="w-5 h-5 mr-2" />
                  Donar Ahora
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="bg-white/10 border-white text-white hover:bg-white/20 backdrop-blur-sm"
                asChild
              >
                <Link to="/quienes-somos">
                  Conoce Nuestra Historia
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Decorative floating images */}
        <div className="hidden lg:block absolute right-10 top-1/2 -translate-y-1/2 z-10">
          <div className="relative">
            <div className="w-64 h-80 rounded-2xl overflow-hidden shadow-2xl transform rotate-3 animate-float">
              <img src={heroImages[1]} alt="Niños en actividades" className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-10 -left-16 w-48 h-60 rounded-2xl overflow-hidden shadow-2xl transform -rotate-6 animate-float-delayed">
              <img src={heroImages[2]} alt="Actividades educativas" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section with Count Up Animation */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <CountUpStat key={stat.label} number={stat.number} label={stat.label} />
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section with Parallax Background */}
      <section 
        className="relative py-32 bg-fixed bg-cover bg-center"
        style={{ backgroundImage: `url(${missionImageUrl})` }}
      >
        <div className="absolute inset-0 bg-black/60"></div>
        <div className="container relative z-10">
          <div className="max-w-3xl">
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">Nuestra Misión</span>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mt-2 mb-6">
              Protección integral para la niñez
            </h2>
            <p className="text-lg text-white/90 leading-relaxed">{missionText}</p>
          </div>
        </div>
      </section>

      {/* Vision Section with Parallax Background */}
      <section 
        className="relative py-32 bg-fixed bg-cover bg-center"
        style={{ backgroundImage: `url(${visionImageUrl})` }}
      >
        <div className="absolute inset-0 bg-black/60"></div>
        <div className="container relative z-10">
          <div className="max-w-3xl ml-auto text-right">
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">Nuestra Visión</span>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mt-2 mb-6">
              Un futuro sin violencia
            </h2>
            <p className="text-lg text-white/90 leading-relaxed">{visionText}</p>
          </div>
        </div>
      </section>

      {/* Programs Section */}
      <section className="py-20 bg-muted">
        <div className="container">
          <div className="text-center mb-12">
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">Lo que hacemos</span>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mt-2 mb-4">
              Nuestros Programas
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Trabajamos a través de programas especializados para brindar atención integral a la niñez y adolescencia.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {programs.map((program, index) => (
              <div
                key={program.title}
                className="bg-card rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                  <program.icon className="w-7 h-7 text-primary group-hover:text-primary-foreground transition-colors" />
                </div>
                <h3 className="font-heading font-semibold text-lg mb-2">{program.title}</h3>
                <p className="text-sm text-muted-foreground">{program.description}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Button variant="outline" size="lg" asChild>
              <Link to="/programas">
                Ver Todos los Programas
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section with Background Image */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1469406396016-013bfae5d83e?w=1200&q=80"
            alt="Esperanza"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-secondary/95 via-secondary/85 to-secondary/75" />
        </div>
        <div className="container relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-secondary-foreground">
              Tu apoyo transforma vidas
            </h2>
            <p className="text-lg md:text-xl mb-10 text-secondary-foreground/90 max-w-2xl mx-auto">
              Cada donación nos permite continuar protegiendo a niños, niñas y adolescentes que más lo necesitan. Únete
              a nuestra causa.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg text-lg px-8"
                asChild
              >
                <Link to="/donar">
                  <Heart className="w-5 h-5 mr-2" />
                  Hacer una Donación
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="bg-white/10 border-white text-white hover:bg-white/20 backdrop-blur-sm"
                asChild
              >
                <Link to="/contacto">Contáctanos</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <section className="py-16 bg-card">
        <div className="container">
          <div className="text-center mb-10">
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">Alianzas</span>
            <h2 className="font-heading text-2xl md:text-3xl font-semibold text-foreground mt-2 mb-2">
              Socios Cooperantes
            </h2>
            <p className="text-muted-foreground">Trabajamos junto a organizaciones comprometidas con la niñez</p>
          </div>
          <PartnersCarousel partners={partners || []} />
        </div>
      </section>
    </Layout>
  );
};

export default Index;

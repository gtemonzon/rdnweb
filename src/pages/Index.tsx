import { Link } from "react-router-dom";
import { Heart, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/layout/Layout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import PartnersCarousel from "@/components/PartnersCarousel";
import HeroSection from "@/components/home/HeroSection";
import ImpactSection from "@/components/home/ImpactSection";
import ImpactStatsSection from "@/components/home/ImpactStatsSection";
import misionImage from "@/assets/mision-refugio.png";
import visionImageAsset from "@/assets/vision-refugio.png";

interface Partner {
  id: string;
  name: string;
  logo_url: string | null;
  website_url: string | null;
}

const Index = () => {
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

  const missionText =
    missionData?.text ||
    "Somos una organización guatemalteca que trabaja por la protección, restitución y defensa de los derechos de niños, niñas y adolescentes víctimas de cualquier forma de violencia, abuso, negligencia y explotación.";
  const missionImageUrl = missionData?.image_url || misionImage;
  const visionText =
    visionData?.text ||
    "Ser la organización líder en Guatemala en la protección integral de los derechos de la niñez y adolescencia, contribuyendo a una sociedad donde todos los niños y niñas vivan libres de violencia.";
  const visionImageUrl = visionData?.image_url || visionImageAsset;

  return (
    <Layout>
      {/* Hero Section */}
      <HeroSection />

      {/* Impact Pillars */}
      <ImpactSection />

      {/* Impact & Results */}
      <ImpactStatsSection />

      {/* Mission Section */}
      <section
        className="relative py-32 bg-fixed bg-cover bg-center"
        style={{ backgroundImage: `url(${missionImageUrl})` }}
      >
        <div className="absolute inset-0 bg-black/60" />
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

      {/* Vision Section */}
      <section
        className="relative py-32 bg-fixed bg-cover bg-center"
        style={{ backgroundImage: `url(${visionImageUrl})` }}
      >
        <div className="absolute inset-0 bg-black/60" />
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

      {/* CTA Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1469406396016-013bfae5d83e?w=1200&q=80&fm=webp"
            alt="Esperanza"
            className="w-full h-full object-cover"
            loading="lazy"
            width={1200}
            height={800}
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

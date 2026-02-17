import Layout from "@/components/layout/Layout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import PartnersCarousel from "@/components/PartnersCarousel";
import HeroSection from "@/components/home/HeroSection";
import ImpactSection from "@/components/home/ImpactSection";
import ImpactStatsSection from "@/components/home/ImpactStatsSection";
import MissionVisionSection from "@/components/home/MissionVisionSection";
import CtaSection from "@/components/home/CtaSection";
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

      {/* Mission & Vision */}
      <MissionVisionSection
        missionText={missionText}
        missionImageUrl={missionImageUrl}
        visionText={visionText}
        visionImageUrl={visionImageUrl}
      />

      {/* CTA Section */}
      <CtaSection />

      {/* Partners Section */}
      <section className="py-20 md:py-28 bg-muted">
        <div className="container">
          <div className="text-center mb-12">
            <span className="text-primary font-semibold text-xs uppercase tracking-[0.2em]">Alianzas</span>
            <h2 className="font-heading text-2xl md:text-3xl font-semibold text-foreground mt-2 mb-3">
              Socios Cooperantes
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Trabajamos junto a organizaciones nacionales e internacionales comprometidas con la protección de la niñez
            </p>
          </div>
          <div className="max-w-5xl mx-auto">
            <PartnersCarousel partners={partners || []} />
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;

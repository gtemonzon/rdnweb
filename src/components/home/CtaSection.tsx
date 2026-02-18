import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import ctaBg from "@/assets/cta-kids.webp";

const CtaSection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mql.matches) { setVisible(true); return; }
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      className="relative min-h-[80vh] md:min-h-[90vh] lg:min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={ctaBg}
          alt="Niños jugando"
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {/* Blue gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, hsl(var(--primary) / 0.75) 0%, hsl(203 100% 20% / 0.80) 50%, hsl(203 80% 15% / 0.88) 100%)",
          }}
        />
      </div>

      {/* Content */}
      <div
        className={`container relative z-10 px-4 py-20 md:py-28 transition-all duration-700 ease-out ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-8 text-white leading-tight">
            Tu apoyo transforma vidas
          </h2>
          <p className="text-lg sm:text-xl md:text-2xl mb-12 text-white/90 max-w-2xl mx-auto leading-relaxed font-body">
            Cada donación nos permite continuar protegiendo a niños, niñas y
            adolescentes que más lo necesitan. Únete a nuestra causa.
          </p>
          <div className="flex flex-col sm:flex-row gap-5 justify-center">
            <Button
              size="lg"
              className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg text-lg px-10 py-6"
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
              className="bg-white/10 border-white text-white hover:bg-white/20 backdrop-blur-sm text-lg px-10 py-6"
              asChild
            >
              <Link to="/contacto">Contáctanos</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CtaSection;

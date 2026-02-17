import { Link } from "react-router-dom";
import { Heart, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const HeroSection = () => {
  return (
    <section className="relative h-screen min-h-[600px] max-h-[1200px] flex items-center overflow-hidden">
      {/* Video background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        poster="/images/hero-kids.gif"
        className="absolute inset-0 w-full h-full object-cover scale-105"
      >
        <source src="/videos/hero-bg.mp4" type="video/mp4" />
      </video>

      {/* Gradient overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />

      {/* Content */}
      <div className="container relative z-10 flex flex-col items-center text-center px-4">
        <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight max-w-4xl tracking-tight">
          Protegemos la niñez.{" "}
          <span className="block mt-1 md:mt-2">
            Restituimos derechos.{" "}
          </span>
          <span className="block mt-1 md:mt-2 text-accent">
            Transformamos vidas.
          </span>
        </h1>

        <p className="mt-6 md:mt-8 text-lg md:text-xl text-white/85 max-w-2xl leading-relaxed font-body">
          Una organización guatemalteca comprometida con la protección de niños,
          niñas y adolescentes víctimas de violencia.
        </p>

        <div className="mt-10 md:mt-12 flex flex-col sm:flex-row gap-4">
          <Button
            size="lg"
            className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-xl text-base md:text-lg px-8 py-6 rounded-full"
            asChild
          >
            <Link to="/donar">
              <Heart className="w-5 h-5 mr-2" />
              Donar Ahora
            </Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-white/60 text-white hover:bg-white/15 backdrop-blur-sm text-base md:text-lg px-8 py-6 rounded-full"
            asChild
          >
            <Link to="/programas">
              Conoce cómo ayudamos
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-white/40 flex items-start justify-center p-1.5">
          <div className="w-1.5 h-2.5 bg-white/60 rounded-full animate-pulse" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

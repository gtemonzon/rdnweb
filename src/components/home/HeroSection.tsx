import { Link } from "react-router-dom";
import { Heart, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";

const useReducedMotion = () => {
  const [prefersReduced, setPrefersReduced] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReduced(mql.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);
  return prefersReduced;
};

const HeroSection = () => {
  const prefersReduced = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);

  // Trigger fade-in on mount
  useEffect(() => {
    const timer = setTimeout(() => setFadeIn(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Lazy-load video: only set src after component mounts & not reduced motion
  useEffect(() => {
    const video = videoRef.current;
    if (!video || prefersReduced) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.src = "/videos/hero-bg.mp4";
          video.load();
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [prefersReduced]);

  const handleVideoReady = () => setVideoLoaded(true);

  return (
    <section className="relative h-screen min-h-[600px] max-h-[1200px] flex items-center overflow-hidden">
      {/* Static fallback image — always present as base layer */}
      <img
        src="/images/hero-fallback.webp"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover"
        fetchPriority="high"
      />

      {/* Video layer with subtle zoom animation */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        onCanPlayThrough={handleVideoReady}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
          videoLoaded ? "opacity-100" : "opacity-0"
        } ${!prefersReduced ? "animate-hero-zoom" : ""}`}
      />

      {/* Gradient overlay for text readability */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.55) 50%, rgba(0,0,0,0.65) 100%)",
        }}
      />

      {/* Content with fade-in */}
      <div
        className={`container relative z-10 flex flex-col items-center text-center px-4 transition-opacity duration-[800ms] ease-out ${
          fadeIn ? "opacity-100" : "opacity-0"
        }`}
      >
        <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight max-w-4xl tracking-tight">
          Protegemos la niñez.{" "}
          <span className="block mt-1 md:mt-2">Restituimos derechos. </span>
          <span className="block mt-1 md:mt-2 text-accent">Transformamos vidas.</span>
        </h1>

        <p className="mt-6 md:mt-8 text-lg md:text-xl text-white/85 max-w-2xl leading-relaxed font-body">
          Una organización guatemalteca comprometida con la protección de niños, niñas y adolescentes víctimas de
          violencia.
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
            className="bg-white text-primary border-white hover:bg-white/90 text-base md:text-lg px-8 py-6 rounded-full font-semibold"
            asChild
          >
            <Link to="/programas">
              Conoce cómo ayudamos
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Scroll indicator — respects reduced motion */}
      {!prefersReduced && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-white/40 flex items-start justify-center p-1.5">
            <div className="w-1.5 h-2.5 bg-white/60 rounded-full animate-pulse" />
          </div>
        </div>
      )}
    </section>
  );
};

export default HeroSection;

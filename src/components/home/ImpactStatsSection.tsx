import { useCountUp, parseStatNumber } from "@/hooks/useCountUp";
import { useEffect, useRef, useState } from "react";

interface StatCard {
  number: string;
  label: string;
  micro: string;
}

const heroStat: StatCard = {
  number: "60000+",
  label: "Atenciones brindadas en 2025",
  micro: "vidas acompañadas con esperanza",
};

const secondaryStats: StatCard[] = [
  { number: "17", label: "Años de experiencia", micro: "protegiendo a la niñez" },
  { number: "30+", label: "Sentencias logradas", micro: "justicia para los más vulnerables" },
  { number: "10", label: "Departamentos", micro: "comunidades protegidas en Guatemala" },
];

const useReducedMotion = () => {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mql.matches);
    const h = (e: MediaQueryListEvent) => setReduced(e.matches);
    mql.addEventListener("change", h);
    return () => mql.removeEventListener("change", h);
  }, []);
  return reduced;
};

/* ── Animated single stat ── */
const AnimatedStat = ({
  stat,
  isHero = false,
  delay = 0,
  reducedMotion = false,
}: {
  stat: StatCard;
  isHero?: boolean;
  delay?: number;
  reducedMotion?: boolean;
}) => {
  const { number: endNumber, suffix, prefix } = parseStatNumber(stat.number);
  const { formattedCount, elementRef, isVisible } = useCountUp({
    end: endNumber,
    duration: isHero ? 1500 : 900,
    suffix,
    prefix,
  });

  const [show, setShow] = useState(reducedMotion);

  useEffect(() => {
    if (reducedMotion || !isVisible) return;
    const t = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(t);
  }, [isVisible, delay, reducedMotion]);

  return (
    <div
      ref={elementRef}
      className={`text-center rounded-2xl p-6 transition-all duration-700 ease-out
        ${show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}
        ${!isHero ? "md:hover:-translate-y-1 md:hover:shadow-[0_8px_30px_rgba(0,0,0,0.25)]" : ""}
      `}
      style={
        isHero && show && !reducedMotion
          ? {
              animation: "hero-scale-in 0.6s ease-out both",
            }
          : undefined
      }
    >
      <div
        className={`font-heading font-extrabold leading-none tracking-tight ${
          isHero
            ? "text-6xl sm:text-7xl md:text-8xl lg:text-9xl"
            : "text-4xl sm:text-5xl md:text-6xl"
        }`}
        style={
          isHero
            ? {
                background:
                  "linear-gradient(135deg, hsl(var(--accent)) 0%, hsl(var(--refugio-gold)) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }
            : {
                color: "rgba(255,255,255,0.95)",
                textShadow: "0 2px 16px rgba(0,0,0,0.35)",
              }
        }
      >
        {formattedCount}
      </div>

      <p
        className={`font-heading font-bold mt-2 ${
          isHero
            ? "text-lg sm:text-xl md:text-2xl text-white"
            : "text-base md:text-lg text-white"
        }`}
      >
        {stat.label}
      </p>

      <p
        className={`mt-1 italic ${
          isHero
            ? "text-sm md:text-base text-white/65"
            : "text-xs md:text-sm text-white/75"
        }`}
      >
        {stat.micro}
      </p>
    </div>
  );
};

/* ── Section ── */
const ImpactStatsSection = () => {
  const reducedMotion = useReducedMotion();
  const [headerVisible, setHeaderVisible] = useState(reducedMotion);
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reducedMotion) return;
    const el = headerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHeaderVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [reducedMotion]);

  return (
    <section
      className="relative min-h-[60vh] flex items-center py-20 md:py-28 overflow-hidden"
      style={{
        background:
          "linear-gradient(160deg, hsl(var(--primary)) 0%, hsl(203 100% 25%) 60%, hsl(203 80% 18%) 100%)",
      }}
    >
      {/* Subtle decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-[0.07]"
          style={{
            background:
              "radial-gradient(circle, hsl(var(--accent)) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full opacity-[0.05]"
          style={{
            background:
              "radial-gradient(circle, hsl(var(--secondary)) 0%, transparent 70%)",
          }}
        />
      </div>

      <div className="container relative z-10 px-4">
        {/* Section header */}
        <div
          ref={headerRef}
          className={`text-center mb-12 md:mb-16 transition-all duration-700 ease-out ${
            headerVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <span className="inline-block text-accent font-semibold text-xs sm:text-sm uppercase tracking-[0.2em] mb-3">
            Impacto y Resultados
          </span>
          <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-white/90">
            Nuestro compromiso en cifras
          </h2>
        </div>

        {/* Hero stat */}
        <div className="mb-16 md:mb-20">
          <AnimatedStat stat={heroStat} isHero delay={100} reducedMotion={reducedMotion} />
        </div>

        {/* Divider */}
        <div className="flex justify-center mb-12 md:mb-16">
          <div className="w-20 h-px bg-white/20" />
        </div>

        {/* Secondary stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 md:gap-16 max-w-4xl mx-auto">
          {secondaryStats.map((stat, i) => (
            <AnimatedStat
              key={stat.label}
              stat={stat}
              delay={300 + i * 130}
              reducedMotion={reducedMotion}
            />
          ))}
        </div>
      </div>

      {/* Hero scale-in keyframe (CSS-in-JS alternative) */}
      <style>{`
        @keyframes hero-scale-in {
          from { transform: scale(0.96); }
          to   { transform: scale(1); }
        }
      `}</style>
    </section>
  );
};

export default ImpactStatsSection;

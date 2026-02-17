import { useEffect, useRef, useState } from "react";

interface MissionVisionBlockProps {
  label: string;
  title: string;
  summary: string;
  fullText: string;
  imageUrl: string;
  align?: "left" | "right";
}

const useInView = (threshold = 0.15) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
};

const MissionVisionBlock = ({
  label,
  title,
  summary,
  fullText,
  imageUrl,
  align = "left",
}: MissionVisionBlockProps) => {
  const { ref: heroRef, visible: heroVisible } = useInView(0.2);
  const { ref: textRef, visible: textVisible } = useInView(0.1);

  return (
    <div>
      {/* Hero banner with image */}
      <div
        ref={heroRef}
        className="relative py-24 md:py-32 bg-cover bg-center bg-fixed overflow-hidden"
        style={{ backgroundImage: `url(${imageUrl})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/50 to-black/65" />
        <div
          className={`container relative z-10 transition-all duration-700 ease-out ${
            heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <div className={`max-w-3xl ${align === "right" ? "ml-auto text-right" : ""}`}>
            <span className="inline-block text-accent font-semibold text-xs sm:text-sm uppercase tracking-[0.2em] mb-3">
              {label}
            </span>
            <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-white mt-1 mb-5 leading-tight">
              {title}
            </h2>
            <p className="text-lg md:text-xl text-white/90 leading-relaxed font-body">
              {summary}
            </p>
          </div>
        </div>
      </div>

      {/* Full legal text in readable container */}
      <div
        ref={textRef}
        className={`bg-background py-12 md:py-16 transition-all duration-700 ease-out ${
          textVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <div className="container">
          <div className={`max-w-3xl ${align === "right" ? "ml-auto" : ""}`}>
            <div className="border-l-4 border-primary/30 pl-6 md:pl-8">
              <p className="text-base md:text-lg text-foreground/85 leading-[1.85] font-body">
                {fullText}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface MissionVisionSectionProps {
  missionText: string;
  missionImageUrl: string;
  visionText: string;
  visionImageUrl: string;
}

const MissionVisionSection = ({
  missionText,
  missionImageUrl,
  visionText,
  visionImageUrl,
}: MissionVisionSectionProps) => {
  return (
    <>
      <MissionVisionBlock
        label="Nuestra Misión"
        title="Protección integral para la niñez"
        summary="Trabajamos por la protección, restitución y defensa de los derechos de niños, niñas y adolescentes víctimas de violencia."
        fullText={missionText}
        imageUrl={missionImageUrl}
        align="left"
      />

      {/* Subtle separator */}
      <div className="h-px bg-border" />

      <MissionVisionBlock
        label="Nuestra Visión"
        title="Un futuro sin violencia"
        summary="Contribuimos a una sociedad donde todos los niños y niñas vivan libres de violencia, con sus derechos plenamente restituidos."
        fullText={visionText}
        imageUrl={visionImageUrl}
        align="right"
      />
    </>
  );
};

export default MissionVisionSection;

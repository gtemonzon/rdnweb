import { useEffect, useRef, useState } from "react";

interface MissionVisionBlockProps {
  label: string;
  title: string;
  fullText: string;
  imageUrl: string;
  align?: "left" | "right";
}

const useInView = (threshold = 0.1) => {
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
  fullText,
  imageUrl,
  align = "left",
}: MissionVisionBlockProps) => {
  const { ref, visible } = useInView(0.05);

  return (
    <section
      ref={ref}
      className="relative bg-fixed bg-cover bg-center"
      style={{ backgroundImage: `url(${imageUrl})` }}
    >
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/55 to-black/65" />

      <div
        className={`container relative z-10 py-24 md:py-32 lg:py-40 transition-all duration-700 ease-out ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        }`}
      >
        <div className={`max-w-3xl ${align === "right" ? "ml-auto text-right" : ""}`}>
          <span className="inline-block text-accent font-semibold text-xs sm:text-sm uppercase tracking-[0.2em] mb-3">
            {label}
          </span>
          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-white mt-1 mb-8 leading-tight">
            {title}
          </h2>
          <p className="text-base md:text-lg text-white/90 leading-[1.9] font-body">
            {fullText}
          </p>
        </div>
      </div>
    </section>
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
        fullText={missionText}
        imageUrl={missionImageUrl}
        align="left"
      />

      <MissionVisionBlock
        label="Nuestra Visión"
        title="Un futuro sin violencia"
        fullText={visionText}
        imageUrl={visionImageUrl}
        align="right"
      />
    </>
  );
};

export default MissionVisionSection;

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
      className="relative bg-fixed bg-cover bg-center min-h-screen flex items-center"
      style={{ backgroundImage: `url(${imageUrl})` }}
    >
      {/* Dark gradient overlay – lighter top, darker bottom */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/45 to-black/65" />

      <div
        className={`container relative z-10 pt-24 pb-16 md:pt-28 md:pb-20 lg:pt-32 lg:pb-24 transition-opacity duration-700 ease-out ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className={`max-w-4xl ${align === "right" ? "ml-auto text-right" : ""}`}>
          <span className="inline-block text-accent font-semibold text-xs sm:text-sm uppercase tracking-[0.2em] mb-4">
            {label}
          </span>
          <h2 className="font-heading text-3xl md:text-5xl lg:text-6xl font-bold text-white mt-1 mb-10 leading-tight">
            {title}
          </h2>
          <p className="text-base md:text-lg lg:text-xl text-white/90 leading-[1.9] font-body">
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

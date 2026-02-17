import { Shield, HeartHandshake, Scale } from "lucide-react";

const pillars = [
  {
    icon: Shield,
    title: "Protección",
    description:
      "Brindamos refugio seguro y atención inmediata a niños y adolescentes en situación de riesgo.",
  },
  {
    icon: HeartHandshake,
    title: "Atención y Acompañamiento",
    description:
      "Ofrecemos apoyo psicológico, social y educativo para su recuperación integral.",
  },
  {
    icon: Scale,
    title: "Restitución de Derechos",
    description:
      "Trabajamos para que cada niño recupere sus derechos y acceda a una vida digna.",
  },
];

const ImpactSection = () => {
  return (
    <section className="py-16 md:py-20 lg:min-h-screen lg:flex lg:items-center bg-muted">
      <div className="container px-4">
        <div className="text-center mb-14 md:mb-18">
          <span className="inline-block text-primary font-semibold text-sm uppercase tracking-widest mb-3">
            Lo que hacemos
          </span>
          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
            Tres pilares que cambian vidas
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {pillars.map((pillar) => (
            <div
              key={pillar.title}
              className="group bg-card rounded-2xl p-8 md:p-10 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-2 text-center"
            >
              <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:scale-110 transition-all duration-500">
                <pillar.icon className="w-8 h-8 text-primary group-hover:text-primary-foreground transition-colors duration-500" />
              </div>
              <h3 className="font-heading text-xl md:text-2xl font-bold mb-3 text-foreground">
                {pillar.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed text-base">
                {pillar.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ImpactSection;

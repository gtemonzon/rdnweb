import { Target, Eye, Heart, Users, Award, Calendar } from "lucide-react";
import Layout from "@/components/layout/Layout";

const values = [
  { icon: Heart, title: "Amor", description: "Atención con calidez humana y empatía." },
  { icon: Users, title: "Compromiso", description: "Dedicación total a nuestra misión." },
  { icon: Award, title: "Excelencia", description: "Búsqueda constante de la mejora continua." },
  { icon: Target, title: "Integridad", description: "Transparencia en todas nuestras acciones." },
];

const timeline = [
  { year: "1990", title: "Fundación", description: "Inicio de operaciones en Guatemala." },
  { year: "2000", title: "Expansión", description: "Ampliación de programas de protección." },
  { year: "2010", title: "Reconocimiento", description: "Premio internacional por labor humanitaria." },
  { year: "2020", title: "Innovación", description: "Implementación de nuevos programas especializados." },
];

const QuienesSomos = () => {
  return (
    <Layout>
      {/* Hero */}
      <section className="py-20 gradient-hope">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="font-heading text-4xl md:text-5xl font-bold text-foreground mb-6">
              Quiénes Somos
            </h1>
            <p className="text-lg text-muted-foreground">
              Conoce la historia, misión y valores que guían nuestro trabajo 
              en la protección de la niñez guatemalteca.
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 bg-card">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-12">
            <div className="bg-muted rounded-2xl p-8">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                <Target className="w-7 h-7 text-primary" />
              </div>
              <h2 className="font-heading text-2xl font-bold text-foreground mb-4">
                Misión
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Proteger, restituir y defender los derechos de niños, niñas y 
                adolescentes víctimas de cualquier forma de violencia, abuso, 
                negligencia y explotación, brindando atención integral especializada 
                con enfoque de derechos humanos.
              </p>
            </div>
            <div className="bg-muted rounded-2xl p-8">
              <div className="w-14 h-14 rounded-xl bg-secondary/20 flex items-center justify-center mb-6">
                <Eye className="w-7 h-7 text-secondary" />
              </div>
              <h2 className="font-heading text-2xl font-bold text-foreground mb-4">
                Visión
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Ser la organización líder en Guatemala en la protección integral 
                de la niñez y adolescencia, reconocida por su excelencia, 
                transparencia y compromiso con los derechos humanos, contribuyendo 
                a una sociedad más justa y protectora.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-muted">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
              Nuestros Valores
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Los principios que guían cada una de nuestras acciones.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value) => (
              <div
                key={value.title}
                className="bg-card rounded-xl p-6 text-center hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <value.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-heading font-semibold text-lg mb-2">
                  {value.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 bg-card">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
              Nuestra Historia
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Más de tres décadas protegiendo a la niñez guatemalteca.
            </p>
          </div>
          <div className="max-w-3xl mx-auto">
            {timeline.map((item, index) => (
              <div key={item.year} className="flex gap-6 mb-8 last:mb-0">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                    <Calendar className="w-5 h-5" />
                  </div>
                  {index < timeline.length - 1 && (
                    <div className="w-0.5 h-full bg-border mt-2" />
                  )}
                </div>
                <div className="pb-8">
                  <span className="text-primary font-bold text-lg">{item.year}</span>
                  <h3 className="font-heading font-semibold text-xl text-foreground mt-1">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground mt-2">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default QuienesSomos;

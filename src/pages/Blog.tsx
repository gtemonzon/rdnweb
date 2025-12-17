import { Calendar, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Layout from "@/components/layout/Layout";

const posts = [
  {
    id: 1,
    title: "Inauguramos nuevo centro de atención en Quetzaltenango",
    excerpt: "Con el apoyo de socios cooperantes, ampliamos nuestra cobertura a más comunidades del occidente del país.",
    date: "15 Dic 2024",
    category: "Noticias",
    image: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=600&h=400&fit=crop",
  },
  {
    id: 2,
    title: "Programa de becas beneficia a 200 estudiantes",
    excerpt: "Gracias a las donaciones, más niños y niñas pueden continuar sus estudios con apoyo integral.",
    date: "10 Dic 2024",
    category: "Impacto",
    image: "https://images.unsplash.com/photo-1497486751825-1233686d5d80?w=600&h=400&fit=crop",
  },
  {
    id: 3,
    title: "Taller de prevención de violencia en escuelas",
    excerpt: "Llegamos a más de 1,000 estudiantes con nuestro programa de educación preventiva.",
    date: "5 Dic 2024",
    category: "Prevención",
    image: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=600&h=400&fit=crop",
  },
  {
    id: 4,
    title: "Historia de éxito: María recupera su sonrisa",
    excerpt: "Conoce la inspiradora historia de superación de una de nuestras beneficiarias.",
    date: "1 Dic 2024",
    category: "Historias",
    image: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=600&h=400&fit=crop",
  },
  {
    id: 5,
    title: "Alianza con UNICEF para fortalecer protección",
    excerpt: "Nueva colaboración permitirá ampliar la cobertura de nuestros programas de protección especial.",
    date: "25 Nov 2024",
    category: "Alianzas",
    image: "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=600&h=400&fit=crop",
  },
  {
    id: 6,
    title: "Capacitación a operadores de justicia",
    excerpt: "Impartimos talleres especializados sobre derechos de la niñez a funcionarios judiciales.",
    date: "20 Nov 2024",
    category: "Incidencia",
    image: "https://images.unsplash.com/photo-1577896851231-70ef18881754?w=600&h=400&fit=crop",
  },
];

const categories = ["Todos", "Noticias", "Impacto", "Historias", "Prevención", "Alianzas", "Incidencia"];

const Blog = () => {
  return (
    <Layout>
      {/* Hero */}
      <section className="py-20 gradient-hope">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="font-heading text-4xl md:text-5xl font-bold text-foreground mb-6">
              Blog y Noticias
            </h1>
            <p className="text-lg text-muted-foreground">
              Mantente informado sobre nuestro trabajo, historias de impacto 
              y las últimas novedades de Refugio de la Niñez.
            </p>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-8 bg-card border-b border-border">
        <div className="container">
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map((category) => (
              <Button
                key={category}
                variant={category === "Todos" ? "default" : "outline"}
                size="sm"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Posts Grid */}
      <section className="py-16 bg-muted">
        <div className="container">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <article
                key={post.id}
                className="bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-48 object-cover"
                />
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary">
                      {post.category}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {post.date}
                    </span>
                  </div>
                  <h2 className="font-heading font-semibold text-lg text-foreground mb-2 line-clamp-2">
                    {post.title}
                  </h2>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {post.excerpt}
                  </p>
                  <Link
                    to={`/blog/${post.id}`}
                    className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1"
                  >
                    Leer más
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </article>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex justify-center mt-12">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>
                Anterior
              </Button>
              <Button variant="default" size="sm">
                1
              </Button>
              <Button variant="outline" size="sm">
                2
              </Button>
              <Button variant="outline" size="sm">
                3
              </Button>
              <Button variant="outline" size="sm">
                Siguiente
              </Button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Blog;

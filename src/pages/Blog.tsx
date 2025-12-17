import { useEffect, useState } from "react";
import { Calendar, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Layout from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  image_url: string | null;
  category: string;
  published_at: string | null;
  created_at: string;
}

const categories = ["Todos", "Noticias", "Impacto", "Historias", "Prevención", "Alianzas", "Incidencia"];

const Blog = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("Todos");

  useEffect(() => {
    const fetchPosts = async () => {
      const { data } = await supabase
        .from("blog_posts")
        .select("id, title, slug, excerpt, image_url, category, published_at, created_at")
        .eq("published", true)
        .order("published_at", { ascending: false });
      
      setPosts(data || []);
      setLoading(false);
    };
    fetchPosts();
  }, []);

  const filteredPosts = selectedCategory === "Todos" 
    ? posts 
    : posts.filter(p => p.category === selectedCategory);

  return (
    <Layout>
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

      <section className="py-8 bg-card border-b border-border">
        <div className="container">
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map((category) => (
              <Button
                key={category}
                variant={category === selectedCategory ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted">
        <div className="container">
          {loading ? (
            <p className="text-center">Cargando...</p>
          ) : filteredPosts.length === 0 ? (
            <p className="text-center text-muted-foreground">No hay artículos disponibles.</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPosts.map((post) => (
                <article key={post.id} className="bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  {post.image_url && (
                    <img src={post.image_url} alt={post.title} className="w-full h-48 object-cover" />
                  )}
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary">
                        {post.category}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(post.published_at || post.created_at).toLocaleDateString("es-GT")}
                      </span>
                    </div>
                    <h2 className="font-heading font-semibold text-lg text-foreground mb-2 line-clamp-2">
                      {post.title}
                    </h2>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {post.excerpt}
                    </p>
                    <Link to={`/blog/${post.slug}`} className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1">
                      Leer más <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Blog;

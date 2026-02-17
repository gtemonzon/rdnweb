import { useEffect, useState } from "react";
import { Calendar, ArrowRight, BarChart3, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

interface StatPost {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  cover_image_url: string | null;
  source_name: string | null;
  period_start: string | null;
  period_end: string | null;
  published_at: string | null;
  created_at: string;
}

const blogCategories = ["Todos", "Noticias", "Impacto", "Historias", "Prevención", "Alianzas", "Incidencia"];

const Blog = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [statPosts, setStatPosts] = useState<StatPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [activeTab, setActiveTab] = useState<"blog" | "stats">("blog");

  useEffect(() => {
    const fetchAll = async () => {
      const [blogRes, statRes] = await Promise.all([
        supabase
          .from("blog_posts")
          .select("id, title, slug, excerpt, image_url, category, published_at, created_at")
          .eq("published", true)
          .order("published_at", { ascending: false }),
        supabase
          .from("stat_posts")
          .select("id, title, slug, summary, cover_image_url, source_name, period_start, period_end, published_at, created_at")
          .eq("published", true)
          .order("published_at", { ascending: false }),
      ]);
      setPosts(blogRes.data || []);
      setStatPosts(statRes.data || []);
      setLoading(false);
    };
    fetchAll();
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

      {/* Main tab selector: Blog vs Statistics */}
      <section className="py-4 bg-card border-b border-border">
        <div className="container">
          <div className="flex justify-center gap-2 mb-4">
            <Button
              variant={activeTab === "blog" ? "default" : "outline"}
              onClick={() => setActiveTab("blog")}
            >
              Blog
            </Button>
            <Button
              variant={activeTab === "stats" ? "default" : "outline"}
              onClick={() => setActiveTab("stats")}
              className="gap-2"
            >
              <BarChart3 className="w-4 h-4" /> Estadísticas
            </Button>
          </div>

          {/* Blog sub-categories */}
          {activeTab === "blog" && (
            <div className="flex flex-wrap gap-2 justify-center">
              {blogCategories.map((category) => (
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
          )}
        </div>
      </section>

      <section className="py-16 bg-muted">
        <div className="container">
          {loading ? (
            <p className="text-center">Cargando...</p>
          ) : activeTab === "blog" ? (
            /* Blog listing */
            filteredPosts.length === 0 ? (
              <p className="text-center text-muted-foreground">No hay artículos disponibles.</p>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredPosts.map((post) => (
                  <article key={post.id} className="bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    {post.image_url && (
                      <img src={post.image_url} alt={post.title} className="w-full h-48 object-cover" loading="lazy" />
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
            )
          ) : (
            /* Statistics listing */
            statPosts.length === 0 ? (
              <p className="text-center text-muted-foreground">No hay publicaciones estadísticas disponibles.</p>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {statPosts.map((sp) => (
                  <article key={sp.id} className="bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
                    {sp.cover_image_url && (
                      <div className="relative overflow-hidden">
                        <img
                          src={sp.cover_image_url}
                          alt={sp.title}
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <Badge variant="default" className="text-xs">Estadísticas</Badge>
                        {sp.period_start && sp.period_end && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {sp.period_start} — {sp.period_end}
                          </span>
                        )}
                      </div>
                      <h2 className="font-heading font-semibold text-lg text-foreground mb-2 line-clamp-2">
                        {sp.title}
                      </h2>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {sp.summary}
                      </p>
                      {sp.source_name && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1 mb-3">
                          <ExternalLink className="w-3 h-3" /> {sp.source_name}
                        </span>
                      )}
                      <Link
                        to={`/blog/estadisticas/${sp.slug}`}
                        className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1"
                      >
                        Ver detalle <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Blog;

import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import { Calendar, ArrowLeft, User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BlogPost {
  id: string;
  title: string;
  content: string | null;
  excerpt: string | null;
  image_url: string | null;
  youtube_url: string | null;
  category: string;
  published_at: string | null;
  created_at: string;
}

const getYouTubeEmbedUrl = (url: string): string | null => {
  if (!url) return null;
  
  // Handle various YouTube URL formats
  const regexPatterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/
  ];
  
  for (const regex of regexPatterns) {
    const match = url.match(regex);
    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
  }
  return null;
};

const BlogPost = () => {
  const { slug } = useParams();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .eq("published", true)
        .single();

      if (error || !data) {
        setNotFound(true);
      } else {
        setPost(data);
      }
      setLoading(false);
    };

    if (slug) {
      fetchPost();
    }
  }, [slug]);

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <p>Cargando...</p>
        </div>
      </Layout>
    );
  }

  if (notFound || !post) {
    return (
      <Layout>
        <section className="py-20 min-h-[60vh]">
          <div className="container text-center">
            <h1 className="font-heading text-2xl font-bold text-foreground mb-4">
              Artículo no encontrado
            </h1>
            <p className="text-muted-foreground mb-6">
              El artículo que buscas no existe o no está disponible.
            </p>
            <Button asChild>
              <Link to="/blog">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al Blog
              </Link>
            </Button>
          </div>
        </section>
      </Layout>
    );
  }

  const publishDate = post.published_at || post.created_at;

  return (
    <Layout>
      {/* Hero */}
      <section className="py-12 gradient-hope">
        <div className="container">
          <Button variant="ghost" size="sm" asChild className="mb-6">
            <Link to="/blog">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Blog
            </Link>
          </Button>
          
          <div className="max-w-3xl">
            <span className="text-sm font-medium px-3 py-1 rounded-full bg-primary/10 text-primary">
              {post.category}
            </span>
            <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mt-4 mb-4">
              {post.title}
            </h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(publishDate).toLocaleDateString("es-GT", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="container">
          <div className="max-w-3xl mx-auto">
            {post.image_url && (
              <img
                src={post.image_url}
                alt={post.title}
                className="w-full h-auto rounded-xl mb-8"
              />
            )}
            
            {post.excerpt && (
              <p className="text-lg text-muted-foreground mb-8 font-medium">
                {post.excerpt}
              </p>
            )}

            {post.youtube_url && getYouTubeEmbedUrl(post.youtube_url) && (
              <div className="mb-8">
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    className="absolute top-0 left-0 w-full h-full rounded-xl"
                    src={getYouTubeEmbedUrl(post.youtube_url)!}
                    title={post.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}
            
            {post.content && (
              <div className="prose prose-lg max-w-none">
                {post.content.split("\n").map((paragraph, index) => (
                  <p key={index} className="mb-4 text-foreground leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 bg-muted">
        <div className="container text-center">
          <h2 className="font-heading text-2xl font-bold text-foreground mb-4">
            ¿Quieres apoyar nuestra causa?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Tu donación puede cambiar la vida de un niño o niña víctima de violencia.
          </p>
          <Button asChild size="lg" className="bg-accent hover:bg-accent/90">
            <Link to="/donar">Donar Ahora</Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
};

export default BlogPost;

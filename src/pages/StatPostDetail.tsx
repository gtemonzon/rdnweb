import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import { Calendar, ArrowLeft, ExternalLink, Copy, Check, Download, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface StatPost {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  content: string | null;
  cover_image_url: string | null;
  source_name: string | null;
  source_url: string | null;
  period_start: string | null;
  period_end: string | null;
  cutoff_date: string | null;
  methodology_notes: string | null;
  tags: string[] | null;
  published_at: string | null;
  created_at: string;
}

interface StatAsset {
  id: string;
  image_url: string;
  caption: string | null;
  order_index: number;
}

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("es-GT", { year: "numeric", month: "long", day: "numeric" });

const StatPostDetail = () => {
  const { slug } = useParams();
  const [post, setPost] = useState<StatPost | null>(null);
  const [assets, setAssets] = useState<StatAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await supabase
        .from("stat_posts")
        .select("*")
        .eq("slug", slug)
        .eq("published", true)
        .single();

      if (error || !data) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setPost(data);

      const { data: assetData } = await supabase
        .from("stat_assets")
        .select("*")
        .eq("stat_post_id", data.id)
        .order("order_index");
      setAssets(assetData || []);
      setLoading(false);
    };
    if (slug) fetch();
  }, [slug]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success("Enlace copiado");
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </Layout>
    );
  }

  if (notFound || !post) {
    return (
      <Layout>
        <section className="py-20 min-h-[60vh]">
          <div className="container text-center">
            <h1 className="font-heading text-2xl font-bold text-foreground mb-4">Estadística no encontrada</h1>
            <p className="text-muted-foreground mb-6">El contenido que buscas no existe o no está disponible.</p>
            <Button asChild>
              <Link to="/blog"><ArrowLeft className="w-4 h-4 mr-2" />Volver al Blog</Link>
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
      <section className="relative">
        {post.cover_image_url ? (
          <div className="relative h-[50vh] md:h-[60vh]">
            <img
              src={post.cover_image_url}
              alt={post.title}
              className="w-full h-full object-cover"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/10" />
            <div className="absolute inset-0 flex items-end">
              <div className="container pb-10">
                <Button variant="ghost" size="sm" asChild className="mb-4 text-white/80 hover:text-white hover:bg-white/10">
                  <Link to="/blog"><ArrowLeft className="w-4 h-4 mr-2" />Volver al Blog</Link>
                </Button>
                <Badge className="mb-3 bg-primary/90">Estadísticas</Badge>
                <h1 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 max-w-4xl">
                  {post.title}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-sm text-white/80">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {formatDate(publishDate)}
                  </span>
                  {post.period_start && post.period_end && (
                    <span>Período: {post.period_start} — {post.period_end}</span>
                  )}
                  {post.source_name && (
                    <span className="flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" /> {post.source_name}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-12 gradient-hope">
            <div className="container">
              <Button variant="ghost" size="sm" asChild className="mb-6">
                <Link to="/blog"><ArrowLeft className="w-4 h-4 mr-2" />Volver al Blog</Link>
              </Button>
              <Badge className="mb-3">Estadísticas</Badge>
              <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-3 max-w-4xl">{post.title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{formatDate(publishDate)}</span>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            {/* Share */}
            <div className="flex gap-2 mb-8">
              <Button variant="outline" size="sm" onClick={handleCopyLink}>
                {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                {copied ? "Copiado" : "Copiar enlace"}
              </Button>
            </div>

            {post.summary && (
              <p className="text-lg text-muted-foreground mb-8 font-medium leading-relaxed">{post.summary}</p>
            )}

            {/* Meta info */}
            {(post.cutoff_date || post.source_name) && (
              <div className="grid sm:grid-cols-2 gap-4 mb-8 p-4 bg-muted rounded-xl">
                {post.cutoff_date && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Fecha de Corte</p>
                    <p className="text-sm text-foreground font-medium">{formatDate(post.cutoff_date)}</p>
                  </div>
                )}
                {post.source_name && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Fuente</p>
                    {post.source_url ? (
                      <a href={post.source_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
                        {post.source_name} <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <p className="text-sm text-foreground font-medium">{post.source_name}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Content paragraphs */}
            {post.content && (
              <div className="prose prose-lg max-w-none mb-8">
                {post.content.split("\n").map((paragraph, index) =>
                  paragraph.trim() ? (
                    <p key={index} className="mb-4 text-foreground leading-relaxed">{paragraph}</p>
                  ) : null
                )}
              </div>
            )}

            {/* Image gallery */}
            {assets.length > 0 && (
              <div className="space-y-6 mb-8">
                <h3 className="font-heading text-xl font-semibold text-foreground">Galería</h3>
                <div className="grid gap-6">
                  {assets.map(asset => (
                    <figure key={asset.id} className="space-y-2">
                      <img
                        src={asset.image_url}
                        alt={asset.caption || post.title}
                        className="w-full h-auto rounded-xl"
                        loading="lazy"
                      />
                      {asset.caption && (
                        <figcaption className="text-sm text-muted-foreground text-center italic">{asset.caption}</figcaption>
                      )}
                    </figure>
                  ))}
                </div>
              </div>
            )}

            {/* Methodology */}
            {post.methodology_notes && (
              <div className="p-4 border rounded-xl bg-muted/50 mb-8">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="w-4 h-4 text-muted-foreground" />
                  <h4 className="font-medium text-sm text-foreground">Notas Metodológicas</h4>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{post.methodology_notes}</p>
              </div>
            )}

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {post.tags.map(tag => (
                  <Badge key={tag} variant="outline">{tag}</Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 bg-muted">
        <div className="container text-center">
          <h2 className="font-heading text-2xl font-bold text-foreground mb-4">¿Quieres apoyar nuestra causa?</h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">Tu donación puede cambiar la vida de un niño o niña víctima de violencia.</p>
          <Button asChild size="lg" className="bg-accent hover:bg-accent/90">
            <Link to="/donar">Donar Ahora</Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
};

export default StatPostDetail;

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/layout/Layout";
import { ArrowLeft, Save } from "lucide-react";
import { Link } from "react-router-dom";
import { allBlogCategories, BlogCustomSettings } from "@/types/permissions";

const AdminPostEditor = () => {
  const { id } = useParams();
  const isEditing = !!id;
  const { user, userRole, hasPermission, getCustomSettings, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [category, setCategory] = useState("Noticias");
  const [published, setPublished] = useState(false);
  const [postAuthorId, setPostAuthorId] = useState<string | null>(null);

  // Get blog-specific custom settings
  const blogSettings = getCustomSettings<BlogCustomSettings>('blog');

  // Get available categories based on permissions
  const availableCategories = !blogSettings.allowed_categories
    ? allBlogCategories 
    : allBlogCategories.filter(cat => blogSettings.allowed_categories?.includes(cat));

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (isEditing && user) {
      fetchPost();
    }
  }, [id, user]);

  // Check permissions after loading
  useEffect(() => {
    if (!authLoading && user && userRole) {
      // Check create permission for new posts
      if (!isEditing && !hasPermission('blog', 'can_create')) {
        toast({
          title: "Sin permisos",
          description: "No tienes permiso para crear artículos",
          variant: "destructive",
        });
        navigate("/admin");
      }
    }
  }, [authLoading, user, userRole, isEditing, navigate, hasPermission]);

  const fetchPost = async () => {
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo cargar el artículo",
        variant: "destructive",
      });
      navigate("/admin");
    } else if (data) {
      setTitle(data.title);
      setSlug(data.slug);
      setExcerpt(data.excerpt || "");
      setContent(data.content || "");
      setImageUrl(data.image_url || "");
      setYoutubeUrl((data as any).youtube_url || "");
      setCategory(data.category);
      setPublished(data.published);
      setPostAuthorId(data.author_id);

      // Check edit permissions
      const canEdit = hasPermission('blog', 'can_edit_all') || 
        (hasPermission('blog', 'can_edit_own') && data.author_id === user?.id);
      
      const canAccessCat = !blogSettings.allowed_categories || 
        blogSettings.allowed_categories.includes(data.category);

      if (!canEdit || !canAccessCat) {
        toast({
          title: "Sin permisos",
          description: "No tienes permiso para editar este artículo",
          variant: "destructive",
        });
        navigate("/admin");
      }
    }
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!isEditing) {
      setSlug(generateSlug(value));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !slug.trim()) {
      toast({
        title: "Error",
        description: "El título y el slug son obligatorios",
        variant: "destructive",
      });
      return;
    }

    // Validate category permissions
    const canAccessCat = !blogSettings.allowed_categories || 
      blogSettings.allowed_categories.includes(category);
    
    if (!canAccessCat) {
      toast({
        title: "Error",
        description: "No tienes permiso para publicar en esta categoría",
        variant: "destructive",
      });
      return;
    }

    // Check publish permission
    if (published && !hasPermission('blog', 'can_publish')) {
      toast({
        title: "Error",
        description: "No tienes permiso para publicar artículos",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    const canPublish = hasPermission('blog', 'can_publish');

    const postData = {
      title,
      slug,
      excerpt: excerpt || null,
      content: content || null,
      image_url: imageUrl || null,
      youtube_url: youtubeUrl || null,
      category,
      published: canPublish ? published : false,
      published_at: published && canPublish ? new Date().toISOString() : null,
      author_id: user?.id,
    };

    if (isEditing) {
      const { error } = await supabase
        .from("blog_posts")
        .update(postData)
        .eq("id", id);

      if (error) {
        toast({
          title: "Error",
          description: error.message.includes("duplicate") 
            ? "Ya existe un artículo con ese slug" 
            : "No se pudo actualizar el artículo",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Éxito",
          description: "Artículo actualizado correctamente",
        });
        navigate("/admin");
      }
    } else {
      const { error } = await supabase
        .from("blog_posts")
        .insert([postData]);

      if (error) {
        toast({
          title: "Error",
          description: error.message.includes("duplicate") 
            ? "Ya existe un artículo con ese slug" 
            : "No se pudo crear el artículo",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Éxito",
          description: "Artículo creado correctamente",
        });
        navigate("/admin");
      }
    }

    setLoading(false);
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <p>Cargando...</p>
        </div>
      </Layout>
    );
  }

  if (!user || (userRole !== "admin" && userRole !== "editor")) {
    return null;
  }

  return (
    <Layout>
      <section className="py-12">
        <div className="container max-w-3xl">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Link>
            </Button>
            <h1 className="font-heading text-2xl font-bold text-foreground">
              {isEditing ? "Editar Artículo" : "Nuevo Artículo"}
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-card rounded-lg p-6 shadow space-y-4">
              <div>
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Título del artículo"
                  required
                />
              </div>

              <div>
                <Label htmlFor="slug">Slug (URL) *</Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="titulo-del-articulo"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  URL: /blog/{slug || "titulo-del-articulo"}
                </p>
              </div>

              <div>
                <Label htmlFor="category">Categoría</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {blogSettings.allowed_categories && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Solo puedes publicar en las categorías asignadas
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="imageUrl">URL de Imagen</Label>
                <Input
                  id="imageUrl"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://ejemplo.com/imagen.jpg"
                />
              </div>

              <div>
                <Label htmlFor="youtubeUrl">URL de Video de YouTube</Label>
                <Input
                  id="youtubeUrl"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=XXXXXXX"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Pega la URL completa del video de YouTube
                </p>
              </div>

              <div>
                <Label htmlFor="excerpt">Extracto</Label>
                <Textarea
                  id="excerpt"
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="Breve descripción del artículo..."
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="content">Contenido</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Contenido completo del artículo..."
                  rows={10}
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Switch
                    id="published"
                    checked={published}
                    onCheckedChange={setPublished}
                    disabled={!hasPermission('blog', 'can_publish')}
                  />
                  <Label htmlFor="published" className={!hasPermission('blog', 'can_publish') ? "text-muted-foreground" : ""}>
                    {hasPermission('blog', 'can_publish') ? "Publicar artículo" : "Sin permiso para publicar"}
                  </Label>
                </div>

                <Button type="submit" disabled={loading}>
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </section>
    </Layout>
  );
};

export default AdminPostEditor;

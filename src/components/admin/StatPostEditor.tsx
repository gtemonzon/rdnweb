import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import ImageUpload from "@/components/ImageUpload";
import { toast } from "sonner";
import {
  Plus, Trash2, Loader2, Save, Search, Eye, EyeOff,
  Pencil, ArrowLeft, Calendar, ExternalLink, X
} from "lucide-react";

interface StatPost {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  content: string | null;
  category: string;
  cover_image_url: string | null;
  source_name: string | null;
  source_url: string | null;
  period_start: string | null;
  period_end: string | null;
  cutoff_date: string | null;
  methodology_notes: string | null;
  tags: string[] | null;
  published: boolean;
  published_at: string | null;
  author_id: string | null;
  created_at: string;
  updated_at: string;
}

interface StatAsset {
  id: string;
  stat_post_id: string;
  image_url: string;
  caption: string | null;
  order_index: number;
}

const generateSlug = (title: string) =>
  title
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const StatPostEditor = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [view, setView] = useState<"list" | "edit">("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPublished, setFilterPublished] = useState<"all" | "published" | "draft">("all");

  // Form state
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [cutoffDate, setCutoffDate] = useState("");
  const [methodologyNotes, setMethodologyNotes] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [published, setPublished] = useState(false);

  // Assets state
  const [assets, setAssets] = useState<{ image_url: string; caption: string; order_index: number }[]>([]);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["stat-posts-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stat_posts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as StatPost[];
    },
  });

  const { data: existingAssets = [] } = useQuery({
    queryKey: ["stat-assets", editingId],
    queryFn: async () => {
      if (!editingId) return [];
      const { data, error } = await supabase
        .from("stat_assets")
        .select("*")
        .eq("stat_post_id", editingId)
        .order("order_index");
      if (error) throw error;
      return data as StatAsset[];
    },
    enabled: !!editingId,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const tags = tagsInput.split(",").map(t => t.trim()).filter(Boolean);
      const postData = {
        title,
        slug,
        summary: summary || null,
        content: content || null,
        cover_image_url: coverImage || null,
        source_name: sourceName || null,
        source_url: sourceUrl || null,
        period_start: periodStart || null,
        period_end: periodEnd || null,
        cutoff_date: cutoffDate || null,
        methodology_notes: methodologyNotes || null,
        tags: tags.length > 0 ? tags : null,
        published,
        author_id: user?.id || null,
      };

      let postId = editingId;
      if (editingId) {
        const { error } = await supabase
          .from("stat_posts")
          .update(postData)
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("stat_posts")
          .insert(postData)
          .select("id")
          .single();
        if (error) throw error;
        postId = data.id;
      }

      // Manage assets: delete old, insert new
      if (postId) {
        await supabase.from("stat_assets").delete().eq("stat_post_id", postId);
        if (assets.length > 0) {
          const assetRows = assets.map((a, i) => ({
            stat_post_id: postId!,
            image_url: a.image_url,
            caption: a.caption || null,
            order_index: i,
          }));
          const { error } = await supabase.from("stat_assets").insert(assetRows);
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stat-posts-admin"] });
      toast.success(editingId ? "Estadística actualizada" : "Estadística creada");
      resetForm();
      setView("list");
    },
    onError: (err: any) => {
      toast.error(err.message || "Error al guardar");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("stat_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stat-posts-admin"] });
      toast.success("Estadística eliminada");
    },
  });

  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, pub }: { id: string; pub: boolean }) => {
      const { error } = await supabase
        .from("stat_posts")
        .update({ published: pub })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stat-posts-admin"] });
      toast.success("Estado actualizado");
    },
  });

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setSlug("");
    setSummary("");
    setContent("");
    setCoverImage("");
    setSourceName("");
    setSourceUrl("");
    setPeriodStart("");
    setPeriodEnd("");
    setCutoffDate("");
    setMethodologyNotes("");
    setTagsInput("");
    setPublished(false);
    setAssets([]);
  };

  const openEdit = (post: StatPost) => {
    setEditingId(post.id);
    setTitle(post.title);
    setSlug(post.slug);
    setSummary(post.summary || "");
    setContent(post.content || "");
    setCoverImage(post.cover_image_url || "");
    setSourceName(post.source_name || "");
    setSourceUrl(post.source_url || "");
    setPeriodStart(post.period_start || "");
    setPeriodEnd(post.period_end || "");
    setCutoffDate(post.cutoff_date || "");
    setMethodologyNotes(post.methodology_notes || "");
    setTagsInput((post.tags || []).join(", "));
    setPublished(post.published);
    setView("edit");
  };

  useEffect(() => {
    if (editingId && existingAssets.length > 0) {
      setAssets(existingAssets.map(a => ({
        image_url: a.image_url,
        caption: a.caption || "",
        order_index: a.order_index,
      })));
    }
  }, [existingAssets, editingId]);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!editingId) setSlug(generateSlug(val));
  };

  const filteredPosts = posts.filter(p => {
    const matchSearch = !searchTerm || p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.tags || []).some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchFilter = filterPublished === "all" ||
      (filterPublished === "published" && p.published) ||
      (filterPublished === "draft" && !p.published);
    return matchSearch && matchFilter;
  });

  if (view === "edit") {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => { resetForm(); setView("list"); }}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <CardTitle>{editingId ? "Editar Estadística" : "Nueva Estadística"}</CardTitle>
              <CardDescription>Completa los campos para la publicación estadística</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Title & Slug */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input value={title} onChange={e => handleTitleChange(e.target.value)} placeholder="Título de la estadística" />
            </div>
            <div className="space-y-2">
              <Label>Slug (URL)</Label>
              <Input value={slug} onChange={e => setSlug(e.target.value)} placeholder="slug-url" />
            </div>
          </div>

          {/* Summary */}
          <div className="space-y-2">
            <Label>Resumen</Label>
            <Textarea value={summary} onChange={e => setSummary(e.target.value)} rows={2} placeholder="Breve descripción que aparece en las tarjetas" />
          </div>

          {/* Cover Image */}
          <div className="space-y-2">
            <Label>Imagen de Portada</Label>
            <ImageUpload value={coverImage} onChange={setCoverImage} folder="statistics" aspectRatio="video" />
          </div>

          {/* Period & Dates */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Período Inicio</Label>
              <Input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Período Fin</Label>
              <Input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Fecha de Corte</Label>
              <Input type="date" value={cutoffDate} onChange={e => setCutoffDate(e.target.value)} />
            </div>
          </div>

          {/* Source */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fuente</Label>
              <Input value={sourceName} onChange={e => setSourceName(e.target.value)} placeholder="Nombre de la fuente" />
            </div>
            <div className="space-y-2">
              <Label>URL de la Fuente</Label>
              <Input value={sourceUrl} onChange={e => setSourceUrl(e.target.value)} placeholder="https://..." />
            </div>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label>Contenido (Markdown)</Label>
            <Textarea value={content} onChange={e => setContent(e.target.value)} rows={10} placeholder="Escribe el contenido detallado..." />
          </div>

          {/* Methodology */}
          <div className="space-y-2">
            <Label>Notas Metodológicas</Label>
            <Textarea value={methodologyNotes} onChange={e => setMethodologyNotes(e.target.value)} rows={3} placeholder="Metodología utilizada para la recopilación de datos..." />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Etiquetas (separadas por coma)</Label>
            <Input value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder="violencia, niñez, estadísticas" />
          </div>

          {/* Extra images */}
          <div className="space-y-3">
            <Label>Imágenes Adicionales</Label>
            {assets.map((asset, i) => (
              <div key={i} className="flex gap-3 items-start border rounded-lg p-3">
                <div className="flex-1 space-y-2">
                  <ImageUpload
                    value={asset.image_url}
                    onChange={url => {
                      const newAssets = [...assets];
                      newAssets[i].image_url = url;
                      setAssets(newAssets);
                    }}
                    folder="statistics/assets"
                    aspectRatio="video"
                  />
                  <Input
                    value={asset.caption}
                    onChange={e => {
                      const newAssets = [...assets];
                      newAssets[i].caption = e.target.value;
                      setAssets(newAssets);
                    }}
                    placeholder="Pie de imagen"
                  />
                </div>
                <Button variant="ghost" size="icon" onClick={() => setAssets(assets.filter((_, j) => j !== i))}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => setAssets([...assets, { image_url: "", caption: "", order_index: assets.length }])}>
              <Plus className="w-4 h-4 mr-2" /> Agregar Imagen
            </Button>
          </div>

          {/* Publish toggle */}
          <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/50">
            <Switch checked={published} onCheckedChange={setPublished} id="publish-toggle" />
            <Label htmlFor="publish-toggle">{published ? "Publicado" : "Borrador"}</Label>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !title || !slug}>
              {saveMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Guardar
            </Button>
            <Button variant="outline" onClick={() => { resetForm(); setView("list"); }}>Cancelar</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // List view
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Publicaciones Estadísticas</CardTitle>
            <CardDescription>Infografías y datos estadísticos mensuales</CardDescription>
          </div>
          <Button onClick={() => { resetForm(); setView("edit"); }}>
            <Plus className="w-4 h-4 mr-2" /> Nueva Estadística
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search & Filter */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Buscar por título o etiqueta..." className="pl-10" />
          </div>
          <div className="flex gap-1">
            {(["all", "published", "draft"] as const).map(f => (
              <Button
                key={f}
                variant={filterPublished === f ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterPublished(f)}
              >
                {f === "all" ? "Todos" : f === "published" ? "Publicados" : "Borradores"}
              </Button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : filteredPosts.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No hay publicaciones estadísticas.</p>
        ) : (
          <div className="space-y-3">
            {filteredPosts.map(post => (
              <div key={post.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                {post.cover_image_url && (
                  <img src={post.cover_image_url} alt="" className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground truncate">{post.title}</h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge variant={post.published ? "default" : "secondary"}>
                      {post.published ? "Publicado" : "Borrador"}
                    </Badge>
                    {post.period_start && post.period_end && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {post.period_start} — {post.period_end}
                      </span>
                    )}
                    {post.source_name && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" /> {post.source_name}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => togglePublishMutation.mutate({ id: post.id, pub: !post.published })}>
                    {post.published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(post)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm("¿Eliminar esta estadística?")) deleteMutation.mutate(post.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StatPostEditor;

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/layout/AdminLayout";
import { Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { BlogCustomSettings, allBlogCategories } from "@/types/permissions";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  category: string;
  published: boolean;
  created_at: string;
  author_id: string | null;
}

const Admin = () => {
  const { user, userRole, hasPermission, getCustomSettings, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  // Get blog-specific custom settings
  const blogSettings = getCustomSettings<BlogCustomSettings>('blog');

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user && (userRole === "admin" || userRole === "editor")) {
      fetchPosts();
    }
  }, [user, userRole]);

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from("blog_posts")
      .select("id, title, slug, category, published, created_at, author_id")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los artículos",
        variant: "destructive",
      });
    } else {
      setPosts(data || []);
    }
    setLoadingPosts(false);
  };

  const togglePublish = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("blog_posts")
      .update({ published: !currentStatus })
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Éxito",
        description: `Artículo ${!currentStatus ? "publicado" : "despublicado"}`,
      });
      fetchPosts();
    }
  };

  const deletePost = async (id: string) => {
    const { error } = await supabase
      .from("blog_posts")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el artículo",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Éxito",
        description: "Artículo eliminado",
      });
      fetchPosts();
    }
  };


  // Check if user can edit a specific post
  const canEditPost = (post: BlogPost) => {
    if (hasPermission('blog', 'can_edit_all')) return true;
    if (hasPermission('blog', 'can_edit_own') && post.author_id === user?.id) return true;
    return false;
  };

  // Check if user can delete a specific post
  const canDeletePost = (post: BlogPost) => {
    if (hasPermission('blog', 'can_delete_all')) return true;
    if (hasPermission('blog', 'can_delete_own') && post.author_id === user?.id) return true;
    return false;
  };

  // Check if user can access a category
  const canAccessCategory = (category: string) => {
    if (!blogSettings.allowed_categories) return true;
    return blogSettings.allowed_categories.includes(category);
  };

  return (
    <AdminLayout>
      <div>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
          <div>
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground">
              Blog
            </h1>
            <p className="text-muted-foreground">
              Gestiona los artículos del blog
            </p>
          </div>
          {hasPermission('blog', 'can_create') && (
            <Button asChild>
              <Link to="/admin/nuevo">
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Artículo
              </Link>
            </Button>
          )}
        </div>

          {loadingPosts ? (
            <p>Cargando artículos...</p>
          ) : posts.length === 0 ? (
            <div className="text-center py-12 bg-muted rounded-lg">
              <p className="text-muted-foreground mb-4">No hay artículos aún</p>
              {hasPermission('blog', 'can_create') && (
                <Button asChild>
                  <Link to="/admin/nuevo">
                    <Plus className="w-4 h-4 mr-2" />
                    Crear primer artículo
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="bg-card rounded-lg shadow overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {posts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell className="font-medium">{post.title}</TableCell>
                      <TableCell>{post.category}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          post.published 
                            ? "bg-green-100 text-green-800" 
                            : "bg-yellow-100 text-yellow-800"
                        }`}>
                          {post.published ? "Publicado" : "Borrador"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {new Date(post.created_at).toLocaleDateString("es-GT")}
                      </TableCell>
                        <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {hasPermission('blog', 'can_publish') && canAccessCategory(post.category) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => togglePublish(post.id, post.published)}
                              title={post.published ? "Despublicar" : "Publicar"}
                            >
                              {post.published ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </Button>
                          )}
                          {canEditPost(post) && canAccessCategory(post.category) && (
                            <Button size="sm" variant="ghost" asChild>
                              <Link to={`/admin/editar/${post.id}`}>
                                <Edit className="w-4 h-4" />
                              </Link>
                            </Button>
                          )}
                          {canDeletePost(post) && canAccessCategory(post.category) && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="ghost" className="text-destructive">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>¿Eliminar artículo?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta acción no se puede deshacer. El artículo será eliminado permanentemente.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deletePost(post.id)}>
                                    Eliminar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
      </div>
    </AdminLayout>
  );
};

export default Admin;

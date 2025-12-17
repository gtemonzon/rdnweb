import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/layout/Layout";
import { Plus, Edit, Trash2, Eye, EyeOff, LogOut } from "lucide-react";
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

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  category: string;
  published: boolean;
  created_at: string;
}

const Admin = () => {
  const { user, userRole, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

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
      .select("id, title, slug, category, published, created_at")
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
      .update({ 
        published: !currentStatus,
        published_at: !currentStatus ? new Date().toISOString() : null
      })
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

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <p>Cargando...</p>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return null;
  }

  if (userRole !== "admin" && userRole !== "editor") {
    return (
      <Layout>
        <section className="py-20 min-h-[60vh]">
          <div className="container text-center">
            <h1 className="font-heading text-2xl font-bold text-foreground mb-4">
              Sin permisos
            </h1>
            <p className="text-muted-foreground mb-6">
              No tienes permisos para acceder al panel de administración. 
              Contacta al administrador para obtener acceso.
            </p>
            <Button onClick={handleSignOut} variant="outline">
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="py-12">
        <div className="container">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="font-heading text-3xl font-bold text-foreground">
                Panel de Administración
              </h1>
              <p className="text-muted-foreground">
                Gestiona el contenido del blog
              </p>
            </div>
            <div className="flex gap-4">
              <Button asChild>
                <Link to="/admin/nuevo">
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Artículo
                </Link>
              </Button>
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Salir
              </Button>
            </div>
          </div>

          {loadingPosts ? (
            <p>Cargando artículos...</p>
          ) : posts.length === 0 ? (
            <div className="text-center py-12 bg-muted rounded-lg">
              <p className="text-muted-foreground mb-4">No hay artículos aún</p>
              <Button asChild>
                <Link to="/admin/nuevo">
                  <Plus className="w-4 h-4 mr-2" />
                  Crear primer artículo
                </Link>
              </Button>
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
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => togglePublish(post.id, post.published)}
                          >
                            {post.published ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </Button>
                          <Button size="sm" variant="ghost" asChild>
                            <Link to={`/admin/editar/${post.id}`}>
                              <Edit className="w-4 h-4" />
                            </Link>
                          </Button>
                          {userRole === "admin" && (
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
      </section>
    </Layout>
  );
};

export default Admin;

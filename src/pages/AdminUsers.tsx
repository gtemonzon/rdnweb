import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, BlogPermissions } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/layout/Layout";
import { ArrowLeft, Shield, UserCog, Trash2, Settings } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "react-router-dom";

const allCategories = ["Noticias", "Impacto", "Historias", "Prevención", "Alianzas", "Incidencia"];

interface UserWithRole {
  user_id: string;
  email: string;
  full_name: string | null;
  role: "admin" | "editor" | null;
  role_id: string | null;
  blog_permissions: BlogPermissions | null;
  blog_permissions_id: string | null;
}

const defaultPermissions: BlogPermissions = {
  can_create: true,
  can_edit_own: true,
  can_edit_all: false,
  can_publish: false,
  can_delete_own: false,
  can_delete_all: false,
  allowed_categories: null,
};

const AdminUsers = () => {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [editingPermissions, setEditingPermissions] = useState<UserWithRole | null>(null);
  const [permissionsForm, setPermissionsForm] = useState<BlogPermissions>(defaultPermissions);
  const [savingPermissions, setSavingPermissions] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user && userRole === "admin") {
      fetchUsers();
    }
  }, [user, userRole]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    
    // Fetch all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id, full_name");

    if (profilesError) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios",
        variant: "destructive",
      });
      setLoadingUsers(false);
      return;
    }

    // Fetch all user roles
    const { data: roles, error: rolesError } = await supabase
      .from("user_roles")
      .select("id, user_id, role");

    if (rolesError) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los roles",
        variant: "destructive",
      });
      setLoadingUsers(false);
      return;
    }

    // Fetch all blog permissions
    const { data: blogPerms, error: blogPermsError } = await supabase
      .from("blog_permissions")
      .select("*");

    if (blogPermsError) {
      console.error("Error fetching blog permissions:", blogPermsError);
    }

    // Combine profiles with roles and permissions
    const usersWithRoles: UserWithRole[] = (profiles || []).map((profile) => {
      const userRoleData = roles?.find((r) => r.user_id === profile.user_id);
      const userBlogPerms = blogPerms?.find((p) => p.user_id === profile.user_id);
      
      return {
        user_id: profile.user_id,
        email: "",
        full_name: profile.full_name,
        role: userRoleData?.role as "admin" | "editor" | null,
        role_id: userRoleData?.id || null,
        blog_permissions: userBlogPerms ? {
          can_create: userBlogPerms.can_create,
          can_edit_own: userBlogPerms.can_edit_own,
          can_edit_all: userBlogPerms.can_edit_all,
          can_publish: userBlogPerms.can_publish,
          can_delete_own: userBlogPerms.can_delete_own,
          can_delete_all: userBlogPerms.can_delete_all,
          allowed_categories: userBlogPerms.allowed_categories,
        } : null,
        blog_permissions_id: userBlogPerms?.id || null,
      };
    });

    setUsers(usersWithRoles);
    setLoadingUsers(false);
  };

  const assignRole = async (userId: string, role: "admin" | "editor") => {
    const existingUser = users.find((u) => u.user_id === userId);
    
    if (existingUser?.role_id) {
      const { error } = await supabase
        .from("user_roles")
        .update({ role })
        .eq("id", existingUser.role_id);

      if (error) {
        toast({
          title: "Error",
          description: "No se pudo actualizar el rol",
          variant: "destructive",
        });
        return;
      }
    } else {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role });

      if (error) {
        toast({
          title: "Error",
          description: "No se pudo asignar el rol",
          variant: "destructive",
        });
        return;
      }
    }

    // If assigning editor role for the first time, create default blog permissions
    if (role === "editor" && !existingUser?.blog_permissions_id) {
      await supabase
        .from("blog_permissions")
        .insert({
          user_id: userId,
          ...defaultPermissions,
          allowed_categories: null,
        });
    }

    toast({
      title: "Éxito",
      description: `Rol ${role} asignado correctamente`,
    });
    fetchUsers();
  };

  const removeRole = async (roleId: string, userId: string) => {
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("id", roleId);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el rol",
        variant: "destructive",
      });
      return;
    }

    // Also remove blog permissions
    await supabase
      .from("blog_permissions")
      .delete()
      .eq("user_id", userId);

    toast({
      title: "Éxito",
      description: "Rol eliminado correctamente",
    });
    fetchUsers();
  };

  const openPermissionsDialog = (userWithRole: UserWithRole) => {
    setEditingPermissions(userWithRole);
    setPermissionsForm(userWithRole.blog_permissions || defaultPermissions);
  };

  const savePermissions = async () => {
    if (!editingPermissions) return;
    
    setSavingPermissions(true);

    const permissionsData = {
      user_id: editingPermissions.user_id,
      can_create: permissionsForm.can_create,
      can_edit_own: permissionsForm.can_edit_own,
      can_edit_all: permissionsForm.can_edit_all,
      can_publish: permissionsForm.can_publish,
      can_delete_own: permissionsForm.can_delete_own,
      can_delete_all: permissionsForm.can_delete_all,
      allowed_categories: permissionsForm.allowed_categories,
    };

    if (editingPermissions.blog_permissions_id) {
      const { error } = await supabase
        .from("blog_permissions")
        .update(permissionsData)
        .eq("id", editingPermissions.blog_permissions_id);

      if (error) {
        toast({
          title: "Error",
          description: "No se pudieron guardar los permisos",
          variant: "destructive",
        });
        setSavingPermissions(false);
        return;
      }
    } else {
      const { error } = await supabase
        .from("blog_permissions")
        .insert(permissionsData);

      if (error) {
        toast({
          title: "Error",
          description: "No se pudieron crear los permisos",
          variant: "destructive",
        });
        setSavingPermissions(false);
        return;
      }
    }

    toast({
      title: "Éxito",
      description: "Permisos guardados correctamente",
    });
    setSavingPermissions(false);
    setEditingPermissions(null);
    fetchUsers();
  };

  const toggleCategory = (category: string) => {
    if (permissionsForm.allowed_categories === null) {
      // If all categories were allowed, now restrict to all except this one
      setPermissionsForm({
        ...permissionsForm,
        allowed_categories: allCategories.filter(c => c !== category),
      });
    } else if (permissionsForm.allowed_categories.includes(category)) {
      // Remove category
      const newCategories = permissionsForm.allowed_categories.filter(c => c !== category);
      setPermissionsForm({
        ...permissionsForm,
        allowed_categories: newCategories.length === 0 ? [] : newCategories,
      });
    } else {
      // Add category
      const newCategories = [...permissionsForm.allowed_categories, category];
      // If all categories are selected, set to null
      if (newCategories.length === allCategories.length) {
        setPermissionsForm({
          ...permissionsForm,
          allowed_categories: null,
        });
      } else {
        setPermissionsForm({
          ...permissionsForm,
          allowed_categories: newCategories,
        });
      }
    }
  };

  const isCategorySelected = (category: string) => {
    if (permissionsForm.allowed_categories === null) return true;
    return permissionsForm.allowed_categories.includes(category);
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

  if (userRole !== "admin") {
    return (
      <Layout>
        <section className="py-20 min-h-[60vh]">
          <div className="container text-center">
            <Shield className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h1 className="font-heading text-2xl font-bold text-foreground mb-4">
              Acceso Restringido
            </h1>
            <p className="text-muted-foreground mb-6">
              Solo los administradores pueden gestionar usuarios y roles.
            </p>
            <Button asChild variant="outline">
              <Link to="/admin">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al Panel
              </Link>
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
              <h1 className="font-heading text-3xl font-bold text-foreground flex items-center gap-3">
                <UserCog className="w-8 h-8" />
                Gestión de Usuarios
              </h1>
              <p className="text-muted-foreground">
                Asigna roles y permisos granulares a los usuarios
              </p>
            </div>
            <Button asChild variant="outline">
              <Link to="/admin">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Link>
            </Button>
          </div>

          {loadingUsers ? (
            <p>Cargando usuarios...</p>
          ) : users.length === 0 ? (
            <div className="text-center py-12 bg-muted rounded-lg">
              <p className="text-muted-foreground">No hay usuarios registrados</p>
            </div>
          ) : (
            <div className="bg-card rounded-lg shadow overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Asignar Rol</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.user_id}>
                      <TableCell className="font-medium">
                        {u.full_name || "Sin nombre"}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {u.user_id.substring(0, 8)}...
                      </TableCell>
                      <TableCell>
                        {u.role ? (
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            u.role === "admin"
                              ? "bg-primary/20 text-primary"
                              : "bg-secondary/20 text-secondary-foreground"
                          }`}>
                            {u.role === "admin" ? "Administrador" : "Editor"}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            Sin rol
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={u.role || ""}
                          onValueChange={(value) => assignRole(u.user_id, value as "admin" | "editor")}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Seleccionar" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Administrador</SelectItem>
                            <SelectItem value="editor">Editor</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {u.role === "editor" && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => openPermissionsDialog(u)}
                                >
                                  <Settings className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-md">
                                <DialogHeader>
                                  <DialogTitle>Permisos de Blog</DialogTitle>
                                  <DialogDescription>
                                    Configura los permisos granulares para {editingPermissions?.full_name || "este usuario"}
                                  </DialogDescription>
                                </DialogHeader>
                                
                                <div className="space-y-4 py-4">
                                  <div className="space-y-3">
                                    <h4 className="font-medium text-sm">Permisos de Artículos</h4>
                                    
                                    <div className="flex items-center justify-between">
                                      <Label htmlFor="can_create">Puede crear artículos</Label>
                                      <Switch
                                        id="can_create"
                                        checked={permissionsForm.can_create}
                                        onCheckedChange={(checked) => 
                                          setPermissionsForm({...permissionsForm, can_create: checked})
                                        }
                                      />
                                    </div>
                                    
                                    <div className="flex items-center justify-between">
                                      <Label htmlFor="can_edit_own">Puede editar sus artículos</Label>
                                      <Switch
                                        id="can_edit_own"
                                        checked={permissionsForm.can_edit_own}
                                        onCheckedChange={(checked) => 
                                          setPermissionsForm({...permissionsForm, can_edit_own: checked})
                                        }
                                      />
                                    </div>
                                    
                                    <div className="flex items-center justify-between">
                                      <Label htmlFor="can_edit_all">Puede editar todos los artículos</Label>
                                      <Switch
                                        id="can_edit_all"
                                        checked={permissionsForm.can_edit_all}
                                        onCheckedChange={(checked) => 
                                          setPermissionsForm({...permissionsForm, can_edit_all: checked})
                                        }
                                      />
                                    </div>
                                    
                                    <div className="flex items-center justify-between">
                                      <Label htmlFor="can_publish">Puede publicar/despublicar</Label>
                                      <Switch
                                        id="can_publish"
                                        checked={permissionsForm.can_publish}
                                        onCheckedChange={(checked) => 
                                          setPermissionsForm({...permissionsForm, can_publish: checked})
                                        }
                                      />
                                    </div>
                                    
                                    <div className="flex items-center justify-between">
                                      <Label htmlFor="can_delete_own">Puede eliminar sus artículos</Label>
                                      <Switch
                                        id="can_delete_own"
                                        checked={permissionsForm.can_delete_own}
                                        onCheckedChange={(checked) => 
                                          setPermissionsForm({...permissionsForm, can_delete_own: checked})
                                        }
                                      />
                                    </div>
                                    
                                    <div className="flex items-center justify-between">
                                      <Label htmlFor="can_delete_all">Puede eliminar todos los artículos</Label>
                                      <Switch
                                        id="can_delete_all"
                                        checked={permissionsForm.can_delete_all}
                                        onCheckedChange={(checked) => 
                                          setPermissionsForm({...permissionsForm, can_delete_all: checked})
                                        }
                                      />
                                    </div>
                                  </div>

                                  <div className="space-y-3 pt-4 border-t">
                                    <h4 className="font-medium text-sm">Categorías Permitidas</h4>
                                    <p className="text-xs text-muted-foreground">
                                      {permissionsForm.allowed_categories === null 
                                        ? "Todas las categorías están permitidas" 
                                        : `${permissionsForm.allowed_categories.length} categoría(s) seleccionada(s)`}
                                    </p>
                                    <div className="grid grid-cols-2 gap-2">
                                      {allCategories.map((category) => (
                                        <div key={category} className="flex items-center space-x-2">
                                          <Checkbox
                                            id={`cat-${category}`}
                                            checked={isCategorySelected(category)}
                                            onCheckedChange={() => toggleCategory(category)}
                                          />
                                          <Label htmlFor={`cat-${category}`} className="text-sm">
                                            {category}
                                          </Label>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                <DialogFooter>
                                  <Button 
                                    onClick={savePermissions} 
                                    disabled={savingPermissions}
                                  >
                                    {savingPermissions ? "Guardando..." : "Guardar Permisos"}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          )}
                          {u.role_id && u.user_id !== user.id && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="ghost" className="text-destructive">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>¿Eliminar rol?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    El usuario perderá acceso al panel de administración.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => removeRole(u.role_id!, u.user_id)}>
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

          <div className="mt-8 p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">Sobre los roles y permisos:</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li><strong>Administrador:</strong> Acceso total automático a todas las funciones del blog y gestión de usuarios.</li>
              <li><strong>Editor:</strong> Permisos personalizables. Haz clic en el ícono de configuración (⚙️) para gestionar sus permisos específicos.</li>
            </ul>
            <div className="mt-3 pt-3 border-t border-border">
              <h4 className="font-medium text-sm mb-1">Permisos disponibles:</h4>
              <ul className="text-xs text-muted-foreground space-y-0.5">
                <li>• <strong>Crear:</strong> Permite crear nuevos artículos</li>
                <li>• <strong>Editar propios:</strong> Permite editar artículos creados por el usuario</li>
                <li>• <strong>Editar todos:</strong> Permite editar cualquier artículo</li>
                <li>• <strong>Publicar:</strong> Permite publicar y despublicar artículos</li>
                <li>• <strong>Eliminar propios:</strong> Permite eliminar artículos creados por el usuario</li>
                <li>• <strong>Eliminar todos:</strong> Permite eliminar cualquier artículo</li>
                <li>• <strong>Categorías:</strong> Restringe las categorías en las que puede trabajar</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default AdminUsers;

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import {
  ModuleName,
  ModulePermissions,
  moduleLabels,
  permissionLabels,
  allBlogCategories,
  defaultModulePermissions,
  BlogCustomSettings,
} from "@/types/permissions";

// Available modules (implemented)
const availableModules: ModuleName[] = ['blog', 'content', 'partners', 'receipts', 'donations'];
// Future modules (shown as coming soon)
const futureModules: ModuleName[] = ['crowdfunding', 'reports'];

interface ModulePermissionsData {
  id: string | null;
  module_name: ModuleName;
  permissions: ModulePermissions;
}

interface UserWithRole {
  user_id: string;
  email: string;
  full_name: string | null;
  role: "admin" | "editor" | null;
  role_id: string | null;
  module_permissions: ModulePermissionsData[];
}

const defaultBlogPermissions: ModulePermissions = {
  can_view: true,
  can_create: true,
  can_edit_own: true,
  can_edit_all: false,
  can_publish: false,
  can_delete_own: false,
  can_delete_all: false,
  custom_settings: {},
};

const AdminUsers = () => {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [editingUser, setEditingUser] = useState<UserWithRole | null>(null);
  const [activeModule, setActiveModule] = useState<ModuleName>('blog');
  const [permissionsForm, setPermissionsForm] = useState<ModulePermissions>(defaultBlogPermissions);
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

    // Fetch all module permissions
    const { data: modulePerms, error: modulePermsError } = await supabase
      .from("module_permissions")
      .select("*");

    if (modulePermsError) {
      console.error("Error fetching module permissions:", modulePermsError);
    }

    // Combine profiles with roles and permissions
    const usersWithRoles: UserWithRole[] = (profiles || []).map((profile) => {
      const userRoleData = roles?.find((r) => r.user_id === profile.user_id);
      const userModulePerms = (modulePerms || [])
        .filter((p: any) => p.user_id === profile.user_id)
        .map((p: any) => ({
          id: p.id,
          module_name: p.module_name as ModuleName,
          permissions: {
            can_view: p.can_view,
            can_create: p.can_create,
            can_edit_own: p.can_edit_own,
            can_edit_all: p.can_edit_all,
            can_publish: p.can_publish,
            can_delete_own: p.can_delete_own,
            can_delete_all: p.can_delete_all,
            custom_settings: p.custom_settings || {},
          },
        }));
      
      return {
        user_id: profile.user_id,
        email: "",
        full_name: profile.full_name,
        role: userRoleData?.role as "admin" | "editor" | null,
        role_id: userRoleData?.id || null,
        module_permissions: userModulePerms,
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
    if (role === "editor" && !existingUser?.module_permissions.some(p => p.module_name === 'blog')) {
      await supabase
        .from("module_permissions")
        .insert({
          user_id: userId,
          module_name: 'blog',
          can_view: true,
          can_create: true,
          can_edit_own: true,
          can_edit_all: false,
          can_publish: false,
          can_delete_own: false,
          can_delete_all: false,
          custom_settings: {},
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

    // Also remove all module permissions
    await supabase
      .from("module_permissions")
      .delete()
      .eq("user_id", userId);

    toast({
      title: "Éxito",
      description: "Rol eliminado correctamente",
    });
    fetchUsers();
  };

  const openPermissionsDialog = (userWithRole: UserWithRole) => {
    setEditingUser(userWithRole);
    setActiveModule('blog');
    const blogPerms = userWithRole.module_permissions.find(p => p.module_name === 'blog');
    setPermissionsForm(blogPerms?.permissions || defaultBlogPermissions);
  };

  const handleModuleChange = (module: ModuleName) => {
    if (!editingUser) return;
    setActiveModule(module);
    const modulePerms = editingUser.module_permissions.find(p => p.module_name === module);
    setPermissionsForm(modulePerms?.permissions || defaultModulePermissions);
  };

  const savePermissions = async () => {
    if (!editingUser) return;
    
    setSavingPermissions(true);

    const existingPerm = editingUser.module_permissions.find(p => p.module_name === activeModule);

    const permissionsData = {
      user_id: editingUser.user_id,
      module_name: activeModule,
      can_view: permissionsForm.can_view,
      can_create: permissionsForm.can_create,
      can_edit_own: permissionsForm.can_edit_own,
      can_edit_all: permissionsForm.can_edit_all,
      can_publish: permissionsForm.can_publish,
      can_delete_own: permissionsForm.can_delete_own,
      can_delete_all: permissionsForm.can_delete_all,
      custom_settings: permissionsForm.custom_settings as Record<string, unknown>,
    };

    if (existingPerm?.id) {
      const { error } = await supabase
        .from("module_permissions")
        .update({
          ...permissionsData,
          custom_settings: JSON.parse(JSON.stringify(permissionsData.custom_settings)),
        })
        .eq("id", existingPerm.id);

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
        .from("module_permissions")
        .insert({
          ...permissionsData,
          custom_settings: JSON.parse(JSON.stringify(permissionsData.custom_settings)),
        });

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
      description: `Permisos de ${moduleLabels[activeModule]} guardados correctamente`,
    });
    setSavingPermissions(false);
    setEditingUser(null);
    fetchUsers();
  };

  // Blog-specific category helpers
  const toggleCategory = (category: string) => {
    const currentCategories = (permissionsForm.custom_settings as BlogCustomSettings).allowed_categories || null;
    
    if (currentCategories === null || currentCategories === undefined) {
      // If all categories were allowed, now restrict to all except this one
      setPermissionsForm({
        ...permissionsForm,
        custom_settings: {
          ...permissionsForm.custom_settings,
          allowed_categories: allBlogCategories.filter(c => c !== category),
        },
      });
    } else if (currentCategories.includes(category)) {
      // Remove category
      const newCategories = currentCategories.filter(c => c !== category);
      setPermissionsForm({
        ...permissionsForm,
        custom_settings: {
          ...permissionsForm.custom_settings,
          allowed_categories: newCategories.length === 0 ? [] : newCategories,
        },
      });
    } else {
      // Add category
      const newCategories = [...currentCategories, category];
      // If all categories are selected, set to null (all allowed)
      if (newCategories.length === allBlogCategories.length) {
        setPermissionsForm({
          ...permissionsForm,
          custom_settings: {
            ...permissionsForm.custom_settings,
            allowed_categories: null,
          },
        });
      } else {
        setPermissionsForm({
          ...permissionsForm,
          custom_settings: {
            ...permissionsForm.custom_settings,
            allowed_categories: newCategories,
          },
        });
      }
    }
  };

  const isCategorySelected = (category: string) => {
    const currentCategories = (permissionsForm.custom_settings as BlogCustomSettings).allowed_categories;
    if (currentCategories === null || currentCategories === undefined) return true;
    return currentCategories.includes(category);
  };

  const getCategoriesText = () => {
    const currentCategories = (permissionsForm.custom_settings as BlogCustomSettings).allowed_categories;
    if (currentCategories === null || currentCategories === undefined) {
      return "Todas las categorías están permitidas";
    }
    return `${currentCategories.length} categoría(s) seleccionada(s)`;
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
                Asigna roles y permisos modulares a los usuarios
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
                    <TableHead>Módulos</TableHead>
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
                        {u.role === "admin" ? (
                          <span className="text-xs text-muted-foreground">Todos</span>
                        ) : u.module_permissions.length > 0 ? (
                          <div className="flex gap-1 flex-wrap">
                            {u.module_permissions.map(p => (
                              <span key={p.module_name} className="px-1.5 py-0.5 bg-muted rounded text-xs">
                                {moduleLabels[p.module_name]}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
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
                              <DialogContent className="max-w-lg">
                                <DialogHeader>
                                  <DialogTitle>Permisos por Módulo</DialogTitle>
                                  <DialogDescription>
                                    Configura los permisos granulares para {editingUser?.full_name || "este usuario"}
                                  </DialogDescription>
                                </DialogHeader>
                                
                                <Tabs value={activeModule} onValueChange={(v) => handleModuleChange(v as ModuleName)}>
                                  <TabsList className="grid grid-cols-3 mb-4">
                                    {availableModules.map(mod => (
                                      <TabsTrigger key={mod} value={mod}>
                                        {moduleLabels[mod]}
                                      </TabsTrigger>
                                    ))}
                                    {futureModules.slice(0, 2).map(mod => (
                                      <TabsTrigger key={mod} value={mod} disabled className="opacity-50">
                                        {moduleLabels[mod]}
                                      </TabsTrigger>
                                    ))}
                                  </TabsList>
                                  
                                  {/* Blog permissions */}
                                  <TabsContent value="blog" className="space-y-4">
                                    <div className="space-y-3">
                                      <h4 className="font-medium text-sm">Permisos de Artículos</h4>
                                      
                                      {(['can_view', 'can_create', 'can_edit_own', 'can_edit_all', 'can_publish', 'can_delete_own', 'can_delete_all'] as const).map(perm => (
                                        <div key={perm} className="flex items-center justify-between">
                                          <Label htmlFor={perm}>{permissionLabels[perm]}</Label>
                                          <Switch
                                            id={perm}
                                            checked={permissionsForm[perm]}
                                            onCheckedChange={(checked) => 
                                              setPermissionsForm({...permissionsForm, [perm]: checked})
                                            }
                                          />
                                        </div>
                                      ))}
                                    </div>

                                    <div className="space-y-3 pt-4 border-t">
                                      <h4 className="font-medium text-sm">Categorías Permitidas</h4>
                                      <p className="text-xs text-muted-foreground">
                                        {getCategoriesText()}
                                      </p>
                                      <div className="grid grid-cols-2 gap-2">
                                        {allBlogCategories.map((category) => (
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
                                  </TabsContent>
                                  
                                  {/* Future modules placeholder */}
                                  {futureModules.map(mod => (
                                    <TabsContent key={mod} value={mod}>
                                      <div className="text-center py-8 text-muted-foreground">
                                        <p>Módulo de {moduleLabels[mod]} próximamente</p>
                                      </div>
                                    </TabsContent>
                                  ))}
                                </Tabs>

                                <DialogFooter>
                                  <Button 
                                    onClick={savePermissions} 
                                    disabled={savingPermissions || !availableModules.includes(activeModule)}
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
                                    El usuario perderá acceso al panel de administración y todos sus permisos de módulos.
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
            <h3 className="font-semibold mb-2">Sistema de Permisos Modular:</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li><strong>Administrador:</strong> Acceso total automático a todos los módulos y gestión de usuarios.</li>
              <li><strong>Editor:</strong> Permisos personalizables por módulo. Haz clic en ⚙️ para configurar.</li>
            </ul>
            <div className="mt-3 pt-3 border-t border-border">
              <h4 className="font-medium text-sm mb-1">Módulos disponibles:</h4>
              <div className="flex gap-2 flex-wrap mt-2">
                {availableModules.map(mod => (
                  <span key={mod} className="px-2 py-1 bg-primary/10 text-primary rounded text-xs">
                    {moduleLabels[mod]} ✓
                  </span>
                ))}
                {futureModules.map(mod => (
                  <span key={mod} className="px-2 py-1 bg-muted-foreground/10 text-muted-foreground rounded text-xs">
                    {moduleLabels[mod]} (próximamente)
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default AdminUsers;

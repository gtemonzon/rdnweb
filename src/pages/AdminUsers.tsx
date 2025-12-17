import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/layout/Layout";
import { ArrowLeft, Shield, UserCog, Trash2 } from "lucide-react";
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
import { Link } from "react-router-dom";

interface UserWithRole {
  user_id: string;
  email: string;
  full_name: string | null;
  role: "admin" | "editor" | null;
  role_id: string | null;
}

const AdminUsers = () => {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

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

    // Combine profiles with roles
    const usersWithRoles: UserWithRole[] = (profiles || []).map((profile) => {
      const userRoleData = roles?.find((r) => r.user_id === profile.user_id);
      return {
        user_id: profile.user_id,
        email: "", // We'll need to display user_id since we can't access auth.users
        full_name: profile.full_name,
        role: userRoleData?.role as "admin" | "editor" | null,
        role_id: userRoleData?.id || null,
      };
    });

    setUsers(usersWithRoles);
    setLoadingUsers(false);
  };

  const assignRole = async (userId: string, role: "admin" | "editor") => {
    // Check if user already has a role
    const existingUser = users.find((u) => u.user_id === userId);
    
    if (existingUser?.role_id) {
      // Update existing role
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
      // Insert new role
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

    toast({
      title: "Éxito",
      description: `Rol ${role} asignado correctamente`,
    });
    fetchUsers();
  };

  const removeRole = async (roleId: string) => {
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

    toast({
      title: "Éxito",
      description: "Rol eliminado correctamente",
    });
    fetchUsers();
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
                Asigna roles a los usuarios del sistema
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
                    <TableHead>Rol Actual</TableHead>
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
                                <AlertDialogAction onClick={() => removeRole(u.role_id!)}>
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="mt-8 p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">Sobre los roles:</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li><strong>Administrador:</strong> Acceso total. Puede crear, editar, eliminar artículos y gestionar usuarios.</li>
              <li><strong>Editor:</strong> Puede crear y editar artículos, pero no eliminarlos ni gestionar usuarios.</li>
            </ul>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default AdminUsers;

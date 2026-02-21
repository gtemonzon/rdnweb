import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, Link } from "react-router-dom";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, ExternalLink, GripVertical, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface Partner {
  id: string;
  name: string;
  logo_url: string | null;
  website_url: string | null;
  description: string | null;
  display_order: number;
  is_active: boolean;
}

const AdminAliados = () => {
  const { user, userRole, hasPermission, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const canManagePartners = userRole === "admin" || hasPermission("partners", "can_edit_all");

  const { data: partners, isLoading } = useQuery({
    queryKey: ["partners-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partners")
        .select("*")
        .order("display_order");
      if (error) throw error;
      return data as Partner[];
    },
    enabled: canManagePartners,
  });

  const createMutation = useMutation({
    mutationFn: async (partner: Omit<Partner, "id">) => {
      const { error } = await supabase.from("partners").insert({
        ...partner,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partners-admin"] });
      toast.success("Aliado creado correctamente");
      setIsDialogOpen(false);
    },
    onError: () => {
      toast.error("Error al crear el aliado");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (partner: Partner) => {
      const { error } = await supabase
        .from("partners")
        .update({
          name: partner.name,
          logo_url: partner.logo_url,
          website_url: partner.website_url,
          description: partner.description,
          display_order: partner.display_order,
          is_active: partner.is_active,
        })
        .eq("id", partner.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partners-admin"] });
      toast.success("Aliado actualizado correctamente");
      setIsDialogOpen(false);
      setEditingPartner(null);
    },
    onError: () => {
      toast.error("Error al actualizar el aliado");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("partners").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partners-admin"] });
      toast.success("Aliado eliminado correctamente");
    },
    onError: () => {
      toast.error("Error al eliminar el aliado");
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("partners")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partners-admin"] });
    },
    onError: () => {
      toast.error("Error al actualizar el estado");
    },
  });

  if (authLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (!user || !canManagePartners) {
    return <Navigate to="/admin" replace />;
  }

  const handleOpenDialog = (partner?: Partner) => {
    setEditingPartner(partner || null);
    setIsDialogOpen(true);
  };

  return (
    <AdminLayout>
      <div>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-8">
          <div>
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground">
              Gestión de Aliados
            </h1>
            <p className="text-muted-foreground mt-2">
              Administra los socios cooperantes del sitio web
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="w-4 h-4 mr-2" /> Nuevo Aliado
                </Button>
              </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{editingPartner ? "Editar Aliado" : "Nuevo Aliado"}</DialogTitle>
                <DialogDescription>
                  {editingPartner ? "Modifica la información del aliado" : "Agrega un nuevo socio cooperante"}
                </DialogDescription>
              </DialogHeader>
              <PartnerForm
                partner={editingPartner}
                onSave={(data) => {
                  if (editingPartner) {
                    updateMutation.mutate({ ...editingPartner, ...data });
                  } else {
                    createMutation.mutate(data);
                  }
                }}
                isSaving={createMutation.isPending || updateMutation.isPending}
              />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : partners?.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No hay aliados registrados</p>
              <Button className="mt-4" onClick={() => handleOpenDialog()}>
                <Plus className="w-4 h-4 mr-2" /> Agregar el primer aliado
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {partners?.map((partner) => (
              <Card key={partner.id} className={cn("overflow-hidden", !partner.is_active && "opacity-60")}>
                <CardContent className="flex items-center gap-4 py-4 px-4">
                  <div className="cursor-move text-muted-foreground shrink-0">
                    <GripVertical className="w-5 h-5" />
                  </div>
                  
                  <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                    {partner.logo_url && partner.logo_url !== "/placeholder.svg" ? (
                      <img 
                        src={partner.logo_url} 
                        alt={partner.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <span className="text-lg font-bold text-muted-foreground">
                        {partner.name.charAt(0)}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 overflow-hidden">
                    <h3 className="font-semibold text-foreground truncate text-sm">{partner.name}</h3>
                    {partner.description && (
                      <p className="text-xs text-muted-foreground truncate">{partner.description}</p>
                    )}
                    {partner.website_url && (
                      <a 
                        href={partner.website_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-primary flex items-center gap-1 mt-0.5 hover:underline truncate"
                      >
                        <ExternalLink className="w-3 h-3 shrink-0" /> <span className="truncate">{partner.website_url}</span>
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`active-${partner.id}`} className="text-sm text-muted-foreground">
                        Activo
                      </Label>
                      <Switch
                        id={`active-${partner.id}`}
                        checked={partner.is_active}
                        onCheckedChange={(checked) => 
                          toggleActiveMutation.mutate({ id: partner.id, is_active: checked })
                        }
                      />
                    </div>
                    
                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(partner)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => {
                        if (confirm("¿Estás seguro de eliminar este aliado?")) {
                          deleteMutation.mutate(partner.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

interface PartnerFormProps {
  partner: Partner | null;
  onSave: (data: Omit<Partner, "id">) => void;
  isSaving: boolean;
}

const PartnerForm = ({ partner, onSave, isSaving }: PartnerFormProps) => {
  const [formData, setFormData] = useState({
    name: partner?.name || "",
    logo_url: partner?.logo_url || "",
    website_url: partner?.website_url || "",
    description: partner?.description || "",
    display_order: partner?.display_order || 0,
    is_active: partner?.is_active ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nombre *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="logo_url">URL del Logo</Label>
        <Input
          id="logo_url"
          type="url"
          placeholder="https://..."
          value={formData.logo_url || ""}
          onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="website_url">Sitio Web</Label>
        <Input
          id="website_url"
          type="url"
          placeholder="https://..."
          value={formData.website_url || ""}
          onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          value={formData.description || ""}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="display_order">Orden de visualización</Label>
        <Input
          id="display_order"
          type="number"
          value={formData.display_order}
          onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
        />
      </div>

      <div className="flex items-center gap-2">
        <Switch
          id="is_active"
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
        />
        <Label htmlFor="is_active">Activo</Label>
      </div>

      <Button type="submit" className="w-full" disabled={isSaving}>
        {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
        {partner ? "Guardar Cambios" : "Crear Aliado"}
      </Button>
    </form>
  );
};

export default AdminAliados;

import { useEffect, useState } from "react";
import PdfDropZone from "@/components/PdfDropZone";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/layout/AdminLayout";
import { 
  ArrowLeft, Plus, Edit, Trash2, Eye, EyeOff, Upload, FileText, 
  Briefcase, MapPin, Calendar, ExternalLink
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { format, differenceInDays, isPast } from "date-fns";
import { es } from "date-fns/locale";
import { formatUtcCalendarDate, isoToUtcDateInputValue } from "@/lib/date";

interface JobVacancy {
  id: string;
  title: string;
  description: string | null;
  temporality: string;
  contract_type: string;
  location: string;
  application_url: string | null;
  pdf_url: string | null;
  application_deadline: string;
  published_at: string;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
}

const temporalityOptions = ["Permanente", "Temporal", "Por proyecto"];
const contractTypeOptions = ["Planilla", "Servicios técnicos/Profesionales"];
const locationOptions = [
  "Guatemala",
  "Alta Verapaz",
  "Baja Verapaz",
  "Chimaltenango",
  "Chiquimula",
  "El Progreso",
  "Escuintla",
  "Huehuetenango",
  "Izabal",
  "Jalapa",
  "Jutiapa",
  "Petén",
  "Quetzaltenango",
  "Quiché",
  "Retalhuleu",
  "Sacatepéquez",
  "San Marcos",
  "Santa Rosa",
  "Sololá",
  "Suchitepéquez",
  "Totonicapán",
  "Zacapa",
];

const AdminVacantes = () => {
  const { user, userRole, hasPermission, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [vacancies, setVacancies] = useState<JobVacancy[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  
  // Form state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVacancy, setEditingVacancy] = useState<JobVacancy | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    temporality: "Permanente",
    contract_type: "Planilla",
    location: "Guatemala",
    application_url: "",
    pdf_url: "",
    application_deadline: "",
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  

  const canView = userRole === "admin" || hasPermission("vacancies", "can_view");
  const canCreate = userRole === "admin" || hasPermission("vacancies", "can_create");
  const canEdit = userRole === "admin" || hasPermission("vacancies", "can_edit_all");
  const canDelete = userRole === "admin" || hasPermission("vacancies", "can_delete_all");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user && canView) {
      fetchVacancies();
    }
  }, [user, canView]);

  const fetchVacancies = async () => {
    setLoadingData(true);

    const { data, error } = await supabase
      .from("job_vacancies")
      .select("*")
      .order("application_deadline", { ascending: true });

    if (error) {
      console.error("Error fetching vacancies:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las vacantes",
        variant: "destructive",
      });
    } else {
      setVacancies(data || []);
    }

    setLoadingData(false);
  };

  const uploadVacancyPdf = async (file: File) => {
    setUploading(true);
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const { data, error } = await supabase.storage
      .from("vacancies-docs")
      .upload(fileName, file);
    if (error) {
      toast({ title: "Error", description: "No se pudo subir el archivo", variant: "destructive" });
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("vacancies-docs").getPublicUrl(data.path);
    setFormData((prev) => ({ ...prev, pdf_url: urlData.publicUrl }));
    setUploading(false);
    toast({ title: "Archivo subido", description: "El PDF se ha subido correctamente" });
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.application_deadline) {
      toast({
        title: "Error",
        description: "El título y la fecha límite son obligatorios",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    const vacancyData = {
      title: formData.title,
      description: formData.description || null,
      temporality: formData.temporality,
      contract_type: formData.contract_type,
      location: formData.location,
      application_url: formData.application_url || null,
      pdf_url: formData.pdf_url || null,
      application_deadline: new Date(formData.application_deadline).toISOString(),
      created_by: user?.id,
    };

    if (editingVacancy) {
      const { error } = await supabase
        .from("job_vacancies")
        .update(vacancyData)
        .eq("id", editingVacancy.id);

      if (error) {
        toast({
          title: "Error",
          description: "No se pudo actualizar la vacante",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Éxito",
          description: "Vacante actualizada",
        });
        setDialogOpen(false);
        fetchVacancies();
      }
    } else {
      const { error } = await supabase
        .from("job_vacancies")
        .insert(vacancyData);

      if (error) {
        toast({
          title: "Error",
          description: "No se pudo crear la vacante",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Éxito",
          description: "Vacante creada",
        });
        setDialogOpen(false);
        fetchVacancies();
      }
    }

    setSaving(false);
    resetForm();
  };

  const toggleActive = async (vacancy: JobVacancy) => {
    const { error } = await supabase
      .from("job_vacancies")
      .update({ is_active: !vacancy.is_active })
      .eq("id", vacancy.id);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Éxito",
        description: vacancy.is_active ? "Vacante ocultada" : "Vacante visible",
      });
      fetchVacancies();
    }
  };

  const deleteVacancy = async (id: string) => {
    const { error } = await supabase
      .from("job_vacancies")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la vacante",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Éxito",
        description: "Vacante eliminada",
      });
      fetchVacancies();
    }
  };

  const openEditDialog = (vacancy: JobVacancy) => {
    setEditingVacancy(vacancy);
    setFormData({
      title: vacancy.title,
      description: vacancy.description || "",
      temporality: vacancy.temporality,
      contract_type: vacancy.contract_type,
      location: vacancy.location,
      application_url: vacancy.application_url || "",
      pdf_url: vacancy.pdf_url || "",
      application_deadline: isoToUtcDateInputValue(vacancy.application_deadline),
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingVacancy(null);
    setFormData({
      title: "",
      description: "",
      temporality: "Permanente",
      contract_type: "Planilla",
      location: "Guatemala",
      application_url: "",
      pdf_url: "",
      application_deadline: "",
    });
  };

  const openNewDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const getStatusBadge = (vacancy: JobVacancy) => {
    const deadline = new Date(vacancy.application_deadline);
    const days = differenceInDays(deadline, new Date());
    
    if (!vacancy.is_active) {
      return <Badge variant="secondary">Inactiva</Badge>;
    }
    if (isPast(deadline)) {
      return <Badge variant="destructive">Vencida</Badge>;
    }
    if (days <= 3) {
      return <Badge variant="destructive">Vence pronto</Badge>;
    }
    if (days <= 7) {
      return <Badge className="bg-warning text-warning-foreground">Próxima</Badge>;
    }
    return <Badge className="bg-primary text-primary-foreground">Activa</Badge>;
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <p>Cargando...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!user || !canView) {
    return (
      <AdminLayout>
        <div className="text-center py-20">
          <h1 className="font-heading text-2xl font-bold text-foreground mb-4">
            Sin permisos
          </h1>
          <p className="text-muted-foreground">
            No tienes permisos para ver este módulo.
          </p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
          <div>
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
              <Briefcase className="w-8 h-8" />
              Gestión de Vacantes
            </h1>
            <p className="text-muted-foreground">
              Administra las oportunidades laborales de la institución
            </p>
          </div>
            <div className="flex gap-4">
              {canCreate && (
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={openNewDialog}>
                      <Plus className="w-4 h-4 mr-2" />
                      Nueva Vacante
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>
                        {editingVacancy ? "Editar Vacante" : "Nueva Vacante"}
                      </DialogTitle>
                      <DialogDescription>
                        {editingVacancy
                          ? "Modifica los datos de la vacante"
                          : "Completa los datos de la nueva vacante"}
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Nombre de la plaza *</Label>
                        <Input
                          id="title"
                          value={formData.title}
                          onChange={(e) =>
                            setFormData({ ...formData, title: e.target.value })
                          }
                          placeholder="Ej: Coordinador/a de Proyectos"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description">Descripción</Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) =>
                            setFormData({ ...formData, description: e.target.value })
                          }
                          placeholder="Breve descripción de la plaza..."
                          rows={3}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Temporalidad</Label>
                          <Select
                            value={formData.temporality}
                            onValueChange={(value) =>
                              setFormData({ ...formData, temporality: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {temporalityOptions.map((option) => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Tipo de contrato</Label>
                          <Select
                            value={formData.contract_type}
                            onValueChange={(value) =>
                              setFormData({ ...formData, contract_type: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {contractTypeOptions.map((option) => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Sede / Departamento</Label>
                          <Select
                            value={formData.location}
                            onValueChange={(value) =>
                              setFormData({ ...formData, location: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {locationOptions.map((option) => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="deadline">Fecha límite para postularse *</Label>
                          <Input
                            id="deadline"
                            type="date"
                            value={formData.application_deadline}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                application_deadline: e.target.value,
                              })
                            }
                            min={new Date().toISOString().split("T")[0]}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="application_url">Link para postularse</Label>
                        <Input
                          id="application_url"
                          type="url"
                          value={formData.application_url}
                          onChange={(e) =>
                            setFormData({ ...formData, application_url: e.target.value })
                          }
                          placeholder="https://forms.google.com/..."
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>PDF con detalles de la plaza</Label>
                        <PdfDropZone
                          value={formData.pdf_url}
                          onFile={uploadVacancyPdf}
                          onClear={() => setFormData((prev) => ({ ...prev, pdf_url: "" }))}
                          isUploading={uploading}
                          onError={(msg) => toast({ title: "Error", description: msg, variant: "destructive" })}
                        />
                      </div>
                    </div>

                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setDialogOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button onClick={handleSubmit} disabled={saving}>
                        {saving
                          ? "Guardando..."
                          : editingVacancy
                          ? "Actualizar"
                          : "Crear"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>

          {loadingData ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
            </div>
          ) : vacancies.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No hay vacantes registradas</p>
              {canCreate && (
                <Button className="mt-4" onClick={openNewDialog}>
                  <Plus className="w-4 h-4 mr-2" />
                  Crear primera vacante
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-lg border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vacante</TableHead>
                    <TableHead>Sede</TableHead>
                    <TableHead>Contrato</TableHead>
                    <TableHead>Fecha Límite</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vacancies.map((vacancy) => (
                    <TableRow key={vacancy.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{vacancy.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {vacancy.temporality}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          {vacancy.location}
                        </span>
                      </TableCell>
                      <TableCell>{vacancy.contract_type}</TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          {formatUtcCalendarDate(vacancy.application_deadline, "d MMM yyyy", es)}
                        </span>
                      </TableCell>
                      <TableCell>{getStatusBadge(vacancy)}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          {vacancy.pdf_url && (
                            <Button
                              variant="ghost"
                              size="icon"
                              asChild
                              title="Ver PDF"
                            >
                              <a
                                href={vacancy.pdf_url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <FileText className="w-4 h-4" />
                              </a>
                            </Button>
                          )}
                          {vacancy.application_url && (
                            <Button
                              variant="ghost"
                              size="icon"
                              asChild
                              title="Link de postulación"
                            >
                              <a
                                href={vacancy.application_url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </Button>
                          )}
                          {canEdit && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => toggleActive(vacancy)}
                                title={
                                  vacancy.is_active
                                    ? "Ocultar vacante"
                                    : "Mostrar vacante"
                                }
                              >
                                {vacancy.is_active ? (
                                  <EyeOff className="w-4 h-4" />
                                ) : (
                                  <Eye className="w-4 h-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditDialog(vacancy)}
                                title="Editar"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          {canDelete && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title="Eliminar"
                                >
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    ¿Eliminar vacante?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta acción no se puede deshacer. Se eliminará
                                    permanentemente la vacante "{vacancy.title}".
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteVacancy(vacancy.id)}
                                    className="bg-destructive hover:bg-destructive/90"
                                  >
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

export default AdminVacantes;

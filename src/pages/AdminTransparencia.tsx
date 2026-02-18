import { useEffect, useState } from "react";
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
  Download, Search, Filter, ChevronDown, Link as LinkIcon, GripVertical, Save, X
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface RegistroCertificacion {
  label: string;
  url: string;
  pdf_url: string;
  link_type: "url" | "pdf";
  is_active: boolean;
}

interface Numeral {
  id: number;
  title: string;
  description: string | null;
  is_active: boolean;
  display_order: number;
}

interface TransparencyDocument {
  id: string;
  numeral_id: number;
  year: number;
  title: string;
  description: string | null;
  file_url: string;
  file_type: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  created_by: string | null;
  numeral?: Numeral;
  profile?: {
    full_name: string | null;
  };
}

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

const AdminTransparencia = () => {
  const { user, userRole, hasPermission, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [numerals, setNumerals] = useState<Numeral[]>([]);
  const [documents, setDocuments] = useState<TransparencyDocument[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  
  // Registros y Certificaciones state
  const [registros, setRegistros] = useState<RegistroCertificacion[]>([]);
  const [registrosSaving, setRegistrosSaving] = useState(false);
  const [uploadingPdfIdx, setUploadingPdfIdx] = useState<number | null>(null);

  // Filters
  const [filterNumeral, setFilterNumeral] = useState<string>("all");
  const [filterYear, setFilterYear] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Form state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<TransparencyDocument | null>(null);
  const [formData, setFormData] = useState({
    numeral_id: "",
    year: currentYear.toString(),
    title: "",
    description: "",
    file_url: "",
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const canView = userRole === "admin" || hasPermission("transparency", "can_view");
  const canCreate = userRole === "admin" || hasPermission("transparency", "can_create");
  const canEdit = userRole === "admin" || hasPermission("transparency", "can_edit_all");
  const canDelete = userRole === "admin" || hasPermission("transparency", "can_delete_all");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user && canView) {
      fetchData();
    }
  }, [user, canView]);

  const saveRegistros = async (items: RegistroCertificacion[]) => {
    setRegistrosSaving(true);
    const { error } = await supabase
      .from("site_content")
      .upsert(
        [{ section_key: "registros_certificaciones", title: "Registros y Certificaciones", content: JSON.parse(JSON.stringify(items)) }],
        { onConflict: "section_key" }
      );
    if (error) {
      toast({ title: "Error", description: "No se pudieron guardar los registros", variant: "destructive" });
    } else {
      toast({ title: "Guardado", description: "Registros y certificaciones actualizados" });
    }
    setRegistrosSaving(false);
  };

  const fetchData = async () => {
    // Fetch registros y certificaciones
    const { data: registrosData } = await supabase
      .from("site_content")
      .select("content")
      .eq("section_key", "registros_certificaciones")
      .maybeSingle();

    if (registrosData?.content && Array.isArray(registrosData.content)) {
      setRegistros(registrosData.content as unknown as RegistroCertificacion[]);
    } else {
      setRegistros([
        { label: "Registro de ONG", url: "", pdf_url: "", link_type: "url", is_active: true },
        { label: "Certificación SAT", url: "", pdf_url: "", link_type: "url", is_active: true },
        { label: "Código de Ética", url: "", pdf_url: "", link_type: "url", is_active: true },
        { label: "Política Anticorrupción", url: "", pdf_url: "", link_type: "url", is_active: true },
      ]);
    }
    setLoadingData(true);

    // Fetch numerals
    const { data: numeralsData, error: numeralsError } = await supabase
      .from("transparency_numerals")
      .select("*")
      .order("display_order");

    if (numeralsError) {
      console.error("Error fetching numerals:", numeralsError);
    } else {
      setNumerals(numeralsData || []);
    }

    // Fetch documents
    const { data: docsData, error: docsError } = await supabase
      .from("transparency_documents")
      .select("*")
      .order("year", { ascending: false })
      .order("display_order");

    if (docsError) {
      console.error("Error fetching documents:", docsError);
      setDocuments([]);
    } else {
      // Fetch profiles for each document
      const userIds = [...new Set((docsData || []).filter(d => d.created_by).map(d => d.created_by))];
      
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", userIds);
        
        const profilesMap = new Map(
          (profilesData || []).map(p => [p.user_id, p.full_name])
        );
        
        const docsWithProfiles = (docsData || []).map(doc => ({
          ...doc,
          profile: doc.created_by ? { full_name: profilesMap.get(doc.created_by) || null } : undefined
        }));
        
        setDocuments(docsWithProfiles);
      } else {
        setDocuments(docsData || []);
      }
    }

    setLoadingData(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast({
        title: "Error",
        description: "Solo se permiten archivos PDF",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "El archivo no puede superar 10MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const { data, error } = await supabase.storage
      .from("transparency-docs")
      .upload(fileName, file);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo subir el archivo",
        variant: "destructive",
      });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("transparency-docs")
      .getPublicUrl(data.path);

    setFormData({ ...formData, file_url: urlData.publicUrl });
    setUploading(false);

    toast({
      title: "Archivo subido",
      description: "El PDF se ha subido correctamente",
    });
  };

  const handleFileDrop = async (file: File) => {
    if (file.type !== "application/pdf") {
      toast({
        title: "Error",
        description: "Solo se permiten archivos PDF",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "El archivo no puede superar 10MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const { data, error } = await supabase.storage
      .from("transparency-docs")
      .upload(fileName, file);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo subir el archivo",
        variant: "destructive",
      });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("transparency-docs")
      .getPublicUrl(data.path);

    setFormData({ ...formData, file_url: urlData.publicUrl });
    setUploading(false);

    toast({
      title: "Archivo subido",
      description: "El PDF se ha subido correctamente",
    });
  };

  const handleSubmit = async () => {
    if (!formData.numeral_id || !formData.year || !formData.title || !formData.file_url) {
      toast({
        title: "Error",
        description: "Completa todos los campos obligatorios",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    const docData = {
      numeral_id: parseInt(formData.numeral_id),
      year: parseInt(formData.year),
      title: formData.title,
      description: formData.description || null,
      file_url: formData.file_url,
      file_type: "pdf",
      created_by: user?.id,
    };

    if (editingDoc) {
      const { error } = await supabase
        .from("transparency_documents")
        .update(docData)
        .eq("id", editingDoc.id);

      if (error) {
        toast({
          title: "Error",
          description: "No se pudo actualizar el documento",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Éxito",
          description: "Documento actualizado",
        });
        setDialogOpen(false);
        fetchData();
      }
    } else {
      const { error } = await supabase
        .from("transparency_documents")
        .insert(docData);

      if (error) {
        toast({
          title: "Error",
          description: "No se pudo crear el documento",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Éxito",
          description: "Documento creado",
        });
        setDialogOpen(false);
        fetchData();
      }
    }

    setSaving(false);
    resetForm();
  };

  const toggleActive = async (doc: TransparencyDocument) => {
    const { error } = await supabase
      .from("transparency_documents")
      .update({ is_active: !doc.is_active })
      .eq("id", doc.id);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Éxito",
        description: doc.is_active ? "Documento ocultado" : "Documento visible",
      });
      fetchData();
    }
  };

  const deleteDocument = async (id: string) => {
    const { error } = await supabase
      .from("transparency_documents")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el documento",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Éxito",
        description: "Documento eliminado",
      });
      fetchData();
    }
  };

  const openEditDialog = (doc: TransparencyDocument) => {
    setEditingDoc(doc);
    setFormData({
      numeral_id: doc.numeral_id.toString(),
      year: doc.year.toString(),
      title: doc.title,
      description: doc.description || "",
      file_url: doc.file_url,
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingDoc(null);
    setFormData({
      numeral_id: "",
      year: currentYear.toString(),
      title: "",
      description: "",
      file_url: "",
    });
  };

  const openNewDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  // Filter documents
  const filteredDocuments = documents.filter((doc) => {
    if (filterNumeral !== "all" && doc.numeral_id.toString() !== filterNumeral) return false;
    if (filterYear !== "all" && doc.year.toString() !== filterYear) return false;
    if (searchQuery && !doc.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Group documents by numeral for display
  const groupedByNumeral = filteredDocuments.reduce((acc, doc) => {
    const key = doc.numeral_id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(doc);
    return acc;
  }, {} as Record<number, TransparencyDocument[]>);

  const getNumeralTitle = (id: number) => {
    const numeral = numerals.find((n) => n.id === id);
    return numeral ? `${numeral.id}. ${numeral.title}` : `Numeral ${id}`;
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
              <FileText className="w-8 h-8" />
              Transparencia - LAIP Art. 10
            </h1>
            <p className="text-muted-foreground">
              Gestiona los documentos de información pública de oficio
            </p>
          </div>
            <div className="flex gap-4">
              {canCreate && (
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={openNewDialog}>
                      <Plus className="w-4 h-4 mr-2" />
                      Nuevo Documento
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>
                        {editingDoc ? "Editar Documento" : "Nuevo Documento"}
                      </DialogTitle>
                      <DialogDescription>
                        Sube un documento PDF de transparencia
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="numeral">Numeral LAIP *</Label>
                        <Select
                          value={formData.numeral_id}
                          onValueChange={(v) => setFormData({ ...formData, numeral_id: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona el numeral" />
                          </SelectTrigger>
                          <SelectContent>
                            {numerals.filter(n => n.is_active).map((n) => (
                              <SelectItem key={n.id} value={n.id.toString()}>
                                {n.id}. {n.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="year">Año *</Label>
                        <Select
                          value={formData.year}
                          onValueChange={(v) => setFormData({ ...formData, year: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona el año" />
                          </SelectTrigger>
                          <SelectContent>
                            {years.map((y) => (
                              <SelectItem key={y} value={y.toString()}>
                                {y}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="title">Título del documento *</Label>
                        <Input
                          id="title"
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          placeholder="Ej: Organigrama 2024"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description">Descripción (opcional)</Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          placeholder="Breve descripción del documento"
                          rows={2}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Archivo PDF *</Label>
                        {formData.file_url ? (
                          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                            <FileText className="w-5 h-5 text-primary" />
                            <span className="text-sm flex-1 truncate">
                              {formData.file_url.split("/").pop()}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setFormData({ ...formData, file_url: "" })}
                            >
                              Cambiar
                            </Button>
                          </div>
                        ) : (
                          <div 
                            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                              isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
                            }`}
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setIsDragging(true);
                            }}
                            onDragEnter={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setIsDragging(true);
                            }}
                            onDragLeave={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setIsDragging(false);
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setIsDragging(false);
                              const file = e.dataTransfer.files?.[0];
                              if (file) {
                                handleFileDrop(file);
                              }
                            }}
                          >
                            <input
                              type="file"
                              accept=".pdf"
                              onChange={handleFileUpload}
                              className="hidden"
                              id="pdf-upload"
                              disabled={uploading}
                            />
                            <label
                              htmlFor="pdf-upload"
                              className="cursor-pointer flex flex-col items-center gap-2"
                            >
                              <Upload className={`w-8 h-8 ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
                              <span className={`text-sm ${isDragging ? "text-primary font-medium" : "text-muted-foreground"}`}>
                                {uploading ? "Subiendo..." : isDragging ? "Suelta el archivo aquí" : "Arrastra un PDF o haz clic para subir"}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                Máximo 10MB
                              </span>
                            </label>
                          </div>
                        )}
                      </div>
                    </div>

                    <DialogFooter>
                      <Button variant="outline" onClick={() => setDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleSubmit} disabled={saving || uploading}>
                        {saving ? "Guardando..." : editingDoc ? "Actualizar" : "Crear"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={filterNumeral} onValueChange={setFilterNumeral}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filtrar por numeral" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los numerales</SelectItem>
                  {numerals.filter(n => n.is_active).map((n) => (
                    <SelectItem key={n.id} value={n.id.toString()}>
                      {n.id}. {n.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Select value={filterYear} onValueChange={setFilterYear}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Año" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los años</SelectItem>
                {years.map((y) => (
                  <SelectItem key={y} value={y.toString()}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar documento..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Documents table */}
          {loadingData ? (
            <p>Cargando documentos...</p>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-12 bg-muted rounded-lg">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No hay documentos</p>
              {canCreate && (
                <Button onClick={openNewDialog}>
                  <Plus className="w-4 h-4 mr-2" />
                  Subir primer documento
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedByNumeral)
                .sort(([a], [b]) => parseInt(a) - parseInt(b))
                .map(([numeralId, docs]) => (
                  <Collapsible key={numeralId} defaultOpen>
                    <CollapsibleTrigger className="flex items-center gap-2 w-full p-3 bg-card rounded-lg hover:bg-muted transition-colors">
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      <span className="font-medium">{getNumeralTitle(parseInt(numeralId))}</span>
                      <span className="ml-auto text-sm text-muted-foreground">
                        {docs.length} documento(s)
                      </span>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="mt-2 bg-card rounded-lg shadow overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Título</TableHead>
                              <TableHead>Año</TableHead>
                              <TableHead>Estado</TableHead>
                              <TableHead>Subido por</TableHead>
                              <TableHead>Fecha y hora</TableHead>
                              <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {docs.map((doc) => (
                              <TableRow key={doc.id}>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-primary" />
                                    <span className="font-medium">{doc.title}</span>
                                  </div>
                                </TableCell>
                                <TableCell>{doc.year}</TableCell>
                                <TableCell>
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs ${
                                      doc.is_active
                                        ? "bg-green-100 text-green-800"
                                        : "bg-yellow-100 text-yellow-800"
                                    }`}
                                  >
                                    {doc.is_active ? "Visible" : "Oculto"}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm text-muted-foreground">
                                    {doc.profile?.full_name || "—"}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm">
                                    <div>{new Date(doc.created_at).toLocaleDateString("es-GT")}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {new Date(doc.created_at).toLocaleTimeString("es-GT", { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      asChild
                                      title="Descargar"
                                    >
                                      <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                                        <Download className="w-4 h-4" />
                                      </a>
                                    </Button>
                                    {canEdit && (
                                      <>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => toggleActive(doc)}
                                          title={doc.is_active ? "Ocultar" : "Mostrar"}
                                        >
                                          {doc.is_active ? (
                                            <EyeOff className="w-4 h-4" />
                                          ) : (
                                            <Eye className="w-4 h-4" />
                                          )}
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => openEditDialog(doc)}
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
                                            size="sm"
                                            variant="ghost"
                                            className="text-destructive"
                                            title="Eliminar"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>¿Eliminar documento?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                              Esta acción no se puede deshacer. El documento será eliminado permanentemente.
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => deleteDocument(doc.id)}>
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
                    </CollapsibleContent>
                  </Collapsible>
                ))}
            </div>
          )}

          {/* Stats */}
          <div className="mt-8 p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">Resumen:</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Total documentos:</span>{" "}
                <strong>{documents.length}</strong>
              </div>
              <div>
                <span className="text-muted-foreground">Visibles:</span>{" "}
                <strong>{documents.filter((d) => d.is_active).length}</strong>
              </div>
              <div>
                <span className="text-muted-foreground">Numerales activos:</span>{" "}
                <strong>{numerals.filter((n) => n.is_active).length}</strong>
              </div>
              <div>
                <span className="text-muted-foreground">Años cubiertos:</span>{" "}
                <strong>{new Set(documents.map((d) => d.year)).size}</strong>
              </div>
            </div>
          </div>

          {/* ── Registros y Certificaciones editor ── */}
          <div className="mt-10 p-6 bg-card rounded-xl shadow-sm border border-border">
            <div className="flex items-center gap-3 mb-6">
              <LinkIcon className="w-5 h-5 text-primary" />
              <div>
                <h2 className="font-heading text-lg font-bold text-foreground">
                  Registros y Certificaciones
                </h2>
                <p className="text-sm text-muted-foreground">
                  Gestiona los enlaces que aparecen en la sección "Registros y Certificaciones" de la página pública.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {registros.map((reg, idx) => {
                const updateReg = (patch: Partial<RegistroCertificacion>) => {
                  const updated = [...registros];
                  updated[idx] = { ...updated[idx], ...patch };
                  setRegistros(updated);
                };

                const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.type !== "application/pdf") {
                    toast({ title: "Error", description: "Solo se permiten archivos PDF", variant: "destructive" });
                    return;
                  }
                  if (file.size > 10 * 1024 * 1024) {
                    toast({ title: "Error", description: "El archivo no puede superar 10MB", variant: "destructive" });
                    return;
                  }
                  setUploadingPdfIdx(idx);
                  const fileName = `registros/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
                  const { data, error } = await supabase.storage.from("transparency-docs").upload(fileName, file);
                  if (error) {
                    toast({ title: "Error", description: "No se pudo subir el PDF", variant: "destructive" });
                  } else {
                    const { data: urlData } = supabase.storage.from("transparency-docs").getPublicUrl(data.path);
                    updateReg({ pdf_url: urlData.publicUrl });
                    toast({ title: "PDF subido", description: file.name });
                  }
                  setUploadingPdfIdx(null);
                  e.target.value = "";
                };

                return (
                  <div key={idx} className="rounded-lg bg-muted/40 border border-border p-4 space-y-3">
                    {/* Label + controls row */}
                    <div className="flex items-center gap-2">
                      <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
                      <Input
                        className="flex-1"
                        placeholder="Nombre (ej: Registro de ONG)"
                        value={reg.label}
                        onChange={(e) => updateReg({ label: e.target.value })}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        title={reg.is_active ? "Ocultar en página pública" : "Mostrar en página pública"}
                        onClick={() => updateReg({ is_active: !reg.is_active })}
                      >
                        {reg.is_active ? (
                          <Eye className="w-4 h-4 text-primary" />
                        ) : (
                          <EyeOff className="w-4 h-4 text-muted-foreground" />
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setRegistros(registros.filter((_, i) => i !== idx))}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Link type selector */}
                    <div className="flex gap-2 ml-6">
                      <button
                        type="button"
                        onClick={() => updateReg({ link_type: "url" })}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${
                          reg.link_type === "url"
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background text-muted-foreground border-border hover:bg-muted"
                        }`}
                      >
                        <LinkIcon className="w-3.5 h-3.5" />
                        URL externa
                      </button>
                      <button
                        type="button"
                        onClick={() => updateReg({ link_type: "pdf" })}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${
                          reg.link_type === "pdf"
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background text-muted-foreground border-border hover:bg-muted"
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Archivo PDF
                      </button>
                    </div>

                    {/* Conditional input */}
                    <div className="ml-6">
                      {reg.link_type === "url" ? (
                        <Input
                          placeholder="https://..."
                          value={reg.url}
                          onChange={(e) => updateReg({ url: e.target.value })}
                        />
                      ) : (
                        <div>
                          {reg.pdf_url ? (
                            <div className="flex items-center gap-2 p-3 bg-background rounded-lg border border-border">
                              <FileText className="w-4 h-4 text-primary shrink-0" />
                              <span className="text-sm flex-1 truncate text-foreground">
                                {reg.pdf_url.split("/").pop()}
                              </span>
                              <a
                                href={reg.pdf_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline shrink-0"
                              >
                                Ver
                              </a>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-muted-foreground shrink-0"
                                onClick={() => updateReg({ pdf_url: "" })}
                              >
                                <X className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          ) : (
                            <label className={`flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${
                              uploadingPdfIdx === idx
                                ? "border-primary/50 bg-primary/5"
                                : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
                            }`}>
                              <input
                                type="file"
                                accept=".pdf"
                                className="hidden"
                                disabled={uploadingPdfIdx !== null}
                                onChange={handlePdfUpload}
                              />
                              {uploadingPdfIdx === idx ? (
                                <span className="text-sm text-muted-foreground">Subiendo PDF...</span>
                              ) : (
                                <>
                                  <Upload className="w-5 h-5 text-muted-foreground" />
                                  <span className="text-sm text-muted-foreground">
                                    Arrastra o haz clic para subir un PDF (máx. 10MB)
                                  </span>
                                </>
                              )}
                            </label>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3 mt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRegistros([...registros, { label: "", url: "", pdf_url: "", link_type: "url", is_active: true }])}
              >
                <Plus className="w-4 h-4 mr-1" />
                Agregar enlace
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={registrosSaving}
                onClick={() => saveRegistros(registros)}
              >
                <Save className="w-4 h-4 mr-1" />
                {registrosSaving ? "Guardando..." : "Guardar cambios"}
              </Button>
            </div>
          </div>
        </div>
      </AdminLayout>
  );
};

export default AdminTransparencia;

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/layout/Layout";
import { 
  ArrowLeft, Plus, Edit, Trash2, Eye, EyeOff, Upload, FileText, 
  Download, Search, Filter, ChevronDown 
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
  numeral?: Numeral;
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

  const fetchData = async () => {
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
    } else {
      setDocuments(docsData || []);
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
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <p>Cargando...</p>
        </div>
      </Layout>
    );
  }

  if (!user || !canView) {
    return (
      <Layout>
        <section className="py-20 min-h-[60vh]">
          <div className="container text-center">
            <h1 className="font-heading text-2xl font-bold text-foreground mb-4">
              Sin permisos
            </h1>
            <p className="text-muted-foreground mb-6">
              No tienes permisos para ver este módulo.
            </p>
            <Button asChild variant="outline">
              <Link to="/admin">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
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
                  <DialogContent className="max-w-lg">
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
                          <div className="border-2 border-dashed rounded-lg p-6 text-center">
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
                              <Upload className="w-8 h-8 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                {uploading ? "Subiendo..." : "Haz clic para subir un PDF"}
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
              <Button asChild variant="outline">
                <Link to="/admin">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver
                </Link>
              </Button>
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
                              <TableHead>Fecha</TableHead>
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
                                  {new Date(doc.created_at).toLocaleDateString("es-GT")}
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
        </div>
      </section>
    </Layout>
  );
};

export default AdminTransparencia;

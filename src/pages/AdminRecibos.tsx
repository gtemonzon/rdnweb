import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/layout/AdminLayout";
import {
  ArrowLeft,
  Plus,
  Receipt,
  Search,
  Download,
  Send,
  FileText,
  Settings,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface DonationReceipt {
  id: string;
  receipt_type: string;
  serie: string | null;
  numero: string | null;
  uuid_sat: string | null;
  receptor_nit: string;
  receptor_nombre: string;
  receptor_direccion: string | null;
  receptor_correo: string | null;
  monto: number;
  descripcion: string;
  status: string;
  error_message: string | null;
  pdf_url: string | null;
  created_at: string;
  certified_at: string | null;
}

interface FELConfiguration {
  id: string;
  nit_emisor: string;
  nombre_comercial: string;
  nombre_emisor: string;
  direccion: string;
  municipio: string;
  departamento: string;
  ambiente: string;
  activo: boolean;
}

interface ReceiptFormData {
  receipt_type: string;
  receptor_nit: string;
  receptor_nombre: string;
  receptor_direccion: string;
  receptor_correo: string;
  monto: string;
  descripcion: string;
}

const initialFormData: ReceiptFormData = {
  receipt_type: "donacion",
  receptor_nit: "",
  receptor_nombre: "",
  receptor_direccion: "",
  receptor_correo: "",
  monto: "",
  descripcion: "",
};

const AdminRecibos = () => {
  const { user, userRole, hasPermission, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [receipts, setReceipts] = useState<DonationReceipt[]>([]);
  const [felConfig, setFelConfig] = useState<FELConfiguration | null>(null);
  const [loadingReceipts, setLoadingReceipts] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<ReceiptFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    certified: 0,
    pending: 0,
    totalAmount: 0,
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user && (userRole === "admin" || hasPermission("receipts", "can_view"))) {
      fetchReceipts();
      fetchFELConfig();
    }
  }, [user, userRole]);

  const fetchReceipts = async () => {
    setLoadingReceipts(true);
    const { data, error } = await supabase
      .from("donation_receipts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los recibos",
        variant: "destructive",
      });
    } else {
      setReceipts(data || []);
      calculateStats(data || []);
    }
    setLoadingReceipts(false);
  };

  const fetchFELConfig = async () => {
    const { data } = await supabase
      .from("fel_configuration")
      .select("*")
      .eq("activo", true)
      .maybeSingle();
    
    setFelConfig(data);
  };

  const calculateStats = (data: DonationReceipt[]) => {
    const certified = data.filter((r) => r.status === "certified").length;
    const pending = data.filter((r) => r.status === "pending").length;
    const totalAmount = data
      .filter((r) => r.status === "certified")
      .reduce((sum, r) => sum + Number(r.monto), 0);

    setStats({
      total: data.length,
      certified,
      pending,
      totalAmount,
    });
  };

  const handleInputChange = (field: keyof ReceiptFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateNIT = (nit: string): boolean => {
    // Basic NIT validation for Guatemala
    const cleanNIT = nit.replace(/[^0-9K]/gi, "").toUpperCase();
    if (cleanNIT === "CF") return true;
    if (cleanNIT.length < 2) return false;
    return true;
  };

  const handleSubmit = async () => {
    // Validate form
    if (!formData.receptor_nit || !formData.receptor_nombre || !formData.monto || !formData.descripcion) {
      toast({
        title: "Error",
        description: "Por favor complete todos los campos requeridos",
        variant: "destructive",
      });
      return;
    }

    if (!validateNIT(formData.receptor_nit)) {
      toast({
        title: "Error",
        description: "El NIT ingresado no es válido",
        variant: "destructive",
      });
      return;
    }

    const monto = parseFloat(formData.monto);
    if (isNaN(monto) || monto <= 0) {
      toast({
        title: "Error",
        description: "El monto debe ser un número mayor a 0",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    // Insert the receipt with pending status
    const { error } = await supabase.from("donation_receipts").insert({
      receipt_type: formData.receipt_type,
      receptor_nit: formData.receptor_nit.toUpperCase(),
      receptor_nombre: formData.receptor_nombre,
      receptor_direccion: formData.receptor_direccion || null,
      receptor_correo: formData.receptor_correo || null,
      monto: monto,
      descripcion: formData.descripcion,
      status: "pending",
      created_by: user?.id,
    });

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo crear el recibo",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Éxito",
        description: "Recibo creado. Pendiente de certificación con Guatefacturas.",
      });
      setFormData(initialFormData);
      setIsDialogOpen(false);
      fetchReceipts();
    }

    setIsSubmitting(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "certified":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle className="w-3 h-3 mr-1" />
            Certificado
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            <Clock className="w-3 h-3 mr-1" />
            Pendiente
          </Badge>
        );
      case "error":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            <AlertCircle className="w-3 h-3 mr-1" />
            Error
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
            <XCircle className="w-3 h-3 mr-1" />
            Anulado
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const filteredReceipts = receipts.filter((receipt) => {
    const matchesSearch =
      receipt.receptor_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.receptor_nit.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (receipt.uuid_sat && receipt.uuid_sat.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || receipt.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const exportToCSV = () => {
    const headers = ["Fecha", "Tipo", "NIT", "Nombre", "Monto", "Estado", "UUID SAT"];
    const rows = filteredReceipts.map((r) => [
      new Date(r.created_at).toLocaleDateString("es-GT"),
      r.receipt_type === "donacion" ? "Donación" : "Convenio",
      r.receptor_nit,
      r.receptor_nombre,
      r.monto.toString(),
      r.status,
      r.uuid_sat || "",
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `recibos_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const canCreate = userRole === "admin" || hasPermission("receipts", "can_create");

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <p>Cargando...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!user) {
    return null;
  }

  if (userRole !== "admin" && !hasPermission("receipts", "can_view")) {
    return (
      <AdminLayout>
        <div className="text-center py-20">
          <Receipt className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="font-heading text-2xl font-bold text-foreground mb-4">
            Acceso Restringido
          </h1>
          <p className="text-muted-foreground">
            No tienes permisos para acceder al módulo de recibos.
          </p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div>
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
            <Receipt className="w-8 h-8" />
            Recibos FEL
          </h1>
          <p className="text-muted-foreground">
            Gestión de recibos de donación y convenios
          </p>
        </div>

          <Tabs defaultValue="receipts" className="space-y-6">
            <TabsList>
              <TabsTrigger value="receipts">Recibos</TabsTrigger>
              <TabsTrigger value="config">Configuración FEL</TabsTrigger>
            </TabsList>

            <TabsContent value="receipts" className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Total Recibos</CardDescription>
                    <CardTitle className="text-2xl">{stats.total}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Certificados</CardDescription>
                    <CardTitle className="text-2xl text-green-600">{stats.certified}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Pendientes</CardDescription>
                    <CardTitle className="text-2xl text-yellow-600">{stats.pending}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Monto Total Certificado</CardDescription>
                    <CardTitle className="text-2xl">
                      Q{stats.totalAmount.toLocaleString("es-GT", { minimumFractionDigits: 2 })}
                    </CardTitle>
                  </CardHeader>
                </Card>
              </div>

              {/* Actions Bar */}
              <div className="flex flex-col md:flex-row gap-4 justify-between">
                <div className="flex gap-4 flex-1">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Buscar por nombre, NIT o UUID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="pending">Pendiente</SelectItem>
                      <SelectItem value="certified">Certificado</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                      <SelectItem value="cancelled">Anulado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={exportToCSV}>
                    <Download className="w-4 h-4 mr-2" />
                    Exportar CSV
                  </Button>
                  {canCreate && (
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="w-4 h-4 mr-2" />
                          Nuevo Recibo
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg">
                        <DialogHeader>
                          <DialogTitle>Emitir Nuevo Recibo</DialogTitle>
                          <DialogDescription>
                            Complete los datos para generar un recibo de donación o convenio.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>Tipo de Recibo *</Label>
                            <Select
                              value={formData.receipt_type}
                              onValueChange={(v) => handleInputChange("receipt_type", v)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="donacion">Recibo por Donación</SelectItem>
                                <SelectItem value="convenio">Recibo por Convenio de Cooperación</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>NIT del Receptor *</Label>
                              <Input
                                placeholder="12345678-9 o CF"
                                value={formData.receptor_nit}
                                onChange={(e) => handleInputChange("receptor_nit", e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Monto (Q) *</Label>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                value={formData.monto}
                                onChange={(e) => handleInputChange("monto", e.target.value)}
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Nombre del Receptor *</Label>
                            <Input
                              placeholder="Nombre completo o razón social"
                              value={formData.receptor_nombre}
                              onChange={(e) => handleInputChange("receptor_nombre", e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Dirección</Label>
                            <Input
                              placeholder="Dirección fiscal (requerido por SAT)"
                              value={formData.receptor_direccion}
                              onChange={(e) => handleInputChange("receptor_direccion", e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Correo Electrónico</Label>
                            <Input
                              type="email"
                              placeholder="correo@ejemplo.com"
                              value={formData.receptor_correo}
                              onChange={(e) => handleInputChange("receptor_correo", e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Descripción / Concepto *</Label>
                            <Textarea
                              placeholder="Descripción del concepto del recibo"
                              value={formData.descripcion}
                              onChange={(e) => handleInputChange("descripcion", e.target.value)}
                              rows={3}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Cancelar
                          </Button>
                          <Button onClick={handleSubmit} disabled={isSubmitting}>
                            {isSubmitting ? "Guardando..." : "Crear Recibo"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>

              {/* Guatefacturas Alert */}
              {!felConfig && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-800">Configuración pendiente</p>
                    <p className="text-sm text-yellow-700">
                      Las credenciales de Guatefacturas no han sido configuradas. Los recibos se guardarán 
                      como "Pendiente" hasta que se configure la integración FEL.
                    </p>
                  </div>
                </div>
              )}

              {/* Receipts Table */}
              {loadingReceipts ? (
                <p>Cargando recibos...</p>
              ) : filteredReceipts.length === 0 ? (
                <div className="text-center py-12 bg-muted rounded-lg">
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">No hay recibos registrados</p>
                  {canCreate && (
                    <Button onClick={() => setIsDialogOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Crear primer recibo
                    </Button>
                  )}
                </div>
              ) : (
                <div className="bg-card rounded-lg shadow overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Receptor</TableHead>
                        <TableHead>NIT</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredReceipts.map((receipt) => (
                        <TableRow key={receipt.id}>
                          <TableCell>
                            {new Date(receipt.created_at).toLocaleDateString("es-GT")}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {receipt.receipt_type === "donacion" ? "Donación" : "Convenio"}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium max-w-[200px] truncate">
                            {receipt.receptor_nombre}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {receipt.receptor_nit}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            Q{Number(receipt.monto).toLocaleString("es-GT", { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell>{getStatusBadge(receipt.status)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {receipt.status === "certified" && receipt.pdf_url && (
                                <Button size="sm" variant="ghost" asChild>
                                  <a href={receipt.pdf_url} target="_blank" rel="noopener noreferrer">
                                    <Download className="w-4 h-4" />
                                  </a>
                                </Button>
                              )}
                              {receipt.receptor_correo && receipt.status === "certified" && (
                                <Button size="sm" variant="ghost" title="Reenviar por correo">
                                  <Send className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="config">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Configuración de Guatefacturas
                  </CardTitle>
                  <CardDescription>
                    Configuración del emisor para la generación de recibos FEL
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {felConfig ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-muted-foreground">NIT Emisor</Label>
                          <p className="font-medium">{felConfig.nit_emisor}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Ambiente</Label>
                          <p className="font-medium">
                            <Badge variant={felConfig.ambiente === "FEL" ? "default" : "secondary"}>
                              {felConfig.ambiente === "FEL" ? "Producción" : "Pruebas"}
                            </Badge>
                          </p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Nombre Comercial</Label>
                          <p className="font-medium">{felConfig.nombre_comercial}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Nombre Emisor</Label>
                          <p className="font-medium">{felConfig.nombre_emisor}</p>
                        </div>
                        <div className="col-span-2">
                          <Label className="text-muted-foreground">Dirección</Label>
                          <p className="font-medium">
                            {felConfig.direccion}, {felConfig.municipio}, {felConfig.departamento}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pt-4">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-green-600">Configuración activa</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <AlertCircle className="w-12 h-12 mx-auto text-yellow-500 mb-4" />
                      <h3 className="font-medium text-lg mb-2">Configuración pendiente</h3>
                      <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                        Para habilitar la emisión automática de recibos FEL, necesita proporcionar 
                        las credenciales de Guatefacturas y los datos fiscales del Refugio.
                      </p>
                      <div className="bg-muted rounded-lg p-4 text-left max-w-md mx-auto">
                        <p className="font-medium mb-2">Datos requeridos:</p>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• Usuario y contraseña de Guatefacturas</li>
                          <li>• Token de autenticación</li>
                          <li>• NIT del Refugio de la Niñez</li>
                          <li>• Dirección fiscal completa</li>
                          <li>• Ambiente (Pruebas o Producción)</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminRecibos;

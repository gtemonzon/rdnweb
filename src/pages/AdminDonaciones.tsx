import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/layout/Layout";
import {
  ArrowLeft,
  Plus,
  Heart,
  Search,
  Download,
  CheckCircle,
  Clock,
  XCircle,
  Receipt,
  Eye,
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

interface Donation {
  id: string;
  donor_name: string;
  donor_email: string;
  donor_phone: string | null;
  donor_nit: string | null;
  donor_address: string | null;
  amount: number;
  donation_type: string;
  payment_method: string;
  status: string;
  notes: string | null;
  source: string;
  wants_receipt: boolean;
  receipt_id: string | null;
  confirmed_at: string | null;
  cancelled_at: string | null;
  created_at: string;
}

interface DonationFormData {
  donor_name: string;
  donor_email: string;
  donor_phone: string;
  donor_nit: string;
  donor_address: string;
  amount: string;
  donation_type: string;
  payment_method: string;
  notes: string;
  wants_receipt: boolean;
}

const initialFormData: DonationFormData = {
  donor_name: "",
  donor_email: "",
  donor_phone: "",
  donor_nit: "",
  donor_address: "",
  amount: "",
  donation_type: "unica",
  payment_method: "efectivo",
  notes: "",
  wants_receipt: false,
};

const AdminDonaciones = () => {
  const { user, userRole, hasPermission, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [donations, setDonations] = useState<Donation[]>([]);
  const [loadingDonations, setLoadingDonations] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<DonationFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    confirmed: 0,
    pending: 0,
    totalAmount: 0,
    uniqueDonors: 0,
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user && (userRole === "admin" || hasPermission("donations", "can_view"))) {
      fetchDonations();
    }
  }, [user, userRole]);

  const fetchDonations = async () => {
    setLoadingDonations(true);
    const { data, error } = await supabase
      .from("donations")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las donaciones",
        variant: "destructive",
      });
    } else {
      setDonations(data || []);
      calculateStats(data || []);
    }
    setLoadingDonations(false);
  };

  const calculateStats = (data: Donation[]) => {
    const confirmed = data.filter((d) => d.status === "confirmed").length;
    const pending = data.filter((d) => d.status === "pending").length;
    const totalAmount = data
      .filter((d) => d.status === "confirmed")
      .reduce((sum, d) => sum + Number(d.amount), 0);
    const uniqueEmails = new Set(data.map((d) => d.donor_email)).size;

    setStats({
      total: data.length,
      confirmed,
      pending,
      totalAmount,
      uniqueDonors: uniqueEmails,
    });
  };

  const handleInputChange = (field: keyof DonationFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.donor_name || !formData.donor_email || !formData.amount) {
      toast({
        title: "Error",
        description: "Por favor complete los campos requeridos (nombre, email y monto)",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Error",
        description: "El monto debe ser un número mayor a 0",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    // First, upsert the donor
    const { error: donorError } = await supabase.from("donors").upsert(
      {
        email: formData.donor_email.toLowerCase(),
        name: formData.donor_name,
        phone: formData.donor_phone || null,
        nit: formData.donor_nit || null,
        address: formData.donor_address || null,
        last_donation_at: new Date().toISOString(),
      },
      { onConflict: "email" }
    );

    if (donorError) {
      console.error("Error upserting donor:", donorError);
    }

    // Insert the donation as confirmed (manual entry)
    const { error } = await supabase.from("donations").insert({
      donor_name: formData.donor_name,
      donor_email: formData.donor_email.toLowerCase(),
      donor_phone: formData.donor_phone || null,
      donor_nit: formData.donor_nit || null,
      donor_address: formData.donor_address || null,
      amount: amount,
      donation_type: formData.donation_type,
      payment_method: formData.payment_method,
      status: "confirmed",
      confirmed_at: new Date().toISOString(),
      notes: formData.notes || null,
      source: "manual",
      wants_receipt: formData.wants_receipt,
      created_by: user?.id,
    });

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo registrar la donación",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Éxito",
        description: "Donación registrada correctamente",
      });
      setFormData(initialFormData);
      setIsDialogOpen(false);
      fetchDonations();
    }

    setIsSubmitting(false);
  };

  const confirmDonation = async (id: string) => {
    const { error } = await supabase
      .from("donations")
      .update({
        status: "confirmed",
        confirmed_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo confirmar la donación",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Éxito",
        description: "Donación confirmada",
      });
      fetchDonations();
    }
  };

  const cancelDonation = async (id: string) => {
    const { error } = await supabase
      .from("donations")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo cancelar la donación",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Éxito",
        description: "Donación cancelada",
      });
      fetchDonations();
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle className="w-3 h-3 mr-1" />
            Confirmada
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            <Clock className="w-3 h-3 mr-1" />
            Pendiente
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
            <XCircle className="w-3 h-3 mr-1" />
            Cancelada
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case "web":
        return "Web";
      case "manual":
        return "Manual";
      case "convenio":
        return "Convenio";
      default:
        return source;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case "tarjeta":
        return "Tarjeta";
      case "transferencia":
        return "Transferencia";
      case "efectivo":
        return "Efectivo";
      default:
        return method;
    }
  };

  const filteredDonations = donations.filter((donation) => {
    const matchesSearch =
      donation.donor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      donation.donor_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (donation.donor_nit && donation.donor_nit.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === "all" || donation.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const exportToCSV = () => {
    const headers = ["Fecha", "Donante", "Email", "NIT", "Monto", "Tipo", "Método", "Estado", "Fuente"];
    const rows = filteredDonations.map((d) => [
      new Date(d.created_at).toLocaleDateString("es-GT"),
      d.donor_name,
      d.donor_email,
      d.donor_nit || "",
      d.amount.toString(),
      d.donation_type === "unica" ? "Única" : "Mensual",
      getPaymentMethodLabel(d.payment_method),
      d.status,
      getSourceLabel(d.source),
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `donaciones_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const canCreate = userRole === "admin" || hasPermission("donations", "can_create");
  const canEdit = userRole === "admin" || hasPermission("donations", "can_edit_all");

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

  if (userRole !== "admin" && !hasPermission("donations", "can_view")) {
    return (
      <Layout>
        <section className="py-20 min-h-[60vh]">
          <div className="container text-center">
            <Heart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h1 className="font-heading text-2xl font-bold text-foreground mb-4">
              Acceso Restringido
            </h1>
            <p className="text-muted-foreground mb-6">
              No tienes permisos para acceder al módulo de donaciones.
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
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="font-heading text-3xl font-bold text-foreground flex items-center gap-3">
                <Heart className="w-8 h-8" />
                Gestión de Donaciones
              </h1>
              <p className="text-muted-foreground">
                Administra y registra las donaciones recibidas
              </p>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link to="/admin">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver
                </Link>
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Donaciones</CardDescription>
                <CardTitle className="text-2xl">{stats.total}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Confirmadas</CardDescription>
                <CardTitle className="text-2xl text-green-600">{stats.confirmed}</CardTitle>
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
                <CardDescription>Monto Total</CardDescription>
                <CardTitle className="text-2xl">
                  Q{stats.totalAmount.toLocaleString("es-GT", { minimumFractionDigits: 2 })}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Donantes Únicos</CardDescription>
                <CardTitle className="text-2xl">{stats.uniqueDonors}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Actions Bar */}
          <div className="flex flex-col md:flex-row gap-4 justify-between mb-6">
            <div className="flex gap-4 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar por nombre, email o NIT..."
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
                  <SelectItem value="confirmed">Confirmada</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
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
                      Registrar Donación
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Registrar Donación Manual</DialogTitle>
                      <DialogDescription>
                        Complete los datos para registrar una donación recibida en físico o transferencia.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2 col-span-2">
                          <Label>Nombre del Donante *</Label>
                          <Input
                            placeholder="Nombre completo"
                            value={formData.donor_name}
                            onChange={(e) => handleInputChange("donor_name", e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Email *</Label>
                          <Input
                            type="email"
                            placeholder="correo@ejemplo.com"
                            value={formData.donor_email}
                            onChange={(e) => handleInputChange("donor_email", e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Teléfono</Label>
                          <Input
                            placeholder="1234-5678"
                            value={formData.donor_phone}
                            onChange={(e) => handleInputChange("donor_phone", e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>NIT</Label>
                          <Input
                            placeholder="12345678-9 o CF"
                            value={formData.donor_nit}
                            onChange={(e) => handleInputChange("donor_nit", e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Monto (Q) *</Label>
                          <Input
                            type="number"
                            placeholder="100.00"
                            value={formData.amount}
                            onChange={(e) => handleInputChange("amount", e.target.value)}
                          />
                        </div>
                        <div className="space-y-2 col-span-2">
                          <Label>Dirección</Label>
                          <Input
                            placeholder="Dirección para recibo"
                            value={formData.donor_address}
                            onChange={(e) => handleInputChange("donor_address", e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Tipo de Donación</Label>
                          <Select
                            value={formData.donation_type}
                            onValueChange={(v) => handleInputChange("donation_type", v)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="unica">Única</SelectItem>
                              <SelectItem value="mensual">Mensual</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Método de Pago</Label>
                          <Select
                            value={formData.payment_method}
                            onValueChange={(v) => handleInputChange("payment_method", v)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="efectivo">Efectivo</SelectItem>
                              <SelectItem value="transferencia">Transferencia</SelectItem>
                              <SelectItem value="tarjeta">Tarjeta</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2 col-span-2">
                          <Label>Notas</Label>
                          <Textarea
                            placeholder="Notas adicionales sobre la donación..."
                            value={formData.notes}
                            onChange={(e) => handleInputChange("notes", e.target.value)}
                          />
                        </div>
                        <div className="col-span-2 flex items-center space-x-2">
                          <Checkbox
                            id="wants_receipt"
                            checked={formData.wants_receipt}
                            onCheckedChange={(checked) => handleInputChange("wants_receipt", !!checked)}
                          />
                          <Label htmlFor="wants_receipt" className="font-normal">
                            El donante desea recibo fiscal (FEL)
                          </Label>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? "Registrando..." : "Registrar Donación"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>

          {/* Donations Table */}
          {loadingDonations ? (
            <p>Cargando donaciones...</p>
          ) : filteredDonations.length === 0 ? (
            <div className="text-center py-12 bg-muted rounded-lg">
              <Heart className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                {donations.length === 0 ? "No hay donaciones registradas" : "No se encontraron donaciones con los filtros seleccionados"}
              </p>
              {canCreate && donations.length === 0 && (
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Registrar primera donación
                </Button>
              )}
            </div>
          ) : (
            <div className="bg-card rounded-lg shadow overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Donante</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Fuente</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDonations.map((donation) => (
                    <TableRow key={donation.id}>
                      <TableCell>
                        {new Date(donation.created_at).toLocaleDateString("es-GT")}
                      </TableCell>
                      <TableCell className="font-medium">{donation.donor_name}</TableCell>
                      <TableCell className="text-muted-foreground">{donation.donor_email}</TableCell>
                      <TableCell className="font-semibold">
                        Q{Number(donation.amount).toLocaleString("es-GT", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>{donation.donation_type === "unica" ? "Única" : "Mensual"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{getSourceLabel(donation.source)}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(donation.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedDonation(donation);
                              setIsDetailOpen(true);
                            }}
                            title="Ver detalles"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {donation.status === "pending" && canEdit && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-green-600"
                                onClick={() => confirmDonation(donation.id)}
                                title="Confirmar"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-destructive"
                                onClick={() => cancelDonation(donation.id)}
                                title="Cancelar"
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          {donation.wants_receipt && donation.status === "confirmed" && !donation.receipt_id && (
                            <Button
                              size="sm"
                              variant="ghost"
                              asChild
                              title="Generar recibo FEL"
                            >
                              <Link to={`/admin/recibos?from_donation=${donation.id}`}>
                                <Receipt className="w-4 h-4" />
                              </Link>
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

          {/* Detail Dialog */}
          <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Detalles de la Donación</DialogTitle>
              </DialogHeader>
              {selectedDonation && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Donante</p>
                      <p className="font-medium">{selectedDonation.donor_name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Email</p>
                      <p className="font-medium">{selectedDonation.donor_email}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Teléfono</p>
                      <p className="font-medium">{selectedDonation.donor_phone || "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">NIT</p>
                      <p className="font-medium">{selectedDonation.donor_nit || "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Monto</p>
                      <p className="font-medium text-lg">
                        Q{Number(selectedDonation.amount).toLocaleString("es-GT", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Estado</p>
                      <div className="mt-1">{getStatusBadge(selectedDonation.status)}</div>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Tipo</p>
                      <p className="font-medium">{selectedDonation.donation_type === "unica" ? "Única" : "Mensual"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Método de Pago</p>
                      <p className="font-medium">{getPaymentMethodLabel(selectedDonation.payment_method)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Fuente</p>
                      <p className="font-medium">{getSourceLabel(selectedDonation.source)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Recibo Fiscal</p>
                      <p className="font-medium">{selectedDonation.wants_receipt ? "Sí" : "No"}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Dirección</p>
                      <p className="font-medium">{selectedDonation.donor_address || "—"}</p>
                    </div>
                    {selectedDonation.notes && (
                      <div className="col-span-2">
                        <p className="text-muted-foreground">Notas</p>
                        <p className="font-medium">{selectedDonation.notes}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-muted-foreground">Fecha de Registro</p>
                      <p className="font-medium">
                        {new Date(selectedDonation.created_at).toLocaleString("es-GT")}
                      </p>
                    </div>
                    {selectedDonation.confirmed_at && (
                      <div>
                        <p className="text-muted-foreground">Fecha de Confirmación</p>
                        <p className="font-medium">
                          {new Date(selectedDonation.confirmed_at).toLocaleString("es-GT")}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </section>
    </Layout>
  );
};

export default AdminDonaciones;
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
  ArrowLeft, Plus, Heart, Search, Download, CheckCircle, Clock, XCircle,
  Receipt, Eye, Settings, ArrowUpDown, ArrowUp, ArrowDown, FileText,
} from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DonationSettingsPanel from "@/components/DonationSettingsPanel";

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
  fel_issued: boolean;
  fel_series: string | null;
  fel_number: string | null;
  fel_date: string | null;
  fel_recorded_at: string | null;
  fel_recorded_by: string | null;
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
  donor_name: "", donor_email: "", donor_phone: "", donor_nit: "", donor_address: "",
  amount: "", donation_type: "unica", payment_method: "efectivo", notes: "", wants_receipt: false,
};

type SortKey = "created_at" | "donor_name" | "donor_email" | "amount" | "status" | "fel_issued";
type SortDir = "asc" | "desc";

const AdminDonaciones = () => {
  const { user, userRole, hasPermission, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [donations, setDonations] = useState<Donation[]>([]);
  const [loadingDonations, setLoadingDonations] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [felFilter, setFelFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<DonationFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // FEL modal
  const [felDonation, setFelDonation] = useState<Donation | null>(null);
  const [isFelOpen, setIsFelOpen] = useState(false);
  const [felForm, setFelForm] = useState({ series: "", number: "", date: "" });
  const [isFelSubmitting, setIsFelSubmitting] = useState(false);

  const [stats, setStats] = useState({
    total: 0, confirmed: 0, pending: 0, totalAmount: 0, uniqueDonors: 0,
  });

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user && (userRole === "admin" || hasPermission("donations", "can_view"))) fetchDonations();
  }, [user, userRole]);

  const fetchDonations = async () => {
    setLoadingDonations(true);
    const { data, error } = await supabase
      .from("donations")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error", description: "No se pudieron cargar las donaciones", variant: "destructive" });
    } else {
      setDonations(data || []);
      calculateStats(data || []);
    }
    setLoadingDonations(false);
  };

  const calculateStats = (data: Donation[]) => {
    const confirmed = data.filter((d) => d.status === "confirmed").length;
    const pending = data.filter((d) => d.status === "pending").length;
    const totalAmount = data.filter((d) => d.status === "confirmed").reduce((sum, d) => sum + Number(d.amount), 0);
    const uniqueEmails = new Set(data.map((d) => d.donor_email)).size;
    setStats({ total: data.length, confirmed, pending, totalAmount, uniqueDonors: uniqueEmails });
  };

  const handleInputChange = (field: keyof DonationFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.donor_name || !formData.donor_email || !formData.amount) {
      toast({ title: "Error", description: "Por favor complete los campos requeridos (nombre, email y monto)", variant: "destructive" });
      return;
    }
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Error", description: "El monto debe ser un número mayor a 0", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    await supabase.from("donors").upsert(
      { email: formData.donor_email.toLowerCase(), name: formData.donor_name, phone: formData.donor_phone || null, nit: formData.donor_nit || null, address: formData.donor_address || null, last_donation_at: new Date().toISOString() },
      { onConflict: "email" }
    );

    const { error } = await supabase.from("donations").insert({
      donor_name: formData.donor_name, donor_email: formData.donor_email.toLowerCase(),
      donor_phone: formData.donor_phone || null, donor_nit: formData.donor_nit || null,
      donor_address: formData.donor_address || null, amount, donation_type: formData.donation_type,
      payment_method: formData.payment_method, status: "confirmed", confirmed_at: new Date().toISOString(),
      notes: formData.notes || null, source: "manual", wants_receipt: formData.wants_receipt, created_by: user?.id,
    });

    if (error) {
      toast({ title: "Error", description: "No se pudo registrar la donación", variant: "destructive" });
    } else {
      toast({ title: "Éxito", description: "Donación registrada correctamente" });
      setFormData(initialFormData);
      setIsDialogOpen(false);
      fetchDonations();
    }
    setIsSubmitting(false);
  };

  const confirmDonation = async (id: string) => {
    const { error } = await supabase.from("donations").update({ status: "confirmed", confirmed_at: new Date().toISOString() }).eq("id", id);
    if (error) toast({ title: "Error", description: "No se pudo confirmar la donación", variant: "destructive" });
    else { toast({ title: "Éxito", description: "Donación confirmada" }); fetchDonations(); }
  };

  const cancelDonation = async (id: string) => {
    const { error } = await supabase.from("donations").update({ status: "cancelled", cancelled_at: new Date().toISOString() }).eq("id", id);
    if (error) toast({ title: "Error", description: "No se pudo cancelar la donación", variant: "destructive" });
    else { toast({ title: "Éxito", description: "Donación cancelada" }); fetchDonations(); }
  };

  // FEL handlers
  const openFelModal = (donation: Donation) => {
    setFelDonation(donation);
    setFelForm({
      series: donation.fel_series || "",
      number: donation.fel_number || "",
      date: donation.fel_date || new Date().toISOString().split("T")[0],
    });
    setIsFelOpen(true);
  };

  const handleFelSubmit = async () => {
    if (!felDonation || !felForm.series || !felForm.number || !felForm.date) {
      toast({ title: "Error", description: "Serie, número y fecha son requeridos", variant: "destructive" });
      return;
    }
    setIsFelSubmitting(true);
    const { error } = await supabase.from("donations").update({
      fel_issued: true,
      fel_series: felForm.series,
      fel_number: felForm.number,
      fel_date: felForm.date,
      fel_recorded_at: new Date().toISOString(),
      fel_recorded_by: user?.email || null,
    }).eq("id", felDonation.id);

    if (error) {
      toast({ title: "Error", description: "No se pudo registrar el FEL", variant: "destructive" });
    } else {
      toast({ title: "Éxito", description: "FEL registrado correctamente" });
      setIsFelOpen(false);
      fetchDonations();
    }
    setIsFelSubmitting(false);
  };

  const clearFel = async (id: string) => {
    const { error } = await supabase.from("donations").update({
      fel_issued: false, fel_series: null, fel_number: null, fel_date: null, fel_recorded_at: null, fel_recorded_by: null,
    }).eq("id", id);
    if (error) toast({ title: "Error", description: "No se pudo limpiar el FEL", variant: "destructive" });
    else { toast({ title: "Éxito", description: "FEL desmarcado" }); fetchDonations(); }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed": return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle className="w-3 h-3 mr-1" />Confirmada</Badge>;
      case "pending": return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"><Clock className="w-3 h-3 mr-1" />Pendiente</Badge>;
      case "cancelled": return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100"><XCircle className="w-3 h-3 mr-1" />Cancelada</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const getSourceLabel = (s: string) => ({ web: "Web", manual: "Manual", convenio: "Convenio" }[s] || s);
  const getPaymentMethodLabel = (m: string) => ({ tarjeta: "Tarjeta", transferencia: "Transferencia", efectivo: "Efectivo" }[m] || m);

  // Sorting
  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="w-3 h-3 ml-1 inline opacity-40" />;
    return sortDir === "asc" ? <ArrowUp className="w-3 h-3 ml-1 inline" /> : <ArrowDown className="w-3 h-3 ml-1 inline" />;
  };

  const filteredDonations = donations
    .filter((d) => {
      const matchesSearch =
        d.donor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.donor_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.donor_nit && d.donor_nit.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = statusFilter === "all" || d.status === statusFilter;
      const matchesFel = felFilter === "all" || (felFilter === "pending" && !d.fel_issued) || (felFilter === "issued" && d.fel_issued);
      return matchesSearch && matchesStatus && matchesFel;
    })
    .sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "created_at": cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime(); break;
        case "donor_name": cmp = a.donor_name.localeCompare(b.donor_name); break;
        case "donor_email": cmp = a.donor_email.localeCompare(b.donor_email); break;
        case "amount": cmp = Number(a.amount) - Number(b.amount); break;
        case "status": cmp = a.status.localeCompare(b.status); break;
        case "fel_issued": cmp = (a.fel_issued ? 1 : 0) - (b.fel_issued ? 1 : 0); break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

  const exportToCSV = () => {
    const headers = ["Fecha", "Donante", "Email", "Teléfono", "NIT", "Dirección", "Monto", "Tipo", "Método", "Estado", "Fuente", "FEL Emitida", "FEL Serie", "FEL Número", "FEL Fecha"];
    const rows = filteredDonations.map((d) => [
      new Date(d.created_at).toLocaleDateString("es-GT"),
      d.donor_name, d.donor_email, d.donor_phone || "", d.donor_nit || "", d.donor_address || "",
      d.amount.toString(),
      d.donation_type === "unica" ? "Única" : "Mensual",
      getPaymentMethodLabel(d.payment_method), d.status, getSourceLabel(d.source),
      d.fel_issued ? "Sí" : "No", d.fel_series || "", d.fel_number || "", d.fel_date || "",
    ]);
    const csvContent = [headers, ...rows].map((row) => row.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `donaciones_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const canCreate = userRole === "admin" || hasPermission("donations", "can_create");
  const canEdit = userRole === "admin" || hasPermission("donations", "can_edit_all");

  if (loading) return <AdminLayout><div className="min-h-[60vh] flex items-center justify-center"><p>Cargando...</p></div></AdminLayout>;
  if (!user) return null;

  if (userRole !== "admin" && !hasPermission("donations", "can_view")) {
    return (
      <AdminLayout>
        <div className="text-center py-20">
          <Heart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="font-heading text-2xl font-bold text-foreground mb-4">Acceso Restringido</h1>
          <p className="text-muted-foreground">No tienes permisos para acceder al módulo de donaciones.</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div>
        <div className="mb-8">
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
            <Heart className="w-8 h-8" />Gestión de Donaciones
          </h1>
          <p className="text-muted-foreground">Administra y registra las donaciones recibidas</p>
        </div>

          <Tabs defaultValue="donations" className="space-y-6">
            <TabsList>
              <TabsTrigger value="donations"><Heart className="w-4 h-4 mr-2" />Donaciones</TabsTrigger>
              <TabsTrigger value="settings"><Settings className="w-4 h-4 mr-2" />Configuración</TabsTrigger>
            </TabsList>

            <TabsContent value="donations" className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Card><CardHeader className="pb-2"><CardDescription>Total Donaciones</CardDescription><CardTitle className="text-2xl">{stats.total}</CardTitle></CardHeader></Card>
                <Card><CardHeader className="pb-2"><CardDescription>Confirmadas</CardDescription><CardTitle className="text-2xl text-green-600">{stats.confirmed}</CardTitle></CardHeader></Card>
                <Card><CardHeader className="pb-2"><CardDescription>Pendientes</CardDescription><CardTitle className="text-2xl text-yellow-600">{stats.pending}</CardTitle></CardHeader></Card>
                <Card><CardHeader className="pb-2"><CardDescription>Monto Total</CardDescription><CardTitle className="text-2xl">Q{stats.totalAmount.toLocaleString("es-GT", { minimumFractionDigits: 2 })}</CardTitle></CardHeader></Card>
                <Card><CardHeader className="pb-2"><CardDescription>Donantes Únicos</CardDescription><CardTitle className="text-2xl">{stats.uniqueDonors}</CardTitle></CardHeader></Card>
              </div>

              {/* Actions Bar */}
              <div className="flex flex-col md:flex-row gap-4 justify-between mb-6">
                <div className="flex gap-4 flex-1 flex-wrap">
                  <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input placeholder="Buscar por nombre, email o NIT..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40"><SelectValue placeholder="Estado" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="pending">Pendiente</SelectItem>
                      <SelectItem value="confirmed">Confirmada</SelectItem>
                      <SelectItem value="cancelled">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={felFilter} onValueChange={setFelFilter}>
                    <SelectTrigger className="w-40"><SelectValue placeholder="FEL" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos FEL</SelectItem>
                      <SelectItem value="pending">FEL Pendiente</SelectItem>
                      <SelectItem value="issued">FEL Emitida</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={exportToCSV}><Download className="w-4 h-4 mr-2" />Exportar CSV</Button>
                  {canCreate && (
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                      <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Registrar Donación</Button></DialogTrigger>
                      <DialogContent className="max-w-lg">
                        <DialogHeader>
                          <DialogTitle>Registrar Donación Manual</DialogTitle>
                          <DialogDescription>Complete los datos para registrar una donación recibida en físico o transferencia.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2 col-span-2"><Label>Nombre del Donante *</Label><Input placeholder="Nombre completo" value={formData.donor_name} onChange={(e) => handleInputChange("donor_name", e.target.value)} /></div>
                            <div className="space-y-2"><Label>Email *</Label><Input type="email" placeholder="correo@ejemplo.com" value={formData.donor_email} onChange={(e) => handleInputChange("donor_email", e.target.value)} /></div>
                            <div className="space-y-2"><Label>Teléfono</Label><Input placeholder="1234-5678" value={formData.donor_phone} onChange={(e) => handleInputChange("donor_phone", e.target.value)} /></div>
                            <div className="space-y-2"><Label>NIT</Label><Input placeholder="12345678-9 o CF" value={formData.donor_nit} onChange={(e) => handleInputChange("donor_nit", e.target.value)} /></div>
                            <div className="space-y-2"><Label>Monto (Q) *</Label><Input type="number" placeholder="100.00" value={formData.amount} onChange={(e) => handleInputChange("amount", e.target.value)} /></div>
                            <div className="space-y-2 col-span-2"><Label>Dirección</Label><Input placeholder="Dirección para recibo" value={formData.donor_address} onChange={(e) => handleInputChange("donor_address", e.target.value)} /></div>
                            <div className="space-y-2"><Label>Tipo de Donación</Label><Select value={formData.donation_type} onValueChange={(v) => handleInputChange("donation_type", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="unica">Única</SelectItem><SelectItem value="mensual">Mensual</SelectItem></SelectContent></Select></div>
                            <div className="space-y-2"><Label>Método de Pago</Label><Select value={formData.payment_method} onValueChange={(v) => handleInputChange("payment_method", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="efectivo">Efectivo</SelectItem><SelectItem value="transferencia">Transferencia</SelectItem><SelectItem value="tarjeta">Tarjeta</SelectItem></SelectContent></Select></div>
                            <div className="space-y-2 col-span-2"><Label>Notas</Label><Textarea placeholder="Notas adicionales..." value={formData.notes} onChange={(e) => handleInputChange("notes", e.target.value)} /></div>
                            <div className="col-span-2 flex items-center space-x-2">
                              <Checkbox id="wants_receipt" checked={formData.wants_receipt} onCheckedChange={(checked) => handleInputChange("wants_receipt", !!checked)} />
                              <Label htmlFor="wants_receipt" className="font-normal">El donante desea recibo fiscal (FEL)</Label>
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                          <Button onClick={handleSubmit} disabled={isSubmitting}>{isSubmitting ? "Registrando..." : "Registrar Donación"}</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>

              {/* Table */}
              {loadingDonations ? (
                <p>Cargando donaciones...</p>
              ) : filteredDonations.length === 0 ? (
                <div className="text-center py-12 bg-muted rounded-lg">
                  <Heart className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    {donations.length === 0 ? "No hay donaciones registradas" : "No se encontraron donaciones con los filtros seleccionados"}
                  </p>
                  {canCreate && donations.length === 0 && (
                    <Button onClick={() => setIsDialogOpen(true)}><Plus className="w-4 h-4 mr-2" />Registrar primera donación</Button>
                  )}
                </div>
              ) : (
                <div className="bg-card rounded-lg shadow overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="cursor-pointer select-none" onClick={() => handleSort("created_at")}>Fecha<SortIcon col="created_at" /></TableHead>
                        <TableHead className="cursor-pointer select-none" onClick={() => handleSort("donor_name")}>Donante<SortIcon col="donor_name" /></TableHead>
                        <TableHead className="cursor-pointer select-none" onClick={() => handleSort("donor_email")}>Email<SortIcon col="donor_email" /></TableHead>
                        <TableHead className="cursor-pointer select-none" onClick={() => handleSort("amount")}>Monto<SortIcon col="amount" /></TableHead>
                        <TableHead>Fuente</TableHead>
                        <TableHead className="cursor-pointer select-none" onClick={() => handleSort("status")}>Estado<SortIcon col="status" /></TableHead>
                        <TableHead className="cursor-pointer select-none" onClick={() => handleSort("fel_issued")}>FEL<SortIcon col="fel_issued" /></TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDonations.map((donation) => (
                        <TableRow key={donation.id}>
                          <TableCell>{new Date(donation.created_at).toLocaleDateString("es-GT")}</TableCell>
                          <TableCell className="font-medium">{donation.donor_name}</TableCell>
                          <TableCell className="text-muted-foreground">{donation.donor_email}</TableCell>
                          <TableCell className="font-semibold">Q{Number(donation.amount).toLocaleString("es-GT", { minimumFractionDigits: 2 })}</TableCell>
                          <TableCell><Badge variant="outline">{getSourceLabel(donation.source)}</Badge></TableCell>
                          <TableCell>{getStatusBadge(donation.status)}</TableCell>
                          <TableCell>
                            {donation.fel_issued ? (
                              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                <FileText className="w-3 h-3 mr-1" />{donation.fel_series}-{donation.fel_number}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-yellow-700 border-yellow-300">
                                <Clock className="w-3 h-3 mr-1" />Pendiente
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button size="sm" variant="ghost" onClick={() => { setSelectedDonation(donation); setIsDetailOpen(true); }} title="Ver detalles"><Eye className="w-4 h-4" /></Button>
                              {canEdit && (
                                <Button size="sm" variant="ghost" onClick={() => openFelModal(donation)} title="Registrar FEL"><FileText className="w-4 h-4" /></Button>
                              )}
                              {donation.status === "pending" && canEdit && (
                                <>
                                  <Button size="sm" variant="ghost" className="text-green-600" onClick={() => confirmDonation(donation.id)} title="Confirmar"><CheckCircle className="w-4 h-4" /></Button>
                                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => cancelDonation(donation.id)} title="Cancelar"><XCircle className="w-4 h-4" /></Button>
                                </>
                              )}
                              {donation.wants_receipt && donation.status === "confirmed" && !donation.receipt_id && (
                                <Button size="sm" variant="ghost" asChild title="Generar recibo FEL"><Link to={`/admin/recibos?from_donation=${donation.id}`}><Receipt className="w-4 h-4" /></Link></Button>
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
                  <DialogHeader><DialogTitle>Detalles de la Donación</DialogTitle></DialogHeader>
                  {selectedDonation && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div><p className="text-muted-foreground">Donante</p><p className="font-medium">{selectedDonation.donor_name}</p></div>
                        <div><p className="text-muted-foreground">Email</p><p className="font-medium">{selectedDonation.donor_email}</p></div>
                        <div><p className="text-muted-foreground">Teléfono</p><p className="font-medium">{selectedDonation.donor_phone || "—"}</p></div>
                        <div><p className="text-muted-foreground">NIT</p><p className="font-medium">{selectedDonation.donor_nit || "—"}</p></div>
                        <div><p className="text-muted-foreground">Monto</p><p className="font-medium text-lg">Q{Number(selectedDonation.amount).toLocaleString("es-GT", { minimumFractionDigits: 2 })}</p></div>
                        <div><p className="text-muted-foreground">Estado</p><div className="mt-1">{getStatusBadge(selectedDonation.status)}</div></div>
                        <div><p className="text-muted-foreground">Tipo</p><p className="font-medium">{selectedDonation.donation_type === "unica" ? "Única" : "Mensual"}</p></div>
                        <div><p className="text-muted-foreground">Método de Pago</p><p className="font-medium">{getPaymentMethodLabel(selectedDonation.payment_method)}</p></div>
                        <div><p className="text-muted-foreground">Fuente</p><p className="font-medium">{getSourceLabel(selectedDonation.source)}</p></div>
                        <div><p className="text-muted-foreground">Recibo Fiscal</p><p className="font-medium">{selectedDonation.wants_receipt ? "Sí" : "No"}</p></div>
                        <div className="col-span-2"><p className="text-muted-foreground">Dirección</p><p className="font-medium">{selectedDonation.donor_address || "—"}</p></div>
                        {selectedDonation.notes && <div className="col-span-2"><p className="text-muted-foreground">Notas / Referencia</p><p className="font-medium">{selectedDonation.notes}</p></div>}
                        <div><p className="text-muted-foreground">Fecha de Registro</p><p className="font-medium">{new Date(selectedDonation.created_at).toLocaleString("es-GT")}</p></div>
                        {selectedDonation.confirmed_at && <div><p className="text-muted-foreground">Fecha de Confirmación</p><p className="font-medium">{new Date(selectedDonation.confirmed_at).toLocaleString("es-GT")}</p></div>}
                        <div className="col-span-2 border-t pt-3 mt-2">
                          <p className="text-muted-foreground font-semibold mb-1">FEL</p>
                          {selectedDonation.fel_issued ? (
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div><p className="text-muted-foreground">Serie</p><p className="font-medium">{selectedDonation.fel_series}</p></div>
                              <div><p className="text-muted-foreground">Número</p><p className="font-medium">{selectedDonation.fel_number}</p></div>
                              <div><p className="text-muted-foreground">Fecha FEL</p><p className="font-medium">{selectedDonation.fel_date}</p></div>
                              <div><p className="text-muted-foreground">Registrado por</p><p className="font-medium">{selectedDonation.fel_recorded_by || "—"}</p></div>
                            </div>
                          ) : <p className="text-sm text-yellow-700">Pendiente</p>}
                        </div>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>

              {/* FEL Modal */}
              <Dialog open={isFelOpen} onOpenChange={setIsFelOpen}>
                <DialogContent className="max-w-sm">
                  <DialogHeader>
                    <DialogTitle>Registrar FEL</DialogTitle>
                    <DialogDescription>
                      {felDonation && `Donación de Q${Number(felDonation.amount).toLocaleString("es-GT", { minimumFractionDigits: 2 })} — ${felDonation.donor_name}`}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className="space-y-2"><Label>Serie *</Label><Input placeholder="A" value={felForm.series} onChange={(e) => setFelForm(f => ({ ...f, series: e.target.value }))} /></div>
                    <div className="space-y-2"><Label>Número *</Label><Input placeholder="12345678" value={felForm.number} onChange={(e) => setFelForm(f => ({ ...f, number: e.target.value }))} /></div>
                    <div className="space-y-2"><Label>Fecha *</Label><Input type="date" value={felForm.date} onChange={(e) => setFelForm(f => ({ ...f, date: e.target.value }))} /></div>
                  </div>
                  <DialogFooter className="flex-col sm:flex-row gap-2">
                    {felDonation?.fel_issued && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" className="text-destructive">Marcar sin FEL</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Desmarcar FEL?</AlertDialogTitle>
                            <AlertDialogDescription>Se eliminará la información de FEL registrada para esta donación.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => { clearFel(felDonation!.id); setIsFelOpen(false); }}>Confirmar</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                    <Button variant="outline" onClick={() => setIsFelOpen(false)}>Cancelar</Button>
                    <Button onClick={handleFelSubmit} disabled={isFelSubmitting}>{isFelSubmitting ? "Guardando..." : "Guardar FEL"}</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

            </TabsContent>

            <TabsContent value="settings">
              <DonationSettingsPanel />
            </TabsContent>
          </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminDonaciones;

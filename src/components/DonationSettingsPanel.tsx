import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save, Loader2, Mail, Building2, TestTube, DollarSign } from "lucide-react";

interface DonationSettingsData {
  id: string;
  environment: string;
  sender_email_name: string;
  sender_email_address: string | null;
  accounting_emails: string[];
  accounting_email_subject: string;
  accounting_email_body: string | null;
  donor_email_enabled: boolean;
  donor_email_subject: string;
  donor_email_body: string | null;
  send_donor_email: boolean;
  send_accounting_email: boolean;
  min_amount: number;
  suggested_amounts: number[];
  min_amount_usd: number;
  suggested_amounts_usd: number[];
}

const DonationSettingsPanel = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<DonationSettingsData | null>(null);
  const [accountingEmailsText, setAccountingEmailsText] = useState("");
  const [suggestedAmountsText, setSuggestedAmountsText] = useState("");
  const [suggestedAmountsUsdText, setSuggestedAmountsUsdText] = useState("");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("donation_settings")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (error) {
      toast({ title: "Error", description: "No se pudo cargar la configuración", variant: "destructive" });
    } else if (data) {
      const s = data as unknown as DonationSettingsData;
      setSettings(s);
      setAccountingEmailsText((s.accounting_emails || []).join(", "));
      setSuggestedAmountsText((s.suggested_amounts || []).join(", "));
      setSuggestedAmountsUsdText((s.suggested_amounts_usd || []).join(", "));
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);

    const emails = accountingEmailsText
      .split(",")
      .map((e) => e.trim())
      .filter((e) => e.length > 0);

    const parsedSuggested = suggestedAmountsText
      .split(",")
      .map((s) => parseFloat(s.trim()))
      .filter((n) => !isNaN(n) && n > 0);

    const parsedSuggestedUsd = suggestedAmountsUsdText
      .split(",")
      .map((s) => parseFloat(s.trim()))
      .filter((n) => !isNaN(n) && n > 0);

    if (settings.min_amount <= 0) {
      toast({ title: "Error", description: "El monto mínimo GTQ debe ser mayor a 0", variant: "destructive" });
      setSaving(false);
      return;
    }
    if (settings.min_amount_usd <= 0) {
      toast({ title: "Error", description: "El monto mínimo USD debe ser mayor a 0", variant: "destructive" });
      setSaving(false);
      return;
    }

    // Auto-include min_amount in suggested if missing
    const finalSuggested = parsedSuggested.includes(settings.min_amount)
      ? parsedSuggested
      : [settings.min_amount, ...parsedSuggested];
    const finalSuggestedUsd = parsedSuggestedUsd.includes(settings.min_amount_usd)
      ? parsedSuggestedUsd
      : [settings.min_amount_usd, ...parsedSuggestedUsd];

    const { error } = await supabase
      .from("donation_settings")
      .update({
        environment: settings.environment,
        sender_email_name: settings.sender_email_name,
        sender_email_address: settings.sender_email_address || null,
        accounting_emails: emails,
        accounting_email_subject: settings.accounting_email_subject,
        accounting_email_body: settings.accounting_email_body || null,
        donor_email_enabled: settings.donor_email_enabled,
        donor_email_subject: settings.donor_email_subject,
        donor_email_body: settings.donor_email_body || null,
        send_donor_email: settings.send_donor_email,
        send_accounting_email: settings.send_accounting_email,
        min_amount: settings.min_amount,
        suggested_amounts: finalSuggested,
        min_amount_usd: settings.min_amount_usd,
        suggested_amounts_usd: finalSuggestedUsd,
      } as any)
      .eq("id", settings.id);

    if (error) {
      toast({ title: "Error", description: "No se pudo guardar la configuración", variant: "destructive" });
    } else {
      toast({ title: "Guardado", description: "Configuración de donaciones actualizada" });
    }
    setSaving(false);
  };

  const updateField = (field: keyof DonationSettingsData, value: any) => {
    setSettings((prev) => prev ? { ...prev, [field]: value } : prev);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!settings) {
    return <p className="text-muted-foreground">No se encontró configuración de donaciones.</p>;
  }

  return (
    <div className="space-y-6">
      {/* Donation Amounts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Monto de Donación
          </CardTitle>
          <CardDescription>
            Configura montos mínimos y sugeridos para cada moneda
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* GTQ */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Quetzales (GTQ)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Monto mínimo (Q)</Label>
                <Input
                  type="number"
                  min={1}
                  step="0.01"
                  value={settings.min_amount}
                  onChange={(e) => updateField("min_amount", parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label>Montos sugeridos (separados por coma)</Label>
                <Input
                  value={suggestedAmountsText}
                  onChange={(e) => setSuggestedAmountsText(e.target.value)}
                  placeholder="50, 100, 200, 500"
                />
                <p className="text-xs text-muted-foreground">
                  Si el mínimo no está incluido, se agregará automáticamente.
                </p>
              </div>
            </div>
          </div>
          {/* USD */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Dólares (USD)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Monto mínimo (US$)</Label>
                <Input
                  type="number"
                  min={1}
                  step="0.01"
                  value={settings.min_amount_usd}
                  onChange={(e) => updateField("min_amount_usd", parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label>Montos sugeridos (separados por coma)</Label>
                <Input
                  value={suggestedAmountsUsdText}
                  onChange={(e) => setSuggestedAmountsUsdText(e.target.value)}
                  placeholder="10, 25, 50, 100, 200"
                />
                <p className="text-xs text-muted-foreground">
                  Si el mínimo no está incluido, se agregará automáticamente.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Environment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="w-5 h-5" />
            Entorno
          </CardTitle>
          <CardDescription>
            Controla si el sistema está en modo prueba o producción
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Select
              value={settings.environment}
              onValueChange={(v) => updateField("environment", v)}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="test">Pruebas</SelectItem>
                <SelectItem value="production">Producción</SelectItem>
              </SelectContent>
            </Select>
            <Badge variant={settings.environment === "production" ? "default" : "secondary"}>
              {settings.environment === "production" ? "🟢 Producción" : "🟡 Pruebas"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Sender */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Remitente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nombre del remitente</Label>
              <Input
                value={settings.sender_email_name}
                onChange={(e) => updateField("sender_email_name", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Correo del remitente (opcional)</Label>
              <Input
                placeholder="Dejar vacío para usar SMTP por defecto"
                value={settings.sender_email_address || ""}
                onChange={(e) => updateField("sender_email_address", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accounting notification */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Notificación a Contabilidad
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Enviar notificación a contabilidad</Label>
            <Switch
              checked={settings.send_accounting_email}
              onCheckedChange={(v) => updateField("send_accounting_email", v)}
            />
          </div>
          <div className="space-y-2">
            <Label>Correos de contabilidad (separados por coma)</Label>
            <Input
              value={accountingEmailsText}
              onChange={(e) => setAccountingEmailsText(e.target.value)}
              placeholder="donaciones@ejemplo.com, contabilidad@ejemplo.com"
            />
          </div>
          <div className="space-y-2">
            <Label>Asunto del correo</Label>
            <Input
              value={settings.accounting_email_subject}
              onChange={(e) => updateField("accounting_email_subject", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Variables: {"{{amount}}, {{currency_symbol}}, {{reference}}, {{donor_name}}, {{donor_email}}"}
            </p>
          </div>
          <div className="space-y-2">
            <Label>Cuerpo del correo (HTML, opcional)</Label>
            <Textarea
              rows={6}
              value={settings.accounting_email_body || ""}
              onChange={(e) => updateField("accounting_email_body", e.target.value || null)}
              placeholder="Dejar vacío para usar la plantilla por defecto. Soporta variables: {{donor_name}}, {{amount}}, etc."
            />
          </div>
        </CardContent>
      </Card>

      {/* Donor thank-you */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Correo de Agradecimiento al Donante
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Enviar correo de agradecimiento</Label>
            <Switch
              checked={settings.send_donor_email}
              onCheckedChange={(v) => updateField("send_donor_email", v)}
            />
          </div>
          <div className="space-y-2">
            <Label>Asunto del correo</Label>
            <Input
              value={settings.donor_email_subject}
              onChange={(e) => updateField("donor_email_subject", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Cuerpo del correo (HTML, opcional)</Label>
            <Textarea
              rows={6}
              value={settings.donor_email_body || ""}
              onChange={(e) => updateField("donor_email_body", e.target.value || null)}
              placeholder="Dejar vacío para usar la plantilla por defecto. Variables: {{donor_name}}, {{amount}}, {{currency_symbol}}, {{reference}}, {{date}}"
            />
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Guardar Configuración
        </Button>
      </div>
    </div>
  );
};

export default DonationSettingsPanel;

import { useState, useEffect } from "react";
import { localSet } from "@/lib/safeStorage";
import {
  Heart, CreditCard, Building, Repeat, Gift, Check, Loader2, Info,
  Lock, DollarSign, Upload, ExternalLink, ChevronRight, ChevronLeft, Shield,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import Layout from "@/components/layout/Layout";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import TransferReceiptUpload from "@/components/TransferReceiptUpload";
import {
  countries, getCountryByCode, departmentsByCountry,
  toE164, isPlausiblePhone,
} from "@/lib/countries";

type Currency = "GTQ" | "USD";

const defaultAmountsGTQ = [50, 100, 250, 500, 1000];
const defaultAmountsUSD = [10, 25, 50, 100, 200];

const impactItemsGTQ = [
  { amount: "Q50", description: "Material educativo para un niño por un mes" },
  { amount: "Q100", description: "Atención psicológica para una sesión" },
  { amount: "Q250", description: "Kit de higiene para una familia" },
  { amount: "Q500", description: "Beca escolar por un mes" },
  { amount: "Q1,000", description: "Apoyo alimentario familiar por un mes" },
];

const impactItemsUSD = [
  { amount: "$10", description: "Material educativo para un niño por un mes" },
  { amount: "$25", description: "Atención psicológica para una sesión" },
  { amount: "$50", description: "Kit de higiene para una familia" },
  { amount: "$100", description: "Beca escolar por un mes" },
  { amount: "$200", description: "Apoyo alimentario familiar por un mes" },
];

const benefits = [
  "Recibo deducible de impuestos",
  "Informe mensual de impacto",
  "Invitación a eventos exclusivos",
  "Reconocimiento en memoria anual",
];

const donationSchema = z.object({
  firstName: z.string().trim().min(1, "Los nombres son requeridos").max(50),
  lastName: z.string().trim().min(1, "Los apellidos son requeridos").max(50),
  email: z.string().trim().email("Correo inválido").max(255),
  confirmEmail: z.string().trim().email("Correo inválido").max(255),
  phone: z.string().trim().max(20).optional(),
  nit: z.string().trim().max(15).optional(),
  country: z.string().trim().min(1, "El país es requerido"),
  city: z.string().trim().max(100).optional(),
  department: z.string().trim().max(50).optional(),
  amount: z.number().min(1, "El monto debe ser mayor a 0"),
}).refine((data) => data.email.toLowerCase() === data.confirmEmail.toLowerCase(), {
  message: "El correo no coincide.",
  path: ["confirmEmail"],
});

const steps = [
  { label: "Monto", icon: Heart },
  { label: "Datos", icon: Info },
  { label: "Pago", icon: CreditCard },
];

const Donar = () => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [currency, setCurrency] = useState<Currency>("GTQ");
  const [donationType, setDonationType] = useState<"unica" | "mensual">("unica");
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [customAmountError, setCustomAmountError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"tarjeta" | "transferencia">("tarjeta");
  const [formData, setFormData] = useState({
    firstName: "", lastName: "", email: "", confirmEmail: "",
    phone: "", nit: "", address: "", city: "", department: "",
    country: "GT",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [transferReceipt, setTransferReceipt] = useState<File | null>(null);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);

  // Dynamic donation settings from DB
  const [donationAmountsGTQ, setDonationAmountsGTQ] = useState(defaultAmountsGTQ);
  const [donationAmountsUSD, setDonationAmountsUSD] = useState(defaultAmountsUSD);
  const [minAmountGTQ, setMinAmountGTQ] = useState(50);
  const [minAmountUSD, setMinAmountUSD] = useState(10);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.rpc("get_public_donation_settings");
      if (data && data.length > 0) {
        const d = data[0] as any;
        if (d.min_amount > 0) setMinAmountGTQ(d.min_amount);
        if (d.min_amount_usd > 0) setMinAmountUSD(d.min_amount_usd);
        if (Array.isArray(d.suggested_amounts) && d.suggested_amounts.length > 0) {
          setDonationAmountsGTQ(d.suggested_amounts.map(Number).filter((n: number) => n > 0));
        }
        if (Array.isArray(d.suggested_amounts_usd) && d.suggested_amounts_usd.length > 0) {
          setDonationAmountsUSD(d.suggested_amounts_usd.map(Number).filter((n: number) => n > 0));
        }
      }
    };
    fetchSettings();
  }, []);

  const selectedCountry = getCountryByCode(formData.country) || countries[0];
  const availableDepartments = departmentsByCountry[formData.country] || [];

  const donationAmounts = currency === "GTQ" ? donationAmountsGTQ : donationAmountsUSD;
  const impactItems = currency === "GTQ" ? impactItemsGTQ : impactItemsUSD;
  const currencySymbol = currency === "GTQ" ? "Q" : "US$";
  const minAmount = currency === "GTQ" ? minAmountGTQ : minAmountUSD;
  const finalAmount = selectedAmount || (customAmount ? parseFloat(customAmount) : 0);

  const phoneE164 = toE164(formData.phone, selectedCountry.dialCode);

  const validateCustomAmount = (value: string): string | null => {
    if (!value) return null;
    const amount = parseFloat(value);
    if (isNaN(amount) || amount < minAmount) return `El monto mínimo es ${currencySymbol}${minAmount}`;
    return null;
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setSelectedAmount(null);
    setCustomAmountError(validateCustomAmount(value));
  };

  const handleCurrencyChange = (newCurrency: Currency) => {
    setCurrency(newCurrency);
    setSelectedAmount(null);
    setCustomAmount("");
    setCustomAmountError(null);
  };

  const handleCountryChange = (countryCode: string) => {
    setFormData((p) => ({
      ...p,
      country: countryCode,
      department: "", // reset department when country changes
    }));
    // Revalidate phone if present
    if (formData.phone) {
      const country = getCountryByCode(countryCode);
      if (country && !isPlausiblePhone(formData.phone, country)) {
        setFieldErrors((prev) => ({ ...prev, phone: "Ingresa un número de teléfono válido." }));
      } else {
        setFieldErrors((prev) => { const { phone, ...rest } = prev; return rest; });
      }
    }
  };

  const handlePhoneChange = (value: string) => {
    // Only allow digits, spaces, hyphens
    const cleaned = value.replace(/[^\d\s\-]/g, "");
    setFormData((p) => ({ ...p, phone: cleaned }));
    if (cleaned && !isPlausiblePhone(cleaned, selectedCountry)) {
      setFieldErrors((prev) => ({ ...prev, phone: "Ingresa un número de teléfono válido." }));
    } else {
      setFieldErrors((prev) => { const { phone, ...rest } = prev; return rest; });
    }
  };

  const handleEmailChange = (field: "email" | "confirmEmail", value: string) => {
    setFormData((p) => ({ ...p, [field]: value }));
    // Live validation for confirmEmail match
    const otherField = field === "email" ? "confirmEmail" : "email";
    const otherValue = formData[otherField];
    if (otherValue && value) {
      if (value.toLowerCase() !== otherValue.toLowerCase()) {
        setFieldErrors((prev) => ({ ...prev, confirmEmail: "El correo no coincide." }));
      } else {
        setFieldErrors((prev) => { const { confirmEmail, ...rest } = prev; return rest; });
      }
    } else {
      setFieldErrors((prev) => { const { confirmEmail, ...rest } = prev; return rest; });
    }
  };

  const canAdvanceStep = (step: number): boolean => {
    if (step === 0) return finalAmount > 0 && !customAmountError;
    if (step === 1) {
      const basic = !!formData.firstName && !!formData.lastName && !!formData.email && !!formData.confirmEmail;
      const emailsMatch = formData.email.toLowerCase() === formData.confirmEmail.toLowerCase();
      const phoneValid = !formData.phone || isPlausiblePhone(formData.phone, selectedCountry);
      if (paymentMethod === "tarjeta") return basic && emailsMatch && phoneValid && !!formData.address && !!formData.city && !!formData.department;
      return basic && emailsMatch && phoneValid;
    }
    return true;
  };

  const handleNext = () => {
    if (!canAdvanceStep(currentStep)) {
      toast({ title: "Campos incompletos", description: "Por favor completa los campos requeridos.", variant: "destructive" });
      return;
    }
    if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customAmount && customAmountError) {
      toast({ title: "Monto inválido", description: customAmountError, variant: "destructive" });
      return;
    }
    if (paymentMethod === "tarjeta" && (!formData.address || !formData.city || !formData.department)) {
      toast({ title: "Campos requeridos", description: "Para pagos con tarjeta, la dirección, ciudad y departamento son obligatorios.", variant: "destructive" });
      return;
    }
    if (paymentMethod === "transferencia" && !transferReceipt) {
      toast({ title: "Boleta requerida", description: "Por favor adjunta la boleta de tu transferencia.", variant: "destructive" });
      return;
    }
    const validation = donationSchema.safeParse({ ...formData, amount: finalAmount });
    if (!validation.success) {
      toast({ title: "Error de validación", description: validation.error.errors[0].message, variant: "destructive" });
      return;
    }
    setShowConfirmation(true);
  };

  const handleSubmit = async () => {
    setShowConfirmation(false);
    setIsSubmitting(true);
    try {
      if (paymentMethod === "tarjeta") {
        const referenceNumber = `DON-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

        // Persist donor payload to localStorage before redirect
        localSet("rdn_donation_donor_payload", JSON.stringify({
          donor_name: `${formData.firstName} ${formData.lastName}`.trim(),
          donor_email: formData.email,
          donor_phone: phoneE164 || "",
          donor_nit: formData.nit || "",
          donor_address: formData.address || "",
          donor_city: formData.city || "",
          donor_department: formData.department || "",
          donor_country: formData.country || "",
          amount: finalAmount,
          currency: currency,
          reference: referenceNumber,
        }));

        const { data, error } = await supabase.functions.invoke("cybersource-sign", {
          body: {
            amount: finalAmount,
            currency: currency === "GTQ" ? "GTQ" : "USD",
            reference_number: referenceNumber,
            locale: "es",
            donor_email: formData.email,
            donor_first_name: formData.firstName,
            donor_last_name: formData.lastName,
            donor_phone: phoneE164 || undefined,
            bill_address1: formData.address,
            bill_city: formData.city,
            bill_country: formData.country,
            bill_state: formData.department,
            test_mode: true,
          },
        });
        if (error) throw error;
        if (!data?.success) throw new Error(data?.error || "Error al preparar el pago");

        const form = document.createElement("form");
        form.method = "POST";
        form.action = data.cybersource_url;
        for (const [key, value] of Object.entries(data.fields)) {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = key;
          input.value = value as string;
          form.appendChild(input);
        }
        document.body.appendChild(form);
        form.submit();
        return;
      } else {
        if (!transferReceipt) throw new Error("No se ha adjuntado la boleta de transferencia");
        setIsUploadingReceipt(true);
        const uploadFormData = new FormData();
        uploadFormData.append("file", transferReceipt);
        uploadFormData.append("email", formData.email);
        uploadFormData.append("name", `${formData.firstName} ${formData.lastName}`);

        const { data: uploadData, error: uploadError } = await supabase.functions.invoke("upload-receipt", { body: uploadFormData });
        if (uploadError || !uploadData?.success) throw new Error(uploadData?.error || "Error al subir la boleta.");

        const fileName = uploadData.fileName;
        const receiptUrl = uploadData.signedUrl;
        setIsUploadingReceipt(false);

        const { error } = await supabase.functions.invoke("send-email", {
          body: {
            type: "transfer-donation",
            firstName: formData.firstName, lastName: formData.lastName,
            name: `${formData.firstName} ${formData.lastName}`,
            email: formData.email, phone: phoneE164 || undefined,
            nit: formData.nit || undefined, city: formData.city || undefined,
            department: formData.department || undefined,
            country: formData.country,
            amount: finalAmount, currency, donationType, paymentMethod,
            receiptFileName: fileName, receiptUrl,
          },
        });
        if (error) throw error;
        toast({ title: "¡Gracias por tu donación!", description: "Hemos recibido tu boleta. Contabilidad verificará tu transferencia." });
      }

      setFormData({ firstName: "", lastName: "", email: "", confirmEmail: "", phone: "", nit: "", address: "", city: "", department: "", country: "GT" });
      setFieldErrors({});
      setTransferReceipt(null);
      setSelectedAmount(null);
      setCustomAmount("");
      setCustomAmountError(null);
      setCurrentStep(0);
    } catch (error: any) {
      console.error("Error processing donation:", error);
      toast({ title: "Error al procesar", description: error.message || "No pudimos procesar tu donación.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
      setIsUploadingReceipt(false);
    }
  };

  return (
    <Layout>
      {/* Hero - Compact */}
      <section className="py-12 md:py-16 gradient-brand text-primary-foreground">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center">
            <Heart className="w-10 h-10 mx-auto mb-4 animate-pulse" />
            <h1 className="font-heading text-3xl md:text-4xl font-bold mb-3">
              Tu donación transforma vidas
            </h1>
            <p className="text-primary-foreground/80 text-sm md:text-base">
              Cada aporte protege a niños, niñas y adolescentes que más lo necesitan.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 md:py-16 bg-background">
        <div className="container max-w-5xl">
          <div className="grid lg:grid-cols-5 gap-8 lg:gap-12">

            {/* Form Column - 3/5 */}
            <div className="lg:col-span-3">
              {/* Step Indicator */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  {steps.map((step, i) => {
                    const Icon = step.icon;
                    const isActive = i === currentStep;
                    const isDone = i < currentStep;
                    return (
                      <button
                        key={step.label}
                        type="button"
                        onClick={() => { if (isDone) setCurrentStep(i); }}
                        className={`flex items-center gap-2 text-xs font-medium transition-colors ${
                          isActive ? "text-primary" : isDone ? "text-primary/60 cursor-pointer" : "text-muted-foreground"
                        }`}
                        disabled={!isDone && !isActive}
                        aria-current={isActive ? "step" : undefined}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                          isActive ? "bg-primary text-primary-foreground" : isDone ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                        }`}>
                          {isDone ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                        </div>
                        <span className="hidden sm:inline">{step.label}</span>
                      </button>
                    );
                  })}
                </div>
                <Progress value={((currentStep + 1) / steps.length) * 100} className="h-1.5" />
              </div>

              <form onSubmit={handlePreSubmit}>
                {/* STEP 0: Amount */}
                {currentStep === 0 && (
                  <div className="space-y-6 animate-fade-in">
                    <div>
                      <h2 className="font-heading text-xl font-bold text-foreground mb-1">
                        Elige tu donación
                      </h2>
                      <p className="text-sm text-muted-foreground">Selecciona la moneda, tipo y monto.</p>
                    </div>

                    {/* Currency */}
                    <div>
                      <Label className="mb-2 block text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                        Moneda
                      </Label>
                      <div className="grid grid-cols-2 gap-2">
                        {([["GTQ", "Q", "Quetzales"], ["USD", "$", "Dólares"]] as const).map(([code, sym, name]) => (
                          <button
                            key={code}
                            type="button"
                            onClick={() => handleCurrencyChange(code as Currency)}
                            className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                              currency === code
                                ? "border-primary bg-primary/5 text-primary shadow-sm"
                                : "border-border text-muted-foreground hover:border-primary/40"
                            }`}
                          >
                            <span className="font-bold">{sym}</span>
                            {name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Donation Type */}
                    <div>
                      <Label className="mb-2 block text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                        Frecuencia
                      </Label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setDonationType("unica")}
                          className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                            donationType === "unica"
                              ? "border-primary bg-primary/5 text-primary shadow-sm"
                              : "border-border text-muted-foreground hover:border-primary/40"
                          }`}
                        >
                          <Gift className="w-4 h-4" /> Única
                        </button>
                        <button
                          type="button"
                          onClick={() => setDonationType("mensual")}
                          className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                            donationType === "mensual"
                              ? "border-primary bg-primary/5 text-primary shadow-sm"
                              : "border-border text-muted-foreground hover:border-primary/40"
                          }`}
                        >
                          <Repeat className="w-4 h-4" /> Mensual
                        </button>
                      </div>
                    </div>

                    {/* Amount */}
                    <div>
                      <Label className="mb-2 block text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                        Monto
                      </Label>
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-3">
                        {donationAmounts.map((amount) => (
                          <button
                            key={amount}
                            type="button"
                            onClick={() => { setSelectedAmount(amount); setCustomAmount(""); setCustomAmountError(null); }}
                            className={`p-3 rounded-lg border-2 text-sm font-bold transition-all ${
                              selectedAmount === amount
                                ? "border-primary bg-primary text-primary-foreground shadow-md scale-105"
                                : "border-border text-foreground hover:border-primary/40 hover:bg-muted"
                            }`}
                          >
                            {currencySymbol}{amount}
                          </button>
                        ))}
                      </div>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">
                          {currencySymbol}
                        </span>
                        <Input
                          type="number"
                          placeholder={`Otro monto (mínimo ${currencySymbol}${minAmount})`}
                          className={`pl-10 text-sm ${customAmountError ? "border-destructive" : ""}`}
                          value={customAmount}
                          onChange={(e) => handleCustomAmountChange(e.target.value)}
                          disabled={isSubmitting}
                          min={minAmount}
                          step="0.01"
                        />
                      </div>
                      {customAmountError && (
                        <p className="text-xs text-destructive mt-1">{customAmountError}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Monto mínimo: {currencySymbol}{minAmount}
                      </p>
                    </div>

                    {/* Next */}
                    <Button
                      type="button"
                      onClick={handleNext}
                      disabled={!canAdvanceStep(0)}
                      className="w-full"
                      size="lg"
                    >
                      Continuar
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                )}

                {/* STEP 1: Personal Info */}
                {currentStep === 1 && (
                  <div className="space-y-6 animate-fade-in">
                    <div>
                      <h2 className="font-heading text-xl font-bold text-foreground mb-1">
                        Tus datos
                      </h2>
                      <p className="text-sm text-muted-foreground">Información para tu recibo de donación.</p>
                    </div>

                    {/* Name fields */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="donor-firstName" className="text-xs font-semibold">Nombres *</Label>
                        <Input id="donor-firstName" placeholder="Tus nombres" value={formData.firstName}
                          onChange={(e) => setFormData((p) => ({ ...p, firstName: e.target.value }))} disabled={isSubmitting} required />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="donor-lastName" className="text-xs font-semibold">Apellidos *</Label>
                        <Input id="donor-lastName" placeholder="Tus apellidos" value={formData.lastName}
                          onChange={(e) => setFormData((p) => ({ ...p, lastName: e.target.value }))} disabled={isSubmitting} required />
                      </div>
                    </div>

                    {/* Email + Confirm Email */}
                    <div className="space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="donor-email" className="text-xs font-semibold">Correo electrónico *</Label>
                          <Input id="donor-email" type="email" placeholder="tu@email.com" value={formData.email}
                            onChange={(e) => handleEmailChange("email", e.target.value)} disabled={isSubmitting} required />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="donor-confirmEmail" className="text-xs font-semibold">Confirmar correo *</Label>
                          <Input
                            id="donor-confirmEmail"
                            type="email"
                            placeholder="Repite tu correo"
                            value={formData.confirmEmail}
                            onChange={(e) => handleEmailChange("confirmEmail", e.target.value)}
                            disabled={isSubmitting}
                            required
                            className={fieldErrors.confirmEmail ? "border-destructive" : ""}
                          />
                          {fieldErrors.confirmEmail && (
                            <p className="text-xs text-destructive">{fieldErrors.confirmEmail}</p>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground -mt-2">
                        Verifica que tu correo esté bien escrito. Te enviaremos la confirmación a este correo.
                      </p>
                    </div>

                    {/* NIT */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="donor-nit" className="text-xs font-semibold">NIT</Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs text-xs">Opcional. Para recibir un recibo deducible de impuestos.</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <Input id="donor-nit" placeholder="Ej: 12345678-9 o CF" value={formData.nit}
                        onChange={(e) => setFormData((p) => ({ ...p, nit: e.target.value }))} disabled={isSubmitting} />
                    </div>

                    {/* Country + Phone */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="donor-country" className="text-xs font-semibold">País *</Label>
                        <Select value={formData.country} onValueChange={handleCountryChange} disabled={isSubmitting}>
                          <SelectTrigger id="donor-country">
                            <SelectValue placeholder="Selecciona país" />
                          </SelectTrigger>
                          <SelectContent>
                            {countries.map((c) => (
                              <SelectItem key={c.code} value={c.code}>
                                {c.flag} {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="donor-phone" className="text-xs font-semibold">Teléfono</Label>
                        <div className="flex gap-2">
                          <div className="flex items-center gap-1 px-3 rounded-md border border-input bg-muted text-sm text-muted-foreground shrink-0 h-10">
                            <span>{selectedCountry.flag}</span>
                            <span className="font-medium">{selectedCountry.dialCode}</span>
                          </div>
                          <Input
                            id="donor-phone"
                            placeholder={selectedCountry.phoneLength ? "0".repeat(selectedCountry.phoneLength) : "Número"}
                            value={formData.phone}
                            onChange={(e) => handlePhoneChange(e.target.value)}
                            disabled={isSubmitting}
                            className={fieldErrors.phone ? "border-destructive" : ""}
                          />
                        </div>
                        {fieldErrors.phone && (
                          <p className="text-xs text-destructive">{fieldErrors.phone}</p>
                        )}
                      </div>
                    </div>

                    {/* Billing Address */}
                    <div className="pt-2 border-t border-border">
                      <Label className="mb-3 block text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                        Dirección de facturación {paymentMethod === "tarjeta" && "(requerida para tarjeta)"}
                      </Label>
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="donor-address" className="text-xs font-semibold">
                            Dirección {paymentMethod === "tarjeta" && "*"}
                          </Label>
                          <Input id="donor-address" placeholder="Calle, zona, número" value={formData.address}
                            onChange={(e) => setFormData((p) => ({ ...p, address: e.target.value }))}
                            disabled={isSubmitting} required={paymentMethod === "tarjeta"} />
                        </div>
                        {/* Country → Department → City order */}
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label htmlFor="donor-department" className="text-xs font-semibold">
                              Departamento/Estado {paymentMethod === "tarjeta" && "*"}
                            </Label>
                            {availableDepartments.length > 0 ? (
                              <Select value={formData.department}
                                onValueChange={(v) => setFormData((p) => ({ ...p, department: v }))}
                                disabled={isSubmitting}>
                                <SelectTrigger id="donor-department">
                                  <SelectValue placeholder="Selecciona" />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableDepartments.map((dept) => (
                                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Input
                                id="donor-department"
                                placeholder="Estado o provincia"
                                value={formData.department}
                                onChange={(e) => setFormData((p) => ({ ...p, department: e.target.value }))}
                                disabled={isSubmitting}
                                required={paymentMethod === "tarjeta"}
                              />
                            )}
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="donor-city" className="text-xs font-semibold">
                              Ciudad {paymentMethod === "tarjeta" && "*"}
                            </Label>
                            <Input id="donor-city" placeholder="Tu ciudad" value={formData.city}
                              onChange={(e) => setFormData((p) => ({ ...p, city: e.target.value }))}
                              disabled={isSubmitting} required={paymentMethod === "tarjeta"} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Navigation */}
                    <div className="flex gap-3">
                      <Button type="button" variant="outline" onClick={handleBack} className="flex-1">
                        <ChevronLeft className="w-4 h-4 mr-1" /> Atrás
                      </Button>
                      <Button type="button" onClick={handleNext} disabled={!canAdvanceStep(1)} className="flex-1">
                        Continuar <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* STEP 2: Payment */}
                {currentStep === 2 && (
                  <div className="space-y-6 animate-fade-in">
                    <div>
                      <h2 className="font-heading text-xl font-bold text-foreground mb-1">
                        Método de pago
                      </h2>
                      <p className="text-sm text-muted-foreground">Elige cómo deseas realizar tu donación.</p>
                    </div>

                    {/* Summary Card */}
                    <div className="rounded-xl border border-border bg-muted/50 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Tu donación</span>
                        <span className="font-heading font-bold text-2xl text-primary">
                          {currencySymbol}{finalAmount}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        <span>{donationType === "unica" ? "Pago único" : "Pago mensual"}</span>
                        <span>•</span>
                        <span>{formData.firstName} {formData.lastName}</span>
                      </div>
                    </div>

                    {/* Payment Method */}
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("tarjeta")}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-sm font-medium transition-all ${
                          paymentMethod === "tarjeta"
                            ? "border-primary bg-primary/5 text-primary shadow-sm"
                            : "border-border text-muted-foreground hover:border-primary/40"
                        }`}
                      >
                        <CreditCard className="w-6 h-6" />
                        Tarjeta
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("transferencia")}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-sm font-medium transition-all ${
                          paymentMethod === "transferencia"
                            ? "border-primary bg-primary/5 text-primary shadow-sm"
                            : "border-border text-muted-foreground hover:border-primary/40"
                        }`}
                      >
                        <Building className="w-6 h-6" />
                        Transferencia
                      </button>
                    </div>

                    {/* Card info */}
                    {paymentMethod === "tarjeta" && (
                      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Lock className="w-4 h-4 text-primary" />
                          <span className="text-sm font-semibold text-primary">Pago seguro</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Al confirmar, serás redirigido a la <strong className="text-foreground">página segura de Cybersource/VisaNet</strong> donde
                          ingresarás los datos de tu tarjeta. Tu información nunca pasa por nuestros servidores.
                        </p>
                      </div>
                    )}

                    {/* Transfer */}
                    {paymentMethod === "transferencia" && (
                      <div className="space-y-4">
                        {/* Bank info compact */}
                        <div className="rounded-xl border border-border p-4 space-y-3">
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Datos bancarios</p>
                          <div className="grid gap-3">
                            <div className="text-xs space-y-0.5">
                              <p className="font-semibold text-foreground">Banco Industrial</p>
                              <p className="text-muted-foreground">Cuenta: 000-031978-0 • Monetaria GTQ</p>
                              <p className="text-muted-foreground">El Refugio de la Niñez ONG</p>
                            </div>
                            <div className="text-xs space-y-0.5">
                              <p className="font-semibold text-foreground">Banrural</p>
                              <p className="text-muted-foreground">Cuenta: 4445211205 • Ahorros GTQ</p>
                              <p className="text-muted-foreground">El Refugio de la Niñez ONG</p>
                            </div>
                          </div>
                        </div>

                        {/* Upload */}
                        <div className="rounded-xl border-2 border-dashed border-secondary/50 p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Upload className="w-4 h-4 text-secondary-foreground" />
                            <span className="text-xs font-semibold text-secondary-foreground">Comprobante de transferencia *</span>
                          </div>
                          <TransferReceiptUpload
                            file={transferReceipt}
                            onFileChange={setTransferReceipt}
                            isUploading={isUploadingReceipt}
                            disabled={isSubmitting}
                          />
                        </div>
                      </div>
                    )}

                    {/* Navigation */}
                    <div className="flex gap-3">
                      <Button type="button" variant="outline" onClick={handleBack} className="flex-1">
                        <ChevronLeft className="w-4 h-4 mr-1" /> Atrás
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1"
                        size="lg"
                        disabled={
                          isSubmitting || finalAmount <= 0 || !!customAmountError ||
                          (paymentMethod === "transferencia" && !transferReceipt)
                        }
                      >
                        {isSubmitting ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Procesando...</>
                        ) : (
                          <><Heart className="w-4 h-4 mr-2" /> Donar {currencySymbol}{finalAmount}</>
                        )}
                      </Button>
                    </div>

                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                      <Shield className="w-3.5 h-3.5" />
                      Tu información está protegida y encriptada.
                    </div>
                  </div>
                )}
              </form>
            </div>

            {/* Sidebar - 2/5 */}
            <aside className="lg:col-span-2 space-y-6">
              {/* Floating Summary (visible on all steps) */}
              {finalAmount > 0 && (
                <div className="rounded-xl border border-primary/20 bg-card/50 backdrop-blur-sm p-5 sticky top-24">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">Tu donación</p>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="font-heading text-3xl font-bold text-primary">{currencySymbol}{finalAmount}</span>
                    <span className="text-xs text-muted-foreground">
                      {currency} • {donationType === "unica" ? "Única" : "Mensual"}
                    </span>
                  </div>
                </div>
              )}

              {/* Impact */}
              <div>
                <h3 className="font-heading font-bold text-sm text-foreground mb-3">Tu impacto</h3>
                <div className="space-y-2">
                  {impactItems.map((item) => (
                    <div key={item.amount} className="flex items-start gap-3 p-3 rounded-lg bg-muted/60">
                      <span className="font-heading font-bold text-sm text-primary whitespace-nowrap">{item.amount}</span>
                      <span className="text-xs text-muted-foreground leading-relaxed">{item.description}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Benefits */}
              <div className="rounded-xl bg-muted p-5">
                <h3 className="font-heading font-bold text-sm text-foreground mb-3">Beneficios</h3>
                <ul className="space-y-2">
                  {benefits.map((b) => (
                    <li key={b} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Trust */}
              <div className="rounded-xl border border-border p-5 text-center">
                <Shield className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Somos una organización transparente y auditada. El 90% de cada donación va directamente a programas de protección.
                </p>
                <a href="/transparencia" className="text-xs text-primary font-medium hover:underline mt-2 inline-block">
                  Ver Transparencia →
                </a>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-primary" />
              Confirmar Donación
            </DialogTitle>
            <DialogDescription>
              Verifica los datos antes de continuar.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex justify-between items-center p-3 bg-primary/5 rounded-lg">
              <span className="text-sm text-muted-foreground">Monto</span>
              <span className="font-heading font-bold text-2xl text-primary">{currencySymbol}{finalAmount}</span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tipo</span>
                <span className="font-medium">{donationType === "unica" ? "Única" : "Mensual"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Método</span>
                <span className="font-medium">
                  {paymentMethod === "tarjeta" ? "Tarjeta (Cybersource)" : "Transferencia"}
                </span>
              </div>
              {paymentMethod === "transferencia" && transferReceipt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Boleta</span>
                  <span className="font-medium truncate max-w-[150px]">{transferReceipt.name}</span>
                </div>
              )}
            </div>

            <div className="border-t pt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nombre</span>
                <span className="font-medium">{formData.firstName} {formData.lastName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Correo</span>
                <span className="font-medium">{formData.email}</span>
              </div>
              {phoneE164 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Teléfono</span>
                  <span className="font-medium">{phoneE164}</span>
                </div>
              )}
              {formData.nit && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">NIT</span>
                  <span className="font-medium">{formData.nit}</span>
                </div>
              )}
              {formData.address && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dirección</span>
                  <span className="font-medium truncate max-w-[200px]">{formData.address}, {formData.city}</span>
                </div>
              )}
            </div>

            {paymentMethod === "tarjeta" && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-muted text-xs text-muted-foreground">
                <ExternalLink className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Serás redirigido a la página segura de Cybersource para completar el pago.</span>
              </div>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowConfirmation(false)} className="w-full sm:w-auto">
              Modificar
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Procesando...</>
              ) : (
                <><Check className="w-4 h-4 mr-2" /> Confirmar Donación</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Donar;

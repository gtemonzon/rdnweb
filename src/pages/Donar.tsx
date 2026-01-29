import { useState } from "react";
import { Heart, CreditCard, Building, Repeat, Gift, Check, Loader2, Info, Lock, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Layout from "@/components/layout/Layout";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

type Currency = "GTQ" | "USD";

const donationAmountsGTQ = [50, 100, 250, 500, 1000];
const donationAmountsUSD = [10, 25, 50, 100, 200];

const guatemalaDepartments = [
  "Alta Verapaz",
  "Baja Verapaz",
  "Chimaltenango",
  "Chiquimula",
  "El Progreso",
  "Escuintla",
  "Guatemala",
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
  firstName: z.string().trim().min(1, "Los nombres son requeridos").max(50, "Nombres muy largos"),
  lastName: z.string().trim().min(1, "Los apellidos son requeridos").max(50, "Apellidos muy largos"),
  email: z.string().trim().email("Correo inválido").max(255, "Correo muy largo"),
  phone: z.string().trim().max(20, "Teléfono muy largo").optional(),
  nit: z.string().trim().max(15, "NIT muy largo").optional(),
  city: z.string().trim().max(100, "Ciudad muy larga").optional(),
  department: z.string().trim().max(50, "Departamento muy largo").optional(),
  amount: z.number().min(1, "El monto debe ser mayor a 0"),
});

const cardSchema = z.object({
  cardNumber: z.string()
    .min(13, "Número de tarjeta inválido")
    .max(19, "Número de tarjeta inválido")
    .regex(/^[0-9\s]+$/, "Solo se permiten números"),
  expirationMonth: z.string()
    .length(2, "Mes inválido")
    .regex(/^(0[1-9]|1[0-2])$/, "Mes debe ser 01-12"),
  expirationYear: z.string()
    .length(4, "Año inválido")
    .regex(/^20[2-9][0-9]$/, "Año inválido"),
  cvv: z.string()
    .min(3, "CVV inválido")
    .max(4, "CVV inválido")
    .regex(/^[0-9]+$/, "Solo se permiten números"),
});

const Donar = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [currency, setCurrency] = useState<Currency>("GTQ");
  const [donationType, setDonationType] = useState<"unica" | "mensual">("unica");
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [customAmountError, setCustomAmountError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"tarjeta" | "transferencia">("tarjeta");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    nit: "",
    city: "",
    department: "",
  });
  const [cardData, setCardData] = useState({
    cardNumber: "",
    expirationMonth: "",
    expirationYear: "",
    cvv: "",
  });

  const donationAmounts = currency === "GTQ" ? donationAmountsGTQ : donationAmountsUSD;
  const impactItems = currency === "GTQ" ? impactItemsGTQ : impactItemsUSD;
  const currencySymbol = currency === "GTQ" ? "Q" : "US$";
  const currencyMultiple = currency === "GTQ" ? 50 : 10;
  const minAmount = currencyMultiple;

  const finalAmount = selectedAmount || (customAmount ? parseInt(customAmount) : 0);

  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, "");
    const groups = digits.match(/.{1,4}/g);
    return groups ? groups.join(" ").substring(0, 19) : "";
  };

  const validateCustomAmount = (value: string): string | null => {
    if (!value) return null;
    const amount = parseInt(value);
    if (isNaN(amount) || amount < minAmount) {
      return `El monto mínimo es ${currencySymbol}${minAmount}`;
    }
    if (amount % currencyMultiple !== 0) {
      return `El monto debe ser múltiplo de ${currencySymbol}${currencyMultiple}`;
    }
    return null;
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setSelectedAmount(null);
    const error = validateCustomAmount(value);
    setCustomAmountError(error);
  };

  const handleCurrencyChange = (newCurrency: Currency) => {
    setCurrency(newCurrency);
    setSelectedAmount(null);
    setCustomAmount("");
    setCustomAmountError(null);
  };

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate custom amount
    if (customAmount && customAmountError) {
      toast({
        title: "Monto inválido",
        description: customAmountError,
        variant: "destructive",
      });
      return;
    }

    // Validate address fields for card payments
    if (paymentMethod === "tarjeta" && (!formData.city || !formData.department)) {
      toast({
        title: "Campos requeridos",
        description: "Para pagos con tarjeta, la ciudad y departamento son obligatorios.",
        variant: "destructive",
      });
      return;
    }

    const validation = donationSchema.safeParse({
      ...formData,
      amount: finalAmount,
    });

    if (!validation.success) {
      toast({
        title: "Error de validación",
        description: validation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    // Validate card data if payment method is card
    if (paymentMethod === "tarjeta") {
      const cardValidation = cardSchema.safeParse(cardData);
      if (!cardValidation.success) {
        toast({
          title: "Error en datos de tarjeta",
          description: cardValidation.error.errors[0].message,
          variant: "destructive",
        });
        return;
      }
    }

    // Show confirmation dialog
    setShowConfirmation(true);
  };

  const handleSubmit = async () => {
    setShowConfirmation(false);
    setIsSubmitting(true);

    try {
      if (paymentMethod === "tarjeta") {
        // Process card payment via Cybersource
        const { data, error } = await supabase.functions.invoke("process-payment", {
          body: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone || undefined,
            nit: formData.nit || undefined,
            city: formData.city,
            department: formData.department,
            amount: finalAmount,
            currency,
            donationType,
            cardNumber: cardData.cardNumber.replace(/\s/g, ""),
            expirationMonth: cardData.expirationMonth,
            expirationYear: cardData.expirationYear,
            cvv: cardData.cvv,
          },
        });

        if (error) throw error;

        if (data?.status === "AUTHORIZED" || data?.status === "PENDING") {
          toast({
            title: "¡Pago procesado exitosamente!",
            description: "Tu donación ha sido procesada. Recibirás un correo de confirmación.",
          });
        } else {
          throw new Error(data?.message || "Error al procesar el pago");
        }
      } else {
        // Send email for bank transfer
        const { data, error } = await supabase.functions.invoke("send-email", {
          body: {
            type: "donation",
            firstName: formData.firstName,
            lastName: formData.lastName,
            name: `${formData.firstName} ${formData.lastName}`,
            email: formData.email,
            phone: formData.phone || undefined,
            nit: formData.nit || undefined,
            city: formData.city || undefined,
            department: formData.department || undefined,
            amount: finalAmount,
            currency,
            donationType,
            paymentMethod,
          },
        });

        if (error) throw error;

        toast({
          title: "¡Gracias por tu generosidad!",
          description: "Hemos recibido tu intención de donación. Te enviaremos un correo con los detalles.",
        });
      }

      // Reset form
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        nit: "",
        city: "",
        department: "",
      });
      setCardData({
        cardNumber: "",
        expirationMonth: "",
        expirationYear: "",
        cvv: "",
      });
      setSelectedAmount(null);
      setCustomAmount("");
      setCustomAmountError(null);
    } catch (error: any) {
      console.error("Error processing donation:", error);
      toast({
        title: "Error al procesar",
        description: error.message || "No pudimos procesar tu donación. Por favor intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMaskedCardNumber = () => {
    const digits = cardData.cardNumber.replace(/\s/g, "");
    if (digits.length < 4) return "****";
    return `**** **** **** ${digits.slice(-4)}`;
  };

  return (
    <Layout>
      {/* Hero */}
      <section className="py-20 gradient-warm text-primary-foreground">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <Heart className="w-16 h-16 mx-auto mb-6 animate-pulse" />
            <h1 className="font-heading text-4xl md:text-5xl font-bold mb-6">Tu donación transforma vidas</h1>
            <p className="text-lg text-primary-foreground/90">
              Cada aporte nos permite continuar protegiendo a niños, niñas y adolescentes que más lo necesitan. Sé parte
              del cambio.
            </p>
          </div>
        </div>
      </section>

      {/* Donation Form */}
      <section className="py-20 bg-card">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Form */}
            <div className="bg-muted rounded-2xl p-8">
              <h2 className="font-heading text-2xl font-bold text-foreground mb-6">Hacer una donación</h2>
              <form onSubmit={handlePreSubmit}>
                {/* Currency Selector */}
                <div className="mb-6">
                  <Label className="mb-3 block">Moneda</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleCurrencyChange("GTQ")}
                      className={`flex items-center justify-center gap-2 p-4 rounded-lg border-2 font-medium transition-colors ${
                        currency === "GTQ"
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border text-muted-foreground hover:border-primary hover:text-primary"
                      }`}
                    >
                      <span className="font-bold">Q</span>
                      Quetzales
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCurrencyChange("USD")}
                      className={`flex items-center justify-center gap-2 p-4 rounded-lg border-2 font-medium transition-colors ${
                        currency === "USD"
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border text-muted-foreground hover:border-primary hover:text-primary"
                      }`}
                    >
                      <DollarSign className="w-5 h-5" />
                      Dólares (US$)
                    </button>
                  </div>
                </div>

                {/* Donation Type */}
                <div className="mb-6">
                  <Label className="mb-3 block">Tipo de donación</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setDonationType("unica")}
                      className={`flex items-center justify-center gap-2 p-4 rounded-lg border-2 font-medium transition-colors ${
                        donationType === "unica"
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border text-muted-foreground hover:border-primary hover:text-primary"
                      }`}
                    >
                      <Gift className="w-5 h-5" />
                      Única
                    </button>
                    <button
                      type="button"
                      onClick={() => setDonationType("mensual")}
                      className={`flex items-center justify-center gap-2 p-4 rounded-lg border-2 font-medium transition-colors ${
                        donationType === "mensual"
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border text-muted-foreground hover:border-primary hover:text-primary"
                      }`}
                    >
                      <Repeat className="w-5 h-5" />
                      Mensual
                    </button>
                  </div>
                </div>

                {/* Amount Selection */}
                <div className="mb-6">
                  <Label className="mb-3 block">
                    Monto ({currency === "GTQ" ? "Quetzales" : "Dólares US"})
                  </Label>
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    {donationAmounts.map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => {
                          setSelectedAmount(amount);
                          setCustomAmount("");
                          setCustomAmountError(null);
                        }}
                        className={`p-3 rounded-lg border-2 font-semibold transition-colors ${
                          selectedAmount === amount
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border text-foreground hover:border-primary hover:bg-primary/5"
                        }`}
                      >
                        {currencySymbol}{amount}
                      </button>
                    ))}
                    <div className="col-span-3">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                          {currencySymbol}
                        </span>
                        <Input
                          type="number"
                          placeholder={`Otro monto (múltiplos de ${currencyMultiple})`}
                          className={`text-center font-semibold pl-10 ${customAmountError ? "border-destructive" : ""}`}
                          value={customAmount}
                          onChange={(e) => handleCustomAmountChange(e.target.value)}
                          disabled={isSubmitting}
                          min={minAmount}
                          step={currencyMultiple}
                        />
                      </div>
                      {customAmountError && (
                        <p className="text-xs text-destructive mt-1">{customAmountError}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Mínimo: {currencySymbol}{minAmount} • Múltiplos de {currencySymbol}{currencyMultiple}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Personal Info */}
                <div className="space-y-4 mb-6">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="donor-firstName">Nombres *</Label>
                      <Input
                        id="donor-firstName"
                        placeholder="Tus nombres"
                        value={formData.firstName}
                        onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
                        disabled={isSubmitting}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="donor-lastName">Apellidos *</Label>
                      <Input
                        id="donor-lastName"
                        placeholder="Tus apellidos"
                        value={formData.lastName}
                        onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
                        disabled={isSubmitting}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="donor-email">Correo electrónico *</Label>
                      <Input
                        id="donor-email"
                        type="email"
                        placeholder="tu@email.com"
                        value={formData.email}
                        onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                        disabled={isSubmitting}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="donor-phone">Teléfono</Label>
                      <Input
                        id="donor-phone"
                        placeholder="+502 0000-0000"
                        value={formData.phone}
                        onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="donor-nit">NIT</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">Opcional. Proporciona tu NIT para recibir un recibo deducible de impuestos.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Input
                      id="donor-nit"
                      placeholder="Ej: 12345678-9 o CF"
                      value={formData.nit}
                      onChange={(e) => setFormData((prev) => ({ ...prev, nit: e.target.value }))}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="donor-city">
                        Ciudad {paymentMethod === "tarjeta" && "*"}
                      </Label>
                      <Input
                        id="donor-city"
                        placeholder="Tu ciudad"
                        value={formData.city}
                        onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                        disabled={isSubmitting}
                        required={paymentMethod === "tarjeta"}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="donor-department">
                        Departamento {paymentMethod === "tarjeta" && "*"}
                      </Label>
                      <Select
                        value={formData.department}
                        onValueChange={(value) => setFormData((prev) => ({ ...prev, department: value }))}
                        disabled={isSubmitting}
                      >
                        <SelectTrigger id="donor-department">
                          <SelectValue placeholder="Selecciona departamento" />
                        </SelectTrigger>
                        <SelectContent>
                          {guatemalaDepartments.map((dept) => (
                            <SelectItem key={dept} value={dept}>
                              {dept}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="mb-6">
                  <Label className="mb-3 block">Método de pago</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("tarjeta")}
                      className={`flex items-center justify-center gap-2 p-4 rounded-lg border-2 font-medium transition-colors ${
                        paymentMethod === "tarjeta"
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border text-muted-foreground hover:border-primary hover:text-primary"
                      }`}
                    >
                      <CreditCard className="w-5 h-5" />
                      Tarjeta
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("transferencia")}
                      className={`flex items-center justify-center gap-2 p-4 rounded-lg border-2 font-medium transition-colors ${
                        paymentMethod === "transferencia"
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border text-muted-foreground hover:border-primary hover:text-primary"
                      }`}
                    >
                      <Building className="w-5 h-5" />
                      Transferencia
                    </button>
                  </div>
                </div>

                {/* Credit Card Fields - Only show when payment method is card */}
                {paymentMethod === "tarjeta" && (
                  <div className="mb-6 p-4 rounded-lg border-2 border-primary/20 bg-primary/5">
                    <div className="flex items-center gap-2 mb-4">
                      <Lock className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium text-primary">Pago seguro</span>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="card-number">Número de tarjeta *</Label>
                        <Input
                          id="card-number"
                          placeholder="1234 5678 9012 3456"
                          value={cardData.cardNumber}
                          onChange={(e) => setCardData((prev) => ({ 
                            ...prev, 
                            cardNumber: formatCardNumber(e.target.value) 
                          }))}
                          disabled={isSubmitting}
                          maxLength={19}
                          required
                          autoComplete="cc-number"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="card-exp-month">Mes *</Label>
                          <Input
                            id="card-exp-month"
                            placeholder="MM"
                            value={cardData.expirationMonth}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, "").substring(0, 2);
                              setCardData((prev) => ({ ...prev, expirationMonth: value }));
                            }}
                            disabled={isSubmitting}
                            maxLength={2}
                            required
                            autoComplete="cc-exp-month"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="card-exp-year">Año *</Label>
                          <Input
                            id="card-exp-year"
                            placeholder="AAAA"
                            value={cardData.expirationYear}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, "").substring(0, 4);
                              setCardData((prev) => ({ ...prev, expirationYear: value }));
                            }}
                            disabled={isSubmitting}
                            maxLength={4}
                            required
                            autoComplete="cc-exp-year"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="card-cvv">CVV *</Label>
                          <Input
                            id="card-cvv"
                            type="password"
                            placeholder="123"
                            value={cardData.cvv}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, "").substring(0, 4);
                              setCardData((prev) => ({ ...prev, cvv: value }));
                            }}
                            disabled={isSubmitting}
                            maxLength={4}
                            required
                            autoComplete="cc-csc"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <Button type="submit" size="lg" className="w-full" disabled={isSubmitting || finalAmount <= 0 || !!customAmountError}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <Heart className="w-5 h-5 mr-2" />
                      Donar {finalAmount > 0 ? `${currencySymbol}${finalAmount}` : "Ahora"}
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground mt-4">
                  Tu información está protegida. Recibirás un recibo por correo electrónico.
                </p>
              </form>
            </div>

            {/* Impact Info */}
            <div>
              <h2 className="font-heading text-2xl font-bold text-foreground mb-6">Tu impacto</h2>
              <div className="space-y-4 mb-8">
                {impactItems.map((item) => (
                  <div key={item.amount} className="flex items-center gap-4 p-4 rounded-lg bg-muted">
                    <div className="font-heading font-bold text-xl text-primary">{item.amount}</div>
                    <div className="text-sm text-muted-foreground">{item.description}</div>
                  </div>
                ))}
              </div>

              <div className="bg-soft-green-light rounded-xl p-6">
                <h3 className="font-heading font-semibold text-lg text-foreground mb-4">Beneficios para donantes</h3>
                <ul className="space-y-3">
                  {benefits.map((benefit) => (
                    <li key={benefit} className="flex items-center gap-3 text-sm">
                      <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center">
                        <Check className="w-3 h-3 text-secondary-foreground" />
                      </div>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Bank Info */}
              <div className="mt-8 p-6 rounded-xl border border-border">
                <h3 className="font-heading font-semibold text-foreground mb-3">Datos para transferencia</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    <strong>Banco:</strong> Banco Industrial
                  </p>
                  <p>
                    <strong>Cuenta:</strong> 000-031978-0
                  </p>
                  <p>
                    <strong>Nombre:</strong> El Refugio de la Niñez ONG
                  </p>
                  <p>
                    <strong>Tipo:</strong> Monetaria Quetzales
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 bg-muted">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-heading text-2xl font-bold text-foreground mb-4">Tu confianza es nuestra prioridad</h2>
            <p className="text-muted-foreground mb-6">
              Somos una organización transparente y auditada. El 85% de cada donación va directamente a nuestros
              programas de protección.
            </p>
            <Button variant="outline" asChild>
              <a href="/transparencia">Ver Informes de Transparencia</a>
            </Button>
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
              Por favor verifica los datos de tu donación antes de continuar.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Amount */}
            <div className="flex justify-between items-center p-3 bg-primary/5 rounded-lg">
              <span className="text-sm text-muted-foreground">Monto a donar</span>
              <span className="font-heading font-bold text-2xl text-primary">
                {currencySymbol}{finalAmount}
              </span>
            </div>

            {/* Donation Details */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tipo de donación</span>
                <span className="font-medium">{donationType === "unica" ? "Única" : "Mensual"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Método de pago</span>
                <span className="font-medium">
                  {paymentMethod === "tarjeta" ? "Tarjeta de crédito/débito" : "Transferencia bancaria"}
                </span>
              </div>
              {paymentMethod === "tarjeta" && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tarjeta</span>
                  <span className="font-medium font-mono">{getMaskedCardNumber()}</span>
                </div>
              )}
            </div>

            {/* Donor Info */}
            <div className="border-t pt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nombre</span>
                <span className="font-medium">{formData.firstName} {formData.lastName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Correo</span>
                <span className="font-medium">{formData.email}</span>
              </div>
              {formData.nit && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">NIT</span>
                  <span className="font-medium">{formData.nit}</span>
                </div>
              )}
              {formData.city && formData.department && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ubicación</span>
                  <span className="font-medium">{formData.city}, {formData.department}</span>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowConfirmation(false)}
              className="w-full sm:w-auto"
            >
              Modificar datos
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Confirmar Donación
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Donar;

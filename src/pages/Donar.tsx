import { useState } from "react";
import { Heart, CreditCard, Building, Repeat, Gift, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Layout from "@/components/layout/Layout";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const donationAmounts = [50, 100, 250, 500, 1000];

const impactItems = [
  { amount: "Q50", description: "Material educativo para un niño por un mes" },
  { amount: "Q100", description: "Atención psicológica para una sesión" },
  { amount: "Q250", description: "Kit de higiene para una familia" },
  { amount: "Q500", description: "Beca escolar por un mes" },
  { amount: "Q1,000", description: "Apoyo alimentario familiar por un mes" },
];

const benefits = [
  "Recibo deducible de impuestos",
  "Informe mensual de impacto",
  "Invitación a eventos exclusivos",
  "Reconocimiento en memoria anual",
];

const donationSchema = z.object({
  name: z.string().trim().min(1, "El nombre es requerido").max(100, "Nombre muy largo"),
  email: z.string().trim().email("Correo inválido").max(255, "Correo muy largo"),
  phone: z.string().trim().max(20, "Teléfono muy largo").optional(),
  amount: z.number().min(1, "El monto debe ser mayor a 0"),
});

const Donar = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [donationType, setDonationType] = useState<"unica" | "mensual">("unica");
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"tarjeta" | "transferencia">("tarjeta");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const finalAmount = selectedAmount || (customAmount ? parseInt(customAmount) : 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke("send-email", {
        body: {
          type: "donation",
          name: formData.name,
          email: formData.email,
          phone: formData.phone || undefined,
          amount: finalAmount,
          donationType,
          paymentMethod,
        },
      });

      if (error) throw error;

      toast({
        title: "¡Gracias por tu generosidad!",
        description: "Hemos recibido tu intención de donación. Te enviaremos un correo con los detalles.",
      });

      // Reset form
      setFormData({ name: "", email: "", phone: "" });
      setSelectedAmount(null);
      setCustomAmount("");
    } catch (error: any) {
      console.error("Error processing donation:", error);
      toast({
        title: "Error al procesar",
        description: "No pudimos procesar tu donación. Por favor intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
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
              <form onSubmit={handleSubmit}>
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
                  <Label className="mb-3 block">Monto (Quetzales)</Label>
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    {donationAmounts.map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => {
                          setSelectedAmount(amount);
                          setCustomAmount("");
                        }}
                        className={`p-3 rounded-lg border-2 font-semibold transition-colors ${
                          selectedAmount === amount
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border text-foreground hover:border-primary hover:bg-primary/5"
                        }`}
                      >
                        Q{amount}
                      </button>
                    ))}
                    <div className="col-span-3">
                      <Input
                        type="number"
                        placeholder="Otro monto"
                        className="text-center font-semibold"
                        value={customAmount}
                        onChange={(e) => {
                          setCustomAmount(e.target.value);
                          setSelectedAmount(null);
                        }}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                </div>

                {/* Personal Info */}
                <div className="space-y-4 mb-6">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="donor-name">Nombre completo</Label>
                      <Input
                        id="donor-name"
                        placeholder="Tu nombre"
                        value={formData.name}
                        onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                        disabled={isSubmitting}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="donor-email">Correo electrónico</Label>
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

                <Button type="submit" size="lg" className="w-full" disabled={isSubmitting || finalAmount <= 0}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <Heart className="w-5 h-5 mr-2" />
                      Donar {finalAmount > 0 ? `Q${finalAmount}` : "Ahora"}
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
    </Layout>
  );
};

export default Donar;

import { Heart, CreditCard, Building, Repeat, Gift, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Layout from "@/components/layout/Layout";

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

const Donar = () => {
  return (
    <Layout>
      {/* Hero */}
      <section className="py-20 gradient-warm text-primary-foreground">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <Heart className="w-16 h-16 mx-auto mb-6 animate-pulse" />
            <h1 className="font-heading text-4xl md:text-5xl font-bold mb-6">
              Tu donación transforma vidas
            </h1>
            <p className="text-lg text-primary-foreground/90">
              Cada aporte nos permite continuar protegiendo a niños, niñas 
              y adolescentes que más lo necesitan. Sé parte del cambio.
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
              <h2 className="font-heading text-2xl font-bold text-foreground mb-6">
                Hacer una donación
              </h2>
              
              {/* Donation Type */}
              <div className="mb-6">
                <Label className="mb-3 block">Tipo de donación</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button className="flex items-center justify-center gap-2 p-4 rounded-lg border-2 border-primary bg-primary/5 text-primary font-medium">
                    <Gift className="w-5 h-5" />
                    Única
                  </button>
                  <button className="flex items-center justify-center gap-2 p-4 rounded-lg border-2 border-border text-muted-foreground font-medium hover:border-primary hover:text-primary transition-colors">
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
                      className="p-3 rounded-lg border-2 border-border text-foreground font-semibold hover:border-primary hover:bg-primary/5 transition-colors"
                    >
                      Q{amount}
                    </button>
                  ))}
                  <div className="col-span-3">
                    <Input
                      type="number"
                      placeholder="Otro monto"
                      className="text-center font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Personal Info */}
              <div className="space-y-4 mb-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="donor-name">Nombre completo</Label>
                    <Input id="donor-name" placeholder="Tu nombre" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="donor-email">Correo electrónico</Label>
                    <Input id="donor-email" type="email" placeholder="tu@email.com" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="donor-phone">Teléfono</Label>
                  <Input id="donor-phone" placeholder="+502 0000-0000" />
                </div>
              </div>

              {/* Payment Method */}
              <div className="mb-6">
                <Label className="mb-3 block">Método de pago</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button className="flex items-center justify-center gap-2 p-4 rounded-lg border-2 border-primary bg-primary/5 text-primary font-medium">
                    <CreditCard className="w-5 h-5" />
                    Tarjeta
                  </button>
                  <button className="flex items-center justify-center gap-2 p-4 rounded-lg border-2 border-border text-muted-foreground font-medium hover:border-primary hover:text-primary transition-colors">
                    <Building className="w-5 h-5" />
                    Transferencia
                  </button>
                </div>
              </div>

              <Button size="lg" className="w-full">
                <Heart className="w-5 h-5 mr-2" />
                Donar Ahora
              </Button>

              <p className="text-xs text-center text-muted-foreground mt-4">
                Tu información está protegida con encriptación SSL. 
                Recibirás un recibo por correo electrónico.
              </p>
            </div>

            {/* Impact Info */}
            <div>
              <h2 className="font-heading text-2xl font-bold text-foreground mb-6">
                Tu impacto
              </h2>
              <div className="space-y-4 mb-8">
                {impactItems.map((item) => (
                  <div
                    key={item.amount}
                    className="flex items-center gap-4 p-4 rounded-lg bg-muted"
                  >
                    <div className="font-heading font-bold text-xl text-primary">
                      {item.amount}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {item.description}
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-soft-green-light rounded-xl p-6">
                <h3 className="font-heading font-semibold text-lg text-foreground mb-4">
                  Beneficios para donantes
                </h3>
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
                <h3 className="font-heading font-semibold text-foreground mb-3">
                  Datos para transferencia
                </h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p><strong>Banco:</strong> Banco Industrial</p>
                  <p><strong>Cuenta:</strong> 000-000000-0</p>
                  <p><strong>Nombre:</strong> Fundación Refugio de la Niñez</p>
                  <p><strong>Tipo:</strong> Monetaria Quetzales</p>
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
            <h2 className="font-heading text-2xl font-bold text-foreground mb-4">
              Tu confianza es nuestra prioridad
            </h2>
            <p className="text-muted-foreground mb-6">
              Somos una organización transparente y auditada. El 85% de cada 
              donación va directamente a nuestros programas de protección.
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

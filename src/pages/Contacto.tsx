import { useState } from "react";
import { Mail, Phone, MapPin, Clock, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Layout from "@/components/layout/Layout";
import ContactMap from "@/components/ContactMap";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { sendContactEmail, isEmailJSConfigured } from "@/lib/emailjs";
import { z } from "zod";

interface ContactInfo {
  address: string;
  phone: string;
  phone2: string;
  email: string;
  email2: string;
  schedule: string;
}

const defaultContactInfo: ContactInfo = {
  address: "4ta avenida 10-53 zona 9 Ciudad de Guatemala, Guatemala",
  phone: "+502 2200-0000",
  phone2: "+502 2200-0001",
  email: "info@refugiodelaninez.org",
  email2: "donaciones@refugiodelaninez.org",
  schedule: "Lunes a Viernes, 9:00 AM - 4:00 PM",
};

const contactSchema = z.object({
  name: z.string().trim().min(1, "El nombre es requerido").max(100, "Nombre muy largo"),
  email: z.string().trim().email("Correo inválido").max(255, "Correo muy largo"),
  phone: z.string().trim().max(20, "Teléfono muy largo").optional(),
  subject: z.string().trim().min(1, "El asunto es requerido").max(200, "Asunto muy largo"),
  message: z.string().trim().min(1, "El mensaje es requerido").max(2000, "Mensaje muy largo"),
});

const Contacto = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const { data: contactData } = useQuery({
    queryKey: ["site-content", "contact_info"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_content")
        .select("content")
        .eq("section_key", "contact_info")
        .maybeSingle();
      if (error) throw error;
      return data?.content as unknown as ContactInfo | null;
    },
  });

  const contact = contactData || defaultContactInfo;

  const contactInfoItems = [
    {
      icon: MapPin,
      title: "Dirección",
      details: [contact.address],
    },
    {
      icon: Phone,
      title: "Teléfono",
      details: [contact.phone, contact.phone2].filter(Boolean),
    },
    {
      icon: Mail,
      title: "Correo",
      details: [contact.email, contact.email2].filter(Boolean),
    },
    {
      icon: Clock,
      title: "Horario",
      details: contact.schedule ? contact.schedule.split(", ") : ["Lunes a Viernes", "9:00 AM - 4:00 PM"],
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = contactSchema.safeParse(formData);
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
      // Try EmailJS first (client-side, no domain verification needed)
      if (isEmailJSConfigured()) {
        await sendContactEmail({
          from_name: formData.name,
          from_email: formData.email,
          phone: formData.phone || undefined,
          subject: formData.subject,
          message: formData.message,
          reply_to: formData.email,
        });
      } else {
        // Fallback to Edge Function (requires SMTP configured)
        const { error } = await supabase.functions.invoke("send-email", {
          body: {
            type: "contact",
            name: formData.name,
            email: formData.email,
            phone: formData.phone || undefined,
            subject: formData.subject,
            message: formData.message,
          },
        });

        if (error) throw error;
      }

      toast({
        title: "¡Mensaje enviado!",
        description: "Hemos recibido tu mensaje. Te responderemos pronto.",
      });

      setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast({
        title: "Error al enviar",
        description: "No pudimos enviar tu mensaje. Por favor intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      {/* Hero */}
      <section className="py-20 gradient-hope">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="font-heading text-4xl md:text-5xl font-bold text-foreground mb-6">Contáctanos</h1>
            <p className="text-lg text-muted-foreground">
              ¿Tienes preguntas, sugerencias o deseas colaborar con nosotros? Estamos aquí para escucharte.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-card">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="bg-muted rounded-2xl p-8">
              <h2 className="font-heading text-2xl font-bold text-foreground mb-6">Envíanos un mensaje</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre completo</Label>
                    <Input 
                      id="name" 
                      placeholder="Tu nombre"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Correo electrónico</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="tu@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono (opcional)</Label>
                  <Input 
                    id="phone" 
                    placeholder="+502 0000-0000"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Asunto</Label>
                  <Input 
                    id="subject" 
                    placeholder="¿En qué podemos ayudarte?"
                    value={formData.subject}
                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                    disabled={isSubmitting}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Mensaje</Label>
                  <Textarea 
                    id="message" 
                    placeholder="Escribe tu mensaje aquí..." 
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                    disabled={isSubmitting}
                    required
                  />
                </div>
                <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Enviar Mensaje
                    </>
                  )}
                </Button>
              </form>
            </div>

            {/* Contact Info */}
            <div>
              <h2 className="font-heading text-2xl font-bold text-foreground mb-6">Información de contacto</h2>
              <div className="space-y-6">
                {contactInfoItems.map((item) => (
                  <div key={item.title} className="flex gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                      {item.details.map((detail) => (
                        <p key={detail} className="text-sm text-muted-foreground">
                          {detail}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Interactive Map */}
              <div className="mt-8">
                <ContactMap />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ CTA */}
      <section className="py-16 bg-muted">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="font-heading text-2xl font-bold text-foreground mb-4">¿Preguntas frecuentes?</h2>
            <p className="text-muted-foreground mb-6">
              Consulta nuestra sección de preguntas frecuentes para encontrar respuestas rápidas a las dudas más
              comunes.
            </p>
            <Button variant="outline">Ver Preguntas Frecuentes</Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Contacto;

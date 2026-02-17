import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Loader2 } from "lucide-react";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  display_order: number;
}

const PreguntasFrecuentes = () => {
  const { data: faqs, isLoading } = useQuery({
    queryKey: ["faqs-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("faqs")
        .select("id, question, answer, display_order")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as FaqItem[];
    },
  });

  return (
    <Layout>
      {/* SEO */}
      <title>Preguntas Frecuentes - El Refugio de la Niñez</title>
      <meta
        name="description"
        content="Encuentra respuestas a las preguntas más frecuentes sobre violencia contra la niñez, denuncias y el apoyo que brinda El Refugio de la Niñez."
      />

      {/* Hero */}
      <section className="py-20 gradient-hope">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="font-heading text-4xl md:text-5xl font-bold text-foreground mb-6">
              Preguntas Frecuentes
            </h1>
            <p className="text-lg text-muted-foreground">
              Encuentra respuestas a las dudas más comunes sobre nuestro trabajo, procesos de denuncia y cómo puedes ayudar.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ List */}
      <section className="py-20 bg-card">
        <div className="container max-w-3xl">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : faqs && faqs.length > 0 ? (
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq) => (
                <AccordionItem
                  key={faq.id}
                  value={faq.id}
                  className="border border-border rounded-lg px-6 data-[state=open]:bg-muted/50 transition-colors"
                >
                  <AccordionTrigger className="text-left font-heading text-base md:text-lg font-semibold text-foreground hover:no-underline py-5">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed pb-5 whitespace-pre-line">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <p className="text-center text-muted-foreground py-12">
              No hay preguntas frecuentes disponibles en este momento.
            </p>
          )}
        </div>
      </section>

      {/* JSON-LD for SEO */}
      {faqs && faqs.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: faqs.map((faq) => ({
                "@type": "Question",
                name: faq.question,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: faq.answer,
                },
              })),
            }),
          }}
        />
      )}
    </Layout>
  );
};

export default PreguntasFrecuentes;

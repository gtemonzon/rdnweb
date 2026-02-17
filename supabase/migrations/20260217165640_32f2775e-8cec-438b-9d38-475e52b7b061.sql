
-- Create FAQs table
CREATE TABLE public.faqs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question text NOT NULL,
  answer text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

-- Public can view active FAQs
CREATE POLICY "Public can view active FAQs"
ON public.faqs FOR SELECT
USING (is_active = true);

-- Authorized users can view all FAQs (admin panel)
CREATE POLICY "Authorized users can view all FAQs"
ON public.faqs FOR SELECT
USING (is_admin() OR has_module_permission(auth.uid(), 'content'::app_module, 'can_view'::text));

-- Authorized users can create FAQs
CREATE POLICY "Authorized users can create FAQs"
ON public.faqs FOR INSERT
WITH CHECK (is_admin() OR has_module_permission(auth.uid(), 'content'::app_module, 'can_create'::text));

-- Authorized users can update FAQs
CREATE POLICY "Authorized users can update FAQs"
ON public.faqs FOR UPDATE
USING (is_admin() OR has_module_permission(auth.uid(), 'content'::app_module, 'can_edit_all'::text));

-- Authorized users can delete FAQs
CREATE POLICY "Authorized users can delete FAQs"
ON public.faqs FOR DELETE
USING (is_admin() OR has_module_permission(auth.uid(), 'content'::app_module, 'can_delete_all'::text));

-- Trigger for updated_at
CREATE TRIGGER update_faqs_updated_at
BEFORE UPDATE ON public.faqs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed example data
INSERT INTO public.faqs (question, answer, display_order) VALUES
(
  '¿Qué es violencia sexual?',
  'La violencia sexual es cualquier acto de naturaleza sexual o abuso en contra de una persona sin su libre consentimiento. Incluye tocamientos no deseados, abuso, explotación y cualquier forma de presión o coerción para obtener actos sexuales. En Guatemala, estas situaciones son perseguidas por la ley y se pueden denunciar ante el Ministerio Público o el Instituto Técnico de Capacitación y Productividad (INTECAP), entre otras instituciones.',
  1
),
(
  '¿Qué significa explotación y trata de personas?',
  E'La explotación es forzar a una persona a trabajar, brindar servicios o realizar actos sexuales en contra de su voluntad a cambio de dinero o beneficios.\nLa trata de personas es el proceso de captar, trasladar o albergar personas con fines de explotación. En Guatemala es delito y se persigue penalmente (Código Penal y Ley contra la Trata de Personas).',
  2
),
(
  '¿Cómo se realiza una denuncia por violencia contra la niñez?',
  E'En Guatemala, cualquier persona puede presentar una denuncia por violencia contra niños, niñas o adolescentes en:\n\n• La Procuraduría General de la Nación (PGN)\n• El Ministerio Público (MP)\n• Comisarías de la Policía Nacional Civil (PNC)\n• 1570 (Línea de emergencia)\n\nLa denuncia puede hacerse de forma anónima. Se recomienda acompañarla de la mayor información posible (hora, lugar, personas involucradas, evidencias).',
  3
),
(
  '¿Qué hago si temo por la seguridad de un niño o niña?',
  E'Si existe riesgo inmediato:\n\n• Llama de inmediato a 1562 (Línea de emergencia de niñez en Guatemala).\n• Reporta a la PNC o al MP.\n\nSi el peligro no es inmediato, contacta a organizaciones que ofrecen acompañamiento y apoyo legal/psicosocial.',
  4
),
(
  '¿Qué apoyo brinda El Refugio de la Niñez?',
  E'El Refugio de la Niñez acompaña a niños, niñas, adolescentes y sus familias:\n\n• En procesos de denuncia\n• Con apoyo psicosocial\n• A través de asesoría legal\n• Con programas de protección\n\nTambién trabaja con instituciones para promover políticas públicas y la restitución de derechos vulnerados.',
  5
);

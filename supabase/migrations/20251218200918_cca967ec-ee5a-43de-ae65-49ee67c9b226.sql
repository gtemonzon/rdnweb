-- Create transparency_numerals table (catalog of LAIP Article 10 numerals)
CREATE TABLE public.transparency_numerals (
    id integer PRIMARY KEY,
    title text NOT NULL,
    description text,
    is_active boolean NOT NULL DEFAULT true,
    display_order integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on transparency_numerals
ALTER TABLE public.transparency_numerals ENABLE ROW LEVEL SECURITY;

-- Public can view active numerals
CREATE POLICY "Public can view active numerals"
ON public.transparency_numerals
FOR SELECT
USING (is_active = true);

-- Admins and users with transparency permission can manage numerals
CREATE POLICY "Users with transparency permission can manage numerals"
ON public.transparency_numerals
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_module_permission(auth.uid(), 'transparency'::app_module, 'can_edit_all'::text));

-- Create transparency_documents table
CREATE TABLE public.transparency_documents (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    numeral_id integer NOT NULL REFERENCES public.transparency_numerals(id) ON DELETE CASCADE,
    year integer NOT NULL,
    title text NOT NULL,
    description text,
    file_url text NOT NULL,
    file_type text NOT NULL DEFAULT 'pdf',
    is_active boolean NOT NULL DEFAULT true,
    display_order integer NOT NULL DEFAULT 0,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on transparency_documents
ALTER TABLE public.transparency_documents ENABLE ROW LEVEL SECURITY;

-- Public can view active documents
CREATE POLICY "Public can view active documents"
ON public.transparency_documents
FOR SELECT
USING (is_active = true);

-- Users with transparency permission can view all documents
CREATE POLICY "Users with transparency permission can view all documents"
ON public.transparency_documents
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_module_permission(auth.uid(), 'transparency'::app_module, 'can_view'::text));

-- Users with transparency permission can create documents
CREATE POLICY "Users with transparency permission can create documents"
ON public.transparency_documents
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_module_permission(auth.uid(), 'transparency'::app_module, 'can_create'::text));

-- Users with transparency permission can update documents
CREATE POLICY "Users with transparency permission can update documents"
ON public.transparency_documents
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_module_permission(auth.uid(), 'transparency'::app_module, 'can_edit_all'::text));

-- Users with transparency permission can delete documents
CREATE POLICY "Users with transparency permission can delete documents"
ON public.transparency_documents
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_module_permission(auth.uid(), 'transparency'::app_module, 'can_delete_all'::text));

-- Create triggers for updated_at
CREATE TRIGGER update_transparency_numerals_updated_at
BEFORE UPDATE ON public.transparency_numerals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_transparency_documents_updated_at
BEFORE UPDATE ON public.transparency_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for transparency documents
INSERT INTO storage.buckets (id, name, public) VALUES ('transparency-docs', 'transparency-docs', true);

-- Storage policies for transparency-docs bucket
CREATE POLICY "Public can view transparency docs"
ON storage.objects
FOR SELECT
USING (bucket_id = 'transparency-docs');

CREATE POLICY "Users with transparency permission can upload docs"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'transparency-docs' AND (has_role(auth.uid(), 'admin'::app_role) OR has_module_permission(auth.uid(), 'transparency'::app_module, 'can_create'::text)));

CREATE POLICY "Users with transparency permission can update docs"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'transparency-docs' AND (has_role(auth.uid(), 'admin'::app_role) OR has_module_permission(auth.uid(), 'transparency'::app_module, 'can_edit_all'::text)));

CREATE POLICY "Users with transparency permission can delete docs"
ON storage.objects
FOR DELETE
USING (bucket_id = 'transparency-docs' AND (has_role(auth.uid(), 'admin'::app_role) OR has_module_permission(auth.uid(), 'transparency'::app_module, 'can_delete_all'::text)));

-- Insert initial LAIP Article 10 numerals (adapted for NGOs)
INSERT INTO public.transparency_numerals (id, title, description, is_active, display_order) VALUES
(1, 'Estructura Orgánica', 'Estructura orgánica y funciones de cada una de las dependencias', true, 1),
(2, 'Directorio', 'Directorio de empleados y directivos', true, 2),
(3, 'Número y nombre de funcionarios', 'Información sobre funcionarios y empleados', true, 3),
(4, 'Misión y Objetivos', 'Misión, visión y objetivos institucionales', true, 4),
(5, 'Manuales de procedimientos', 'Manuales de procedimientos, reglamentos, circulares', true, 5),
(6, 'Presupuesto de ingresos y egresos', 'Presupuesto de ingresos y egresos aprobado', true, 6),
(7, 'Informes de ejecución presupuestaria', 'Informes mensuales de ejecución presupuestaria', true, 7),
(8, 'Informes de auditoría', 'Informes de auditoría interna y externa', true, 8),
(9, 'Contratos y convenios', 'Contratos, convenios y condiciones generales', true, 9),
(10, 'Listado de viajes nacionales e internacionales', 'Viajes oficiales, motivo y costos', false, 10),
(11, 'Inventario de bienes', 'Inventario de bienes muebles e inmuebles', true, 11),
(12, 'Listado de obras en ejecución', 'Obras en ejecución o ejecutadas con fondos públicos', false, 12),
(13, 'Contrataciones y adquisiciones', 'Procesos de contratación y adquisición', true, 13),
(14, 'Estados financieros', 'Estados financieros auditados', true, 14),
(15, 'Subsidios y donaciones recibidas', 'Montos y destino de subsidios y donaciones', true, 15),
(16, 'Padrón de beneficiarios', 'Padrón de beneficiarios de programas asistenciales', true, 16),
(17, 'Informes finales', 'Informes finales de comisiones oficiales', false, 17),
(18, 'Concesiones y permisos', 'Concesiones, licencias y permisos otorgados', false, 18),
(19, 'Mecanismos de participación ciudadana', 'Mecanismos de participación ciudadana', true, 19),
(20, 'Proyectos de inversión', 'Proyectos de inversión social', true, 20),
(21, 'Información sobre programas', 'Información sobre programas y proyectos', true, 21),
(22, 'Preguntas frecuentes', 'Preguntas y respuestas frecuentes', true, 22),
(23, 'Contacto para solicitud de información', 'Datos de contacto para solicitar información', true, 23),
(24, 'Formato de solicitud de información', 'Formulario para solicitar información pública', true, 24),
(25, 'Listado de información clasificada', 'Índice de información clasificada como reservada', false, 25),
(26, 'Actas y resoluciones', 'Actas y resoluciones de juntas directivas', true, 26),
(27, 'Dictámenes y opiniones', 'Dictámenes y opiniones de órganos de control', true, 27),
(28, 'Estadísticas institucionales', 'Estadísticas e indicadores de gestión', true, 28),
(29, 'Informes de rendición de cuentas', 'Informes anuales de rendición de cuentas', true, 29);
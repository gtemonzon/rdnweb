-- Create site_content table for administrable content
CREATE TABLE public.site_content (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    section_key TEXT NOT NULL UNIQUE,
    title TEXT,
    content JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create partners table for managing partner organizations
CREATE TABLE public.partners (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    logo_url TEXT,
    website_url TEXT,
    description TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

-- RLS policies for site_content
CREATE POLICY "Public can view site content"
ON public.site_content
FOR SELECT
USING (true);

CREATE POLICY "Users with content module permission can manage site content"
ON public.site_content
FOR ALL
USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_module_permission(auth.uid(), 'content'::app_module, 'can_edit_all')
);

-- RLS policies for partners
CREATE POLICY "Public can view active partners"
ON public.partners
FOR SELECT
USING (is_active = true);

CREATE POLICY "Users with partners module permission can view all partners"
ON public.partners
FOR SELECT
USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_module_permission(auth.uid(), 'partners'::app_module, 'can_view')
);

CREATE POLICY "Users with partners module permission can manage partners"
ON public.partners
FOR ALL
USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_module_permission(auth.uid(), 'partners'::app_module, 'can_edit_all')
);

-- Add triggers for updated_at
CREATE TRIGGER update_site_content_updated_at
BEFORE UPDATE ON public.site_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_partners_updated_at
BEFORE UPDATE ON public.partners
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default content sections
INSERT INTO public.site_content (section_key, title, content) VALUES
('home_stats', 'Estadísticas principales', '[
    {"number": "30+", "label": "Años de experiencia"},
    {"number": "50,000+", "label": "Niños y niñas atendidos"},
    {"number": "6", "label": "Programas activos"},
    {"number": "100+", "label": "Profesionales dedicados"}
]'::jsonb),
('mission', 'Misión', '{"text": "Brindar protección integral y restitución de derechos a niños, niñas y adolescentes víctimas de maltrato, abuso y explotación, a través de programas especializados de atención, prevención e incidencia política."}'::jsonb),
('vision', 'Visión', '{"text": "Ser una organización líder en la protección y restitución de derechos de la niñez y adolescencia en Guatemala, contribuyendo a una sociedad donde todos los niños y niñas vivan libres de violencia."}'::jsonb),
('values', 'Valores', '[
    {"icon": "Heart", "title": "Amor", "description": "Actuamos con amor y compasión hacia cada niño y niña."},
    {"icon": "Shield", "title": "Protección", "description": "Garantizamos espacios seguros y libres de violencia."},
    {"icon": "Users", "title": "Respeto", "description": "Valoramos la dignidad de cada persona."},
    {"icon": "Star", "title": "Excelencia", "description": "Buscamos la mejora continua en todo lo que hacemos."}
]'::jsonb);

-- Insert sample partners
INSERT INTO public.partners (name, logo_url, website_url, description, display_order) VALUES
('UNICEF Guatemala', '/placeholder.svg', 'https://www.unicef.org/guatemala/', 'Fondo de las Naciones Unidas para la Infancia', 1),
('Save the Children', '/placeholder.svg', 'https://www.savethechildren.org/', 'Organización internacional de defensa de los derechos de la infancia', 2),
('USAID', '/placeholder.svg', 'https://www.usaid.gov/', 'Agencia de los Estados Unidos para el Desarrollo Internacional', 3);
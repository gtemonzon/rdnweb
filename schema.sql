-- =============================================================
-- SCHEMA COMPLETO: Refugio de la Niñez
-- Generado: 2026-02-17
-- Base de datos: PostgreSQL (Supabase)
-- =============================================================

-- =============================================================
-- ENUMS
-- =============================================================

CREATE TYPE public.app_module AS ENUM (
  'blog', 'crowdfunding', 'reports', 'donations',
  'content', 'partners', 'receipts', 'transparency', 'vacancies'
);

CREATE TYPE public.app_role AS ENUM ('admin', 'editor');


-- =============================================================
-- TABLES
-- =============================================================

CREATE TABLE public.blog_permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  can_create boolean NOT NULL DEFAULT false,
  can_edit_own boolean NOT NULL DEFAULT false,
  can_edit_all boolean NOT NULL DEFAULT false,
  can_publish boolean NOT NULL DEFAULT false,
  can_delete_own boolean NOT NULL DEFAULT false,
  can_delete_all boolean NOT NULL DEFAULT false,
  allowed_categories text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.blog_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  excerpt text,
  content text,
  image_url text,
  category text NOT NULL DEFAULT 'Noticias'::text,
  author_id uuid,
  published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  youtube_url text
);

CREATE TABLE public.donation_notification_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reference_number text NOT NULL,
  transaction_id text,
  notification_type text NOT NULL DEFAULT 'payment'::text,
  status text NOT NULL DEFAULT 'sent'::text,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_notification_log_ref ON public.donation_notification_log USING btree (reference_number, notification_type);

CREATE TABLE public.donation_receipts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  receipt_type text NOT NULL DEFAULT 'donacion'::text,
  serie text,
  numero text,
  uuid_sat text UNIQUE,
  receptor_nit text NOT NULL,
  receptor_nombre text NOT NULL,
  receptor_direccion text,
  receptor_correo text,
  monto numeric NOT NULL,
  descripcion text NOT NULL,
  donation_id uuid,
  status text NOT NULL DEFAULT 'pending'::text,
  error_message text,
  pdf_url text,
  xml_url text,
  certified_at timestamptz,
  cancelled_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_donation_receipts_created_at ON public.donation_receipts USING btree (created_at DESC);
CREATE INDEX idx_donation_receipts_receptor_nit ON public.donation_receipts USING btree (receptor_nit);
CREATE INDEX idx_donation_receipts_status ON public.donation_receipts USING btree (status);

CREATE TABLE public.donation_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  environment text NOT NULL DEFAULT 'test'::text,
  sender_email_name text NOT NULL DEFAULT 'El Refugio de la Niñez'::text,
  sender_email_address text,
  accounting_emails text[] NOT NULL DEFAULT ARRAY['donaciones@refugiodelaninez.org'::text],
  accounting_email_subject text NOT NULL DEFAULT '💳 Donación confirmada: {{currency_symbol}}{{amount}} - Ref: {{reference}}'::text,
  accounting_email_body text,
  donor_email_enabled boolean NOT NULL DEFAULT true,
  donor_email_subject text NOT NULL DEFAULT 'Gracias por tu donación - El Refugio de la Niñez'::text,
  donor_email_body text,
  send_donor_email boolean NOT NULL DEFAULT true,
  send_accounting_email boolean NOT NULL DEFAULT true,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  min_amount numeric NOT NULL DEFAULT 50,
  suggested_amounts jsonb NOT NULL DEFAULT '[50, 100, 200, 500]'::jsonb,
  min_amount_usd numeric NOT NULL DEFAULT 10,
  suggested_amounts_usd jsonb NOT NULL DEFAULT '[10, 25, 50, 100, 200]'::jsonb
);

CREATE TABLE public.donations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  donor_id uuid REFERENCES public.donors(id),
  donor_name text NOT NULL,
  donor_email text NOT NULL,
  donor_phone text,
  donor_nit text,
  donor_address text,
  amount numeric NOT NULL,
  donation_type text NOT NULL DEFAULT 'unica'::text,
  payment_method text NOT NULL DEFAULT 'tarjeta'::text,
  status text NOT NULL DEFAULT 'pending'::text,
  notes text,
  source text DEFAULT 'web'::text,
  wants_receipt boolean DEFAULT false,
  receipt_id uuid REFERENCES public.donation_receipts(id),
  confirmed_at timestamptz,
  cancelled_at timestamptz,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  fel_issued boolean NOT NULL DEFAULT false,
  fel_series text,
  fel_number text,
  fel_date date,
  fel_recorded_at timestamptz,
  fel_recorded_by text
);
CREATE INDEX idx_donations_created_at ON public.donations USING btree (created_at);
CREATE INDEX idx_donations_donor_email ON public.donations USING btree (donor_email);
CREATE INDEX idx_donations_status ON public.donations USING btree (status);

CREATE TABLE public.donors (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text,
  nit text,
  address text,
  total_donated numeric DEFAULT 0,
  donation_count integer DEFAULT 0,
  first_donation_at timestamptz,
  last_donation_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX idx_donors_email ON public.donors USING btree (email);

CREATE TABLE public.email_rate_limits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address text NOT NULL,
  email_type text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_email_rate_limits_ip_created ON public.email_rate_limits USING btree (ip_address, created_at);

CREATE TABLE public.fel_configuration (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nit_emisor text NOT NULL,
  nombre_comercial text NOT NULL,
  nombre_emisor text NOT NULL,
  direccion text NOT NULL,
  codigo_postal text,
  municipio text NOT NULL,
  departamento text NOT NULL,
  pais text NOT NULL DEFAULT 'GT'::text,
  codigo_establecimiento integer NOT NULL DEFAULT 1,
  correo_copia text,
  ambiente text NOT NULL DEFAULT 'FEL'::text,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.job_vacancies (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  temporality text NOT NULL DEFAULT 'Permanente'::text,
  contract_type text NOT NULL DEFAULT 'Planilla'::text,
  location text NOT NULL DEFAULT 'Guatemala'::text,
  application_url text,
  pdf_url text,
  application_deadline timestamptz NOT NULL,
  published_at timestamptz NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.module_permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  module_name app_module NOT NULL,
  can_view boolean NOT NULL DEFAULT false,
  can_create boolean NOT NULL DEFAULT false,
  can_edit_own boolean NOT NULL DEFAULT false,
  can_edit_all boolean NOT NULL DEFAULT false,
  can_publish boolean NOT NULL DEFAULT false,
  can_delete_own boolean NOT NULL DEFAULT false,
  can_delete_all boolean NOT NULL DEFAULT false,
  custom_settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_name)
);

CREATE TABLE public.partners (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  logo_url text,
  website_url text,
  description text,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  full_name text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.site_content (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_key text NOT NULL UNIQUE,
  title text,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.transparency_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numeral_id integer NOT NULL REFERENCES public.transparency_numerals(id),
  year integer NOT NULL,
  title text NOT NULL,
  description text,
  file_url text NOT NULL,
  file_type text NOT NULL DEFAULT 'pdf'::text,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.transparency_numerals (
  id integer NOT NULL PRIMARY KEY,
  title text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.user_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);


-- =============================================================
-- FUNCTIONS
-- =============================================================

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT public.has_role(auth.uid(), 'admin'::app_role)
$$;

CREATE OR REPLACE FUNCTION public.is_editor()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('admin'::app_role, 'editor'::app_role)
  )
$$;

CREATE OR REPLACE FUNCTION public.has_blog_permission(_user_id uuid, _permission text)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF has_role(_user_id, 'admin'::app_role) THEN RETURN true; END IF;
  RETURN COALESCE(
    CASE _permission
      WHEN 'can_create' THEN (SELECT can_create FROM public.blog_permissions WHERE user_id = _user_id)
      WHEN 'can_edit_own' THEN (SELECT can_edit_own FROM public.blog_permissions WHERE user_id = _user_id)
      WHEN 'can_edit_all' THEN (SELECT can_edit_all FROM public.blog_permissions WHERE user_id = _user_id)
      WHEN 'can_publish' THEN (SELECT can_publish FROM public.blog_permissions WHERE user_id = _user_id)
      WHEN 'can_delete_own' THEN (SELECT can_delete_own FROM public.blog_permissions WHERE user_id = _user_id)
      WHEN 'can_delete_all' THEN (SELECT can_delete_all FROM public.blog_permissions WHERE user_id = _user_id)
      ELSE false
    END, false);
END;
$$;

CREATE OR REPLACE FUNCTION public.has_module_permission(_user_id uuid, _module app_module, _permission text)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF has_role(_user_id, 'admin'::app_role) THEN RETURN true; END IF;
  RETURN COALESCE(
    CASE _permission
      WHEN 'can_view' THEN (SELECT can_view FROM public.module_permissions WHERE user_id = _user_id AND module_name = _module)
      WHEN 'can_create' THEN (SELECT can_create FROM public.module_permissions WHERE user_id = _user_id AND module_name = _module)
      WHEN 'can_edit_own' THEN (SELECT can_edit_own FROM public.module_permissions WHERE user_id = _user_id AND module_name = _module)
      WHEN 'can_edit_all' THEN (SELECT can_edit_all FROM public.module_permissions WHERE user_id = _user_id AND module_name = _module)
      WHEN 'can_publish' THEN (SELECT can_publish FROM public.module_permissions WHERE user_id = _user_id AND module_name = _module)
      WHEN 'can_delete_own' THEN (SELECT can_delete_own FROM public.module_permissions WHERE user_id = _user_id AND module_name = _module)
      WHEN 'can_delete_all' THEN (SELECT can_delete_all FROM public.module_permissions WHERE user_id = _user_id AND module_name = _module)
      ELSE false
    END, false);
END;
$$;

CREATE OR REPLACE FUNCTION public.can_access_category(_user_id uuid, _category text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT CASE
    WHEN has_role(_user_id, 'admin'::app_role) THEN true
    WHEN EXISTS (
      SELECT 1 FROM public.blog_permissions
      WHERE user_id = _user_id
      AND (allowed_categories IS NULL OR _category = ANY(allowed_categories))
    ) THEN true
    ELSE false
  END
$$;

CREATE OR REPLACE FUNCTION public.can_access_module_category(_user_id uuid, _module app_module, _category text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT CASE
    WHEN has_role(_user_id, 'admin'::app_role) THEN true
    WHEN EXISTS (
      SELECT 1 FROM public.module_permissions
      WHERE user_id = _user_id AND module_name = _module
      AND (
        custom_settings->'allowed_categories' IS NULL
        OR custom_settings->'allowed_categories' = '[]'::jsonb
        OR _category = ANY(ARRAY(SELECT jsonb_array_elements_text(custom_settings->'allowed_categories')))
      )
    ) THEN true
    ELSE false
  END
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_published_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.published = true AND (OLD IS NULL OR OLD.published = false) THEN
    NEW.published_at = now();
  ELSIF NEW.published = false THEN
    NEW.published_at = NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_site_content()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.section_key IN ('mission', 'vision') THEN
    IF NEW.content IS NOT NULL
       AND jsonb_typeof(NEW.content) = 'object'
       AND NEW.content ? 'text' THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'Content for % must be {"text": "...", "image_url?": "..."}', NEW.section_key;
  END IF;

  IF NEW.section_key = 'home_stats' THEN
    IF NEW.content IS NOT NULL
       AND jsonb_typeof(NEW.content) = 'array' THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'Content for home_stats must be an array of {"number": ..., "label": "..."}';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.email_rate_limits WHERE created_at < now() - interval '24 hours';
END;
$$;

CREATE OR REPLACE FUNCTION public.get_donation_status(ref_number text)
RETURNS TABLE(status text, confirmed_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT d.status, d.confirmed_at
  FROM public.donations d
  WHERE d.notes LIKE '%' || ref_number || '%'
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$;


-- =============================================================
-- TRIGGERS
-- =============================================================

CREATE TRIGGER update_blog_permissions_updated_at BEFORE UPDATE ON public.blog_permissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_set_published_at BEFORE INSERT OR UPDATE ON public.blog_posts FOR EACH ROW EXECUTE FUNCTION set_published_at();
CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON public.blog_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_donation_receipts_updated_at BEFORE UPDATE ON public.donation_receipts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_donation_settings_updated_at BEFORE UPDATE ON public.donation_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_donations_updated_at BEFORE UPDATE ON public.donations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_donors_updated_at BEFORE UPDATE ON public.donors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_fel_configuration_updated_at BEFORE UPDATE ON public.fel_configuration FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_job_vacancies_updated_at BEFORE UPDATE ON public.job_vacancies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_module_permissions_updated_at BEFORE UPDATE ON public.module_permissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_partners_updated_at BEFORE UPDATE ON public.partners FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_validate_site_content BEFORE INSERT OR UPDATE ON public.site_content FOR EACH ROW EXECUTE FUNCTION validate_site_content();
CREATE TRIGGER update_site_content_updated_at BEFORE UPDATE ON public.site_content FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transparency_documents_updated_at BEFORE UPDATE ON public.transparency_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transparency_numerals_updated_at BEFORE UPDATE ON public.transparency_numerals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- =============================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================

-- blog_permissions
ALTER TABLE public.blog_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage blog permissions" ON public.blog_permissions FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view own permissions" ON public.blog_permissions FOR SELECT USING (auth.uid() = user_id);

-- blog_posts
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can delete any post" ON public.blog_posts FOR DELETE USING (is_admin());
CREATE POLICY "Admins can insert any post" ON public.blog_posts FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update any post" ON public.blog_posts FOR UPDATE USING (is_admin());
CREATE POLICY "Editors and admins can view all posts" ON public.blog_posts FOR SELECT USING (is_editor());
CREATE POLICY "Editors can delete own posts" ON public.blog_posts FOR DELETE USING (has_role(auth.uid(), 'editor'::app_role) AND (author_id = auth.uid()));
CREATE POLICY "Editors can insert own posts" ON public.blog_posts FOR INSERT WITH CHECK (has_role(auth.uid(), 'editor'::app_role) AND (author_id = auth.uid()));
CREATE POLICY "Editors can update own posts" ON public.blog_posts FOR UPDATE USING (has_role(auth.uid(), 'editor'::app_role) AND (author_id = auth.uid()));
CREATE POLICY "Public can view published posts" ON public.blog_posts FOR SELECT USING (published = true);

-- donation_notification_log
ALTER TABLE public.donation_notification_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Only admins can view notification log" ON public.donation_notification_log FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Service role can insert notification log" ON public.donation_notification_log FOR INSERT WITH CHECK (true);

-- donation_receipts
ALTER TABLE public.donation_receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Only admins can create receipts" ON public.donation_receipts FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Only admins can delete receipts" ON public.donation_receipts FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Only admins can update receipts" ON public.donation_receipts FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Only admins can view receipts" ON public.donation_receipts FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- donation_settings
ALTER TABLE public.donation_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage donation settings" ON public.donation_settings FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Service role can read donation settings" ON public.donation_settings FOR SELECT USING (true);

-- donations
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Only admins can create donations" ON public.donations FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Only admins can delete donations" ON public.donations FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Only admins can update donations" ON public.donations FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Only admins can view donations" ON public.donations FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- donors
ALTER TABLE public.donors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Only admins can create donors" ON public.donors FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Only admins can delete donors" ON public.donors FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Only admins can update donors" ON public.donors FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Only admins can view donors" ON public.donors FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- email_rate_limits (no RLS policies)
ALTER TABLE public.email_rate_limits ENABLE ROW LEVEL SECURITY;

-- fel_configuration
ALTER TABLE public.fel_configuration ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage FEL configuration" ON public.fel_configuration FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users with receipts permission can view FEL config" ON public.fel_configuration FOR SELECT USING (has_module_permission(auth.uid(), 'receipts'::app_module, 'can_view'::text));

-- job_vacancies
ALTER TABLE public.job_vacancies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authorized users can create vacancies" ON public.job_vacancies FOR INSERT WITH CHECK (is_admin() OR has_module_permission(auth.uid(), 'vacancies'::app_module, 'can_create'::text));
CREATE POLICY "Authorized users can delete vacancies" ON public.job_vacancies FOR DELETE USING (is_admin() OR has_module_permission(auth.uid(), 'vacancies'::app_module, 'can_delete_all'::text) OR (has_module_permission(auth.uid(), 'vacancies'::app_module, 'can_delete_own'::text) AND (created_by = auth.uid())));
CREATE POLICY "Authorized users can update vacancies" ON public.job_vacancies FOR UPDATE USING (is_admin() OR has_module_permission(auth.uid(), 'vacancies'::app_module, 'can_edit_all'::text) OR (has_module_permission(auth.uid(), 'vacancies'::app_module, 'can_edit_own'::text) AND (created_by = auth.uid())));
CREATE POLICY "Authorized users can view all vacancies" ON public.job_vacancies FOR SELECT USING (is_admin() OR has_module_permission(auth.uid(), 'vacancies'::app_module, 'can_view'::text));
CREATE POLICY "Public can view active vacancies" ON public.job_vacancies FOR SELECT USING ((is_active = true) AND (application_deadline >= now()));

-- module_permissions
ALTER TABLE public.module_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage module permissions" ON public.module_permissions FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view own permissions" ON public.module_permissions FOR SELECT USING (auth.uid() = user_id);

-- partners
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can delete partners" ON public.partners FOR DELETE USING (is_admin() OR has_module_permission(auth.uid(), 'partners'::app_module, 'can_delete_all'::text));
CREATE POLICY "Admins can insert partners" ON public.partners FOR INSERT WITH CHECK (is_admin() OR has_module_permission(auth.uid(), 'partners'::app_module, 'can_create'::text));
CREATE POLICY "Admins can update partners" ON public.partners FOR UPDATE USING (is_admin() OR has_module_permission(auth.uid(), 'partners'::app_module, 'can_edit_all'::text));
CREATE POLICY "Authorized users can view all partners" ON public.partners FOR SELECT USING (is_admin() OR has_module_permission(auth.uid(), 'partners'::app_module, 'can_view'::text));
CREATE POLICY "Public can view active partners" ON public.partners FOR SELECT USING (is_active = true);

-- profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view profiles" ON public.profiles FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- site_content
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can delete site content" ON public.site_content FOR DELETE USING (is_admin());
CREATE POLICY "Admins can insert site content" ON public.site_content FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update site content" ON public.site_content FOR UPDATE USING (is_admin());
CREATE POLICY "Public can view site content" ON public.site_content FOR SELECT USING (true);

-- transparency_documents
ALTER TABLE public.transparency_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authorized users can delete documents" ON public.transparency_documents FOR DELETE USING (is_admin() OR has_module_permission(auth.uid(), 'transparency'::app_module, 'can_delete_all'::text));
CREATE POLICY "Authorized users can insert documents" ON public.transparency_documents FOR INSERT WITH CHECK (is_admin() OR has_module_permission(auth.uid(), 'transparency'::app_module, 'can_create'::text));
CREATE POLICY "Authorized users can update documents" ON public.transparency_documents FOR UPDATE USING (is_admin() OR has_module_permission(auth.uid(), 'transparency'::app_module, 'can_edit_all'::text));
CREATE POLICY "Authorized users can view all documents" ON public.transparency_documents FOR SELECT USING (is_admin() OR has_module_permission(auth.uid(), 'transparency'::app_module, 'can_view'::text));
CREATE POLICY "Public can view active documents" ON public.transparency_documents FOR SELECT USING (is_active = true);

-- transparency_numerals
ALTER TABLE public.transparency_numerals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authorized users can delete numerals" ON public.transparency_numerals FOR DELETE USING (is_admin() OR has_module_permission(auth.uid(), 'transparency'::app_module, 'can_delete_all'::text));
CREATE POLICY "Authorized users can insert numerals" ON public.transparency_numerals FOR INSERT WITH CHECK (is_admin() OR has_module_permission(auth.uid(), 'transparency'::app_module, 'can_create'::text));
CREATE POLICY "Authorized users can update numerals" ON public.transparency_numerals FOR UPDATE USING (is_admin() OR has_module_permission(auth.uid(), 'transparency'::app_module, 'can_edit_all'::text));
CREATE POLICY "Authorized users can view all numerals" ON public.transparency_numerals FOR SELECT USING (is_admin() OR has_module_permission(auth.uid(), 'transparency'::app_module, 'can_view'::text));
CREATE POLICY "Public can view active numerals" ON public.transparency_numerals FOR SELECT USING (is_active = true);

-- user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);


-- =============================================================
-- STORAGE BUCKETS
-- =============================================================

INSERT INTO storage.buckets (id, name, public) VALUES ('site-images', 'site-images', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('transparency-docs', 'transparency-docs', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('vacancies-docs', 'vacancies-docs', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('transfer-receipts', 'transfer-receipts', false);

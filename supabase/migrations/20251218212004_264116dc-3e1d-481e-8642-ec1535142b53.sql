-- Create storage bucket for vacancy documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('vacancies-docs', 'vacancies-docs', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for vacancies-docs bucket
CREATE POLICY "Public can view vacancy documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'vacancies-docs');

CREATE POLICY "Users with vacancies permission can upload documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'vacancies-docs' 
  AND (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_module_permission(auth.uid(), 'vacancies'::app_module, 'can_create'::text)
  )
);

CREATE POLICY "Users with vacancies permission can update documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'vacancies-docs' 
  AND (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_module_permission(auth.uid(), 'vacancies'::app_module, 'can_edit_all'::text)
  )
);

CREATE POLICY "Users with vacancies permission can delete documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'vacancies-docs' 
  AND (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_module_permission(auth.uid(), 'vacancies'::app_module, 'can_delete_all'::text)
  )
);

-- Create job_vacancies table
CREATE TABLE public.job_vacancies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  temporality TEXT NOT NULL DEFAULT 'Permanente',
  contract_type TEXT NOT NULL DEFAULT 'Planilla',
  location TEXT NOT NULL DEFAULT 'Guatemala',
  application_url TEXT,
  pdf_url TEXT,
  application_deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  published_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.job_vacancies ENABLE ROW LEVEL SECURITY;

-- RLS Policies for job_vacancies

-- Public can view active vacancies that haven't expired
CREATE POLICY "Public can view active vacancies"
ON public.job_vacancies
FOR SELECT
USING (is_active = true AND application_deadline >= now());

-- Users with vacancies permission can view all vacancies
CREATE POLICY "Users with vacancies permission can view all"
ON public.job_vacancies
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_module_permission(auth.uid(), 'vacancies'::app_module, 'can_view'::text)
);

-- Users with vacancies permission can create vacancies
CREATE POLICY "Users with vacancies permission can create"
ON public.job_vacancies
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_module_permission(auth.uid(), 'vacancies'::app_module, 'can_create'::text)
);

-- Users with vacancies permission can update vacancies
CREATE POLICY "Users with vacancies permission can update"
ON public.job_vacancies
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR (has_module_permission(auth.uid(), 'vacancies'::app_module, 'can_edit_own'::text) AND created_by = auth.uid())
  OR has_module_permission(auth.uid(), 'vacancies'::app_module, 'can_edit_all'::text)
);

-- Users with vacancies permission can delete vacancies
CREATE POLICY "Users with vacancies permission can delete"
ON public.job_vacancies
FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR (has_module_permission(auth.uid(), 'vacancies'::app_module, 'can_delete_own'::text) AND created_by = auth.uid())
  OR has_module_permission(auth.uid(), 'vacancies'::app_module, 'can_delete_all'::text)
);

-- Trigger for updated_at
CREATE TRIGGER update_job_vacancies_updated_at
BEFORE UPDATE ON public.job_vacancies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
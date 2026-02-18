-- Create public-assets storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('public-assets', 'public-assets', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for public-assets bucket
CREATE POLICY "Public can view public-assets"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'public-assets');

CREATE POLICY "Admins can upload to public-assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'public-assets'
  AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.is_editor())
);

CREATE POLICY "Admins can update public-assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'public-assets'
  AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.is_editor())
);

CREATE POLICY "Admins can delete public-assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'public-assets'
  AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.is_editor())
);

-- Create assets metadata table
CREATE TABLE IF NOT EXISTS public.assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  original_url TEXT,
  large_url TEXT NOT NULL,
  thumb_url TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  size_bytes INTEGER,
  original_size_bytes INTEGER,
  mime_type TEXT DEFAULT 'image/webp',
  folder TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

-- Public can read assets
CREATE POLICY "Public can view assets"
ON public.assets FOR SELECT
TO anon, authenticated
USING (true);

-- Editors and admins can insert
CREATE POLICY "Editors can create assets"
ON public.assets FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role) OR public.is_editor()
);

-- Admins can update
CREATE POLICY "Admins can update assets"
ON public.assets FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete
CREATE POLICY "Admins can delete assets"
ON public.assets FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

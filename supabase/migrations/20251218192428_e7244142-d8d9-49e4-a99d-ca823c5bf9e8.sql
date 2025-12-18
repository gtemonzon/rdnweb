-- Create storage bucket for site images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('site-images', 'site-images', true);

-- Policy: Anyone can view images (public bucket)
CREATE POLICY "Public can view site images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'site-images');

-- Policy: Admins and users with content permission can upload images
CREATE POLICY "Admins can upload site images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'site-images' 
  AND (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_module_permission(auth.uid(), 'content'::app_module, 'can_edit_all'::text)
  )
);

-- Policy: Admins and users with content permission can update images
CREATE POLICY "Admins can update site images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'site-images' 
  AND (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_module_permission(auth.uid(), 'content'::app_module, 'can_edit_all'::text)
  )
);

-- Policy: Admins and users with content permission can delete images
CREATE POLICY "Admins can delete site images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'site-images' 
  AND (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_module_permission(auth.uid(), 'content'::app_module, 'can_edit_all'::text)
  )
);
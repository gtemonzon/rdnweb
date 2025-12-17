-- Create blog_permissions table for granular permissions
CREATE TABLE public.blog_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  can_create boolean NOT NULL DEFAULT false,
  can_edit_own boolean NOT NULL DEFAULT false,
  can_edit_all boolean NOT NULL DEFAULT false,
  can_publish boolean NOT NULL DEFAULT false,
  can_delete_own boolean NOT NULL DEFAULT false,
  can_delete_all boolean NOT NULL DEFAULT false,
  allowed_categories text[] DEFAULT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.blog_permissions ENABLE ROW LEVEL SECURITY;

-- Only admins can manage blog permissions
CREATE POLICY "Admins can manage blog permissions"
ON public.blog_permissions
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Users can view their own permissions
CREATE POLICY "Users can view own permissions"
ON public.blog_permissions
FOR SELECT
USING (auth.uid() = user_id);

-- Create function to check blog permissions
CREATE OR REPLACE FUNCTION public.has_blog_permission(_user_id uuid, _permission text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _result boolean;
BEGIN
  -- Admins always have all permissions
  IF has_role(_user_id, 'admin'::app_role) THEN
    RETURN true;
  END IF;
  
  -- Check specific permission
  EXECUTE format('SELECT %I FROM public.blog_permissions WHERE user_id = $1', _permission)
  INTO _result
  USING _user_id;
  
  RETURN COALESCE(_result, false);
END;
$$;

-- Create function to check if user can access category
CREATE OR REPLACE FUNCTION public.can_access_category(_user_id uuid, _category text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    CASE 
      -- Admins can access all categories
      WHEN has_role(_user_id, 'admin'::app_role) THEN true
      -- Check if allowed_categories is null (all categories) or contains the category
      WHEN EXISTS (
        SELECT 1 FROM public.blog_permissions 
        WHERE user_id = _user_id 
        AND (allowed_categories IS NULL OR _category = ANY(allowed_categories))
      ) THEN true
      ELSE false
    END
$$;

-- Trigger for updated_at
CREATE TRIGGER update_blog_permissions_updated_at
BEFORE UPDATE ON public.blog_permissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default permissions for existing editors
INSERT INTO public.blog_permissions (user_id, can_create, can_edit_own, can_edit_all, can_publish, can_delete_own, can_delete_all)
SELECT ur.user_id, true, true, false, false, false, false
FROM public.user_roles ur
WHERE ur.role = 'editor'
ON CONFLICT (user_id) DO NOTHING;
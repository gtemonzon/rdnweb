-- Create enum for modules
CREATE TYPE public.app_module AS ENUM ('blog', 'crowdfunding', 'reports', 'donations', 'content', 'partners');

-- Create module_permissions table
CREATE TABLE public.module_permissions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    module_name app_module NOT NULL,
    can_view BOOLEAN NOT NULL DEFAULT false,
    can_create BOOLEAN NOT NULL DEFAULT false,
    can_edit_own BOOLEAN NOT NULL DEFAULT false,
    can_edit_all BOOLEAN NOT NULL DEFAULT false,
    can_publish BOOLEAN NOT NULL DEFAULT false,
    can_delete_own BOOLEAN NOT NULL DEFAULT false,
    can_delete_all BOOLEAN NOT NULL DEFAULT false,
    custom_settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, module_name)
);

-- Enable RLS
ALTER TABLE public.module_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage module permissions"
ON public.module_permissions
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own permissions"
ON public.module_permissions
FOR SELECT
USING (auth.uid() = user_id);

-- Migrate existing blog_permissions to module_permissions
INSERT INTO public.module_permissions (user_id, module_name, can_view, can_create, can_edit_own, can_edit_all, can_publish, can_delete_own, can_delete_all, custom_settings)
SELECT 
    user_id,
    'blog'::app_module,
    true,
    can_create,
    can_edit_own,
    can_edit_all,
    can_publish,
    can_delete_own,
    can_delete_all,
    CASE 
        WHEN allowed_categories IS NOT NULL 
        THEN jsonb_build_object('allowed_categories', allowed_categories)
        ELSE '{}'::jsonb
    END
FROM public.blog_permissions;

-- Create function to check module permissions
CREATE OR REPLACE FUNCTION public.has_module_permission(_user_id uuid, _module app_module, _permission text)
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
    
    -- Check specific permission for the module
    EXECUTE format('SELECT %I FROM public.module_permissions WHERE user_id = $1 AND module_name = $2', _permission)
    INTO _result
    USING _user_id, _module;
    
    RETURN COALESCE(_result, false);
END;
$$;

-- Create function to check module category access (for blog)
CREATE OR REPLACE FUNCTION public.can_access_module_category(_user_id uuid, _module app_module, _category text)
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
            -- Check if custom_settings has allowed_categories
            WHEN EXISTS (
                SELECT 1 FROM public.module_permissions 
                WHERE user_id = _user_id 
                AND module_name = _module
                AND (
                    custom_settings->'allowed_categories' IS NULL 
                    OR custom_settings->'allowed_categories' = '[]'::jsonb
                    OR _category = ANY(ARRAY(SELECT jsonb_array_elements_text(custom_settings->'allowed_categories')))
                )
            ) THEN true
            ELSE false
        END
$$;

-- Create trigger for updated_at
CREATE TRIGGER update_module_permissions_updated_at
BEFORE UPDATE ON public.module_permissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
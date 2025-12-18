-- Fix 1: Replace dynamic SQL in has_blog_permission with static CASE statements
CREATE OR REPLACE FUNCTION public.has_blog_permission(_user_id uuid, _permission text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Admins always have all permissions
  IF has_role(_user_id, 'admin'::app_role) THEN
    RETURN true;
  END IF;
  
  -- Check specific permission using static CASE (no dynamic SQL)
  RETURN COALESCE(
    CASE _permission
      WHEN 'can_create' THEN (SELECT can_create FROM public.blog_permissions WHERE user_id = _user_id)
      WHEN 'can_edit_own' THEN (SELECT can_edit_own FROM public.blog_permissions WHERE user_id = _user_id)
      WHEN 'can_edit_all' THEN (SELECT can_edit_all FROM public.blog_permissions WHERE user_id = _user_id)
      WHEN 'can_publish' THEN (SELECT can_publish FROM public.blog_permissions WHERE user_id = _user_id)
      WHEN 'can_delete_own' THEN (SELECT can_delete_own FROM public.blog_permissions WHERE user_id = _user_id)
      WHEN 'can_delete_all' THEN (SELECT can_delete_all FROM public.blog_permissions WHERE user_id = _user_id)
      ELSE false
    END,
    false
  );
END;
$$;

-- Fix 2: Replace dynamic SQL in has_module_permission with static CASE statements
CREATE OR REPLACE FUNCTION public.has_module_permission(_user_id uuid, _module app_module, _permission text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Admins always have all permissions
  IF has_role(_user_id, 'admin'::app_role) THEN
    RETURN true;
  END IF;
  
  -- Check specific permission using static CASE (no dynamic SQL)
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
    END,
    false
  );
END;
$$;

-- Fix 3: Add DELETE policy for donors table
CREATE POLICY "Users with donations permission can delete donors"
ON public.donors FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_module_permission(auth.uid(), 'donations'::app_module, 'can_delete_all'::text)
);
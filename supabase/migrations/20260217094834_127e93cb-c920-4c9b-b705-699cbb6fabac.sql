
-- ============================================================
-- A) FIX: donation_settings public exposure
-- ============================================================

-- 1) Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Service role can read donation settings" ON public.donation_settings;

-- 2) Create admin-only SELECT policy (the ALL policy already covers admin,
--    but an explicit SELECT for clarity)
CREATE POLICY "Only admins can read donation settings"
  ON public.donation_settings
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 3) Restrict the ALL policy to authenticated only
DROP POLICY IF EXISTS "Admins can manage donation settings" ON public.donation_settings;
CREATE POLICY "Admins can manage donation settings"
  ON public.donation_settings
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 4) Create SECURITY DEFINER RPC for public-safe access
CREATE OR REPLACE FUNCTION public.get_public_donation_settings()
RETURNS TABLE(
  min_amount numeric,
  suggested_amounts jsonb,
  min_amount_usd numeric,
  suggested_amounts_usd jsonb
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT
    ds.min_amount,
    ds.suggested_amounts,
    ds.min_amount_usd,
    ds.suggested_amounts_usd
  FROM public.donation_settings ds
  LIMIT 1;
$$;

-- Grant execute to anon and authenticated
GRANT EXECUTE ON FUNCTION public.get_public_donation_settings() TO anon, authenticated;

-- ============================================================
-- C) RLS hardening: explicit role targets
-- ============================================================

-- blog_posts: public SELECT should be explicit
DROP POLICY IF EXISTS "Public can view published posts" ON public.blog_posts;
CREATE POLICY "Public can view published posts"
  ON public.blog_posts
  FOR SELECT
  TO anon, authenticated
  USING (published = true);

DROP POLICY IF EXISTS "Editors and admins can view all posts" ON public.blog_posts;
CREATE POLICY "Editors and admins can view all posts"
  ON public.blog_posts
  FOR SELECT
  TO authenticated
  USING (is_editor());

DROP POLICY IF EXISTS "Admins can insert any post" ON public.blog_posts;
CREATE POLICY "Admins can insert any post"
  ON public.blog_posts FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can update any post" ON public.blog_posts;
CREATE POLICY "Admins can update any post"
  ON public.blog_posts FOR UPDATE
  TO authenticated
  USING (is_admin());

DROP POLICY IF EXISTS "Admins can delete any post" ON public.blog_posts;
CREATE POLICY "Admins can delete any post"
  ON public.blog_posts FOR DELETE
  TO authenticated
  USING (is_admin());

DROP POLICY IF EXISTS "Editors can insert own posts" ON public.blog_posts;
CREATE POLICY "Editors can insert own posts"
  ON public.blog_posts FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'editor'::app_role) AND author_id = auth.uid());

DROP POLICY IF EXISTS "Editors can update own posts" ON public.blog_posts;
CREATE POLICY "Editors can update own posts"
  ON public.blog_posts FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'editor'::app_role) AND author_id = auth.uid());

DROP POLICY IF EXISTS "Editors can delete own posts" ON public.blog_posts;
CREATE POLICY "Editors can delete own posts"
  ON public.blog_posts FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'editor'::app_role) AND author_id = auth.uid());

-- partners: public SELECT
DROP POLICY IF EXISTS "Public can view active partners" ON public.partners;
CREATE POLICY "Public can view active partners"
  ON public.partners
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Authorized users can view all partners" ON public.partners;
CREATE POLICY "Authorized users can view all partners"
  ON public.partners FOR SELECT
  TO authenticated
  USING (is_admin() OR has_module_permission(auth.uid(), 'partners'::app_module, 'can_view'::text));

DROP POLICY IF EXISTS "Admins can insert partners" ON public.partners;
CREATE POLICY "Admins can insert partners"
  ON public.partners FOR INSERT
  TO authenticated
  WITH CHECK (is_admin() OR has_module_permission(auth.uid(), 'partners'::app_module, 'can_create'::text));

DROP POLICY IF EXISTS "Admins can update partners" ON public.partners;
CREATE POLICY "Admins can update partners"
  ON public.partners FOR UPDATE
  TO authenticated
  USING (is_admin() OR has_module_permission(auth.uid(), 'partners'::app_module, 'can_edit_all'::text));

DROP POLICY IF EXISTS "Admins can delete partners" ON public.partners;
CREATE POLICY "Admins can delete partners"
  ON public.partners FOR DELETE
  TO authenticated
  USING (is_admin() OR has_module_permission(auth.uid(), 'partners'::app_module, 'can_delete_all'::text));

-- site_content: public SELECT
DROP POLICY IF EXISTS "Public can view site content" ON public.site_content;
CREATE POLICY "Public can view site content"
  ON public.site_content FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can insert site content" ON public.site_content;
CREATE POLICY "Admins can insert site content"
  ON public.site_content FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can update site content" ON public.site_content;
CREATE POLICY "Admins can update site content"
  ON public.site_content FOR UPDATE
  TO authenticated
  USING (is_admin());

DROP POLICY IF EXISTS "Admins can delete site content" ON public.site_content;
CREATE POLICY "Admins can delete site content"
  ON public.site_content FOR DELETE
  TO authenticated
  USING (is_admin());

-- transparency_numerals: public SELECT
DROP POLICY IF EXISTS "Public can view active numerals" ON public.transparency_numerals;
CREATE POLICY "Public can view active numerals"
  ON public.transparency_numerals FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Authorized users can view all numerals" ON public.transparency_numerals;
CREATE POLICY "Authorized users can view all numerals"
  ON public.transparency_numerals FOR SELECT
  TO authenticated
  USING (is_admin() OR has_module_permission(auth.uid(), 'transparency'::app_module, 'can_view'::text));

DROP POLICY IF EXISTS "Authorized users can insert numerals" ON public.transparency_numerals;
CREATE POLICY "Authorized users can insert numerals"
  ON public.transparency_numerals FOR INSERT
  TO authenticated
  WITH CHECK (is_admin() OR has_module_permission(auth.uid(), 'transparency'::app_module, 'can_create'::text));

DROP POLICY IF EXISTS "Authorized users can update numerals" ON public.transparency_numerals;
CREATE POLICY "Authorized users can update numerals"
  ON public.transparency_numerals FOR UPDATE
  TO authenticated
  USING (is_admin() OR has_module_permission(auth.uid(), 'transparency'::app_module, 'can_edit_all'::text));

DROP POLICY IF EXISTS "Authorized users can delete numerals" ON public.transparency_numerals;
CREATE POLICY "Authorized users can delete numerals"
  ON public.transparency_numerals FOR DELETE
  TO authenticated
  USING (is_admin() OR has_module_permission(auth.uid(), 'transparency'::app_module, 'can_delete_all'::text));

-- transparency_documents: public SELECT
DROP POLICY IF EXISTS "Public can view active documents" ON public.transparency_documents;
CREATE POLICY "Public can view active documents"
  ON public.transparency_documents FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Authorized users can view all documents" ON public.transparency_documents;
CREATE POLICY "Authorized users can view all documents"
  ON public.transparency_documents FOR SELECT
  TO authenticated
  USING (is_admin() OR has_module_permission(auth.uid(), 'transparency'::app_module, 'can_view'::text));

DROP POLICY IF EXISTS "Authorized users can insert documents" ON public.transparency_documents;
CREATE POLICY "Authorized users can insert documents"
  ON public.transparency_documents FOR INSERT
  TO authenticated
  WITH CHECK (is_admin() OR has_module_permission(auth.uid(), 'transparency'::app_module, 'can_create'::text));

DROP POLICY IF EXISTS "Authorized users can update documents" ON public.transparency_documents;
CREATE POLICY "Authorized users can update documents"
  ON public.transparency_documents FOR UPDATE
  TO authenticated
  USING (is_admin() OR has_module_permission(auth.uid(), 'transparency'::app_module, 'can_edit_all'::text));

DROP POLICY IF EXISTS "Authorized users can delete documents" ON public.transparency_documents;
CREATE POLICY "Authorized users can delete documents"
  ON public.transparency_documents FOR DELETE
  TO authenticated
  USING (is_admin() OR has_module_permission(auth.uid(), 'transparency'::app_module, 'can_delete_all'::text));

-- job_vacancies: public SELECT
DROP POLICY IF EXISTS "Public can view active vacancies" ON public.job_vacancies;
CREATE POLICY "Public can view active vacancies"
  ON public.job_vacancies FOR SELECT
  TO anon, authenticated
  USING (is_active = true AND application_deadline >= now());

DROP POLICY IF EXISTS "Authorized users can view all vacancies" ON public.job_vacancies;
CREATE POLICY "Authorized users can view all vacancies"
  ON public.job_vacancies FOR SELECT
  TO authenticated
  USING (is_admin() OR has_module_permission(auth.uid(), 'vacancies'::app_module, 'can_view'::text));

DROP POLICY IF EXISTS "Authorized users can create vacancies" ON public.job_vacancies;
CREATE POLICY "Authorized users can create vacancies"
  ON public.job_vacancies FOR INSERT
  TO authenticated
  WITH CHECK (is_admin() OR has_module_permission(auth.uid(), 'vacancies'::app_module, 'can_create'::text));

DROP POLICY IF EXISTS "Authorized users can update vacancies" ON public.job_vacancies;
CREATE POLICY "Authorized users can update vacancies"
  ON public.job_vacancies FOR UPDATE
  TO authenticated
  USING (is_admin() OR has_module_permission(auth.uid(), 'vacancies'::app_module, 'can_edit_all'::text) OR (has_module_permission(auth.uid(), 'vacancies'::app_module, 'can_edit_own'::text) AND created_by = auth.uid()));

DROP POLICY IF EXISTS "Authorized users can delete vacancies" ON public.job_vacancies;
CREATE POLICY "Authorized users can delete vacancies"
  ON public.job_vacancies FOR DELETE
  TO authenticated
  USING (is_admin() OR has_module_permission(auth.uid(), 'vacancies'::app_module, 'can_delete_all'::text) OR (has_module_permission(auth.uid(), 'vacancies'::app_module, 'can_delete_own'::text) AND created_by = auth.uid()));

-- donations: admin-only, explicit TO
DROP POLICY IF EXISTS "Only admins can view donations" ON public.donations;
CREATE POLICY "Only admins can view donations"
  ON public.donations FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Only admins can create donations" ON public.donations;
CREATE POLICY "Only admins can create donations"
  ON public.donations FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Only admins can update donations" ON public.donations;
CREATE POLICY "Only admins can update donations"
  ON public.donations FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Only admins can delete donations" ON public.donations;
CREATE POLICY "Only admins can delete donations"
  ON public.donations FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- donors: admin-only, explicit TO
DROP POLICY IF EXISTS "Only admins can view donors" ON public.donors;
CREATE POLICY "Only admins can view donors"
  ON public.donors FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Only admins can create donors" ON public.donors;
CREATE POLICY "Only admins can create donors"
  ON public.donors FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Only admins can update donors" ON public.donors;
CREATE POLICY "Only admins can update donors"
  ON public.donors FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Only admins can delete donors" ON public.donors;
CREATE POLICY "Only admins can delete donors"
  ON public.donors FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- donation_receipts: admin-only, explicit TO
DROP POLICY IF EXISTS "Only admins can view receipts" ON public.donation_receipts;
CREATE POLICY "Only admins can view receipts"
  ON public.donation_receipts FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Only admins can create receipts" ON public.donation_receipts;
CREATE POLICY "Only admins can create receipts"
  ON public.donation_receipts FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Only admins can update receipts" ON public.donation_receipts;
CREATE POLICY "Only admins can update receipts"
  ON public.donation_receipts FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Only admins can delete receipts" ON public.donation_receipts;
CREATE POLICY "Only admins can delete receipts"
  ON public.donation_receipts FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- donation_notification_log: explicit TO
DROP POLICY IF EXISTS "Only admins can view notification log" ON public.donation_notification_log;
CREATE POLICY "Only admins can view notification log"
  ON public.donation_notification_log FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Service role can insert notification log" ON public.donation_notification_log;
CREATE POLICY "Service role can insert notification log"
  ON public.donation_notification_log FOR INSERT
  TO service_role
  WITH CHECK (true);

-- fel_configuration: explicit TO
DROP POLICY IF EXISTS "Admins can manage FEL configuration" ON public.fel_configuration;
CREATE POLICY "Admins can manage FEL configuration"
  ON public.fel_configuration FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users with receipts permission can view FEL config" ON public.fel_configuration;
CREATE POLICY "Users with receipts permission can view FEL config"
  ON public.fel_configuration FOR SELECT
  TO authenticated
  USING (has_module_permission(auth.uid(), 'receipts'::app_module, 'can_view'::text));

-- blog_permissions: explicit TO
DROP POLICY IF EXISTS "Admins can manage blog permissions" ON public.blog_permissions;
CREATE POLICY "Admins can manage blog permissions"
  ON public.blog_permissions FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can view own permissions" ON public.blog_permissions;
CREATE POLICY "Users can view own permissions"
  ON public.blog_permissions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- module_permissions: explicit TO
DROP POLICY IF EXISTS "Admins can manage module permissions" ON public.module_permissions;
CREATE POLICY "Admins can manage module permissions"
  ON public.module_permissions FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can view own permissions" ON public.module_permissions;
CREATE POLICY "Users can view own module permissions"
  ON public.module_permissions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- user_roles: explicit TO
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- profiles: explicit TO
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
CREATE POLICY "Authenticated users can view profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

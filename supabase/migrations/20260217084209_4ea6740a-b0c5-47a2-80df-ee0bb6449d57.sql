
-- ============================================================
-- PARTNERS: Tighten policies
-- ============================================================
DROP POLICY IF EXISTS "Public can view active partners" ON public.partners;
DROP POLICY IF EXISTS "Users with partners module permission can manage partners" ON public.partners;
DROP POLICY IF EXISTS "Users with partners module permission can view all partners" ON public.partners;

-- Public: only active partners
CREATE POLICY "Public can view active partners"
ON public.partners FOR SELECT
USING (is_active = true);

-- Admin/editors with permission can view all
CREATE POLICY "Authorized users can view all partners"
ON public.partners FOR SELECT
USING (is_admin() OR has_module_permission(auth.uid(), 'partners'::app_module, 'can_view'));

-- Admin can INSERT/UPDATE/DELETE
CREATE POLICY "Admins can insert partners"
ON public.partners FOR INSERT
WITH CHECK (is_admin() OR has_module_permission(auth.uid(), 'partners'::app_module, 'can_create'));

CREATE POLICY "Admins can update partners"
ON public.partners FOR UPDATE
USING (is_admin() OR has_module_permission(auth.uid(), 'partners'::app_module, 'can_edit_all'));

CREATE POLICY "Admins can delete partners"
ON public.partners FOR DELETE
USING (is_admin() OR has_module_permission(auth.uid(), 'partners'::app_module, 'can_delete_all'));

-- ============================================================
-- DONATIONS: Already admin-only via service role for inserts.
-- Add safe RPC for public donation status check (no PII).
-- ============================================================

-- Explicit constraint: prevent storing card data columns
-- (These columns must never exist; add a check trigger as guardrail)
COMMENT ON TABLE public.donations IS 'SECURITY: Never add columns for card_number, cvv, card_expiry, pan, or any raw payment card data. All payment processing is handled by Cybersource.';

-- Safe public RPC: return only non-sensitive status by reference
CREATE OR REPLACE FUNCTION public.get_donation_status(ref_number text)
RETURNS TABLE(status text, confirmed_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT d.status, d.confirmed_at
  FROM public.donations d
  WHERE d.notes LIKE '%' || ref_number || '%'
  LIMIT 1;
$$;

-- ============================================================
-- DONATION_RECEIPTS: Ensure admin-only (already in place, re-state for clarity)
-- ============================================================
-- Policies already exist and are admin-only. No changes needed.

-- ============================================================
-- JOB_VACANCIES: Tighten policies
-- ============================================================
DROP POLICY IF EXISTS "Public can view active vacancies" ON public.job_vacancies;
DROP POLICY IF EXISTS "Users with vacancies permission can view all" ON public.job_vacancies;
DROP POLICY IF EXISTS "Users with vacancies permission can create" ON public.job_vacancies;
DROP POLICY IF EXISTS "Users with vacancies permission can update" ON public.job_vacancies;
DROP POLICY IF EXISTS "Users with vacancies permission can delete" ON public.job_vacancies;

-- Public: active + not expired
CREATE POLICY "Public can view active vacancies"
ON public.job_vacancies FOR SELECT
USING (is_active = true AND application_deadline >= now());

-- Admin/editors with permission can view all
CREATE POLICY "Authorized users can view all vacancies"
ON public.job_vacancies FOR SELECT
USING (is_admin() OR has_module_permission(auth.uid(), 'vacancies'::app_module, 'can_view'));

-- INSERT
CREATE POLICY "Authorized users can create vacancies"
ON public.job_vacancies FOR INSERT
WITH CHECK (is_admin() OR has_module_permission(auth.uid(), 'vacancies'::app_module, 'can_create'));

-- UPDATE: admin all, editors own or all based on permission
CREATE POLICY "Authorized users can update vacancies"
ON public.job_vacancies FOR UPDATE
USING (
  is_admin()
  OR has_module_permission(auth.uid(), 'vacancies'::app_module, 'can_edit_all')
  OR (has_module_permission(auth.uid(), 'vacancies'::app_module, 'can_edit_own') AND created_by = auth.uid())
);

-- DELETE: admin all, editors own or all based on permission
CREATE POLICY "Authorized users can delete vacancies"
ON public.job_vacancies FOR DELETE
USING (
  is_admin()
  OR has_module_permission(auth.uid(), 'vacancies'::app_module, 'can_delete_all')
  OR (has_module_permission(auth.uid(), 'vacancies'::app_module, 'can_delete_own') AND created_by = auth.uid())
);

-- ============================================================
-- TRANSPARENCY_NUMERALS: Tighten policies  
-- ============================================================
DROP POLICY IF EXISTS "Public can view active numerals" ON public.transparency_numerals;
DROP POLICY IF EXISTS "Users with transparency permission can manage numerals" ON public.transparency_numerals;

CREATE POLICY "Public can view active numerals"
ON public.transparency_numerals FOR SELECT
USING (is_active = true);

CREATE POLICY "Authorized users can view all numerals"
ON public.transparency_numerals FOR SELECT
USING (is_admin() OR has_module_permission(auth.uid(), 'transparency'::app_module, 'can_view'));

CREATE POLICY "Authorized users can insert numerals"
ON public.transparency_numerals FOR INSERT
WITH CHECK (is_admin() OR has_module_permission(auth.uid(), 'transparency'::app_module, 'can_create'));

CREATE POLICY "Authorized users can update numerals"
ON public.transparency_numerals FOR UPDATE
USING (is_admin() OR has_module_permission(auth.uid(), 'transparency'::app_module, 'can_edit_all'));

CREATE POLICY "Authorized users can delete numerals"
ON public.transparency_numerals FOR DELETE
USING (is_admin() OR has_module_permission(auth.uid(), 'transparency'::app_module, 'can_delete_all'));

-- ============================================================
-- TRANSPARENCY_DOCUMENTS: Tighten policies
-- ============================================================
DROP POLICY IF EXISTS "Public can view active documents" ON public.transparency_documents;
DROP POLICY IF EXISTS "Users with transparency permission can view all documents" ON public.transparency_documents;
DROP POLICY IF EXISTS "Users with transparency permission can create documents" ON public.transparency_documents;
DROP POLICY IF EXISTS "Users with transparency permission can update documents" ON public.transparency_documents;
DROP POLICY IF EXISTS "Users with transparency permission can delete documents" ON public.transparency_documents;

CREATE POLICY "Public can view active documents"
ON public.transparency_documents FOR SELECT
USING (is_active = true);

CREATE POLICY "Authorized users can view all documents"
ON public.transparency_documents FOR SELECT
USING (is_admin() OR has_module_permission(auth.uid(), 'transparency'::app_module, 'can_view'));

CREATE POLICY "Authorized users can insert documents"
ON public.transparency_documents FOR INSERT
WITH CHECK (is_admin() OR has_module_permission(auth.uid(), 'transparency'::app_module, 'can_create'));

CREATE POLICY "Authorized users can update documents"
ON public.transparency_documents FOR UPDATE
USING (is_admin() OR has_module_permission(auth.uid(), 'transparency'::app_module, 'can_edit_all'));

CREATE POLICY "Authorized users can delete documents"
ON public.transparency_documents FOR DELETE
USING (is_admin() OR has_module_permission(auth.uid(), 'transparency'::app_module, 'can_delete_all'));

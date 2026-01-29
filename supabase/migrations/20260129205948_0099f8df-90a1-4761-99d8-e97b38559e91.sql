-- Security Fix: Restrict sensitive tax and donation data to admin-only access
-- This addresses: donation_receipts_sensitive, donations_table_pii_exposure, donation_receipts_tax_info_exposure

-- 1. Drop existing permissive policies on donation_receipts
DROP POLICY IF EXISTS "Users with receipts permission can view receipts" ON public.donation_receipts;
DROP POLICY IF EXISTS "Users with receipts permission can create receipts" ON public.donation_receipts;
DROP POLICY IF EXISTS "Users with receipts permission can update receipts" ON public.donation_receipts;
DROP POLICY IF EXISTS "Users with delete permission can delete receipts" ON public.donation_receipts;

-- 2. Create strict admin-only policies for donation_receipts (contains sensitive tax NITs)
CREATE POLICY "Only admins can view receipts"
ON public.donation_receipts FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can create receipts"
ON public.donation_receipts FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update receipts"
ON public.donation_receipts FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete receipts"
ON public.donation_receipts FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. Drop existing policies on donations table
DROP POLICY IF EXISTS "Users with donations permission can view donations" ON public.donations;
DROP POLICY IF EXISTS "Users with donations permission can create donations" ON public.donations;
DROP POLICY IF EXISTS "Users with donations permission can update donations" ON public.donations;
DROP POLICY IF EXISTS "Users with donations permission can delete donations" ON public.donations;

-- 4. Create strict admin-only policies for donations table (contains duplicated PII)
CREATE POLICY "Only admins can view donations"
ON public.donations FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can create donations"
ON public.donations FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update donations"
ON public.donations FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete donations"
ON public.donations FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));
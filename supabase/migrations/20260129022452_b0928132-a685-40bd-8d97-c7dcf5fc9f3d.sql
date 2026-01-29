-- Fix 1: Update storage policies for transfer-receipts bucket to prevent unauthenticated uploads
-- Remove the overly permissive upload policy
DROP POLICY IF EXISTS "Anyone can upload transfer receipts" ON storage.objects;

-- Create a more restrictive policy - uploads will be routed through an edge function with service role
-- Only allow service role (edge functions) to upload to transfer-receipts
-- This effectively removes direct client uploads, forcing them through a controlled edge function

-- Fix 2: Restrict donors table access to admin only (not all donation module users)
-- This protects PII from being accessed by any staff with basic donations view permission

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Users with donations permission can view donors" ON public.donors;
DROP POLICY IF EXISTS "Users with donations permission can create donors" ON public.donors;
DROP POLICY IF EXISTS "Users with donations permission can update donors" ON public.donors;
DROP POLICY IF EXISTS "Users with donations permission can delete donors" ON public.donors;

-- Create restrictive admin-only policies for donors (PII protection)
CREATE POLICY "Only admins can view donors" 
ON public.donors FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can create donors" 
ON public.donors FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update donors" 
ON public.donors FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete donors" 
ON public.donors FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));
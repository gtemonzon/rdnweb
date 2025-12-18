-- Fix: Restrict profiles table to authenticated users only
-- This prevents public exposure of staff member names

-- Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create new policy that requires authentication
CREATE POLICY "Authenticated users can view profiles"
ON public.profiles FOR SELECT
USING (auth.uid() IS NOT NULL);
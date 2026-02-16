
-- Add min_amount and suggested_amounts columns to donation_settings
ALTER TABLE public.donation_settings
  ADD COLUMN IF NOT EXISTS min_amount numeric NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS suggested_amounts jsonb NOT NULL DEFAULT '[50, 100, 200, 500]'::jsonb,
  ADD COLUMN IF NOT EXISTS min_amount_usd numeric NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS suggested_amounts_usd jsonb NOT NULL DEFAULT '[10, 25, 50, 100, 200]'::jsonb;

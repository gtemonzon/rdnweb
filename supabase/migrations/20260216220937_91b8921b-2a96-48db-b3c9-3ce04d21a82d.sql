
-- Add FEL tracking columns to donations table
ALTER TABLE public.donations
  ADD COLUMN IF NOT EXISTS fel_issued boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS fel_series text,
  ADD COLUMN IF NOT EXISTS fel_number text,
  ADD COLUMN IF NOT EXISTS fel_date date,
  ADD COLUMN IF NOT EXISTS fel_recorded_at timestamptz,
  ADD COLUMN IF NOT EXISTS fel_recorded_by text;

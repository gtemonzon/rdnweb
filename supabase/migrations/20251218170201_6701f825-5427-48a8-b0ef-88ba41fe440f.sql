-- Create donors table (donor history)
CREATE TABLE public.donors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  nit TEXT,
  address TEXT,
  total_donated NUMERIC DEFAULT 0,
  donation_count INTEGER DEFAULT 0,
  first_donation_at TIMESTAMPTZ,
  last_donation_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create donations table
CREATE TABLE public.donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id UUID REFERENCES public.donors(id),
  donor_name TEXT NOT NULL,
  donor_email TEXT NOT NULL,
  donor_phone TEXT,
  donor_nit TEXT,
  donor_address TEXT,
  amount NUMERIC NOT NULL,
  donation_type TEXT NOT NULL DEFAULT 'unica', -- 'unica' o 'mensual'
  payment_method TEXT NOT NULL DEFAULT 'tarjeta', -- 'tarjeta', 'transferencia', 'efectivo'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'confirmed', 'cancelled'
  notes TEXT,
  source TEXT DEFAULT 'web', -- 'web', 'manual', 'convenio'
  wants_receipt BOOLEAN DEFAULT false,
  receipt_id UUID REFERENCES public.donation_receipts(id),
  confirmed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.donors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- RLS policies for donors
CREATE POLICY "Users with donations permission can view donors"
ON public.donors FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_module_permission(auth.uid(), 'donations'::app_module, 'can_view'::text)
);

CREATE POLICY "Users with donations permission can create donors"
ON public.donors FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_module_permission(auth.uid(), 'donations'::app_module, 'can_create'::text)
);

CREATE POLICY "Users with donations permission can update donors"
ON public.donors FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_module_permission(auth.uid(), 'donations'::app_module, 'can_edit_all'::text)
);

-- RLS policies for donations
CREATE POLICY "Users with donations permission can view donations"
ON public.donations FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_module_permission(auth.uid(), 'donations'::app_module, 'can_view'::text)
);

CREATE POLICY "Users with donations permission can create donations"
ON public.donations FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_module_permission(auth.uid(), 'donations'::app_module, 'can_create'::text)
);

CREATE POLICY "Users with donations permission can update donations"
ON public.donations FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  (has_module_permission(auth.uid(), 'donations'::app_module, 'can_edit_own'::text) AND created_by = auth.uid()) OR
  has_module_permission(auth.uid(), 'donations'::app_module, 'can_edit_all'::text)
);

CREATE POLICY "Users with donations permission can delete donations"
ON public.donations FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  (has_module_permission(auth.uid(), 'donations'::app_module, 'can_delete_own'::text) AND created_by = auth.uid()) OR
  has_module_permission(auth.uid(), 'donations'::app_module, 'can_delete_all'::text)
);

-- Create triggers for updated_at
CREATE TRIGGER update_donors_updated_at
BEFORE UPDATE ON public.donors
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_donations_updated_at
BEFORE UPDATE ON public.donations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_donations_status ON public.donations(status);
CREATE INDEX idx_donations_created_at ON public.donations(created_at);
CREATE INDEX idx_donations_donor_email ON public.donations(donor_email);
CREATE INDEX idx_donors_email ON public.donors(email);
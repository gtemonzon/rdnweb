-- Create FEL configuration table
CREATE TABLE public.fel_configuration (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nit_emisor text NOT NULL,
    nombre_comercial text NOT NULL,
    nombre_emisor text NOT NULL,
    direccion text NOT NULL,
    codigo_postal text,
    municipio text NOT NULL,
    departamento text NOT NULL,
    pais text NOT NULL DEFAULT 'GT',
    codigo_establecimiento integer NOT NULL DEFAULT 1,
    correo_copia text,
    ambiente text NOT NULL DEFAULT 'FEL',
    activo boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create donation receipts table
CREATE TABLE public.donation_receipts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_type text NOT NULL DEFAULT 'donacion',
    serie text,
    numero text,
    uuid_sat text UNIQUE,
    receptor_nit text NOT NULL,
    receptor_nombre text NOT NULL,
    receptor_direccion text,
    receptor_correo text,
    monto numeric(12,2) NOT NULL,
    descripcion text NOT NULL,
    donation_id uuid,
    status text NOT NULL DEFAULT 'pending',
    error_message text,
    pdf_url text,
    xml_url text,
    certified_at timestamp with time zone,
    cancelled_at timestamp with time zone,
    created_by uuid REFERENCES auth.users(id),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fel_configuration ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donation_receipts ENABLE ROW LEVEL SECURITY;

-- FEL Configuration policies
CREATE POLICY "Admins can manage FEL configuration"
ON public.fel_configuration FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users with receipts permission can view FEL config"
ON public.fel_configuration FOR SELECT
USING (has_module_permission(auth.uid(), 'receipts'::app_module, 'can_view'));

-- Donation receipts policies
CREATE POLICY "Users with receipts permission can view receipts"
ON public.donation_receipts FOR SELECT
USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_module_permission(auth.uid(), 'receipts'::app_module, 'can_view')
);

CREATE POLICY "Users with receipts permission can create receipts"
ON public.donation_receipts FOR INSERT
WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_module_permission(auth.uid(), 'receipts'::app_module, 'can_create')
);

CREATE POLICY "Users with receipts permission can update receipts"
ON public.donation_receipts FOR UPDATE
USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    (has_module_permission(auth.uid(), 'receipts'::app_module, 'can_edit_own') AND created_by = auth.uid()) OR
    has_module_permission(auth.uid(), 'receipts'::app_module, 'can_edit_all')
);

CREATE POLICY "Users with delete permission can delete receipts"
ON public.donation_receipts FOR DELETE
USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_module_permission(auth.uid(), 'receipts'::app_module, 'can_delete_all')
);

-- Triggers for updated_at
CREATE TRIGGER update_fel_configuration_updated_at
BEFORE UPDATE ON public.fel_configuration
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_donation_receipts_updated_at
BEFORE UPDATE ON public.donation_receipts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_donation_receipts_status ON public.donation_receipts(status);
CREATE INDEX idx_donation_receipts_created_at ON public.donation_receipts(created_at DESC);
CREATE INDEX idx_donation_receipts_receptor_nit ON public.donation_receipts(receptor_nit);

-- =============================================
-- Donation configuration & idempotency tables
-- =============================================

-- Singleton config table for donation email settings
CREATE TABLE public.donation_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  -- Environment
  environment text NOT NULL DEFAULT 'test' CHECK (environment IN ('test', 'production')),
  
  -- Sender
  sender_email_name text NOT NULL DEFAULT 'El Refugio de la Niñez',
  sender_email_address text, -- null = use SMTP_USERNAME
  
  -- Accounting notification
  accounting_emails text[] NOT NULL DEFAULT ARRAY['donaciones@refugiodelaninez.org'],
  accounting_email_subject text NOT NULL DEFAULT '💳 Donación confirmada: {{currency_symbol}}{{amount}} - Ref: {{reference}}',
  accounting_email_body text, -- HTML template, null = use default built-in
  
  -- Donor thank-you
  donor_email_enabled boolean NOT NULL DEFAULT true,
  donor_email_subject text NOT NULL DEFAULT 'Gracias por tu donación - El Refugio de la Niñez',
  donor_email_body text, -- HTML template, null = use default built-in
  
  -- Feature flags
  send_donor_email boolean NOT NULL DEFAULT true,
  send_accounting_email boolean NOT NULL DEFAULT true,
  
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.donation_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage donation settings"
  ON public.donation_settings FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can read donation settings"
  ON public.donation_settings FOR SELECT
  USING (true);

CREATE TRIGGER update_donation_settings_updated_at
  BEFORE UPDATE ON public.donation_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default row
INSERT INTO public.donation_settings (environment) VALUES ('test');

-- =============================================
-- Notification log for idempotency
-- =============================================
CREATE TABLE public.donation_notification_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reference_number text NOT NULL,
  transaction_id text,
  notification_type text NOT NULL DEFAULT 'payment', -- payment, transfer, manual
  status text NOT NULL DEFAULT 'sent', -- sent, failed
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_notification_log_ref ON public.donation_notification_log (reference_number, notification_type);

ALTER TABLE public.donation_notification_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view notification log"
  ON public.donation_notification_log FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Service role inserts from edge functions (no user auth context)
CREATE POLICY "Service role can insert notification log"
  ON public.donation_notification_log FOR INSERT
  WITH CHECK (true);

-- Create storage bucket for transfer receipts
INSERT INTO storage.buckets (id, name, public)
VALUES ('transfer-receipts', 'transfer-receipts', false)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their receipts
CREATE POLICY "Anyone can upload transfer receipts"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'transfer-receipts');

-- Allow service role to read receipts (for admin/accounting)
CREATE POLICY "Service role can read transfer receipts"
ON storage.objects FOR SELECT
USING (bucket_id = 'transfer-receipts');

-- Allow service role to delete receipts
CREATE POLICY "Service role can delete transfer receipts"
ON storage.objects FOR DELETE
USING (bucket_id = 'transfer-receipts');
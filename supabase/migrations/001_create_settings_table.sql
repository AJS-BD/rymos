-- RYmos Settings Table Migration
-- Run this in your Supabase SQL Editor to create the settings table

CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  description TEXT,
  category TEXT DEFAULT 'general',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);
CREATE INDEX IF NOT EXISTS idx_settings_category ON settings(category);

-- Enable RLS (Row Level Security)
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations for authenticated users (admin)
-- Adjust this based on your auth setup
CREATE POLICY "Allow all for authenticated users ON settings"
  ON settings
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy: Allow read for anon (if needed for public settings)
CREATE POLICY "Allow read for anon ON settings"
  ON settings
  FOR SELECT
  TO anon
  USING (category = 'store');

-- Insert default settings
INSERT INTO settings (key, value, description, category) VALUES
  ('store_name', 'RYmos', 'The name of your store', 'store'),
  ('store_currency', 'BDT', 'Default currency for the store', 'store'),
  ('store_address', '', 'Store physical address', 'store'),
  ('store_phone', '', 'Store contact phone number', 'store'),
  ('whatsapp_provider', 'meta', 'WhatsApp API provider', 'whatsapp'),
  ('whatsapp_api_key', '', 'WhatsApp Business API key', 'whatsapp'),
  ('whatsapp_sender_phone', '', 'WhatsApp sender phone number', 'whatsapp'),
  ('whatsapp_message_template', 'Hi {customer_name}, your order #{order_id} has been confirmed. Total: {total} {currency}', 'Order notification template', 'whatsapp'),
  ('smtp_host', '', 'SMTP server hostname', 'email'),
  ('smtp_port', '587', 'SMTP server port', 'email'),
  ('smtp_username', '', 'SMTP authentication username', 'email'),
  ('smtp_password', '', 'SMTP authentication password', 'email'),
  ('smtp_from_email', '', 'From email address', 'email'),
  ('smtp_from_name', 'RYmos Store', 'From display name', 'email'),
  ('payment_gateway', 'stripe', 'Active payment gateway', 'payment'),
  ('stripe_secret_key', '', 'Stripe Secret Key (sk_live_...)', 'payment'),
  ('stripe_publishable_key', '', 'Stripe Publishable Key (pk_live_...)', 'payment'),
  ('stripe_webhook_secret', '', 'Stripe Webhook Secret (whsec_...)', 'payment'),
  ('bkash_api_key', '', 'bKash App Key', 'payment'),
  ('bkash_app_secret', '', 'bKash App Secret', 'payment'),
  ('bkash_username', '', 'bKash merchant username', 'payment'),
  ('bkash_password', '', 'bKash merchant password', 'payment'),
  ('nagad_merchant_id', '', 'Nagad Merchant ID', 'payment'),
  ('nagad_api_key', '', 'Nagad API Key', 'payment')
ON CONFLICT (key) DO NOTHING;

-- Fix: Add auth_user_id to customers table and improve RLS
-- This links customers to Supabase auth users for reliable lookup

-- Add auth_user_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' AND column_name = 'auth_user_id'
  ) THEN
    ALTER TABLE customers ADD COLUMN auth_user_id UUID;
    CREATE INDEX idx_customers_auth_user_id ON customers(auth_user_id);
  END IF;
END $$;

-- Update RLS policies for customers to allow auth_user_id lookup
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow anon insert customers" ON customers;
DROP POLICY IF EXISTS "Allow anon select customers" ON customers;
DROP POLICY IF EXISTS "Allow anon update customers" ON customers;
DROP POLICY IF EXISTS "Allow auth all customers" ON customers;

-- Allow anyone to insert new customers (signup / auto-create from checkout)
CREATE POLICY "Allow anon insert customers"
  ON customers
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow anyone to select customers (login lookup / validation)
CREATE POLICY "Allow anon select customers"
  ON customers
  FOR SELECT
  TO anon
  USING (true);

-- Allow anyone to update customers (profile edit)
CREATE POLICY "Allow anon update customers"
  ON customers
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users full access
CREATE POLICY "Allow auth all customers"
  ON customers
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Fix: Add RLS policies for orders table
-- Run this in Supabase SQL Editor

-- Allow anon to update orders (for admin panel status updates via anon key)
CREATE POLICY "Allow anon update orders"
  ON orders
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Allow anon to select orders
CREATE POLICY "Allow anon select orders"
  ON orders
  FOR SELECT
  TO anon
  USING (true);

-- Allow authenticated users full access
CREATE POLICY "Allow auth all orders"
  ON orders
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

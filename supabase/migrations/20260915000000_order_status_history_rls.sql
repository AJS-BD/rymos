-- Fix: Add RLS policies for order_status_history
-- Without these, the history insert silently fails, breaking the status update UI
-- Run this in Supabase SQL Editor

-- Allow anon to insert status history (admin panel uses anon key)
CREATE POLICY "Allow anon insert order_status_history"
  ON order_status_history
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow anon to select status history
CREATE POLICY "Allow anon select order_status_history"
  ON order_status_history
  FOR SELECT
  TO anon
  USING (true);

-- Allow authenticated users full access
CREATE POLICY "Allow auth all order_status_history"
  ON order_status_history
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

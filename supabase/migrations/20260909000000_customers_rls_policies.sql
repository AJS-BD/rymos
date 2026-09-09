-- Fix: Add RLS policies for customers table
-- Without these, anon key cannot read/write customers (blocks signup + order placement)

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

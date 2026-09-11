-- Fix: Add credit_application column to orders table
-- The checkout code stores credit application data as JSONB in orders

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'credit_application'
  ) THEN
    ALTER TABLE orders ADD COLUMN credit_application JSONB;
  END IF;
END $$;

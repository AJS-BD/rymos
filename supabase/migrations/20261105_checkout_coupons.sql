-- RYmos checkout + coupons — 2026-11-05
--
-- Adds ONLY the schema the server-side checkout route needs. Nothing here
-- changes existing tables' behaviour for other flows.
--
-- 1. orders.coupon_id / orders.coupon_code — the checkout code has always
--    written these two columns, and live prod already has them (see
--    supabase/sync_20260922_prod_sync.sql Part 6 note), but no migration
--    ever created them, so a database built from migrations alone lacks
--    them. Added idempotently.
-- 2. credit_applications.order_id / monthly_income / occupation /
--    employer / application_type — the checkout credit flow has always
--    written these columns (order link + the applicant's income details),
--    but no migration ever created them either.
-- 3. products.stock >= 0 CHECK — the atomic stock decrement in
--    POST /api/orders/create and in POS guards with .gte("stock", qty),
--    but the database itself never forbade negative stock. Belt and braces.
-- 4. coupons.usage_count >= 0 / discount_value >= 0 guards — same idea.
--
-- APPLY MANUALLY in the Supabase dashboard (SQL Editor) or with the
-- Supabase CLI — this file is NOT applied by the app. See the workstream
-- handover note for the exact steps.

-- ---- 1. orders: coupon columns ----
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_id UUID REFERENCES coupons(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code TEXT;

-- ---- 2. credit_applications: columns the checkout credit flow writes ----
ALTER TABLE credit_applications ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES orders(id);
ALTER TABLE credit_applications ADD COLUMN IF NOT EXISTS monthly_income DECIMAL(12,2);
ALTER TABLE credit_applications ADD COLUMN IF NOT EXISTS occupation TEXT;
ALTER TABLE credit_applications ADD COLUMN IF NOT EXISTS employer TEXT;
ALTER TABLE credit_applications ADD COLUMN IF NOT EXISTS application_type TEXT;

-- ---- 3. products: never allow negative stock ----
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_stock_nonnegative'
  ) THEN
    ALTER TABLE products ADD CONSTRAINT products_stock_nonnegative CHECK (stock >= 0);
  END IF;
END $$;

-- ---- 4. coupons: usage count and discount value can never go negative ----
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'coupons_usage_count_nonnegative'
  ) THEN
    ALTER TABLE coupons ADD CONSTRAINT coupons_usage_count_nonnegative CHECK (usage_count >= 0);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'coupons_discount_value_nonnegative'
  ) THEN
    ALTER TABLE coupons ADD CONSTRAINT coupons_discount_value_nonnegative CHECK (discount_value >= 0);
  END IF;
END $$;

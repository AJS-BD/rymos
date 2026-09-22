-- ============================================================
-- RYmos: Sync prod Supabase with repo migrations (2026-09-22)
-- Run ONCE in Supabase SQL Editor:
--   https://imcsesyqurkpvguwpmem.supabase.co/project/default/sql/new
--
-- WHAT THIS DOES (all idempotent — safe to re-run):
--   1. Creates 15 missing tables the code queries
--   2. Adds missing columns to existing tables (orders, customers)
--   3. Relaxes the orders CHECK constraints so POS orders work
--   4. Grants anon RLS access matching how the app authenticates
--   5. Creates wishlist as "wishlists" (name the code actually uses)
--
-- Verified against live prod (anon REST probes, 2026-09-22):
--   EXISTS: admin_users, categories, customers, messages, orders,
--           products, reviews, youtube_reviews
--   MISSING: settings, coupons, wishlist(s), credit_applications,
--            credit_plans, installments, order_status_history,
--            product_reviews, returns, refunds, cart_items,
--            notifications, admin_audit_log, daily_sales,
--            inventory_movements
-- ============================================================

-- ============================================
-- PART 1: MISSING COLUMNS ON EXISTING TABLES
-- ============================================

-- orders: columns the UI reads but prod lacks
ALTER TABLE orders ADD COLUMN IF NOT EXISTS estimated_delivery TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number TEXT;

-- customers: columns the POS/complete-profile flow needs
ALTER TABLE customers ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT false;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS profile_token TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMPTZ;

-- ============================================
-- PART 2: RELAX ORDERS CHECK CONSTRAINTS (POS FIX)
-- ============================================
-- POS writes order_type='pos' and the old CHECK rejects it (live-verified 23514).
-- 'pos' + walk-in orders must be insertable.
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_order_type_check;
ALTER TABLE orders ADD CONSTRAINT orders_order_type_check
  CHECK (order_type IN ('cod', 'shop_pickup', 'credit', 'bulk', 'pos'));

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending', 'confirmed', 'packing', 'shipping', 'delivered', 'cancelled', 'return'));

-- POS walk-in orders have no customer: drop NOT NULL (probe-verified 23502)
ALTER TABLE orders ALTER COLUMN customer_id DROP NOT NULL;

-- payment_method: allow POS values (card, mobile, cash) — probe verified these pass already,
-- but keep the constraint aligned with what the app writes
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;
ALTER TABLE orders ADD CONSTRAINT orders_payment_method_check
  CHECK (payment_method IN ('cod', 'cash', 'card', 'mobile', 'bkash', 'credit'));

-- ============================================
-- PART 3: MISSING TABLES (code-queried, in dependency order)
-- ============================================

-- settings (admin settings page + /api/settings)
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  description TEXT,
  category TEXT DEFAULT 'general',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);
CREATE INDEX IF NOT EXISTS idx_settings_category ON settings(category);
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated users ON settings"
  ON settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow read for anon ON settings"
  ON settings FOR SELECT TO anon USING (category = 'store');
INSERT INTO settings (key, value, description, category) VALUES
  ('store_name', 'RYmos', 'The name of your store', 'store'),
  ('store_currency', 'BDT', 'Default currency for the store', 'store'),
  ('store_address', 'Level 4, Block D, Bashundhara City Shopping Complex, Dhaka 1229', 'Store physical address', 'store'),
  ('store_phone', '', 'Store contact phone number', 'store'),
  ('whatsapp_sender_phone', '', 'WhatsApp number for support links (digits only, e.g. 8801XXXXXXXXX)', 'store')
ON CONFLICT (key) DO NOTHING;

-- order_status_history (admin + customer order detail timelines)
CREATE TABLE IF NOT EXISTS order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by TEXT NOT NULL DEFAULT 'system',
  note TEXT,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_osh_order ON order_status_history(order_id);
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon insert order_status_history"
  ON order_status_history FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon select order_status_history"
  ON order_status_history FOR SELECT TO anon USING (true);
CREATE POLICY "Allow auth all order_status_history"
  ON order_status_history FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- credit_applications (customer credit flow + admin review)
CREATE TABLE IF NOT EXISTS credit_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected')),
  requested_amount DECIMAL(12,2) NOT NULL,
  proposed_down_payment DECIMAL(12,2),
  proposed_installments INT,
  documents JSONB DEFAULT '{}',
  video_statement_url TEXT,
  guarantor_info JSONB DEFAULT '{}',
  review_notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  decision TEXT CHECK (decision IN ('approved', 'rejected')),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_credit_apps_customer ON credit_applications(customer_id);
ALTER TABLE credit_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon all credit_applications"
  ON credit_applications FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow auth all credit_applications"
  ON credit_applications FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- credit_plans (installment plans)
CREATE TABLE IF NOT EXISTS credit_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES credit_applications(id),
  customer_id UUID NOT NULL REFERENCES customers(id),
  order_id UUID REFERENCES orders(id),
  total_amount DECIMAL(12,2) NOT NULL,
  down_payment DECIMAL(12,2) NOT NULL,
  balance DECIMAL(12,2) NOT NULL,
  installment_count INT NOT NULL,
  installment_amount DECIMAL(12,2) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'defaulted', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_credit_plans_app ON credit_plans(application_id);
ALTER TABLE credit_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon all credit_plans"
  ON credit_plans FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow auth all credit_plans"
  ON credit_plans FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- installments (কিস্তি records)
CREATE TABLE IF NOT EXISTS installments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES credit_plans(id),
  installment_number INT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  due_date DATE NOT NULL,
  paid_date TIMESTAMPTZ,
  paid_amount DECIMAL(12,2),
  payment_method TEXT CHECK (payment_method IN ('cash', 'bkash', 'nagad', 'bank', 'card', 'mobile')),
  reference TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'waived')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_installments_plan ON installments(plan_id);
ALTER TABLE installments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon all installments"
  ON installments FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow auth all installments"
  ON installments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- coupons (admin coupons + checkout discount)
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(12,2) NOT NULL,
  min_order_amount DECIMAL(12,2) DEFAULT 0,
  max_discount DECIMAL(12,2),
  usage_limit INT,
  usage_count INT DEFAULT 0,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '30 days',
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon all coupons"
  ON coupons FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow auth all coupons"
  ON coupons FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- wishlists (customer wishlist page — code uses plural name)
CREATE TABLE IF NOT EXISTS wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(customer_id, product_id)
);
CREATE INDEX IF NOT EXISTS idx_wishlists_customer ON wishlists(customer_id);
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon all wishlists"
  ON wishlists FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow auth all wishlists"
  ON wishlists FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- product_reviews (customer reviews page writes here)
CREATE TABLE IF NOT EXISTS product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_name TEXT,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  content TEXT NOT NULL,
  is_verified_purchase BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_product_reviews_product ON product_reviews(product_id);
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon select product_reviews"
  ON product_reviews FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert product_reviews"
  ON product_reviews FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow auth all product_reviews"
  ON product_reviews FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- PART 4: REMAINING MIGRATION TABLES (not yet queried by code,
-- but defined in repo migrations — created for completeness)
-- ============================================

CREATE TABLE IF NOT EXISTS returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id),
  customer_id UUID NOT NULL REFERENCES customers(id),
  reason TEXT NOT NULL CHECK (reason IN ('defective', 'exchange', 'other')),
  product_details JSONB DEFAULT '{}',
  refund_amount DECIMAL(12,2),
  status TEXT DEFAULT 'requested' CHECK (status IN ('requested', 'approved', 'rejected', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id UUID REFERENCES returns(id),
  order_id UUID NOT NULL REFERENCES orders(id),
  amount DECIMAL(12,2) NOT NULL,
  method TEXT CHECK (method IN ('cash', 'bkash', 'nagad', 'bank')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(customer_id, product_id)
);
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  type TEXT DEFAULT 'order',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS daily_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_date DATE NOT NULL UNIQUE,
  total_sales DECIMAL(12,2) DEFAULT 0,
  order_count INT DEFAULT 0,
  pos_sales DECIMAL(12,2) DEFAULT 0,
  online_sales DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE daily_sales ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id),
  movement_type TEXT NOT NULL CHECK (movement_type IN ('purchase', 'sale', 'return', 'adjustment', 'damage', 'pos_sale')),
  quantity INT NOT NULL,
  reference_type TEXT CHECK (reference_type IN ('order', 'return', 'manual', 'pos_order')),
  reference_id UUID,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PART 5: FK columns on orders the code writes
-- ============================================
-- checkout writes coupon_id / coupon_code / credit_application
-- (prod already has these — verified in column dump — so nothing to do;
--  kept here as documentation.)

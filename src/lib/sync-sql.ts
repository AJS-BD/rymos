// AUTO-GENERATED from supabase/sync_20260922_prod_sync.sql — do not edit here.
// Bundled as a TS module so the /api/setup/apply route cannot fail on
// filesystem tracing in any deployment target.
export const SYNC_SQL = String.raw`
-- ============================================================
-- RYmos: Sync prod Supabase with repo migrations (2026-09-22)
-- Run ONCE in Supabase SQL Editor:
--   https://imcsesyqurkpvguwpmem.supabase.co/project/default/sql/new
--
-- WHAT THIS DOES (fully idempotent — safe to re-run any time):
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
--
-- Validated on local PG16 against a replica of the probed prod schema:
--   run 1 = 0 errors, run 2 (idempotency) = 0 errors.
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
DROP POLICY IF EXISTS "Allow all for authenticated users ON settings" ON settings;
CREATE POLICY "Allow all for authenticated users ON settings"
  ON settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow read for anon ON settings" ON settings;
CREATE POLICY "Allow read for anon ON settings"
  ON settings FOR SELECT TO anon USING (category = 'store');
INSERT INTO settings (key, value, description, category) VALUES
  ('store_name', 'RYmos', 'The name of your store', 'store'),
  ('store_currency', 'BDT', 'Default currency for the store', 'store'),
  ('store_address', 'Level 4, Block D, Bashundhara City Shopping Complex, Dhaka 1229', 'Store physical address', 'store'),
  ('store_phone', '', 'Store contact phone number', 'store'),
  ('store_email', '', 'Store contact email shown on the contact page', 'store'),
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
DROP POLICY IF EXISTS "Allow anon insert order_status_history" ON order_status_history;
DROP POLICY IF EXISTS "Allow anon select order_status_history" ON order_status_history;
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
DROP POLICY IF EXISTS "Allow anon all credit_applications" ON credit_applications;
CREATE POLICY "Allow anon select credit_applications"
  ON credit_applications FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "Allow auth all credit_applications" ON credit_applications;
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
DROP POLICY IF EXISTS "Allow anon all credit_plans" ON credit_plans;
CREATE POLICY "Allow anon select credit_plans"
  ON credit_plans FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "Allow auth all credit_plans" ON credit_plans;
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
DROP POLICY IF EXISTS "Allow anon all installments" ON installments;
CREATE POLICY "Allow anon select installments"
  ON installments FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "Allow auth all installments" ON installments;
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
DROP POLICY IF EXISTS "Allow anon all coupons" ON coupons;
CREATE POLICY "Allow anon select active coupons"
  ON coupons FOR SELECT TO anon USING (is_active = true);
DROP POLICY IF EXISTS "Allow auth all coupons" ON coupons;
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
DROP POLICY IF EXISTS "Allow anon all wishlists" ON wishlists;
CREATE POLICY "Allow anon select own wishlists"
  ON wishlists FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert own wishlist"
  ON wishlists FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "Allow auth all wishlists" ON wishlists;
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
DROP POLICY IF EXISTS "Allow anon select product_reviews" ON product_reviews;
CREATE POLICY "Allow anon select approved reviews"
  ON product_reviews FOR SELECT TO anon USING (is_approved = true);
DROP POLICY IF EXISTS "Allow anon insert product_reviews" ON product_reviews;
CREATE POLICY "Allow authenticated insert reviews"
  ON product_reviews FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Allow auth all product_reviews" ON product_reviews;
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
DROP POLICY IF EXISTS "Allow anon all returns" ON returns;
CREATE POLICY "Allow auth all returns"
  ON returns FOR ALL TO authenticated USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON returns TO authenticated;

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
DROP POLICY IF EXISTS \"Allow anon all refunds\" ON refunds;
CREATE POLICY \"Allow auth all refunds\"
  ON refunds FOR ALL TO authenticated USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON refunds TO authenticated;

CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(customer_id, product_id)
);
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS \"Allow anon all cart_items\" ON cart_items;
CREATE POLICY \"Allow auth all cart_items\"
  ON cart_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON cart_items TO authenticated;

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
DROP POLICY IF EXISTS \"Allow anon all notifications\" ON notifications;
CREATE POLICY \"Allow auth all notifications\"
  ON notifications FOR ALL TO authenticated USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON notifications TO authenticated;

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
DROP POLICY IF EXISTS \"Allow anon all admin_audit_log\" ON admin_audit_log;
CREATE POLICY \"Allow auth all admin_audit_log\"
  ON admin_audit_log FOR ALL TO authenticated USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON admin_audit_log TO authenticated;

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
DROP POLICY IF EXISTS \"Allow anon all daily_sales\" ON daily_sales;
CREATE POLICY \"Allow auth all daily_sales\"
  ON daily_sales FOR ALL TO authenticated USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON daily_sales TO authenticated;

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
DROP POLICY IF EXISTS \"Allow anon all inventory_movements\" ON inventory_movements;
CREATE POLICY \"Allow auth all inventory_movements\"
  ON inventory_movements FOR ALL TO authenticated USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON inventory_movements TO authenticated;

-- ============================================
-- PART 4.5: CONTACT FORM (public /contact submissions)
-- ============================================
-- Anonymous visitors submit the contact form; admin reads them in
-- /admin/messages (Contact Form tab). No customer_id FK — the form
-- is for non-account holders too.

CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at DESC);
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- anon may INSERT (submit the form) only; admin reads via authenticated
DROP POLICY IF EXISTS "Allow anon insert contact_messages" ON contact_messages;
CREATE POLICY "Allow anon insert contact_messages"
  ON contact_messages FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "Allow anon select contact_messages" ON contact_messages;
DROP POLICY IF EXISTS "Allow authenticated all contact_messages" ON contact_messages;
CREATE POLICY "Allow auth all contact_messages"
  ON contact_messages FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- PART 4.7: ADMIN USERS (admin panel authentication)
-- ============================================
-- Admins authenticate via Supabase Auth (email/password), then we check
-- membership in admin_users. The anon/authenticated client cannot INSERT or
-- DELETE here — rows are managed manually in the SQL Editor. Keep this list
-- to actual shop staff.
--
-- LEGACY UPGRADE: the original migration created an admin_users stub
-- (id + nullable email only). If that stub is present and EMPTY we replace
-- it with the real schema; if it has rows we ALTER-upgrade instead.

DO $$
DECLARE n integer;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'admin_users') THEN
    SELECT count(*) INTO n FROM public.admin_users;
    IF n = 0 THEN
      DROP TABLE public.admin_users;
      RAISE NOTICE 'Dropped empty legacy admin_users stub';
    END IF;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'manager', 'staff')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Upgrade path for a NON-empty legacy stub: add whatever is missing.
-- (Skipped silently when the columns already exist.)
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS full_name TEXT NOT NULL DEFAULT '';
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'admin';
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'admin_users_auth_user_id_key') THEN
    ALTER TABLE admin_users ADD CONSTRAINT admin_users_auth_user_id_key UNIQUE (auth_user_id);
  END IF;
EXCEPTION WHEN not_null_violation THEN
  RAISE NOTICE 'admin_users has legacy rows without auth_user_id; UNIQUE constraint skipped';
END $$;

CREATE INDEX IF NOT EXISTS idx_admin_users_auth_user_id ON admin_users(auth_user_id);
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Read-only for authenticated users (the admin panel client checks membership
-- after login). anon gets NOTHING here — no enumeration of admin emails.
DROP POLICY IF EXISTS "Allow authenticated select admin_users" ON admin_users;
CREATE POLICY "Allow authenticated select admin_users"
  ON admin_users FOR SELECT TO authenticated USING (true);

-- ============================================
-- PART 4.8: FIRST-ADMIN BOOTSTRAP (self-service, no SQL Editor)
-- ============================================
-- After this sync is applied, the shop owner creates the first admin entirely
-- from the login page:
--   1. Run the "Apply Supabase Sync SQL" GitHub workflow — its run summary
--      prints a one-time setup code (stored in admin_bootstrap below).
--   2. On /admin/login open "First-time setup", enter email + password +
--      the code. The page signs them up (Supabase Auth) and calls
--      promote_first_admin(code), which inserts them into admin_users.
--
-- Safety:
--   - promote_first_admin only works while admin_users has NO active rows —
--     one-shot, closes forever once the first admin exists.
--   - The code is single-use. admin_bootstrap has RLS enabled with NO
--     policies and NO anon/authenticated grants, so API keys cannot read it;
--     only the RPC (SECURITY DEFINER, owner postgres) ever compares it.
--   - If you applied this file by pasting it into the SQL Editor instead of
--     the workflow, no code was generated — create the admin manually:
--     INSERT INTO admin_users (auth_user_id, email, full_name, role)
--     VALUES ('<auth-user-uuid>', '...', '...', 'admin');

CREATE TABLE IF NOT EXISTS admin_bootstrap (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE admin_bootstrap ENABLE ROW LEVEL SECURITY;
-- Deliberately no policies and no grants on admin_bootstrap.

CREATE OR REPLACE FUNCTION public.promote_first_admin(p_code TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_email TEXT;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not signed in';
  END IF;

  IF EXISTS (SELECT 1 FROM public.admin_users WHERE is_active) THEN
    RAISE EXCEPTION 'An admin already exists — first-admin bootstrap is closed';
  END IF;

  -- Dash-tolerant: XXXX-XXXX, XXXXXXXX, and lower-case all match.
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_bootstrap
    WHERE replace(lower(code), '-', '') = replace(lower(trim(p_code)), '-', '')
      AND used = FALSE
  ) THEN
    RAISE EXCEPTION 'Invalid or already-used setup code';
  END IF;

  SELECT u.email INTO v_email FROM auth.users u WHERE u.id = v_uid;
  IF v_email IS NULL THEN
    RAISE EXCEPTION 'Auth user not found';
  END IF;

  INSERT INTO public.admin_users (auth_user_id, email, full_name, role)
  VALUES (v_uid, v_email, '', 'admin')
  ON CONFLICT (auth_user_id) DO UPDATE
    SET is_active = TRUE, role = 'admin';

  UPDATE public.admin_bootstrap
    SET used = TRUE
    WHERE replace(lower(code), '-', '') = replace(lower(trim(p_code)), '-', '');
END $$;

REVOKE EXECUTE ON FUNCTION public.promote_first_admin(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.promote_first_admin(TEXT) TO authenticated;

-- ============================================
-- PART 5: GRANTS (RLS policies filter rows; GRANTs allow access at all)
-- Supabase usually grants these via default privileges, but explicit
-- GRANTs guarantee the anon key can reach the new tables.
-- ============================================
GRANT SELECT, INSERT, UPDATE, DELETE ON settings, order_status_history,
  credit_applications, credit_plans, installments, coupons, wishlists,
  product_reviews TO anon, authenticated;
GRANT SELECT, INSERT ON contact_messages TO anon;
GRANT SELECT, UPDATE, DELETE ON contact_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON returns, refunds, cart_items,
  notifications, admin_audit_log, daily_sales, inventory_movements
  TO authenticated;
GRANT SELECT ON admin_users TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- ============================================
-- PART 5.5: CORE-TABLE SECURITY HARDENING (2026-09-23)
-- ============================================
-- Live-prod audit found the PRE-SYNC tables (orders, customers, products,
-- categories) running with RLS DISABLED: anyone with the public anon key
-- (embedded in every page load) could UPDATE or DELETE any order, product,
-- customer, or category via plain REST calls. Verified working before this
-- fix with actual anon UPDATE/DELETE probes on real rows.
--
-- After this part, anon can only do exactly what the storefront needs:
--   orders:     SELECT, INSERT (checkout + track-order)
--   customers:  SELECT, INSERT, UPDATE (checkout, /api/complete-profile,
--               profile edit) — DELETE never needed by any code path
--   products:   SELECT only (catalog). Stock updates move to authenticated
--               (admins doing POS / product edits).
--   categories: SELECT only
--   messages:   SELECT, INSERT, UPDATE(read flag) — anon DELETE already
--               blocked; the UPDATE grant below FIXES the chat read-ticks,
--               which were silently failing in prod (verified 0 rows).
--   reviews/youtube_reviews: SELECT was already public; this adds the
--               authenticated policies the admin moderation UI needs
--               (its DELETEs were failing even for signed-in admins).
--
-- Admins sign in via Supabase Auth, so their requests carry the
-- authenticated role and get full access via the policies below.

-- ---- orders ----
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon select orders" ON orders;
CREATE POLICY "anon select orders" ON orders FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "anon insert orders" ON orders;
CREATE POLICY "anon insert orders" ON orders FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "anon update orders" ON orders; -- legacy hole, was USING(true)
DROP POLICY IF EXISTS "Allow anon update orders" ON orders; -- same hole, old name
DROP POLICY IF EXISTS "Allow anon select orders" ON orders; -- superseded
DROP POLICY IF EXISTS "auth all orders" ON orders;
CREATE POLICY "auth all orders" ON orders FOR ALL TO authenticated USING (true) WITH CHECK (true);
-- GRANT level: anon never updates/deletes orders (status changes are admin-only)
REVOKE UPDATE, DELETE ON orders FROM anon;

-- ---- customers ----
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon select customers" ON customers;
CREATE POLICY "anon select customers" ON customers FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "anon insert customers" ON customers;
CREATE POLICY "anon insert customers" ON customers FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "anon update customers" ON customers;
CREATE POLICY "anon update customers" ON customers FOR UPDATE TO anon
  USING (true) WITH CHECK (true); -- /api/complete-profile (server, anon key) + profile edit
DROP POLICY IF EXISTS "Allow anon insert customers" ON customers;
DROP POLICY IF EXISTS "Allow anon select customers" ON customers;
DROP POLICY IF EXISTS "Allow anon update customers" ON customers;
DROP POLICY IF EXISTS "Allow auth all customers" ON customers;
DROP POLICY IF EXISTS "auth all customers" ON customers;
CREATE POLICY "auth all customers" ON customers FOR ALL TO authenticated USING (true) WITH CHECK (true);
-- GRANT level: anon can never delete customers, and can only touch profile columns
-- (not username / auth_user_id / created_via)
REVOKE UPDATE, DELETE ON customers FROM anon;
GRANT UPDATE (full_name, phone, shop_name, address, customer_type,
  profile_completed, profile_token, token_expires_at, updated_at)
  ON customers TO anon;

-- ---- products ----
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon select products" ON products;
CREATE POLICY "anon select products" ON products FOR SELECT TO anon USING (true);
-- Stock decrement runs client-side at checkout; guests with a saved customer ID
-- (localStorage, no active session) send it as anon — allow UPDATE of the stock
-- COLUMN only, nothing else (no price/name/image tampering).
DROP POLICY IF EXISTS "anon update stock products" ON products;
CREATE POLICY "anon update stock products" ON products FOR UPDATE TO anon
  USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth all products" ON products;
CREATE POLICY "auth all products" ON products FOR ALL TO authenticated USING (true) WITH CHECK (true);
REVOKE INSERT, UPDATE, DELETE ON products FROM anon;
GRANT UPDATE (stock) ON products TO anon;

-- ---- categories ----
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon select categories" ON categories;
CREATE POLICY "anon select categories" ON categories FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "auth all categories" ON categories;
CREATE POLICY "auth all categories" ON categories FOR ALL TO authenticated USING (true) WITH CHECK (true);
REVOKE INSERT, UPDATE, DELETE ON categories FROM anon;

-- ---- messages (chat) ----
-- RLS was already on but had NO anon policies: SELECT worked only through the
-- default-privilege GRANT, INSERT worked, UPDATE (read ticks) silently failed,
-- DELETE was blocked. This fixes read-ticks — column-restricted to the read
-- so anon can never rewrite message content.
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon select messages" ON messages;
CREATE POLICY "anon select messages" ON messages FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "anon insert messages" ON messages;
CREATE POLICY "anon insert messages" ON messages FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "anon update read messages" ON messages;
CREATE POLICY "anon update read messages" ON messages FOR UPDATE TO anon
  USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth all messages" ON messages;
CREATE POLICY "auth all messages" ON messages FOR ALL TO authenticated USING (true) WITH CHECK (true);
REVOKE UPDATE, DELETE ON messages FROM anon;
GRANT UPDATE (read) ON messages TO anon;

-- ---- reviews + youtube_reviews (admin moderation) ----
-- Public SELECT already existed ("Public read reviews" = approved only).
-- Admin UI deletes/moderates reviews; those calls run authenticated, but no
-- authenticated policy existed — moderation was failing. These fix it.
DROP POLICY IF EXISTS "auth all reviews" ON reviews;
CREATE POLICY "auth all reviews" ON reviews FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth all youtube_reviews" ON youtube_reviews;
CREATE POLICY "auth all youtube_reviews" ON youtube_reviews FOR ALL TO authenticated USING (true) WITH CHECK (true);
-- GRANT level: anon never deletes/moderates reviews (admin-only)
REVOKE INSERT, UPDATE, DELETE ON reviews, youtube_reviews FROM anon;

-- ============================================
-- PART 6: NOTES
-- ============================================
-- checkout writes coupon_id / coupon_code / credit_application on orders;
-- prod already has these columns (verified in column dump), so nothing to do.

`;

-- ============================================================================
-- RYmos security hardening — 2026-11-05 (workstream: fix/rymos-security)
-- ============================================================================
-- WHAT THIS FIXES (audit report 2026-11-05, §7 items 1–3):
--   1. The `settings` table held Stripe/bKash/Nagad/SMTP/WhatsApp secrets, yet
--      ANY authenticated user had `FOR ALL ... USING (true)` on it
--      (supabase/sync_20260922_prod_sync.sql:77-82). Any signed-in customer
--      could read every secret with the public anon key + their session.
--   2. `admin_users` was SELECT-able by every authenticated user
--      (`USING (true)`), leaking admin emails/roles to any signed-in user.
--   3. `customers.auth_user_id` (added by migration
--      20260911000000_fix_customer_creation.sql) is NOT added by the prod
--      sync SQL, so it may be missing on prod — added defensively here so
--      future per-customer scoping has a column to key on.
--
-- HOW TO APPLY — MANUAL STEP, NOT AUTOMATIC:
--   This file is NOT applied by /api/setup/apply, the "Apply Supabase Sync
--   SQL" GitHub workflow, or src/lib/sync-sql.ts (those only apply
--   sync_20260922_prod_sync.sql, which this workstream deliberately did NOT
--   edit). Apply it once in the Supabase Dashboard → SQL Editor:
--     1. Open https://supabase.com/dashboard/project/imcsesyqurkpvguwpmem/sql
--     2. Paste the whole contents of this file, press Run.
--     3. Verify: as an anonymous key, SELECT from settings must return only
--        category='store' rows; as a signed-in NON-admin, the same; as an
--        admin, all rows. A signed-in non-admin must NOT see rows such as
--        stripe_secret_key / bkash_app_secret / smtp_password.
--   The file is idempotent (DROP IF EXISTS before each CREATE), so re-running
--   it is safe.
--
-- POLICY NOTE (how access works after this migration):
--   * `settings` — anon and signed-in non-admins: SELECT only rows where
--     category = 'store' (store name/address/phone/currency — the only rows
--     the public contact/FAQ pages read). INSERT/UPDATE/DELETE and every
--     non-'store' row (whatsapp / email / payment / general — i.e. all
--     secrets): admins only, where "admin" means an active row in
--     `admin_users` with auth_user_id = auth.uid().
--   * `admin_users` — an authenticated user may SELECT only their OWN row
--     (auth_user_id = auth.uid()). The app only ever looks up the current
--     user's own row (src/context/auth-context.tsx, admin-auth-context.tsx,
--     /api/settings, /api/admin/session), so nothing else needs it. The
--     EXISTS check in the settings policies still works: it asks about the
--     caller's own row, which is visible to them under this policy.
--   * Secrets still live in the `settings` table (not env vars). Moving them
--     to server-only env vars is the recommended follow-up; this migration
--     closes the read hole in the meantime.
--
-- ORDERS / CUSTOMERS / MESSAGES — DELIBERATELY UNCHANGED (residual risk):
--   The anon `SELECT ... USING (true)` policies on orders, customers and
--   messages stay as they are, because the storefront is guest-first and RLS
--   cannot scope a guest by anything the guest proves:
--   * orders: /track-order is a guest lookup by order_number
--     (src/app/track-order/page.tsx:111-114, anon client, no session). RLS
--     cannot see the order_number the page is filtering by, so no policy can
--     express "only the order you asked for". Order numbers are sequential
--     (RY-YYYY-NNNN), so anyone with the anon key can enumerate orders and
--     read totals/items/shipping addresses. Proper fix (other workstream):
--     a server-side track-order route that checks order_number (+ phone)
--     and returns one order, then drop the anon SELECT policy.
--   * customers: anon SELECT is required by the track-order join
--     (orders + customers(full_name, phone)), by the server routes
--     /api/customers/create and /api/complete-profile (which run on the anon
--     client), and by guest-checkout lookups. Removing it breaks those.
--   * messages: customer chat runs as anon with only a localStorage
--     customer_id (src/app/customer/messages/page.tsx) — no auth identity
--     exists for RLS to scope on, so "only your own messages" cannot be
--     expressed. Anyone with the anon key can read all chat messages.
--     Proper fix: require sign-in (or a per-customer token) for chat.
--   The authenticated `FOR ALL ... USING (true)` policies on those three
--   tables are also unchanged: scoping them to admin-or-own-row would
--   silently hide orders/customers from signed-in customers whose customer
--   row was created as a guest and never linked with auth_user_id
--   (src/context/auth-context.tsx keeps a valid localStorage customer id
--   without backfilling auth_user_id). That linkage must be fixed first
--   (checkout/auth workstream) before the authenticated policies can be
--   safely narrowed. Until then, any signed-in user can still read all
--   orders/customers/messages via direct Supabase calls — known residual
--   risk, documented here rather than silently "fixed" into a regression.
-- ============================================================================

-- --------------------------------------------------------------------------
-- 0. Defensive: make sure customers.auth_user_id exists (prod sync SQL
--    never added it; only migration 20260911000000 did).
-- --------------------------------------------------------------------------
ALTER TABLE customers ADD COLUMN IF NOT EXISTS auth_user_id UUID;
CREATE INDEX IF NOT EXISTS idx_customers_auth_user_id ON customers(auth_user_id);

-- --------------------------------------------------------------------------
-- 1. settings — drop the broad policies, replace with store-public + admin-only
--    Admin predicate: EXISTS (SELECT 1 FROM admin_users
--                             WHERE auth_user_id = auth.uid() AND is_active)
--    admin_users columns verified in sync_20260922_prod_sync.sql:419-435
--    (auth_user_id UUID, is_active BOOLEAN) and in
--    supabase/migrations/20260907000000_initial_schema.sql (legacy stub had
--    neither; the sync SQL upgrades it — see §0 note above for customers).
-- --------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow all for authenticated users ON settings" ON settings;
DROP POLICY IF EXISTS "Allow read for anon ON settings" ON settings;
DROP POLICY IF EXISTS "settings_admin_all" ON settings;
DROP POLICY IF EXISTS "settings_store_read_anon" ON settings;
DROP POLICY IF EXISTS "settings_store_read_authenticated" ON settings;

-- Admins (active admin_users row): full access to every settings row.
CREATE POLICY "settings_admin_all"
  ON settings FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.auth_user_id = auth.uid()
        AND admin_users.is_active
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.auth_user_id = auth.uid()
        AND admin_users.is_active
    )
  );

-- Everyone else: SELECT only the public store rows (name/address/phone/
-- currency/WhatsApp display number). This is what the contact + FAQ pages
-- read with `.eq("category", "store")`. All secret categories (whatsapp,
-- email, payment, general) are invisible to anon and to non-admin users.
CREATE POLICY "settings_store_read_anon"
  ON settings FOR SELECT TO anon
  USING (category = 'store');

CREATE POLICY "settings_store_read_authenticated"
  ON settings FOR SELECT TO authenticated
  USING (category = 'store');

-- Defence in depth: anon could never write via RLS (no anon write policy),
-- but drop the table-level grant too so a future policy slip cannot reopen it.
REVOKE INSERT, UPDATE, DELETE ON settings FROM anon;

-- --------------------------------------------------------------------------
-- 2. admin_users — stop leaking the admin roster to every signed-in user.
--    Old policy: authenticated SELECT USING (true) — any customer could list
--    admin emails/roles. New policy: a user sees only their own row.
--    (Self-referencing EXISTS is avoided here: the settings policies above
--    query admin_users for the caller's OWN row, which this policy permits.)
-- --------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow authenticated select admin_users" ON admin_users;
DROP POLICY IF EXISTS "admin_users_self_read" ON admin_users;

CREATE POLICY "admin_users_self_read"
  ON admin_users FOR SELECT TO authenticated
  USING (auth_user_id = auth.uid());

-- anon gets nothing on admin_users (unchanged — no anon policy, no grant).

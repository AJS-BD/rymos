-- RYmos returns / refunds — reconcile the two shipped schema variants
-- and widen the value lists the returns flow needs.
--
-- WHY THIS FILE EXISTS
--   * supabase/migrations/20260907000000_initial_schema.sql created
--     returns (status 'pending'|'approved'|'rejected'|'processed',
--     reason 'defective'|'exchange'|'other') and refunds
--     (method 'cash'|'bkash'|'nagad'|'bank'|'credit_adjustment').
--   * supabase/sync_20260922_prod_sync.sql (the file /setup applies to prod)
--     created them differently: returns.status
--     'requested'|'approved'|'rejected'|'completed', no quantity/notes/
--     resolution/processed_* columns; refunds.method
--     'cash'|'bkash'|'nagad'|'bank', no customer/reference/processed_* columns.
--   * The app code targets the union of both. This migration is idempotent
--     (safe to run twice) and brings either variant up to the union.
--
-- WHAT IT CHANGES
--   * returns.reason: adds 'damaged', 'wrong_item', 'not_as_described',
--     'changed_mind' (keeps 'defective', 'exchange', 'other').
--   * returns.status: union of both vocabularies —
--     'requested', 'pending', 'approved', 'rejected', 'processed', 'completed'.
--     New requests are inserted with status 'requested'.
--   * refunds.method: adds 'rocket' and 'card' (keeps 'cash', 'bkash',
--     'nagad', 'bank', 'credit_adjustment'). Refunds are paid in store or on
--     delivery — cash / bKash / Nagad / Rocket / card. There is NO online
--     payment gateway refund.
--   * refunds.status: union — 'pending', 'processing', 'processed',
--     'completed', 'failed'.
--   * Adds missing columns (IF NOT EXISTS): returns.quantity, returns.notes,
--     returns.resolution, returns.refund_amount, returns.requested_at,
--     returns.processed_by, returns.processed_at; refunds.reference,
--     refunds.processed_by, refunds.processed_at.
--   * RLS: NO CHANGE NEEDED. The sync SQL already has
--     "Allow auth all returns" / "Allow auth all refunds"
--     (FOR ALL TO authenticated USING (true)), so a signed-in customer can
--     INSERT/SELECT their own return requests and a signed-in admin can do
--     everything. (Note: that policy is broad — any authenticated user can
--     read all returns. Tightening it is out of scope here because there is
--     no auth.uid() <-> customers.id link and the admin panel uses the anon
--     client; see the audit, section 7.)
--
-- HOW TO APPLY (manual step — do NOT run against prod from this repo)
--   1. Open the Supabase dashboard for the RYmos project
--      (project ref imcsesyqurkpvguwpmem) -> SQL Editor -> New query.
--   2. Paste the entire contents of this file and press Run.
--   3. Confirm it reports success (it is safe to run twice).
--   4. Verify with:
--        SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint
--        WHERE conrelid IN ('returns'::regclass, 'refunds'::regclass)
--          AND contype = 'c';
--      The returns reason check must list 'damaged' and the refunds method
--      check must list 'rocket' and 'card'.
--   Until this is applied, return requests with the new reasons and refunds
--   via Rocket/card will be rejected by the old CHECK constraints.

-- ---------------------------------------------------------------------------
-- returns: missing columns
-- ---------------------------------------------------------------------------
ALTER TABLE returns ADD COLUMN IF NOT EXISTS quantity INT DEFAULT 1;
ALTER TABLE returns ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE returns ADD COLUMN IF NOT EXISTS resolution TEXT;
ALTER TABLE returns ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(12,2);
ALTER TABLE returns ADD COLUMN IF NOT EXISTS requested_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE returns ADD COLUMN IF NOT EXISTS processed_by UUID REFERENCES admin_users(id);
ALTER TABLE returns ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;

-- Backfill requested_at from created_at for pre-existing rows.
UPDATE returns SET requested_at = created_at WHERE requested_at IS NULL;

-- ---------------------------------------------------------------------------
-- refunds: missing columns
-- ---------------------------------------------------------------------------
ALTER TABLE refunds ADD COLUMN IF NOT EXISTS reference TEXT;
ALTER TABLE refunds ADD COLUMN IF NOT EXISTS processed_by UUID REFERENCES admin_users(id);
ALTER TABLE refunds ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;

-- ---------------------------------------------------------------------------
-- Widen the CHECK constraints (drop-if-exists + re-add, guarded so the
-- migration is idempotent). Constraint names are the standard auto-generated
-- <table>_<column>_check names from the inline CHECKs in both shipped files.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'returns_reason_check') THEN
    ALTER TABLE returns DROP CONSTRAINT returns_reason_check;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'returns_reason_check') THEN
    ALTER TABLE returns ADD CONSTRAINT returns_reason_check
      CHECK (reason IN ('defective', 'damaged', 'wrong_item', 'not_as_described', 'changed_mind', 'exchange', 'other'));
  END IF;

  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'returns_status_check') THEN
    ALTER TABLE returns DROP CONSTRAINT returns_status_check;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'returns_status_check') THEN
    ALTER TABLE returns ADD CONSTRAINT returns_status_check
      CHECK (status IN ('requested', 'pending', 'approved', 'rejected', 'processed', 'completed'));
  END IF;

  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'returns_resolution_check') THEN
    ALTER TABLE returns DROP CONSTRAINT returns_resolution_check;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'returns_resolution_check') THEN
    ALTER TABLE returns ADD CONSTRAINT returns_resolution_check
      CHECK (resolution IS NULL OR resolution IN ('refund', 'exchange', 'credit_adjustment'));
  END IF;

  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'refunds_method_check') THEN
    ALTER TABLE refunds DROP CONSTRAINT refunds_method_check;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'refunds_method_check') THEN
    ALTER TABLE refunds ADD CONSTRAINT refunds_method_check
      CHECK (method IS NULL OR method IN ('cash', 'bkash', 'nagad', 'rocket', 'card', 'bank', 'credit_adjustment'));
  END IF;

  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'refunds_status_check') THEN
    ALTER TABLE refunds DROP CONSTRAINT refunds_status_check;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'refunds_status_check') THEN
    ALTER TABLE refunds ADD CONSTRAINT refunds_status_check
      CHECK (status IN ('pending', 'processing', 'processed', 'completed', 'failed'));
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Helpful indexes + grants (grants already exist in the sync SQL; repeating
-- them here is harmless and covers DBs built from the initial migration only).
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_returns_order_id ON returns(order_id);
CREATE INDEX IF NOT EXISTS idx_returns_customer_id ON returns(customer_id);
CREATE INDEX IF NOT EXISTS idx_returns_status ON returns(status);
CREATE INDEX IF NOT EXISTS idx_refunds_return_id ON refunds(return_id);
CREATE INDEX IF NOT EXISTS idx_refunds_order_id ON refunds(order_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON returns, refunds TO authenticated;

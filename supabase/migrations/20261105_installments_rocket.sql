-- RYmos migration 2026-11-05 (integration fix)
-- Widen installments.payment_method to include 'rocket'.
-- The operative prod sync SQL allows ('cash','bkash','nagad','bank','card','mobile');
-- the initial schema allowed only ('cash','bkash','nagad','bank'). Instalments are
-- paid with the same methods as shop pickup (bKash / Nagad / Rocket / card / cash),
-- so 'rocket' must be accepted or recording a Rocket instalment payment fails.
-- Idempotent: safe to re-run. Apply in the Supabase SQL Editor (not applied live).
DO $$
DECLARE
  c RECORD;
BEGIN
  FOR c IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.installments'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%payment_method%'
  LOOP
    EXECUTE 'ALTER TABLE public.installments DROP CONSTRAINT ' || quote_ident(c.conname);
  END LOOP;
END $$;

ALTER TABLE public.installments
  ADD CONSTRAINT installments_payment_method_check
  CHECK (payment_method IN ('cash', 'bkash', 'nagad', 'rocket', 'card', 'bank', 'mobile'));

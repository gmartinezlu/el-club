-- 028 · Indexes, status enums, and RLS cleanup

-- ─── Missing indexes (used in RLS joins, currently seq-scan) ────────

CREATE INDEX IF NOT EXISTS idx_payments_appointment
  ON public.payments (appointment_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user
  ON public.notifications (user_id, created_at DESC);

-- ─── Status enums (replace free-text columns) ──────────────────────

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
    CREATE TYPE public.payment_status AS ENUM (
      'pending', 'completed', 'failed', 'refunded'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'withdrawal_status') THEN
    CREATE TYPE public.withdrawal_status AS ENUM (
      'requested', 'approved', 'completed', 'rejected'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'support_status') THEN
    CREATE TYPE public.support_status AS ENUM (
      'open', 'in_progress', 'resolved', 'closed'
    );
  END IF;
END $$;

-- Migrate existing text → enum (safe: casts valid values, fails on invalid)
ALTER TABLE public.payments
  ALTER COLUMN status TYPE public.payment_status
  USING status::public.payment_status;

ALTER TABLE public.withdrawals
  ALTER COLUMN status TYPE public.withdrawal_status
  USING status::public.withdrawal_status;

ALTER TABLE public.support_tickets
  ALTER COLUMN status TYPE public.support_status
  USING status::public.support_status;

-- ─── Fix redundant psychologists_select RLS ─────────────────────────

DROP POLICY IF EXISTS psychologists_select ON public.psychologists;
CREATE POLICY psychologists_select ON public.psychologists
FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR public.is_admin()
  OR (public.is_patient() AND is_approved = true)
);


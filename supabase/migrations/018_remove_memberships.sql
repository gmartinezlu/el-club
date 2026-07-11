-- Remove memberships feature: drop tables and related policies
-- The membership system (Wompi integration) has been deprecated in favor of direct therapy payments

-- Drop policies first
drop policy if exists membership_orders_admin_all on public.membership_orders;
drop policy if exists membership_orders_insert_own on public.membership_orders;
drop policy if exists membership_orders_select on public.membership_orders;
drop policy if exists patient_memberships_admin_all on public.patient_memberships;
drop policy if exists patient_memberships_select on public.patient_memberships;

-- Drop triggers
drop trigger if exists trg_membership_orders_updated_at on public.membership_orders;
drop trigger if exists trg_patient_memberships_updated_at on public.patient_memberships;

-- Drop tables
drop table if exists public.membership_orders;
drop table if exists public.patient_memberships;

-- Note: payments, wallets and withdrawals are unrelated to the membership feature
-- and remain in active use for direct Nequi payments to psychologists.

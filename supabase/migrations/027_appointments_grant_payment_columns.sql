-- Migration 008 revoked select on appointments and re-granted a fixed
-- column list (to hide notes_psychologist from patients). That list was
-- never updated when migration 022 added the Nequi payment columns, so any
-- query selecting them (APPOINTMENT_SELECT, used by both patient and
-- psychologist appointment fetches) failed with "permission denied for
-- table appointments" -- a column grant issue, not RLS.
grant select (
  id,
  patient_id,
  psychologist_id,
  starts_at,
  ends_at,
  status,
  google_meet_url,
  notes_patient,
  payment_proof_url,
  payment_deadline,
  payment_marked_paid_at,
  created_at,
  updated_at
) on public.appointments to authenticated;

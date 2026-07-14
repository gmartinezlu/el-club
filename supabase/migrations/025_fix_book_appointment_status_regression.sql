-- Fix a regression introduced by 023_book_appointment_race_fix.sql: that
-- migration was written against the OLDER book_appointment from 019, so it
-- unintentionally reverted two changes made by 022_nequi_payment_flow.sql:
--   - initial status must be 'requested' (not 'pending_payment' — the
--     Nequi flow starts payment only after the psychologist accepts)
--   - the active-slot conflict check (and the unique index backstop) must
--     exclude 'rejected', not the unused 'refund_pending' state
-- This migration restores the correct 022 behavior while keeping the 023
-- concurrency fix (row lock + unique index + unique_violation handling).

drop index if exists public.appointments_psychologist_active_slot_key;
create unique index appointments_psychologist_active_slot_key
  on public.appointments (psychologist_id, starts_at)
  where status not in ('cancelled', 'rejected');

create or replace function public.book_appointment(
  p_patient_id uuid,
  p_psychologist_id uuid,
  p_slot_id uuid
)
returns table (
  success boolean,
  appointment_id uuid,
  error_message text
) as $$
declare
  v_slot_exists boolean;
  v_appointment_id uuid;
  v_starts_at timestamptz;
  v_ends_at timestamptz;
  v_conflict_count integer;
begin
  -- Lock the slot row for the duration of the transaction so a concurrent
  -- booking of the same slot waits instead of racing past this check.
  select
    exists(select 1 from public.availability where id = p_slot_id and psychologist_id = p_psychologist_id),
    a.starts_at,
    a.ends_at
  into v_slot_exists, v_starts_at, v_ends_at
  from public.availability a
  where a.id = p_slot_id
  for update;

  if not v_slot_exists or v_starts_at is null then
    return query select false::boolean, null::uuid, 'Slot not found or psychologist mismatch'::text;
    return;
  end if;

  select count(*)
  into v_conflict_count
  from public.appointments
  where psychologist_id = p_psychologist_id
    and starts_at = v_starts_at
    and status not in ('cancelled', 'rejected');

  if v_conflict_count > 0 then
    return query select false::boolean, null::uuid, 'That time slot is no longer available'::text;
    return;
  end if;

  insert into public.appointments (
    patient_id,
    psychologist_id,
    starts_at,
    ends_at,
    status
  )
  values (
    p_patient_id,
    p_psychologist_id,
    v_starts_at,
    v_ends_at,
    'requested'
  )
  returning id into v_appointment_id;

  delete from public.availability where id = p_slot_id;

  return query select true::boolean, v_appointment_id, null::text;
exception
  when unique_violation then
    return query select false::boolean, null::uuid, 'That time slot is no longer available'::text;
    return;
end;
$$ language plpgsql security definer;

grant execute on function public.book_appointment(uuid, uuid, uuid) to authenticated;

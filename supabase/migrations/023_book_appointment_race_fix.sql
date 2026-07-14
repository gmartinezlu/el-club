-- Fix a race window in book_appointment (019): under concurrent calls for the
-- same slot, two transactions could both pass the availability/conflict
-- checks before either commits, producing a double-booking. This adds:
--   1. A `for update` lock on the availability row so concurrent bookings of
--      the same slot serialize instead of racing.
--   2. A partial unique index on appointments as a hard backstop, so even a
--      future code path that skips the RPC cannot create two active
--      appointments for the same psychologist/time slot.

create unique index if not exists appointments_psychologist_active_slot_key
  on public.appointments (psychologist_id, starts_at)
  where status not in ('cancelled', 'refund_pending');

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
  -- 1. Lock the slot row for the duration of the transaction so a concurrent
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

  -- 2. Check for conflicting appointments at that time
  select count(*)
  into v_conflict_count
  from public.appointments
  where psychologist_id = p_psychologist_id
    and starts_at = v_starts_at
    and status not in ('cancelled', 'refund_pending');

  if v_conflict_count > 0 then
    return query select false::boolean, null::uuid, 'That time slot is no longer available'::text;
    return;
  end if;

  -- 3. Create appointment (within transaction, atomically). The unique
  -- index above is the last line of defense if a second transaction slipped
  -- past the checks above.
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
    'pending_payment'
  )
  returning id into v_appointment_id;

  -- 4. Delete the slot
  delete from public.availability where id = p_slot_id;

  -- 5. Return success with appointment ID
  return query select true::boolean, v_appointment_id, null::text;
exception
  when unique_violation then
    return query select false::boolean, null::uuid, 'That time slot is no longer available'::text;
    return;
end;
$$ language plpgsql security definer;

grant execute on function public.book_appointment(uuid, uuid, uuid) to authenticated;

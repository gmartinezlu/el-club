-- Atomic appointment booking RPC to prevent double-booking
-- Single transaction: verify slot availability, create appointment, remove slot

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
  -- 1. Verify slot exists and is unbooked
  select
    exists(select 1 from public.availability where id = p_slot_id and psychologist_id = p_psychologist_id),
    a.starts_at,
    a.ends_at
  into v_slot_exists, v_starts_at, v_ends_at
  from public.availability a
  where a.id = p_slot_id;

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

  -- 3. Create appointment (within transaction, atomically)
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
end;
$$ language plpgsql security definer;

-- Grant execute permission to authenticated users
grant execute on function public.book_appointment(uuid, uuid, uuid) to authenticated;

-- 029 · Critical fixes: book_appointment race+status, demo payment, search_path, bucket limit

-- ─── 1. Fix book_appointment: merge 022 (requested status) + 023 (FOR UPDATE lock) ─────
--    Previous migrations conflicted: 022 set status to 'requested' but 023
--    overwrote the function back to 'pending_payment'. This version has both
--    the correct status AND the race-condition fix.

create or replace function public.book_appointment(
  p_patient_id uuid,
  p_psychologist_id uuid,
  p_slot_id uuid
)
returns table (
  success boolean,
  appointment_id uuid,
  error_message text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_slot_exists boolean;
  v_appointment_id uuid;
  v_starts_at timestamptz;
  v_ends_at timestamptz;
  v_conflict_count integer;
begin
  select
    exists(select 1 from availability where id = p_slot_id and psychologist_id = p_psychologist_id),
    a.starts_at,
    a.ends_at
  into v_slot_exists, v_starts_at, v_ends_at
  from availability a
  where a.id = p_slot_id
  for update;

  if not v_slot_exists or v_starts_at is null then
    return query select false::boolean, null::uuid, 'Slot not found or psychologist mismatch'::text;
    return;
  end if;

  select count(*)
  into v_conflict_count
  from appointments
  where psychologist_id = p_psychologist_id
    and starts_at = v_starts_at
    and status not in ('cancelled', 'rejected');

  if v_conflict_count > 0 then
    return query select false::boolean, null::uuid, 'That time slot is no longer available'::text;
    return;
  end if;

  insert into appointments (
    patient_id, psychologist_id, starts_at, ends_at, status
  ) values (
    p_patient_id, p_psychologist_id, v_starts_at, v_ends_at, 'requested'
  )
  returning id into v_appointment_id;

  delete from availability where id = p_slot_id;

  return query select true::boolean, v_appointment_id, null::text;
exception
  when unique_violation then
    return query select false::boolean, null::uuid, 'That time slot is no longer available'::text;
end;
$$;

grant execute on function public.book_appointment(uuid, uuid, uuid) to authenticated;


-- ─── 2. Fix confirm_demo_payment: admin-only + fix UTF-8 ───────────────────
--    This function was callable by any authenticated user, allowing payment
--    bypass. Now restricted to admins only.

create or replace function public.confirm_demo_payment(p_appointment_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  appointment_row appointments%rowtype;
  amount integer := 16000000;
  platform_fee integer := 3200000;
  psychologist_fee integer := 12800000;
begin
  if not is_admin() then
    raise exception 'Solo administradores pueden confirmar pagos demo';
  end if;

  select *
  into appointment_row
  from appointments
  where id = p_appointment_id
  for update;

  if not found then
    raise exception 'Cita no encontrada';
  end if;

  if appointment_row.status <> 'pending_payment'::appointment_status then
    raise exception 'Esta cita no esta pendiente de pago';
  end if;

  insert into payments (
    appointment_id, provider, provider_payment_id,
    amount_cents, currency, platform_fee_cents, psychologist_fee_cents, status
  ) values (
    p_appointment_id, 'demo', 'demo-' || p_appointment_id::text,
    amount, 'COP', platform_fee, psychologist_fee, 'completed'
  );

  update appointments
  set status = 'confirmed'
  where id = p_appointment_id;
end;
$$;

grant execute on function public.confirm_demo_payment(uuid) to authenticated;


-- ─── 3. Add search_path to other security definer functions missing it ──────

create or replace function public.mark_appointment_pending_payment(
  p_appointment_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_psychologist_id uuid;
  v_hours integer;
begin
  select psychologist_id
  into v_psychologist_id
  from appointments
  where id = p_appointment_id
    and status = 'requested'
  for update;

  if v_psychologist_id is null then
    raise exception 'Cita no encontrada o no esta en estado solicitada';
  end if;

  if v_psychologist_id <> auth.uid() and not is_admin() then
    raise exception 'No tienes permisos sobre esta cita';
  end if;

  select coalesce(payment_confirmation_hours, 24)
  into v_hours
  from psychologists
  where user_id = v_psychologist_id;

  update appointments
  set status = 'pending_payment',
      payment_deadline = now() + (v_hours || ' hours')::interval
  where id = p_appointment_id;
end;
$$;

grant execute on function public.mark_appointment_pending_payment(uuid) to authenticated;


-- ─── 4. Align nequi-qr-codes bucket to 2 MB (matches frontend validation) ──

update storage.buckets
set file_size_limit = 2097152
where id = 'nequi-qr-codes';

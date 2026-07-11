-- FASE 3: Pago de la consulta al Nequi del especialista.
-- EL CLUB nunca procesa dinero: solo coordina el flujo de confirmacion manual.

alter table public.psychologists
  add column if not exists nequi_number text,
  add column if not exists session_price_cents integer check (session_price_cents >= 0),
  add column if not exists nequi_qr_url text;

alter table public.appointments
  add column if not exists payment_proof_url text,
  add column if not exists payment_deadline timestamptz,
  add column if not exists payment_marked_paid_at timestamptz;

-- Bucket publico: el QR de Nequi debe ser visible por cualquier paciente
-- que vaya a pagar, no solo por quien lo subio.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'nequi-qr-codes',
  'nequi-qr-codes',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = true,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists nequi_qr_read_public on storage.objects;
create policy nequi_qr_read_public on storage.objects
for select to public
using (bucket_id = 'nequi-qr-codes');

drop policy if exists nequi_qr_insert_own on storage.objects;
create policy nequi_qr_insert_own on storage.objects
for insert to authenticated
with check (
  bucket_id = 'nequi-qr-codes'
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists nequi_qr_update_own on storage.objects;
create policy nequi_qr_update_own on storage.objects
for update to authenticated
using (
  bucket_id = 'nequi-qr-codes'
  and split_part(name, '/', 1) = auth.uid()::text
)
with check (
  bucket_id = 'nequi-qr-codes'
  and split_part(name, '/', 1) = auth.uid()::text
);

-- Bucket privado para comprobantes de pago subidos por el paciente.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'payment-proofs',
  'payment-proofs',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- Convencion de ruta: {patient_id}/{appointment_id}-{timestamp}-{filename}
drop policy if exists payment_proofs_insert_own on storage.objects;
create policy payment_proofs_insert_own on storage.objects
for insert to authenticated
with check (
  bucket_id = 'payment-proofs'
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists payment_proofs_read on storage.objects;
create policy payment_proofs_read on storage.objects
for select to authenticated
using (
  bucket_id = 'payment-proofs'
  and (
    public.is_admin()
    or split_part(name, '/', 1) = auth.uid()::text
    or exists (
      select 1 from public.appointments a
      where a.patient_id::text = split_part(name, '/', 1)
        and a.psychologist_id = auth.uid()
    )
  )
);

-- 'paid' y 'refund_pending' quedan sin uso: nunca se transiciona a ellos
-- desde este punto en adelante (dead states, se conservan en el enum
-- para no reescribir el tipo, pero la maquina de estados los ignora).
create or replace function public.validate_appointment_status_transition(
  old_status public.appointment_status,
  new_status public.appointment_status
)
returns boolean
language plpgsql
immutable
as $$
begin
  if old_status = new_status then
    return true;
  end if;

  return case old_status
    when 'requested' then new_status in ('pending_payment', 'rejected', 'cancelled')
    when 'pending_payment' then new_status in ('confirmed', 'cancelled')
    when 'confirmed' then new_status in ('meeting_enabled', 'completed', 'cancelled')
    when 'meeting_enabled' then new_status in ('completed', 'cancelled')
    when 'completed' then false
    when 'cancelled' then false
    when 'rejected' then false
    else false
  end;
end;
$$;

-- Actualiza las policies de appointments para reflejar 'requested' como
-- estado inicial real (book_appointment ahora inserta 'requested').
drop policy if exists appointments_insert on public.appointments;
create policy appointments_insert on public.appointments
for insert to authenticated
with check (
  public.is_admin()
  or (
    public.is_patient()
    and patient_id = auth.uid()
    and status = 'requested'::public.appointment_status
  )
);

drop policy if exists appointments_update on public.appointments;
create policy appointments_update on public.appointments
for update to authenticated
using (
  public.is_admin()
  or psychologist_id = auth.uid()
  or (
    patient_id = auth.uid()
    and status in (
      'requested'::public.appointment_status,
      'pending_payment'::public.appointment_status,
      'confirmed'::public.appointment_status
    )
  )
)
with check (
  public.is_admin()
  or psychologist_id = auth.uid()
  or patient_id = auth.uid()
);

-- book_appointment insertaba directamente en 'pending_payment'; el flujo
-- correcto es 'requested' (el pago inicia cuando la psicologa acepta).
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
end;
$$ language plpgsql security definer;

grant execute on function public.book_appointment(uuid, uuid, uuid) to authenticated;

-- La psicologa acepta la solicitud: arranca el plazo de pago Nequi.
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
  from public.appointments
  where id = p_appointment_id
    and status = 'requested'
  for update;

  if v_psychologist_id is null then
    raise exception 'Cita no encontrada o no esta en estado solicitada';
  end if;

  if v_psychologist_id <> auth.uid() and not public.is_admin() then
    raise exception 'No tienes permisos sobre esta cita';
  end if;

  select coalesce(payment_confirmation_hours, 24)
  into v_hours
  from public.psychologists
  where user_id = v_psychologist_id;

  update public.appointments
  set status = 'pending_payment',
      payment_deadline = now() + (v_hours || ' hours')::interval
  where id = p_appointment_id;
end;
$$;

grant execute on function public.mark_appointment_pending_payment(uuid) to authenticated;

-- La psicologa confirma que recibio el Nequi: pasa a confirmada y libera
-- el plazo de pago.
create or replace function public.confirm_payment_received(
  p_appointment_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_psychologist_id uuid;
begin
  select psychologist_id
  into v_psychologist_id
  from public.appointments
  where id = p_appointment_id
    and status = 'pending_payment'
  for update;

  if v_psychologist_id is null then
    raise exception 'Cita no encontrada o no esta pendiente de pago';
  end if;

  if v_psychologist_id <> auth.uid() and not public.is_admin() then
    raise exception 'No tienes permisos sobre esta cita';
  end if;

  update public.appointments
  set status = 'confirmed',
      payment_deadline = null
  where id = p_appointment_id;
end;
$$;

grant execute on function public.confirm_payment_received(uuid) to authenticated;

-- Libera una cita vencida sin pago confirmado: la cancela y devuelve el
-- horario a disponibilidad. Cualquiera de las dos partes puede llamarla,
-- pero solo tiene efecto si el plazo ya venció.
create or replace function public.release_unpaid_appointment(
  p_appointment_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.appointments%rowtype;
begin
  select *
  into v_row
  from public.appointments
  where id = p_appointment_id
    and status = 'pending_payment'
  for update;

  if v_row.id is null then
    return;
  end if;

  if v_row.patient_id <> auth.uid()
     and v_row.psychologist_id <> auth.uid()
     and not public.is_admin() then
    raise exception 'No tienes permisos sobre esta cita';
  end if;

  if v_row.payment_deadline is null or v_row.payment_deadline > now() then
    return;
  end if;

  update public.appointments
  set status = 'cancelled'
  where id = p_appointment_id;

  insert into public.availability (psychologist_id, starts_at, ends_at)
  values (v_row.psychologist_id, v_row.starts_at, v_row.ends_at);

  insert into public.notifications (user_id, title, body)
  values
    (v_row.patient_id, 'Solicitud vencida', 'El plazo para confirmar tu pago vencio y la cita fue liberada.'),
    (v_row.psychologist_id, 'Cita liberada', 'El plazo de pago vencio sin confirmacion y el horario volvio a tu disponibilidad.');
end;
$$;

grant execute on function public.release_unpaid_appointment(uuid) to authenticated;


-- El Club · Session pricing update
-- Public price: 110.000 COP
-- Psychologist payout: 90.000 COP
-- Platform fee: 20.000 COP

create or replace function public.confirm_demo_payment(p_appointment_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  appointment_row public.appointments%rowtype;
  amount integer := 11000000;
  platform_fee integer := 2000000;
  psychologist_fee integer := 9000000;
begin
  select *
  into appointment_row
  from public.appointments
  where id = p_appointment_id
  for update;

  if not found then
    raise exception 'Cita no encontrada';
  end if;

  if appointment_row.patient_id <> auth.uid() and not public.is_admin() then
    raise exception 'No tienes permisos para confirmar esta cita';
  end if;

  if appointment_row.status <> 'pending_payment'::public.appointment_status then
    raise exception 'Esta cita no está pendiente de pago';
  end if;

  insert into public.payments (
    appointment_id,
    provider,
    provider_payment_id,
    amount_cents,
    currency,
    platform_fee_cents,
    psychologist_fee_cents,
    status
  )
  values (
    p_appointment_id,
    'demo',
    'demo-' || p_appointment_id::text,
    amount,
    'COP',
    platform_fee,
    psychologist_fee,
    'approved'
  );

  update public.appointments
  set status = 'paid'::public.appointment_status
  where id = p_appointment_id;

  update public.appointments
  set status = 'confirmed'::public.appointment_status
  where id = p_appointment_id;
end;
$$;

grant execute on function public.confirm_demo_payment(uuid) to authenticated;

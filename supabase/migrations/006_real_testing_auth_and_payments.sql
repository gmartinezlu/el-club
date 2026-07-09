-- El Club · Real testing helpers
-- Auth profile bootstrap + demo payment RPC for a real Supabase project.

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  app_role public.app_role;
  display_name text;
begin
  app_role := coalesce(
    nullif(new.raw_user_meta_data ->> 'role', '')::public.app_role,
    'patient'::public.app_role
  );
  display_name := nullif(new.raw_user_meta_data ->> 'full_name', '');

  insert into public.users (id, role, full_name, avatar_url)
  values (new.id, app_role, display_name, null)
  on conflict (id) do update
    set role = excluded.role,
        full_name = coalesce(public.users.full_name, excluded.full_name),
        updated_at = now();

  if app_role = 'patient'::public.app_role then
    insert into public.patients (user_id)
    values (new.id)
    on conflict (user_id) do nothing;
  elsif app_role = 'psychologist'::public.app_role then
    insert into public.psychologists (user_id, is_approved)
    values (new.id, false)
    on conflict (user_id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_el_club on auth.users;
create trigger on_auth_user_created_el_club
after insert on auth.users
for each row execute function public.handle_new_auth_user();

create or replace function public.confirm_demo_payment(p_appointment_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  appointment_row public.appointments%rowtype;
  amount integer := 16000000;
  platform_fee integer := 3200000;
  psychologist_fee integer := 12800000;
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

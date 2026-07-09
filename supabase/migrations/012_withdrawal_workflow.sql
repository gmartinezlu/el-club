-- El Club - Withdrawal workflow

create or replace function public.available_psychologist_balance_cents(
  p_psychologist_id uuid
)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  with earned as (
    select coalesce(sum(p.psychologist_fee_cents), 0)::integer as amount
    from public.payments p
    join public.appointments a on a.id = p.appointment_id
    where a.psychologist_id = p_psychologist_id
      and a.status = 'completed'::public.appointment_status
      and p.status = 'approved'
  ),
  reserved as (
    select coalesce(sum(w.amount_cents), 0)::integer as amount
    from public.withdrawals w
    where w.psychologist_id = p_psychologist_id
      and w.status in ('requested', 'processing', 'approved')
  )
  select greatest((select amount from earned) - (select amount from reserved), 0);
$$;

create or replace function public.request_psychologist_withdrawal(
  p_amount_cop integer
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  amount_cents integer;
  available_cents integer;
  withdrawal_id uuid;
begin
  if p_amount_cop is null or p_amount_cop <= 0 then
    raise exception 'El monto debe ser mayor a cero';
  end if;

  if not exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.role = 'psychologist'::public.app_role
  ) then
    raise exception 'Solo las psicologas pueden solicitar retiros';
  end if;

  amount_cents := p_amount_cop * 100;
  available_cents := public.available_psychologist_balance_cents(auth.uid());

  if amount_cents > available_cents then
    raise exception 'El monto supera tu saldo disponible';
  end if;

  insert into public.withdrawals (psychologist_id, amount_cents, status)
  values (auth.uid(), amount_cents, 'requested')
  returning id into withdrawal_id;

  insert into public.notifications (user_id, title, body)
  values (
    auth.uid(),
    'Solicitud de retiro recibida',
    'Recibimos tu solicitud de retiro. El equipo de El Club la revisara y actualizara su estado.'
  );

  return withdrawal_id;
end;
$$;

create or replace function public.review_withdrawal_request(
  p_withdrawal_id uuid,
  p_status text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  withdrawal_row public.withdrawals%rowtype;
  notification_title text;
  notification_body text;
begin
  if not public.is_admin() then
    raise exception 'No tienes permisos para revisar retiros';
  end if;

  if p_status not in ('requested', 'processing', 'approved', 'rejected') then
    raise exception 'Estado de retiro invalido';
  end if;

  select *
  into withdrawal_row
  from public.withdrawals
  where id = p_withdrawal_id
  for update;

  if not found then
    raise exception 'Retiro no encontrado';
  end if;

  update public.withdrawals
  set status = p_status
  where id = p_withdrawal_id;

  notification_title := case p_status
    when 'processing' then 'Tu retiro esta en proceso'
    when 'approved' then 'Tu retiro fue aprobado'
    when 'rejected' then 'Tu retiro no pudo procesarse'
    else 'Tu retiro esta en revision'
  end;

  notification_body := case p_status
    when 'processing' then 'El equipo de El Club esta procesando tu transferencia.'
    when 'approved' then 'Tu retiro fue marcado como aprobado por el equipo de El Club.'
    when 'rejected' then 'Tu solicitud de retiro fue rechazada. Contacta soporte si necesitas mas detalle.'
    else 'Tu solicitud de retiro sigue en revision.'
  end;

  insert into public.notifications (user_id, title, body)
  values (withdrawal_row.psychologist_id, notification_title, notification_body);
end;
$$;

grant execute on function public.available_psychologist_balance_cents(uuid) to authenticated;
grant execute on function public.request_psychologist_withdrawal(integer) to authenticated;
grant execute on function public.review_withdrawal_request(uuid, text) to authenticated;

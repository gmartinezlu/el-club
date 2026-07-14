-- 031: Clear appointment history + admin user deletion

-- Let users clear their own finished appointments
create or replace function public.clear_appointment_history(p_user_id uuid)
returns integer
language plpgsql security definer set search_path = public
as $$
declare
  deleted_count integer;
begin
  if auth.uid() is distinct from p_user_id then
    raise exception 'No autorizado';
  end if;

  delete from payments
  where appointment_id in (
    select id from appointments
    where (patient_id = p_user_id or psychologist_id = p_user_id)
      and status in ('completed', 'cancelled', 'rejected')
  );

  delete from appointments
  where (patient_id = p_user_id or psychologist_id = p_user_id)
    and status in ('completed', 'cancelled', 'rejected');

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

-- Admin-only: delete a user and all their data
create or replace function public.admin_delete_user(p_user_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  caller_role text;
begin
  select role into caller_role from users where id = auth.uid();
  if caller_role is distinct from 'admin' then
    raise exception 'Solo administradores pueden eliminar usuarios';
  end if;

  if p_user_id = auth.uid() then
    raise exception 'No puedes eliminarte a ti mismo';
  end if;

  delete from payments
  where appointment_id in (
    select id from appointments
    where patient_id = p_user_id or psychologist_id = p_user_id
  );

  delete from appointments
  where patient_id = p_user_id or psychologist_id = p_user_id;

  delete from auth.users where id = p_user_id;
end;
$$;

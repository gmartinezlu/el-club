-- El Club - Security hardening for role, approvals and withdrawals

create or replace function public.prevent_unsafe_user_role_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  if public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.role not in ('patient'::public.app_role, 'psychologist'::public.app_role) then
      raise exception 'No puedes crear este rol';
    end if;
    return new;
  end if;

  if old.role is distinct from new.role then
    raise exception 'No puedes cambiar tu rol';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_prevent_unsafe_user_role_changes on public.users;
create trigger trg_prevent_unsafe_user_role_changes
before insert or update on public.users
for each row execute function public.prevent_unsafe_user_role_changes();

create or replace function public.prevent_unsafe_psychologist_review_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  if public.is_admin() then
    return new;
  end if;

  if new.is_approved = true and old.is_approved is distinct from true then
    raise exception 'No puedes aprobar tu propio perfil';
  end if;

  if new.application_status is distinct from old.application_status
     and new.application_status <> 'pending' then
    raise exception 'No puedes cambiar el estado de revision';
  end if;

  if new.review_notes is distinct from old.review_notes
     or new.reviewed_at is distinct from old.reviewed_at
     or new.reviewed_by is distinct from old.reviewed_by then
    raise exception 'No puedes modificar datos internos de revision';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_prevent_unsafe_psychologist_review_changes on public.psychologists;
create trigger trg_prevent_unsafe_psychologist_review_changes
before update on public.psychologists
for each row execute function public.prevent_unsafe_psychologist_review_changes();

drop policy if exists withdrawals_insert_psychologist on public.withdrawals;
create policy withdrawals_insert_admin_only on public.withdrawals
for insert to authenticated
with check (public.is_admin());

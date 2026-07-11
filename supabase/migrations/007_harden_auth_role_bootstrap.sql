-- El Club Â· Harden public Auth bootstrap
-- Public signup can only create patient or psychologist profiles.
-- Admin users must be promoted manually by an existing admin/Supabase owner.

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text;
  app_role public.app_role;
  display_name text;
begin
  requested_role := nullif(new.raw_user_meta_data ->> 'role', '');
  app_role := case
    when requested_role = 'psychologist' then 'psychologist'::public.app_role
    else 'patient'::public.app_role
  end;
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

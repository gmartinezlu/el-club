-- El Club - Psychologist review workflow

alter table public.psychologists
  add column if not exists application_status text not null default 'pending'
    check (application_status in ('pending', 'approved', 'rejected', 'paused')),
  add column if not exists review_notes text,
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid references public.users (id) on delete set null;

update public.psychologists
set application_status = case
  when is_approved = true then 'approved'
  when application_status is null then 'pending'
  else application_status
end;

create or replace function public.review_psychologist_application(
  p_psychologist_id uuid,
  p_status text,
  p_review_notes text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  notification_title text;
  notification_body text;
begin
  if not public.is_admin() then
    raise exception 'No tienes permisos para revisar postulaciones';
  end if;

  if p_status not in ('pending', 'approved', 'rejected', 'paused') then
    raise exception 'Estado de revision invalido';
  end if;

  if p_status in ('rejected', 'paused') and length(trim(coalesce(p_review_notes, ''))) = 0 then
    raise exception 'El motivo es obligatorio para rechazar o pausar';
  end if;

  update public.psychologists
  set application_status = p_status,
      is_approved = (p_status = 'approved'),
      review_notes = nullif(trim(coalesce(p_review_notes, '')), ''),
      reviewed_at = now(),
      reviewed_by = auth.uid()
  where user_id = p_psychologist_id;

  if not found then
    raise exception 'Psicologa no encontrada';
  end if;

  notification_title := case p_status
    when 'approved' then 'Tu perfil fue aprobado'
    when 'rejected' then 'Tu postulacion necesita revision'
    when 'paused' then 'Tu perfil fue pausado'
    else 'Tu postulacion esta en revision'
  end;

  notification_body := case p_status
    when 'approved' then 'Ya puedes aparecer para pacientes y gestionar tu agenda dentro de El Club.'
    when 'rejected' then 'Revisamos tu postulacion y necesitamos ajustes antes de aprobarla.'
    when 'paused' then 'Tu perfil no esta visible para pacientes mientras revisamos tu informacion.'
    else 'Recibimos tu postulacion y el equipo la revisara con cuidado.'
  end;

  if nullif(trim(coalesce(p_review_notes, '')), '') is not null then
    notification_body := notification_body || ' Nota del equipo: ' || trim(p_review_notes);
  end if;

  insert into public.notifications (user_id, title, body)
  values (p_psychologist_id, notification_title, notification_body);
end;
$$;

grant execute on function public.review_psychologist_application(uuid, text, text) to authenticated;

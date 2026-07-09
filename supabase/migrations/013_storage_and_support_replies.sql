-- El Club - Professional documents storage + support replies

alter table public.support_tickets
  add column if not exists admin_response text,
  add column if not exists responded_at timestamptz,
  add column if not exists responded_by uuid references public.users (id) on delete set null;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'psychologist-documents',
  'psychologist-documents',
  false,
  10485760,
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists psychologist_documents_read_own_or_admin on storage.objects;
create policy psychologist_documents_read_own_or_admin on storage.objects
for select to authenticated
using (
  bucket_id = 'psychologist-documents'
  and (
    public.is_admin()
    or split_part(name, '/', 1) = auth.uid()::text
  )
);

drop policy if exists psychologist_documents_insert_own on storage.objects;
create policy psychologist_documents_insert_own on storage.objects
for insert to authenticated
with check (
  bucket_id = 'psychologist-documents'
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists psychologist_documents_update_own on storage.objects;
create policy psychologist_documents_update_own on storage.objects
for update to authenticated
using (
  bucket_id = 'psychologist-documents'
  and split_part(name, '/', 1) = auth.uid()::text
)
with check (
  bucket_id = 'psychologist-documents'
  and split_part(name, '/', 1) = auth.uid()::text
);

create or replace function public.respond_support_ticket(
  p_ticket_id uuid,
  p_response text,
  p_status text default 'closed'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  ticket_row public.support_tickets%rowtype;
begin
  if not public.is_admin() then
    raise exception 'No tienes permisos para responder soporte';
  end if;

  if length(trim(coalesce(p_response, ''))) = 0 then
    raise exception 'La respuesta no puede estar vacia';
  end if;

  if p_status not in ('open', 'in_review', 'closed') then
    raise exception 'Estado de soporte invalido';
  end if;

  select *
  into ticket_row
  from public.support_tickets
  where id = p_ticket_id
  for update;

  if not found then
    raise exception 'Ticket no encontrado';
  end if;

  update public.support_tickets
  set admin_response = trim(p_response),
      responded_at = now(),
      responded_by = auth.uid(),
      status = p_status
  where id = p_ticket_id;

  if ticket_row.user_id is not null then
    insert into public.notifications (user_id, title, body)
    values (
      ticket_row.user_id,
      'Respuesta de soporte',
      trim(p_response)
    );
  end if;
end;
$$;

grant execute on function public.respond_support_ticket(uuid, text, text) to authenticated;

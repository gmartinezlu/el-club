-- El Club Â· Crisis chat + psychologist professional application

alter table public.psychologists
  add column if not exists professional_title text,
  add column if not exists license_number text,
  add column if not exists university text,
  add column if not exists experience_years integer check (experience_years is null or experience_years >= 0),
  add column if not exists clinical_approach text,
  add column if not exists document_url text,
  add column if not exists application_notes text,
  add column if not exists application_submitted_at timestamptz;

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
    insert into public.psychologists (
      user_id,
      is_approved,
      professional_title,
      license_number,
      university,
      experience_years,
      clinical_approach,
      document_url,
      application_notes,
      application_submitted_at
    )
    values (
      new.id,
      false,
      nullif(new.raw_user_meta_data ->> 'professional_title', ''),
      nullif(new.raw_user_meta_data ->> 'license_number', ''),
      nullif(new.raw_user_meta_data ->> 'university', ''),
      nullif(new.raw_user_meta_data ->> 'experience_years', '')::integer,
      nullif(new.raw_user_meta_data ->> 'clinical_approach', ''),
      nullif(new.raw_user_meta_data ->> 'document_url', ''),
      nullif(new.raw_user_meta_data ->> 'application_notes', ''),
      now()
    )
    on conflict (user_id) do update
      set professional_title = coalesce(public.psychologists.professional_title, excluded.professional_title),
          license_number = coalesce(public.psychologists.license_number, excluded.license_number),
          university = coalesce(public.psychologists.university, excluded.university),
          experience_years = coalesce(public.psychologists.experience_years, excluded.experience_years),
          clinical_approach = coalesce(public.psychologists.clinical_approach, excluded.clinical_approach),
          document_url = coalesce(public.psychologists.document_url, excluded.document_url),
          application_notes = coalesce(public.psychologists.application_notes, excluded.application_notes),
          application_submitted_at = coalesce(public.psychologists.application_submitted_at, excluded.application_submitted_at);
  end if;

  return new;
end;
$$;

create table if not exists public.crisis_chat_threads (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (user_id) on delete cascade,
  psychologist_id uuid not null references public.psychologists (user_id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (patient_id, psychologist_id)
);

create table if not exists public.crisis_chat_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.crisis_chat_threads (id) on delete cascade,
  sender_id uuid not null references public.users (id) on delete cascade,
  body text not null check (length(trim(body)) > 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_crisis_threads_patient
  on public.crisis_chat_threads (patient_id, updated_at desc);

create index if not exists idx_crisis_threads_psychologist
  on public.crisis_chat_threads (psychologist_id, updated_at desc);

create index if not exists idx_crisis_messages_thread
  on public.crisis_chat_messages (thread_id, created_at asc);

alter table public.crisis_chat_threads enable row level security;
alter table public.crisis_chat_messages enable row level security;

create or replace function public.has_active_clinical_relationship(
  p_patient_id uuid,
  p_psychologist_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.appointments a
    where a.patient_id = p_patient_id
      and a.psychologist_id = p_psychologist_id
      and a.status in (
        'paid'::public.appointment_status,
        'confirmed'::public.appointment_status,
        'meeting_enabled'::public.appointment_status,
        'completed'::public.appointment_status
      )
  );
$$;

create or replace function public.can_access_crisis_thread(p_thread_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.crisis_chat_threads t
    where t.id = p_thread_id
      and (
        public.is_admin()
        or t.patient_id = auth.uid()
        or t.psychologist_id = auth.uid()
      )
  );
$$;

drop policy if exists crisis_threads_select on public.crisis_chat_threads;
create policy crisis_threads_select on public.crisis_chat_threads
for select to authenticated
using (
  public.is_admin()
  or patient_id = auth.uid()
  or psychologist_id = auth.uid()
);

drop policy if exists crisis_threads_insert on public.crisis_chat_threads;
create policy crisis_threads_insert on public.crisis_chat_threads
for insert to authenticated
with check (
  public.is_admin()
  or (
    patient_id = auth.uid()
    and public.has_active_clinical_relationship(patient_id, psychologist_id)
  )
);

drop policy if exists crisis_messages_select on public.crisis_chat_messages;
create policy crisis_messages_select on public.crisis_chat_messages
for select to authenticated
using (public.can_access_crisis_thread(thread_id));

drop policy if exists crisis_messages_insert on public.crisis_chat_messages;
create policy crisis_messages_insert on public.crisis_chat_messages
for insert to authenticated
with check (
  sender_id = auth.uid()
  and public.can_access_crisis_thread(thread_id)
);

drop trigger if exists trg_crisis_threads_updated_at on public.crisis_chat_threads;
create trigger trg_crisis_threads_updated_at
before update on public.crisis_chat_threads
for each row execute function public.set_updated_at();

grant select, insert, update on public.crisis_chat_threads to authenticated;
grant select, insert on public.crisis_chat_messages to authenticated;

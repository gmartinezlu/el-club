-- El Club Â· Private psychologist notes
-- Keep patient-visible appointment rows separate from psychologist-only notes.

create table if not exists public.psychologist_session_notes (
  appointment_id uuid primary key references public.appointments (id) on delete cascade,
  psychologist_id uuid not null references public.psychologists (user_id) on delete cascade,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.psychologist_session_notes (
  appointment_id,
  psychologist_id,
  notes
)
select id, psychologist_id, notes_psychologist
from public.appointments
where notes_psychologist is not null
  and notes_psychologist <> ''
on conflict (appointment_id) do update
set notes = excluded.notes,
    updated_at = now();

alter table public.psychologist_session_notes enable row level security;

drop policy if exists psychologist_notes_select on public.psychologist_session_notes;
create policy psychologist_notes_select on public.psychologist_session_notes
for select to authenticated
using (public.is_admin() or psychologist_id = auth.uid());

drop policy if exists psychologist_notes_insert on public.psychologist_session_notes;
create policy psychologist_notes_insert on public.psychologist_session_notes
for insert to authenticated
with check (public.is_admin() or psychologist_id = auth.uid());

drop policy if exists psychologist_notes_update on public.psychologist_session_notes;
create policy psychologist_notes_update on public.psychologist_session_notes
for update to authenticated
using (public.is_admin() or psychologist_id = auth.uid())
with check (public.is_admin() or psychologist_id = auth.uid());

drop trigger if exists trg_psychologist_session_notes_updated_at
  on public.psychologist_session_notes;
create trigger trg_psychologist_session_notes_updated_at
before update on public.psychologist_session_notes
for each row execute function public.set_updated_at();

grant select, insert, update on public.psychologist_session_notes to authenticated;

-- Supabase/PostgREST table grants can expose columns even when RLS is correct.
-- Re-grant appointment SELECT without notes_psychologist so patients cannot
-- request private notes directly from the appointments table.
revoke select on public.appointments from anon, authenticated;
grant select (
  id,
  patient_id,
  psychologist_id,
  starts_at,
  ends_at,
  status,
  google_meet_url,
  notes_patient,
  created_at,
  updated_at
) on public.appointments to authenticated;

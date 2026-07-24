-- Mood check-ins persisted per patient and appointment reminder delivery log.

alter table public.users
  add column if not exists whatsapp_phone text;

create table if not exists public.mood_checkins (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (user_id) on delete cascade,
  entry_date date not null,
  mood smallint not null check (mood between 1 and 5),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (patient_id, entry_date)
);

create index if not exists idx_mood_checkins_patient_date
  on public.mood_checkins (patient_id, entry_date desc);

drop trigger if exists trg_mood_checkins_updated_at on public.mood_checkins;
create trigger trg_mood_checkins_updated_at
before update on public.mood_checkins
for each row execute function public.set_updated_at();

alter table public.mood_checkins enable row level security;

drop policy if exists mood_checkins_patient_own on public.mood_checkins;
create policy mood_checkins_patient_own on public.mood_checkins
for all
using (patient_id = auth.uid() or public.is_admin())
with check (patient_id = auth.uid() or public.is_admin());

create table if not exists public.appointment_reminder_deliveries (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments (id) on delete cascade,
  reminder_key text not null check (reminder_key in ('24h', '1h')),
  email_sent_at timestamptz,
  whatsapp_sent_at timestamptz,
  whatsapp_skipped_reason text,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (appointment_id, reminder_key)
);

create index if not exists idx_appointment_reminder_deliveries_appointment
  on public.appointment_reminder_deliveries (appointment_id);

drop trigger if exists trg_appointment_reminder_deliveries_updated_at on public.appointment_reminder_deliveries;
create trigger trg_appointment_reminder_deliveries_updated_at
before update on public.appointment_reminder_deliveries
for each row execute function public.set_updated_at();

alter table public.appointment_reminder_deliveries enable row level security;

drop policy if exists appointment_reminder_deliveries_admin_all on public.appointment_reminder_deliveries;
create policy appointment_reminder_deliveries_admin_all on public.appointment_reminder_deliveries
for all
using (public.is_admin())
with check (public.is_admin());

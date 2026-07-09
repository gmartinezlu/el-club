-- El Club · Core schema (ejecutar en Supabase SQL Editor o via CLI)
-- Orden: 001 → 002 → 003

create extension if not exists "pgcrypto";

-- Enums
do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('patient', 'psychologist', 'admin');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'appointment_status') then
    create type public.appointment_status as enum (
      'pending_payment',
      'paid',
      'confirmed',
      'meeting_enabled',
      'completed',
      'cancelled',
      'refund_pending'
    );
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'resource_type') then
    create type public.resource_type as enum (
      'article',
      'meditation',
      'audio',
      'exercise',
      'pdf'
    );
  end if;
end $$;

-- Users / profiles
create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.app_role not null,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.patients (
  user_id uuid primary key references public.users (id) on delete cascade,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.psychologists (
  user_id uuid primary key references public.users (id) on delete cascade,
  bio text,
  specialties text[] default '{}',
  languages text[] default '{}',
  is_approved boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.availability (
  id uuid primary key default gen_random_uuid(),
  psychologist_id uuid not null references public.psychologists (user_id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint availability_range_valid check (ends_at > starts_at)
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (user_id) on delete restrict,
  psychologist_id uuid not null references public.psychologists (user_id) on delete restrict,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status public.appointment_status not null default 'pending_payment',
  google_meet_url text,
  notes_patient text,
  notes_psychologist text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint appointment_range_valid check (ends_at > starts_at),
  constraint appointment_distinct_parties check (patient_id <> psychologist_id)
);

create index if not exists idx_appointments_patient_starts
  on public.appointments (patient_id, starts_at desc);

create index if not exists idx_appointments_psychologist_starts
  on public.appointments (psychologist_id, starts_at desc);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments (id) on delete restrict,
  provider text not null,
  provider_payment_id text,
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null default 'COP',
  platform_fee_cents integer not null default 0 check (platform_fee_cents >= 0),
  psychologist_fee_cents integer not null default 0 check (psychologist_fee_cents >= 0),
  status text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.wallets (
  psychologist_id uuid primary key references public.psychologists (user_id) on delete cascade,
  balance_cents integer not null default 0 check (balance_cents >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.withdrawals (
  id uuid primary key default gen_random_uuid(),
  psychologist_id uuid not null references public.psychologists (user_id) on delete cascade,
  amount_cents integer not null check (amount_cents > 0),
  status text not null default 'requested',
  created_at timestamptz not null default now()
);

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  type public.resource_type not null,
  content text,
  media_url text,
  duration_minutes integer check (duration_minutes is null or duration_minutes > 0),
  is_published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.journals (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (user_id) on delete cascade,
  title text,
  body text not null,
  mood smallint check (mood is null or (mood between 1 and 10)),
  created_at timestamptz not null default now()
);

create index if not exists idx_journals_patient_created
  on public.journals (patient_id, created_at desc);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  title text not null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments (id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (appointment_id)
);

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users (id) on delete set null,
  subject text not null,
  body text not null,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

-- updated_at helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_users_updated_at on public.users;
create trigger trg_users_updated_at
before update on public.users
for each row execute function public.set_updated_at();

drop trigger if exists trg_appointments_updated_at on public.appointments;
create trigger trg_appointments_updated_at
before update on public.appointments
for each row execute function public.set_updated_at();

drop trigger if exists trg_resources_updated_at on public.resources;
create trigger trg_resources_updated_at
before update on public.resources
for each row execute function public.set_updated_at();

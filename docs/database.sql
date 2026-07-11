-- El Club Â· Esquema base (referencia)
-- Fuente de verdad para migraciones: supabase/migrations/
-- Ver docs/supabase-setup.md para instrucciones de despliegue.

-- Extensiones recomendadas
create extension if not exists "uuid-ossp";

-- Roles de aplicaciÃ³n (no confundir con roles de Postgres)
do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type app_role as enum ('patient', 'psychologist', 'admin');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'appointment_status') then
    create type appointment_status as enum (
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

-- USERS / PROFILES
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  role app_role not null,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- PATIENTS
create table if not exists public.patients (
  user_id uuid primary key references public.users(id) on delete cascade,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now()
);

-- PSYCHOLOGISTS
create table if not exists public.psychologists (
  user_id uuid primary key references public.users(id) on delete cascade,
  bio text,
  specialties text[],
  languages text[],
  is_approved boolean not null default false,
  created_at timestamptz not null default now()
);

-- AVAILABILITY
create table if not exists public.availability (
  id uuid primary key default uuid_generate_v4(),
  psychologist_id uuid not null references public.psychologists(user_id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- APPOINTMENTS (therapy sessions with direct Nequi payments)
create table if not exists public.appointments (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid not null references public.patients(user_id),
  psychologist_id uuid not null references public.psychologists(user_id),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status appointment_status not null default 'pending_payment',
  google_meet_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- PAYMENTS (direct Nequi payments to psychologist for each session)
-- Payments system is managed externally; this table records Nequi webhook events
create table if not exists public.payments (
  id uuid primary key default uuid_generate_v4(),
  appointment_id uuid not null references public.appointments(id) on delete restrict,
  provider text not null default 'nequi', -- always 'nequi' now
  provider_payment_id text,
  amount_cents integer not null,
  currency text not null default 'COP',
  status text not null, -- created | paid | failed | refunded
  created_at timestamptz not null default now()
);

-- WALLETS / WITHDRAWALS
create table if not exists public.wallets (
  psychologist_id uuid primary key references public.psychologists(user_id) on delete cascade,
  balance_cents integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.withdrawals (
  id uuid primary key default uuid_generate_v4(),
  psychologist_id uuid not null references public.psychologists(user_id) on delete cascade,
  amount_cents integer not null,
  status text not null, -- requested | processing | paid | rejected
  created_at timestamptz not null default now()
);

-- RESOURCES
create table if not exists public.resources (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  type text not null, -- article | meditation | audio | pdf
  content text,
  created_at timestamptz not null default now()
);

-- JOURNALS
create table if not exists public.journals (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid not null references public.patients(user_id) on delete cascade,
  title text,
  body text not null,
  mood integer, -- opcional (1-10)
  created_at timestamptz not null default now()
);

-- NOTIFICATIONS
create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- REVIEWS
create table if not exists public.reviews (
  id uuid primary key default uuid_generate_v4(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

-- SUPPORT
create table if not exists public.support_tickets (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete set null,
  subject text not null,
  body text not null,
  status text not null default 'open',
  created_at timestamptz not null default now()
);


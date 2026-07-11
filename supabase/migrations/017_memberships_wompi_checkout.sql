-- Membresias EL CLUB con pago interno por Wompi.
-- Terapia sigue fuera de pagos internos de la plataforma.

create table if not exists public.patient_memberships (
  patient_id uuid primary key references public.patients (user_id) on delete cascade,
  plan_code text not null check (plan_code in ('comunidad', 'club', 'acompañamiento')),
  status text not null default 'active' check (status in ('active', 'paused', 'cancelled', 'expired')),
  started_at timestamptz not null default now(),
  ends_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.membership_orders (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (user_id) on delete cascade,
  plan_code text not null check (plan_code in ('comunidad', 'club', 'acompañamiento')),
  amount_cents integer not null check (amount_cents > 0),
  currency text not null default 'COP',
  provider text not null default 'wompi',
  provider_reference text not null unique,
  provider_transaction_id text,
  status text not null default 'pending_payment'
    check (status in ('pending_payment', 'approved', 'declined', 'voided')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_membership_orders_patient_created
  on public.membership_orders (patient_id, created_at desc);

drop trigger if exists trg_patient_memberships_updated_at on public.patient_memberships;
create trigger trg_patient_memberships_updated_at
before update on public.patient_memberships
for each row execute function public.set_updated_at();

drop trigger if exists trg_membership_orders_updated_at on public.membership_orders;
create trigger trg_membership_orders_updated_at
before update on public.membership_orders
for each row execute function public.set_updated_at();

alter table public.patient_memberships enable row level security;
alter table public.membership_orders enable row level security;

drop policy if exists patient_memberships_select on public.patient_memberships;
create policy patient_memberships_select on public.patient_memberships
for select to authenticated
using (patient_id = auth.uid() or public.is_admin());

drop policy if exists patient_memberships_admin_all on public.patient_memberships;
create policy patient_memberships_admin_all on public.patient_memberships
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists membership_orders_select on public.membership_orders;
create policy membership_orders_select on public.membership_orders
for select to authenticated
using (patient_id = auth.uid() or public.is_admin());

drop policy if exists membership_orders_insert_own on public.membership_orders;
create policy membership_orders_insert_own on public.membership_orders
for insert to authenticated
with check (
  patient_id = auth.uid()
  and status = 'pending_payment'
  and provider = 'wompi'
);

drop policy if exists membership_orders_admin_all on public.membership_orders;
create policy membership_orders_admin_all on public.membership_orders
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Permite crear citas nuevas con el estado "Solicitada" luego de migrar el enum.
drop policy if exists appointments_insert on public.appointments;
create policy appointments_insert on public.appointments
for insert to authenticated
with check (
  public.is_admin()
  or (
    public.is_patient()
    and patient_id = auth.uid()
    and status in (
      'requested'::public.appointment_status,
      'pending_payment'::public.appointment_status
    )
  )
);

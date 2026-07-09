-- El Club · Funciones de autorización + RLS

-- Rol del usuario autenticado
create or replace function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.users where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role = 'admin'::public.app_role
  );
$$;

create or replace function public.is_patient()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_app_role() = 'patient'::public.app_role;
$$;

create or replace function public.is_psychologist()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_app_role() = 'psychologist'::public.app_role;
$$;

-- Psicóloga tiene relación con paciente vía cita
create or replace function public.psychologist_has_patient(p_patient_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.appointments a
    where a.psychologist_id = auth.uid()
      and a.patient_id = p_patient_id
  );
$$;

-- Transiciones válidas de estado de cita
create or replace function public.validate_appointment_status_transition(
  old_status public.appointment_status,
  new_status public.appointment_status
)
returns boolean
language plpgsql
immutable
as $$
begin
  if old_status = new_status then
    return true;
  end if;

  return case old_status
    when 'pending_payment' then new_status in ('paid', 'cancelled')
    when 'paid' then new_status in ('confirmed', 'cancelled', 'refund_pending')
    when 'confirmed' then new_status in ('meeting_enabled', 'cancelled', 'refund_pending')
    when 'meeting_enabled' then new_status in ('completed', 'cancelled', 'refund_pending')
    when 'completed' then new_status in ('refund_pending')
    when 'cancelled' then false
    when 'refund_pending' then new_status in ('cancelled', 'paid')
    else false
  end;
end;
$$;

create or replace function public.enforce_appointment_status_transition()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' and old.status is distinct from new.status then
    if not public.validate_appointment_status_transition(old.status, new.status) then
      raise exception 'Transición de estado inválida: % → %', old.status, new.status;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_appointments_status_transition on public.appointments;
create trigger trg_appointments_status_transition
before update on public.appointments
for each row execute function public.enforce_appointment_status_transition();

-- Si hay URL de Meet y la cita está confirmada → meeting_enabled
create or replace function public.appointments_status_side_effects()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'confirmed'::public.appointment_status
     and new.google_meet_url is not null
     and new.google_meet_url <> '' then
    new.status := 'meeting_enabled'::public.appointment_status;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_appointments_status_side_effects on public.appointments;
create trigger trg_appointments_status_side_effects
before insert or update on public.appointments
for each row execute function public.appointments_status_side_effects();

-- ─── RLS ─────────────────────────────────────────────────────────────

alter table public.users enable row level security;
alter table public.patients enable row level security;
alter table public.psychologists enable row level security;
alter table public.availability enable row level security;
alter table public.appointments enable row level security;
alter table public.payments enable row level security;
alter table public.wallets enable row level security;
alter table public.withdrawals enable row level security;
alter table public.resources enable row level security;
alter table public.journals enable row level security;
alter table public.notifications enable row level security;
alter table public.reviews enable row level security;
alter table public.support_tickets enable row level security;

-- USERS
drop policy if exists users_select on public.users;
create policy users_select on public.users
for select to authenticated
using (id = auth.uid() or public.is_admin());

drop policy if exists users_insert_own on public.users;
create policy users_insert_own on public.users
for insert to authenticated
with check (id = auth.uid() or public.is_admin());

drop policy if exists users_update_own on public.users;
create policy users_update_own on public.users
for update to authenticated
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

-- PATIENTS
drop policy if exists patients_select on public.patients;
create policy patients_select on public.patients
for select to authenticated
using (
  user_id = auth.uid()
  or public.is_admin()
  or (public.is_psychologist() and public.psychologist_has_patient(user_id))
);

drop policy if exists patients_insert_own on public.patients;
create policy patients_insert_own on public.patients
for insert to authenticated
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists patients_update_own on public.patients;
create policy patients_update_own on public.patients
for update to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

-- PSYCHOLOGISTS (pacientes ven solo aprobadas)
drop policy if exists psychologists_select on public.psychologists;
create policy psychologists_select on public.psychologists
for select to authenticated
using (
  user_id = auth.uid()
  or public.is_admin()
  or (public.is_patient() and is_approved = true)
  or (public.is_psychologist() and user_id = auth.uid())
);

drop policy if exists psychologists_insert_own on public.psychologists;
create policy psychologists_insert_own on public.psychologists
for insert to authenticated
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists psychologists_update on public.psychologists;
create policy psychologists_update on public.psychologists
for update to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

-- AVAILABILITY
drop policy if exists availability_select on public.availability;
create policy availability_select on public.availability
for select to authenticated
using (
  public.is_admin()
  or psychologist_id = auth.uid()
  or (
    public.is_patient()
    and exists (
      select 1 from public.psychologists p
      where p.user_id = availability.psychologist_id and p.is_approved = true
    )
  )
);

drop policy if exists availability_manage_psychologist on public.availability;
create policy availability_manage_psychologist on public.availability
for all to authenticated
using (psychologist_id = auth.uid() or public.is_admin())
with check (psychologist_id = auth.uid() or public.is_admin());

-- APPOINTMENTS
drop policy if exists appointments_select on public.appointments;
create policy appointments_select on public.appointments
for select to authenticated
using (
  public.is_admin()
  or patient_id = auth.uid()
  or psychologist_id = auth.uid()
);

drop policy if exists appointments_insert on public.appointments;
create policy appointments_insert on public.appointments
for insert to authenticated
with check (
  public.is_admin()
  or (
    public.is_patient()
    and patient_id = auth.uid()
    and status = 'pending_payment'::public.appointment_status
  )
);

drop policy if exists appointments_update on public.appointments;
create policy appointments_update on public.appointments
for update to authenticated
using (
  public.is_admin()
  or psychologist_id = auth.uid()
  or (
    patient_id = auth.uid()
    and status in (
      'pending_payment'::public.appointment_status,
      'paid'::public.appointment_status,
      'confirmed'::public.appointment_status
    )
  )
)
with check (
  public.is_admin()
  or psychologist_id = auth.uid()
  or patient_id = auth.uid()
);

-- PAYMENTS
drop policy if exists payments_select on public.payments;
create policy payments_select on public.payments
for select to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.appointments a
    where a.id = payments.appointment_id
      and (a.patient_id = auth.uid() or a.psychologist_id = auth.uid())
  )
);

drop policy if exists payments_admin_all on public.payments;
create policy payments_admin_all on public.payments
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

-- WALLETS
drop policy if exists wallets_select on public.wallets;
create policy wallets_select on public.wallets
for select to authenticated
using (psychologist_id = auth.uid() or public.is_admin());

drop policy if exists wallets_admin_all on public.wallets;
create policy wallets_admin_all on public.wallets
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

-- WITHDRAWALS
drop policy if exists withdrawals_select on public.withdrawals;
create policy withdrawals_select on public.withdrawals
for select to authenticated
using (psychologist_id = auth.uid() or public.is_admin());

drop policy if exists withdrawals_insert_psychologist on public.withdrawals;
create policy withdrawals_insert_psychologist on public.withdrawals
for insert to authenticated
with check (psychologist_id = auth.uid() or public.is_admin());

drop policy if exists withdrawals_admin_update on public.withdrawals;
create policy withdrawals_admin_update on public.withdrawals
for update to authenticated
using (public.is_admin())
with check (public.is_admin());

-- RESOURCES (lectura para autenticados; gestión admin)
drop policy if exists resources_select_published on public.resources;
create policy resources_select_published on public.resources
for select to authenticated
using (is_published = true or public.is_admin());

drop policy if exists resources_admin_all on public.resources;
create policy resources_admin_all on public.resources
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

-- JOURNALS
drop policy if exists journals_patient_own on public.journals;
create policy journals_patient_own on public.journals
for all to authenticated
using (patient_id = auth.uid() or public.is_admin())
with check (patient_id = auth.uid() or public.is_admin());

-- NOTIFICATIONS
drop policy if exists notifications_own on public.notifications;
create policy notifications_own on public.notifications
for all to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

-- REVIEWS
drop policy if exists reviews_select on public.reviews;
create policy reviews_select on public.reviews
for select to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.appointments a
    where a.id = reviews.appointment_id
      and (a.patient_id = auth.uid() or a.psychologist_id = auth.uid())
  )
);

drop policy if exists reviews_insert_patient on public.reviews;
create policy reviews_insert_patient on public.reviews
for insert to authenticated
with check (
  public.is_admin()
  or exists (
    select 1 from public.appointments a
    where a.id = reviews.appointment_id
      and a.patient_id = auth.uid()
      and a.status = 'completed'::public.appointment_status
  )
);

-- SUPPORT
drop policy if exists support_select on public.support_tickets;
create policy support_select on public.support_tickets
for select to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists support_insert on public.support_tickets;
create policy support_insert on public.support_tickets
for insert to authenticated
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists support_admin_update on public.support_tickets;
create policy support_admin_update on public.support_tickets
for update to authenticated
using (public.is_admin())
with check (public.is_admin());

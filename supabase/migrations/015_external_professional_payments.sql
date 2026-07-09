-- El Club no procesa pagos de terapia.
-- Los pagos se coordinan directamente entre la persona y la especialista.
-- Ejecutar esta migracion antes de 016_external_professional_payment_status_rules.sql.

alter type public.appointment_status add value if not exists 'requested';
alter type public.appointment_status add value if not exists 'rejected';

alter table public.psychologists
  add column if not exists professional_whatsapp text,
  add column if not exists payment_methods text[] default '{}',
  add column if not exists payment_instructions text,
  add column if not exists cancellation_policy text,
  add column if not exists payment_confirmation_hours integer not null default 24
    check (payment_confirmation_hours > 0 and payment_confirmation_hours <= 168),
  add column if not exists allow_whatsapp_after_request boolean not null default true;

drop function if exists public.confirm_demo_payment(uuid);

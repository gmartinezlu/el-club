-- Ejecutar despues de 015_external_professional_payments.sql.
-- PostgreSQL necesita confirmar los nuevos valores del enum antes de usarlos.

alter table public.appointments
  alter column status set default 'requested'::public.appointment_status;

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
    when 'requested' then new_status in ('pending_payment', 'confirmed', 'rejected', 'cancelled')
    when 'pending_payment' then new_status in ('confirmed', 'rejected', 'cancelled')
    when 'paid' then new_status in ('confirmed', 'cancelled', 'refund_pending')
    when 'confirmed' then new_status in ('meeting_enabled', 'completed', 'cancelled', 'refund_pending')
    when 'meeting_enabled' then new_status in ('completed', 'cancelled', 'refund_pending')
    when 'completed' then false
    when 'cancelled' then false
    when 'rejected' then false
    when 'refund_pending' then new_status in ('cancelled')
    else false
  end;
end;
$$;

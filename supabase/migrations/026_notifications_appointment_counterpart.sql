-- El flujo de citas necesita que una parte notifique a la otra (paciente
-- avisa a la psicologa al solicitar, psicologa avisa al paciente al cambiar
-- el estado o habilitar el Meet). La policy original ("for all", solo
-- user_id = auth.uid()) bloqueaba esos inserts con RLS, lo que rompia
-- "Solicitar cita" antes de poder navegar a la pagina de pago.
drop policy if exists notifications_own on public.notifications;

create policy notifications_select on public.notifications
for select to authenticated
using (user_id = auth.uid() or public.is_admin());

create policy notifications_update on public.notifications
for update to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

create policy notifications_delete on public.notifications
for delete to authenticated
using (user_id = auth.uid() or public.is_admin());

-- Permite insertar una notificacion propia, o para la contraparte de una
-- cita compartida (paciente <-> psicologa), o como admin.
create policy notifications_insert on public.notifications
for insert to authenticated
with check (
  user_id = auth.uid()
  or public.is_admin()
  or exists (
    select 1 from public.appointments a
    where (a.patient_id = auth.uid() and a.psychologist_id = user_id)
       or (a.psychologist_id = auth.uid() and a.patient_id = user_id)
  )
);

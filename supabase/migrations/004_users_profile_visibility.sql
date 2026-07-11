-- Permite leer perfiles relacionados (pacienteâ†”psicÃ³loga) y psicÃ³logas aprobadas

drop policy if exists users_select on public.users;

create policy users_select on public.users
for select to authenticated
using (
  id = auth.uid()
  or public.is_admin()
  or exists (
    select 1
    from public.appointments a
    where
      (a.patient_id = auth.uid() and a.psychologist_id = users.id)
      or (a.psychologist_id = auth.uid() and a.patient_id = users.id)
  )
  or (
    public.is_patient()
    and exists (
      select 1
      from public.psychologists p
      where p.user_id = users.id and p.is_approved = true
    )
  )
);

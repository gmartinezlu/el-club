-- 033: Allow authenticated clients to execute maintenance RPCs.

grant execute on function public.clear_appointment_history(uuid) to authenticated;
grant execute on function public.admin_delete_user(uuid) to authenticated;

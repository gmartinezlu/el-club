import { useEffect, useState } from "react";
import { fetchAllAppointmentsAdmin } from "../../appointments/admin";
import { getSupabaseClient } from "../../services/supabase/client";

export function useAdminStats() {
  const [appointmentCount, setAppointmentCount] = useState(0);
  const [pendingPsychologists, setPendingPsychologists] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [appointments, psychResult] = await Promise.all([
          fetchAllAppointmentsAdmin(),
          getSupabaseClient()
            .from("psychologists")
            .select("user_id", { count: "exact", head: true })
            .eq("application_status", "pending"),
        ]);

        if (!cancelled) {
          setAppointmentCount(appointments.length);
          setPendingPsychologists(psychResult.count ?? 0);
        }
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error ? e.message : "No se pudieron cargar métricas",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { appointmentCount, pendingPsychologists, loading, error };
}

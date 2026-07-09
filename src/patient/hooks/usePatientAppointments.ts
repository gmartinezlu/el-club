import { useCallback, useEffect, useState } from "react";
import {
  fetchPatientAppointments,
  getNextAppointment,
  getPastAppointments,
} from "../../appointments";
import type { PatientAppointmentView } from "../../appointments/types";
import { useSessionStore } from "../../store/sessionStore";

export function usePatientAppointments() {
  const user = useSessionStore((s) => s.user);
  const [appointments, setAppointments] = useState<PatientAppointmentView[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!user) {
      setAppointments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await fetchPatientAppointments(user.id);
      setAppointments(data);
    } catch (e) {
      setAppointments([]);
      setError(
        e instanceof Error ? e.message : "No se pudieron cargar tus citas",
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    queueMicrotask(() => {
      void reload();
    });
  }, [reload]);

  const next = getNextAppointment(appointments);
  const history = getPastAppointments(appointments);

  return { appointments, next, history, loading, error, reload };
}

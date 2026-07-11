import { useCallback, useEffect, useState } from "react";
import {
  buildPatientSummaries,
  fetchPsychologistAppointments,
  getNextAppointment,
  getPastAppointments,
} from "../../appointments";
import type { PsychologistAppointmentView } from "../../appointments/types";
import { useSessionStore } from "../../store/sessionStore";

export function usePsychologistAppointments() {
  const user = useSessionStore((s) => s.user);
  const [appointments, setAppointments] = useState<
    PsychologistAppointmentView[]
  >([]);
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
      const data = await fetchPsychologistAppointments(user.id);
      setAppointments(data);
    } catch (e) {
      setAppointments([]);
      setError(
        e instanceof Error ? e.message : "No se pudieron cargar las citas",
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
  const patients = buildPatientSummaries(appointments);

  return {
    appointments,
    next,
    history,
    patients,
    loading,
    error,
    reload,
  };
}

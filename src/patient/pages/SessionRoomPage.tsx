import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, SearchX, Shield, Video } from "lucide-react";
import { fetchPatientAppointmentById } from "../../appointments/patient";
import type { PatientAppointmentView } from "../../appointments/types";
import { useSessionStore } from "../../store/sessionStore";
import {
  canJoinSession,
  formatSessionDate,
  formatSessionRange,
} from "../utils/formatDate";
import { EmotionalGlass } from "../components/EmotionalGlass";
import { PatientFlowSteps } from "../components/PatientFlowSteps";
import { EmptyState } from "../../components/ui/EmptyState";
import { PageTitle } from "../../components/ui/Typography";

export function SessionRoomPage() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const user = useSessionStore((s) => s.user);
  const [appointment, setAppointment] =
    useState<PatientAppointmentView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      await Promise.resolve();

      if (!user || !appointmentId) {
        if (!cancelled) {
          setAppointment(null);
          setError(null);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const data = await fetchPatientAppointmentById(user.id, appointmentId);
        if (!cancelled) setAppointment(data);
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error ? e.message : "No se pudo cargar la sesión",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, appointmentId]);

  const canJoin =
    appointment &&
    canJoinSession(
      appointment.startsAt,
      appointment.status,
      appointment.googleMeetUrl,
    );
  const hasMeet = Boolean(appointment?.googleMeetUrl);

  function openMeet() {
    if (!appointment?.googleMeetUrl) return;
    window.open(appointment.googleMeetUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <PatientFlowSteps current={4} />

      <Link
        to="/patient"
        className="inline-flex items-center gap-2 text-sm text-club-muted transition hover:text-club-green"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
        Volver a tu espacio
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <p className="text-sm font-medium text-club-green">Sesión en El Club</p>
        <PageTitle className="mt-2">Tu espacio seguro</PageTitle>
        <p className="mt-3 text-sm leading-relaxed text-club-muted">
          Aquí queda preparada tu sesión: fecha, estado y acceso a Google Meet
          cuando el enlace esté habilitado.
        </p>
      </motion.div>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      {loading ? (
        <div className="h-64 animate-pulse rounded-3xl bg-club-green/5" />
      ) : !appointment ? (
        <EmptyState
          icon={SearchX}
          title="No encontramos esta sesión"
          description="Puede que el enlace esté vencido o la cita haya cambiado."
          action={{ label: "Ir al inicio", to: "/patient" }}
        />
      ) : (
        <EmotionalGlass className="p-8 md:p-10">
          <div className="flex items-center gap-3 text-club-green">
            <Shield className="h-5 w-5" strokeWidth={1.5} />
            <span className="text-sm">Conexión privada</span>
          </div>

          <p className="mt-6 font-display text-3xl text-club-green">
            {appointment.psychologistName}
          </p>
          <p className="mt-2 capitalize text-sm text-club-muted">
            {formatSessionDate(appointment.startsAt)}
          </p>
          <p className="text-sm text-club-muted">
            {formatSessionRange(appointment.startsAt, appointment.endsAt)}
          </p>

          <div className="mt-10 rounded-3xl border border-club-green/10 bg-gradient-to-br from-club-cream/40 to-white/30 p-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-club-green/10">
              <Video className="h-8 w-8 text-club-green" strokeWidth={1.5} />
            </div>
            <p className="mt-6 font-display text-xl text-club-green">
              Lista para conectar
            </p>
            <p className="mt-2 text-sm text-club-muted">
              Continuarás en Google Meet con la misma calma de El Club.
            </p>

            {canJoin ? (
              <button
                type="button"
                onClick={openMeet}
                className="mt-8 w-full rounded-2xl bg-club-green px-6 py-4 text-base text-club-paper shadow-soft transition hover:opacity-95 sm:w-auto sm:min-w-[240px]"
              >
                Abrir videollamada
              </button>
            ) : (
              <p className="mt-8 text-sm text-club-muted">
                {hasMeet
                  ? "Tu enlace ya está preparado. Podrás entrar unos minutos antes de la cita."
                  : "Tu psicóloga está preparando el enlace de Meet."}
              </p>
            )}
          </div>

          <ul className="mt-8 space-y-2 text-sm text-club-muted">
            <li>· Busca un lugar tranquilo y con buena luz.</li>
            <li>· Usa auriculares si puedes, para más intimidad.</li>
            <li>· No necesitas apurarte: tu psicóloga te espera.</li>
          </ul>
        </EmotionalGlass>
      )}
    </div>
  );
}

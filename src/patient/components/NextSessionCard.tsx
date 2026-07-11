import { Link } from "react-router-dom";
import { Calendar, ClipboardCheck, Video } from "lucide-react";
import type { PatientAppointment } from "../types";
import {
  canJoinSession,
  formatSessionDate,
  formatSessionRange,
  isSessionSoon,
} from "../utils/formatDate";
import { EmotionalGlass } from "./EmotionalGlass";
import { EmptyState } from "../../components/ui/EmptyState";

export function NextSessionCard({
  appointment,
}: {
  appointment: PatientAppointment | null;
}) {
  if (!appointment) {
    return (
      <EmptyState
        icon={Calendar}
        title="Aún no tienes una sesión agendada"
        description="Cuando reserves tu próxima cita, aparecerá aquí con calma y claridad."
        action={{ label: "Explorar psicólogas", to: "/patient/psychologists" }}
      />
    );
  }

  const soon = isSessionSoon(appointment.startsAt);
  const canJoin = canJoinSession(
    appointment.startsAt,
    appointment.status,
    appointment.googleMeetUrl,
  );
  const meetPending =
    appointment.status === "confirmed" && !appointment.googleMeetUrl;
  const meetReady = Boolean(appointment.googleMeetUrl);

  return (
    <EmotionalGlass className="p-6 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-club-muted">
            Próxima sesión
          </p>
          {soon ? (
            <span className="inline-flex rounded-full bg-club-green/10 px-3 py-1 text-xs text-club-green">
              Muy pronto
            </span>
          ) : null}
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-club-green/10 text-club-green">
          <Calendar className="h-5 w-5" strokeWidth={1.5} />
        </div>
      </div>

      <p className="mt-4 font-display text-3xl text-club-green">
        {appointment.psychologistName}
      </p>
      <p className="mt-2 capitalize text-sm text-club-muted">
        {formatSessionDate(appointment.startsAt)}
      </p>
      <p className="text-sm text-club-muted">
        {formatSessionRange(appointment.startsAt, appointment.endsAt)}
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        {["requested", "pending_payment"].includes(appointment.status) ? (
          <Link
            to={`/patient/requests/${appointment.id}`}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-club-green px-6 py-3.5 text-base text-club-paper shadow-soft transition hover:translate-y-[-1px] hover:opacity-95"
          >
            <ClipboardCheck className="h-5 w-5" strokeWidth={1.5} />
            Ver solicitud
          </Link>
        ) : canJoin ? (
          <Link
            to={`/patient/session/${appointment.id}`}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-club-green px-6 py-3.5 text-base text-club-paper shadow-soft transition hover:translate-y-[-1px] hover:opacity-95"
          >
            <Video className="h-5 w-5" strokeWidth={1.5} />
            Entrar a tu sesión
          </Link>
        ) : (
          <p className="text-sm text-club-muted">
            {meetPending
              ? "Tu psicóloga está preparando el enlace de Meet."
              : meetReady
                ? "El acceso se habilitará unos minutos antes de tu cita."
                : "El acceso se habilitará cuando la sesión esté confirmada."}
          </p>
        )}
        <Link
          to="/patient/sessions"
          className="text-center text-sm text-club-green underline-offset-4 hover:underline sm:text-left"
        >
          Ver historial
        </Link>
      </div>
    </EmotionalGlass>
  );
}

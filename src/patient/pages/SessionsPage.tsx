import { motion } from "framer-motion";
import { useState } from "react";
import { Link } from "react-router-dom";
import { CalendarPlus, ClipboardCheck, Video } from "lucide-react";
import { STATUS_LABELS } from "../../appointments/utils";
import { usePatientAppointments } from "../hooks/usePatientAppointments";
import { formatSessionDate, formatSessionRange } from "../utils/formatDate";
import { EmotionalGlass } from "../components/EmotionalGlass";

export function PatientSessionsPage() {
  const { appointments, history, loading, error } = usePatientAppointments();
  const [now] = useState(() => Date.now());
  const upcoming = appointments.filter(
    (a) =>
      new Date(a.startsAt).getTime() > now &&
      a.status !== "cancelled" &&
      a.status !== "completed",
  );

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <p className="text-sm font-medium text-club-green">Tu camino</p>
        <h1 className="font-display text-4xl text-club-green">Sesiones</h1>
        <p className="max-w-lg text-sm leading-relaxed text-club-muted">
          Tus solicitudes, citas confirmadas y accesos a Meet en un solo lugar.
        </p>
      </header>

      <div className="rounded-3xl border border-club-green/10 bg-white/45 p-4 text-sm leading-relaxed text-club-muted shadow-soft backdrop-blur">
        Coordina el pago directamente con tu especialista. EL CLUB no solicita
        pagos por WhatsApp ni procesa dinero de sesiones dentro de la
        plataforma.
      </div>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      {loading ? (
        <div className="h-40 animate-pulse rounded-3xl bg-club-green/5" />
      ) : (
        <>
          {upcoming.length > 0 ? (
            <section className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-xl text-club-green">
                  Proximas
                </h2>
                <Link
                  to="/patient/psychologists"
                  className="inline-flex items-center gap-2 rounded-full bg-club-green px-4 py-2 text-xs text-club-paper transition hover:opacity-95"
                >
                  <CalendarPlus className="h-3.5 w-3.5" strokeWidth={1.5} />
                  Agendar otra sesion
                </Link>
              </div>
              <ul className="space-y-3">
                {upcoming.map((s) => (
                  <SessionRow key={s.id} session={s} />
                ))}
              </ul>
            </section>
          ) : null}

          <section className="space-y-4">
            <h2 className="font-display text-xl text-club-green">Anteriores</h2>
            {history.length === 0 && upcoming.length === 0 ? (
              <EmotionalGlass className="p-6">
                <p className="text-sm text-club-muted">
                  Aun no hay sesiones en tu historial.
                </p>
                <Link
                  to="/patient/psychologists"
                  className="mt-4 inline-flex rounded-2xl bg-club-green px-4 py-2 text-sm text-club-paper transition hover:opacity-95"
                >
                  Encontrar especialista
                </Link>
              </EmotionalGlass>
            ) : history.length === 0 ? (
              <p className="text-sm text-club-muted">
                Tus sesiones completadas apareceran aqui.
              </p>
            ) : (
              <ul className="space-y-3">
                {history.map((s, i) => (
                  <motion.li
                    key={s.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.35 }}
                  >
                    <SessionRow session={s} />
                  </motion.li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function SessionRow({
  session,
}: {
  session: {
    id: string;
    psychologistName: string;
    startsAt: string;
    endsAt: string;
    status: string;
  };
}) {
  const canOpenRoom = ["confirmed", "meeting_enabled"].includes(session.status);
  const shouldShowRequest = ["requested", "pending_payment", "paid"].includes(
    session.status,
  );

  return (
    <EmotionalGlass className="flex flex-wrap items-center justify-between gap-4 p-5">
      <div>
        <p className="font-medium text-club-ink">{session.psychologistName}</p>
        <p className="mt-1 capitalize text-sm text-club-muted">
          {formatSessionDate(session.startsAt)}
        </p>
        <p className="text-sm text-club-muted">
          {formatSessionRange(session.startsAt, session.endsAt)}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-club-green/10 px-3 py-1 text-xs text-club-green">
          {STATUS_LABELS[session.status as keyof typeof STATUS_LABELS] ??
            session.status}
        </span>
        {shouldShowRequest ? (
          <Link
            to={`/patient/requests/${session.id}`}
            className="inline-flex items-center gap-1 rounded-full bg-club-green px-3 py-1 text-xs text-club-paper transition hover:opacity-95"
          >
            <ClipboardCheck className="h-3.5 w-3.5" strokeWidth={1.5} />
            Ver solicitud
          </Link>
        ) : null}
        {canOpenRoom ? (
          <Link
            to={`/patient/session/${session.id}`}
            className="inline-flex items-center gap-1 rounded-full bg-club-green px-3 py-1 text-xs text-club-paper transition hover:opacity-95"
          >
            <Video className="h-3.5 w-3.5" strokeWidth={1.5} />
            Entrar al espacio
          </Link>
        ) : null}
      </div>
    </EmotionalGlass>
  );
}

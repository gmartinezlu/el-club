import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarPlus, ClipboardCheck, History, Trash2, Video } from "lucide-react";
import { toast } from "sonner";
import { STATUS_HELP, STATUS_LABELS } from "../../appointments/utils";
import { clearAppointmentHistory } from "../../appointments/history";
import { usePatientAppointments } from "../hooks/usePatientAppointments";
import { formatSessionDate, formatSessionRange } from "../utils/formatDate";
import { EmotionalGlass } from "../components/EmotionalGlass";
import { EmptyState } from "../../components/ui/EmptyState";
import { PageTitle } from "../../components/ui/Typography";
import { useSessionStore } from "../../store/sessionStore";

export function PatientSessionsPage() {
  const userId = useSessionStore((s) => s.user?.id);
  const { appointments, history, loading, error, reload } = usePatientAppointments();
  const [now, setNow] = useState(() => Date.now());
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const upcoming = appointments.filter(
    (a) =>
      new Date(a.startsAt).getTime() > now &&
      a.status !== "cancelled" &&
      a.status !== "completed",
  );

  async function handleClearHistory() {
    if (!userId) return;
    if (!window.confirm("¿Eliminar todas las citas completadas y canceladas del historial?")) return;
    setClearing(true);
    try {
      const count = await clearAppointmentHistory(userId);
      toast.success(`${count} cita${count !== 1 ? "s" : ""} eliminada${count !== 1 ? "s" : ""} del historial.`);
      await reload();
    } catch {
      toast.error("No se pudo limpiar el historial.");
    } finally {
      setClearing(false);
    }
  }

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <p className="text-sm font-medium text-club-green">Tu camino</p>
        <PageTitle>Sesiones</PageTitle>
        <p className="max-w-lg text-sm leading-relaxed text-club-muted">
          Tus solicitudes, citas confirmadas y accesos a Meet en un solo lugar.
        </p>
      </header>

      <div className="rounded-3xl border border-club-green/10 bg-white/50 p-4 text-sm leading-relaxed text-club-muted shadow-soft backdrop-blur">
        Coordina el pago directamente con tu psicóloga. EL CLUB no solicita
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
                  Próximas
                </h2>
                <Link
                  to="/patient/psychologists"
                  className="inline-flex items-center gap-2 rounded-full bg-club-green px-4 py-2 text-xs text-club-paper transition hover:opacity-95"
                >
                  <CalendarPlus className="h-3.5 w-3.5" strokeWidth={1.5} />
                  Agendar otra sesión
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
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-xl text-club-green">Anteriores</h2>
              {history.length > 0 ? (
                <button
                  type="button"
                  disabled={clearing}
                  onClick={() => void handleClearHistory()}
                  className="inline-flex items-center gap-1.5 rounded-full border border-red-200/80 bg-red-50/40 px-3 py-1.5 text-xs text-red-700 transition hover:bg-red-100/60 disabled:opacity-60"
                >
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                  {clearing ? "Limpiando..." : "Limpiar historial"}
                </button>
              ) : null}
            </div>
            {history.length === 0 && upcoming.length === 0 ? (
              <EmptyState
                icon={History}
                title="Aún no hay sesiones en tu historial"
                description="Cuando agendes tu primera cita, aparecerá aquí."
                action={{ label: "Encontrar psicóloga", to: "/patient/psychologists" }}
              />
            ) : history.length === 0 ? (
              <p className="text-sm text-club-muted">
                Tus sesiones completadas aparecerán aquí.
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
  const shouldShowRequest = ["requested", "pending_payment"].includes(
    session.status,
  );

  const help = STATUS_HELP[session.status as keyof typeof STATUS_HELP];

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
        {help ? <p className="mt-1 text-xs text-club-muted">{help}</p> : null}
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

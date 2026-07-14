import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  CalendarX,
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink,
  Link as LinkIcon,
  StickyNote,
  Users,
  Video,
} from "lucide-react";
import {
  updateAppointmentMeetUrl,
  updateAppointmentPsychologistNotes,
  updateAppointmentStatus,
} from "../../appointments/psychologist";
import {
  confirmPaymentReceived,
  createSignedPaymentProofUrl,
  markAppointmentPendingPayment,
} from "../../appointments/payments";
import {
  cancelGoogleCalendarEvent,
  syncGoogleCalendarEvent,
} from "../../services/supabase/googleCalendar";
import { createNotification } from "../../notifications/service";
import { EmptyState } from "../../components/ui/EmptyState";
import { useAutoSaveNotes } from "../hooks/useAutoSaveNotes";
import type {
  AppointmentStatus,
  PsychologistAppointmentView,
} from "../../appointments/types";
import { STATUS_HELP, STATUS_LABELS } from "../../appointments/utils";
import { useSessionStore } from "../../store/sessionStore";
import { getErrorMessage } from "../../utils/errors";
import { usePsychologistAppointments } from "../hooks/usePsychologistAppointments";
import { Highlight, PageTitle } from "../../components/ui/Typography";
import {
  formatSessionDate,
  formatSessionRange,
} from "../../patient/utils/formatDate";

type AgendaFilter = "today" | "upcoming" | "history" | "all";

const FILTERS: { value: AgendaFilter; label: string }[] = [
  { value: "today", label: "Hoy" },
  { value: "upcoming", label: "Próximas" },
  { value: "history", label: "Historial" },
  { value: "all", label: "Todas" },
];

const ACTIVE_STATUSES: AppointmentStatus[] = ["confirmed", "meeting_enabled"];

function isSameDay(a: Date, b: Date) {
  return (
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()
  );
}

function isActionable(status: AppointmentStatus) {
  return !["cancelled", "completed", "rejected"].includes(status);
}

export function PsychologistDashboardPage() {
  const psychologistId = useSessionStore((s) => s.user?.id);
  const { next, appointments, patients, loading, error, reload } =
    usePsychologistAppointments();
  const [filter, setFilter] = useState<AgendaFilter>("today");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 15000); // Refresh every 15s to keep "hoy"/"próximas" al día
    return () => clearInterval(timer);
  }, []);

  const todayCount = useMemo(
    () =>
      appointments.filter(
        (a) => isSameDay(new Date(a.startsAt), now) && a.status !== "cancelled",
      ).length,
    [appointments, now],
  );

  const readyForMeet = appointments.filter(
    (a) => ACTIVE_STATUSES.includes(a.status) && a.googleMeetUrl,
  ).length;

  const filteredAppointments = useMemo(() => {
    const nowTime = now.getTime();
    return appointments.filter((appointment) => {
      const startsAt = new Date(appointment.startsAt);
      const isPast =
        startsAt.getTime() <= nowTime ||
        appointment.status === "completed" ||
        appointment.status === "cancelled";

      if (filter === "today") {
        return isSameDay(startsAt, now) && appointment.status !== "cancelled";
      }
      if (filter === "upcoming") {
        return !isPast && appointment.status !== "cancelled";
      }
      if (filter === "history") {
        return isPast;
      }
      return true;
    });
  }, [appointments, filter, now]);

  const selectedAppointment =
    appointments.find((a) => a.id === selectedId) ?? next ?? appointments[0] ?? null;

  async function saveMeet(appointmentId: string, url: string) {
    if (!psychologistId) return;
    const normalizedUrl = url.trim();
    setSavingId(appointmentId);
    setActionError(null);
    try {
      if (normalizedUrl) {
        const appointment = appointments.find((item) => item.id === appointmentId);
        if (appointment?.status === "confirmed" || appointment?.status === "meeting_enabled") {
          await updateAppointmentStatus(appointmentId, psychologistId, "meeting_enabled", {
            googleMeetUrl: normalizedUrl,
          });
        } else {
          await updateAppointmentMeetUrl(appointmentId, psychologistId, normalizedUrl);
        }
        if (appointment) {
          await createNotification({
            userId: appointment.patientId,
            title: "Meet habilitado",
            body: "Tu enlace de videollamada ya está preparado dentro de El Club.",
          });
        }
      } else {
        await updateAppointmentMeetUrl(appointmentId, psychologistId, null);
      }
      await reload();
    } catch (e) {
      setActionError(getErrorMessage(e, "No se pudo habilitar el enlace de Meet"));
    } finally {
      setSavingId(null);
    }
  }

  async function changeStatus(appointmentId: string, status: AppointmentStatus) {
    if (!psychologistId) return;
    setSavingId(appointmentId);
    setActionError(null);
    try {
      if (status === "pending_payment") {
        await markAppointmentPendingPayment(appointmentId);
      } else if (status === "confirmed") {
        const appointment = appointments.find((item) => item.id === appointmentId);
        if (appointment?.status === "pending_payment") {
          await confirmPaymentReceived(appointmentId);
        } else {
          await updateAppointmentStatus(appointmentId, psychologistId, status);
        }
      } else {
        await updateAppointmentStatus(appointmentId, psychologistId, status);
      }

      const appointment = appointments.find((item) => item.id === appointmentId);
      if (appointment) {
        await createNotification({
          userId: appointment.patientId,
          title: "Actualización de tu cita",
          body: `Tu cita ahora está ${STATUS_LABELS[status].toLowerCase()}.`,
        });
      }

      // Best-effort: la cita ya cambió de estado en la base, así que un
      // fallo en Google no debe impedir que la psicóloga vea el cambio
      // reflejado (queda el respaldo manual de pegar el link de Meet).
      if (status === "confirmed") {
        await syncGoogleCalendarEvent(appointmentId).catch((e) => {
          setActionError(
            getErrorMessage(e, "No se pudo crear el evento en Google Calendar"),
          );
        });
      } else if (status === "cancelled" || status === "rejected") {
        await cancelGoogleCalendarEvent(appointmentId).catch(() => {
          // Silencioso: cancelar/rechazar ya tuvo éxito en EL CLUB, y el
          // evento de Google (si existe) puede limpiarse manualmente.
        });
      }

      await reload();
    } catch (e) {
      setActionError(getErrorMessage(e, "No se pudo actualizar la cita"));
    } finally {
      setSavingId(null);
    }
  }

  async function saveNotes(appointmentId: string, notes: string) {
    if (!psychologistId) return;
    setSavingId(appointmentId);
    setActionError(null);
    try {
      await updateAppointmentPsychologistNotes(
        appointmentId,
        psychologistId,
        notes.trim() || null,
      );
      await reload();
    } catch (e) {
      setActionError(getErrorMessage(e, "No se pudieron guardar las notas"));
    } finally {
      setSavingId(null);
    }
  }

  async function markCompleted(appointmentId: string) {
    if (!psychologistId) return;
    setSavingId(appointmentId);
    setActionError(null);
    try {
      await updateAppointmentStatus(appointmentId, psychologistId, "completed");
      await reload();
    } catch (e) {
      setActionError(getErrorMessage(e, "No se pudo completar la cita"));
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-sm font-medium text-club-green">Agenda</p>
        <PageTitle>
          Tu día, con <Highlight>claridad</Highlight>
        </PageTitle>
        <p className="max-w-2xl text-sm leading-relaxed text-club-muted">
          Citas, notas privadas y acceso a Meet en una sola vista de trabajo.
        </p>
      </header>

      {error || actionError ? (
        <p className="rounded-2xl border border-red-200/80 bg-red-50/40 px-4 py-3 text-sm text-red-800">
          {error ?? actionError}
        </p>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-3">
        <StatCard icon={Calendar} label="Citas hoy" value={loading ? "-" : String(todayCount)} />
        <StatCard icon={Users} label="Personas activas" value={loading ? "-" : String(patients.length)} />
        <StatCard icon={Video} label="Meet listos" value={loading ? "-" : String(readyForMeet)} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr),minmax(340px,0.9fr)]">
        <section className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setFilter(item.value)}
                className={[
                  "rounded-2xl border px-4 py-2 text-sm transition",
                  filter === item.value
                    ? "border-club-green/20 bg-club-green/10 text-club-green"
                    : "border-club-green/10 bg-white/50 text-club-muted hover:bg-white/70",
                ].join(" ")}
              >
                {item.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="h-64 animate-pulse rounded-3xl bg-club-green/5" />
          ) : filteredAppointments.length === 0 ? (
            <EmptyState
              icon={CalendarX}
              title="No hay citas para este filtro"
              description="Prueba otro filtro o espera nuevas solicitudes de agenda."
            />
          ) : (
            <ul className="space-y-3">
              {filteredAppointments.map((appointment, index) => (
                <AgendaItem
                  key={appointment.id}
                  appointment={appointment}
                  index={index}
                  selected={selectedAppointment?.id === appointment.id}
                  onSelect={() => setSelectedId(appointment.id)}
                />
              ))}
            </ul>
          )}
        </section>

        <section className="lg:sticky lg:top-24 lg:self-start">
          {selectedAppointment ? (
            <AppointmentWorkspace
              key={selectedAppointment.id}
              appointment={selectedAppointment}
              saving={savingId === selectedAppointment.id}
              onSaveMeet={saveMeet}
              onSaveNotes={saveNotes}
              onChangeStatus={changeStatus}
              onMarkCompleted={markCompleted}
            />
          ) : (
            <div className="rounded-3xl border border-club-green/10 bg-white/50 p-6 shadow-soft backdrop-blur">
              <p className="text-sm text-club-muted">
                Selecciona una cita para preparar la sesión.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Calendar;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl border border-club-green/10 bg-white/50 p-5 backdrop-blur">
      <Icon className="h-5 w-5 text-club-green/80" strokeWidth={1.5} />
      <p className="mt-4 text-xs text-club-muted">{label}</p>
      <p className="font-display text-3xl text-club-green">{value}</p>
    </div>
  );
}

function AgendaItem({
  appointment,
  index,
  selected,
  onSelect,
}: {
  appointment: PsychologistAppointmentView;
  index: number;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <motion.li
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      <button
        type="button"
        onClick={onSelect}
        className={[
          "w-full rounded-3xl border p-5 text-left shadow-soft backdrop-blur transition",
          selected
            ? "border-club-green/25 bg-club-green/10"
            : "border-club-green/10 bg-white/50 hover:bg-white/55",
        ].join(" ")}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-display text-xl text-club-green">
              {appointment.patientName}
            </p>
            <p className="mt-1 capitalize text-sm text-club-muted">
              {formatSessionDate(appointment.startsAt)}
            </p>
            <p className="text-sm text-club-muted">
              {formatSessionRange(appointment.startsAt, appointment.endsAt)}
            </p>
          </div>
          <span className="rounded-full bg-white/60 px-3 py-1 text-xs text-club-green">
            {STATUS_LABELS[appointment.status]}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/55 px-3 py-1 text-club-muted">
            <LinkIcon className="h-3.5 w-3.5" strokeWidth={1.5} />
            {appointment.googleMeetUrl ? "Meet listo" : "Sin Meet"}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/55 px-3 py-1 text-club-muted">
            <StickyNote className="h-3.5 w-3.5" strokeWidth={1.5} />
            {appointment.psychologistNotes ? "Notas guardadas" : "Sin notas"}
          </span>
        </div>
      </button>
    </motion.li>
  );
}

function AppointmentWorkspace({
  appointment,
  saving,
  onSaveMeet,
  onSaveNotes,
  onChangeStatus,
  onMarkCompleted,
}: {
  appointment: PsychologistAppointmentView;
  saving: boolean;
  onSaveMeet: (appointmentId: string, url: string) => Promise<void>;
  onSaveNotes: (appointmentId: string, notes: string) => Promise<void>;
  onChangeStatus: (
    appointmentId: string,
    status: AppointmentStatus,
  ) => Promise<void>;
  onMarkCompleted: (appointmentId: string) => Promise<void>;
}) {
  const [meetUrl, setMeetUrl] = useState(appointment.googleMeetUrl ?? "");
  const { notes, setNotes, saving: autoSaving, hasUnsavedChanges } = useAutoSaveNotes(
    appointment.psychologistNotes ?? "",
    (updatedNotes) => onSaveNotes(appointment.id, updatedNotes),
    2000, // 2 second debounce
  );

  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [proofError, setProofError] = useState<string | null>(null);

  const paymentProofUrl = appointment.paymentProofUrl;

  useEffect(() => {
    if (!paymentProofUrl) return;
    let active = true;
    createSignedPaymentProofUrl(paymentProofUrl)
      .then((url) => {
        if (active) setProofUrl(url);
      })
      .catch((e) => {
        if (active) setProofError(getErrorMessage(e, "No se pudo cargar el comprobante"));
      });
    return () => {
      active = false;
    };
  }, [paymentProofUrl]);

  const canComplete = isActionable(appointment.status);
  const canSetPendingPayment = appointment.status === "requested";
  const canConfirm = appointment.status === "pending_payment";
  const canReject = appointment.status === "requested";
  const canCancel = isActionable(appointment.status);

  return (
    <div className="rounded-3xl border border-club-green/10 bg-white/50 p-6 shadow-soft backdrop-blur">
      <p className="text-xs font-medium uppercase tracking-wider text-club-muted">
        Preparación de sesión
      </p>
      <h2 className="mt-2 font-display text-3xl text-club-green">
        {appointment.patientName}
      </h2>
      <p className="mt-1 capitalize text-sm text-club-muted">
        {formatSessionDate(appointment.startsAt)} ·{" "}
        {formatSessionRange(appointment.startsAt, appointment.endsAt)}
      </p>

      <div className="mt-6 space-y-6">
        <div className="rounded-2xl border border-club-green/10 bg-club-green/5 p-5">
          <p className="text-xs text-club-muted">Estado actual</p>
          <p className="mt-1 font-display text-2xl text-club-green">
            {STATUS_LABELS[appointment.status]}
          </p>
          <p className="mt-1 text-sm text-club-muted">
            {STATUS_HELP[appointment.status]}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-club-muted">
            El pago se coordina directamente entre tú y la persona. EL CLUB no
            procesa dinero de sesiones.
          </p>
        </div>

        {appointment.status === "pending_payment" ? (
          <div className="rounded-2xl border border-club-green/10 bg-white/50 p-5">
            <p className="text-sm text-club-green">Comprobante de pago</p>
            {proofError ? (
              <p className="mt-2 text-xs text-red-800">{proofError}</p>
            ) : appointment.paymentMarkedPaidAt ? (
              proofUrl ? (
                <a
                  href={proofUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-2 text-sm text-club-green underline"
                >
                  Ver comprobante
                  <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.5} />
                </a>
              ) : (
                <p className="mt-2 text-sm text-club-muted">
                  La persona marcó que ya pagó, sin adjuntar comprobante.
                </p>
              )
            ) : (
              <p className="mt-2 text-sm text-club-muted">
                Aún no ha marcado el pago como realizado.
              </p>
            )}
          </div>
        ) : null}

        <div className="space-y-3">
          <p className="text-sm text-club-green">Gestión de la cita</p>
          <div className="flex flex-wrap gap-2">
            {canSetPendingPayment ? (
              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  void onChangeStatus(appointment.id, "pending_payment")
                }
                className="inline-flex items-center gap-2 rounded-2xl border border-club-green/15 bg-white/55 px-4 py-2 text-sm text-club-green transition hover:bg-white/80 disabled:opacity-60"
              >
                <Clock className="h-4 w-4" strokeWidth={1.5} />
                Marcar pendiente de pago
              </button>
            ) : null}
            {canConfirm ? (
              <button
                type="button"
                disabled={saving}
                onClick={() => void onChangeStatus(appointment.id, "confirmed")}
                className="inline-flex items-center gap-2 rounded-2xl bg-club-green px-4 py-2 text-sm text-club-paper transition hover:opacity-95 disabled:opacity-60"
              >
                <CheckCircle2 className="h-4 w-4" strokeWidth={1.5} />
                Confirmar pago recibido
              </button>
            ) : null}
            {canReject ? (
              <button
                type="button"
                disabled={saving}
                onClick={() => void onChangeStatus(appointment.id, "rejected")}
                className="inline-flex items-center gap-2 rounded-2xl border border-club-green/15 bg-white/55 px-4 py-2 text-sm text-club-muted transition hover:bg-white/80 disabled:opacity-60"
              >
                <XCircle className="h-4 w-4" strokeWidth={1.5} />
                Rechazar
              </button>
            ) : null}
            {canCancel ? (
              <button
                type="button"
                disabled={saving}
                onClick={() => {
                  if (window.confirm("¿Seguro que quieres cancelar esta cita? Esta acción no se puede deshacer.")) {
                    void onChangeStatus(appointment.id, "cancelled");
                  }
                }}
                className="inline-flex items-center gap-2 rounded-2xl border border-red-200/80 bg-red-50/60 px-4 py-2 text-sm text-red-800 transition hover:bg-red-50 disabled:opacity-60"
              >
                <XCircle className="h-4 w-4" strokeWidth={1.5} />
                Cancelar cita
              </button>
            ) : null}
          </div>
        </div>

        <div className="space-y-2">
          <label
            className="flex items-center gap-2 text-sm text-club-green"
            htmlFor="meetUrl"
          >
            <Video className="h-4 w-4" strokeWidth={1.5} />
            Enlace de Google Meet
          </label>
          <input
            id="meetUrl"
            value={meetUrl}
            onChange={(e) => setMeetUrl(e.target.value)}
            placeholder="https://meet.google.com/..."
            className="w-full rounded-2xl border border-club-green/10 bg-white/60 px-4 py-3 text-sm text-club-ink outline-none ring-club-green/10 focus:ring-2"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => void onSaveMeet(appointment.id, meetUrl)}
              className="rounded-2xl bg-club-green px-4 py-2 text-sm text-club-paper transition hover:opacity-95 disabled:opacity-60"
            >
              {saving ? "Guardando..." : "Guardar y habilitar Meet"}
            </button>
            {appointment.googleMeetUrl ? (
              <a
                href={appointment.googleMeetUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-2xl border border-club-green/15 bg-white/55 px-4 py-2 text-sm text-club-green transition hover:bg-white/80"
              >
                Abrir Meet
                <ExternalLink className="h-4 w-4" strokeWidth={1.5} />
              </a>
            ) : null}
          </div>
        </div>

        <div className="space-y-2">
          <label
            className="flex items-center gap-2 text-sm text-club-green"
            htmlFor="sessionNotes"
          >
            <StickyNote className="h-4 w-4" strokeWidth={1.5} />
            Notas privadas
          </label>
          <textarea
            id="sessionNotes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-24 w-full rounded-2xl border border-club-green/10 bg-white/60 px-4 py-3 text-sm text-club-ink outline-none ring-club-green/10 focus:ring-2"
          />
          <div className="flex items-center justify-between">
            <button
              type="button"
              disabled={saving || autoSaving}
              onClick={() => void onSaveNotes(appointment.id, notes)}
              className="rounded-2xl bg-club-green px-4 py-2 text-sm text-club-paper transition hover:opacity-95 disabled:opacity-60"
            >
              {autoSaving ? "Guardando..." : "Guardar notas"}
            </button>
            {hasUnsavedChanges && !autoSaving ? (
              <p className="text-xs text-amber-700">Guardando automáticamente...</p>
            ) : null}
          </div>
        </div>

        {canComplete ? (
          <button
            type="button"
            disabled={saving}
            onClick={() => void onMarkCompleted(appointment.id)}
            className="inline-flex items-center gap-2 rounded-2xl border border-club-green/15 bg-white/55 px-4 py-2 text-sm text-club-green transition hover:bg-white/80 disabled:opacity-60"
          >
            <CheckCircle2 className="h-4 w-4" strokeWidth={1.5} />
            Marcar completada
          </button>
        ) : null}
      </div>
    </div>
  );
}

import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CalendarClock,
  CalendarX,
  ExternalLink,
  FileText,
  StickyNote,
  Video,
} from "lucide-react";
import type { PsychologistAppointmentView } from "../../appointments/types";
import { STATUS_LABELS } from "../../appointments/utils";
import {
  formatSessionDate,
  formatSessionRange,
} from "../../patient/utils/formatDate";
import { usePsychologistAppointments } from "../hooks/usePsychologistAppointments";
import { EmptyState } from "../../components/ui/EmptyState";
import { PageTitle } from "../../components/ui/Typography";

export function PsychologistPatientsPage() {
  const { patientId } = useParams<{ patientId?: string }>();
  const { patients, appointments, loading, error } = usePsychologistAppointments();

  const selectedPatient = useMemo(
    () => patients.find((patient) => patient.patientId === patientId) ?? null,
    [patientId, patients],
  );

  const patientAppointments = useMemo(
    () =>
      appointments
        .filter((appointment) => appointment.patientId === patientId)
        .sort(
          (a, b) =>
            new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime(),
        ),
    [appointments, patientId],
  );

  if (patientId) {
    return (
      <PatientDetail
        loading={loading}
        error={error}
        patientName={selectedPatient?.fullName ?? "Persona"}
        appointments={patientAppointments}
      />
    );
  }

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <p className="text-sm font-medium text-club-green">Relaciones</p>
        <PageTitle>Personas</PageTitle>
        <p className="max-w-lg text-sm leading-relaxed text-club-muted">
          Personas con las que has compartido sesión en El Club.
        </p>
      </header>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      {loading ? (
        <div className="h-32 animate-pulse rounded-3xl bg-club-green/5" />
      ) : patients.length === 0 ? (
        <div className="rounded-3xl border border-club-green/10 bg-white/50 p-6">
          <p className="text-sm text-club-muted">
            Cuando tengas citas, las personas aparecerán aquí.
          </p>
        </div>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {patients.map((p, i) => (
            <motion.li
              key={p.patientId}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Link
                to={`/psychologist/patients/${p.patientId}`}
                className="block rounded-3xl border border-club-green/10 bg-white/50 px-5 py-4 shadow-soft backdrop-blur transition hover:bg-white/55"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {p.avatarUrl ? (
                      <img
                        src={p.avatarUrl}
                        alt=""
                        className="h-11 w-11 rounded-2xl object-cover"
                      />
                    ) : (
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-club-green/10 text-club-green">
                        <FileText className="h-5 w-5" strokeWidth={1.5} />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-club-ink">{p.fullName}</p>
                      <p className="text-xs text-club-muted">
                        {p.sessionsCount} sesión
                        {p.sessionsCount !== 1 ? "es" : ""}
                      </p>
                    </div>
                  </div>
                  {p.nextSessionAt ? (
                    <p className="text-sm text-club-green">
                      Próxima: {formatSessionDate(p.nextSessionAt)}
                    </p>
                  ) : (
                    <p className="text-sm text-club-muted">
                      Sin cita próxima
                    </p>
                  )}
                </div>
              </Link>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PatientDetail({
  loading,
  error,
  patientName,
  appointments,
}: {
  loading: boolean;
  error: string | null;
  patientName: string;
  appointments: PsychologistAppointmentView[];
}) {
  const [now] = useState(() => Date.now());
  const nextAppointment =
    appointments
      .filter(
        (appointment) =>
          new Date(appointment.startsAt).getTime() > now &&
          appointment.status !== "cancelled" &&
          appointment.status !== "completed",
      )
      .sort(
        (a, b) =>
          new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
      )[0] ?? null;
  const notesCount = appointments.filter((item) =>
    item.psychologistNotes?.trim(),
  ).length;

  return (
    <div className="space-y-8">
      <Link
        to="/psychologist/patients"
        className="inline-flex items-center gap-2 text-sm text-club-muted transition hover:text-club-green"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
        Volver a personas
      </Link>

      <header className="space-y-2">
        <p className="text-sm font-medium text-club-green">Acompañamiento</p>
        <PageTitle>{patientName}</PageTitle>
        <p className="max-w-2xl text-sm leading-relaxed text-club-muted">
          Historial de encuentros, notas privadas y preparación de próximas
          sesiones.
        </p>
      </header>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      {loading ? (
        <div className="h-64 animate-pulse rounded-3xl bg-club-green/5" />
      ) : appointments.length === 0 ? (
        <EmptyState
          icon={CalendarX}
          title="No encontramos sesiones para esta persona"
          description="Cuando agenden un encuentro, aparecerá aquí."
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
          <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            <SummaryCard
              icon={<CalendarClock className="h-5 w-5" strokeWidth={1.5} />}
              label="Próxima sesión"
              value={
                nextAppointment
                  ? formatSessionDate(nextAppointment.startsAt)
                  : "Sin cita próxima"
              }
              detail={
                nextAppointment
                  ? formatSessionRange(
                      nextAppointment.startsAt,
                      nextAppointment.endsAt,
                    )
                  : "Agenda un nuevo espacio cuando lo necesites."
              }
            />
            <SummaryCard
              icon={<StickyNote className="h-5 w-5" strokeWidth={1.5} />}
              label="Notas guardadas"
              value={String(notesCount)}
              detail="Notas privadas visibles solo para tu espacio profesional."
            />
          </aside>

          <section className="space-y-4">
            {appointments.map((appointment, index) => (
              <SessionHistoryCard
                key={appointment.id}
                appointment={appointment}
                index={index}
              />
            ))}
          </section>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-3xl border border-club-green/10 bg-white/50 p-5 shadow-soft backdrop-blur">
      <div className="flex items-center gap-2 text-club-green">
        {icon}
        <p className="text-xs text-club-muted">{label}</p>
      </div>
      <p className="mt-3 font-display text-3xl text-club-green">{value}</p>
      <p className="mt-1 text-sm text-club-muted">{detail}</p>
    </div>
  );
}

function SessionHistoryCard({
  appointment,
  index,
}: {
  appointment: PsychologistAppointmentView;
  index: number;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="rounded-3xl border border-club-green/10 bg-white/50 p-5 shadow-soft backdrop-blur"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="capitalize text-sm text-club-muted">
            {formatSessionDate(appointment.startsAt)}
          </p>
          <p className="font-display text-xl text-club-green">
            {formatSessionRange(appointment.startsAt, appointment.endsAt)}
          </p>
        </div>
        <span className="rounded-full bg-club-green/10 px-3 py-1 text-xs text-club-green">
          {STATUS_LABELS[appointment.status]}
        </span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-club-green/10 bg-white/50 p-4">
          <div className="flex items-center gap-2 text-sm text-club-green">
            <Video className="h-4 w-4" strokeWidth={1.5} />
            Meet
          </div>
          {appointment.googleMeetUrl ? (
            <a
              href={appointment.googleMeetUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-2 text-sm text-club-green hover:underline"
            >
              Abrir enlace
              <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.5} />
            </a>
          ) : (
            <p className="mt-2 text-sm text-club-muted">
              Aún no hay enlace asociado.
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-club-green/10 bg-white/50 p-4">
          <div className="flex items-center gap-2 text-sm text-club-green">
            <StickyNote className="h-4 w-4" strokeWidth={1.5} />
            Nota privada
          </div>
          <p className="mt-2 text-sm leading-relaxed text-club-muted">
            {appointment.psychologistNotes?.trim() ||
              "Sin notas guardadas para esta sesión."}
          </p>
        </div>
      </div>
    </motion.article>
  );
}

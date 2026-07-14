import { useMemo, useState } from "react";
import { Search, StickyNote } from "lucide-react";
import { updateAppointmentPsychologistNotes } from "../../appointments/psychologist";
import { useAutoSaveNotes } from "../hooks/useAutoSaveNotes";
import type { PsychologistAppointmentView } from "../../appointments/types";
import { STATUS_LABELS } from "../../appointments/utils";
import {
  formatSessionDate,
  formatSessionRange,
} from "../../patient/utils/formatDate";
import { useSessionStore } from "../../store/sessionStore";
import { getErrorMessage } from "../../utils/errors";
import { usePsychologistAppointments } from "../hooks/usePsychologistAppointments";
import { PageTitle } from "../../components/ui/Typography";

export function PsychologistNotesPage() {
  const psychologistId = useSessionStore((s) => s.user?.id);
  const { appointments, loading, error, reload } = usePsychologistAppointments();
  const [query, setQuery] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return appointments
      .filter((appointment) => {
        if (!normalized) return true;
        return (
          appointment.patientName.toLowerCase().includes(normalized) ||
          appointment.psychologistNotes?.toLowerCase().includes(normalized)
        );
      })
      .sort(
        (a, b) =>
          new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime(),
      );
  }, [appointments, query]);

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

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-sm font-medium text-club-green">Seguimiento</p>
        <PageTitle>Notas</PageTitle>
        <p className="max-w-2xl text-sm leading-relaxed text-club-muted">
          Observaciones privadas por sesión, ordenadas para preparar el próximo encuentro.
        </p>
      </header>

      {error || actionError ? (
        <p className="rounded-2xl border border-red-200/80 bg-red-50/40 px-4 py-3 text-sm text-red-800">
          {error ?? actionError}
        </p>
      ) : null}

      <label className="flex max-w-xl items-center gap-3 rounded-3xl border border-club-green/10 bg-white/50 px-4 py-3 shadow-soft backdrop-blur">
        <Search className="h-4 w-4 text-club-green" strokeWidth={1.5} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar persona o contenido de nota"
          className="w-full bg-transparent text-sm text-club-ink outline-none placeholder:text-club-muted"
        />
      </label>

      {loading ? (
        <div className="h-52 animate-pulse rounded-3xl bg-club-green/5" />
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-club-green/10 bg-white/50 p-6">
          <p className="text-sm text-club-muted">
            No hay sesiones que coincidan con la búsqueda.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((appointment) => (
            <NoteCard
              key={appointment.id}
              appointment={appointment}
              saving={savingId === appointment.id}
              onSave={saveNotes}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function NoteCard({
  appointment,
  saving,
  onSave,
}: {
  appointment: PsychologistAppointmentView;
  saving: boolean;
  onSave: (appointmentId: string, notes: string) => Promise<void>;
}) {
  const { notes, setNotes, saving: autoSaving, hasUnsavedChanges } = useAutoSaveNotes(
    appointment.psychologistNotes ?? "",
    (updatedNotes) => onSave(appointment.id, updatedNotes),
    2000, // 2 second debounce
  );

  return (
    <article className="rounded-3xl border border-club-green/10 bg-white/50 p-5 shadow-soft backdrop-blur">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-display text-2xl text-club-green">
            {appointment.patientName}
          </p>
          <p className="mt-1 capitalize text-sm text-club-muted">
            {formatSessionDate(appointment.startsAt)} ·{" "}
            {formatSessionRange(appointment.startsAt, appointment.endsAt)}
          </p>
        </div>
        <span className="rounded-full bg-club-green/10 px-3 py-1 text-xs text-club-green">
          {STATUS_LABELS[appointment.status]}
        </span>
      </div>

      <label className="mt-5 flex items-center gap-2 text-sm text-club-green">
        <StickyNote className="h-4 w-4" strokeWidth={1.5} />
        Nota privada
      </label>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={5}
        placeholder="Avances, hipótesis, tareas acordadas, próximos temas..."
        className="mt-2 w-full resize-none rounded-2xl border border-club-green/10 bg-white/60 px-4 py-3 text-sm leading-relaxed text-club-ink outline-none ring-club-green/10 focus:ring-2"
      />
      <div className="mt-3 flex items-center justify-between gap-2">
        <button
          type="button"
          disabled={saving || autoSaving}
          onClick={() => void onSave(appointment.id, notes)}
          className="rounded-2xl bg-club-green px-4 py-2 text-sm text-club-paper transition hover:opacity-95 disabled:opacity-60"
        >
          {autoSaving ? "Guardando..." : "Guardar nota"}
        </button>
        {hasUnsavedChanges && !autoSaving ? (
          <p className="text-xs text-amber-700">Guardando automáticamente...</p>
        ) : null}
      </div>
    </article>
  );
}

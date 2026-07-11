import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, Clock } from "lucide-react";
import { toast } from "sonner";
import {
  createAvailabilitySlots,
  deleteAvailabilitySlots,
  fetchPsychologistAvailability,
  type AvailabilitySlot,
} from "../../appointments/availability";
import { fetchBusyStartTimes } from "../../appointments/psychologist";
import { useSessionStore } from "../../store/sessionStore";
import { getErrorMessage } from "../../utils/errors";
import { WeekAvailabilityGrid } from "../components/WeekAvailabilityGrid";
import { addDays, getMonday, slotKey } from "../utils/weekGrid";

function DurationSelect({
  duration,
  onChange,
}: {
  duration: number;
  onChange: (duration: number) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-club-muted">
      Duración de sesión
      <select
        value={duration}
        onChange={(e) => onChange(Number(e.target.value))}
        className="rounded-2xl border border-club-green/10 bg-white/60 px-3 py-2 text-sm text-club-ink outline-none ring-club-green/10 focus:ring-2"
      >
        <option value={50}>50 min</option>
        <option value={60}>60 min</option>
        <option value={75}>75 min</option>
      </select>
    </label>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl border border-club-green/10 bg-white/50 p-4 shadow-soft backdrop-blur">
      <Icon className="h-5 w-5 text-club-green" strokeWidth={1.5} />
      <p className="mt-3 text-xs text-club-muted">{label}</p>
      <p className="font-display text-3xl text-club-green">{value}</p>
    </div>
  );
}

export function PsychologistAvailabilityPage() {
  const psychologistId = useSessionStore((s) => s.user?.id);
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const [duration, setDuration] = useState(50);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [busyStartTimes, setBusyStartTimes] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const slotsByKey = useMemo(() => {
    const map = new Map<string, AvailabilitySlot>();
    for (const slot of slots) {
      map.set(new Date(slot.startsAt).toISOString(), slot);
    }
    return map;
  }, [slots]);

  const weekEnd = useMemo(() => addDays(weekStart, 7), [weekStart]);

  const thisWeekCount = useMemo(() => {
    const start = weekStart.getTime();
    const end = weekEnd.getTime();
    return slots.filter((slot) => {
      const t = new Date(slot.startsAt).getTime();
      return t >= start && t < end;
    }).length;
  }, [slots, weekStart, weekEnd]);

  const loadWeek = useCallback(async () => {
    if (!psychologistId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [availability, busy] = await Promise.all([
        fetchPsychologistAvailability(psychologistId),
        fetchBusyStartTimes(
          psychologistId,
          weekStart.toISOString(),
          weekEnd.toISOString(),
        ),
      ]);
      setSlots(availability);
      setBusyStartTimes(busy);
    } catch (e) {
      setError(getErrorMessage(e, "No se pudo cargar tu disponibilidad"));
    } finally {
      setLoading(false);
    }
  }, [psychologistId, weekStart, weekEnd]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadWeek();
    });
  }, [loadWeek]);

  async function handleCommitSelection(
    cells: { date: Date; slotIndex: number; key: string }[],
    mode: "add" | "remove",
  ) {
    if (!psychologistId) return;
    setSaving(true);
    setError(null);
    try {
      if (mode === "add") {
        await createAvailabilitySlots({
          psychologistId,
          slots: cells.map((cell) => {
            const startsAt = new Date(cell.key);
            const endsAt = new Date(startsAt.getTime() + duration * 60 * 1000);
            return { startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString() };
          }),
        });
        toast.success(`${cells.length} horario${cells.length !== 1 ? "s" : ""} publicado${cells.length !== 1 ? "s" : ""}.`);
      } else {
        const idsToRemove = cells
          .map((cell) => slotsByKey.get(slotKey(cell.date, cell.slotIndex))?.id)
          .filter((id): id is string => Boolean(id));
        await deleteAvailabilitySlots({ slotIds: idsToRemove, psychologistId });
        toast.success(`${idsToRemove.length} horario${idsToRemove.length !== 1 ? "s" : ""} eliminado${idsToRemove.length !== 1 ? "s" : ""}.`);
      }
      await loadWeek();
    } catch (e) {
      setError(getErrorMessage(e, "No se pudo actualizar la disponibilidad"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <header className="grid gap-5 lg:grid-cols-[1fr,360px] lg:items-end">
        <div className="space-y-2">
          <p className="text-sm font-medium text-club-green">Agenda</p>
          <h1 className="font-display text-4xl text-club-green">
            Disponibilidad
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-club-muted">
            Haz clic y arrastra sobre la cuadrícula para publicar horarios.
            Vuelve a hacer clic sobre uno publicado para quitarlo.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <SummaryCard icon={CalendarDays} label="Esta semana" value={String(thisWeekCount)} />
          <SummaryCard icon={Clock} label="Publicados" value={String(slots.length)} />
        </div>
      </header>

      {error ? (
        <p className="rounded-2xl border border-red-200/80 bg-red-50/40 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      <section className="rounded-3xl border border-club-green/10 bg-white/50 p-5 shadow-soft backdrop-blur">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <DurationSelect duration={duration} onChange={setDuration} />
          {saving ? <p className="text-sm text-club-muted">Guardando...</p> : null}
        </div>

        {loading ? (
          <div className="h-96 animate-pulse rounded-3xl bg-club-green/5" />
        ) : (
          <WeekAvailabilityGrid
            weekStart={weekStart}
            slotsByKey={slotsByKey}
            busyStartTimes={busyStartTimes}
            disabled={saving}
            onWeekChange={setWeekStart}
            onCommitSelection={handleCommitSelection}
          />
        )}
      </section>
    </div>
  );
}


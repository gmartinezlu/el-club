import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, CalendarPlus, Clock, Sparkles, Trash2 } from "lucide-react";
import {
  createAvailabilitySlot,
  deleteAvailabilitySlot,
  fetchPsychologistAvailability,
  type AvailabilitySlot,
} from "../../appointments/availability";
import {
  formatSessionDate,
  formatSessionRange,
} from "../../patient/utils/formatDate";
import { useSessionStore } from "../../store/sessionStore";
import { getErrorMessage } from "../../utils/errors";

const WEEK_DAYS = [
  { value: 1, label: "Lun" },
  { value: 2, label: "Mar" },
  { value: 3, label: "Mié" },
  { value: 4, label: "Jue" },
  { value: 5, label: "Vie" },
  { value: 6, label: "Sáb" },
];

function toDatetimeLocalValue(date: Date): string {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

function defaultStartValue(): string {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(9, 0, 0, 0);
  return toDatetimeLocalValue(date);
}

function nextDateForWeekday(weekday: number, weekOffset: number) {
  const date = new Date();
  const current = date.getDay();
  const daysUntil = (weekday - current + 7) % 7 || 7;
  date.setDate(date.getDate() + daysUntil + weekOffset * 7);
  return date;
}

function withTime(date: Date, time: string, duration: number) {
  const [hours, minutes] = time.split(":").map(Number);
  const startsAt = new Date(date);
  startsAt.setHours(hours, minutes, 0, 0);
  const endsAt = new Date(startsAt);
  endsAt.setMinutes(startsAt.getMinutes() + duration);
  return { startsAt, endsAt };
}

function groupSlotsByDate(slots: AvailabilitySlot[]) {
  return slots.reduce<Array<{ key: string; label: string; slots: AvailabilitySlot[] }>>(
    (groups, slot) => {
      const date = new Date(slot.startsAt);
      const key = date.toISOString().slice(0, 10);
      const existing = groups.find((group) => group.key === key);

      if (existing) {
        existing.slots.push(slot);
      } else {
        groups.push({
          key,
          label: formatSessionDate(slot.startsAt),
          slots: [slot],
        });
      }

      return groups;
    },
    [],
  );
}

export function PsychologistAvailabilityPage() {
  const psychologistId = useSessionStore((s) => s.user?.id);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [startValue, setStartValue] = useState(() => defaultStartValue());
  const [duration, setDuration] = useState(50);
  const [selectedDays, setSelectedDays] = useState<number[]>([2, 4]);
  const [quickTimes, setQuickTimes] = useState("09:00, 10:00, 16:00");
  const [quickWeeks, setQuickWeeks] = useState(2);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [now] = useState(() => Date.now());

  const preview = useMemo(() => {
    const startsAt = new Date(startValue);
    const endsAt = new Date(startsAt);
    endsAt.setMinutes(startsAt.getMinutes() + duration);
    return {
      startsAt,
      endsAt,
      valid: !Number.isNaN(startsAt.getTime()) && duration > 0,
    };
  }, [duration, startValue]);

  const groupedSlots = useMemo(() => groupSlotsByDate(slots), [slots]);
  const weekSlots = useMemo(() => {
    const end = now + 7 * 24 * 60 * 60 * 1000;
    return slots.filter((slot) => {
      const startsAt = new Date(slot.startsAt).getTime();
      return startsAt >= now && startsAt <= end;
    }).length;
  }, [now, slots]);

  const loadSlots = useCallback(async () => {
    if (!psychologistId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPsychologistAvailability(psychologistId);
      setSlots(data);
    } catch (e) {
      setError(getErrorMessage(e, "No se pudo cargar tu disponibilidad"));
    } finally {
      setLoading(false);
    }
  }, [psychologistId]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadSlots();
    });
  }, [loadSlots]);

  function toggleDay(day: number) {
    setSelectedDays((current) =>
      current.includes(day)
        ? current.filter((item) => item !== day)
        : [...current, day].sort((a, b) => a - b),
    );
  }

  async function addSlot() {
    if (!psychologistId || !preview.valid) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await createAvailabilitySlot({
        psychologistId,
        startsAt: preview.startsAt.toISOString(),
        endsAt: preview.endsAt.toISOString(),
      });
      setSuccess("Horario publicado.");
      await loadSlots();
    } catch (e) {
      setError(getErrorMessage(e, "No se pudo crear el horario"));
    } finally {
      setSaving(false);
    }
  }

  async function addQuickSlots() {
    if (!psychologistId || selectedDays.length === 0) return;
    const times = quickTimes
      .split(",")
      .map((time) => time.trim())
      .filter((time) => /^\d{2}:\d{2}$/.test(time));

    if (times.length === 0) {
      setError("Escribe horarios válidos, por ejemplo: 09:00, 10:00, 16:00");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const existing = new Set(slots.map((slot) => new Date(slot.startsAt).getTime()));
      const candidates = selectedDays.flatMap((day) =>
        Array.from({ length: quickWeeks }, (_, weekOffset) =>
          times.map((time) => withTime(nextDateForWeekday(day, weekOffset), time, duration)),
        ).flat(),
      );
      const uniqueCandidates = candidates.filter(
        (slot) => !existing.has(slot.startsAt.getTime()),
      );

      await Promise.all(
        uniqueCandidates.map((slot) =>
          createAvailabilitySlot({
            psychologistId,
            startsAt: slot.startsAt.toISOString(),
            endsAt: slot.endsAt.toISOString(),
          }),
        ),
      );

      setSuccess(`${uniqueCandidates.length} horarios publicados.`);
      await loadSlots();
    } catch (e) {
      setError(getErrorMessage(e, "No se pudieron crear los horarios"));
    } finally {
      setSaving(false);
    }
  }

  async function removeSlot(slotId: string) {
    if (!psychologistId) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await deleteAvailabilitySlot({ slotId, psychologistId });
      await loadSlots();
    } catch (e) {
      setError(getErrorMessage(e, "No se pudo eliminar el horario"));
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
            Publica espacios claros para que las personas puedan reservar sin
            fricción. Puedes crear un horario puntual o armar varias semanas en
            un solo paso.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <SummaryCard icon={CalendarDays} label="Esta semana" value={String(weekSlots)} />
          <SummaryCard icon={Clock} label="Publicados" value={String(slots.length)} />
        </div>
      </header>

      {error ? (
        <p className="rounded-2xl border border-red-200/80 bg-red-50/40 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="rounded-2xl border border-club-green/15 bg-club-green/10 px-4 py-3 text-sm text-club-green">
          {success}
        </p>
      ) : null}

      <section className="grid gap-5 lg:grid-cols-[0.9fr,1.1fr]">
        <div className="rounded-3xl border border-club-green/10 bg-white/40 p-5 shadow-soft backdrop-blur">
          <div className="flex items-center gap-2 text-club-green">
            <CalendarPlus className="h-5 w-5" strokeWidth={1.5} />
            <h2 className="font-display text-2xl">Horario puntual</h2>
          </div>

          <div className="mt-5 space-y-4">
            <label className="block space-y-2">
              <span className="text-sm text-club-muted">Inicio</span>
              <input
                type="datetime-local"
                value={startValue}
                onChange={(e) => setStartValue(e.target.value)}
                className="w-full rounded-2xl border border-club-green/10 bg-white/60 px-4 py-3 text-sm text-club-ink outline-none ring-club-green/10 focus:ring-2"
              />
            </label>

            <DurationSelect duration={duration} onChange={setDuration} />

            {preview.valid ? (
              <p className="rounded-2xl bg-white/45 px-4 py-3 text-sm text-club-muted">
                Se publicará:{" "}
                <span className="capitalize text-club-green">
                  {formatSessionDate(preview.startsAt.toISOString())},{" "}
                  {formatSessionRange(
                    preview.startsAt.toISOString(),
                    preview.endsAt.toISOString(),
                  )}
                </span>
              </p>
            ) : null}

            <button
              type="button"
              disabled={saving || !preview.valid}
              onClick={() => void addSlot()}
              className="w-full rounded-2xl bg-club-green px-5 py-3 text-sm text-club-paper shadow-soft transition hover:opacity-95 disabled:opacity-60"
            >
              {saving ? "Guardando..." : "Agregar horario"}
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-club-green/10 bg-white/40 p-5 shadow-soft backdrop-blur">
          <div className="flex items-center gap-2 text-club-green">
            <Sparkles className="h-5 w-5" strokeWidth={1.5} />
            <h2 className="font-display text-2xl">Crear semana tipo</h2>
          </div>

          <div className="mt-5 space-y-5">
            <div className="space-y-2">
              <p className="text-sm text-club-muted">Días</p>
              <div className="flex flex-wrap gap-2">
                {WEEK_DAYS.map((day) => {
                  const selected = selectedDays.includes(day.value);
                  return (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleDay(day.value)}
                      className={[
                        "rounded-2xl border px-4 py-2 text-sm transition",
                        selected
                          ? "border-club-green/20 bg-club-green/10 text-club-green"
                          : "border-club-green/10 bg-white/55 text-club-muted hover:bg-white/80",
                      ].join(" ")}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="block space-y-2">
              <span className="text-sm text-club-muted">
                Horas separadas por coma
              </span>
              <input
                value={quickTimes}
                onChange={(e) => setQuickTimes(e.target.value)}
                placeholder="09:00, 10:00, 16:00"
                className="w-full rounded-2xl border border-club-green/10 bg-white/60 px-4 py-3 text-sm text-club-ink outline-none ring-club-green/10 focus:ring-2"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-[1fr,170px]">
              <DurationSelect duration={duration} onChange={setDuration} />
              <label className="block space-y-2">
                <span className="text-sm text-club-muted">Semanas</span>
                <select
                  value={quickWeeks}
                  onChange={(e) => setQuickWeeks(Number(e.target.value))}
                  className="w-full rounded-2xl border border-club-green/10 bg-white/60 px-4 py-3 text-sm text-club-ink outline-none ring-club-green/10 focus:ring-2"
                >
                  <option value={1}>1 semana</option>
                  <option value={2}>2 semanas</option>
                  <option value={4}>4 semanas</option>
                </select>
              </label>
            </div>

            <button
              type="button"
              disabled={saving || selectedDays.length === 0}
              onClick={() => void addQuickSlots()}
              className="w-full rounded-2xl bg-club-green px-5 py-3 text-sm text-club-paper shadow-soft transition hover:opacity-95 disabled:opacity-60"
            >
              {saving ? "Publicando..." : "Publicar semana tipo"}
            </button>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-club-green">Calendario</p>
            <h2 className="font-display text-2xl text-club-green">
              Próximos horarios
            </h2>
          </div>
          <p className="text-sm text-club-muted">
            {slots.length} espacios disponibles
          </p>
        </div>

        {loading ? (
          <div className="h-40 animate-pulse rounded-3xl bg-club-green/5" />
        ) : groupedSlots.length === 0 ? (
          <div className="rounded-3xl border border-club-green/10 bg-white/35 p-6">
            <p className="text-sm text-club-muted">
              Aún no has publicado disponibilidad.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {groupedSlots.map((group) => (
              <article
                key={group.key}
                className="rounded-3xl border border-club-green/10 bg-white/35 p-5 shadow-soft backdrop-blur"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-display text-2xl capitalize text-club-green">
                    {group.label}
                  </h3>
                  <span className="rounded-full bg-white/60 px-3 py-1 text-xs text-club-muted">
                    {group.slots.length} horario{group.slots.length !== 1 ? "s" : ""}
                  </span>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {group.slots.map((slot) => (
                    <div
                      key={slot.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-club-green/10 bg-white/45 px-4 py-3"
                    >
                      <p className="font-display text-xl text-club-green">
                        {formatSessionRange(slot.startsAt, slot.endsAt)}
                      </p>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => void removeSlot(slot.id)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-club-green/15 bg-white/55 text-club-green transition hover:bg-white/80 disabled:opacity-60"
                        aria-label="Quitar horario"
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                      </button>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function DurationSelect({
  duration,
  onChange,
}: {
  duration: number;
  onChange: (duration: number) => void;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm text-club-muted">Duración</span>
      <select
        value={duration}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-2xl border border-club-green/10 bg-white/60 px-4 py-3 text-sm text-club-ink outline-none ring-club-green/10 focus:ring-2"
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
    <div className="rounded-3xl border border-club-green/10 bg-white/40 p-4 shadow-soft backdrop-blur">
      <Icon className="h-5 w-5 text-club-green" strokeWidth={1.5} />
      <p className="mt-3 text-xs text-club-muted">{label}</p>
      <p className="font-display text-3xl text-club-green">{value}</p>
    </div>
  );
}

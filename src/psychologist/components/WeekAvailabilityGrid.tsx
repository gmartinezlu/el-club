import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { AvailabilitySlot } from "../../appointments/availability";
import {
  CELL_HEIGHT_PX,
  formatSlotLabel,
  isSameDayAs,
  slotCount,
  slotKey,
  slotStart,
  weekDays,
} from "../utils/weekGrid";

const DAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

type CellState = "empty" | "available" | "booked";

export type WeekAvailabilityGridProps = {
  weekStart: Date;
  slotsByKey: Map<string, AvailabilitySlot>;
  busyStartTimes: Set<number>;
  disabled?: boolean;
  onWeekChange: (weekStart: Date) => void;
  onCommitSelection: (
    cells: { date: Date; slotIndex: number; key: string }[],
    mode: "add" | "remove",
  ) => void;
};

type Anchor = { dayIndex: number; slotIndex: number; mode: "add" | "remove" };

function cellState(
  date: Date,
  slotIndex: number,
  slotsByKey: Map<string, AvailabilitySlot>,
  busyStartTimes: Set<number>,
): CellState {
  const start = slotStart(date, slotIndex);
  if (busyStartTimes.has(start.getTime())) return "booked";
  return slotsByKey.has(slotKey(date, slotIndex)) ? "available" : "empty";
}

export function WeekAvailabilityGrid({
  weekStart,
  slotsByKey,
  busyStartTimes,
  disabled,
  onWeekChange,
  onCommitSelection,
}: WeekAvailabilityGridProps) {
  const days = weekDays(weekStart);
  const totalSlots = slotCount();
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const [hover, setHover] = useState<{ dayIndex: number; slotIndex: number } | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  function rectangleBounds(a: Anchor, h: { dayIndex: number; slotIndex: number }) {
    return {
      dayMin: Math.min(a.dayIndex, h.dayIndex),
      dayMax: Math.max(a.dayIndex, h.dayIndex),
      slotMin: Math.min(a.slotIndex, h.slotIndex),
      slotMax: Math.max(a.slotIndex, h.slotIndex),
    };
  }

  const selectionBounds = anchor && hover ? rectangleBounds(anchor, hover) : null;

  function isInSelection(dayIndex: number, slotIndex: number): boolean {
    if (!selectionBounds) return false;
    return (
      dayIndex >= selectionBounds.dayMin &&
      dayIndex <= selectionBounds.dayMax &&
      slotIndex >= selectionBounds.slotMin &&
      slotIndex <= selectionBounds.slotMax
    );
  }

  function startDrag(dayIndex: number, slotIndex: number, state: CellState) {
    if (disabled || state === "booked") return;
    setAnchor({ dayIndex, slotIndex, mode: state === "available" ? "remove" : "add" });
    setHover({ dayIndex, slotIndex });
  }

  function continueDrag(dayIndex: number, slotIndex: number) {
    if (!anchor) return;
    setHover({ dayIndex, slotIndex });
  }

  function endDrag() {
    if (!anchor || !hover) {
      setAnchor(null);
      setHover(null);
      return;
    }
    const bounds = rectangleBounds(anchor, hover);
    const cells: { date: Date; slotIndex: number; key: string }[] = [];
    for (let d = bounds.dayMin; d <= bounds.dayMax; d++) {
      for (let s = bounds.slotMin; s <= bounds.slotMax; s++) {
        const key = slotKey(days[d], s);
        const state = cellState(days[d], s, slotsByKey, busyStartTimes);
        if (state === "booked") continue;
        if (anchor.mode === "add" && state === "available") continue;
        if (anchor.mode === "remove" && state === "empty") continue;
        cells.push({ date: days[d], slotIndex: s, key });
      }
    }
    if (cells.length > 0) onCommitSelection(cells, anchor.mode);
    setAnchor(null);
    setHover(null);
  }

  return (
    <div
      className="select-none overflow-x-auto"
      onMouseLeave={() => {
        if (anchor) endDrag();
      }}
      onMouseUp={endDrag}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => onWeekChange(addDaysWeek(weekStart, -7))}
          className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-club-green/15 bg-white/55 text-club-green transition hover:bg-white/80"
          aria-label="Semana anterior"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
        </button>
        <p className="text-sm font-medium text-club-green">
          {weekRangeLabel(days[0], days[6])}
        </p>
        <button
          type="button"
          onClick={() => onWeekChange(addDaysWeek(weekStart, 7))}
          className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-club-green/15 bg-white/55 text-club-green transition hover:bg-white/80"
          aria-label="Semana siguiente"
        >
          <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
        </button>
      </div>

      <div className="grid min-w-[640px] grid-cols-[56px_repeat(7,1fr)]">
        <div />
        {days.map((day, i) => (
          <div key={i} className="px-1 pb-2 text-center">
            <p className="text-xs text-club-muted">{DAY_LABELS[i]}</p>
            <p
              className={[
                "font-display text-lg",
                isSameDayAs(day, new Date(now)) ? "text-club-green" : "text-club-ink",
              ].join(" ")}
            >
              {day.getDate()}
            </p>
          </div>
        ))}

        {Array.from({ length: totalSlots }, (_, slotIndex) => (
          <div className="contents" key={`row-${slotIndex}`}>
            <div
              className="pr-2 text-right text-[11px] text-club-muted"
              style={{ height: CELL_HEIGHT_PX }}
            >
              {slotIndex % 2 === 0 ? formatSlotLabel(slotIndex) : ""}
            </div>
            {days.map((day, dayIndex) => {
              const isPast = slotStart(day, slotIndex).getTime() < now;
              const state = isPast
                ? "empty"
                : cellState(day, slotIndex, slotsByKey, busyStartTimes);
              const selected = isInSelection(dayIndex, slotIndex);

              return (
                <div
                  key={`${dayIndex}-${slotIndex}`}
                  onMouseDown={() => !isPast && startDrag(dayIndex, slotIndex, state)}
                  onMouseEnter={() => continueDrag(dayIndex, slotIndex)}
                  style={{ height: CELL_HEIGHT_PX }}
                  className={[
                    "border border-club-green/5",
                    isPast
                      ? "cursor-not-allowed bg-club-green/[0.02]"
                      : state === "booked"
                        ? "cursor-not-allowed bg-club-green/40"
                        : selected
                          ? anchor?.mode === "remove"
                            ? "cursor-pointer bg-red-200"
                            : "cursor-pointer bg-club-green/60"
                          : state === "available"
                            ? "cursor-pointer bg-club-green/25 hover:bg-club-green/35"
                            : "cursor-pointer bg-white/40 hover:bg-club-green/10",
                  ].join(" ")}
                />
              );
            })}
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-club-muted">
        <LegendDot className="bg-club-green/25" label="Disponible" />
        <LegendDot className="bg-club-green/40" label="Reservada" />
        <LegendDot className="bg-white/40" label="Libre" />
      </div>
    </div>
  );
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={["h-3 w-3 rounded-full border border-club-green/10", className].join(" ")} />
      {label}
    </span>
  );
}

function addDaysWeek(weekStart: Date, amount: number): Date {
  const result = new Date(weekStart);
  result.setDate(result.getDate() + amount);
  return result;
}

function weekRangeLabel(start: Date, end: Date): string {
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  const startLabel = start.toLocaleDateString("es-CO", opts);
  const endLabel = end.toLocaleDateString("es-CO", opts);
  return `${startLabel} — ${endLabel}`;
}

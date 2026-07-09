import { Link } from "react-router-dom";
import type { PatientAppointment } from "../types";
import { formatSessionDate } from "../utils/formatDate";
import { STATUS_LABELS } from "../../appointments/utils";
import { EmotionalGlass } from "./EmotionalGlass";

export function SessionHistoryPreview({
  sessions,
}: {
  sessions: PatientAppointment[];
}) {
  const items = sessions.slice(0, 3);

  return (
    <EmotionalGlass className="p-6 md:p-8">
      <div className="flex items-end justify-between gap-4">
        <p className="font-display text-2xl text-club-green">Historial reciente</p>
        <Link
          to="/patient/sessions"
          className="text-sm text-club-green hover:underline"
        >
          Ver todo
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="mt-6 text-sm text-club-muted">
          Tus sesiones anteriores aparecerán aquí.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {items.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between gap-4 rounded-2xl border border-club-green/5 bg-white/35 px-4 py-3"
            >
              <div>
                <p className="font-medium text-club-ink">
                  {s.psychologistName}
                </p>
                <p className="text-sm capitalize text-club-muted">
                  {formatSessionDate(s.startsAt)}
                </p>
              </div>
              <span className="text-xs text-club-green">
                {STATUS_LABELS[s.status]}
              </span>
            </li>
          ))}
        </ul>
      )}
    </EmotionalGlass>
  );
}

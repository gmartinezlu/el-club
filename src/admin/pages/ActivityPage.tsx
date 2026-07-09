import { useEffect, useState } from "react";
import { Activity, Video } from "lucide-react";
import { STATUS_LABELS } from "../../appointments/utils";
import { formatSessionDate, formatSessionRange } from "../../patient/utils/formatDate";
import {
  fetchAdminActivity,
  type AdminActivityRow,
} from "../services/operations";

export function AdminActivityPage() {
  const [activity, setActivity] = useState<AdminActivityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      void (async () => {
        setLoading(true);
        setError(null);
        try {
          const data = await fetchAdminActivity();
          if (!cancelled) setActivity(data);
        } catch (e) {
          if (!cancelled) {
            setError(
              e instanceof Error ? e.message : "No se pudo cargar actividad",
            );
          }
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-sm font-medium text-club-green">Auditoria</p>
        <h1 className="font-display text-4xl text-club-green">Actividad</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-club-muted">
          Ultimos movimientos de citas y preparacion de sesiones.
        </p>
      </header>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      {loading ? (
        <div className="h-52 animate-pulse rounded-3xl bg-club-green/5" />
      ) : activity.length === 0 ? (
        <div className="rounded-3xl border border-club-green/10 bg-white/35 p-6">
          <p className="text-sm text-club-muted">Aun no hay actividad.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activity.map((item) => (
            <article
              key={item.id}
              className="flex flex-wrap items-start justify-between gap-4 rounded-3xl border border-club-green/10 bg-white/35 p-5 shadow-soft backdrop-blur"
            >
              <div className="flex gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-club-green/10 text-club-green">
                  {item.description.includes("Meet") ? (
                    <Video className="h-5 w-5" strokeWidth={1.5} />
                  ) : (
                    <Activity className="h-5 w-5" strokeWidth={1.5} />
                  )}
                </div>
                <div>
                  <p className="font-display text-2xl text-club-green">
                    {item.title}
                  </p>
                  <p className="mt-1 text-sm text-club-muted">
                    {item.description}
                  </p>
                  <p className="mt-2 capitalize text-xs text-club-muted">
                    {formatSessionDate(item.createdAt)} ·{" "}
                    {formatSessionRange(item.createdAt, item.createdAt)}
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-club-green/10 px-3 py-1 text-xs text-club-green">
                {STATUS_LABELS[item.status]}
              </span>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

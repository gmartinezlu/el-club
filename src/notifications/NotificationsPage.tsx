import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import {
  fetchUserNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "./service";
import type { AppNotification } from "./types";
import { useSessionStore } from "../store/sessionStore";
import { getErrorMessage } from "../utils/errors";
import { PageTitle } from "../components/ui/Typography";

function formatNotificationDate(iso: string): string {
  return new Date(iso).toLocaleString("es-CO", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function NotificationsPage() {
  const userId = useSessionStore((s) => s.user?.id);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.readAt).length,
    [notifications],
  );

  const loadNotifications = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      setNotifications(await fetchUserNotifications(userId));
    } catch (e) {
      setError(getErrorMessage(e, "No se pudieron cargar notificaciones"));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadNotifications();
    });
  }, [loadNotifications]);

  async function markOne(id: string) {
    if (!userId) return;
    setSaving(true);
    setError(null);
    try {
      await markNotificationRead({ id, userId });
      await loadNotifications();
    } catch (e) {
      setError(getErrorMessage(e, "No se pudo marcar como leída"));
    } finally {
      setSaving(false);
    }
  }

  async function markAll() {
    if (!userId) return;
    setSaving(true);
    setError(null);
    try {
      await markAllNotificationsRead(userId);
      await loadNotifications();
    } catch (e) {
      setError(getErrorMessage(e, "No se pudieron marcar como leídas"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-sm font-medium text-club-green">Acompañamiento</p>
        <PageTitle>Notificaciones</PageTitle>
        <p className="max-w-2xl text-sm leading-relaxed text-club-muted">
          Avisos suaves sobre solicitudes, citas, Meet y actualizaciones importantes.
        </p>
      </header>

      {error ? (
        <p className="rounded-2xl border border-red-200/80 bg-red-50/40 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-club-green/10 bg-white/50 p-5 shadow-soft backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-club-green/10 text-club-green">
            <Bell className="h-5 w-5" strokeWidth={1.5} />
          </div>
          <div>
            <p className="font-display text-2xl text-club-green">
              {unreadCount} sin leer
            </p>
            <p className="text-sm text-club-muted">
              Mantén tu espacio al día sin ruido.
            </p>
          </div>
        </div>
        <button
          type="button"
          disabled={saving || unreadCount === 0}
          onClick={() => void markAll()}
          className="inline-flex items-center gap-2 rounded-2xl border border-club-green/15 bg-white/55 px-4 py-2 text-sm text-club-green transition hover:bg-white/80 disabled:opacity-60"
        >
          <CheckCheck className="h-4 w-4" strokeWidth={1.5} />
          Marcar todo leído
        </button>
      </div>

      {loading ? (
        <div className="h-64 animate-pulse rounded-3xl bg-club-green/5" />
      ) : notifications.length === 0 ? (
        <div className="rounded-3xl border border-club-green/10 bg-white/50 p-6">
          <p className="text-sm text-club-muted">
            Aún no tienes notificaciones.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {notifications.map((notification) => (
            <article
              key={notification.id}
              className={[
                "rounded-3xl border p-5 shadow-soft backdrop-blur",
                notification.readAt
                  ? "border-club-green/10 bg-white/50"
                  : "border-club-green/20 bg-club-green/10",
              ].join(" ")}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-display text-2xl text-club-green">
                    {notification.title}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-club-muted">
                    {notification.body}
                  </p>
                  <p className="mt-3 text-xs text-club-muted">
                    {formatNotificationDate(notification.createdAt)}
                  </p>
                </div>
                {!notification.readAt ? (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void markOne(notification.id)}
                    className="rounded-2xl bg-club-green px-4 py-2 text-sm text-club-paper transition hover:opacity-95 disabled:opacity-60"
                  >
                    Leída
                  </button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

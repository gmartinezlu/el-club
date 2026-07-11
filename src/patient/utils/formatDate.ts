export function formatSessionDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function formatSessionTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatSessionRange(startsAt: string, endsAt: string): string {
  return `${formatSessionTime(startsAt)} â€“ ${formatSessionTime(endsAt)}`;
}

export function isSessionSoon(startsAt: string, withinMinutes = 30): boolean {
  const start = new Date(startsAt).getTime();
  const now = Date.now();
  const diff = start - now;
  return diff > 0 && diff <= withinMinutes * 60 * 1000;
}

export function canJoinSession(
  startsAt: string,
  status: string,
  meetUrl: string | null,
): boolean {
  if (!meetUrl) return false;
  const joinableStatuses = ["confirmed", "meeting_enabled"];
  if (!joinableStatuses.includes(status)) return false;

  const start = new Date(startsAt).getTime();
  const now = Date.now();
  const fifteenMin = 15 * 60 * 1000;
  const twoHoursAfter = 2 * 60 * 60 * 1000;
  return now >= start - fifteenMin && now <= start + twoHoursAfter;
}

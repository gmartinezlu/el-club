import { getSupabaseClient } from "../services/supabase/client";
import type { AppNotification } from "./types";

type NotificationRow = {
  id: string;
  user_id: string;
  title: string;
  body: string;
  read_at: string | null;
  created_at: string;
};

function mapNotification(row: NotificationRow): AppNotification {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    body: row.body,
    readAt: row.read_at,
    createdAt: row.created_at,
  };
}

const NOTIFICATION_SELECT = "id, user_id, title, body, read_at, created_at";

export async function fetchUserNotifications(
  userId: string,
): Promise<AppNotification[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("notifications")
    .select(NOTIFICATION_SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return ((data ?? []) as NotificationRow[]).map(mapNotification);
}

export async function createNotification({
  userId,
  title,
  body,
}: {
  userId: string;
  title: string;
  body: string;
}): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    title,
    body,
  });

  if (error) throw error;
}

export async function markNotificationRead({
  id,
  userId,
}: {
  id: string;
  userId: string;
}): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null);

  if (error) throw error;
}

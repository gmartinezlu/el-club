import { getSupabaseClient } from "../services/supabase/client";
import type { EmotionalResource, ResourceType } from "./types";

type ResourceRow = {
  id: string;
  title: string;
  description: string | null;
  type: ResourceType;
  content: string | null;
  media_url: string | null;
  duration_minutes: number | null;
  is_published?: boolean;
  sort_order?: number;
};

function mapRow(row: ResourceRow): EmotionalResource {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    type: row.type,
    content: row.content,
    mediaUrl: row.media_url,
    durationMinutes: row.duration_minutes,
    isPublished: row.is_published,
    sortOrder: row.sort_order,
  };
}

const RESOURCE_SELECT =
  "id, title, description, type, content, media_url, duration_minutes, is_published, sort_order";

export async function fetchPublishedResources(): Promise<EmotionalResource[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("resources")
    .select(RESOURCE_SELECT)
    .eq("is_published", true)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return (data as ResourceRow[]).map(mapRow);
}

export async function fetchMeditations(): Promise<EmotionalResource[]> {
  const all = await fetchPublishedResources();
  return all.filter((r) => r.type === "meditation" || r.type === "audio");
}

export async function fetchResourceById(
  id: string,
): Promise<EmotionalResource | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("resources")
    .select(RESOURCE_SELECT)
    .eq("id", id)
    .eq("is_published", true)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return mapRow(data as ResourceRow);
}

export async function fetchAllResourcesAdmin(): Promise<EmotionalResource[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("resources")
    .select(RESOURCE_SELECT)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return ((data ?? []) as ResourceRow[]).map(mapRow);
}

export type UpsertResourceInput = {
  id?: string;
  title: string;
  description: string | null;
  type: ResourceType;
  content: string | null;
  mediaUrl: string | null;
  durationMinutes: number | null;
  isPublished: boolean;
  sortOrder: number;
};

export async function upsertResourceAdmin(
  input: UpsertResourceInput,
): Promise<void> {
  const supabase = getSupabaseClient();
  const payload = {
    title: input.title,
    description: input.description,
    type: input.type,
    content: input.content,
    media_url: input.mediaUrl,
    duration_minutes: input.durationMinutes,
    is_published: input.isPublished,
    sort_order: input.sortOrder,
  };

  const request = input.id
    ? supabase.from("resources").update(payload).eq("id", input.id)
    : supabase.from("resources").insert(payload);

  const { error } = await request;
  if (error) throw error;
}

export async function deleteResourceAdmin(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("resources").delete().eq("id", id);
  if (error) throw error;
}

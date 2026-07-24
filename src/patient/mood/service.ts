import { getSupabaseClient } from "../../services/supabase/client";
import type { MoodEntry } from "../types";

type MoodEntryRow = {
  entry_date: string;
  mood: number;
  note: string | null;
};

function mapRow(row: MoodEntryRow): MoodEntry {
  return {
    date: row.entry_date,
    mood: row.mood,
    note: row.note ?? undefined,
  };
}

export async function fetchPatientMoodEntries(
  patientId: string,
): Promise<MoodEntry[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("mood_checkins")
    .select("entry_date, mood, note")
    .eq("patient_id", patientId)
    .order("entry_date", { ascending: false })
    .limit(30);

  if (error) throw error;
  return ((data ?? []) as MoodEntryRow[]).map(mapRow);
}

export async function upsertPatientMoodEntry({
  patientId,
  date,
  mood,
  note,
}: {
  patientId: string;
  date: string;
  mood: number;
  note?: string | null;
}): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("mood_checkins").upsert(
    {
      patient_id: patientId,
      entry_date: date,
      mood,
      note: note?.trim() || null,
    },
    { onConflict: "patient_id,entry_date" },
  );

  if (error) throw error;
}

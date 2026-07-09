import { getSupabaseClient } from "../services/supabase/client";
import type { JournalEntry } from "./types";

type JournalRow = {
  id: string;
  patient_id: string;
  title: string | null;
  body: string;
  mood: number | null;
  created_at: string;
};

function mapJournal(row: JournalRow): JournalEntry {
  return {
    id: row.id,
    patientId: row.patient_id,
    title: row.title,
    body: row.body,
    mood: row.mood,
    createdAt: row.created_at,
  };
}

const JOURNAL_SELECT = "id, patient_id, title, body, mood, created_at";

export async function fetchPatientJournals(
  patientId: string,
): Promise<JournalEntry[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("journals")
    .select(JOURNAL_SELECT)
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return ((data ?? []) as JournalRow[]).map(mapJournal);
}

export async function createJournalEntry({
  patientId,
  title,
  body,
  mood,
}: {
  patientId: string;
  title: string | null;
  body: string;
  mood: number | null;
}): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("journals").insert({
    patient_id: patientId,
    title,
    body,
    mood,
  });

  if (error) throw error;
}

export async function updateJournalEntry({
  id,
  patientId,
  title,
  body,
  mood,
}: {
  id: string;
  patientId: string;
  title: string | null;
  body: string;
  mood: number | null;
}): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("journals")
    .update({ title, body, mood })
    .eq("id", id)
    .eq("patient_id", patientId);

  if (error) throw error;
}

export async function deleteJournalEntry({
  id,
  patientId,
}: {
  id: string;
  patientId: string;
}): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("journals")
    .delete()
    .eq("id", id)
    .eq("patient_id", patientId);

  if (error) throw error;
}

import { getSupabaseClient } from "../services/supabase/client";

export type CrisisThread = {
  id: string;
  patientId: string;
  psychologistId: string;
  patientName: string;
  psychologistName: string;
  updatedAt: string;
};

export type CrisisMessage = {
  id: string;
  threadId: string;
  senderId: string;
  body: string;
  createdAt: string;
};

type AppointmentRelationshipRow = {
  psychologist_id: string;
  psychologist?: {
    profile?: {
      full_name: string | null;
    } | null;
  } | null;
};

type ThreadRow = {
  id: string;
  patient_id: string;
  psychologist_id: string;
  updated_at: string;
  patient?: {
    profile?: {
      full_name: string | null;
    } | null;
  } | null;
  psychologist?: {
    profile?: {
      full_name: string | null;
    } | null;
  } | null;
};

type MessageRow = {
  id: string;
  thread_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

const THREAD_SELECT = `
  id,
  patient_id,
  psychologist_id,
  updated_at,
  patient:patients!crisis_chat_threads_patient_id_fkey (
    profile:users!patients_user_id_fkey (
      full_name
    )
  ),
  psychologist:psychologists!crisis_chat_threads_psychologist_id_fkey (
    profile:users!psychologists_user_id_fkey (
      full_name
    )
  )
`;

function mapThread(row: ThreadRow): CrisisThread {
  return {
    id: row.id,
    patientId: row.patient_id,
    psychologistId: row.psychologist_id,
    patientName: row.patient?.profile?.full_name?.trim() || "Persona",
    psychologistName:
      row.psychologist?.profile?.full_name?.trim() || "Tu especialista",
    updatedAt: row.updated_at,
  };
}

export async function fetchOrCreatePatientCrisisThread(
  patientId: string,
): Promise<CrisisThread | null> {
  const supabase = getSupabaseClient();
  const { data: relationships, error: relationshipErr } = await supabase
    .from("appointments")
    .select(
      `
        psychologist_id,
        psychologist:psychologists!appointments_psychologist_id_fkey (
          profile:users!psychologists_user_id_fkey (
            full_name
          )
        )
      `,
    )
    .eq("patient_id", patientId)
    .in("status", ["confirmed", "meeting_enabled", "completed"])
    .order("starts_at", { ascending: false })
    .limit(1);

  if (relationshipErr) throw relationshipErr;

  const relationship = ((relationships ?? []) as unknown as AppointmentRelationshipRow[])[0];
  if (!relationship) return null;

  const { data: existing, error: existingErr } = await supabase
    .from("crisis_chat_threads")
    .select(THREAD_SELECT)
    .eq("patient_id", patientId)
    .eq("psychologist_id", relationship.psychologist_id)
    .maybeSingle();

  if (existingErr) throw existingErr;
  if (existing) return mapThread(existing as unknown as ThreadRow);

  const { data: created, error: createErr } = await supabase
    .from("crisis_chat_threads")
    .insert({
      patient_id: patientId,
      psychologist_id: relationship.psychologist_id,
    })
    .select(THREAD_SELECT)
    .single();

  if (createErr) throw createErr;
  return mapThread(created as unknown as ThreadRow);
}

export async function fetchPsychologistCrisisThreads(
  psychologistId: string,
): Promise<CrisisThread[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("crisis_chat_threads")
    .select(THREAD_SELECT)
    .eq("psychologist_id", psychologistId)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return ((data ?? []) as unknown as ThreadRow[]).map(mapThread);
}

export async function fetchCrisisMessages(
  threadId: string,
): Promise<CrisisMessage[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("crisis_chat_messages")
    .select("id, thread_id, sender_id, body, created_at")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return ((data ?? []) as MessageRow[]).map((row) => ({
    id: row.id,
    threadId: row.thread_id,
    senderId: row.sender_id,
    body: row.body,
    createdAt: row.created_at,
  }));
}

export async function sendCrisisMessage({
  threadId,
  senderId,
  body,
}: {
  threadId: string;
  senderId: string;
  body: string;
}): Promise<void> {
  const supabase = getSupabaseClient();
  const { error: messageErr } = await supabase
    .from("crisis_chat_messages")
    .insert({
      thread_id: threadId,
      sender_id: senderId,
      body: body.trim(),
    });

  if (messageErr) throw messageErr;

  const { error: threadErr } = await supabase
    .from("crisis_chat_threads")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", threadId);

  if (threadErr) throw threadErr;
}

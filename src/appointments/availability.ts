import { getSupabaseClient } from "../services/supabase/client";

export type AvailabilitySlot = {
  id: string;
  psychologistId: string;
  startsAt: string;
  endsAt: string;
};

type AvailabilityRow = {
  id: string;
  psychologist_id: string;
  starts_at: string;
  ends_at: string;
};

function mapAvailability(row: AvailabilityRow): AvailabilitySlot {
  return {
    id: row.id,
    psychologistId: row.psychologist_id,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
  };
}

export async function fetchPsychologistAvailability(
  psychologistId: string,
): Promise<AvailabilitySlot[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("availability")
    .select("id, psychologist_id, starts_at, ends_at")
    .eq("psychologist_id", psychologistId)
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true });

  if (error) throw error;
  return ((data ?? []) as AvailabilityRow[]).map(mapAvailability);
}

export async function fetchBookableAvailability(
  psychologistId: string,
): Promise<AvailabilitySlot[]> {
  const supabase = getSupabaseClient();
  const now = new Date().toISOString();
  const { data: availability, error: availabilityErr } = await supabase
    .from("availability")
    .select("id, psychologist_id, starts_at, ends_at")
    .eq("psychologist_id", psychologistId)
    .gte("starts_at", now)
    .order("starts_at", { ascending: true });

  if (availabilityErr) throw availabilityErr;

  const { data: appointments, error: appointmentsErr } = await supabase
    .from("appointments")
    .select("starts_at")
    .eq("psychologist_id", psychologistId)
    .gte("starts_at", now)
    .neq("status", "cancelled");

  if (appointmentsErr) throw appointmentsErr;

  const bookedStarts = new Set(
    ((appointments ?? []) as { starts_at: string }[]).map((row) =>
      new Date(row.starts_at).getTime(),
    ),
  );

  return ((availability ?? []) as AvailabilityRow[])
    .map(mapAvailability)
    .filter((slot) => !bookedStarts.has(new Date(slot.startsAt).getTime()));
}

export async function createAvailabilitySlot({
  psychologistId,
  startsAt,
  endsAt,
}: {
  psychologistId: string;
  startsAt: string;
  endsAt: string;
}): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("availability").insert({
    psychologist_id: psychologistId,
    starts_at: startsAt,
    ends_at: endsAt,
  });

  if (error) throw error;
}

export async function deleteAvailabilitySlot({
  slotId,
  psychologistId,
}: {
  slotId: string;
  psychologistId: string;
}): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("availability")
    .delete()
    .eq("id", slotId)
    .eq("psychologist_id", psychologistId);

  if (error) throw error;
}

export async function deleteAvailabilitySlotByTime({
  psychologistId,
  startsAt,
}: {
  psychologistId: string;
  startsAt: string;
}): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("availability")
    .delete()
    .eq("psychologist_id", psychologistId)
    .eq("starts_at", startsAt);

  if (error) throw error;
}

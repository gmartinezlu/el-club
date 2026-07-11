import { getSupabaseClient } from "../services/supabase/client";
import { mapAppointmentRow, type AppointmentRowRaw } from "./mappers";
import type { Appointment } from "./types";

const APPOINTMENT_BASE = `
  id,
  patient_id,
  psychologist_id,
  starts_at,
  ends_at,
  status,
  google_meet_url,
  created_at
`;

export async function fetchAppointmentsBase(
  filter: { column: "patient_id" | "psychologist_id"; value: string },
): Promise<Appointment[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("appointments")
    .select(APPOINTMENT_BASE)
    .eq(filter.column, filter.value)
    .order("starts_at", { ascending: true });

  if (error) throw error;
  if (!data?.length) return [];

  const rows = data as unknown as AppointmentRowRaw[];
  const userIds = [
    ...new Set(
      rows.flatMap((r) => [r.patient_id, r.psychologist_id]),
    ),
  ];

  const { data: profiles, error: profileErr } = await supabase
    .from("users")
    .select("id, full_name, avatar_url")
    .in("id", userIds);

  if (profileErr) throw profileErr;

  const profileMap = new Map(
    (profiles ?? []).map((p) => [
      p.id,
      { full_name: p.full_name, avatar_url: p.avatar_url },
    ]),
  );

  return rows.map((row) => {
    const psychProfile = profileMap.get(row.psychologist_id);
    const patientProfile = profileMap.get(row.patient_id);
    return mapAppointmentRow({
      ...row,
      psychologist: {
        profile: psychProfile ?? null,
      },
      patient: {
        profile: patientProfile ?? null,
      },
    });
  });
}

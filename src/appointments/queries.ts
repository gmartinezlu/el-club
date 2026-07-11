/** Fragmentos PostgREST para joins consistentes */

export const APPOINTMENT_SELECT = `
  id,
  patient_id,
  psychologist_id,
  starts_at,
  ends_at,
  status,
  google_meet_url,
  payment_proof_url,
  payment_deadline,
  payment_marked_paid_at,
  created_at,
  psychologist:psychologists!appointments_psychologist_id_fkey (
    user_id,
    profile:users!psychologists_user_id_fkey (
      full_name,
      avatar_url
    )
  ),
  patient:patients!appointments_patient_id_fkey (
    user_id,
    profile:users!patients_user_id_fkey (
      full_name,
      avatar_url
    )
  )
`;

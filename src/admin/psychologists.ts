import { getSupabaseClient } from "../services/supabase/client";

export type PsychologistApplicationStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "paused";

export type AdminPsychologist = {
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  bio: string | null;
  specialties: string[];
  languages: string[];
  isApproved: boolean;
  createdAt: string;
  professionalTitle: string | null;
  licenseNumber: string | null;
  university: string | null;
  experienceYears: number | null;
  clinicalApproach: string | null;
  documentUrl: string | null;
  applicationNotes: string | null;
  applicationStatus: PsychologistApplicationStatus;
  reviewNotes: string | null;
  reviewedAt: string | null;
  reviewerName: string | null;
};

type AdminPsychologistRow = {
  user_id: string;
  bio: string | null;
  specialties: string[] | null;
  languages: string[] | null;
  is_approved: boolean;
  created_at: string;
  professional_title: string | null;
  license_number: string | null;
  university: string | null;
  experience_years: number | null;
  clinical_approach: string | null;
  document_url: string | null;
  application_notes: string | null;
  application_status: PsychologistApplicationStatus | null;
  review_notes: string | null;
  reviewed_at: string | null;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  reviewer?: {
    full_name: string | null;
  } | null;
};

export async function fetchAdminPsychologists(): Promise<AdminPsychologist[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("psychologists")
    .select(
      `
        user_id,
        bio,
        specialties,
        languages,
        is_approved,
        created_at,
        professional_title,
        license_number,
        university,
        experience_years,
        clinical_approach,
        document_url,
        application_notes,
        application_status,
        review_notes,
        reviewed_at,
        profile:users!psychologists_user_id_fkey (
          full_name,
          avatar_url
        ),
        reviewer:users!psychologists_reviewed_by_fkey (
          full_name
        )
      `,
    )
    .order("created_at", { ascending: false });

  if (error) throw error;

  return ((data ?? []) as unknown as AdminPsychologistRow[]).map((row) => ({
    userId: row.user_id,
    fullName: row.profile?.full_name?.trim() || "Psicóloga sin nombre",
    avatarUrl: row.profile?.avatar_url ?? null,
    bio: row.bio,
    specialties: row.specialties ?? [],
    languages: row.languages ?? [],
    isApproved: row.is_approved,
    createdAt: row.created_at,
    professionalTitle: row.professional_title,
    licenseNumber: row.license_number,
    university: row.university,
    experienceYears: row.experience_years,
    clinicalApproach: row.clinical_approach,
    documentUrl: row.document_url,
    applicationNotes: row.application_notes,
    applicationStatus:
      row.application_status ?? (row.is_approved ? "approved" : "pending"),
    reviewNotes: row.review_notes,
    reviewedAt: row.reviewed_at,
    reviewerName: row.reviewer?.full_name?.trim() || null,
  }));
}

export async function reviewPsychologistApplication({
  userId,
  status,
  reviewNotes,
}: {
  userId: string;
  status: PsychologistApplicationStatus;
  reviewNotes?: string;
}): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.rpc("review_psychologist_application", {
    p_psychologist_id: userId,
    p_status: status,
    p_review_notes: reviewNotes?.trim() || null,
  });

  if (error) throw error;
}

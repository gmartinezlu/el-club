import type { PostgrestError } from "@supabase/supabase-js";
import type { PsychologistProfile } from "../../psychologist/types";
import { getSupabaseClient } from "./client";

type PsychologistRow = {
  user_id: string;
  bio: string | null;
  specialties: string[] | null;
  languages: string[] | null;
  document_url: string | null;
  application_status: string | null;
  professional_whatsapp?: string | null;
  payment_methods?: string[] | null;
  payment_instructions?: string | null;
  cancellation_policy?: string | null;
  payment_confirmation_hours?: number | null;
  allow_whatsapp_after_request?: boolean | null;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
};

type UpdatePsychologistProfileInput = {
  userId: string;
  fullName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  specialties: string[];
  languages: string[];
  professionalWhatsapp?: string | null;
  paymentMethods?: string[];
  paymentInstructions?: string | null;
  cancellationPolicy?: string | null;
  paymentConfirmationHours?: number | null;
  allowWhatsappAfterRequest?: boolean;
};

const PROFILE_RELATION_SELECT = `
  profile:users!psychologists_user_id_fkey (
    full_name,
    avatar_url
  )
`;

const BASE_SELECT = `
  user_id,
  bio,
  specialties,
  languages,
  document_url,
  application_status,
  ${PROFILE_RELATION_SELECT}
`;

const PAYMENT_SELECT = `
  user_id,
  bio,
  specialties,
  languages,
  document_url,
  application_status,
  professional_whatsapp,
  payment_methods,
  payment_instructions,
  cancellation_policy,
  payment_confirmation_hours,
  allow_whatsapp_after_request,
  ${PROFILE_RELATION_SELECT}
`;

function isMissingColumnError(error: PostgrestError | null) {
  if (!error) return false;
  const text = `${error.code ?? ""} ${error.message ?? ""} ${error.details ?? ""}`;
  return (
    text.includes("PGRST204") ||
    text.includes("professional_whatsapp") ||
    text.includes("payment_methods") ||
    text.includes("payment_instructions") ||
    text.includes("cancellation_policy") ||
    text.includes("payment_confirmation_hours") ||
    text.includes("allow_whatsapp_after_request")
  );
}

function mapRow(row: PsychologistRow, defaults = false): PsychologistProfile {
  return {
    userId: row.user_id,
    fullName:
      row.profile?.full_name?.trim() ||
      (defaults ? "Psicologa El Club" : ""),
    avatarUrl: row.profile?.avatar_url ?? null,
    bio:
      row.bio ??
      (defaults
        ? "Acompanamiento profesional con una mirada humana, calida y segura."
        : ""),
    specialties: row.specialties?.length
      ? row.specialties
      : defaults
        ? ["Ansiedad", "Autoestima", "Bienestar emocional"]
        : [],
    languages: row.languages?.length
      ? row.languages
      : defaults
        ? ["Espanol"]
        : [],
    documentUrl: row.document_url,
    applicationStatus: row.application_status,
    professionalWhatsapp: row.professional_whatsapp ?? null,
    paymentMethods: row.payment_methods ?? [],
    paymentInstructions: row.payment_instructions ?? null,
    cancellationPolicy: row.cancellation_policy ?? null,
    paymentConfirmationHours: row.payment_confirmation_hours ?? 24,
    allowWhatsappAfterRequest: row.allow_whatsapp_after_request ?? true,
  };
}

export async function fetchApprovedPsychologists(): Promise<
  PsychologistProfile[]
> {
  const supabase = getSupabaseClient();

  const result = await supabase
    .from("psychologists")
    .select(PAYMENT_SELECT)
    .eq("is_approved", true)
    .order("created_at", { ascending: true });
  let data: unknown = result.data;
  let error: PostgrestError | null = result.error;

  if (isMissingColumnError(error)) {
    const fallback = await supabase
      .from("psychologists")
      .select(BASE_SELECT)
      .eq("is_approved", true)
      .order("created_at", { ascending: true });
    data = fallback.data;
    error = fallback.error;
  }

  if (error) throw error;

  return ((data ?? []) as unknown as PsychologistRow[]).map((row) =>
    mapRow(row, true),
  );
}

export async function fetchPsychologistProfile(
  userId: string,
): Promise<PsychologistProfile | null> {
  const supabase = getSupabaseClient();

  const result = await supabase
    .from("psychologists")
    .select(PAYMENT_SELECT)
    .eq("user_id", userId)
    .maybeSingle();
  let data: unknown = result.data;
  let error: PostgrestError | null = result.error;

  if (isMissingColumnError(error)) {
    const fallback = await supabase
      .from("psychologists")
      .select(BASE_SELECT)
      .eq("user_id", userId)
      .maybeSingle();
    data = fallback.data;
    error = fallback.error;
  }

  if (error) throw error;
  if (!data) return null;

  return mapRow(data as unknown as PsychologistRow);
}

export async function updatePsychologistProfile({
  userId,
  fullName,
  avatarUrl,
  bio,
  specialties,
  languages,
  professionalWhatsapp,
  paymentMethods,
  paymentInstructions,
  cancellationPolicy,
  paymentConfirmationHours,
  allowWhatsappAfterRequest,
}: UpdatePsychologistProfileInput): Promise<void> {
  const supabase = getSupabaseClient();

  const { error: userErr } = await supabase
    .from("users")
    .update({
      full_name: fullName,
      avatar_url: avatarUrl,
    })
    .eq("id", userId);

  if (userErr) throw userErr;

  const { error: psychErr } = await supabase
    .from("psychologists")
    .update({
      bio,
      specialties,
      languages,
      professional_whatsapp: professionalWhatsapp,
      payment_methods: paymentMethods,
      payment_instructions: paymentInstructions,
      cancellation_policy: cancellationPolicy,
      payment_confirmation_hours: paymentConfirmationHours,
      allow_whatsapp_after_request: allowWhatsappAfterRequest,
    })
    .eq("user_id", userId);

  if (isMissingColumnError(psychErr)) {
    throw new Error(
      "Falta aplicar la migracion de pagos externos en Supabase antes de guardar WhatsApp, metodos e instrucciones de pago.",
    );
  }

  if (psychErr) throw psychErr;
}

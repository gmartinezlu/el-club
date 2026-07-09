import type { AppRole } from "../../shared/auth/roles";
import { getSupabaseClient } from "./client";

export type UpsertUserProfileInput = {
  userId: string;
  role: AppRole;
  fullName?: string | null;
  avatarUrl?: string | null;
};

export async function upsertUserProfile(
  input: UpsertUserProfileInput,
): Promise<void> {
  const supabase = getSupabaseClient();

  const { error: userErr } = await supabase.from("users").upsert(
    {
      id: input.userId,
      role: input.role,
      full_name: input.fullName ?? null,
      avatar_url: input.avatarUrl ?? null,
    },
    { onConflict: "id" },
  );
  if (userErr) throw userErr;

  if (input.role === "patient") {
    const { error: patientErr } = await supabase.from("patients").upsert(
      {
        user_id: input.userId,
      },
      { onConflict: "user_id" },
    );
    if (patientErr) throw patientErr;
  }

  if (input.role === "psychologist") {
    const { error: psychErr } = await supabase
      .from("psychologists")
      .upsert(
        {
          user_id: input.userId,
          is_approved: false,
        },
        { onConflict: "user_id" },
      );
    if (psychErr) throw psychErr;
  }
}

export async function updateUserProfile({
  userId,
  fullName,
  avatarUrl,
}: {
  userId: string;
  fullName: string | null;
  avatarUrl: string | null;
}): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("users")
    .update({
      full_name: fullName,
      avatar_url: avatarUrl,
    })
    .eq("id", userId);

  if (error) throw error;
}

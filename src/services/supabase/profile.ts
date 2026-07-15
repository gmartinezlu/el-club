import type { AppRole } from "../../shared/auth/roles";
import { getSupabaseClient } from "./client";

type UserProfileRow = {
  id: string;
  role: AppRole;
  full_name: string | null;
  avatar_url: string | null;
  whatsapp_phone?: string | null;
};

export async function fetchAppRoleByUserId(
  userId: string,
): Promise<{ role: AppRole; fullName: string | null; avatarUrl: string | null; whatsappPhone: string | null } | null> {
  const supabase = getSupabaseClient();

  const result = await supabase
    .from("users")
    .select("id, role, full_name, avatar_url, whatsapp_phone")
    .eq("id", userId)
    .maybeSingle<UserProfileRow>();

  let data = result.data;
  let error = result.error;

  if (
    error &&
    `${error.code ?? ""} ${error.message ?? ""} ${error.details ?? ""}`.includes(
      "whatsapp_phone",
    )
  ) {
    const fallback = await supabase
      .from("users")
      .select("id, role, full_name, avatar_url")
      .eq("id", userId)
      .maybeSingle<UserProfileRow>();
    data = fallback.data;
    error = fallback.error;
  }

  if (error) throw error;
  if (!data) return null;

  return {
    role: data.role,
    fullName: data.full_name,
    avatarUrl: data.avatar_url,
    whatsappPhone: data.whatsapp_phone ?? null,
  };
}

import type { AppRole } from "../../shared/auth/roles";
import { getSupabaseClient } from "./client";

type UserProfileRow = {
  id: string;
  role: AppRole;
  full_name: string | null;
  avatar_url: string | null;
};

export async function fetchAppRoleByUserId(
  userId: string,
): Promise<{ role: AppRole; fullName: string | null; avatarUrl: string | null } | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("users")
    .select("id, role, full_name, avatar_url")
    .eq("id", userId)
    .maybeSingle<UserProfileRow>();

  if (error) throw error;
  if (!data) return null;

  return {
    role: data.role,
    fullName: data.full_name,
    avatarUrl: data.avatar_url,
  };
}


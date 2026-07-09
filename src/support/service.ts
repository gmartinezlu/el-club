import { getSupabaseClient } from "../services/supabase/client";

export async function createSupportTicket({
  userId,
  subject,
  body,
}: {
  userId: string;
  subject: string;
  body: string;
}): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("support_tickets").insert({
    user_id: userId,
    subject,
    body,
    status: "open",
  });

  if (error) throw error;
}

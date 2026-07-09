import { getSupabaseClient } from "../../services/supabase/client";
import {
  findMembershipPlan,
  formatCop,
  type MembershipPlanCode,
} from "../../memberships/plans";

export type AdminMembershipOrder = {
  id: string;
  patientId: string;
  patientName: string;
  patientEmail: string | null;
  planCode: MembershipPlanCode;
  planName: string;
  amountLabel: string;
  providerReference: string;
  providerTransactionId: string | null;
  status: "pending_payment" | "approved" | "declined" | "voided";
  createdAt: string;
};

type MembershipOrderRow = {
  id: string;
  patient_id: string;
  plan_code: MembershipPlanCode;
  amount_cents: number;
  provider_reference: string;
  provider_transaction_id: string | null;
  status: AdminMembershipOrder["status"];
  created_at: string;
};

type UserRow = {
  id: string;
  full_name: string | null;
};

function mapOrder(
  row: MembershipOrderRow,
  users: Map<string, UserRow>,
): AdminMembershipOrder {
  const plan = findMembershipPlan(row.plan_code);
  const user = users.get(row.patient_id);

  return {
    id: row.id,
    patientId: row.patient_id,
    patientName: user?.full_name?.trim() || "Miembro EL CLUB",
    patientEmail: null,
    planCode: row.plan_code,
    planName: plan?.name ?? row.plan_code,
    amountLabel: formatCop(Math.round(row.amount_cents / 100)),
    providerReference: row.provider_reference,
    providerTransactionId: row.provider_transaction_id,
    status: row.status,
    createdAt: row.created_at,
  };
}

export async function fetchAdminMembershipOrders(): Promise<
  AdminMembershipOrder[]
> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("membership_orders")
    .select(
      "id, patient_id, plan_code, amount_cents, provider_reference, provider_transaction_id, status, created_at",
    )
    .order("created_at", { ascending: false });

  if (error) throw error;

  const rows = (data ?? []) as MembershipOrderRow[];
  const patientIds = Array.from(new Set(rows.map((row) => row.patient_id)));
  const users = new Map<string, UserRow>();

  if (patientIds.length > 0) {
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, full_name")
      .in("id", patientIds);

    if (userError) throw userError;
    for (const user of (userData ?? []) as UserRow[]) {
      users.set(user.id, user);
    }
  }

  return rows.map((row) => mapOrder(row, users));
}

export async function approveMembershipOrder(
  order: AdminMembershipOrder,
): Promise<void> {
  const supabase = getSupabaseClient();

  const { error: orderError } = await supabase
    .from("membership_orders")
    .update({ status: "approved" })
    .eq("id", order.id);

  if (orderError) throw orderError;

  const { error: membershipError } = await supabase
    .from("patient_memberships")
    .upsert(
      {
        patient_id: order.patientId,
        plan_code: order.planCode,
        status: "active",
        started_at: new Date().toISOString(),
        ends_at: null,
      },
      { onConflict: "patient_id" },
    );

  if (membershipError) throw membershipError;

  await supabase.from("notifications").insert({
    user_id: order.patientId,
    title: "Membresia activada",
    body: `Tu plan ${order.planName} ya esta activo en EL CLUB.`,
  });
}

export async function declineMembershipOrder(orderId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("membership_orders")
    .update({ status: "declined" })
    .eq("id", orderId);

  if (error) throw error;
}

import { getSupabaseClient } from "../services/supabase/client";
import type { MembershipPlan, MembershipPlanCode } from "./plans";

export type MembershipOrder = {
  id: string;
  patientId: string;
  planCode: MembershipPlanCode;
  amountCents: number;
  currency: string;
  providerReference: string;
  providerTransactionId: string | null;
  status: "pending_payment" | "approved" | "declined" | "voided";
  createdAt: string;
};

export type PatientMembership = {
  patientId: string;
  planCode: MembershipPlanCode;
  status: "active" | "paused" | "cancelled" | "expired";
  startedAt: string;
  endsAt: string | null;
};

type MembershipOrderRow = {
  id: string;
  patient_id: string;
  plan_code: MembershipPlanCode;
  amount_cents: number;
  currency: string;
  provider_reference: string;
  provider_transaction_id: string | null;
  status: MembershipOrder["status"];
  created_at: string;
};

type PatientMembershipRow = {
  patient_id: string;
  plan_code: MembershipPlanCode;
  status: PatientMembership["status"];
  started_at: string;
  ends_at: string | null;
};

function mapOrder(row: MembershipOrderRow): MembershipOrder {
  return {
    id: row.id,
    patientId: row.patient_id,
    planCode: row.plan_code,
    amountCents: row.amount_cents,
    currency: row.currency,
    providerReference: row.provider_reference,
    providerTransactionId: row.provider_transaction_id,
    status: row.status,
    createdAt: row.created_at,
  };
}

function mapMembership(row: PatientMembershipRow): PatientMembership {
  return {
    patientId: row.patient_id,
    planCode: row.plan_code,
    status: row.status,
    startedAt: row.started_at,
    endsAt: row.ends_at,
  };
}

export async function createMembershipOrder({
  patientId,
  plan,
}: {
  patientId: string;
  plan: MembershipPlan;
}): Promise<MembershipOrder> {
  const supabase = getSupabaseClient();
  const reference = `elclub-${plan.code}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;

  const { data, error } = await supabase
    .from("membership_orders")
    .insert({
      patient_id: patientId,
      plan_code: plan.code,
      amount_cents: plan.amountCop * 100,
      currency: "COP",
      provider: "wompi",
      provider_reference: reference,
      status: "pending_payment",
    })
    .select(
      "id, patient_id, plan_code, amount_cents, currency, provider_reference, provider_transaction_id, status, created_at",
    )
    .single<MembershipOrderRow>();

  if (error) throw error;
  if (!data) throw new Error("No se pudo crear la orden de membresia");

  return mapOrder(data);
}

export async function fetchLatestMembershipOrder(
  patientId: string,
): Promise<MembershipOrder | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("membership_orders")
    .select(
      "id, patient_id, plan_code, amount_cents, currency, provider_reference, provider_transaction_id, status, created_at",
    )
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<MembershipOrderRow>();

  if (error) throw error;
  return data ? mapOrder(data) : null;
}

export async function fetchPatientMembership(
  patientId: string,
): Promise<PatientMembership | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("patient_memberships")
    .select("patient_id, plan_code, status, started_at, ends_at")
    .eq("patient_id", patientId)
    .maybeSingle<PatientMembershipRow>();

  if (error) throw error;
  return data ? mapMembership(data) : null;
}

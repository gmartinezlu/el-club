const crypto = require("node:crypto");
const { onRequest } = require("firebase-functions/v2/https");
const { createClient } = require("@supabase/supabase-js");

const PLAN_LABELS = {
  comunidad: "Comunidad",
  club: "Club",
  acompanamiento: "Acompanamiento",
};

function getEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getSupabaseAdmin() {
  return createClient(
    getEnv("SUPABASE_URL"),
    getEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false } },
  );
}

function getByPath(source, path) {
  return path.split(".").reduce((current, key) => {
    if (current == null) return undefined;
    return current[key];
  }, source);
}

function normalizeForSignature(value) {
  if (value == null) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function buildChecksum(event, secret) {
  const properties = event?.signature?.properties;
  if (!Array.isArray(properties)) return null;

  const data = event.data ?? {};
  const payload = properties
    .map((property) => normalizeForSignature(getByPath(data, property)))
    .join("");
  const timestamp = normalizeForSignature(event.timestamp);

  return crypto
    .createHash("sha256")
    .update(`${payload}${timestamp}${secret}`)
    .digest("hex");
}

function timingSafeEqual(a, b) {
  const left = Buffer.from(a || "", "utf8");
  const right = Buffer.from(b || "", "utf8");
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function validateWompiEvent(req, body) {
  const expected = buildChecksum(body, getEnv("WOMPI_EVENTS_SECRET"));
  const received =
    req.get("x-event-checksum") ||
    req.get("X-Event-Checksum") ||
    body?.signature?.checksum;

  return Boolean(expected && received && timingSafeEqual(expected, received));
}

function getTransaction(body) {
  return body?.data?.transaction ?? body?.data ?? {};
}

function getTransactionAmount(transaction) {
  return transaction.amount_in_cents ?? transaction.amountInCents ?? null;
}

function mapWompiStatus(status) {
  if (status === "APPROVED") return "approved";
  if (status === "DECLINED" || status === "ERROR") return "declined";
  if (status === "VOIDED") return "voided";
  return "pending_payment";
}

async function activateMembership({ supabase, order, transactionId }) {
  const { error: orderError } = await supabase
    .from("membership_orders")
    .update({
      status: "approved",
      provider_transaction_id: transactionId,
    })
    .eq("id", order.id);

  if (orderError) throw orderError;

  const { error: membershipError } = await supabase
    .from("patient_memberships")
    .upsert(
      {
        patient_id: order.patient_id,
        plan_code: order.plan_code,
        status: "active",
        started_at: new Date().toISOString(),
        ends_at: null,
      },
      { onConflict: "patient_id" },
    );

  if (membershipError) throw membershipError;

  await supabase.from("notifications").insert({
    user_id: order.patient_id,
    title: "Membresia activada",
    body: `Tu plan ${PLAN_LABELS[order.plan_code] ?? order.plan_code} ya esta activo en EL CLUB.`,
  });
}

exports.wompiMembershipWebhook = onRequest(
  { region: "us-central1", cors: false },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "method_not_allowed" });
      return;
    }

    const body = req.body;
    if (!validateWompiEvent(req, body)) {
      res.status(401).json({ error: "invalid_checksum" });
      return;
    }

    const eventType = body?.event;
    if (eventType !== "transaction.updated") {
      res.status(200).json({ ok: true, ignored: true });
      return;
    }

    const transaction = getTransaction(body);
    const reference = transaction.reference;
    const transactionId = transaction.id ?? null;
    const status = transaction.status;
    const nextStatus = mapWompiStatus(status);

    if (!reference) {
      res.status(400).json({ error: "missing_reference" });
      return;
    }

    const supabase = getSupabaseAdmin();
    const { data: order, error: orderError } = await supabase
      .from("membership_orders")
      .select("id, patient_id, plan_code, amount_cents, status")
      .eq("provider_reference", reference)
      .maybeSingle();

    if (orderError) {
      res.status(500).json({ error: "order_lookup_failed" });
      return;
    }

    if (!order) {
      res.status(404).json({ error: "order_not_found" });
      return;
    }

    const amount = getTransactionAmount(transaction);
    if (amount != null && Number(amount) !== Number(order.amount_cents)) {
      res.status(409).json({ error: "amount_mismatch" });
      return;
    }

    try {
      if (nextStatus === "approved") {
        await activateMembership({ supabase, order, transactionId });
      } else if (nextStatus !== "pending_payment") {
        const { error } = await supabase
          .from("membership_orders")
          .update({
            status: nextStatus,
            provider_transaction_id: transactionId,
          })
          .eq("id", order.id);

        if (error) throw error;
      }

      res.status(200).json({ ok: true });
    } catch (error) {
      console.error("wompiMembershipWebhook failed", error);
      res.status(500).json({ error: "webhook_processing_failed" });
    }
  },
);

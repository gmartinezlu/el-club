import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, CreditCard, ShieldCheck, Sparkles } from "lucide-react";
import {
  findMembershipPlan,
  formatCop,
  type MembershipPlan,
} from "../../memberships/plans";
import {
  createMembershipOrder,
  fetchPatientMembership,
  type MembershipOrder,
  type PatientMembership,
} from "../../memberships/service";
import {
  buildWompiCheckoutData,
  type WompiCheckoutData,
} from "../../memberships/wompi";
import { useSessionStore } from "../../store/sessionStore";
import { getErrorMessage } from "../../utils/errors";

export function PatientMembershipCheckoutPage() {
  const { planCode } = useParams<{ planCode: string }>();
  const patientId = useSessionStore((s) => s.user?.id);
  const email = useSessionStore((s) => s.user?.email);
  const plan = useMemo(() => findMembershipPlan(planCode), [planCode]);
  const [membership, setMembership] = useState<PatientMembership | null>(null);
  const [order, setOrder] = useState<MembershipOrder | null>(null);
  const [checkout, setCheckout] = useState<WompiCheckoutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const prepare = useCallback(async () => {
    if (!patientId || !plan) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const activeMembership = await fetchPatientMembership(patientId);
      setMembership(activeMembership);
    } catch (e) {
      setError(getErrorMessage(e, "No pudimos cargar tu membresia"));
    } finally {
      setLoading(false);
    }
  }, [patientId, plan]);

  useEffect(() => {
    queueMicrotask(() => {
      void prepare();
    });
  }, [prepare]);

  async function startCheckout(selectedPlan: MembershipPlan) {
    if (!patientId) return;
    setCreating(true);
    setError(null);
    try {
      const nextOrder = await createMembershipOrder({
        patientId,
        plan: selectedPlan,
      });
      const origin = window.location.origin;
      const wompi = await buildWompiCheckoutData({
        order: nextOrder,
        customerEmail: email,
        redirectUrl: `${origin}/patient/membership/return`,
      });
      setOrder(nextOrder);
      setCheckout(wompi);
    } catch (e) {
      setError(getErrorMessage(e, "No se pudo preparar el pago de membresia"));
    } finally {
      setCreating(false);
    }
  }

  if (!plan) {
    return <Navigate to="/membresia" replace />;
  }

  const active = membership?.status === "active";

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <Link
        to="/membresia"
        className="inline-flex items-center gap-2 text-sm text-club-muted transition hover:text-club-green"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
        Volver a membresia
      </Link>

      <header className="space-y-2">
        <p className="text-sm font-medium text-club-green">Membresia EL CLUB</p>
        <h1 className="font-display text-4xl text-club-green">
          Activa tu plan {plan.name}
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-club-muted">
          Este es el unico pago que EL CLUB procesa dentro de la plataforma. Las
          sesiones de terapia se siguen coordinando directamente con cada
          profesional.
        </p>
      </header>

      {error ? (
        <p className="rounded-2xl border border-red-200/80 bg-red-50/40 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="h-80 animate-pulse rounded-3xl bg-club-green/5" />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1fr,340px]">
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="rounded-3xl border border-club-green/10 bg-white/40 p-6 shadow-soft backdrop-blur"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-club-green/10 text-club-green">
              <Sparkles className="h-7 w-7" strokeWidth={1.5} />
            </div>
            <p className="mt-5 text-xs uppercase tracking-[0.18em] text-club-muted">
              {plan.eyebrow}
            </p>
            <h2 className="mt-2 font-display text-4xl text-club-green">
              {plan.name}
            </h2>
            <p className="mt-2 font-display text-5xl text-club-green">
              {formatCop(plan.amountCop)}
            </p>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-club-muted">
              {plan.description}
            </p>

            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {plan.features.map((feature) => (
                <div
                  key={feature}
                  className="rounded-2xl border border-club-green/10 bg-white/45 px-4 py-3 text-sm text-club-green"
                >
                  {feature}
                </div>
              ))}
            </div>

            {active ? (
              <div className="mt-6 rounded-2xl border border-club-green/10 bg-club-green/10 px-4 py-3 text-sm text-club-green">
                Ya tienes una membresia activa. Puedes cambiar de plan cuando
                definamos upgrades automáticos.
              </div>
            ) : null}
          </motion.section>

          <aside className="rounded-3xl border border-club-green/10 bg-white/40 p-5 shadow-soft backdrop-blur lg:self-start">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-club-green/10 text-club-green">
              <ShieldCheck className="h-6 w-6" strokeWidth={1.5} />
            </div>
            <p className="mt-4 font-display text-2xl text-club-green">
              Pago seguro con Wompi
            </p>
            <p className="mt-2 text-sm leading-relaxed text-club-muted">
              La orden se crea en EL CLUB y el pago se procesa en Wompi. Al
              aprobarse, la membresia podra activarse automaticamente con el
              webhook seguro.
            </p>

            {!order ? (
              <button
                type="button"
                disabled={creating || active}
                onClick={() => void startCheckout(plan)}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-club-green px-5 py-3 text-sm text-club-paper shadow-soft transition hover:opacity-95 disabled:opacity-60"
              >
                <CreditCard className="h-4 w-4" strokeWidth={1.5} />
                {creating ? "Preparando..." : "Pagar membresia"}
              </button>
            ) : checkout?.ready ? (
              <form method="GET" action={checkout.actionUrl} className="mt-6">
                {Object.entries(checkout.fields).map(([name, value]) => (
                  <input key={name} type="hidden" name={name} value={value} />
                ))}
                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-club-green px-5 py-3 text-sm text-club-paper shadow-soft transition hover:opacity-95"
                >
                  <CreditCard className="h-4 w-4" strokeWidth={1.5} />
                  Ir a Wompi
                </button>
              </form>
            ) : (
              <div className="mt-6 rounded-2xl border border-amber-200/80 bg-amber-50/70 p-4 text-sm leading-relaxed text-amber-900">
                Falta configurar Wompi: {checkout?.missing.join(", ")}.
              </div>
            )}

            {order ? (
              <div className="mt-5 rounded-2xl border border-club-green/10 bg-white/45 p-4">
                <p className="text-xs text-club-muted">Referencia</p>
                <p className="mt-1 break-all text-sm text-club-ink">
                  {order.providerReference}
                </p>
              </div>
            ) : null}
          </aside>
        </div>
      )}
    </div>
  );
}

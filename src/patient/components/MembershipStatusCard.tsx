import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { fetchPatientMembership, type PatientMembership } from "../../memberships/service";
import { membershipPlans } from "../../memberships/plans";
import { useSessionStore } from "../../store/sessionStore";
import { EmotionalGlass } from "./EmotionalGlass";

export function MembershipStatusCard() {
  const patientId = useSessionStore((s) => s.user?.id);
  const [membership, setMembership] = useState<PatientMembership | null>(null);

  useEffect(() => {
    if (!patientId) return;
    let cancelled = false;
    queueMicrotask(() => {
      void (async () => {
        try {
          const data = await fetchPatientMembership(patientId);
          if (!cancelled) setMembership(data);
        } catch {
          if (!cancelled) setMembership(null);
        }
      })();
    });

    return () => {
      cancelled = true;
    };
  }, [patientId]);

  const plan = membershipPlans.find((item) => item.code === membership?.planCode);

  return (
    <EmotionalGlass className="p-6">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-club-green/10 text-club-green">
        <Sparkles className="h-5 w-5" strokeWidth={1.5} />
      </div>
      <p className="mt-4 text-xs uppercase tracking-[0.18em] text-club-muted">
        Membresia
      </p>
      <h2 className="mt-2 font-display text-3xl text-club-green">
        {membership?.status === "active" && plan
          ? `Plan ${plan.name}`
          : "Se parte de EL CLUB"}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-club-muted">
        {membership?.status === "active"
          ? "Tu acceso de miembro esta activo para comunidad, experiencias y contenido premium."
          : "Activa tu membresia para entrar a comunidad, experiencias y recursos exclusivos."}
      </p>
      <Link
        to="/membresia"
        className="mt-5 inline-flex rounded-2xl bg-club-green px-4 py-2 text-sm text-club-paper transition hover:opacity-95"
      >
        Ver membresias
      </Link>
    </EmotionalGlass>
  );
}

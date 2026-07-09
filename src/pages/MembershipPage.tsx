import { Link } from "react-router-dom";
import { MarketingLayout } from "../layouts/MarketingLayout";
import { MembershipCard } from "../components/club/MembershipCard";
import { SectionHeader } from "../components/club/SectionHeader";
import { membershipPlans } from "../memberships/plans";

export function MembershipPage() {
  return (
    <MarketingLayout>
      <main className="mx-auto w-full max-w-6xl px-5 py-14 md:px-8">
        <SectionHeader
          centered
          eyebrow="Membresia"
          title="Elige tu forma de pertenecer."
          subtitle="La membresia conecta contenido, comunidad, experiencias y acompanamiento profesional con limites claros y una estetica que se siente parte de tu vida."
        />

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {membershipPlans.map((plan) => (
            <MembershipCard key={plan.name} plan={plan} />
          ))}
        </div>

        <section className="mt-12 rounded-3xl border border-club-green/10 bg-white/45 p-7 text-center shadow-soft backdrop-blur md:p-10">
          <p className="font-display text-4xl text-club-green">
            Membresias con activacion cuidada.
          </p>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-club-muted">
            Los planes ya estan disenados para la experiencia de comunidad. Las
            sesiones de terapia se reservan en EL CLUB, pero el pago se acuerda
            directamente con cada profesional.
          </p>
          <Link
            to="/auth/patient/register"
            className="mt-7 inline-flex rounded-2xl bg-club-green px-6 py-3 text-sm text-club-paper shadow-soft"
          >
            Crear mi espacio
          </Link>
        </section>
      </main>
    </MarketingLayout>
  );
}

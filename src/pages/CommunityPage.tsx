import { Link } from "react-router-dom";
import { MarketingLayout } from "../layouts/MarketingLayout";
import { SectionHeader } from "../components/club/SectionHeader";
import { WhatsAppCommunityBlock } from "../components/club/WhatsAppCommunityBlock";
import { communityPrinciples } from "../components/club/clubContent";

const RULES = [
  "No hay mensajería privada entre usuarios dentro de la plataforma.",
  "Los grupos de WhatsApp son moderados y tienen reglas de convivencia.",
  "Las experiencias son guiadas por EL CLUB o aliados aprobados.",
  "La terapia no se reemplaza por consejos de otros miembros.",
];

export function CommunityPage() {
  return (
    <MarketingLayout>
      <main>
        <section className="mx-auto w-full max-w-6xl px-5 py-14 md:px-8">
          <SectionHeader
            eyebrow="Comunidad"
            title="Pertenencia con límites claros."
            subtitle="La comunidad vive en WhatsApp y en experiencias guiadas, no en chats privados ni foros abiertos dentro de la web."
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {communityPrinciples.map((item) => (
              <article
                key={item.label}
                className="rounded-3xl border border-club-green/10 bg-white/50 p-5 shadow-soft backdrop-blur"
              >
                <item.icon className="h-6 w-6 text-club-green" strokeWidth={1.5} />
                <p className="mt-5 font-display text-2xl text-club-green">
                  {item.label}
                </p>
              </article>
            ))}
          </div>
        </section>

        <WhatsAppCommunityBlock />

        <section className="mx-auto w-full max-w-6xl px-5 pb-16 md:px-8">
          <div className="rounded-3xl bg-club-green p-7 text-club-paper shadow-soft md:p-10">
            <p className="font-display text-4xl">Reglas de cuidado</p>
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {RULES.map((rule) => (
                <p
                  key={rule}
                  className="rounded-2xl border border-club-paper/15 bg-white/10 p-4 text-sm leading-relaxed text-club-paper/80"
                >
                  {rule}
                </p>
              ))}
            </div>
            <Link
              to="/auth/patient/register"
              className="mt-7 inline-flex rounded-2xl bg-club-paper px-6 py-3 text-sm text-club-green"
            >
              Entrar a la comunidad
            </Link>
          </div>
        </section>
      </main>
    </MarketingLayout>
  );
}

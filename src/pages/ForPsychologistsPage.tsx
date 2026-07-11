import { Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { MarketingLayout } from "../layouts/MarketingLayout";
import { SectionHeader } from "../components/club/SectionHeader";
import { clubImages, professionalBenefits } from "../components/club/clubContent";

export function ForPsychologistsPage() {
  return (
    <MarketingLayout>
      <main>
        <section className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-14 md:px-8 lg:grid-cols-[1fr,0.95fr] lg:items-center">
          <div>
            <SectionHeader
              eyebrow="Para psicólogos"
              title="Forma parte de una red premium de profesionales de bienestar emocional."
              subtitle="EL CLUB mantiene la agenda, las notas, el panel profesional y la gestión real, pero dentro de una marca más cercana, aspiracional y humana."
            />
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/auth/psychologist/register"
                className="rounded-2xl bg-club-green px-6 py-3 text-center text-sm text-club-paper shadow-soft"
              >
                Registrarme como especialista
              </Link>
              <Link
                to="/auth/psychologist/login"
                className="rounded-2xl border border-club-green/15 bg-white/55 px-6 py-3 text-center text-sm text-club-green shadow-soft"
              >
                Iniciar sesión profesional
              </Link>
            </div>
          </div>

          <img
            src={clubImages.therapy}
            alt="Profesional acompañando en un espacio premium"
            loading="lazy"
            className="min-h-[420px] rounded-3xl object-cover shadow-soft"
          />
        </section>

        <section className="mx-auto w-full max-w-6xl px-5 pb-16 md:px-8">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {professionalBenefits.map((benefit) => (
              <article
                key={benefit}
                className="rounded-3xl border border-club-green/10 bg-white/50 p-5 shadow-soft backdrop-blur"
              >
                <CheckCircle2 className="h-6 w-6 text-club-green" strokeWidth={1.5} />
                <p className="mt-5 text-sm leading-relaxed text-club-muted">
                  {benefit}
                </p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </MarketingLayout>
  );
}

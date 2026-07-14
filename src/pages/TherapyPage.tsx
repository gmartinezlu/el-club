import { Link } from "react-router-dom";
import { ArrowRight, CalendarCheck, HeartHandshake, ShieldCheck, Video } from "lucide-react";
import { MarketingLayout } from "../layouts/MarketingLayout";
import { SectionHeader } from "../components/club/SectionHeader";
import { clubImages, specialists, therapyNeeds } from "../components/club/clubContent";

const therapySteps = [
  {
    title: "Encuentra una psicóloga",
    text: "Explora perfiles verificados y elige a alguien que conecte con tu momento.",
    icon: HeartHandshake,
  },
  {
    title: "Agenda con calma",
    text: "Reserva un espacio disponible y confirma la sesión desde EL CLUB.",
    icon: CalendarCheck,
  },
  {
    title: "Entra desde EL CLUB",
    text: "La videollamada vive dentro de la experiencia visual de la plataforma.",
    icon: Video,
  },
];

export function TherapyPage() {
  return (
    <MarketingLayout>
      <main>
        <section className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-14 md:px-8 lg:grid-cols-[0.95fr,1.05fr] lg:items-center">
          <div className="space-y-7">
            <SectionHeader
              eyebrow="Terapia en EL CLUB"
              title="Acompañamiento profesional, sin perder la calma del club."
              subtitle="Cuando necesitas hablar con una psicóloga, EL CLUB te conecta con psicólogas verificadas dentro de una experiencia cálida, clara y segura."
            />

            <div className="flex flex-wrap gap-2">
              {therapyNeeds.map((need) => (
                <span
                  key={need}
                  className="rounded-full border border-club-green/10 bg-white/55 px-4 py-2 text-sm text-club-green shadow-soft"
                >
                  {need}
                </span>
              ))}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                to="/auth/patient/register"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-club-green px-6 py-3 text-sm text-club-paper shadow-soft transition hover:translate-y-[-1px]"
              >
                Reservar una sesión
                <ArrowRight className="h-4 w-4" strokeWidth={1.7} />
              </Link>
              <Link
                to="/auth/patient/login"
                className="rounded-2xl border border-club-green/15 bg-white/55 px-6 py-3 text-center text-sm text-club-green shadow-soft transition hover:bg-white"
              >
                Ya tengo cuenta
              </Link>
            </div>
          </div>

          <div className="relative min-h-[500px] overflow-hidden rounded-3xl shadow-soft">
            <img
              src={clubImages.therapy}
              alt="Acompañamiento profesional en un ambiente cálido"
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-club-green/70 via-club-green/15 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="rounded-3xl border border-white/20 bg-club-paper/90 p-5 text-club-green backdrop-blur">
                <ShieldCheck className="h-6 w-6" strokeWidth={1.5} />
                <p className="mt-4 font-display text-3xl leading-tight">
                  Profesionales verificadas, agenda clara y espacios privados.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-5 py-12 md:px-8">
          <div className="grid gap-4 md:grid-cols-3">
            {therapySteps.map((step) => (
              <article
                key={step.title}
                className="rounded-3xl border border-club-green/10 bg-white/50 p-6 shadow-soft backdrop-blur"
              >
                <step.icon className="h-6 w-6 text-club-green" strokeWidth={1.5} />
                <h2 className="mt-5 font-display text-2xl text-club-green">
                  {step.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-club-muted">
                  {step.text}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-5 py-12 md:px-8">
          <SectionHeader
            eyebrow="Psicólogas"
            title="Personas reales, perfiles claros."
            subtitle="La terapia dentro de EL CLUB conserva rigor profesional, pero se presenta de forma cercana, humana y fácil de entender."
          />

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {specialists.map((specialist) => (
              <article
                key={specialist.name}
                className="overflow-hidden rounded-3xl border border-club-green/10 bg-white/50 shadow-soft backdrop-blur"
              >
                <img
                  src={specialist.image}
                  alt={specialist.name}
                  loading="lazy"
                  className="h-56 w-full object-cover"
                />
                <div className="p-5">
                  <h3 className="font-display text-2xl text-club-green">
                    {specialist.name}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-club-muted">
                    {specialist.focus}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-5 pb-16 pt-8 md:px-8">
          <div className="rounded-3xl bg-club-green p-7 text-club-paper shadow-soft md:p-10">
            <p className="font-display text-4xl leading-tight md:text-5xl">
              La terapia es una parte del camino, no todo el camino.
            </p>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-club-paper/75 md:text-base">
              Puedes combinar sesiones con experiencias, comunidad moderada,
              journaling, meditaciones y contenido de bienestar emocional.
            </p>
            <Link
              to="/auth/patient/register"
              className="mt-7 inline-flex rounded-2xl bg-club-paper px-6 py-3 text-sm text-club-green"
            >
              Empezar en EL CLUB
            </Link>
          </div>
        </section>
      </main>
    </MarketingLayout>
  );
}

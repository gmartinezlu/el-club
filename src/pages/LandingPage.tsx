import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { MarketingLayout } from "../layouts/MarketingLayout";
import { FeatureCard } from "../components/landing/FeatureCard";
import { Section } from "../components/landing/Section";
import { PsychologistCard } from "../components/landing/PsychologistCard";
import { GlassCard } from "../components/landing/GlassCard";
import { FAQAccordion } from "../components/landing/FAQAccordion";
import { QuoteCard } from "../components/landing/QuoteCard";
import { BreathLine } from "../components/landing/BreathLine";
import heroImage from "../assets/hero.png";

export function LandingPage() {
  const benefits = [
    {
      title: "Un espacio seguro",
      description:
        "Un entorno disenado para sentirte acompanada, sin juicios, con calma real.",
    },
    {
      title: "Cercania emocional",
      description:
        "Microrecordatorios, recursos y un ritmo que respeta tu proceso.",
    },
    {
      title: "Terapia con enfoque humano",
      description:
        "Menos friccion. Mas claridad. Historial y seguimiento con intencion.",
    },
    {
      title: "Recursos que te sostienen",
      description:
        "Meditacion, journaling y articulos curados para momentos dificiles.",
    },
    {
      title: "Organizacion elegante",
      description:
        "Tu agenda y tus notas, listas y respirables, nunca un panel pesado.",
    },
    {
      title: "Profesionales validados",
      description:
        "Psicologas con perfil completo y aprobacion del equipo de El Club.",
    },
  ];

  const steps = [
    {
      title: "Registrate",
      description:
        "Crea tu cuenta y empieza con una bienvenida calida, sin burocracia.",
    },
    {
      title: "Onboarding emocional",
      description:
        "Define tu rol y tus prioridades para personalizar la experiencia.",
    },
    {
      title: "Encuentra tu psicologa",
      description: "Explora perfiles y agenda un espacio con tranquilidad.",
    },
    {
      title: "Solicitud y coordinacion",
      description:
        "Tu cita se solicita en El Club. El pago de terapia se coordina directamente con la profesional.",
    },
    {
      title: "Sesion y seguimiento",
      description:
        "La sesion se registra y tu historial queda guardado con intencion.",
    },
  ];

  const psychologists = [
    {
      name: "Dra. Camila R.",
      tagline: "Ansiedad y regulacion emocional",
      specialties: ["Ansiedad", "Respiracion", "Autoestima"],
    },
    {
      name: "Psic. Valeria S.",
      tagline: "Procesos de vinculo y acompanamiento",
      specialties: ["Vinculos", "Duelo", "Limites"],
    },
    {
      name: "Dra. Paula M.",
      tagline: "Estres, burnout y bienestar",
      specialties: ["Estres", "Burnout", "Rutinas"],
    },
  ];

  const resources = [
    {
      title: "Meditacion guiada",
      description: "8 minutos para volver a tu centro.",
    },
    {
      title: "Journal con intencion",
      description: "Prompts suaves para sentirte acompanada.",
    },
    {
      title: "Articulos claros",
      description: "Lecturas breves, humanas y aplicables.",
    },
    {
      title: "Mini ejercicios",
      description: "Respira, nombra y suelta, sin exigencia.",
    },
  ];

  const testimonials = [
    {
      quote:
        "Por primera vez senti que la plataforma me entendia. Es calida y tranquila.",
      name: "Sofia",
      context: "Miembro",
    },
    {
      quote:
        "Todo esta claro, pero sin sentirse medico. La experiencia es premium y humana.",
      name: "Maria Fernanda",
      context: "Miembro",
    },
    {
      quote:
        "Mis sesiones y mis notas se ven ordenadas, pero no frias. Se siente profesional.",
      name: "Laura",
      context: "Psicologa",
    },
  ];

  const faqs = [
    {
      question: "El Club es solo para pedir citas?",
      answer:
        "No. Es un ecosistema de bienestar: terapia, recursos emocionales, journaling, comunidad guiada y acompanamiento entre sesiones.",
    },
    {
      question: "Como se integran las videollamadas?",
      answer:
        "La sesion se habilita desde El Club y el acceso se mantiene dentro de la experiencia con Google Meet.",
    },
    {
      question: "La plataforma es segura y con permisos por rol?",
      answer:
        "Si. La seguridad se maneja con Supabase Auth y reglas por rol para proteger rutas y datos sensibles.",
    },
    {
      question: "El Club procesa pagos de terapia?",
      answer:
        "No. Las sesiones se solicitan en El Club, pero el pago se coordina directamente con cada profesional. La membresia si se paga por pasarela.",
    },
  ];

  return (
    <MarketingLayout>
      <main>
        <section className="relative mx-auto w-full max-w-6xl overflow-hidden px-5 pb-14 pt-10 md:px-8 md:pt-16">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-club-brass/10 blur-3xl"
          />
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="relative grid items-center gap-10 md:grid-cols-2 md:gap-12"
          >
            <div className="space-y-5">
              <p className="inline-flex rounded-full border border-club-brass/25 bg-club-brass/10 px-3 py-1 text-sm text-club-brass">
                Un refugio emocional digital
              </p>
              <h1 className="font-display text-6xl leading-[0.95] tracking-tight text-club-green md:text-7xl">
                El Club
              </h1>
              <BreathLine className="h-5 w-32 text-club-brass" />
              <p className="max-w-prose text-lg leading-relaxed text-club-muted">
                Terapia, recursos y acompanamiento emocional con una
                experiencia calida, premium y humana.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/auth/patient/register"
                  className="rounded-2xl bg-club-green px-5 py-3 text-base text-club-paper shadow-soft transition hover:translate-y-[-1px] hover:opacity-95"
                >
                  Empezar
                </Link>
                <a
                  href="#psicologas"
                  className="rounded-2xl border border-club-green/15 bg-white/50 px-5 py-3 text-base text-club-green shadow-soft backdrop-blur transition hover:translate-y-[-1px]"
                >
                  Ver psicologas
                </a>
              </div>
            </div>

            <div className="relative">
              <div
                aria-hidden="true"
                className="absolute -right-6 -top-6 h-full w-full rounded-[2rem] bg-club-cream"
              />
              <div className="relative overflow-hidden rounded-[2rem] border border-club-green/10 bg-white/60 p-6 shadow-soft backdrop-blur">
                <img
                  src={heroImage}
                  alt="Ilustracion de una persona en un momento de calma, rodeada de elementos suaves de bienestar"
                  className="mx-auto w-full max-w-[280px]"
                />
                <p className="mt-2 text-center font-display text-2xl leading-tight text-club-green">
                  No tienes que cargarlo todo sola.
                </p>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <Mini value="8 min" label="Meditacion" />
                  <Mini value="2 prompts" label="Journal" />
                  <Mini value="Curados" label="Recursos" />
                  <Mini value="Agenda" label="Sesion" />
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        <Section
          id="beneficios"
          eyebrow="Experiencia"
          title="Premium, respirable y humana"
          subtitle="Disenada para que te sientas segura y para que tu psicologa tambien tenga un espacio organizado, elegante y funcional."
        >
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {benefits.map((b) => (
              <FeatureCard
                key={b.title}
                title={b.title}
                description={b.description}
              />
            ))}
          </div>
        </Section>

        <Section
          id="como-funciona"
          eyebrow="Proceso"
          title="Un flujo claro, sin peso"
          subtitle="Tu camino hacia el acompanamiento emocional se siente integrado en El Club."
        >
          <div className="grid gap-4 md:grid-cols-5">
            {steps.map((s, idx) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{
                  duration: 0.45,
                  ease: "easeOut",
                  delay: idx * 0.05,
                }}
              >
                <GlassCard className="h-full">
                  <p className="font-display text-3xl text-club-brass">
                    {String(idx + 1).padStart(2, "0")}
                  </p>
                  <p className="mt-2 font-display text-xl text-club-green">
                    {s.title}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-club-muted">
                    {s.description}
                  </p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </Section>

        <Section
          id="psicologas"
          eyebrow="Profesionales"
          title="Psicologas que se sienten cercanas"
          subtitle="Perfiles pensados para crear confianza: enfoque, experiencia y un estilo de acompanamiento humano."
        >
          <div className="grid gap-4 md:grid-cols-3">
            {psychologists.map((p) => (
              <PsychologistCard
                key={p.name}
                name={p.name}
                tagline={p.tagline}
                specialties={p.specialties}
              />
            ))}
          </div>
        </Section>

        <Section
          id="recursos"
          eyebrow="Bienestar"
          title="Recursos emocionales que sostienen"
          subtitle="Lecturas, meditaciones y microejercicios para volver a respirar entre sesiones."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-4">
              {resources.map((r) => (
                <FeatureCard
                  key={r.title}
                  title={r.title}
                  description={r.description}
                />
              ))}
            </div>

            <div className="rounded-3xl border border-club-green/10 bg-white/35 p-6 shadow-soft backdrop-blur">
              <p className="font-display text-2xl text-club-green">
                Ritmo suave, resultados reales
              </p>
              <p className="mt-3 text-sm leading-relaxed text-club-muted">
                Un diseno editorial minimalista con animaciones sutiles para
                que tu mente descanse mientras exploras.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <Mini label="Meditacion" value="8 min" />
                <Mini label="Journal" value="2 prompts" />
                <Mini label="Guias" value="Curadas" />
                <Mini label="Sesiones" value="Agenda" />
              </div>
            </div>
          </div>
        </Section>

        <Section
          id="journaling"
          eyebrow="Practicas"
          title="Journaling y meditacion, con intencion"
          subtitle="Ejercicios simples que no se sienten tecnicos. Solo calma y claridad."
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <GlassCard>
              <p className="font-display text-3xl text-club-green">Journal</p>
              <p className="mt-3 text-sm text-club-muted">
                Prompts que acompanan sin presionar. Escribir para soltar,
                nombrar y volver.
              </p>
              <ul className="mt-5 space-y-3 text-sm text-club-muted">
                <li>Que necesitabas hoy y no pediste?</li>
                <li>Que parte de ti merece cuidado ahora?</li>
                <li>Una cosa pequena que puedes hacer por ti.</li>
              </ul>
            </GlassCard>

            <GlassCard>
              <p className="font-display text-3xl text-club-green">
                Meditacion
              </p>
              <p className="mt-3 text-sm text-club-muted">
                Una guia breve para regular el cuerpo y calmar la mente.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <Mini label="Respira" value="4 ciclos" />
                <Mini label="Suelta" value="2 min" />
                <Mini label="Observa" value="3 min" />
                <Mini label="Cierra" value="1 min" />
              </div>
            </GlassCard>
          </div>
        </Section>

        <Section
          id="testimonios"
          eyebrow="Voces"
          title="Historias reales de calma"
          subtitle="Lo que se siente cuando el acompanamiento es premium y humano."
          tone="dark"
        >
          <div className="grid gap-4 md:grid-cols-3">
            {testimonials.map((t) => (
              <QuoteCard
                key={t.name}
                quote={t.quote}
                name={t.name}
                context={t.context}
                tone="dark"
              />
            ))}
          </div>
        </Section>

        <Section
          id="faq"
          eyebrow="Preguntas"
          title="Respuestas claras"
          subtitle="Sin letras pequenas. Sin confusion."
        >
          <FAQAccordion items={faqs} />
        </Section>

        <section className="mx-auto w-full max-w-6xl px-5 pb-16 pt-6 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative overflow-hidden rounded-3xl bg-club-green p-8 shadow-soft md:p-12"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-16 -right-16 h-56 w-56 rounded-full bg-club-brass/20 blur-3xl"
            />
            <div className="relative grid gap-8 lg:grid-cols-2 lg:items-center">
              <div className="space-y-4">
                <p className="text-sm font-medium text-club-brass">
                  El primer paso se siente ligero
                </p>
                <h3 className="font-display text-4xl leading-tight text-club-paper">
                  Entra a El Club y comienza a respirar.
                </h3>
                <p className="text-sm leading-relaxed text-club-cream/75">
                  Terapia, recursos y acompanamiento emocional en un espacio
                  seguro y premium.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Link
                  to="/auth/patient/register"
                  className="rounded-2xl bg-club-cream px-6 py-3 text-center text-base text-club-green shadow-soft transition hover:opacity-90"
                >
                  Crear cuenta
                </Link>
                <a
                  href="#beneficios"
                  className="rounded-2xl border border-club-cream/30 px-6 py-3 text-center text-base text-club-paper transition hover:bg-white/10"
                >
                  Ver como funciona
                </a>
              </div>
            </div>
          </motion.div>
        </section>
      </main>
    </MarketingLayout>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-club-green/10 bg-white/45 p-3 shadow-soft backdrop-blur">
      <p className="text-xs text-club-muted">{label}</p>
      <p className="mt-1 text-sm font-semibold text-club-ink">{value}</p>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Feather,
  HeartHandshake,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Wind,
} from "lucide-react";
import { MarketingLayout } from "../layouts/MarketingLayout";
import { Highlight } from "../components/ui/Typography";
import { FeatureCard } from "../components/landing/FeatureCard";
import { Section } from "../components/landing/Section";
import { GlassCard } from "../components/landing/GlassCard";
import { FAQAccordion } from "../components/landing/FAQAccordion";
import { BreathLine } from "../components/landing/BreathLine";
import { fetchApprovedPsychologists } from "../services/supabase/psychologists";
import type { PsychologistProfile } from "../psychologist/types";

const therapySessionImage =
  "https://unsplash.com/photos/rG5elqddGzo/download?force=true&w=900";

const COP = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export function LandingPage() {
  const benefits = [
    {
      title: "Un espacio seguro",
      description:
        "Un entorno diseñado para sentirte acompañada, sin juicios, con calma real.",
      icon: <ShieldCheck className="h-5 w-5" />,
    },
    {
      title: "Cercanía emocional",
      description:
        "Microrecordatorios, recursos y un ritmo que respeta tu proceso.",
      icon: <HeartHandshake className="h-5 w-5" />,
    },
    {
      title: "Terapia con enfoque humano",
      description:
        "Menos fricción. Más claridad. Historial y seguimiento con intención.",
      icon: <Sparkles className="h-5 w-5" />,
    },
    {
      title: "Recursos que te sostienen",
      description:
        "Meditación, journaling y artículos curados para momentos difíciles.",
      icon: <Wind className="h-5 w-5" />,
    },
    {
      title: "Organización elegante",
      description:
        "Tu agenda y tus notas, listas y respirables, nunca un panel pesado.",
      icon: <BookOpen className="h-5 w-5" />,
    },
    {
      title: "Profesionales validados",
      description:
        "Psicólogas con perfil completo y aprobación del equipo de El Club.",
      icon: <UserCheck className="h-5 w-5" />,
    },
  ];

  const steps = [
    {
      title: "Regístrate",
      description:
        "Crea tu cuenta y empieza con una bienvenida cálida, sin burocracia.",
    },
    {
      title: "Onboarding emocional",
      description:
        "Define tu rol y tus prioridades para personalizar la experiencia.",
    },
    {
      title: "Encuentra tu psicóloga",
      description: "Explora perfiles y agenda un espacio con tranquilidad.",
    },
    {
      title: "Solicitud y coordinación",
      description:
        "Tu cita se solicita en El Club. El pago de terapia se coordina directamente con la psicóloga.",
    },
    {
      title: "Sesión y seguimiento",
      description:
        "La sesión se registra y tu historial queda guardado con intención.",
    },
  ];

  const [psychologists, setPsychologists] = useState<PsychologistProfile[]>([]);

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(async () => {
      try {
        const data = await fetchApprovedPsychologists();
        if (!cancelled) setPsychologists(data.slice(0, 3));
      } catch {
        if (!cancelled) setPsychologists([]);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const resources = [
    {
      title: "Meditación guiada",
      description: "8 minutos para volver a tu centro.",
      icon: <Wind className="h-5 w-5" />,
    },
    {
      title: "Journal con intención",
      description: "Prompts suaves para sentirte acompañada.",
      icon: <Feather className="h-5 w-5" />,
    },
    {
      title: "Artículos claros",
      description: "Lecturas breves, humanas y aplicables.",
      icon: <BookOpen className="h-5 w-5" />,
    },
    {
      title: "Mini ejercicios",
      description: "Respira, nombra y suelta, sin exigencia.",
      icon: <Sparkles className="h-5 w-5" />,
    },
  ];

  const faqs = [
    {
      question: "¿El Club es solo para pedir citas?",
      answer:
        "No. Es un ecosistema de bienestar: terapia, recursos emocionales, journaling, comunidad guiada y acompañamiento entre sesiones.",
    },
    {
      question: "¿Cómo se integran las videollamadas?",
      answer:
        "La sesión se habilita desde El Club y el acceso se mantiene dentro de la experiencia con Google Meet.",
    },
    {
      question: "¿La plataforma es segura y con permisos por rol?",
      answer:
        "Sí. La seguridad se maneja con Supabase Auth y reglas por rol para proteger rutas y datos sensibles.",
    },
    {
      question: "¿El Club procesa pagos de terapia?",
      answer:
        "No. Las sesiones se solicitan en El Club, pero el pago se coordina directamente con cada psicóloga, por lo general vía Nequi.",
    },
  ];

  return (
    <MarketingLayout>
      <main>
        <HeroSection heroImage={therapySessionImage} />

        <Section
          id="beneficios"
          eyebrow="Experiencia"
          title="Premium, respirable y humana"
          subtitle="Diseñada para que te sientas segura y para que tu psicóloga también tenga un espacio organizado, elegante y funcional."
        >
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {benefits.map((b) => (
              <FeatureCard
                key={b.title}
                title={b.title}
                description={b.description}
                icon={b.icon}
              />
            ))}
          </div>
        </Section>

        <Section
          id="como-funciona"
          eyebrow="Proceso"
          title="Un flujo claro, sin peso"
          subtitle="Tu camino hacia el acompañamiento emocional se siente integrado en El Club."
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
          id="psicólogas"
          eyebrow="Profesionales"
          title="Psicólogas reales, perfiles vivos"
          subtitle="Esta sección se alimenta de psicólogas aprobadas en El Club. Si aún no hay perfiles públicos, no mostramos nombres inventados."
        >
          {psychologists.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-3">
              {psychologists.map((p) => (
                <GlassCard key={p.userId} className="h-full">
                  <div className="flex items-center gap-3">
                    {p.avatarUrl ? (
                      <img
                        src={p.avatarUrl}
                        alt=""
                        className="h-12 w-12 rounded-2xl object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-club-green/10 text-club-green">
                        <UserCheck className="h-5 w-5" strokeWidth={1.5} />
                      </div>
                    )}
                    <div>
                      <p className="font-display text-2xl text-club-green">
                        {p.fullName}
                      </p>
                      {p.sessionPriceCents != null ? (
                        <p className="text-xs font-medium text-club-brass">
                          {COP.format(p.sessionPriceCents / 100)} / sesión
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-club-muted">
                    {p.bio}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {p.specialties.slice(0, 4).map((item) => (
                      <span
                        key={item}
                        className="rounded-full bg-club-green/10 px-3 py-1 text-xs text-club-green"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </GlassCard>
              ))}
            </div>
          ) : (
            <GlassCard>
              <p className="font-display text-2xl text-club-green">
                El catálogo se activa con perfiles aprobados
              </p>
              <p className="mt-3 text-sm leading-relaxed text-club-muted">
                Las psicólogas que ve el consultante son las que se registran,
                completan su perfil y quedan aprobadas. Cada una puede mostrar
                su precio por sesión, métodos de pago y condiciones.
              </p>
              <Link
                to="/auth/patient/register"
                className="mt-5 inline-flex rounded-2xl bg-club-green px-5 py-3 text-sm text-club-paper transition hover:opacity-95"
              >
                Entrar al catálogo
              </Link>
            </GlassCard>
          )}
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
                  icon={r.icon}
                />
              ))}
            </div>

            <div className="rounded-3xl border border-club-green/10 bg-white/60 p-6">
              <p className="font-display text-2xl text-club-green">
                Ritmo suave, resultados reales
              </p>
              <p className="mt-3 text-sm leading-relaxed text-club-muted">
                Un diseño editorial minimalista con animaciones sutiles para
                que tu mente descanse mientras exploras.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <Mini label="Meditación" value="8 min" />
                <Mini label="Journal" value="2 prompts" />
                <Mini label="Guías" value="Curadas" />
                <Mini label="Sesiones" value="Agenda" />
              </div>
            </div>
          </div>
        </Section>

        <Section
          id="journaling"
          eyebrow="Prácticas"
          title="Journaling y meditación, con intención"
          subtitle="Ejercicios simples que no se sienten técnicos. Solo calma y claridad."
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <GlassCard>
              <p className="font-display text-2xl text-club-green">Journal</p>
              <p className="mt-3 text-sm text-club-muted">
                Prompts que acompañan sin presionar. Escribir para soltar,
                nombrar y volver.
              </p>
              <ul className="mt-5 space-y-3 text-sm text-club-muted">
                <li>¿Qué necesitabas hoy y no pediste?</li>
                <li>¿Qué parte de ti merece cuidado ahora?</li>
                <li>Una cosa pequeña que puedes hacer por ti.</li>
              </ul>
            </GlassCard>

            <GlassCard>
              <p className="font-display text-2xl text-club-green">
                Meditación
              </p>
              <p className="mt-3 text-sm text-club-muted">
                Una guía breve para regular el cuerpo y calmar la mente.
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
          title="Historias reales, cuando existan"
          subtitle="Los testimonios deben venir de usuarios reales. Hasta entonces, El Club no publica frases simuladas."
          tone="dark"
        >
          <div className="grid gap-4 md:grid-cols-3">
            {[
              "Testimonios enviados por consultantes",
              "Historias aprobadas antes de publicarse",
              "Privacidad y consentimiento explícito",
            ].map((item) => (
              <div
                key={item}
                className="rounded-3xl border border-club-paper/10 bg-club-paper/5 p-5"
              >
                <p className="font-display text-2xl text-club-paper">{item}</p>
                <p className="mt-2 text-sm leading-relaxed text-club-cream/70">
                  Esta área queda lista para contenido real, sin nombres ni
                  experiencias inventadas.
                </p>
              </div>
            ))}
          </div>
        </Section>

        <Section
          id="faq"
          eyebrow="Preguntas"
          title="Respuestas claras"
          subtitle="Sin letras pequeñas. Sin confusión."
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
                  Entra a El Club y comienza a <Highlight>respirar</Highlight>.
                </h3>
                <p className="text-sm leading-relaxed text-club-cream/75">
                  Terapia, recursos y acompañamiento emocional en un espacio
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
                  href="#como-funciona"
                  className="rounded-2xl border border-club-cream/30 px-6 py-3 text-center text-base text-club-paper transition hover:bg-white/10"
                >
                  Ver cómo funciona
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
    <div className="rounded-2xl border border-club-green/10 bg-white/60 p-3">
      <p className="text-xs text-club-muted">{label}</p>
      <p className="mt-1 text-sm font-semibold text-club-ink">{value}</p>
    </div>
  );
}

function HeroSection({ heroImage }: { heroImage: string }) {
  const ref = useRef<HTMLElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springX = useSpring(mouseX, { stiffness: 120, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 120, damping: 20 });

  const rotateX = useTransform(springY, [-0.5, 0.5], [6, -6]);
  const rotateY = useTransform(springX, [-0.5, 0.5], [-6, 6]);
  const translateX = useTransform(springX, [-0.5, 0.5], [-8, 8]);
  const translateY = useTransform(springY, [-0.5, 0.5], [-8, 8]);

  function handleMouseMove(event: React.MouseEvent<HTMLElement>) {
    const bounds = ref.current?.getBoundingClientRect();
    if (!bounds) return;
    mouseX.set((event.clientX - bounds.left) / bounds.width - 0.5);
    mouseY.set((event.clientY - bounds.top) / bounds.height - 0.5);
  }

  function handleMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
  }

  return (
    <section
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative mx-auto w-full max-w-6xl overflow-hidden px-5 pb-14 pt-10 md:px-8 md:pt-16"
    >
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
            Terapia, recursos y acompañamiento emocional con una experiencia
            cálida, premium y humana.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              to="/auth/patient/register"
              className="rounded-2xl bg-club-green px-5 py-3 text-base text-club-paper shadow-soft transition hover:translate-y-[-1px] hover:opacity-95"
            >
              Empezar
            </Link>
            <a
              href="#psicólogas"
              className="rounded-2xl border border-club-green/15 bg-white/60 px-5 py-3 text-base text-club-green transition hover:translate-y-[-1px] hover:border-club-green/25"
            >
              Ver psicólogas
            </a>
          </div>
        </div>

        <motion.div
          style={{ perspective: 1200 }}
          className="relative"
        >
          <motion.div
            style={{ rotateX, rotateY, x: translateX, y: translateY }}
            className="relative overflow-hidden rounded-[2rem] border border-club-green/10 bg-white/70 p-6 shadow-soft"
          >
            <img
              src={heroImage}
              alt="Sesión de terapia en un espacio claro y profesional"
              className="h-72 w-full rounded-[1.5rem] object-cover"
            />
            <p className="mt-2 text-center font-display text-2xl leading-tight text-club-green">
              Un espacio para hablar con calma.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <Mini value="8 min" label="Meditación" />
              <Mini value="2 prompts" label="Journal" />
              <Mini value="Curados" label="Recursos" />
              <Mini value="Agenda" label="Sesión" />
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}

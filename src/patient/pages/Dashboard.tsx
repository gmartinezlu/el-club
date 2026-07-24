import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { useSessionStore } from "../../store/sessionStore";
import { usePatientAppointments } from "../hooks/usePatientAppointments";
import { WelcomeGreeting } from "../components/WelcomeGreeting";
import { NextSessionCard } from "../components/NextSessionCard";
import { QuickPathGrid } from "../components/QuickPathGrid";
import { MoodCheckIn } from "../components/MoodCheckIn";
import { ResourcePreview } from "../components/ResourcePreview";
import { SessionHistoryPreview } from "../components/SessionHistoryPreview";
import { EmotionalGlass } from "../components/EmotionalGlass";

export function PatientDashboardPage() {
  const fullName = useSessionStore((s) => s.fullName);
  const { next, history, appointments, loading, error } =
    usePatientAppointments();

  const isNewUser = !loading && appointments.length === 0;

  return (
    <div className="space-y-12 md:space-y-16">
      <WelcomeGreeting fullName={fullName} />

      {error ? (
        <p className="rounded-2xl border border-red-200/80 bg-red-50/40 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      {isNewUser ? (
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5, ease: "easeOut" }}
        >
          <EmotionalGlass className="overflow-hidden p-0">
            <div className="bg-club-green px-6 py-8 text-club-paper md:px-8">
              <div className="flex items-center gap-3">
                <Sparkles className="h-6 w-6 text-club-paper/80" strokeWidth={1.5} />
                <h2 className="font-display text-3xl">Tu primer paso</h2>
              </div>
              <p className="mt-2 max-w-lg text-sm leading-relaxed text-club-paper/80">
                Estás a una sesión de empezar tu camino. Explora los perfiles de
                nuestras psicólogas aprobadas y agenda tu primer espacio cuando
                te sientas lista.
              </p>
            </div>
            <div className="grid gap-4 p-6 sm:grid-cols-3 md:p-8">
              <StepCard number={1} title="Explora" description="Conoce los perfiles y enfoques de cada psicóloga." />
              <StepCard number={2} title="Elige horario" description="Selecciona el día y hora que mejor te acomoden." />
              <StepCard number={3} title="Coordina" description="Confirma tu cita y coordina el pago por WhatsApp." />
            </div>
            <div className="px-6 pb-6 md:px-8 md:pb-8">
              <Link
                to="/patient/psychologists"
                className="inline-flex items-center gap-2 rounded-2xl bg-club-green px-6 py-3.5 text-base text-club-paper shadow-soft transition hover:translate-y-[-1px] hover:opacity-95"
              >
                Encontrar mi psicóloga
                <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
              </Link>
            </div>
          </EmotionalGlass>
        </motion.section>
      ) : (
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5, ease: "easeOut" }}
          className="space-y-4"
        >
          {loading ? (
            <div className="h-48 animate-pulse rounded-3xl bg-club-green/5" />
          ) : (
            <NextSessionCard appointment={next} />
          )}
        </motion.section>
      )}

      <section className="space-y-4">
        <p className="text-sm font-medium text-club-muted">
          Caminos suaves para acompañarte
        </p>
        <QuickPathGrid />
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <MoodCheckIn />
        <ResourcePreview />
      </div>

      {!loading && history.length > 0 ? (
        <SessionHistoryPreview sessions={history} />
      ) : null}
    </div>
  );
}

function StepCard({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-club-green/10 bg-white/50 p-4">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-club-green/10 text-xs font-medium text-club-green">
        {number}
      </span>
      <p className="mt-2 font-display text-xl text-club-green">{title}</p>
      <p className="mt-1 text-sm text-club-muted">{description}</p>
    </div>
  );
}

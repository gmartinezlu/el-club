import { motion } from "framer-motion";
import { useSessionStore } from "../../store/sessionStore";
import { usePatientAppointments } from "../hooks/usePatientAppointments";
import { WelcomeGreeting } from "../components/WelcomeGreeting";
import { NextSessionCard } from "../components/NextSessionCard";
import { QuickPathGrid } from "../components/QuickPathGrid";
import { MoodCheckIn } from "../components/MoodCheckIn";
import { ResourcePreview } from "../components/ResourcePreview";
import { SessionHistoryPreview } from "../components/SessionHistoryPreview";
import { MembershipStatusCard } from "../components/MembershipStatusCard";

export function PatientDashboardPage() {
  const fullName = useSessionStore((s) => s.fullName);
  const { next, history, loading, error } = usePatientAppointments();

  return (
    <div className="space-y-12 md:space-y-16">
      <WelcomeGreeting fullName={fullName} />

      {error ? (
        <p className="rounded-2xl border border-red-200/80 bg-red-50/40 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}

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

      <section className="space-y-4">
        <p className="text-sm font-medium text-club-muted">
          Caminos suaves para acompañarte
        </p>
        <QuickPathGrid />
      </section>

      <div className="grid gap-8 lg:grid-cols-3">
        <MoodCheckIn />
        <MembershipStatusCard />
        <ResourcePreview />
      </div>

      {!loading ? <SessionHistoryPreview sessions={history} /> : null}
    </div>
  );
}

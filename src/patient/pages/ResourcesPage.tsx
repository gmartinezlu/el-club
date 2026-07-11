import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { usePatientResources } from "../hooks/usePatientResources";
import { EmotionalGlass } from "../components/EmotionalGlass";
import { PageTitle } from "../../components/ui/Typography";

const TYPE_LABEL: Record<string, string> = {
  meditation: "Meditación",
  article: "Artículo",
  audio: "Audio",
  exercise: "Ejercicio",
  pdf: "PDF",
};

export function PatientResourcesPage() {
  const { resources, loading, error } = usePatientResources();

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <p className="text-sm font-medium text-club-green">Acompañamiento</p>
        <PageTitle>Recursos emocionales</PageTitle>
        <p className="max-w-lg text-sm leading-relaxed text-club-muted">
          Lecturas, ejercicios y audios curados para momentos difíciles y días
          tranquilos.
        </p>
      </header>

      {error ? (
        <p className="text-sm text-red-700">{error}</p>
      ) : null}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-40 animate-pulse rounded-3xl bg-club-green/5"
            />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {resources.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
            >
              <EmotionalGlass className="h-full p-6">
                <span className="text-xs font-medium uppercase tracking-wider text-club-green">
                  {TYPE_LABEL[r.type]}
                  {r.durationMinutes ? ` · ${r.durationMinutes} min` : ""}
                </span>
                <h2 className="mt-3 font-display text-2xl text-club-green">
                  {r.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-club-muted">
                  {r.description}
                </p>
                {r.type === "meditation" || r.type === "audio" ? (
                  <Link
                    to={`/patient/meditations?play=${r.id}`}
                    className="mt-6 inline-block text-sm text-club-green hover:underline"
                  >
                    Escuchar
                  </Link>
                ) : (
                  <p className="mt-6 text-sm leading-relaxed text-club-ink/80">
                    {r.content}
                  </p>
                )}
              </EmotionalGlass>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

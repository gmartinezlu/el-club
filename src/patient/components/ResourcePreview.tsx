import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { usePatientResources } from "../hooks/usePatientResources";
import { EmotionalGlass } from "./EmotionalGlass";

const TYPE_LABEL: Record<string, string> = {
  meditation: "Meditación",
  article: "Artículo",
  audio: "Audio",
  exercise: "Ejercicio",
  pdf: "PDF",
};

export function ResourcePreview() {
  const { resources, loading, error } = usePatientResources();
  const items = resources.slice(0, 3);

  return (
    <EmotionalGlass className="p-6 md:p-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-club-muted">
            Para este momento
          </p>
          <p className="mt-1 font-display text-2xl text-club-green">
            Recursos emocionales
          </p>
        </div>
        <Link
          to="/patient/resources"
          className="shrink-0 text-sm text-club-green hover:underline"
        >
          Ver todos
        </Link>
      </div>

      {loading ? (
        <div className="mt-6 h-24 animate-pulse rounded-2xl bg-club-green/5" />
      ) : error ? (
        <p className="mt-6 text-sm text-club-muted">{error}</p>
      ) : items.length === 0 ? (
        <p className="mt-6 text-sm text-club-muted">
          Pronto tendrás recursos curados aquí.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {items.map((r, i) => (
            <motion.li
              key={r.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.06 * i, duration: 0.4 }}
            >
              <Link
                to={
                  r.type === "meditation" || r.type === "audio"
                    ? `/patient/meditations?play=${r.id}`
                    : "/patient/resources"
                }
                className="flex items-start justify-between gap-4 rounded-2xl border border-club-green/5 bg-white/40 px-4 py-3 transition hover:bg-white/60"
              >
                <div>
                  <p className="font-medium text-club-ink">{r.title}</p>
                  <p className="mt-0.5 text-sm text-club-muted">
                    {r.description}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-club-green">
                  {TYPE_LABEL[r.type]}
                  {r.durationMinutes ? ` · ${r.durationMinutes} min` : ""}
                </span>
              </Link>
            </motion.li>
          ))}
        </ul>
      )}
    </EmotionalGlass>
  );
}

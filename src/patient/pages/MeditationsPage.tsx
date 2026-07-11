import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { fetchMeditations } from "../../resources/service";
import type { EmotionalResource } from "../../resources/types";
import { MeditationPlayer } from "../components/MeditationPlayer";
import { EmotionalGlass } from "../components/EmotionalGlass";
import { PageTitle } from "../../components/ui/Typography";

export function PatientMeditationsPage() {
  const [searchParams] = useSearchParams();
  const playId = searchParams.get("play");

  const [meditations, setMeditations] = useState<EmotionalResource[]>([]);
  const [active, setActive] = useState<EmotionalResource | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchMeditations();
        if (cancelled) return;
        setMeditations(data);
        if (playId) {
          setActive(data.find((m) => m.id === playId) ?? data[0] ?? null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error ? e.message : "No se pudieron cargar meditaciones",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [playId]);

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <p className="text-sm font-medium text-club-green">Calma</p>
        <PageTitle>Meditaciones</PageTitle>
        <p className="max-w-lg text-sm leading-relaxed text-club-muted">
          Audios breves para volver al cuerpo. Sin exigencia, solo presencia.
        </p>
      </header>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      {active ? (
        <MeditationPlayer resource={active} />
      ) : null}

      {loading ? (
        <div className="h-32 animate-pulse rounded-3xl bg-club-green/5" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {meditations.map((m, i) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.45 }}
            >
              <button
                type="button"
                onClick={() => setActive(m)}
                className="w-full text-left"
              >
                <EmotionalGlass
                  className={[
                    "p-6 transition hover:bg-white/50",
                    active?.id === m.id ? "ring-2 ring-club-green/20" : "",
                  ].join(" ")}
                >
                  <p className="font-display text-2xl text-club-green">
                    {m.title}
                  </p>
                  <p className="mt-1 text-sm text-club-muted">
                    {m.description}
                    {m.durationMinutes ? ` Â· ${m.durationMinutes} min` : ""}
                  </p>
                </EmotionalGlass>
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

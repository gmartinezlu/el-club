import { motion } from "framer-motion";
import { useMoodCheckIn } from "../hooks/useMoodCheckIn";
import { EmotionalGlass } from "./EmotionalGlass";

const MOOD_LABELS = [
  "Muy bajo",
  "Bajo",
  "Neutral",
  "Bien",
  "Muy bien",
];

export function MoodCheckIn() {
  const { todayMood, saved, saveMood } = useMoodCheckIn();

  return (
    <EmotionalGlass className="p-6 md:p-8">
      <p className="text-xs font-medium uppercase tracking-wider text-club-muted">
        Seguimiento emocional · opcional
      </p>
      <p className="mt-2 font-display text-2xl text-club-green">
        ¿Cómo te sientes hoy?
      </p>
      <p className="mt-2 text-sm text-club-muted">
        Sin presión. Solo para ti.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {[1, 2, 3, 4, 5].map((value) => {
          const selected = todayMood === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => saveMood(value)}
              className={[
                "flex min-w-[3.5rem] flex-col items-center rounded-2xl border px-3 py-3 text-center transition",
                selected
                  ? "border-club-green/25 bg-club-green/10 text-club-green"
                  : "border-club-green/10 bg-white/50 text-club-muted hover:border-club-green/20 hover:bg-white/70",
              ].join(" ")}
            >
              <span className="text-lg font-medium">{value}</span>
              <span className="mt-1 text-[10px] leading-tight">
                {MOOD_LABELS[value - 1]}
              </span>
            </button>
          );
        })}
      </div>

      {saved && todayMood ? (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 text-sm text-club-green"
        >
          Gracias por escucharte. Hoy registraste: {MOOD_LABELS[todayMood - 1]}.
        </motion.p>
      ) : null}
    </EmotionalGlass>
  );
}

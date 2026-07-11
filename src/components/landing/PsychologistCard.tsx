import { motion } from "framer-motion";
import type { ReactNode } from "react";

function initials(name: string) {
  return name
    .replace(/^(Dra\.|Psic\.|Dr\.)\s*/i, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

export function PsychologistCard({
  name,
  tagline,
  specialties,
  avatar,
}: {
  name: string;
  tagline: string;
  specialties: string[];
  avatar?: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
    >
      <div className="group rounded-3xl border border-club-green/10 bg-white/60 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-club-green/20 hover:shadow-soft">
        <div className="flex items-start gap-4">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg text-club-paper shadow-soft"
            style={{
              background:
                "radial-gradient(circle at 30% 30%, var(--club-brass), var(--club-green) 75%)",
            }}
          >
            {avatar ? avatar : <span className="font-display">{initials(name)}</span>}
          </div>
          <div className="min-w-0 pt-1">
            <p className="font-display text-2xl text-club-green">{name}</p>
            <p className="mt-1 text-sm text-club-muted">{tagline}</p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {specialties.map((s) => (
            <span
              key={s}
              className="rounded-full border border-club-brass/25 bg-club-brass/10 px-3 py-1 text-xs text-club-green"
            >
              {s}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

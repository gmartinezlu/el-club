import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, Headphones, PenLine, UserRoundSearch } from "lucide-react";
import { EmotionalGlass } from "./EmotionalGlass";

const paths = [
  {
    to: "/patient/psychologists",
    label: "PsicÃ³logas",
    description: "Encuentra y agenda sesiÃ³n",
    icon: UserRoundSearch,
  },
  {
    to: "/patient/resources",
    label: "Recursos",
    description: "ArtÃ­culos y guÃ­as curadas",
    icon: BookOpen,
  },
  {
    to: "/patient/meditations",
    label: "Meditar",
    description: "Audios breves para calmar",
    icon: Headphones,
  },
  {
    to: "/patient/journals",
    label: "Journal",
    description: "Escribe con prompts suaves",
    icon: PenLine,
  },
];

export function QuickPathGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {paths.map((item, i) => (
        <motion.div
          key={item.to}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 * i, duration: 0.45, ease: "easeOut" }}
        >
          <Link to={item.to} className="block h-full">
            <EmotionalGlass className="h-full p-5 transition hover:bg-white/55">
              <item.icon
                className="h-5 w-5 text-club-green/80"
                strokeWidth={1.5}
              />
              <p className="mt-4 font-display text-xl text-club-green">
                {item.label}
              </p>
              <p className="mt-1 text-sm text-club-muted">{item.description}</p>
            </EmotionalGlass>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}

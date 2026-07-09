import { motion } from "framer-motion";
import {
  getDailyAffirmation,
  getFirstName,
  getTimeGreeting,
} from "../utils/greetings";

export function WelcomeGreeting({ fullName }: { fullName: string | null }) {
  const greeting = getTimeGreeting();
  const name = getFirstName(fullName);
  const affirmation = getDailyAffirmation();

  return (
    <motion.header
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: "easeOut" }}
      className="space-y-4"
    >
      <p className="text-sm font-medium text-club-green/90">{greeting}</p>
      <h1 className="font-display text-4xl leading-[1.05] tracking-tight text-club-green md:text-5xl">
        {name === "bienvenida" ? "Bienvenida a El Club" : `${greeting}, ${name}`}
      </h1>
      <p className="max-w-xl text-base leading-relaxed text-club-muted md:text-lg">
        Este es tu refugio. Respira, explora y avanza a tu ritmo.
      </p>
      <blockquote className="border-l-2 border-club-cream pl-4 font-display text-xl leading-snug text-club-green/90 md:text-2xl">
        “{affirmation}”
      </blockquote>
    </motion.header>
  );
}

import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CardTitle } from "./../ui/Typography";

export type ExperienceCardData = {
  title: string;
  tag: string;
  date: string;
  category: string;
  image: string;
};

export function ExperienceCard({
  experience,
  index = 0,
}: {
  experience: ExperienceCardData;
  index?: number;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ delay: index * 0.04, duration: 0.45, ease: "easeOut" }}
      className="group overflow-hidden rounded-3xl border border-club-green/10 bg-white/50 shadow-soft backdrop-blur"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={experience.image}
          alt={experience.title}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-club-green/55 via-transparent to-transparent" />
        <span className="absolute left-4 top-4 rounded-full bg-club-paper/90 px-3 py-1 text-xs text-club-green">
          {experience.tag}
        </span>
      </div>
      <div className="space-y-4 p-5">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-club-muted">
            {experience.category} Â· {experience.date}
          </p>
          <CardTitle className="mt-2 text-2xl">
            {experience.title}
          </CardTitle>
        </div>
        <Link
          to="/experiencias"
          className="inline-flex rounded-2xl border border-club-green/15 bg-white/55 px-4 py-2 text-sm text-club-green transition hover:bg-white"
        >
          Ver experiencia
        </Link>
      </div>
    </motion.article>
  );
}

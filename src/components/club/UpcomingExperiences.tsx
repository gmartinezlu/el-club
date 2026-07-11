import { Link } from "react-router-dom";
import { experiences } from "./clubContent";
import { ExperienceCard } from "./ExperienceCard";
import { SectionHeader } from "./SectionHeader";

export function UpcomingExperiences({ limit = 4 }: { limit?: number }) {
  return (
    <section id="experiencias" className="mx-auto w-full max-w-6xl px-5 py-16 md:px-8">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <SectionHeader
          eyebrow="Experiencias EL CLUB"
          title="Espacios para moverte, aprender y conectar."
          subtitle="Talleres, caminatas, cÃ­rculos y prÃ¡cticas guiadas para que el bienestar salga de la pantalla."
        />
        <Link
          to="/experiencias"
          className="inline-flex rounded-2xl border border-club-green/15 bg-white/55 px-5 py-3 text-sm text-club-green shadow-soft transition hover:bg-white"
        >
          Ver calendario
        </Link>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {experiences.slice(0, limit).map((experience, index) => (
          <ExperienceCard key={experience.title} experience={experience} index={index} />
        ))}
      </div>
    </section>
  );
}

import { useMemo, useState } from "react";
import { MarketingLayout } from "../layouts/MarketingLayout";
import { ExperienceCard } from "../components/club/ExperienceCard";
import { SectionHeader } from "../components/club/SectionHeader";
import { experiences } from "../components/club/clubContent";

const FILTERS = ["Todos", "Online", "Presencial", "Taller", "Movimiento", "Comunidad", "Miembros"];

export function ExperiencesPage() {
  const [filter, setFilter] = useState("Todos");
  const filteredExperiences = useMemo(() => {
    if (filter === "Todos") return experiences;
    return experiences.filter(
      (experience) =>
        experience.tag === filter || experience.category === filter,
    );
  }, [filter]);

  return (
    <MarketingLayout>
      <main className="mx-auto w-full max-w-6xl px-5 py-14 md:px-8">
        <SectionHeader
          eyebrow="Experiencias EL CLUB"
          title="Calendario de bienestar, movimiento y comunidad."
          subtitle="Actividades mockeadas por ahora, listas para conectarse a contenido real cuando definamos fechas, cupos y ciudades."
        />

        <div className="mt-8 flex gap-2 overflow-x-auto pb-2">
          {FILTERS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={[
                "shrink-0 rounded-2xl border px-4 py-2 text-sm transition",
                filter === item
                  ? "border-club-green bg-club-green text-club-paper"
                  : "border-club-green/10 bg-white/55 text-club-green hover:bg-white",
              ].join(" ")}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {filteredExperiences.map((experience, index) => (
            <ExperienceCard
              key={experience.title}
              experience={experience}
              index={index}
            />
          ))}
        </div>
      </main>
    </MarketingLayout>
  );
}

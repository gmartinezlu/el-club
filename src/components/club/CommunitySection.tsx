import { ecosystemItems } from "./clubContent";
import { SectionHeader } from "./SectionHeader";

export function CommunitySection() {
  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-16 md:px-8">
      <SectionHeader
        eyebrow="Esto no es solo terapia"
        title="Más que terapia. Un club para cuidar tu vida emocional."
        subtitle="En EL CLUB puedes encontrar profesionales, participar en experiencias, acceder a contenido de bienestar y formar parte de una comunidad guiada que te acompaña dentro y fuera de lo digital."
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ecosystemItems.map((item) => (
          <article
            key={item.title}
            className="rounded-3xl border border-club-green/10 bg-white/50 p-5 shadow-soft backdrop-blur transition hover:translate-y-[-3px] hover:bg-white/55"
          >
            <item.icon className="h-6 w-6 text-club-green" strokeWidth={1.5} />
            <h3 className="mt-5 font-display text-2xl leading-tight text-club-green">
              {item.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-club-muted">
              {item.text}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

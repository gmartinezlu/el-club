import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { MarketingLayout } from "../layouts/MarketingLayout";

const CONTENT = {
  privacy: {
    eyebrow: "Privacidad",
    title: "Cuidar tus datos también es cuidar tu proceso",
    intro:
      "El Club está pensado para manejar información sensible con respeto, claridad y permisos por rol.",
    sections: [
      [
        "Información que usamos",
        "Datos de cuenta, perfil, citas, journals, preferencias emocionales y mensajes de soporte necesarios para operar la plataforma.",
      ],
      [
        "Quién puede verla",
        "Personas, psicólogas y administración tienen accesos separados. La información clínica y las notas privadas no se mezclan con espacios públicos.",
      ],
      [
        "Seguridad",
        "La autenticación, las políticas de Supabase y los permisos por rol son la base técnica para proteger el acceso.",
      ],
    ],
  },
  terms: {
    eyebrow: "Términos",
    title: "Un acuerdo simple para usar El Club con confianza",
    intro:
      "Estos términos resumen la experiencia esperada mientras la plataforma avanza hacia su versión productiva.",
    sections: [
      [
        "Servicio",
        "El Club conecta personas con psicólogas, recursos emocionales, journaling y sesiones por Google Meet.",
      ],
      [
        "Pagos",
        "EL CLUB facilita la conexión entre personas y psicólogas. Los pagos por sesiones son gestionados directamente entre la persona y la psicóloga. EL CLUB no actúa como intermediario financiero ni procesa pagos de terapia.",
      ],
      [
        "Uso responsable",
        "La plataforma acompaña procesos de bienestar emocional, pero no reemplaza servicios de emergencia.",
      ],
    ],
  },
};

export function LegalPage({ type }: { type: "privacy" | "terms" }) {
  const content = CONTENT[type];

  return (
    <MarketingLayout>
      <main className="mx-auto w-full max-w-5xl px-5 py-16 md:px-8">
        <div className="rounded-3xl border border-club-green/10 bg-white/50 p-6 shadow-soft backdrop-blur md:p-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-club-green/10 text-club-green">
            <ShieldCheck className="h-6 w-6" strokeWidth={1.5} />
          </div>
          <p className="mt-6 text-sm font-medium text-club-green">
            {content.eyebrow}
          </p>
          <h1 className="mt-2 max-w-3xl font-display text-4xl leading-tight text-club-green md:text-5xl">
            {content.title}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-club-muted">
            {content.intro}
          </p>

          <div className="mt-8 grid gap-4">
            {content.sections.map(([title, body]) => (
              <section
                key={title}
                className="rounded-3xl border border-club-green/10 bg-white/50 p-5"
              >
                <h2 className="font-display text-2xl text-club-green">
                  {title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-club-muted">
                  {body}
                </p>
              </section>
            ))}
          </div>

          <Link
            to="/"
            className="mt-8 inline-flex rounded-2xl bg-club-green px-5 py-3 text-sm text-club-paper transition hover:opacity-95"
          >
            Volver al inicio
          </Link>
        </div>
      </main>
    </MarketingLayout>
  );
}

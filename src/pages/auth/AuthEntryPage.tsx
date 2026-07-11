import { Link } from "react-router-dom";

const PORTALS = [
  {
    title: "Mi espacio",
    description: "Terapia, recursos emocionales, journals y sesiones.",
    loginTo: "/auth/patient/login",
    registerTo: "/auth/patient/register",
  },
  {
    title: "Especialistas",
    description: "Agenda, personas activas, notas, disponibilidad e ingresos.",
    loginTo: "/auth/psychologist/login",
    registerTo: "/auth/psychologist/register",
  },
  {
    title: "Admin",
    description: "Aprobaciones, contenido, soporte y operacion de El Club.",
    loginTo: "/auth/admin/login",
    registerTo: null,
  },
];

const PORTAL_COPY = {
  all: {
    title: "Entra a El Club",
    description: "Elige el espacio que corresponde a tu experiencia.",
    portals: PORTALS,
  },
  patient: {
    title: "Tu espacio en El Club",
    description: "Inicia sesiÃ³n o crea tu cuenta para empezar con calma.",
    portals: [PORTALS[0]],
  },
  psychologist: {
    title: "Espacio especialista",
    description: "Accede o registra tu perfil profesional en El Club.",
    portals: [PORTALS[1]],
  },
};

export function AuthEntryPage({
  portal = "all",
}: {
  portal?: keyof typeof PORTAL_COPY;
}) {
  const copy = PORTAL_COPY[portal];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-club-green">
          {copy.title}
        </h1>
        <p className="mt-2 text-sm text-club-muted">{copy.description}</p>
      </div>

      <div className="grid gap-4">
        {copy.portals.map((portalItem) => (
          <div
            key={portalItem.title}
            className="rounded-3xl border border-club-green/10 bg-white/45 p-5 shadow-soft backdrop-blur"
          >
            <h2 className="font-display text-2xl text-club-green">
              {portalItem.title}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-club-muted">
              {portalItem.description}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                to={portalItem.loginTo}
                className="rounded-2xl border border-club-green/15 bg-white/60 px-4 py-2 text-sm text-club-green transition hover:bg-white/80"
              >
                Iniciar sesiÃ³n
              </Link>
              {portalItem.registerTo ? (
                <Link
                  to={portalItem.registerTo}
                  className="rounded-2xl bg-club-green px-4 py-2 text-sm text-club-paper transition hover:opacity-95"
                >
                  Registrarme
                </Link>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

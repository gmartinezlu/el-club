import { NavLink, Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import { useSessionStore } from "../../store/sessionStore";

const NAV = [
  { to: "/patient", label: "Inicio", end: true },
  { to: "/patient/psychologists", label: "PsicÃ³logas", end: false },
  { to: "/patient/resources", label: "Recursos", end: false },
  { to: "/patient/journals", label: "Journal", end: false },
  { to: "/patient/meditations", label: "Meditar", end: false },
  { to: "/patient/sessions", label: "Historial", end: false },
  { to: "/patient/crisis-chat", label: "Chat crisis", end: false },
  { to: "/patient/notifications", label: "Avisos", end: false },
  { to: "/patient/settings", label: "Ajustes", end: false },
];

export function PatientShell() {
  const fullName = useSessionStore((s) => s.fullName);
  const signOut = useSessionStore((s) => s.signOut);

  return (
    <div className="min-h-dvh">
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        aria-hidden
        style={{
          background: `
            radial-gradient(900px 500px at 0% 0%, rgba(234, 218, 200, 0.55), transparent 55%),
            radial-gradient(700px 400px at 100% 20%, rgba(8, 71, 57, 0.06), transparent 50%),
            linear-gradient(180deg, var(--club-paper) 0%, var(--club-sand) 100%)
          `,
        }}
      />

      <header className="sticky top-0 z-20 border-b border-club-green/5 bg-white/30 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-4 md:px-8">
          <div>
            <p className="font-display text-2xl text-club-green">El Club</p>
            <p className="text-xs text-club-muted">tu refugio emocional</p>
          </div>
          <div className="flex items-center gap-4">
            <p className="hidden text-sm text-club-muted sm:block">
              {fullName ?? "Paciente"}
            </p>
            <button
              type="button"
              onClick={() => void signOut()}
              className="text-sm text-club-muted transition hover:text-club-green"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-8 px-5 py-8 md:grid-cols-[200px,1fr] md:px-8 md:py-10">
        <aside className="md:sticky md:top-24 md:self-start">
          <nav className="flex flex-row gap-2 overflow-x-auto pb-2 md:flex-col md:gap-1 md:overflow-visible md:pb-0">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  [
                    "whitespace-nowrap rounded-2xl px-4 py-2.5 text-sm transition",
                    isActive
                      ? "bg-club-green/10 font-medium text-club-green"
                      : "text-club-muted hover:bg-white/50 hover:text-club-green",
                  ].join(" ")
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="min-w-0 pb-16"
        >
          <Outlet />
        </motion.main>
      </div>
    </div>
  );
}

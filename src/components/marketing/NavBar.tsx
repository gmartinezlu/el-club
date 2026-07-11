import { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

const LINKS = [
  { href: "#beneficios", label: "Beneficios" },
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#psicólogas", label: "psicólogas" },
  { href: "#recursos", label: "Recursos" },
];

export function NavBar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-club-green/10 bg-white/70 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-4 md:px-8">
        <a href="/" className="group inline-flex items-baseline gap-2">
          <span className="font-display text-2xl leading-none text-club-green">
            El Club
          </span>
          <span className="hidden text-sm text-club-muted sm:inline">
            salud mental premium
          </span>
        </a>

        <nav className="hidden items-center gap-6 text-sm text-club-muted md:flex">
          {LINKS.map((link) => (
            <a
              key={link.href}
              className="transition hover:text-club-green"
              href={link.href}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            to="/auth/patient/login"
            className="hidden rounded-2xl border border-club-green/15 bg-white/40 px-4 py-2 text-sm text-club-green shadow-soft backdrop-blur transition hover:translate-y-[-1px] sm:inline-flex"
          >
            Iniciar sesiÃ³n
          </Link>
          <Link
            to="/auth/patient/register"
            className="hidden rounded-2xl bg-club-green px-4 py-2 text-sm text-club-paper shadow-soft transition hover:translate-y-[-1px] hover:opacity-95 sm:inline-flex"
          >
            Empezar
          </Link>

          <button
            type="button"
            aria-label={open ? "Cerrar menu" : "Abrir menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-club-green/15 bg-white/40 text-club-green shadow-soft backdrop-blur md:hidden"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
            >
              {open ? (
                <path
                  d="M5 5l10 10M15 5L5 15"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              ) : (
                <path
                  d="M3 6h14M3 10h14M3 14h14"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden border-t border-club-green/10 bg-white/90 backdrop-blur md:hidden"
          >
            <div className="flex flex-col gap-1 px-5 py-4">
              {LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-3 py-3 text-base text-club-ink transition hover:bg-club-green/5 hover:text-club-green"
                >
                  {link.label}
                </a>
              ))}
              <div className="mt-2 flex flex-col gap-2 border-t border-club-green/10 pt-3">
                <Link
                  to="/auth/patient/login"
                  onClick={() => setOpen(false)}
                  className="rounded-2xl border border-club-green/15 bg-white/60 px-4 py-3 text-center text-sm text-club-green shadow-soft"
                >
                  Iniciar sesiÃ³n
                </Link>
                <Link
                  to="/auth/patient/register"
                  onClick={() => setOpen(false)}
                  className="rounded-2xl bg-club-green px-4 py-3 text-center text-sm text-club-paper shadow-soft"
                >
                  Empezar
                </Link>
              </div>
            </div>
          </motion.nav>
        ) : null}
      </AnimatePresence>
    </header>
  );
}

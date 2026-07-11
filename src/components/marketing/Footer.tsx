import { Link } from "react-router-dom";

const FOOTER_LINKS = [
  { label: "Experiencias", to: "/experiencias" },
  { label: "Terapia", to: "/terapia" },
  { label: "Comunidad", to: "/comunidad" },
  { label: "Para psicÃ³logos", to: "/para-psicologos" },
  { label: "Blog", to: "/blog" },
  { label: "Contacto", to: "/soporte" },
  { label: "Privacidad", to: "/privacidad" },
  { label: "TÃ©rminos", to: "/terminos" },
];

export function Footer() {
  return (
    <footer className="border-t border-club-green/10 bg-club-green text-club-paper">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-12 md:grid-cols-[1fr,1.2fr] md:px-8">
        <div>
          <p className="font-display text-4xl">EL CLUB</p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-club-paper/70">
            Un club premium de bienestar emocional: terapia, experiencias,
            comunidad guiada y contenido para sentirte acompaÃ±ado.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              className="rounded-2xl border border-club-paper/20 px-4 py-2 text-sm transition hover:bg-white/10"
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
            >
              Instagram
            </a>
            <a
              className="rounded-2xl border border-club-paper/20 px-4 py-2 text-sm transition hover:bg-white/10"
              href="https://wa.me/"
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp
            </a>
            <Link
              className="rounded-2xl border border-club-paper/20 px-4 py-2 text-sm transition hover:bg-white/10"
              to="/auth/admin/login"
            >
              Admin
            </Link>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {FOOTER_LINKS.map((link) => (
            <Link
              key={link.label}
              className="text-sm text-club-paper/75 transition hover:text-club-paper"
              to={link.to}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}

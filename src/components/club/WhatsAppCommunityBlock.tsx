import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { clubImages, communityPrinciples } from "./clubContent";

export function WhatsAppCommunityBlock({ compact = false }: { compact?: boolean }) {
  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-16 md:px-8">
      <div className="grid overflow-hidden rounded-3xl border border-club-green/10 bg-white/40 shadow-soft backdrop-blur lg:grid-cols-[0.95fr,1.05fr]">
        <div className="relative min-h-[360px]">
          <img
            src={clubImages.community}
            alt="Personas reunidas en una experiencia de comunidad"
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-club-green/30" />
        </div>
        <div className="p-6 md:p-10">
          <p className="text-sm font-medium text-club-green">Comunidad</p>
          <h2 className="mt-2 font-display text-4xl leading-tight text-club-green md:text-5xl">
            Una comunidad cercana, pero segura.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-club-muted">
            Los miembros de EL CLUB acceden a canales y grupos de WhatsApp
            moderados, donde reciben contenido, invitaciones a eventos, retos y
            acompañamiento guiado. Sin chats privados dentro de la plataforma,
            sin foros abiertos y con reglas claras de cuidado.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {communityPrinciples.slice(0, compact ? 4 : 6).map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-3 rounded-2xl bg-white/55 px-4 py-3 text-sm text-club-green"
              >
                <item.icon className="h-4 w-4" strokeWidth={1.6} />
                {item.label}
              </div>
            ))}
          </div>

          <div className="mt-7 rounded-2xl border border-club-green/10 bg-club-green/5 p-4">
            <div className="flex gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-club-green" />
              <p className="text-sm leading-relaxed text-club-muted">
                La comunidad no reemplaza la terapia ni promueve consejos entre
                miembros como guía clínica. Es un espacio moderado de
                pertenencia, hábitos y experiencias.
              </p>
            </div>
          </div>

          <Link
            to="/comunidad"
            className="mt-7 inline-flex rounded-2xl bg-club-green px-5 py-3 text-sm text-club-paper shadow-soft transition hover:translate-y-[-1px]"
          >
            Entrar a la comunidad
          </Link>
        </div>
      </div>
    </section>
  );
}

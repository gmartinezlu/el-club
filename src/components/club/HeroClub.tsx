import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, CalendarHeart, Sparkles, Users } from "lucide-react";
import { clubImages } from "./clubContent";

export function HeroClub() {
  return (
    <section className="mx-auto grid min-h-[calc(100dvh-76px)] w-full max-w-6xl items-center gap-8 px-5 py-8 md:grid-cols-[0.95fr,1.05fr] md:px-8 md:py-12">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className="space-y-7"
      >
        <span className="inline-flex rounded-full border border-club-green/10 bg-white/50 px-4 py-2 text-sm text-club-green shadow-soft backdrop-blur">
          Bienestar emocional, comunidad y experiencias guiadas
        </span>

        <div className="space-y-5">
          <h1 className="font-display text-5xl leading-[0.92] text-club-green sm:text-6xl md:text-7xl">
            Tu refugio emocional para crecer, conectar y sentirte mejor.
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-club-muted sm:text-lg">
            EL CLUB combina bienestar emocional, experiencias guiadas,
            comunidad y acompañamiento profesional para ayudarte a construir una
            vida más tranquila, consciente y acompañada.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link
            to="/auth/patient/register"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-club-green px-6 py-3 text-base text-club-paper shadow-soft transition hover:translate-y-[-1px] hover:opacity-95"
          >
            Unirme a EL CLUB
            <ArrowRight className="h-4 w-4" strokeWidth={1.7} />
          </Link>
          <Link
            to="/experiencias"
            className="rounded-2xl border border-club-green/15 bg-white/55 px-6 py-3 text-center text-base text-club-green shadow-soft backdrop-blur transition hover:translate-y-[-1px]"
          >
            Explorar experiencias
          </Link>
          <Link
            to="/terapia"
            className="rounded-2xl border border-club-green/15 bg-white/35 px-6 py-3 text-center text-base text-club-green shadow-soft backdrop-blur transition hover:translate-y-[-1px]"
          >
            Reservar una sesión
          </Link>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.6, ease: "easeOut" }}
        className="relative min-h-[560px] overflow-hidden rounded-3xl shadow-soft"
      >
        {clubImages.heroVideo ? (
          <video
            className="absolute inset-0 h-full w-full object-cover"
            poster={clubImages.hero}
            autoPlay
            muted
            loop
            playsInline
          >
            <source src={clubImages.heroVideo} type="video/mp4" />
          </video>
        ) : (
          <img
            src={clubImages.hero}
            alt="Personas jóvenes adultas compartiendo en un ambiente cálido"
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-club-green/75 via-club-green/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5 md:p-7">
          <div className="grid gap-3 sm:grid-cols-3">
            <HeroMetric icon={Users} value="Comunidad" label="moderada" />
            <HeroMetric icon={CalendarHeart} value="Eventos" label="guiados" />
            <HeroMetric icon={Sparkles} value="Hábitos" label="emocionales" />
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function HeroMetric({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Users;
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-3xl border border-white/20 bg-club-paper/85 p-4 text-club-green backdrop-blur">
      <Icon className="h-5 w-5" strokeWidth={1.5} />
      <p className="mt-3 font-display text-2xl leading-none">{value}</p>
      <p className="text-xs text-club-muted">{label}</p>
    </div>
  );
}

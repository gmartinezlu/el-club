import { motion } from "framer-motion";

export function ManifestoSection() {
  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-16 md:px-8">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className="rounded-3xl bg-club-green p-7 text-club-paper shadow-soft md:p-12"
      >
        <p className="max-w-5xl font-display text-4xl leading-tight md:text-6xl">
          Creemos que cuidar la mente no debería sentirse frío, lejano ni
          solitario.
        </p>
        <p className="mt-6 max-w-3xl text-base leading-relaxed text-club-paper/75 md:text-lg">
          Creemos en la terapia, pero también en caminar, conversar, respirar,
          moverse, aprender y compartir. EL CLUB existe para que el bienestar
          emocional se sienta más humano, más cercano y más parte de tu vida
          diaria.
        </p>
      </motion.div>
    </section>
  );
}

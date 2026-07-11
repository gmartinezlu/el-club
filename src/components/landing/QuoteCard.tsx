import { motion } from "framer-motion";

export function QuoteCard({
  quote,
  name,
  context,
  tone = "light",
}: {
  quote: string;
  name: string;
  context: string;
  tone?: "light" | "dark";
}) {
  const isDark = tone === "dark";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className={
        "rounded-3xl border p-6 transition-all duration-300 hover:-translate-y-1 " +
        (isDark
          ? "border-club-cream/15 bg-club-paper/10 hover:border-club-cream/25"
          : "border-club-green/10 bg-white/60 hover:border-club-green/20 hover:shadow-soft")
      }
    >
      <p className="font-display text-2xl leading-none text-club-brass">
        &ldquo;
      </p>
      <p
        className={
          "-mt-3 text-sm leading-relaxed " +
          (isDark ? "text-club-cream/85" : "text-club-muted")
        }
      >
        {quote}
      </p>
      <div className="mt-4 flex items-center gap-3">
        <div
          className={
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl font-display text-sm " +
            (isDark
              ? "bg-club-cream/10 text-club-cream"
              : "bg-club-green/10 text-club-green")
          }
        >
          {name.charAt(0)}
        </div>
        <div className="leading-tight">
          <p
            className={
              isDark ? "font-medium text-club-cream" : "font-medium text-club-ink"
            }
          >
            {name}
          </p>
          <p
            className={
              isDark ? "text-xs text-club-cream/60" : "text-xs text-club-muted"
            }
          >
            {context}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

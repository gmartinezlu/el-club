import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { BreathLine } from "./BreathLine";

export function Section({
  id,
  eyebrow,
  title,
  subtitle,
  children,
  tone = "light",
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  tone?: "light" | "dark";
}) {
  const isDark = tone === "dark";

  return (
    <section
      id={id}
      className={
        isDark
          ? "bg-club-green py-16 text-club-paper md:py-20"
          : "py-16 md:py-20"
      }
    >
      <div className="mx-auto w-full max-w-6xl px-5 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="space-y-3"
        >
          {eyebrow ? (
            <p
              className={
                "text-sm font-medium tracking-wide " +
                (isDark ? "text-club-cream" : "text-club-brass")
              }
            >
              {eyebrow}
            </p>
          ) : null}
          <h2
            className={
              "font-display text-4xl leading-tight md:text-5xl " +
              (isDark ? "text-club-cream" : "text-club-green")
            }
          >
            {title}
          </h2>
          {subtitle ? (
            <p
              className={
                "max-w-2xl text-sm leading-relaxed md:text-base " +
                (isDark ? "text-club-cream/75" : "text-club-muted")
              }
            >
              {subtitle}
            </p>
          ) : null}
          <BreathLine
            className={
              "h-4 w-28 " +
              (isDark ? "text-club-cream/40" : "text-club-brass/60")
            }
          />
        </motion.div>

        <div className="mt-10">{children}</div>
      </div>
    </section>
  );
}

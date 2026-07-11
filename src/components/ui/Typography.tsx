import type { ComponentPropsWithoutRef } from "react";
import { cn } from "../../lib/cn";

/**
 * Sistema tipográfico EL CLUB.
 * Magic Retro (font-display) es exclusivo de H1/H2/H3 — nunca párrafos,
 * botones, labels, microcopy ni tamaños chicos. Gorditas (font-text) cubre
 * todo lo demás vía la cascada por defecto en index.css. `Highlight` marca
 * énfasis puntual dentro de una frase, no bloques enteros.
 */

export function PageTitle({
  className,
  ...props
}: ComponentPropsWithoutRef<"h1">) {
  return (
    <h1
      className={cn(
        "font-display text-3xl text-club-green md:text-4xl",
        className,
      )}
      {...props}
    />
  );
}

export function SectionTitle({
  className,
  ...props
}: ComponentPropsWithoutRef<"h2">) {
  return (
    <h2
      className={cn(
        "font-display text-2xl text-club-green md:text-3xl",
        className,
      )}
      {...props}
    />
  );
}

export function CardTitle({
  className,
  ...props
}: ComponentPropsWithoutRef<"h3">) {
  return (
    <h3
      className={cn("font-display text-xl text-club-green", className)}
      {...props}
    />
  );
}

export function Highlight({
  className,
  ...props
}: ComponentPropsWithoutRef<"span">) {
  return <span className={cn("font-bold", className)} {...props} />;
}

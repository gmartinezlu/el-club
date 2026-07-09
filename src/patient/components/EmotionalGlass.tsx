import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

export function EmotionalGlass({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border border-club-green/10 bg-white/40 shadow-soft backdrop-blur-md",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-club-cream/50 via-white/0 to-transparent"
        aria-hidden
      />
      <div className="relative">{children}</div>
    </div>
  );
}

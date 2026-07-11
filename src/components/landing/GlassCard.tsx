import type { ReactNode } from "react";

export function GlassCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "rounded-3xl border border-club-green/10 bg-white/60 p-6 transition-all duration-300",
        "hover:-translate-y-1 hover:border-club-green/20 hover:shadow-soft",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}


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
        "rounded-3xl border border-club-green/10 bg-white/35 p-6 shadow-soft backdrop-blur transition",
        "hover:bg-white/45",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}


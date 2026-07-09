import type { ReactNode } from "react";
import { GlassCard } from "./GlassCard";

export function FeatureCard({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon?: ReactNode;
}) {
  return (
    <GlassCard className="group">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h3 className="font-display text-xl text-club-green">{title}</h3>
          <p className="text-sm leading-relaxed text-club-muted">
            {description}
          </p>
        </div>
        {icon ? <div className="shrink-0 text-club-green/80">{icon}</div> : null}
      </div>
    </GlassCard>
  );
}


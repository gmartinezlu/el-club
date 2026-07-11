import type { ReactNode } from "react";
import { GlassCard } from "./GlassCard";
import { CardTitle } from "../ui/Typography";

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
      <div className="space-y-3">
        {icon ? (
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-club-green/8 text-club-green transition-colors group-hover:bg-club-green/12">
            {icon}
          </div>
        ) : null}
        <CardTitle>{title}</CardTitle>
        <p className="text-sm leading-relaxed text-club-muted">
          {description}
        </p>
      </div>
    </GlassCard>
  );
}


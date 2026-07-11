import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "../../lib/cn";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; to: string };
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-3xl border border-club-green/10 bg-white/50 p-8 text-center shadow-soft backdrop-blur",
        className,
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-club-green/10 text-club-green">
        <Icon className="h-6 w-6" strokeWidth={1.5} />
      </div>
      <p className="font-display text-xl text-club-green">{title}</p>
      {description ? (
        <p className="max-w-md text-sm leading-relaxed text-club-muted">
          {description}
        </p>
      ) : null}
      {action ? (
        <Link
          to={action.to}
          className="mt-2 inline-flex rounded-2xl border border-club-green/15 bg-white/70 px-5 py-2.5 text-sm text-club-green transition hover:bg-white/90"
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}

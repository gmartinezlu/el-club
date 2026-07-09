import { Check } from "lucide-react";
import { Link } from "react-router-dom";
import type { MembershipPlan } from "../../memberships/plans";
import { formatCop } from "../../memberships/plans";

export function MembershipCard({ plan }: { plan: MembershipPlan }) {
  return (
    <article
      className={[
        "rounded-3xl border p-6 shadow-soft backdrop-blur transition hover:translate-y-[-3px]",
        plan.featured
          ? "border-club-green/20 bg-club-green text-club-paper"
          : "border-club-green/10 bg-white/45 text-club-green",
      ].join(" ")}
    >
      <p
        className={[
          "text-xs uppercase tracking-[0.18em]",
          plan.featured ? "text-club-paper/65" : "text-club-muted",
        ].join(" ")}
      >
        {plan.eyebrow}
      </p>
      <h3 className="mt-3 font-display text-3xl">{plan.name}</h3>
      <p className="mt-2 font-display text-4xl">
        {formatCop(plan.amountCop)}
      </p>
      <p
        className={[
          "mt-3 text-sm leading-relaxed",
          plan.featured ? "text-club-paper/75" : "text-club-muted",
        ].join(" ")}
      >
        {plan.description}
      </p>
      <ul className="mt-6 space-y-3">
        {plan.features.map((feature) => (
          <li key={feature} className="flex gap-3 text-sm">
            <Check className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.8} />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <Link
        to={`/patient/membership/checkout/${plan.code}`}
        className={[
          "mt-7 inline-flex w-full justify-center rounded-2xl px-4 py-3 text-sm transition",
          plan.featured
            ? "bg-club-paper text-club-green hover:opacity-95"
            : "bg-club-green text-club-paper hover:opacity-95",
        ].join(" ")}
      >
        {plan.cta}
      </Link>
    </article>
  );
}

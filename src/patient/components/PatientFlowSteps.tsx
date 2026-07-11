import { Check } from "lucide-react";

const STEPS = ["Bienvenida", "Especialista", "Agenda", "Solicitud", "sesión"];

export function PatientFlowSteps({ current }: { current: number }) {
  return (
    <div className="rounded-3xl border border-club-green/10 bg-white/50 p-3 shadow-soft backdrop-blur">
      <ol className="grid gap-2 sm:grid-cols-5">
        {STEPS.map((step, index) => {
          const active = index === current;
          const done = index < current;
          return (
            <li
              key={step}
              className={[
                "flex items-center gap-2 rounded-2xl px-3 py-2 text-xs transition",
                active
                  ? "bg-club-green text-club-paper"
                  : done
                    ? "bg-club-green/10 text-club-green"
                    : "bg-white/50 text-club-muted",
              ].join(" ")}
            >
              <span
                className={[
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px]",
                  active
                    ? "bg-white/20"
                    : done
                      ? "bg-club-green text-club-paper"
                      : "bg-club-green/10 text-club-green",
                ].join(" ")}
              >
                {done ? <Check className="h-3 w-3" strokeWidth={1.8} /> : index + 1}
              </span>
              <span className="truncate">{step}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

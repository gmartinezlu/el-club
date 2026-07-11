import { useEffect, useRef, useState } from "react";

type TourStep = {
  title: string;
  body: string;
};

const TOUR_STEPS: Record<"patient" | "psychologist", TourStep[]> = {
  patient: [
    {
      title: "Encuentra a tu psicóloga",
      body: "Explora los perfiles en \"Psicólogas\", revisa su enfoque y elige un horario disponible que te acomode.",
    },
    {
      title: "Reserva y coordina el pago",
      body: "Al solicitar una cita, la psicóloga la confirma y coordina el pago directamente contigo. EL CLUB no procesa el dinero de las sesiones.",
    },
    {
      title: "Acompañamiento entre sesiones",
      body: "Usa el chat de apoyo, tu journal y las meditaciones cuando lo necesites. Si hay riesgo inmediato, contacta servicios de emergencia.",
    },
  ],
  psychologist: [
    {
      title: "Publica tu disponibilidad",
      body: "En \"Disponibilidad\" define los horarios en los que puedes atender. Las personas solo verán los espacios que dejes abiertos.",
    },
    {
      title: "Confirma y cobra tus sesiones",
      body: "Cuando alguien solicite una cita, revísala en \"Agenda\", confírmala y coordina el cobro directamente con la persona.",
    },
    {
      title: "Notas y chat de apoyo",
      body: "Lleva tus notas privadas por cita en \"Notas\" y usa el chat de apoyo para acompañamiento entre sesiones.",
    },
  ],
};

export function OnboardingTour({
  role,
  onClose,
}: {
  role: "patient" | "psychologist";
  onClose: () => void;
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const steps = TOUR_STEPS[role];
  const step = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;
  const titleId = "onboarding-tour-title";

  useEffect(() => {
    panelRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-club-green/25 p-4 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-md rounded-3xl border border-club-green/10 bg-club-paper p-6 shadow-soft outline-none"
      >
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-club-muted">
          Paso {stepIndex + 1} de {steps.length}
        </p>
        <h2 id={titleId} className="mt-2 font-display text-2xl text-club-green">
          {step.title}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-club-muted">
          {step.body}
        </p>

        <div className="mt-6 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-club-muted transition hover:text-club-green"
          >
            Saltar
          </button>
          <button
            type="button"
            onClick={() => (isLast ? onClose() : setStepIndex((i) => i + 1))}
            className="rounded-2xl bg-club-green px-4 py-2 text-sm text-club-paper transition hover:opacity-95"
          >
            {isLast ? "Entendido" : "Siguiente"}
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Sparkles } from "lucide-react";
import { savePatientOnboarding } from "../onboarding/service";
import { useSessionStore } from "../../store/sessionStore";
import { getErrorMessage } from "../../utils/errors";
import { EmotionalGlass } from "../components/EmotionalGlass";
import { PatientFlowSteps } from "../components/PatientFlowSteps";
import { Highlight, PageTitle } from "../../components/ui/Typography";

const CONCERNS = [
  "Ansiedad",
  "Autoestima",
  "Duelo",
  "Estrés",
  "Relaciones",
  "Burnout",
];

const GOALS = [
  "Entender lo que siento",
  "Regular ansiedad",
  "Poner límites",
  "Dormir mejor",
  "Sentirme acompañada",
  "Procesar un cambio",
];

const PREFERENCES = [
  "Cálida",
  "Directa",
  "Con ejercicios",
  "Más conversacional",
  "Con seguimiento",
  "Ritmo suave",
];

const URGENCY = ["Estoy bien, quiero empezar", "Necesito apoyo pronto", "Me siento muy cargada"];
const SUPPORT_STYLE = ["Escucha y contención", "Herramientas prácticas", "Explorar a profundidad"];

function toggleValue(values: string[], value: string): string[] {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

export function PatientOnboardingPage() {
  const navigate = useNavigate();
  const patientId = useSessionStore((s) => s.user?.id);
  const [mainConcern, setMainConcern] = useState("");
  const [emotionalGoals, setEmotionalGoals] = useState<string[]>([]);
  const [therapyPreferences, setTherapyPreferences] = useState<string[]>([]);
  const [currentMood, setCurrentMood] = useState("6");
  const [urgency, setUrgency] = useState("");
  const [supportStyle, setSupportStyle] = useState("");
  const [onboardingNotes, setOnboardingNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!patientId) return;
    setSaving(true);
    setError(null);
    try {
      await savePatientOnboarding({
        patientId,
        mainConcern: mainConcern || null,
        emotionalGoals,
        therapyPreferences,
        currentMood: currentMood ? Number(currentMood) : null,
        urgency: urgency || null,
        supportStyle: supportStyle || null,
        onboardingNotes: onboardingNotes.trim() || null,
      });
      navigate("/patient/psychologists", { replace: true });
    } catch (e2) {
      setError(getErrorMessage(e2, "No pudimos guardar tu bienvenida"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <PatientFlowSteps current={0} />

      <header className="space-y-2">
        <p className="text-sm font-medium text-club-green">Bienvenida</p>
        <PageTitle>Cuéntanos cómo llegas hoy</PageTitle>
        <p className="max-w-2xl text-sm leading-relaxed text-club-muted">
          Esto nos ayuda a hacer tu experiencia <Highlight>más humana</Highlight> desde el primer paso.
        </p>
      </header>

      {error ? (
        <p className="rounded-2xl border border-red-200/80 bg-red-50/40 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-5">
        <EmotionalGlass className="p-6">
          <SectionTitle icon={Heart} title="¿Qué te gustaría trabajar?" />
          <OptionGrid
            options={CONCERNS}
            selected={mainConcern ? [mainConcern] : []}
            onSelect={(value) => setMainConcern(value)}
            single
          />
        </EmotionalGlass>

        <EmotionalGlass className="p-6">
          <SectionTitle icon={Sparkles} title="Objetivos emocionales" />
          <OptionGrid
            options={GOALS}
            selected={emotionalGoals}
            onSelect={(value) =>
              setEmotionalGoals((current) => toggleValue(current, value))
            }
          />
        </EmotionalGlass>

        <EmotionalGlass className="p-6">
          <SectionTitle icon={Sparkles} title="¿Cómo te gustaría sentir el acompañamiento?" />
          <OptionGrid
            options={PREFERENCES}
            selected={therapyPreferences}
            onSelect={(value) =>
              setTherapyPreferences((current) => toggleValue(current, value))
            }
          />
        </EmotionalGlass>

        <div className="grid gap-5 lg:grid-cols-3">
          <EmotionalGlass className="p-6">
            <label className="space-y-3">
              <span className="text-base font-semibold text-club-green">
                Mood hoy
              </span>
              <select
                value={currentMood}
                onChange={(e) => setCurrentMood(e.target.value)}
                className="w-full rounded-2xl border border-club-green/10 bg-white/60 px-4 py-3 text-sm text-club-ink outline-none ring-club-green/10 focus:ring-2"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                  <option key={value} value={value}>
                    {value}/10
                  </option>
                ))}
              </select>
            </label>
          </EmotionalGlass>

          <EmotionalGlass className="p-6 lg:col-span-2">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-3">
                <span className="text-base font-semibold text-club-green">
                  Ritmo
                </span>
                <select
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value)}
                  className="w-full rounded-2xl border border-club-green/10 bg-white/60 px-4 py-3 text-sm text-club-ink outline-none ring-club-green/10 focus:ring-2"
                >
                  <option value="">Selecciona</option>
                  {URGENCY.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-3">
                <span className="text-base font-semibold text-club-green">
                  Estilo
                </span>
                <select
                  value={supportStyle}
                  onChange={(e) => setSupportStyle(e.target.value)}
                  className="w-full rounded-2xl border border-club-green/10 bg-white/60 px-4 py-3 text-sm text-club-ink outline-none ring-club-green/10 focus:ring-2"
                >
                  <option value="">Selecciona</option>
                  {SUPPORT_STYLE.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </EmotionalGlass>
        </div>

        <EmotionalGlass className="p-6">
          <label className="space-y-3">
            <span className="text-base font-semibold text-club-green">
              Algo más que quieras nombrar
            </span>
            <textarea
              value={onboardingNotes}
              onChange={(e) => setOnboardingNotes(e.target.value)}
              rows={4}
              placeholder="Puedes escribirlo con tus palabras. Sin presión."
              className="w-full resize-none rounded-2xl border border-club-green/10 bg-white/60 px-4 py-3 text-sm leading-relaxed text-club-ink outline-none ring-club-green/10 focus:ring-2"
            />
          </label>
        </EmotionalGlass>

        <button
          type="submit"
          disabled={saving || !mainConcern || emotionalGoals.length === 0}
          className="w-full rounded-2xl bg-club-green px-5 py-3 text-sm text-club-paper shadow-soft transition hover:opacity-95 disabled:opacity-60"
        >
          {saving ? "Guardando..." : "Continuar a especialistas"}
        </button>
      </form>
    </div>
  );
}

function SectionTitle({
  icon: Icon,
  title,
}: {
  icon: typeof Heart;
  title: string;
}) {
  return (
    <div className="mb-4 flex items-center gap-2 text-club-green">
      <Icon className="h-5 w-5" strokeWidth={1.5} />
      <h2 className="font-display text-xl">{title}</h2>
    </div>
  );
}

function OptionGrid({
  options,
  selected,
  onSelect,
  single = false,
}: {
  options: string[];
  selected: string[];
  onSelect: (value: string) => void;
  single?: boolean;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {options.map((option) => {
        const active = selected.includes(option);
        return (
          <button
            key={option}
            type="button"
            aria-pressed={active}
            onClick={() => onSelect(option)}
            className={[
              "rounded-2xl border px-4 py-3 text-left text-sm transition",
              active
                ? "border-club-green/25 bg-club-green/10 text-club-green"
                : "border-club-green/10 bg-white/55 text-club-muted hover:bg-white/80",
            ].join(" ")}
          >
            {option}
            {single && active ? (
              <span className="ml-2 text-xs text-club-green">seleccionado</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

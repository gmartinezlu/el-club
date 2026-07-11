import { useCallback, useEffect, useState } from "react";
import { Save, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  fetchPatientOnboarding,
  savePatientOnboarding,
} from "../onboarding/service";
import { updateUserProfile } from "../../services/supabase/users";
import { useSessionStore } from "../../store/sessionStore";
import { getErrorMessage } from "../../utils/errors";
import { EmotionalGlass } from "../components/EmotionalGlass";
import { PageTitle } from "../../components/ui/Typography";

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinList(value: string[]): string {
  return value.join(", ");
}

export function PatientSettingsPage() {
  const user = useSessionStore((s) => s.user);
  const fullNameSession = useSessionStore((s) => s.fullName);
  const avatarUrlSession = useSessionStore((s) => s.avatarUrl);
  const refreshRole = useSessionStore((s) => s.refreshRole);
  const signOut = useSessionStore((s) => s.signOut);

  const [fullName, setFullName] = useState(fullNameSession ?? "");
  const [avatarUrl, setAvatarUrl] = useState(avatarUrlSession ?? "");
  const [mainConcern, setMainConcern] = useState("");
  const [emotionalGoals, setEmotionalGoals] = useState("");
  const [therapyPreferences, setTherapyPreferences] = useState("");
  const [currentMood, setCurrentMood] = useState("");
  const [urgency, setUrgency] = useState("");
  const [supportStyle, setSupportStyle] = useState("");
  const [onboardingNotes, setOnboardingNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const onboarding = await fetchPatientOnboarding(user.id);
      setFullName(fullNameSession ?? "");
      setAvatarUrl(avatarUrlSession ?? "");
      setMainConcern(onboarding?.mainConcern ?? "");
      setEmotionalGoals(joinList(onboarding?.emotionalGoals ?? []));
      setTherapyPreferences(joinList(onboarding?.therapyPreferences ?? []));
      setCurrentMood(onboarding?.currentMood ? String(onboarding.currentMood) : "");
      setUrgency(onboarding?.urgency ?? "");
      setSupportStyle(onboarding?.supportStyle ?? "");
      setOnboardingNotes(onboarding?.onboardingNotes ?? "");
    } catch (e) {
      setError(getErrorMessage(e, "No se pudo cargar tu perfil"));
    } finally {
      setLoading(false);
    }
  }, [avatarUrlSession, fullNameSession, user]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadProfile();
    });
  }, [loadProfile]);

  async function saveProfile() {
    if (!user) return;
    setSaving(true);
    setError(null);
    try {
      await updateUserProfile({
        userId: user.id,
        fullName: fullName.trim() || null,
        avatarUrl: avatarUrl.trim() || null,
      });
      await savePatientOnboarding({
        patientId: user.id,
        mainConcern: mainConcern.trim() || null,
        emotionalGoals: splitList(emotionalGoals),
        therapyPreferences: splitList(therapyPreferences),
        currentMood: currentMood ? Number(currentMood) : null,
        urgency: urgency.trim() || null,
        supportStyle: supportStyle.trim() || null,
        onboardingNotes: onboardingNotes.trim() || null,
      });
      await refreshRole();
      toast.success("Perfil guardado.");
    } catch (e) {
      setError(getErrorMessage(e, "No se pudo guardar tu perfil"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <p className="text-sm font-medium text-club-green">Tu espacio</p>
        <PageTitle>Ajustes</PageTitle>
        <p className="max-w-lg text-sm leading-relaxed text-club-muted">
          Tu perfil y preferencias emocionales, siempre editables.
        </p>
      </header>

      {error ? (
        <p className="rounded-2xl border border-red-200/80 bg-red-50/40 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}


      {loading ? (
        <div className="h-96 animate-pulse rounded-3xl bg-club-green/5" />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1fr,300px]">
          <EmotionalGlass className="space-y-5 p-6 md:p-8">
            <div className="grid gap-5 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm text-club-muted">Nombre</span>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-2xl border border-club-green/10 bg-white/60 px-4 py-3 text-sm text-club-ink outline-none ring-club-green/10 focus:ring-2"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm text-club-muted">Avatar URL</span>
                <input
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-2xl border border-club-green/10 bg-white/60 px-4 py-3 text-sm text-club-ink outline-none ring-club-green/10 focus:ring-2"
                />
              </label>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm text-club-muted">Motivo principal</span>
                <input
                  value={mainConcern}
                  onChange={(e) => setMainConcern(e.target.value)}
                  placeholder="Ansiedad, duelo, estrés..."
                  className="w-full rounded-2xl border border-club-green/10 bg-white/60 px-4 py-3 text-sm text-club-ink outline-none ring-club-green/10 focus:ring-2"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm text-club-muted">Mood actual</span>
                <select
                  value={currentMood}
                  onChange={(e) => setCurrentMood(e.target.value)}
                  className="w-full rounded-2xl border border-club-green/10 bg-white/60 px-4 py-3 text-sm text-club-ink outline-none ring-club-green/10 focus:ring-2"
                >
                  <option value="">Sin registrar</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                    <option key={value} value={value}>
                      {value}/10
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="space-y-2">
              <span className="text-sm text-club-muted">
                Objetivos emocionales
              </span>
              <input
                value={emotionalGoals}
                onChange={(e) => setEmotionalGoals(e.target.value)}
                placeholder="Regular ansiedad, poner límites, dormir mejor"
                className="w-full rounded-2xl border border-club-green/10 bg-white/60 px-4 py-3 text-sm text-club-ink outline-none ring-club-green/10 focus:ring-2"
              />
              <span className="block text-xs text-club-muted">
                Separados por coma.
              </span>
            </label>

            <label className="space-y-2">
              <span className="text-sm text-club-muted">
                Preferencias de acompañamiento
              </span>
              <input
                value={therapyPreferences}
                onChange={(e) => setTherapyPreferences(e.target.value)}
                placeholder="Cálida, con ejercicios, ritmo suave"
                className="w-full rounded-2xl border border-club-green/10 bg-white/60 px-4 py-3 text-sm text-club-ink outline-none ring-club-green/10 focus:ring-2"
              />
              <span className="block text-xs text-club-muted">
                Separadas por coma.
              </span>
            </label>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm text-club-muted">Ritmo</span>
                <input
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value)}
                  placeholder="Necesito apoyo pronto"
                  className="w-full rounded-2xl border border-club-green/10 bg-white/60 px-4 py-3 text-sm text-club-ink outline-none ring-club-green/10 focus:ring-2"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm text-club-muted">Estilo</span>
                <input
                  value={supportStyle}
                  onChange={(e) => setSupportStyle(e.target.value)}
                  placeholder="Escucha y contención"
                  className="w-full rounded-2xl border border-club-green/10 bg-white/60 px-4 py-3 text-sm text-club-ink outline-none ring-club-green/10 focus:ring-2"
                />
              </label>
            </div>

            <label className="space-y-2">
              <span className="text-sm text-club-muted">Notas personales</span>
              <textarea
                value={onboardingNotes}
                onChange={(e) => setOnboardingNotes(e.target.value)}
                rows={4}
                className="w-full resize-none rounded-2xl border border-club-green/10 bg-white/60 px-4 py-3 text-sm leading-relaxed text-club-ink outline-none ring-club-green/10 focus:ring-2"
              />
            </label>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={saving}
                onClick={() => void saveProfile()}
                className="inline-flex items-center gap-2 rounded-2xl bg-club-green px-5 py-3 text-sm text-club-paper shadow-soft transition hover:opacity-95 disabled:opacity-60"
              >
                <Save className="h-4 w-4" strokeWidth={1.5} />
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
              <button
                type="button"
                onClick={() => void signOut()}
                className="rounded-2xl border border-club-green/15 bg-white/50 px-5 py-3 text-sm text-club-green transition hover:bg-white/70"
              >
                Cerrar sesión
              </button>
            </div>
          </EmotionalGlass>

          <EmotionalGlass className="p-6 lg:self-start">
            <p className="text-xs font-medium uppercase tracking-wider text-club-muted">
              Vista previa
            </p>
            <div className="mt-5 flex items-center gap-3">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt=""
                  className="h-14 w-14 rounded-3xl object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-club-green/10 text-club-green">
                  <Sparkles className="h-5 w-5" strokeWidth={1.5} />
                </div>
              )}
              <div>
                <p className="font-display text-2xl text-club-green">
                  {fullName || "Tu nombre"}
                </p>
                <p className="text-xs text-club-muted">
                  {mainConcern || "Tu motivo principal"}
                </p>
              </div>
            </div>
            <div className="mt-5 space-y-3 text-sm text-club-muted">
              <p>
                <span className="text-club-green">Objetivos:</span>{" "}
                {emotionalGoals || "Sin registrar"}
              </p>
              <p>
                <span className="text-club-green">Preferencias:</span>{" "}
                {therapyPreferences || "Sin registrar"}
              </p>
              <p>
                <span className="text-club-green">Mood:</span>{" "}
                {currentMood ? `${currentMood}/10` : "Sin registrar"}
              </p>
            </div>
          </EmotionalGlass>
        </div>
      )}
    </div>
  );
}

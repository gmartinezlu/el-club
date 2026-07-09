import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { AppRole } from "../../shared/auth/roles";
import { ROLE_LABELS } from "../../shared/auth/roles";
import { upsertUserProfile } from "../../services/supabase/users";
import { useSessionStore } from "../../store/sessionStore";
import { getErrorMessage } from "../../utils/errors";

export function OnboardingRolePage() {
  const navigate = useNavigate();

  const user = useSessionStore((s) => s.user);
  const refreshRole = useSessionStore((s) => s.refreshRole);

  const [role, setRole] = useState<AppRole>("patient");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    // Si ya hay nombre poblado, podríamos inicializarlo en otro momento.
  }, [user]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError(null);
    setLoading(true);
    try {
      await upsertUserProfile({
        userId: user.id,
        role,
        fullName: fullName.trim() || null,
      });

      await refreshRole();

      if (role === "patient") navigate("/patient", { replace: true });
      if (role === "psychologist") navigate("/psychologist", { replace: true });
      if (role === "admin") navigate("/admin", { replace: true });
    } catch (e2: unknown) {
      setError(getErrorMessage(e2, "No se pudo completar el onboarding"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-club-green">
          Empecemos con tu rol
        </h1>
        <p className="mt-2 text-sm text-club-muted">
          Esto nos ayuda a mostrarte una experiencia hecha para ti.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm text-club-muted">Selecciona</label>
          <div className="grid gap-3 sm:grid-cols-3">
            {(["patient", "psychologist"] as AppRole[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={[
                  "rounded-2xl border px-4 py-3 text-left transition",
                  role === r
                    ? "border-club-green/20 bg-club-green/10 text-club-green"
                    : "border-club-green/10 bg-white/50 text-club-muted hover:bg-white/70",
                ].join(" ")}
              >
                <p className="text-sm font-medium">{ROLE_LABELS[r]}</p>
                <p className="mt-1 text-xs text-club-muted">
                  {r === "patient"
                    ? "Terapia y acompañamiento"
                    : "Agenda y personas"}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-club-muted" htmlFor="fullName">
            Nombre
          </label>
          <input
            id="fullName"
            className="w-full rounded-2xl border border-club-green/10 bg-white/60 px-4 py-3 outline-none ring-club-green/10 focus:ring-2"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Cómo te gusta que te llamen"
            autoComplete="name"
          />
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50/50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <button
          disabled={loading}
          type="submit"
          className="w-full rounded-2xl bg-club-green px-4 py-3 text-base text-club-paper shadow-soft transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Guardando..." : "Continuar"}
        </button>
      </form>
    </div>
  );
}

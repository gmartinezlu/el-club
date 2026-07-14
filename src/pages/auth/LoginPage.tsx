import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { AppRole } from "../../shared/auth/roles";
import { getSupabaseClient } from "../../services/supabase/client";
import { useSessionStore } from "../../store/sessionStore";
import { getErrorMessage } from "../../utils/errors";

const LOGIN_COPY: Record<
  AppRole,
  { title: string; description: string; registerTo: string | null }
> = {
  patient: {
    title: "Entra a tu espacio",
    description: "Accede a tus sesiones, recursos y herramientas emocionales.",
    registerTo: "/auth/patient/register",
  },
  psychologist: {
    title: "Ingreso psicóloga",
    description: "Accede a tu agenda, personas activas, notas y disponibilidad.",
    registerTo: "/auth/psychologist/register",
  },
  admin: {
    title: "Ingreso admin",
    description: "Acceso privado para operar El Club.",
    registerTo: null,
  },
};

function dashboardForRole(role: AppRole): string {
  if (role === "patient") return "/patient";
  if (role === "psychologist") return "/psychologist";
  return "/admin";
}

export function LoginPage({ role }: { role: AppRole }) {
  const navigate = useNavigate();
  const copy = LOGIN_COPY[role];

  const init = useSessionStore((s) => s.init);
  const refreshRole = useSessionStore((s) => s.refreshRole);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = getSupabaseClient();
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInErr) throw signInErr;

      await init();
      await refreshRole();

      const nextRole = useSessionStore.getState().role;
      if (!nextRole) {
        navigate("/auth/onboarding", { replace: true });
        return;
      }

      if (nextRole !== role) {
        setError("Esta cuenta pertenece a otro portal de El Club.");
        return;
      }

      navigate(dashboardForRole(nextRole), { replace: true });
    } catch (e2: unknown) {
      setError(getErrorMessage(e2, "No se pudo iniciar sesión"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-club-green">
          {copy.title}
        </h1>
        <p className="mt-2 text-sm text-club-muted">{copy.description}</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm text-club-muted" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            className="w-full rounded-2xl border border-club-green/10 bg-white/60 px-4 py-3 outline-none ring-club-green/10 focus:ring-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            autoComplete="email"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-club-muted" htmlFor="password">
            Contraseña
          </label>
          <input
            id="password"
            className="w-full rounded-2xl border border-club-green/10 bg-white/60 px-4 py-3 outline-none ring-club-green/10 focus:ring-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete="current-password"
            required
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
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <div className="text-center text-sm text-club-muted">
        {copy.registerTo ? (
          <>
            ¿No tienes cuenta?{" "}
            <Link
              className="text-club-green hover:underline"
              to={copy.registerTo}
            >
              Crea una
            </Link>
          </>
        ) : (
          <span>Acceso restringido al equipo administrador.</span>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSupabaseClient } from "../../services/supabase/client";
import { getErrorMessage } from "../../utils/errors";

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseClient();
    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      const supabase = getSupabaseClient();
      const { error: updateErr } = await supabase.auth.updateUser({
        password,
      });
      if (updateErr) throw updateErr;

      navigate("/auth/patient/login", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, "No se pudo actualizar la contraseña"));
    } finally {
      setLoading(false);
    }
  }

  if (!ready) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl text-club-green">
            Verificando enlace...
          </h1>
          <p className="mt-2 text-sm text-club-muted">
            Estamos validando tu enlace de recuperación. Si el enlace expiró o
            es inválido, solicita uno nuevo desde el inicio de sesión.
          </p>
        </div>
        <div className="h-32 animate-pulse rounded-3xl bg-club-green/5" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-club-green">
          Nueva contraseña
        </h1>
        <p className="mt-2 text-sm text-club-muted">
          Escribe tu nueva contraseña. Debe tener al menos 8 caracteres.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm text-club-muted" htmlFor="new-password">
            Contraseña nueva
          </label>
          <input
            id="new-password"
            className="w-full rounded-2xl border border-club-green/10 bg-white/60 px-4 py-3 outline-none ring-club-green/10 focus:ring-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-club-muted" htmlFor="confirm-password">
            Confirmar contraseña
          </label>
          <input
            id="confirm-password"
            className="w-full rounded-2xl border border-club-green/10 bg-white/60 px-4 py-3 outline-none ring-club-green/10 focus:ring-2"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
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
          {loading ? "Guardando..." : "Guardar contraseña"}
        </button>
      </form>
    </div>
  );
}

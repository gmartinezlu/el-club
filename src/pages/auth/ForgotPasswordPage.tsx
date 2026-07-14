import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { getSupabaseClient } from "../../services/supabase/client";
import { getErrorMessage } from "../../utils/errors";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = getSupabaseClient();
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(
        email,
        { redirectTo: `${window.location.origin}/auth/reset-password` },
      );
      if (resetErr) throw resetErr;
      setSent(true);
    } catch (err) {
      setError(
        getErrorMessage(err, "No se pudo enviar el enlace de recuperación"),
      );
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl text-club-green">
            Revisa tu correo
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-club-muted">
            Si existe una cuenta con <strong>{email}</strong>, recibirás un
            enlace para restablecer tu contraseña. Revisa también la carpeta
            de spam.
          </p>
        </div>
        <Link
          to="/auth/patient/login"
          className="inline-flex items-center gap-2 text-sm text-club-green hover:underline"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
          Volver al inicio de sesión
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/auth/patient/login"
          className="inline-flex items-center gap-2 text-sm text-club-muted transition hover:text-club-green"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
          Volver
        </Link>
        <h1 className="mt-3 font-display text-3xl text-club-green">
          Recuperar contraseña
        </h1>
        <p className="mt-2 text-sm text-club-muted">
          Ingresa tu correo electrónico y te enviaremos un enlace para
          restablecer tu contraseña.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm text-club-muted" htmlFor="reset-email">
            Email
          </label>
          <input
            id="reset-email"
            className="w-full rounded-2xl border border-club-green/10 bg-white/60 px-4 py-3 outline-none ring-club-green/10 focus:ring-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            autoComplete="email"
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
          {loading ? "Enviando..." : "Enviar enlace"}
        </button>
      </form>
    </div>
  );
}

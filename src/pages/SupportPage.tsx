import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { HeartHandshake, MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";
import { MarketingLayout } from "../layouts/MarketingLayout";
import { createSupportTicket } from "../support/service";
import { useSessionStore } from "../store/sessionStore";
import { getErrorMessage } from "../utils/errors";
import { Highlight } from "../components/ui/Typography";

export function SupportPage() {
  const user = useSessionStore((s) => s.user);
  const status = useSessionStore((s) => s.status);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      await createSupportTicket({
        userId: user.id,
        subject: subject.trim(),
        body: body.trim(),
      });
      setSubject("");
      setBody("");
      toast.success("Ticket creado. El equipo podrá revisarlo desde admin.");
    } catch (e) {
      toast.error(getErrorMessage(e, "No pudimos crear tu ticket"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <MarketingLayout>
      <main className="mx-auto grid w-full max-w-6xl gap-6 px-5 py-16 md:px-8 lg:grid-cols-[0.9fr,1.1fr]">
        <section className="rounded-3xl border border-club-green/10 bg-club-green p-7 text-club-paper shadow-soft md:p-10">
          <HeartHandshake className="h-7 w-7" strokeWidth={1.5} />
          <h1 className="mt-8 font-display text-4xl leading-tight md:text-5xl">
            Soporte humano para <Highlight>seguir con calma</Highlight>.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-club-paper/80">
            Si algo no funciona, si necesitas ayuda con una cita o si quieres
            reportar una situación, puedes dejar un ticket para el equipo.
          </p>
        </section>

        <section className="rounded-3xl border border-club-green/10 bg-white/50 p-6 shadow-soft backdrop-blur md:p-8">
          <div className="flex items-center gap-2 text-club-green">
            <MessageCircle className="h-5 w-5" strokeWidth={1.5} />
            <p className="font-display text-3xl">Crear ticket</p>
          </div>

          {status !== "authenticated" ? (
            <div className="mt-6 rounded-3xl border border-club-green/10 bg-white/50 p-5">
              <p className="text-sm leading-relaxed text-club-muted">
                Para crear un ticket necesitamos que inicies sesión. Así el
                equipo puede responderte dentro de tu cuenta.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  to="/auth/patient/login"
                  className="rounded-2xl bg-club-green px-5 py-3 text-sm text-club-paper transition hover:opacity-95"
                >
                  Iniciar sesión
                </Link>
                <Link
                  to="/auth/patient/register"
                  className="rounded-2xl border border-club-green/15 bg-white/55 px-5 py-3 text-sm text-club-green transition hover:bg-white/80"
                >
                  Registrarme
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <label className="block space-y-2">
                <span className="text-sm text-club-muted">Asunto</span>
                <input
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  required
                  minLength={4}
                  placeholder="Ej. Necesito ayuda con mi cita"
                  className="w-full rounded-2xl border border-club-green/10 bg-white/60 px-4 py-3 text-sm text-club-ink outline-none ring-club-green/10 focus:ring-2"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm text-club-muted">Mensaje</span>
                <textarea
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  required
                  minLength={10}
                  rows={6}
                  placeholder="Cuéntanos qué pasó o qué necesitas."
                  className="w-full resize-none rounded-2xl border border-club-green/10 bg-white/60 px-4 py-3 text-sm leading-relaxed text-club-ink outline-none ring-club-green/10 focus:ring-2"
                />
              </label>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-2xl bg-club-green px-5 py-3 text-sm text-club-paper shadow-soft transition hover:opacity-95 disabled:opacity-60"
              >
                <Send className="h-4 w-4" strokeWidth={1.5} />
                {saving ? "Enviando..." : "Enviar ticket"}
              </button>
            </form>
          )}
        </section>
      </main>
    </MarketingLayout>
  );
}

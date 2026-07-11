import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { AppRole } from "../../shared/auth/roles";
import { getSupabaseClient } from "../../services/supabase/client";
import { upsertUserProfile } from "../../services/supabase/users";
import { useSessionStore } from "../../store/sessionStore";
import { getErrorMessage } from "../../utils/errors";

type RegisterRole = Extract<AppRole, "patient" | "psychologist">;

const REGISTER_COPY: Record<
  RegisterRole,
  { title: string; description: string; cta: string; loginTo: string }
> = {
  patient: {
    title: "Crea tu espacio",
    description:
      "Crea tu cuenta para agendar terapia y acceder a tu refugio emocional.",
    cta: "Crear mi espacio",
    loginTo: "/auth/patient/login",
  },
  psychologist: {
    title: "Registro psicóloga",
    description:
      "Crea tu perfil profesional. El equipo de El Club lo revisará antes de publicarlo.",
    cta: "Crear cuenta psicóloga",
    loginTo: "/auth/psychologist/login",
  },
};

export function RegisterPage({ role }: { role: RegisterRole }) {
  const navigate = useNavigate();
  const init = useSessionStore((s) => s.init);
  const copy = REGISTER_COPY[role];

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [professionalTitle, setProfessionalTitle] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [university, setUniversity] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [clinicalApproach, setClinicalApproach] = useState("");
  const [documentUrl, setDocumentUrl] = useState("");
  const [applicationNotes, setApplicationNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = getSupabaseClient();
      const { data, error: signUpErr } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role,
            full_name: fullName.trim() || null,
            professional_title: professionalTitle.trim() || null,
            license_number: licenseNumber.trim() || null,
            university: university.trim() || null,
            experience_years: experienceYears.trim() || null,
            clinical_approach: clinicalApproach.trim() || null,
            document_url: documentUrl.trim() || null,
            application_notes: applicationNotes.trim() || null,
          },
        },
      });
      if (signUpErr) throw signUpErr;

      if (data.user) {
        if (data.session) {
          await upsertUserProfile({
            userId: data.user.id,
            role,
            fullName: fullName.trim() || null,
          });
          if (role === "psychologist") {
            const { error: applicationErr } = await supabase
              .from("psychologists")
              .update({
                professional_title: professionalTitle.trim() || null,
                license_number: licenseNumber.trim() || null,
                university: university.trim() || null,
                experience_years: experienceYears
                  ? Number(experienceYears)
                  : null,
                clinical_approach: clinicalApproach.trim() || null,
                document_url: documentUrl.trim() || null,
                application_notes: applicationNotes.trim() || null,
                application_submitted_at: new Date().toISOString(),
              })
              .eq("user_id", data.user.id);

            if (applicationErr) throw applicationErr;
          }
        }
        await init();
      }

      navigate(role === "patient" ? "/patient/onboarding" : "/psychologist/settings", {
        replace: true,
      });
    } catch (e2: unknown) {
      setError(getErrorMessage(e2, "No se pudo crear la cuenta"));
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
          <label className="text-sm text-club-muted" htmlFor="fullName">
            Nombre
          </label>
          <input
            id="fullName"
            className="w-full rounded-2xl border border-club-green/10 bg-white/60 px-4 py-3 outline-none ring-club-green/10 focus:ring-2"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            autoComplete="name"
            required
          />
        </div>

        {role === "psychologist" ? (
          <div className="space-y-4 rounded-3xl border border-club-green/10 bg-white/50 p-4">
            <div>
              <h2 className="font-display text-2xl text-club-green">
                Verificación profesional
              </h2>
              <p className="mt-1 text-sm text-club-muted">
                Esta información ayuda al equipo a revisar tu postulación antes
                de aprobar tu perfil.
              </p>
            </div>

            <label className="block space-y-2">
              <span className="text-sm text-club-muted">Título profesional</span>
              <input
                value={professionalTitle}
                onChange={(e) => setProfessionalTitle(e.target.value)}
                required
                placeholder="Psicóloga clínica"
                className="w-full rounded-2xl border border-club-green/10 bg-white/60 px-4 py-3 outline-none ring-club-green/10 focus:ring-2"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm text-club-muted">
                  Tarjeta profesional / licencia
                </span>
                <input
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-club-green/10 bg-white/60 px-4 py-3 outline-none ring-club-green/10 focus:ring-2"
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm text-club-muted">
                  Años de experiencia
                </span>
                <input
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(e.target.value)}
                  required
                  min={0}
                  type="number"
                  className="w-full rounded-2xl border border-club-green/10 bg-white/60 px-4 py-3 outline-none ring-club-green/10 focus:ring-2"
                />
              </label>
            </div>

            <label className="block space-y-2">
              <span className="text-sm text-club-muted">Universidad</span>
              <input
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                required
                className="w-full rounded-2xl border border-club-green/10 bg-white/60 px-4 py-3 outline-none ring-club-green/10 focus:ring-2"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm text-club-muted">
                Enfoque clínico
              </span>
              <textarea
                value={clinicalApproach}
                onChange={(e) => setClinicalApproach(e.target.value)}
                required
                rows={3}
                className="w-full resize-none rounded-2xl border border-club-green/10 bg-white/60 px-4 py-3 outline-none ring-club-green/10 focus:ring-2"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm text-club-muted">
                Link a diploma, licencia o soporte
              </span>
              <input
                value={documentUrl}
                onChange={(e) => setDocumentUrl(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-2xl border border-club-green/10 bg-white/60 px-4 py-3 outline-none ring-club-green/10 focus:ring-2"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm text-club-muted">
                Comentarios para revisión
              </span>
              <textarea
                value={applicationNotes}
                onChange={(e) => setApplicationNotes(e.target.value)}
                rows={3}
                className="w-full resize-none rounded-2xl border border-club-green/10 bg-white/60 px-4 py-3 outline-none ring-club-green/10 focus:ring-2"
              />
            </label>
          </div>
        ) : null}

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
            autoComplete="new-password"
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
          {loading ? "Creando..." : copy.cta}
        </button>
      </form>

      <div className="text-center text-sm text-club-muted">
        ¿Ya tienes cuenta?{" "}
        <Link className="text-club-green hover:underline" to={copy.loginTo}>
          Inicia sesión
        </Link>
      </div>
    </div>
  );
}

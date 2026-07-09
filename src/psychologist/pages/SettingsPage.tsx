import { useCallback, useEffect, useState } from "react";
import { Save, Sparkles } from "lucide-react";
import {
  fetchPsychologistProfile,
  updatePsychologistProfile,
} from "../../services/supabase/psychologists";
import { useSessionStore } from "../../store/sessionStore";
import { getErrorMessage } from "../../utils/errors";
import {
  createSignedDocumentUrl,
  uploadPsychologistDocument,
} from "../documents";

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinList(value: string[]): string {
  return value.join(", ");
}

export function PsychologistSettingsPage() {
  const userId = useSessionStore((s) => s.user?.id);
  const refreshRole = useSessionStore((s) => s.refreshRole);
  const signOut = useSessionStore((s) => s.signOut);

  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");
  const [specialties, setSpecialties] = useState("");
  const [languages, setLanguages] = useState("Espanol");
  const [professionalWhatsapp, setProfessionalWhatsapp] = useState("");
  const [paymentMethods, setPaymentMethods] = useState(
    "Transferencia, Nequi, Daviplata",
  );
  const [paymentInstructions, setPaymentInstructions] = useState("");
  const [cancellationPolicy, setCancellationPolicy] = useState("");
  const [paymentConfirmationHours, setPaymentConfirmationHours] = useState(24);
  const [allowWhatsappAfterRequest, setAllowWhatsappAfterRequest] =
    useState(true);
  const [documentPath, setDocumentPath] = useState<string | null>(null);
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const profile = await fetchPsychologistProfile(userId);
      setFullName(profile?.fullName ?? "");
      setAvatarUrl(profile?.avatarUrl ?? "");
      setBio(profile?.bio ?? "");
      setSpecialties(joinList(profile?.specialties ?? []));
      setLanguages(joinList(profile?.languages?.length ? profile.languages : ["Espanol"]));
      setProfessionalWhatsapp(profile?.professionalWhatsapp ?? "");
      setPaymentMethods(
        joinList(
          profile?.paymentMethods?.length
            ? profile.paymentMethods
            : ["Transferencia", "Nequi", "Daviplata"],
        ),
      );
      setPaymentInstructions(profile?.paymentInstructions ?? "");
      setCancellationPolicy(profile?.cancellationPolicy ?? "");
      setPaymentConfirmationHours(profile?.paymentConfirmationHours ?? 24);
      setAllowWhatsappAfterRequest(profile?.allowWhatsappAfterRequest ?? true);
      setDocumentPath(profile?.documentUrl ?? null);
      setApplicationStatus(profile?.applicationStatus ?? null);
    } catch (e) {
      setError(getErrorMessage(e, "No se pudo cargar tu perfil"));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadProfile();
    });
  }, [loadProfile]);

  async function saveProfile() {
    if (!userId) return;
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      await updatePsychologistProfile({
        userId,
        fullName: fullName.trim() || null,
        avatarUrl: avatarUrl.trim() || null,
        bio: bio.trim() || null,
        specialties: splitList(specialties),
        languages: splitList(languages),
        professionalWhatsapp: professionalWhatsapp.trim() || null,
        paymentMethods: splitList(paymentMethods),
        paymentInstructions: paymentInstructions.trim() || null,
        cancellationPolicy: cancellationPolicy.trim() || null,
        paymentConfirmationHours,
        allowWhatsappAfterRequest,
      });
      await refreshRole();
      setSaved(true);
    } catch (e) {
      setError(getErrorMessage(e, "No se pudo guardar tu perfil"));
    } finally {
      setSaving(false);
    }
  }

  async function uploadDocument(file: File | null) {
    if (!userId || !file) return;
    setUploadingDocument(true);
    setSaved(false);
    setError(null);
    try {
      const path = await uploadPsychologistDocument({ userId, file });
      setDocumentPath(path);
      setApplicationStatus("pending");
      setSaved(true);
    } catch (e) {
      setError(getErrorMessage(e, "No se pudo subir el soporte profesional"));
    } finally {
      setUploadingDocument(false);
    }
  }

  async function openDocument() {
    if (!documentPath) return;
    if (/^https?:\/\//.test(documentPath)) {
      window.open(documentPath, "_blank", "noopener,noreferrer");
      return;
    }

    try {
      const url = await createSignedDocumentUrl(documentPath);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      setError(getErrorMessage(e, "No se pudo abrir el documento"));
    }
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-sm font-medium text-club-green">Perfil profesional</p>
        <h1 className="font-display text-4xl text-club-green">Configuracion</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-club-muted">
          Completa la informacion que revisa el equipo de El Club y que veran
          las personas cuando tu perfil este aprobado.
        </p>
      </header>

      {error ? (
        <p className="rounded-2xl border border-red-200/80 bg-red-50/40 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      {saved ? (
        <p className="rounded-2xl border border-club-green/10 bg-club-green/10 px-4 py-3 text-sm text-club-green">
          Perfil guardado.
        </p>
      ) : null}

      {loading ? (
        <div className="h-96 animate-pulse rounded-3xl bg-club-green/5" />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1fr,300px]">
          <section className="space-y-5 rounded-3xl border border-club-green/10 bg-white/40 p-5 shadow-soft backdrop-blur">
            <label className="space-y-2">
              <span className="text-sm text-club-muted">Nombre visible</span>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Dra. Camila Rodriguez"
                className="w-full rounded-2xl border border-club-green/10 bg-white/60 px-4 py-3 text-sm text-club-ink outline-none ring-club-green/10 focus:ring-2"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm text-club-muted">Foto / avatar URL</span>
              <input
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-2xl border border-club-green/10 bg-white/60 px-4 py-3 text-sm text-club-ink outline-none ring-club-green/10 focus:ring-2"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm text-club-muted">Bio profesional</span>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={6}
                placeholder="Cuentale a las personas como acompanas, tu enfoque y que pueden esperar de una sesion contigo."
                className="w-full resize-none rounded-2xl border border-club-green/10 bg-white/60 px-4 py-3 text-sm leading-relaxed text-club-ink outline-none ring-club-green/10 focus:ring-2"
              />
            </label>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm text-club-muted">Especialidades</span>
                <input
                  value={specialties}
                  onChange={(e) => setSpecialties(e.target.value)}
                  placeholder="Ansiedad, duelo, autoestima"
                  className="w-full rounded-2xl border border-club-green/10 bg-white/60 px-4 py-3 text-sm text-club-ink outline-none ring-club-green/10 focus:ring-2"
                />
                <span className="block text-xs text-club-muted">
                  Separadas por coma.
                </span>
              </label>

              <label className="space-y-2">
                <span className="text-sm text-club-muted">Idiomas</span>
                <input
                  value={languages}
                  onChange={(e) => setLanguages(e.target.value)}
                  placeholder="Espanol, Ingles"
                  className="w-full rounded-2xl border border-club-green/10 bg-white/60 px-4 py-3 text-sm text-club-ink outline-none ring-club-green/10 focus:ring-2"
                />
                <span className="block text-xs text-club-muted">
                  Separados por coma.
                </span>
              </label>
            </div>

            <div className="rounded-3xl border border-club-green/10 bg-white/40 p-4">
              <p className="font-display text-2xl text-club-green">
                Pagos gestionados por ti
              </p>
              <p className="mt-1 text-sm leading-relaxed text-club-muted">
                EL CLUB no procesa pagos de sesiones. Cuando una persona
                solicite una cita, podras compartir tus metodos de pago y
                confirmar los detalles directamente con ella.
              </p>

              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm text-club-muted">
                    WhatsApp profesional
                  </span>
                  <input
                    value={professionalWhatsapp}
                    onChange={(e) => setProfessionalWhatsapp(e.target.value)}
                    placeholder="+57 300 000 0000"
                    className="w-full rounded-2xl border border-club-green/10 bg-white/60 px-4 py-3 text-sm text-club-ink outline-none ring-club-green/10 focus:ring-2"
                  />
                  <span className="block text-xs text-club-muted">
                    No se muestra publicamente antes de solicitar una cita.
                  </span>
                </label>

                <label className="space-y-2">
                  <span className="text-sm text-club-muted">
                    Metodos de pago aceptados
                  </span>
                  <input
                    value={paymentMethods}
                    onChange={(e) => setPaymentMethods(e.target.value)}
                    placeholder="Transferencia, Nequi, Daviplata, efectivo"
                    className="w-full rounded-2xl border border-club-green/10 bg-white/60 px-4 py-3 text-sm text-club-ink outline-none ring-club-green/10 focus:ring-2"
                  />
                  <span className="block text-xs text-club-muted">
                    Separados por coma.
                  </span>
                </label>
              </div>

              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm text-club-muted">
                    Instrucciones de pago
                  </span>
                  <textarea
                    value={paymentInstructions}
                    onChange={(e) => setPaymentInstructions(e.target.value)}
                    rows={5}
                    placeholder="Comparte aqui tus condiciones, cuenta o pasos generales. Evita publicar datos sensibles si prefieres enviarlos por WhatsApp."
                    className="w-full resize-none rounded-2xl border border-club-green/10 bg-white/60 px-4 py-3 text-sm leading-relaxed text-club-ink outline-none ring-club-green/10 focus:ring-2"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm text-club-muted">
                    Politica de cancelacion
                  </span>
                  <textarea
                    value={cancellationPolicy}
                    onChange={(e) => setCancellationPolicy(e.target.value)}
                    rows={5}
                    placeholder="Ejemplo: cancelar o reprogramar con minimo 12 horas de anticipacion."
                    className="w-full resize-none rounded-2xl border border-club-green/10 bg-white/60 px-4 py-3 text-sm leading-relaxed text-club-ink outline-none ring-club-green/10 focus:ring-2"
                  />
                </label>
              </div>

              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm text-club-muted">
                    Horas maximas para confirmar pago
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={168}
                    value={paymentConfirmationHours}
                    onChange={(e) =>
                      setPaymentConfirmationHours(Number(e.target.value) || 24)
                    }
                    className="w-full rounded-2xl border border-club-green/10 bg-white/60 px-4 py-3 text-sm text-club-ink outline-none ring-club-green/10 focus:ring-2"
                  />
                </label>

                <label className="flex items-start gap-3 rounded-2xl border border-club-green/10 bg-white/45 p-4">
                  <input
                    type="checkbox"
                    checked={allowWhatsappAfterRequest}
                    onChange={(e) =>
                      setAllowWhatsappAfterRequest(e.target.checked)
                    }
                    className="mt-1 h-4 w-4 rounded border-club-green/30 text-club-green"
                  />
                  <span>
                    <span className="block text-sm text-club-green">
                      Permitir contacto por WhatsApp despues de solicitar cita
                    </span>
                    <span className="mt-1 block text-xs leading-relaxed text-club-muted">
                      La persona solo vera el boton si inicio sesion y ya creo
                      una solicitud contigo.
                    </span>
                  </span>
                </label>
              </div>
            </div>

            <div className="rounded-3xl border border-club-green/10 bg-white/40 p-4">
              <p className="font-display text-2xl text-club-green">
                Soporte profesional
              </p>
              <p className="mt-1 text-sm leading-relaxed text-club-muted">
                Sube diploma, tarjeta profesional o soporte de habilitacion.
                Al actualizarlo, tu perfil vuelve a revision.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <label className="inline-flex cursor-pointer rounded-2xl border border-club-green/15 bg-white/55 px-4 py-2 text-sm text-club-green transition hover:bg-white/80">
                  {uploadingDocument ? "Subiendo..." : "Subir documento"}
                  <input
                    type="file"
                    accept="application/pdf,image/png,image/jpeg,image/webp"
                    className="sr-only"
                    disabled={uploadingDocument}
                    onChange={(event) =>
                      void uploadDocument(event.target.files?.[0] ?? null)
                    }
                  />
                </label>
                {documentPath ? (
                  <button
                    type="button"
                    onClick={() => void openDocument()}
                    className="rounded-2xl bg-club-green px-4 py-2 text-sm text-club-paper transition hover:opacity-95"
                  >
                    Ver documento
                  </button>
                ) : null}
              </div>
              <p className="mt-3 text-xs text-club-muted">
                Estado de revision: {applicationStatus ?? "sin enviar"}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={saving}
                onClick={() => void saveProfile()}
                className="inline-flex items-center gap-2 rounded-2xl bg-club-green px-5 py-3 text-sm text-club-paper shadow-soft transition hover:opacity-95 disabled:opacity-60"
              >
                <Save className="h-4 w-4" strokeWidth={1.5} />
                {saving ? "Guardando..." : "Guardar perfil"}
              </button>
              <button
                type="button"
                onClick={() => void signOut()}
                className="rounded-2xl border border-club-green/15 bg-white/55 px-5 py-3 text-sm text-club-green transition hover:bg-white/80"
              >
                Cerrar sesion
              </button>
            </div>
          </section>

          <aside className="rounded-3xl border border-club-green/10 bg-white/40 p-5 shadow-soft backdrop-blur lg:self-start">
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
                  {splitList(languages).join(", ") || "Espanol"}
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-club-muted">
              {bio ||
                "Tu bio aparecera aqui para que las personas sientan confianza antes de agendar."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {(splitList(specialties).length
                ? splitList(specialties)
                : ["Especialidad"]
              ).map((item) => (
                <span
                  key={item}
                  className="rounded-full bg-club-green/10 px-3 py-1 text-xs text-club-green"
                >
                  {item}
                </span>
              ))}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

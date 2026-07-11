import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Save, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  fetchPsychologistProfile,
  updatePsychologistProfile,
} from "../../services/supabase/psychologists";
import {
  disconnectGoogleCalendar,
  fetchGoogleConnectionStatus,
  startGoogleConnection,
  type GoogleConnectionStatus,
} from "../../services/supabase/googleCalendar";
import { useSessionStore } from "../../store/sessionStore";
import { getErrorMessage } from "../../utils/errors";
import {
  createSignedDocumentUrl,
  uploadPsychologistDocument,
} from "../documents";
import { uploadNequiQr } from "../nequiQr";

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
  const [languages, setLanguages] = useState("Español");
  const [professionalWhatsapp, setProfessionalWhatsapp] = useState("");
  const [paymentMethods, setPaymentMethods] = useState(
    "Transferencia, Nequi, Daviplata",
  );
  const [paymentInstructions, setPaymentInstructions] = useState("");
  const [cancellationPolicy, setCancellationPolicy] = useState("");
  const [paymentConfirmationHours, setPaymentConfirmationHours] = useState(24);
  const [allowWhatsappAfterRequest, setAllowWhatsappAfterRequest] =
    useState(true);
  const [nequiNumber, setNequiNumber] = useState("");
  const [sessionPrice, setSessionPrice] = useState("");
  const [nequiQrUrl, setNequiQrUrl] = useState<string | null>(null);
  const [uploadingQr, setUploadingQr] = useState(false);
  const [documentPath, setDocumentPath] = useState<string | null>(null);
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const [googleStatus, setGoogleStatus] = useState<GoogleConnectionStatus | null>(null);
  const [googleLoading, setGoogleLoading] = useState(true);
  const [googleActionLoading, setGoogleActionLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const googleRedirectResult = searchParams.get("google");

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
      setLanguages(joinList(profile?.languages?.length ? profile.languages : ["Español"]));
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
      setNequiNumber(profile?.nequiNumber ?? "");
      setSessionPrice(
        profile?.sessionPriceCents != null
          ? String(Math.round(profile.sessionPriceCents / 100))
          : "",
      );
      setNequiQrUrl(profile?.nequiQrUrl ?? null);
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

  const loadGoogleStatus = useCallback(async () => {
    setGoogleLoading(true);
    setGoogleError(null);
    try {
      setGoogleStatus(await fetchGoogleConnectionStatus());
    } catch (e) {
      setGoogleError(getErrorMessage(e, "No se pudo consultar la conexión con Google"));
    } finally {
      setGoogleLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void loadGoogleStatus();
    });
  }, [loadGoogleStatus]);

  // Limpia el parámetro ?google= de la URL tras leerlo, así un refresh
  // de la página no vuelve a mostrar el toast de éxito/error.
  useEffect(() => {
    if (!googleRedirectResult) return;
    if (googleRedirectResult === "connected") {
      toast.success("Conectaste tu Google Calendar correctamente.");
    } else if (googleRedirectResult === "error") {
      toast.error("No se pudo completar la conexión con Google. Intenta de nuevo.");
    }
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("google");
        return next;
      },
      { replace: true },
    );
  }, [googleRedirectResult, setSearchParams]);

  async function connectGoogle() {
    setGoogleActionLoading(true);
    setGoogleError(null);
    try {
      await startGoogleConnection();
    } catch (e) {
      setGoogleError(getErrorMessage(e, "No se pudo iniciar la conexión con Google"));
      setGoogleActionLoading(false);
    }
  }

  async function disconnectGoogle() {
    setGoogleActionLoading(true);
    setGoogleError(null);
    try {
      await disconnectGoogleCalendar();
      await loadGoogleStatus();
    } catch (e) {
      setGoogleError(getErrorMessage(e, "No se pudo desconectar Google Calendar"));
    } finally {
      setGoogleActionLoading(false);
    }
  }

  async function saveProfile() {
    if (!userId) return;
    setSaving(true);
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
        nequiNumber: nequiNumber.trim() || null,
        sessionPriceCents:
          sessionPrice.trim() && !Number.isNaN(Number(sessionPrice))
            ? Math.round(Number(sessionPrice) * 100)
            : null,
        nequiQrUrl,
      });
      await refreshRole();
      toast.success("Perfil guardado.");
    } catch (e) {
      setError(getErrorMessage(e, "No se pudo guardar tu perfil"));
    } finally {
      setSaving(false);
    }
  }

  async function uploadQr(file: File | null) {
    if (!userId || !file) return;
    setUploadingQr(true);
    setError(null);
    try {
      const url = await uploadNequiQr({ userId, file });
      setNequiQrUrl(url);
    } catch (e) {
      setError(getErrorMessage(e, "No se pudo subir el código QR"));
    } finally {
      setUploadingQr(false);
    }
  }

  async function uploadDocument(file: File | null) {
    if (!userId || !file) return;
    setUploadingDocument(true);
    setError(null);
    try {
      const path = await uploadPsychologistDocument({ userId, file });
      setDocumentPath(path);
      setApplicationStatus("pending");
      toast.success("Soporte profesional subido.");
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
        <h1 className="font-display text-4xl text-club-green">Configuración</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-club-muted">
          Completa la información que revisa el equipo de El Club y que verán
          las personas cuando tu perfil esté aprobado.
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
          <section className="space-y-5 rounded-3xl border border-club-green/10 bg-white/50 p-5 shadow-soft backdrop-blur">
            <label className="space-y-2">
              <span className="text-sm text-club-muted">Nombre visible</span>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Dra. Camila Rodríguez"
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
                placeholder="Cuéntale a las personas cómo acompañas, tu enfoque y qué pueden esperar de una sesión contigo."
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
                  placeholder="Español, Inglés"
                  className="w-full rounded-2xl border border-club-green/10 bg-white/60 px-4 py-3 text-sm text-club-ink outline-none ring-club-green/10 focus:ring-2"
                />
                <span className="block text-xs text-club-muted">
                  Separados por coma.
                </span>
              </label>
            </div>

            <div className="rounded-3xl border border-club-green/10 bg-white/50 p-4">
              <p className="font-display text-2xl text-club-green">
                Pagos gestionados por ti
              </p>
              <p className="mt-1 text-sm leading-relaxed text-club-muted">
                EL CLUB no procesa pagos de sesiones. Cuando una persona
                solicite una cita, podrás compartir tus métodos de pago y
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
                    No se muestra públicamente antes de solicitar una cita.
                  </span>
                </label>

                <label className="space-y-2">
                  <span className="text-sm text-club-muted">
                    métodos de pago aceptados
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
                    Número Nequi
                  </span>
                  <input
                    value={nequiNumber}
                    onChange={(e) => setNequiNumber(e.target.value)}
                    placeholder="300 000 0000"
                    className="w-full rounded-2xl border border-club-green/10 bg-white/60 px-4 py-3 text-sm text-club-ink outline-none ring-club-green/10 focus:ring-2"
                  />
                  <span className="block text-xs text-club-muted">
                    Se muestra a la persona cuando su cita queda pendiente de
                    pago.
                  </span>
                </label>

                <label className="space-y-2">
                  <span className="text-sm text-club-muted">
                    Precio de la sesión (COP)
                  </span>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={sessionPrice}
                    onChange={(e) => setSessionPrice(e.target.value)}
                    placeholder="120000"
                    className="w-full rounded-2xl border border-club-green/10 bg-white/60 px-4 py-3 text-sm text-club-ink outline-none ring-club-green/10 focus:ring-2"
                  />
                </label>
              </div>

              <div className="mt-5 space-y-2">
                <span className="text-sm text-club-muted">Código QR de Nequi</span>
                <div className="flex flex-wrap items-center gap-3">
                  {nequiQrUrl ? (
                    <img
                      src={nequiQrUrl}
                      alt="QR de Nequi"
                      className="h-20 w-20 rounded-2xl border border-club-green/10 object-cover"
                    />
                  ) : null}
                  <label className="inline-flex cursor-pointer rounded-2xl border border-club-green/15 bg-white/55 px-4 py-2 text-sm text-club-green transition hover:bg-white/80">
                    {uploadingQr ? "Subiendo..." : "Subir QR"}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="sr-only"
                      disabled={uploadingQr}
                      onChange={(event) =>
                        void uploadQr(event.target.files?.[0] ?? null)
                      }
                    />
                  </label>
                </div>
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
                    placeholder="Comparte aquí tus condiciones, cuenta o pasos generales. Evita publicar datos sensibles si prefieres enviarlos por WhatsApp."
                    className="w-full resize-none rounded-2xl border border-club-green/10 bg-white/60 px-4 py-3 text-sm leading-relaxed text-club-ink outline-none ring-club-green/10 focus:ring-2"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm text-club-muted">
                    Política de cancelación
                  </span>
                  <textarea
                    value={cancellationPolicy}
                    onChange={(e) => setCancellationPolicy(e.target.value)}
                    rows={5}
                    placeholder="Ejemplo: cancelar o reprogramar con mínimo 12 horas de anticipación."
                    className="w-full resize-none rounded-2xl border border-club-green/10 bg-white/60 px-4 py-3 text-sm leading-relaxed text-club-ink outline-none ring-club-green/10 focus:ring-2"
                  />
                </label>
              </div>

              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm text-club-muted">
                    Horas máximas para confirmar pago
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

                <label className="flex items-start gap-3 rounded-2xl border border-club-green/10 bg-white/50 p-4">
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
                      Permitir contacto por WhatsApp después de solicitar cita
                    </span>
                    <span className="mt-1 block text-xs leading-relaxed text-club-muted">
                      La persona solo verá el botón si inició sesión y ya creó
                      una solicitud contigo.
                    </span>
                  </span>
                </label>
              </div>
            </div>

            <div className="rounded-3xl border border-club-green/10 bg-white/50 p-4">
              <p className="font-display text-2xl text-club-green">
                Google Calendar
              </p>
              <p className="mt-1 text-sm leading-relaxed text-club-muted">
                Conecta tu cuenta de Google para que, al confirmar una cita,
                EL CLUB cree el evento con Meet en tu calendario y no
                tengas que pegar el enlace a mano.
              </p>

              {googleError ? (
                <p className="mt-3 rounded-2xl border border-red-200/80 bg-red-50/40 px-4 py-3 text-sm text-red-800">
                  {googleError}
                </p>
              ) : null}

              <div className="mt-4">
                {googleLoading ? (
                  <div className="h-12 w-full animate-pulse rounded-2xl bg-club-green/5" />
                ) : googleStatus?.connected ? (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-club-green/10 bg-white/55 px-4 py-3">
                    <span className="text-sm text-club-green">
                      Conectado como {googleStatus.googleEmail}
                    </span>
                    <button
                      type="button"
                      disabled={googleActionLoading}
                      onClick={() => void disconnectGoogle()}
                      className="rounded-2xl border border-club-green/15 bg-white/55 px-4 py-2 text-sm text-club-green transition hover:bg-white/80 disabled:opacity-60"
                    >
                      {googleActionLoading ? "Desconectando..." : "Desconectar"}
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-club-green/10 bg-white/55 px-4 py-3">
                    <span className="text-sm text-club-muted">No conectado</span>
                    <button
                      type="button"
                      disabled={googleActionLoading}
                      onClick={() => void connectGoogle()}
                      className="rounded-2xl bg-club-green px-4 py-2 text-sm text-club-paper transition hover:opacity-95 disabled:opacity-60"
                    >
                      {googleActionLoading ? "Redirigiendo..." : "Conectar Google Calendar"}
                    </button>
                  </div>
                )}
              </div>

              <p className="mt-3 text-xs text-club-muted">
                Si no conectas tu cuenta, puedes seguir pegando el enlace de
                Meet manualmente en cada cita, como hoy.
              </p>
            </div>

            <div className="rounded-3xl border border-club-green/10 bg-white/50 p-4">
              <p className="font-display text-2xl text-club-green">
                Soporte profesional
              </p>
              <p className="mt-1 text-sm leading-relaxed text-club-muted">
                Sube diploma, tarjeta profesional o soporte de habilitación.
                Al actualizarlo, tu perfil vuelve a revisión.
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
                Estado de revisión: {applicationStatus ?? "sin enviar"}
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
                Cerrar sesión
              </button>
            </div>
          </section>

          <aside className="rounded-3xl border border-club-green/10 bg-white/50 p-5 shadow-soft backdrop-blur lg:self-start">
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
                  {splitList(languages).join(", ") || "Español"}
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-club-muted">
              {bio ||
                "Tu bio aparecerá aquí para que las personas sientan confianza antes de agendar."}
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

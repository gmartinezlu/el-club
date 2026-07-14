import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CalendarCheck,
  Copy,
  MessageCircle,
  SearchX,
  ShieldCheck,
} from "lucide-react";
import { fetchPatientAppointmentById } from "../../appointments/patient";
import {
  markPatientPaid,
  releaseUnpaidAppointment,
  uploadPaymentProof,
} from "../../appointments/payments";
import type { PatientAppointmentView } from "../../appointments/types";
import { STATUS_LABELS } from "../../appointments/utils";
import { fetchPsychologistProfile } from "../../services/supabase/psychologists";
import type { PsychologistProfile } from "../../psychologist/types";
import { useSessionStore } from "../../store/sessionStore";
import { getErrorMessage } from "../../utils/errors";
import { EmotionalGlass } from "../components/EmotionalGlass";
import { PatientFlowSteps } from "../components/PatientFlowSteps";
import { EmptyState } from "../../components/ui/EmptyState";
import { Highlight, PageTitle } from "../../components/ui/Typography";
import {
  formatSessionDate,
  formatSessionRange,
} from "../utils/formatDate";

function formatCop(cents: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function formatDeadline(deadline: string): string {
  return new Date(deadline).toLocaleString("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function createWhatsappUrl(value: string, psychologistName: string) {
  const digits = value.replace(/\D/g, "");
  const message = encodeURIComponent(
    `Hola ${psychologistName}, solicité una cita contigo en EL CLUB y quiero coordinar los detalles.`,
  );
  return `https://wa.me/${digits}?text=${message}`;
}

export function PatientAppointmentRequestPage() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const patientId = useSessionStore((s) => s.user?.id);
  const [appointment, setAppointment] = useState<PatientAppointmentView | null>(
    null,
  );
  const [psychologist, setPsychologist] = useState<PsychologistProfile | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [markingPaid, setMarkingPaid] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadRequest = useCallback(async () => {
    if (!patientId || !appointmentId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      let data = await fetchPatientAppointmentById(patientId, appointmentId);
      if (
        data?.status === "pending_payment" &&
        data.paymentDeadline &&
        new Date(data.paymentDeadline) < new Date()
      ) {
        await releaseUnpaidAppointment(appointmentId).catch((e) => {
          console.error("Failed to release unpaid appointment", e);
        });
        data = await fetchPatientAppointmentById(patientId, appointmentId);
      }
      setAppointment(data);
      if (data?.psychologistId) {
        const profile = await fetchPsychologistProfile(data.psychologistId);
        setPsychologist(profile);
      }
    } catch (e) {
      setError(getErrorMessage(e, "No pudimos cargar esta solicitud"));
    } finally {
      setLoading(false);
    }
  }, [appointmentId, patientId]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadRequest();
    });
  }, [loadRequest]);

  async function submitPaid() {
    if (!patientId || !appointmentId) return;
    setMarkingPaid(true);
    setError(null);
    try {
      let proofPath: string | null = null;
      if (proofFile) {
        proofPath = await uploadPaymentProof({
          patientId,
          appointmentId,
          file: proofFile,
        });
      }
      await markPatientPaid({ appointmentId, patientId, proofPath });
      await loadRequest();
    } catch (e) {
      setError(getErrorMessage(e, "No se pudo registrar tu pago"));
    } finally {
      setMarkingPaid(false);
    }
  }

  function copyNequiNumber() {
    if (!psychologist?.nequiNumber) return;
    void navigator.clipboard.writeText(psychologist.nequiNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const canContactWhatsapp = useMemo(() => {
    if (!appointment || !psychologist?.professionalWhatsapp) return false;
    if (!psychologist.allowWhatsappAfterRequest) return false;
    return ["requested", "pending_payment", "confirmed", "meeting_enabled"].includes(
      appointment.status,
    );
  }, [appointment, psychologist]);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <PatientFlowSteps current={3} />

      <Link
        to="/patient/sessions"
        className="inline-flex items-center gap-2 text-sm text-club-muted transition hover:text-club-green"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
        Volver a mis sesiones
      </Link>

      {error ? (
        <p className="rounded-2xl border border-red-200/80 bg-red-50/40 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="h-96 animate-pulse rounded-3xl bg-club-green/5" />
      ) : !appointment ? (
        <EmptyState
          icon={SearchX}
          title="No encontramos esta cita"
          description="Puede que el enlace esté vencido o la solicitud haya cambiado."
          action={{ label: "Ver mis sesiones", to: "/patient/sessions" }}
        />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="grid gap-5 lg:grid-cols-[1fr,320px]"
        >
          <EmotionalGlass className="p-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-club-green/10 text-club-green">
              <CalendarCheck className="h-7 w-7" strokeWidth={1.5} />
            </div>
            <p className="mt-5 text-sm font-medium text-club-green">
              Solicitud enviada
            </p>
            <PageTitle className="mt-1">
              Tu cita fue <Highlight>solicitada</Highlight>
            </PageTitle>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-club-muted">
              Tu psicóloga revisará tu solicitud. El pago se coordina
              directamente con ella según sus métodos disponibles.
            </p>

            <div className="mt-6 grid gap-4 rounded-3xl border border-club-green/10 bg-white/50 p-5 md:grid-cols-2">
              <div>
                <p className="text-xs text-club-muted">Psicóloga</p>
                <p className="font-display text-2xl text-club-green">
                  {appointment.psychologistName}
                </p>
              </div>
              <div>
                <p className="text-xs text-club-muted">Estado</p>
                <p className="text-sm text-club-ink">
                  {STATUS_LABELS[appointment.status]}
                </p>
              </div>
              <div>
                <p className="text-xs text-club-muted">Fecha</p>
                <p className="capitalize text-sm text-club-ink">
                  {formatSessionDate(appointment.startsAt)}
                </p>
                <p className="text-sm text-club-muted">
                  {formatSessionRange(appointment.startsAt, appointment.endsAt)}
                </p>
              </div>
              <div>
                <p className="text-xs text-club-muted">Confirmación</p>
                <p className="text-sm text-club-ink">
                  {psychologist?.paymentConfirmationHours
                    ? `${psychologist.paymentConfirmationHours} horas máx.`
                    : "La psicóloga te indicará el tiempo."}
                </p>
              </div>
            </div>

            {appointment.status === "pending_payment" && psychologist?.nequiNumber ? (
              <div className="mt-5 rounded-3xl border border-club-green/10 bg-club-green/5 p-5">
                <p className="font-display text-2xl text-club-green">
                  Paga por Nequi
                </p>
                {appointment.paymentDeadline ? (
                  <p className="mt-1 text-xs text-club-muted">
                    Confirma antes del {formatDeadline(appointment.paymentDeadline)}
                  </p>
                ) : null}

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <div className="rounded-2xl border border-club-green/10 bg-white/70 px-4 py-3">
                    <p className="text-xs text-club-muted">Número Nequi</p>
                    <p className="font-display text-xl text-club-green">
                      {psychologist.nequiNumber}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={copyNequiNumber}
                    className="inline-flex items-center gap-2 rounded-2xl border border-club-green/15 bg-white/55 px-4 py-2 text-sm text-club-green transition hover:bg-white/80"
                  >
                    <Copy className="h-4 w-4" strokeWidth={1.5} />
                    {copied ? "Copiado" : "Copiar"}
                  </button>
                  {psychologist.sessionPriceCents ? (
                    <div className="rounded-2xl border border-club-green/10 bg-white/70 px-4 py-3">
                      <p className="text-xs text-club-muted">Valor sesión</p>
                      <p className="font-display text-xl text-club-green">
                        {formatCop(psychologist.sessionPriceCents)}
                      </p>
                    </div>
                  ) : null}
                </div>

                {psychologist.nequiQrUrl ? (
                  <img
                    src={psychologist.nequiQrUrl}
                    alt="QR de Nequi"
                    className="mt-4 h-40 w-40 rounded-2xl border border-club-green/10 object-cover"
                  />
                ) : null}

                {appointment.paymentMarkedPaidAt ? (
                  <p className="mt-4 text-sm text-club-green">
                    Marcaste tu pago como realizado. La psicóloga lo confirmará
                    pronto.
                  </p>
                ) : (
                  <div className="mt-4 space-y-3">
                    <label className="block space-y-2">
                      <span className="text-sm text-club-muted">
                        Comprobante de pago (opcional)
                      </span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,application/pdf"
                        onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
                        className="block w-full text-sm text-club-ink"
                      />
                    </label>
                    <button
                      type="button"
                      disabled={markingPaid}
                      onClick={() => void submitPaid()}
                      className="inline-flex items-center gap-2 rounded-2xl bg-club-green px-5 py-3 text-sm text-club-paper shadow-soft transition hover:opacity-95 disabled:opacity-60"
                    >
                      {markingPaid ? "Enviando..." : "Ya pagué"}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-5 rounded-3xl border border-club-green/10 bg-club-green/5 p-5">
                <p className="font-display text-2xl text-club-green">
                  Coordina el pago directamente con tu psicóloga
                </p>
                <p className="mt-2 text-sm leading-relaxed text-club-muted">
                  EL CLUB no solicita pagos por WhatsApp ni procesa dinero de
                  sesiones dentro de la plataforma.
                </p>
                {psychologist?.paymentMethods?.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {psychologist.paymentMethods.map((method) => (
                      <span
                        key={method}
                        className="rounded-full bg-white/70 px-3 py-1 text-xs text-club-green"
                      >
                        {method}
                      </span>
                    ))}
                  </div>
                ) : null}
                {psychologist?.paymentInstructions ? (
                  <p className="mt-3 text-sm leading-relaxed text-club-muted">
                    {psychologist.paymentInstructions}
                  </p>
                ) : null}
                {psychologist?.cancellationPolicy ? (
                  <p className="mt-3 text-xs leading-relaxed text-club-muted">
                    Política de cancelación: {psychologist.cancellationPolicy}
                  </p>
                ) : null}
              </div>
            )}
          </EmotionalGlass>

          <EmotionalGlass className="p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-club-green/10 text-club-green">
              <ShieldCheck className="h-6 w-6" strokeWidth={1.5} />
            </div>
            <p className="mt-4 font-display text-2xl text-club-green">
              Flujo seguro
            </p>
            <p className="mt-2 text-sm leading-relaxed text-club-muted">
              EL CLUB facilita la conexión y la agenda. Los acuerdos de pago
              ocurren directamente entre la persona y la psicóloga.
            </p>

            <div className="mt-6 grid gap-3">
              <Link
                to="/patient/sessions"
                className="inline-flex w-full items-center justify-center rounded-2xl bg-club-green px-5 py-3 text-sm text-club-paper shadow-soft transition hover:opacity-95"
              >
                Ver detalles de la cita
              </Link>
              {canContactWhatsapp && psychologist?.professionalWhatsapp ? (
                <a
                  href={createWhatsappUrl(
                    psychologist.professionalWhatsapp,
                    appointment.psychologistName,
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-club-green/15 bg-white/55 px-5 py-3 text-sm text-club-green transition hover:bg-white/80"
                >
                  <MessageCircle className="h-4 w-4" strokeWidth={1.5} />
                  Contactar por WhatsApp
                </a>
              ) : null}
            </div>
          </EmotionalGlass>
        </motion.div>
      )}
    </div>
  );
}

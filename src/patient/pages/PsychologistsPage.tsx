import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CalendarPlus,
  Check,
  Clock,
  Languages,
  ShieldCheck,
  Sparkles,
  WalletCards,
} from "lucide-react";
import {
  fetchBookableAvailability,
  type AvailabilitySlot,
} from "../../appointments/availability";
import { bookAppointmentAtomically } from "../../appointments/patient";
import { createNotification } from "../../notifications/service";
import { fetchApprovedPsychologists } from "../../services/supabase/psychologists";
import { useSessionStore } from "../../store/sessionStore";
import { getErrorMessage } from "../../utils/errors";
import type { PsychologistProfile } from "../../psychologist/types";
import { EmotionalGlass } from "../components/EmotionalGlass";
import { PatientFlowSteps } from "../components/PatientFlowSteps";
import { formatSessionDate, formatSessionRange } from "../utils/formatDate";

export function PatientPsychologistsPage() {
  const navigate = useNavigate();
  const { psychologistId } = useParams<{ psychologistId?: string }>();
  const patientId = useSessionStore((s) => s.user?.id);
  const [psychologists, setPsychologists] = useState<PsychologistProfile[]>([]);
  const [selectedPsychologistId, setSelectedPsychologistId] = useState<
    string | null
  >(psychologistId ?? null);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedPsychologist = useMemo(
    () =>
      psychologists.find((p) => p.userId === selectedPsychologistId) ??
      psychologists.find((p) => p.userId === psychologistId) ??
      psychologists[0] ??
      null,
    [psychologistId, psychologists, selectedPsychologistId],
  );

  const isDetailView = Boolean(psychologistId);

  const loadPsychologists = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchApprovedPsychologists();
      setPsychologists(data);
      setSelectedPsychologistId((current) => current ?? data[0]?.userId ?? null);
    } catch (e) {
      setError(getErrorMessage(e, "No pudimos cargar las psicólogas"));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSlots = useCallback(async (profileId: string) => {
    setLoadingSlots(true);
    setError(null);
    try {
      const data = await fetchBookableAvailability(profileId);
      setSlots(data);
      setSelectedSlot(null);
    } catch (e) {
      setSlots([]);
      setError(getErrorMessage(e, "No pudimos cargar la disponibilidad"));
    } finally {
      setLoadingSlots(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void loadPsychologists();
    });
  }, [loadPsychologists]);

  useEffect(() => {
    if (psychologistId) {
      queueMicrotask(() => {
        setSelectedPsychologistId(psychologistId);
      });
    }
  }, [psychologistId]);

  useEffect(() => {
    if (!selectedPsychologist?.userId) {
      queueMicrotask(() => {
        setSlots([]);
        setSelectedSlot(null);
      });
      return;
    }

    queueMicrotask(() => {
      void loadSlots(selectedPsychologist.userId);
    });
  }, [loadSlots, selectedPsychologist?.userId]);

  async function scheduleSession() {
    if (!patientId || !selectedPsychologist || !selectedSlot) return;
    setSaving(true);
    setError(null);
    try {
      const appointmentId = await bookAppointmentAtomically({
        patientId,
        psychologistId: selectedPsychologist.userId,
        slotId: selectedSlot.id,
      });
      await Promise.all([
        createNotification({
          userId: patientId,
          title: "Cita solicitada",
          body: "Tu solicitud fue enviada. El pago se coordina directamente con la especialista según sus métodos disponibles.",
        }),
        createNotification({
          userId: selectedPsychologist.userId,
          title: "Nueva solicitud de cita",
          body: "Una persona solicitó un horario. Revisa la solicitud y coordina el pago directamente.",
        }),
      ]);
      navigate(`/patient/requests/${appointmentId}`);
    } catch (e) {
      setError(getErrorMessage(e, "No se pudo agendar la sesión"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <PatientFlowSteps current={isDetailView ? 2 : 1} />

      <header className="space-y-2">
        {isDetailView ? (
          <Link
            to="/patient/psychologists"
            className="inline-flex items-center gap-2 text-sm text-club-muted transition hover:text-club-green"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
            Volver a especialistas
          </Link>
        ) : (
          <p className="text-sm font-medium text-club-green">Terapia</p>
        )}
        <h1 className="font-display text-4xl text-club-green">
          {isDetailView ? "Perfil de especialista" : "Encuentra tu psicóloga"}
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-club-muted">
          {isDetailView
            ? "Conoce su enfoque, revisa horarios disponibles y reserva tu primer espacio con calma."
            : "Explora perfiles aprobados por El Club y elige la profesional que se sienta más cercana para ti."}
        </p>
      </header>

      {error ? (
        <p className="rounded-2xl border border-red-200/80 bg-red-50/40 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="h-72 animate-pulse rounded-3xl bg-club-green/5" />
      ) : psychologists.length === 0 ? (
        <EmotionalGlass className="p-8">
          <p className="font-display text-2xl text-club-green">
            Aún no hay psicólogas aprobadas
          </p>
          <p className="mt-2 text-sm text-club-muted">
            Cuando el equipo apruebe perfiles, aparecerán aquí para agendar.
          </p>
        </EmotionalGlass>
      ) : isDetailView && !selectedPsychologist ? (
        <EmotionalGlass className="p-8">
          <p className="font-display text-2xl text-club-green">
            No encontramos este perfil
          </p>
          <p className="mt-2 text-sm text-club-muted">
            Puede que aún no esté aprobado o que haya sido pausado.
          </p>
        </EmotionalGlass>
      ) : (
        <div
          className={
            isDetailView
              ? "grid gap-5 lg:grid-cols-[minmax(0,1fr),360px]"
              : "grid gap-5 lg:grid-cols-[minmax(0,1.1fr),minmax(320px,0.9fr)]"
          }
        >
          <section className="grid gap-4">
            {isDetailView && selectedPsychologist ? (
              <PsychologistFullProfile psychologist={selectedPsychologist} />
            ) : (
              psychologists.map((psychologist, index) => (
                <PsychologistOption
                  key={psychologist.userId}
                  psychologist={psychologist}
                  selected={
                    psychologist.userId === selectedPsychologist?.userId
                  }
                  index={index}
                  onSelect={() => {
                    setSelectedPsychologistId(psychologist.userId);
                  }}
                />
              ))
            )}
          </section>

          <section className="lg:sticky lg:top-24 lg:self-start">
            <BookingPanel
              slots={slots}
              selectedSlot={selectedSlot}
              loadingSlots={loadingSlots}
              saving={saving}
              selectedPsychologist={selectedPsychologist}
              onSelectSlot={setSelectedSlot}
              onSchedule={() => void scheduleSession()}
            />
          </section>
        </div>
      )}
    </div>
  );
}

function PsychologistOption({
  psychologist,
  selected,
  index,
  onSelect,
}: {
  psychologist: PsychologistProfile;
  selected: boolean;
  index: number;
  onSelect: () => void;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.4 }}
      className={[
        "rounded-3xl border p-5 shadow-soft backdrop-blur transition",
        selected
          ? "border-club-green/25 bg-club-green/10"
          : "border-club-green/10 bg-white/40 hover:bg-white/60",
      ].join(" ")}
    >
      <button type="button" onClick={onSelect} className="w-full text-left">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex gap-4">
            <ProfileAvatar profile={psychologist} size="md" />
            <div>
              <p className="font-display text-2xl text-club-green">
                {psychologist.fullName}
              </p>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-club-muted">
                {psychologist.bio}
              </p>
            </div>
          </div>
          {selected ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-3 py-1 text-xs text-club-green">
              <Check className="h-3.5 w-3.5" strokeWidth={1.5} />
              Seleccionada
            </span>
          ) : null}
        </div>
      </button>

      <div className="mt-4 flex flex-wrap gap-2">
        {psychologist.specialties.map((item) => (
          <span
            key={item}
            className="rounded-full bg-white/55 px-3 py-1 text-xs text-club-green"
          >
            {item}
          </span>
        ))}
        <span className="inline-flex items-center gap-1 rounded-full bg-white/55 px-3 py-1 text-xs text-club-muted">
          <Languages className="h-3.5 w-3.5" strokeWidth={1.5} />
          {psychologist.languages.join(", ")}
        </span>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          to={`/patient/psychologists/${psychologist.userId}`}
          className="rounded-2xl bg-club-green px-4 py-2 text-sm text-club-paper transition hover:opacity-95"
        >
          Ver perfil
        </Link>
        <button
          type="button"
          onClick={onSelect}
          className="rounded-2xl border border-club-green/15 bg-white/50 px-4 py-2 text-sm text-club-green transition hover:bg-white/70"
        >
          Ver horarios
        </button>
      </div>
    </motion.article>
  );
}

function PsychologistFullProfile({
  psychologist,
}: {
  psychologist: PsychologistProfile;
}) {
  return (
    <EmotionalGlass className="overflow-hidden p-0">
      <div className="bg-club-green px-6 py-8 text-club-paper md:px-8">
        <div className="flex flex-wrap items-end gap-5">
          <ProfileAvatar profile={psychologist} size="lg" />
          <div>
            <p className="text-sm text-club-paper/75">Especialista El Club</p>
            <h2 className="font-display text-4xl">{psychologist.fullName}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-club-paper/80">
              {psychologist.bio}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 p-6 md:p-8">
        <div className="grid gap-3 md:grid-cols-3">
          <MiniFact
            icon={<ShieldCheck className="h-4 w-4" strokeWidth={1.5} />}
            label="Perfil aprobado"
            value="Verificado por El Club"
          />
          <MiniFact
            icon={<Clock className="h-4 w-4" strokeWidth={1.5} />}
            label="Duración"
            value="50 minutos"
          />
          <MiniFact
            icon={<WalletCards className="h-4 w-4" strokeWidth={1.5} />}
            label="Pago"
            value="Directo con la profesional"
          />
        </div>

        <section className="rounded-3xl border border-club-green/10 bg-white/45 p-5">
          <h3 className="font-display text-2xl text-club-green">
            Pago gestionado por el profesional
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-club-muted">
            EL CLUB no procesa pagos de sesiones. Una vez solicites tu cita, el
            profesional te compartirá sus métodos de pago y confirmará contigo
            los detalles.
          </p>
          {psychologist.paymentMethods?.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {psychologist.paymentMethods.map((method) => (
                <span
                  key={method}
                  className="rounded-full bg-club-green/10 px-3 py-1 text-xs text-club-green"
                >
                  {method}
                </span>
              ))}
            </div>
          ) : null}
        </section>

        <section>
          <h3 className="font-display text-2xl text-club-green">
            Áreas de acompañamiento
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {psychologist.specialties.map((item) => (
              <span
                key={item}
                className="rounded-full bg-club-green/10 px-3 py-1 text-xs text-club-green"
              >
                {item}
              </span>
            ))}
          </div>
        </section>

        <section>
          <h3 className="font-display text-2xl text-club-green">Idiomas</h3>
          <p className="mt-2 text-sm text-club-muted">
            {psychologist.languages.join(", ")}
          </p>
        </section>

        <section className="rounded-3xl border border-club-green/10 bg-white/45 p-5">
          <h3 className="font-display text-2xl text-club-green">
            Cómo se siente este espacio
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-club-muted">
            Una primera sesión para ordenar lo que estás viviendo, hacer
            preguntas con tranquilidad y decidir el ritmo de acompañamiento que
            mejor se acomode a ti.
          </p>
        </section>
      </div>
    </EmotionalGlass>
  );
}

function BookingPanel({
  slots,
  selectedSlot,
  loadingSlots,
  saving,
  selectedPsychologist,
  onSelectSlot,
  onSchedule,
}: {
  slots: AvailabilitySlot[];
  selectedSlot: AvailabilitySlot | null;
  loadingSlots: boolean;
  saving: boolean;
  selectedPsychologist: PsychologistProfile | null;
  onSelectSlot: (slot: AvailabilitySlot) => void;
  onSchedule: () => void;
}) {
  return (
    <EmotionalGlass className="p-5">
      <div className="flex items-center gap-2 text-club-green">
        <CalendarPlus className="h-5 w-5" strokeWidth={1.5} />
        <p className="font-display text-2xl">Reservar sesión</p>
      </div>
      <p className="mt-2 text-sm text-club-muted">
        Elige un horario disponible. La especialista revisará tu solicitud y el
        pago se acordará directamente con ella.
      </p>

      {selectedPsychologist ? (
        <div className="mt-5 rounded-2xl border border-club-green/10 bg-white/45 p-4">
          <p className="text-xs text-club-muted">Especialista seleccionada</p>
          <p className="mt-1 font-display text-2xl text-club-green">
            {selectedPsychologist.fullName}
          </p>
          <p className="mt-1 text-xs text-club-muted">
            Coordinar pago con el profesional
          </p>
        </div>
      ) : null}

      {loadingSlots ? (
        <div className="mt-5 h-40 animate-pulse rounded-2xl bg-club-green/5" />
      ) : slots.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-club-green/10 bg-white/50 p-4">
          <p className="text-sm text-club-muted">
            Esta psicóloga aún no tiene horarios publicados.
          </p>
        </div>
      ) : (
        <div className="mt-5 grid gap-2">
          {slots.map((slot) => {
            const selected = selectedSlot?.id === slot.id;
            return (
              <button
                key={slot.id}
                type="button"
                onClick={() => onSelectSlot(slot)}
                className={[
                  "rounded-2xl border px-4 py-3 text-left text-sm transition",
                  selected
                    ? "border-club-green/25 bg-club-green/10 text-club-green"
                    : "border-club-green/10 bg-white/50 text-club-muted hover:bg-white/75",
                ].join(" ")}
              >
                <span className="block capitalize">
                  {formatSessionDate(slot.startsAt)}
                </span>
                <span className="block">
                  {formatSessionRange(slot.startsAt, slot.endsAt)}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <button
        type="button"
        disabled={!selectedSlot || !selectedPsychologist || saving}
        onClick={onSchedule}
        className="mt-5 w-full rounded-2xl bg-club-green px-5 py-3 text-sm text-club-paper shadow-soft transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? "Solicitando..." : "Solicitar cita"}
      </button>
    </EmotionalGlass>
  );
}

function ProfileAvatar({
  profile,
  size,
}: {
  profile: PsychologistProfile;
  size: "md" | "lg";
}) {
  const className =
    size === "lg"
      ? "h-24 w-24 rounded-[2rem]"
      : "h-14 w-14 rounded-3xl";

  if (profile.avatarUrl) {
    return (
      <img
        src={profile.avatarUrl}
        alt=""
        className={`${className} object-cover`}
      />
    );
  }

  return (
    <div
      className={`${className} flex items-center justify-center bg-white/20 text-current`}
    >
      <Sparkles className="h-5 w-5" strokeWidth={1.5} />
    </div>
  );
}

function MiniFact({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl border border-club-green/10 bg-white/45 p-4">
      <div className="flex items-center gap-2 text-club-green">
        {icon}
        <p className="text-xs text-club-muted">{label}</p>
      </div>
      <p className="mt-2 text-sm font-medium text-club-ink">{value}</p>
    </div>
  );
}

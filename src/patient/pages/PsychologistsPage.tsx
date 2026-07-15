import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  CalendarPlus,
  Check,
  CheckCircle,
  Clock,
  Languages,
  MessageCircle,
  Search,
  SearchX,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import { EmptyState } from "../../components/ui/EmptyState";
import { CardTitle, PageTitle } from "../../components/ui/Typography";
import {
  fetchBookableAvailability,
  type AvailabilitySlot,
} from "../../appointments/availability";
import { bookAppointmentAtomically } from "../../appointments/patient";
import { sendAppointmentEventNotification } from "../../appointments/notifications";
import { createNotification } from "../../notifications/service";
import { fetchApprovedPsychologists } from "../../services/supabase/psychologists";
import { useSessionStore } from "../../store/sessionStore";
import { getErrorMessage } from "../../utils/errors";
import { fetchPatientOnboarding } from "../onboarding/service";
import type { PsychologistProfile } from "../../psychologist/types";
import { EmotionalGlass } from "../components/EmotionalGlass";
import { PatientFlowSteps } from "../components/PatientFlowSteps";
import { formatSessionDate, formatSessionRange } from "../utils/formatDate";

const COP = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

function buildWhatsAppUrl(phone: string, psychName: string, date: string, time: string): string {
  const clean = phone.replace(/[^+\d]/g, "");
  const num = clean.startsWith("+") ? clean.slice(1) : clean;
  const text = `Hola ${psychName}, acabo de solicitar una cita en El Club para el ${date} a las ${time}. ¿Me podrías indicar cómo realizar el pago?`;
  return `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function getRecommendationScore(
  psychologist: PsychologistProfile,
  terms: Set<string>,
): number {
  if (terms.size === 0) return 0;
  const haystack = [
    psychologist.bio,
    ...psychologist.specialties,
    ...psychologist.languages,
  ]
    .filter(Boolean)
    .map((value) => normalizeText(String(value)));

  let score = 0;
  for (const term of terms) {
    if (!term) continue;
    if (haystack.some((value) => value.includes(term) || term.includes(value))) {
      score += 1;
    }
  }
  return score;
}

type PriceSort = "none" | "asc" | "desc";

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
  const [showConfirm, setShowConfirm] = useState(false);
  const [bookedId, setBookedId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeSpecialties, setActiveSpecialties] = useState<Set<string>>(new Set());
  const [activeLanguages, setActiveLanguages] = useState<Set<string>>(new Set());
  const [priceSort, setPriceSort] = useState<PriceSort>("none");
  const [showFilters, setShowFilters] = useState(false);
  const [recommendedSpecialties, setRecommendedSpecialties] = useState<Set<string>>(new Set());

  const allSpecialties = useMemo(() => {
    const set = new Set<string>();
    psychologists.forEach((p) => p.specialties.forEach((s) => set.add(s)));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "es"));
  }, [psychologists]);

  const allLanguages = useMemo(() => {
    const set = new Set<string>();
    psychologists.forEach((p) => p.languages.forEach((l) => set.add(l)));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "es"));
  }, [psychologists]);

  const filteredPsychologists = useMemo(() => {
    let result = psychologists;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.fullName.toLowerCase().includes(q) ||
          p.bio?.toLowerCase().includes(q) ||
          p.specialties.some((s) => s.toLowerCase().includes(q)),
      );
    }

    if (activeSpecialties.size > 0) {
      result = result.filter((p) =>
        p.specialties.some((s) => activeSpecialties.has(s)),
      );
    }

    if (activeLanguages.size > 0) {
      result = result.filter((p) =>
        p.languages.some((l) => activeLanguages.has(l)),
      );
    }

    if (priceSort !== "none") {
      result = [...result].sort((a, b) => {
        const pa = a.sessionPriceCents ?? Infinity;
        const pb = b.sessionPriceCents ?? Infinity;
        return priceSort === "asc" ? pa - pb : pb - pa;
      });
    } else if (recommendedSpecialties.size > 0) {
      result = [...result].sort(
        (a, b) =>
          getRecommendationScore(b, recommendedSpecialties) -
          getRecommendationScore(a, recommendedSpecialties),
      );
    }

    return result;
  }, [psychologists, searchQuery, activeSpecialties, activeLanguages, priceSort, recommendedSpecialties]);

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    activeSpecialties.size > 0 ||
    activeLanguages.size > 0 ||
    priceSort !== "none";

  const selectedPsychologist = useMemo(
    () =>
      psychologists.find((p) => p.userId === selectedPsychologistId) ??
      psychologists.find((p) => p.userId === psychologistId) ??
      psychologists[0] ??
      null,
    [psychologistId, psychologists, selectedPsychologistId],
  );

  const isDetailView = Boolean(psychologistId);

  const currentStep = bookedId ? 3 : showConfirm ? 2 : isDetailView ? 1 : 0;

  const loadPsychologists = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchApprovedPsychologists();
      setPsychologists(data);
      setSelectedPsychologistId(
        (current) => current ?? data[0]?.userId ?? null,
      );
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
    if (!patientId) return;

    queueMicrotask(async () => {
      try {
        const onboarding = await fetchPatientOnboarding(patientId);
        const terms = [
          onboarding?.mainConcern,
          ...(onboarding?.emotionalGoals ?? []),
          ...(onboarding?.therapyPreferences ?? []),
          onboarding?.supportStyle,
        ]
          .filter(Boolean)
          .map((value) => normalizeText(String(value)));
        setRecommendedSpecialties(new Set(terms));
      } catch (e) {
        console.error("Failed to load onboarding recommendations", e);
      }
    });
  }, [patientId]);

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
          body: "Tu solicitud fue enviada. El pago se coordina directamente con la psicóloga según sus métodos disponibles.",
        }),
        createNotification({
          userId: selectedPsychologist.userId,
          title: "Nueva solicitud de cita",
          body: "Una persona solicitó un horario. Revisa la solicitud y coordina el pago directamente.",
        }),
        sendAppointmentEventNotification({
          appointmentId,
          event: "requested",
        }),
      ]);
      setBookedId(appointmentId);
    } catch (e) {
      setError(getErrorMessage(e, "No se pudo agendar la sesión"));
      setShowConfirm(false);
    } finally {
      setSaving(false);
    }
  }

  function closeModalAndNavigate() {
    if (bookedId) {
      navigate(`/patient/requests/${bookedId}`);
    }
    setShowConfirm(false);
    setBookedId(null);
  }

  function toggleSpecialty(s: string) {
    setActiveSpecialties((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  }

  function toggleLanguage(l: string) {
    setActiveLanguages((prev) => {
      const next = new Set(prev);
      if (next.has(l)) next.delete(l);
      else next.add(l);
      return next;
    });
  }

  function clearFilters() {
    setSearchQuery("");
    setActiveSpecialties(new Set());
    setActiveLanguages(new Set());
    setPriceSort("none");
  }

  return (
    <div className="space-y-8">
      <PatientFlowSteps current={currentStep} />

      <header className="space-y-2">
        {isDetailView ? (
          <Link
            to="/patient/psychologists"
            className="inline-flex items-center gap-2 text-sm text-club-muted transition hover:text-club-green"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
            Volver a psicólogas
          </Link>
        ) : (
          <p className="text-sm font-medium text-club-green">Terapia</p>
        )}
        <PageTitle>
          {isDetailView ? "Perfil de psicóloga" : "Encuentra tu psicóloga"}
        </PageTitle>
        <p className="max-w-2xl text-sm leading-relaxed text-club-muted">
          {isDetailView
            ? "Conoce su enfoque, revisa horarios disponibles y reserva tu primer espacio con calma."
            : "Explora perfiles aprobados por El Club y elige la psicóloga que se sienta más cercana para ti."}
        </p>
      </header>

      {!isDetailView && !loading && psychologists.length > 0 ? (
        <section className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-club-muted" strokeWidth={1.5} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre, especialidad..."
                className="w-full rounded-2xl border border-club-green/10 bg-white/60 py-2.5 pl-10 pr-4 text-sm text-club-ink placeholder:text-club-muted/60 outline-none transition focus:border-club-green/30 focus:bg-white/80"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-club-muted transition hover:text-club-ink"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={1.5} />
                </button>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => setShowFilters((v) => !v)}
              className={[
                "flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm transition",
                showFilters || hasActiveFilters
                  ? "border-club-green/25 bg-club-green/10 text-club-green"
                  : "border-club-green/10 bg-white/60 text-club-muted hover:bg-white/80",
              ].join(" ")}
            >
              <SlidersHorizontal className="h-4 w-4" strokeWidth={1.5} />
              Filtros
              {hasActiveFilters ? (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-club-green text-[10px] text-club-paper">
                  {activeSpecialties.size + activeLanguages.size + (priceSort !== "none" ? 1 : 0)}
                </span>
              ) : null}
            </button>
          </div>

          <AnimatePresence>
            {showFilters ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="space-y-4 rounded-2xl border border-club-green/10 bg-white/50 p-4">
                  {allSpecialties.length > 0 ? (
                    <div>
                      <p className="mb-2 text-xs font-medium text-club-muted">Especialidad</p>
                      <div className="flex flex-wrap gap-1.5">
                        {allSpecialties.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => toggleSpecialty(s)}
                            className={[
                              "rounded-full px-3 py-1 text-xs transition",
                              activeSpecialties.has(s)
                                ? "bg-club-green text-club-paper"
                                : "bg-club-green/10 text-club-green hover:bg-club-green/20",
                            ].join(" ")}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {allLanguages.length > 0 ? (
                    <div>
                      <p className="mb-2 text-xs font-medium text-club-muted">Idioma</p>
                      <div className="flex flex-wrap gap-1.5">
                        {allLanguages.map((l) => (
                          <button
                            key={l}
                            type="button"
                            onClick={() => toggleLanguage(l)}
                            className={[
                              "rounded-full px-3 py-1 text-xs transition",
                              activeLanguages.has(l)
                                ? "bg-club-green text-club-paper"
                                : "bg-club-green/10 text-club-green hover:bg-club-green/20",
                            ].join(" ")}
                          >
                            {l}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div>
                    <p className="mb-2 text-xs font-medium text-club-muted">Precio</p>
                    <div className="flex gap-1.5">
                      {([
                        ["none", "Sin orden"],
                        ["asc", "Menor a mayor"],
                        ["desc", "Mayor a menor"],
                      ] as const).map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setPriceSort(value)}
                          className={[
                            "rounded-full px-3 py-1 text-xs transition",
                            priceSort === value
                              ? "bg-club-green text-club-paper"
                              : "bg-club-green/10 text-club-green hover:bg-club-green/20",
                          ].join(" ")}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {hasActiveFilters ? (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="text-xs text-club-rose transition hover:text-club-rose/80"
                    >
                      Limpiar filtros
                    </button>
                  ) : null}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </section>
      ) : null}

      {error ? (
        <p className="rounded-2xl border border-red-200/80 bg-red-50/40 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="h-72 animate-pulse rounded-3xl bg-club-green/5" />
      ) : psychologists.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Aún no hay psicólogas aprobadas"
          description="Cuando el equipo apruebe perfiles, aparecerán aquí para agendar."
        />
      ) : isDetailView && !selectedPsychologist ? (
        <EmptyState
          icon={SearchX}
          title="No encontramos este perfil"
          description="Puede que aún no esté aprobado o que haya sido pausado."
          action={{
            label: "Ver todas las psicólogas",
            to: "/patient/psychologists",
          }}
        />
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
            ) : filteredPsychologists.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-3xl border border-club-green/10 bg-white/50 px-6 py-12 text-center">
                <SearchX className="h-8 w-8 text-club-muted/50" strokeWidth={1.5} />
                <p className="text-sm text-club-muted">
                  No encontramos psicólogas con esos filtros.
                </p>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="rounded-2xl border border-club-green/15 bg-white/70 px-4 py-2 text-sm text-club-green transition hover:bg-white/90"
                >
                  Limpiar filtros
                </button>
              </div>
            ) : (
              filteredPsychologists.map((psychologist, index) => (
                <PsychologistOption
                  key={psychologist.userId}
                  psychologist={psychologist}
                  selected={
                    psychologist.userId === selectedPsychologist?.userId
                  }
                  recommended={
                    getRecommendationScore(psychologist, recommendedSpecialties) > 0
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
              onSchedule={() => setShowConfirm(true)}
            />
          </section>
        </div>
      )}

      <AnimatePresence>
        {showConfirm && selectedPsychologist && selectedSlot ? (
          <ConfirmationModal
            psychologist={selectedPsychologist}
            slot={selectedSlot}
            saving={saving}
            booked={Boolean(bookedId)}
            onConfirm={() => void scheduleSession()}
            onCancel={() => {
              if (!saving) {
                setShowConfirm(false);
                setBookedId(null);
              }
            }}
            onDone={closeModalAndNavigate}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}

/* ─── Confirmation modal ─────────────────────────────────────────── */

function ConfirmationModal({
  psychologist,
  slot,
  saving,
  booked,
  onConfirm,
  onCancel,
  onDone,
}: {
  psychologist: PsychologistProfile;
  slot: AvailabilitySlot;
  saving: boolean;
  booked: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  onDone: () => void;
}) {
  const priceLine =
    psychologist.sessionPriceCents != null
      ? COP.format(psychologist.sessionPriceCents / 100)
      : null;

  const dateStr = formatSessionDate(slot.startsAt);
  const timeStr = formatSessionRange(slot.startsAt, slot.endsAt);

  const hasWhatsApp =
    psychologist.allowWhatsappAfterRequest !== false &&
    Boolean(psychologist.professionalWhatsapp?.trim());

  const whatsAppUrl = hasWhatsApp
    ? buildWhatsAppUrl(
        psychologist.professionalWhatsapp!,
        psychologist.fullName,
        dateStr,
        timeStr,
      )
    : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-club-ink/40 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) {
          if (booked) onDone();
          else onCancel();
        }
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ type: "spring", duration: 0.4 }}
        className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-club-green/10 bg-club-paper shadow-xl"
      >
        {booked ? (
          /* ─── Success / next-steps view ─── */
          <>
            <div className="bg-club-green px-6 py-5 text-club-paper">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-7 w-7 text-club-paper/90" strokeWidth={1.5} />
                  <div>
                    <p className="text-sm text-club-paper/70">Solicitud enviada</p>
                    <h2 className="font-display text-3xl">¡Listo!</h2>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onDone}
                  className="rounded-full p-1 text-club-paper/60 transition hover:text-club-paper"
                >
                  <X className="h-5 w-5" strokeWidth={1.5} />
                </button>
              </div>
            </div>

            <div className="grid gap-4 p-6">
              <div className="grid gap-3 sm:grid-cols-2">
                <SummaryItem label="Psicóloga" value={psychologist.fullName} />
                <SummaryItem label="Fecha" value={dateStr} capitalize />
                <SummaryItem label="Horario" value={timeStr} />
                {priceLine ? (
                  <SummaryItem label="Valor" value={priceLine} />
                ) : null}
              </div>

              <div className="rounded-2xl border border-club-green/10 bg-club-green/5 p-4">
                <p className="text-xs font-medium text-club-green">
                  Siguiente paso: coordina tu pago
                </p>
                <p className="mt-1 text-sm leading-relaxed text-club-muted">
                  {hasWhatsApp
                    ? `Escríbele a ${psychologist.fullName} por WhatsApp para coordinar el pago y confirmar tu cita.`
                    : `${psychologist.fullName} se pondrá en contacto contigo para coordinar el pago y confirmar tu cita.`}
                </p>
              </div>

              {hasWhatsApp && whatsAppUrl ? (
                <a
                  href={whatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-5 py-3.5 text-sm font-medium text-white shadow-soft transition hover:opacity-90"
                >
                  <MessageCircle className="h-5 w-5" strokeWidth={1.5} />
                  Escribir por WhatsApp
                </a>
              ) : null}

              {psychologist.paymentMethods?.length ? (
                <div className="rounded-2xl border border-club-green/10 bg-white/50 p-4">
                  <p className="text-xs text-club-muted">Métodos de pago aceptados</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {psychologist.paymentMethods.map((method) => (
                      <span
                        key={method}
                        className="rounded-full bg-club-green/10 px-2.5 py-0.5 text-xs text-club-green"
                      >
                        {method}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {psychologist.nequiNumber || psychologist.nequiQrUrl ? (
                <div className="rounded-2xl border border-club-green/10 bg-white/50 p-4">
                  <p className="text-xs text-club-muted">Nequi</p>
                  <div className="mt-2 flex flex-wrap items-center gap-4">
                    {psychologist.nequiNumber ? (
                      <p className="text-sm font-medium text-club-ink">
                        {psychologist.nequiNumber}
                      </p>
                    ) : null}
                    {psychologist.nequiQrUrl ? (
                      <img
                        src={psychologist.nequiQrUrl}
                        alt="QR de Nequi"
                        className="h-24 w-24 rounded-2xl border border-club-green/10 object-cover"
                      />
                    ) : null}
                  </div>
                </div>
              ) : null}

              {psychologist.paymentInstructions ? (
                <div className="rounded-2xl border border-club-green/10 bg-white/50 p-4">
                  <p className="text-xs text-club-muted">Instrucciones de pago</p>
                  <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-club-ink">
                    {psychologist.paymentInstructions}
                  </p>
                </div>
              ) : null}

              <button
                type="button"
                onClick={onDone}
                className="w-full rounded-2xl border border-club-green/15 bg-white/70 px-5 py-3 text-sm text-club-green transition hover:bg-white/90"
              >
                Ver mi solicitud
              </button>
            </div>
          </>
        ) : (
          /* ─── Confirmation view (original) ─── */
          <>
            <div className="bg-club-green px-6 py-5 text-club-paper">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-club-paper/70">Confirmar solicitud</p>
                  <h2 className="font-display text-3xl">Resumen de tu cita</h2>
                </div>
                {!saving ? (
                  <button
                    type="button"
                    onClick={onCancel}
                    className="rounded-full p-1 text-club-paper/60 transition hover:text-club-paper"
                  >
                    <X className="h-5 w-5" strokeWidth={1.5} />
                  </button>
                ) : null}
              </div>
            </div>

            <div className="grid gap-4 p-6">
              <div className="grid gap-3 sm:grid-cols-2">
                <SummaryItem label="Psicóloga" value={psychologist.fullName} />
                <SummaryItem label="Fecha" value={dateStr} capitalize />
                <SummaryItem label="Horario" value={timeStr} />
                {priceLine ? (
                  <SummaryItem label="Valor de la sesión" value={priceLine} />
                ) : null}
              </div>

              <div className="rounded-2xl border border-club-green/10 bg-club-green/5 p-4">
                <p className="text-xs font-medium text-club-green">
                  ¿Cómo funciona el pago?
                </p>
                <p className="mt-1 text-sm leading-relaxed text-club-muted">
                  EL CLUB no procesa pagos de sesiones. Una vez confirmes, la
                  psicóloga te compartirá sus métodos de pago y coordinarás
                  directamente con ella.
                </p>
                {psychologist.paymentMethods?.length ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {psychologist.paymentMethods.map((method) => (
                      <span
                        key={method}
                        className="rounded-full bg-white/70 px-2.5 py-0.5 text-xs text-club-green"
                      >
                        {method}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={onCancel}
                  className="flex-1 rounded-2xl border border-club-green/15 bg-white/70 px-5 py-3 text-sm text-club-green transition hover:bg-white/90 disabled:opacity-60"
                >
                  Volver
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={onConfirm}
                  className="flex-1 rounded-2xl bg-club-green px-5 py-3 text-sm text-club-paper shadow-soft transition hover:opacity-95 disabled:opacity-60"
                >
                  {saving ? "Solicitando..." : "Confirmar solicitud"}
                </button>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

function SummaryItem({
  label,
  value,
  capitalize,
}: {
  label: string;
  value: string;
  capitalize?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-club-green/10 bg-white/50 p-3">
      <p className="text-xs text-club-muted">{label}</p>
      <p
        className={[
          "mt-0.5 text-sm font-medium text-club-ink",
          capitalize ? "capitalize" : "",
        ].join(" ")}
      >
        {value}
      </p>
    </div>
  );
}

/* ─── Existing sub-components (unchanged logic, kept inline) ───── */

function PsychologistOption({
  psychologist,
  selected,
  recommended,
  index,
  onSelect,
}: {
  psychologist: PsychologistProfile;
  selected: boolean;
  recommended: boolean;
  index: number;
  onSelect: () => void;
}) {
  const priceLine =
    psychologist.sessionPriceCents != null
      ? COP.format(psychologist.sessionPriceCents / 100)
      : null;

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.4 }}
      className={[
        "rounded-3xl border p-5 shadow-soft backdrop-blur transition",
        selected
          ? "border-club-green/25 bg-club-green/10"
          : "border-club-green/10 bg-white/50 hover:bg-white/60",
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
              {priceLine ? (
                <p className="mt-1.5 text-sm font-medium text-club-brass">
                  {priceLine} / sesión
                </p>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {recommended ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-club-brass/15 px-3 py-1 text-xs text-club-brass">
                <Sparkles className="h-3.5 w-3.5" strokeWidth={1.5} />
                Afinidad
              </span>
            ) : null}
            {selected ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-3 py-1 text-xs text-club-green">
                <Check className="h-3.5 w-3.5" strokeWidth={1.5} />
                Seleccionada
              </span>
            ) : null}
          </div>
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
  const priceLine =
    psychologist.sessionPriceCents != null
      ? COP.format(psychologist.sessionPriceCents / 100)
      : null;

  return (
    <EmotionalGlass className="overflow-hidden p-0">
      <div className="bg-club-green px-6 py-8 text-club-paper md:px-8">
        <div className="flex flex-wrap items-end gap-5">
          <ProfileAvatar profile={psychologist} size="lg" />
          <div>
            <p className="text-sm text-club-paper/75">Psicóloga de El Club</p>
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
            label="Valor"
            value={priceLine ?? "Consultar con la psicóloga"}
          />
        </div>

        <section className="rounded-3xl border border-club-green/10 bg-white/50 p-5">
          <CardTitle className="text-2xl">
            Pago gestionado por la psicóloga
          </CardTitle>
          <p className="mt-2 text-sm leading-relaxed text-club-muted">
            EL CLUB no procesa pagos de sesiones. Una vez solicites tu cita, la
            psicóloga te compartirá sus métodos de pago y confirmará contigo los
            detalles.
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
          <CardTitle className="text-2xl">Áreas de acompañamiento</CardTitle>
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
          <CardTitle className="text-2xl">Idiomas</CardTitle>
          <p className="mt-2 text-sm text-club-muted">
            {psychologist.languages.join(", ")}
          </p>
        </section>

        <section className="rounded-3xl border border-club-green/10 bg-white/50 p-5">
          <CardTitle className="text-2xl">Cómo se siente este espacio</CardTitle>
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
        Elige un horario disponible. Antes de confirmar verás un resumen con
        todos los detalles.
      </p>

      {selectedPsychologist ? (
        <div className="mt-5 rounded-2xl border border-club-green/10 bg-white/50 p-4">
          <p className="text-xs text-club-muted">Psicóloga seleccionada</p>
          <p className="mt-1 font-display text-2xl text-club-green">
            {selectedPsychologist.fullName}
          </p>
          {selectedPsychologist.sessionPriceCents != null ? (
            <p className="mt-1 text-sm font-medium text-club-brass">
              {COP.format(selectedPsychologist.sessionPriceCents / 100)} / sesión
            </p>
          ) : (
            <p className="mt-1 text-xs text-club-muted">
              Coordinar valor con la psicóloga
            </p>
          )}
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
        Revisar y confirmar
      </button>
      {!selectedSlot && !saving ? (
        <p className="mt-2 text-xs text-club-muted">
          Selecciona un horario para continuar.
        </p>
      ) : null}
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
    size === "lg" ? "h-24 w-24 rounded-[2rem]" : "h-14 w-14 rounded-3xl";

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
    <div className="rounded-3xl border border-club-green/10 bg-white/50 p-4">
      <div className="flex items-center gap-2 text-club-green">
        {icon}
        <p className="text-xs text-club-muted">{label}</p>
      </div>
      <p className="mt-2 text-sm font-medium text-club-ink">{value}</p>
    </div>
  );
}

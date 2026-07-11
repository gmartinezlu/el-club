import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  FileText,
  PauseCircle,
  Search,
  SearchX,
  Sparkles,
  XCircle,
} from "lucide-react";
import {
  fetchAdminPsychologists,
  reviewPsychologistApplication,
  type AdminPsychologist,
  type PsychologistApplicationStatus,
} from "../psychologists";
import { getErrorMessage } from "../../utils/errors";
import { createSignedDocumentUrl } from "../../psychologist/documents";
import { EmptyState } from "../../components/ui/EmptyState";

type ApprovalFilter =
  | "pending"
  | "approved"
  | "rejected"
  | "paused"
  | "all";
type ReviewAction = Exclude<PsychologistApplicationStatus, "pending">;

const FILTERS: { value: ApprovalFilter; label: string }[] = [
  { value: "pending", label: "Pendientes" },
  { value: "approved", label: "Aprobadas" },
  { value: "rejected", label: "Rechazadas" },
  { value: "paused", label: "Pausadas" },
  { value: "all", label: "Todas" },
];

const STATUS_LABELS: Record<PsychologistApplicationStatus, string> = {
  pending: "Pendiente",
  approved: "Aprobada",
  rejected: "Rechazada",
  paused: "Pausada",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function AdminPsychologistsPage() {
  const [psychologists, setPsychologists] = useState<AdminPsychologist[]>([]);
  const [filter, setFilter] = useState<ApprovalFilter>("pending");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reviewTarget, setReviewTarget] = useState<AdminPsychologist | null>(
    null,
  );
  const [reviewAction, setReviewAction] = useState<ReviewAction | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");

  const loadPsychologists = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setPsychologists(await fetchAdminPsychologists());
    } catch (e) {
      setError(getErrorMessage(e, "No se pudieron cargar las psicólogas"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void loadPsychologists();
    });
  }, [loadPsychologists]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return psychologists.filter((psychologist) => {
      const matchesFilter =
        filter === "all" || psychologist.applicationStatus === filter;

      if (!matchesFilter) return false;
      if (!normalized) return true;

      return (
        psychologist.fullName.toLowerCase().includes(normalized) ||
        psychologist.bio?.toLowerCase().includes(normalized) ||
        psychologist.licenseNumber?.toLowerCase().includes(normalized) ||
        psychologist.professionalTitle?.toLowerCase().includes(normalized) ||
        psychologist.university?.toLowerCase().includes(normalized) ||
        psychologist.specialties.some((item) =>
          item.toLowerCase().includes(normalized),
        )
      );
    });
  }, [filter, psychologists, query]);

  async function reviewApplication({
    userId,
    status,
    notes,
  }: {
    userId: string;
    status: PsychologistApplicationStatus;
    notes?: string;
  }) {
    setSavingId(userId);
    setError(null);
    try {
      await reviewPsychologistApplication({
        userId,
        status,
        reviewNotes: notes,
      });
      await loadPsychologists();
      closeReview();
    } catch (e) {
      setError(getErrorMessage(e, "No se pudo actualizar la revisión"));
    } finally {
      setSavingId(null);
    }
  }

  function openReview(psychologist: AdminPsychologist, action: ReviewAction) {
    setReviewTarget(psychologist);
    setReviewAction(action);
    setReviewNotes(psychologist.reviewNotes ?? "");
  }

  function closeReview() {
    if (savingId) return;
    setReviewTarget(null);
    setReviewAction(null);
    setReviewNotes("");
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-sm font-medium text-club-green">Equipo clínico</p>
        <h1 className="font-display text-4xl text-club-green">
          Aprobación de psicólogas
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-club-muted">
          Revisa credenciales, soportes profesionales y el estado de cada
          postulación antes de abrir el perfil a personas.
        </p>
      </header>

      {error ? (
        <p className="rounded-2xl border border-red-200/80 bg-red-50/40 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setFilter(item.value)}
              className={[
                "rounded-2xl border px-4 py-2 text-sm transition",
                filter === item.value
                  ? "border-club-green/20 bg-club-green/10 text-club-green"
                  : "border-club-green/10 bg-white/50 text-club-muted hover:bg-white/70",
              ].join(" ")}
            >
              {item.label}
            </button>
          ))}
        </div>

        <label className="flex w-full max-w-md items-center gap-3 rounded-2xl border border-club-green/10 bg-white/50 px-4 py-2.5 shadow-soft backdrop-blur">
          <Search className="h-4 w-4 text-club-green" strokeWidth={1.5} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre, licencia o universidad"
            className="w-full bg-transparent text-sm text-club-ink outline-none placeholder:text-club-muted"
          />
        </label>
      </div>

      {loading ? (
        <div className="h-72 animate-pulse rounded-3xl bg-club-green/5" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No hay perfiles para este filtro"
          description="Prueba otro estado o ajusta la búsqueda."
        />
      ) : (
        <div className="grid gap-4">
          {filtered.map((psychologist) => (
            <PsychologistReviewCard
              key={psychologist.userId}
              psychologist={psychologist}
              saving={savingId === psychologist.userId}
              onApprove={() =>
                void reviewApplication({
                  userId: psychologist.userId,
                  status: "approved",
                })
              }
              onReject={() => openReview(psychologist, "rejected")}
              onPause={() => openReview(psychologist, "paused")}
            />
          ))}
        </div>
      )}

      {reviewTarget && reviewAction ? (
        <ReviewDecisionModal
          psychologist={reviewTarget}
          action={reviewAction}
          notes={reviewNotes}
          saving={savingId === reviewTarget.userId}
          onNotesChange={setReviewNotes}
          onClose={closeReview}
          onConfirm={() =>
            void reviewApplication({
              userId: reviewTarget.userId,
              status: reviewAction,
              notes: reviewNotes,
            })
          }
        />
      ) : null}
    </div>
  );
}

function PsychologistReviewCard({
  psychologist,
  saving,
  onApprove,
  onReject,
  onPause,
}: {
  psychologist: AdminPsychologist;
  saving: boolean;
  onApprove: () => void;
  onReject: () => void;
  onPause: () => void;
}) {
  const isPending = psychologist.applicationStatus === "pending";
  const isApproved = psychologist.applicationStatus === "approved";
  const statusTone =
    psychologist.applicationStatus === "approved"
      ? "bg-club-green/10 text-club-green"
      : psychologist.applicationStatus === "rejected"
        ? "bg-red-50 text-red-800"
        : psychologist.applicationStatus === "paused"
          ? "bg-amber-50 text-amber-800"
          : "bg-white/70 text-club-muted";

  async function openProfessionalDocument() {
    if (!psychologist.documentUrl) return;
    if (/^https?:\/\//.test(psychologist.documentUrl)) {
      window.open(psychologist.documentUrl, "_blank", "noopener,noreferrer");
      return;
    }

    const signedUrl = await createSignedDocumentUrl(psychologist.documentUrl);
    window.open(signedUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <article className="rounded-3xl border border-club-green/10 bg-white/50 p-5 shadow-soft backdrop-blur">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex gap-4">
          {psychologist.avatarUrl ? (
            <img
              src={psychologist.avatarUrl}
              alt=""
              className="h-14 w-14 rounded-3xl object-cover"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-club-green/10 text-club-green">
              <Sparkles className="h-5 w-5" strokeWidth={1.5} />
            </div>
          )}

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-2xl text-club-green">
                {psychologist.fullName}
              </h2>
              <span
                className={["rounded-full px-3 py-1 text-xs", statusTone].join(
                  " ",
                )}
              >
                {STATUS_LABELS[psychologist.applicationStatus]}
              </span>
            </div>
            <p className="mt-1 text-xs text-club-muted">
              Registro: {formatDate(psychologist.createdAt)}
            </p>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-club-muted">
              {psychologist.bio || "Sin bio registrada todavía."}
            </p>
            <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
              <ReviewFact label="Título" value={psychologist.professionalTitle} />
              <ReviewFact label="Licencia" value={psychologist.licenseNumber} />
              <ReviewFact label="Universidad" value={psychologist.university} />
              <ReviewFact
                label="Experiencia"
                value={
                  psychologist.experienceYears !== null
                    ? `${psychologist.experienceYears} años`
                    : null
                }
              />
            </div>
            {psychologist.clinicalApproach ? (
              <p className="mt-4 max-w-2xl rounded-2xl bg-white/50 p-4 text-sm leading-relaxed text-club-muted">
                {psychologist.clinicalApproach}
              </p>
            ) : null}
            {psychologist.applicationNotes ? (
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-club-muted">
                <span className="text-club-green">Notas:</span>{" "}
                {psychologist.applicationNotes}
              </p>
            ) : null}
            {psychologist.reviewedAt ? (
              <div className="mt-3 rounded-2xl border border-club-green/10 bg-white/50 p-4 text-sm text-club-muted">
                <p className="flex items-center gap-2 text-club-green">
                  <Clock3 className="h-4 w-4" strokeWidth={1.5} />
                  Revisada el {formatDate(psychologist.reviewedAt)}
                  {psychologist.reviewerName
                    ? ` por ${psychologist.reviewerName}`
                    : ""}
                </p>
                {psychologist.reviewNotes ? (
                  <p className="mt-2 leading-relaxed">
                    {psychologist.reviewNotes}
                  </p>
                ) : null}
              </div>
            ) : null}
            {psychologist.documentUrl ? (
              <button
                type="button"
                onClick={() => void openProfessionalDocument()}
                className="mt-3 inline-flex text-sm text-club-green hover:underline"
              >
                Ver soporte profesional
              </button>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {!isApproved ? (
            <button
              type="button"
              disabled={saving}
              onClick={onApprove}
              className="inline-flex items-center gap-2 rounded-2xl bg-club-green px-4 py-2 text-sm text-club-paper transition hover:opacity-95 disabled:opacity-60"
            >
              <CheckCircle2 className="h-4 w-4" strokeWidth={1.5} />
              {saving ? "Aprobando..." : "Aprobar"}
            </button>
          ) : null}

          {isApproved ? (
            <button
              type="button"
              disabled={saving}
              onClick={onPause}
              className="inline-flex items-center gap-2 rounded-2xl border border-club-green/15 bg-white/55 px-4 py-2 text-sm text-club-green transition hover:bg-white/80 disabled:opacity-60"
            >
              <PauseCircle className="h-4 w-4" strokeWidth={1.5} />
              {saving ? "Pausando..." : "Pausar"}
            </button>
          ) : null}

          {isPending ? (
            <button
              type="button"
              disabled={saving}
              onClick={onReject}
              className="inline-flex items-center gap-2 rounded-2xl border border-red-200/80 bg-red-50/50 px-4 py-2 text-sm text-red-800 transition hover:bg-red-50 disabled:opacity-60"
            >
              <XCircle className="h-4 w-4" strokeWidth={1.5} />
              Rechazar
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {(psychologist.specialties.length
          ? psychologist.specialties
          : ["Sin especialidades"]
        ).map((item) => (
          <span
            key={item}
            className="rounded-full bg-white/55 px-3 py-1 text-xs text-club-green"
          >
            {item}
          </span>
        ))}
        {(psychologist.languages.length ? psychologist.languages : ["Español"]).map(
          (item) => (
            <span
              key={item}
              className="rounded-full bg-white/55 px-3 py-1 text-xs text-club-muted"
            >
              {item}
            </span>
          ),
        )}
      </div>
    </article>
  );
}

function ReviewDecisionModal({
  psychologist,
  action,
  notes,
  saving,
  onNotesChange,
  onClose,
  onConfirm,
}: {
  psychologist: AdminPsychologist;
  action: ReviewAction;
  notes: string;
  saving: boolean;
  onNotesChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const title =
    action === "rejected" ? "Rechazar postulación" : "Pausar perfil";
  const disabled = saving || notes.trim().length === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-club-green/25 p-4 backdrop-blur-sm">
      <section className="w-full max-w-lg rounded-3xl border border-club-green/10 bg-club-paper p-6 shadow-soft">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-club-green/10 text-club-green">
            <FileText className="h-5 w-5" strokeWidth={1.5} />
          </div>
          <div>
            <p className="font-display text-xl text-club-green">{title}</p>
            <p className="mt-1 text-sm leading-relaxed text-club-muted">
              Esta decisión se guardará en el historial y se enviará como aviso
              a {psychologist.fullName}.
            </p>
          </div>
        </div>

        <label className="mt-6 block">
          <span className="text-sm text-club-green">Motivo para la psicóloga</span>
          <textarea
            value={notes}
            onChange={(event) => onNotesChange(event.target.value)}
            rows={5}
            placeholder="Ej: necesitamos validar el soporte profesional antes de aprobar el perfil."
            className="mt-2 w-full rounded-2xl border border-club-green/10 bg-white/60 px-4 py-3 text-sm text-club-ink outline-none transition placeholder:text-club-muted focus:border-club-green/30"
          />
        </label>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="rounded-2xl border border-club-green/15 bg-white/55 px-4 py-2 text-sm text-club-green transition hover:bg-white/80 disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={onConfirm}
            className="rounded-2xl bg-club-green px-4 py-2 text-sm text-club-paper transition hover:opacity-95 disabled:opacity-60"
          >
            {saving ? "Guardando..." : "Confirmar"}
          </button>
        </div>
      </section>
    </div>
  );
}

function ReviewFact({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div className="rounded-2xl border border-club-green/10 bg-white/50 px-4 py-3">
      <p className="text-xs text-club-muted">{label}</p>
      <p className="mt-1 text-club-ink">{value || "Sin registrar"}</p>
    </div>
  );
}

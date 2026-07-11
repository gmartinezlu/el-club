import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Edit3, Plus, Save, Trash2 } from "lucide-react";
import {
  createJournalEntry,
  deleteJournalEntry,
  fetchPatientJournals,
  updateJournalEntry,
} from "../../journals/service";
import type { JournalEntry } from "../../journals/types";
import { useSessionStore } from "../../store/sessionStore";
import { getErrorMessage } from "../../utils/errors";
import { JOURNAL_PROMPTS } from "../content/journalPrompts";
import { EmotionalGlass } from "../components/EmotionalGlass";

type JournalForm = {
  id: string | null;
  title: string;
  body: string;
  mood: string;
};

const EMPTY_FORM: JournalForm = {
  id: null,
  title: "",
  body: "",
  mood: "",
};

function formatJournalDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formFromEntry(entry: JournalEntry): JournalForm {
  return {
    id: entry.id,
    title: entry.title ?? "",
    body: entry.body,
    mood: entry.mood ? String(entry.mood) : "",
  };
}

export function PatientJournalsPage() {
  const patientId = useSessionStore((s) => s.user?.id);
  const [prompt] = useState(
    () => JOURNAL_PROMPTS[Math.floor(Math.random() * JOURNAL_PROMPTS.length)],
  );
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [form, setForm] = useState<JournalForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedEntry = useMemo(
    () => entries.find((entry) => entry.id === form.id) ?? null,
    [entries, form.id],
  );

  const loadEntries = useCallback(async () => {
    if (!patientId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      setEntries(await fetchPatientJournals(patientId));
    } catch (e) {
      setError(getErrorMessage(e, "No se pudo cargar tu journal"));
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadEntries();
    });
  }, [loadEntries]);

  async function saveEntry() {
    if (!patientId || !form.body.trim()) return;
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const payload = {
        patientId,
        title: form.title.trim() || null,
        body: form.body.trim(),
        mood: form.mood ? Number(form.mood) : null,
      };

      if (form.id) {
        await updateJournalEntry({ id: form.id, ...payload });
      } else {
        await createJournalEntry(payload);
      }

      setForm(EMPTY_FORM);
      setSaved(true);
      await loadEntries();
    } catch (e) {
      setError(getErrorMessage(e, "No se pudo guardar esta entrada"));
    } finally {
      setSaving(false);
    }
  }

  async function removeEntry(entry: JournalEntry) {
    if (!patientId) return;
    const confirmed = window.confirm(
      "¿Estás seguro de que deseas eliminar esta entrada? Esta acción no se puede deshacer.",
    );
    if (!confirmed) return;

    setSaving(true);
    setError(null);
    try {
      await deleteJournalEntry({ id: entry.id, patientId });
      if (form.id === entry.id) setForm(EMPTY_FORM);
      await loadEntries();
    } catch (e) {
      setError(getErrorMessage(e, "No se pudo eliminar esta entrada"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <p className="text-sm font-medium text-club-green">Escritura</p>
        <h1 className="font-display text-4xl text-club-green">Journal</h1>
        <p className="max-w-lg text-sm leading-relaxed text-club-muted">
          Escribe sin presión. Este espacio es solo para ti.
        </p>
      </header>

      {error ? (
        <p className="rounded-2xl border border-red-200/80 bg-red-50/40 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      {saved ? (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-2xl border border-club-green/10 bg-club-green/10 px-4 py-3 text-sm text-club-green"
        >
          Guardado con cariño.
        </motion.p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr),340px]">
        <EmotionalGlass className="p-6 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-club-muted">
                Prompt de hoy
              </p>
              <p className="mt-3 font-display text-2xl leading-snug text-club-green">
                {prompt?.text ?? "¿Qué necesitas hoy?"}
              </p>
            </div>
            {selectedEntry ? (
              <button
                type="button"
                onClick={() => setForm(EMPTY_FORM)}
                className="inline-flex items-center gap-2 rounded-2xl border border-club-green/15 bg-white/55 px-4 py-2 text-sm text-club-green transition hover:bg-white/80"
              >
                <Plus className="h-4 w-4" strokeWidth={1.5} />
                Nueva entrada
              </button>
            ) : null}
          </div>

          <label className="mt-6 block space-y-2">
            <span className="text-sm text-club-muted">Título opcional</span>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ej. Lo que necesito soltar hoy"
              className="w-full rounded-2xl border border-club-green/10 bg-white/50 px-4 py-3 text-sm text-club-ink outline-none ring-club-green/10 placeholder:text-club-muted/60 focus:ring-2"
            />
          </label>

          <textarea
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            placeholder="Empieza cuando quieras. No hay prisa."
            rows={10}
            className="mt-4 w-full resize-none rounded-2xl border border-club-green/10 bg-white/50 px-4 py-4 text-sm leading-relaxed text-club-ink outline-none ring-club-green/10 placeholder:text-club-muted/60 focus:ring-2"
          />

          <div className="mt-4 grid gap-4 sm:grid-cols-[160px,1fr] sm:items-end">
            <label className="space-y-2">
              <span className="text-sm text-club-muted">Mood</span>
              <select
                value={form.mood}
                onChange={(e) => setForm({ ...form, mood: e.target.value })}
                className="w-full rounded-2xl border border-club-green/10 bg-white/50 px-4 py-3 text-sm text-club-ink outline-none ring-club-green/10 focus:ring-2"
              >
                <option value="">Sin registrar</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                  <option key={value} value={value}>
                    {value}/10
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              disabled={saving || !form.body.trim()}
              onClick={() => void saveEntry()}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-club-green px-5 py-3 text-sm text-club-paper shadow-soft transition hover:opacity-95 disabled:opacity-60"
            >
              <Save className="h-4 w-4" strokeWidth={1.5} />
              {saving
                ? "Guardando..."
                : form.id
                  ? "Guardar cambios"
                  : "Guardar entrada"}
            </button>
          </div>
        </EmotionalGlass>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <h2 className="font-display text-2xl text-club-green">Historial</h2>
          {loading ? (
            <div className="h-52 animate-pulse rounded-3xl bg-club-green/5" />
          ) : entries.length === 0 ? (
            <EmotionalGlass className="p-5">
              <p className="text-sm text-club-muted">
                Tus entradas guardadas aparecerán aquí.
              </p>
            </EmotionalGlass>
          ) : (
            <div className="space-y-3">
              {entries.map((entry) => (
                <JournalEntryCard
                  key={entry.id}
                  entry={entry}
                  selected={entry.id === form.id}
                  saving={saving}
                  onEdit={() => setForm(formFromEntry(entry))}
                  onDelete={() => void removeEntry(entry)}
                />
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function JournalEntryCard({
  entry,
  selected,
  saving,
  onEdit,
  onDelete,
}: {
  entry: JournalEntry;
  selected: boolean;
  saving: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <article
      className={[
        "rounded-3xl border p-4 shadow-soft backdrop-blur",
        selected
          ? "border-club-green/25 bg-club-green/10"
          : "border-club-green/10 bg-white/40",
      ].join(" ")}
    >
      <p className="text-xs text-club-muted">{formatJournalDate(entry.createdAt)}</p>
      <h3 className="mt-2 font-display text-xl text-club-green">
        {entry.title || "Entrada sin título"}
      </h3>
      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-club-muted">
        {entry.body}
      </p>
      {entry.mood ? (
        <p className="mt-3 text-xs text-club-green">Mood: {entry.mood}/10</p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={saving}
          onClick={onEdit}
          className="inline-flex items-center gap-1 rounded-2xl border border-club-green/15 bg-white/55 px-3 py-1.5 text-xs text-club-green transition hover:bg-white/80 disabled:opacity-60"
        >
          <Edit3 className="h-3.5 w-3.5" strokeWidth={1.5} />
          Editar
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={onDelete}
          className="inline-flex items-center gap-1 rounded-2xl border border-red-200 bg-red-50/70 px-3 py-1.5 text-xs text-red-700 transition hover:bg-red-50 disabled:opacity-60"
        >
          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
          Eliminar
        </button>
      </div>
    </article>
  );
}

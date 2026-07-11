import { useCallback, useEffect, useMemo, useState } from "react";
import { Edit3, Plus, Save, Trash2 } from "lucide-react";
import {
  deleteResourceAdmin,
  fetchAllResourcesAdmin,
  upsertResourceAdmin,
} from "../../resources/service";
import type { EmotionalResource, ResourceType } from "../../resources/types";
import { getErrorMessage } from "../../utils/errors";

const RESOURCE_TYPES: { value: ResourceType; label: string }[] = [
  { value: "article", label: "Artículo" },
  { value: "meditation", label: "Meditación" },
  { value: "audio", label: "Audio" },
  { value: "exercise", label: "Ejercicio" },
  { value: "pdf", label: "PDF" },
];

const TYPE_LABEL = Object.fromEntries(
  RESOURCE_TYPES.map((item) => [item.value, item.label]),
) as Record<ResourceType, string>;

type ResourceForm = {
  id: string | null;
  title: string;
  description: string;
  type: ResourceType;
  content: string;
  mediaUrl: string;
  durationMinutes: string;
  isPublished: boolean;
  sortOrder: string;
};

const EMPTY_FORM: ResourceForm = {
  id: null,
  title: "",
  description: "",
  type: "article",
  content: "",
  mediaUrl: "",
  durationMinutes: "",
  isPublished: true,
  sortOrder: "0",
};

function formFromResource(resource: EmotionalResource): ResourceForm {
  return {
    id: resource.id,
    title: resource.title,
    description: resource.description ?? "",
    type: resource.type,
    content: resource.content ?? "",
    mediaUrl: resource.mediaUrl ?? "",
    durationMinutes: resource.durationMinutes
      ? String(resource.durationMinutes)
      : "",
    isPublished: Boolean(resource.isPublished),
    sortOrder: String(resource.sortOrder ?? 0),
  };
}

export function AdminContentPage() {
  const [resources, setResources] = useState<EmotionalResource[]>([]);
  const [form, setForm] = useState<ResourceForm>(EMPTY_FORM);
  const [filter, setFilter] = useState<"all" | ResourceType>("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const loadResources = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setResources(await fetchAllResourcesAdmin());
    } catch (e) {
      setError(getErrorMessage(e, "No se pudo cargar el contenido"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void loadResources();
    });
  }, [loadResources]);

  const filteredResources = useMemo(
    () =>
      resources.filter((resource) =>
        filter === "all" ? true : resource.type === filter,
      ),
    [filter, resources],
  );

  async function saveResource() {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      await upsertResourceAdmin({
        id: form.id ?? undefined,
        title: form.title.trim(),
        description: form.description.trim() || null,
        type: form.type,
        content: form.content.trim() || null,
        mediaUrl: form.mediaUrl.trim() || null,
        durationMinutes: form.durationMinutes
          ? Number(form.durationMinutes)
          : null,
        isPublished: form.isPublished,
        sortOrder: Number(form.sortOrder || 0),
      });
      setForm(EMPTY_FORM);
      setSaved(true);
      await loadResources();
    } catch (e) {
      setError(getErrorMessage(e, "No se pudo guardar el recurso"));
    } finally {
      setSaving(false);
    }
  }

  async function removeResource(id: string) {
    const confirmed = window.confirm(
      "¿Estás seguro de que deseas eliminar este recurso? Esta acción no se puede deshacer.",
    );
    if (!confirmed) return;

    setSaving(true);
    setError(null);
    try {
      await deleteResourceAdmin(id);
      if (form.id === id) setForm(EMPTY_FORM);
      await loadResources();
    } catch (e) {
      setError(getErrorMessage(e, "No se pudo eliminar el recurso"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-sm font-medium text-club-green">Biblioteca</p>
        <h1 className="font-display text-4xl text-club-green">Contenido</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-club-muted">
          Gestiona artículos, meditaciones, audios y ejercicios que acompañan a
          personas dentro de El Club.
        </p>
      </header>

      {error ? (
        <p className="rounded-2xl border border-red-200/80 bg-red-50/40 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}
      {saved ? (
        <p className="rounded-2xl border border-club-green/10 bg-club-green/10 px-4 py-3 text-sm text-club-green">
          Recurso guardado.
        </p>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr),380px]">
        <section className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={[
                "rounded-2xl border px-4 py-2 text-sm transition",
                filter === "all"
                  ? "border-club-green/20 bg-club-green/10 text-club-green"
                  : "border-club-green/10 bg-white/45 text-club-muted hover:bg-white/70",
              ].join(" ")}
            >
              Todos
            </button>
            {RESOURCE_TYPES.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setFilter(item.value)}
                className={[
                  "rounded-2xl border px-4 py-2 text-sm transition",
                  filter === item.value
                    ? "border-club-green/20 bg-club-green/10 text-club-green"
                    : "border-club-green/10 bg-white/45 text-club-muted hover:bg-white/70",
                ].join(" ")}
              >
                {item.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="h-72 animate-pulse rounded-3xl bg-club-green/5" />
          ) : filteredResources.length === 0 ? (
            <div className="rounded-3xl border border-club-green/10 bg-white/35 p-6">
              <p className="text-sm text-club-muted">
                No hay recursos para este filtro.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredResources.map((resource) => (
                <ResourceAdminCard
                  key={resource.id}
                  resource={resource}
                  saving={saving}
                  onEdit={() => setForm(formFromResource(resource))}
                  onDelete={() => void removeResource(resource.id)}
                />
              ))}
            </div>
          )}
        </section>

        <aside className="rounded-3xl border border-club-green/10 bg-white/40 p-5 shadow-soft backdrop-blur xl:sticky xl:top-24 xl:self-start">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-2xl text-club-green">
              {form.id ? "Editar recurso" : "Nuevo recurso"}
            </h2>
            <button
              type="button"
              onClick={() => setForm(EMPTY_FORM)}
              className="inline-flex items-center gap-1 text-sm text-club-green"
            >
              <Plus className="h-4 w-4" strokeWidth={1.5} />
              Nuevo
            </button>
          </div>

          <div className="mt-5 space-y-4">
            <label className="space-y-2">
              <span className="text-sm text-club-muted">Título</span>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full rounded-2xl border border-club-green/10 bg-white/60 px-4 py-3 text-sm text-club-ink outline-none ring-club-green/10 focus:ring-2"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <label className="space-y-2">
                <span className="text-sm text-club-muted">Tipo</span>
                <select
                  value={form.type}
                  onChange={(e) =>
                    setForm({ ...form, type: e.target.value as ResourceType })
                  }
                  className="w-full rounded-2xl border border-club-green/10 bg-white/60 px-4 py-3 text-sm text-club-ink outline-none ring-club-green/10 focus:ring-2"
                >
                  {RESOURCE_TYPES.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm text-club-muted">Orden</span>
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) =>
                    setForm({ ...form, sortOrder: e.target.value })
                  }
                  className="w-full rounded-2xl border border-club-green/10 bg-white/60 px-4 py-3 text-sm text-club-ink outline-none ring-club-green/10 focus:ring-2"
                />
              </label>
            </div>

            <label className="space-y-2">
              <span className="text-sm text-club-muted">Descripción</span>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={3}
                className="w-full resize-none rounded-2xl border border-club-green/10 bg-white/60 px-4 py-3 text-sm leading-relaxed text-club-ink outline-none ring-club-green/10 focus:ring-2"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm text-club-muted">Contenido</span>
              <textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                rows={5}
                className="w-full resize-none rounded-2xl border border-club-green/10 bg-white/60 px-4 py-3 text-sm leading-relaxed text-club-ink outline-none ring-club-green/10 focus:ring-2"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <label className="space-y-2">
                <span className="text-sm text-club-muted">Media URL</span>
                <input
                  value={form.mediaUrl}
                  onChange={(e) =>
                    setForm({ ...form, mediaUrl: e.target.value })
                  }
                  placeholder="https://..."
                  className="w-full rounded-2xl border border-club-green/10 bg-white/60 px-4 py-3 text-sm text-club-ink outline-none ring-club-green/10 focus:ring-2"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm text-club-muted">Duración min</span>
                <input
                  type="number"
                  min={1}
                  value={form.durationMinutes}
                  onChange={(e) =>
                    setForm({ ...form, durationMinutes: e.target.value })
                  }
                  className="w-full rounded-2xl border border-club-green/10 bg-white/60 px-4 py-3 text-sm text-club-ink outline-none ring-club-green/10 focus:ring-2"
                />
              </label>
            </div>

            <label className="flex items-center gap-3 rounded-2xl border border-club-green/10 bg-white/50 px-4 py-3 text-sm text-club-muted">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(e) =>
                  setForm({ ...form, isPublished: e.target.checked })
                }
                className="h-4 w-4 accent-club-green"
              />
              Publicado para personas
            </label>

            <button
              type="button"
              disabled={saving || !form.title.trim()}
              onClick={() => void saveResource()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-club-green px-5 py-3 text-sm text-club-paper shadow-soft transition hover:opacity-95 disabled:opacity-60"
            >
              <Save className="h-4 w-4" strokeWidth={1.5} />
              {saving ? "Guardando..." : "Guardar recurso"}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function ResourceAdminCard({
  resource,
  saving,
  onEdit,
  onDelete,
}: {
  resource: EmotionalResource;
  saving: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <article className="rounded-3xl border border-club-green/10 bg-white/40 p-5 shadow-soft backdrop-blur">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-club-green/10 px-3 py-1 text-xs text-club-green">
              {TYPE_LABEL[resource.type]}
              {resource.durationMinutes ? ` · ${resource.durationMinutes} min` : ""}
            </span>
            <span
              className={[
                "rounded-full px-3 py-1 text-xs",
                resource.isPublished
                  ? "bg-white/70 text-club-green"
                  : "bg-white/70 text-club-muted",
              ].join(" ")}
            >
              {resource.isPublished ? "Publicado" : "Oculto"}
            </span>
          </div>
          <h2 className="mt-3 font-display text-2xl text-club-green">
            {resource.title}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-club-muted">
            {resource.description || "Sin descripción."}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={onEdit}
            className="inline-flex items-center gap-2 rounded-2xl border border-club-green/15 bg-white/55 px-4 py-2 text-sm text-club-green transition hover:bg-white/80 disabled:opacity-60"
          >
            <Edit3 className="h-4 w-4" strokeWidth={1.5} />
            Editar
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={onDelete}
            className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50/70 px-4 py-2 text-sm text-red-700 transition hover:bg-red-50 disabled:opacity-60"
          >
            <Trash2 className="h-4 w-4" strokeWidth={1.5} />
            Eliminar
          </button>
        </div>
      </div>
    </article>
  );
}

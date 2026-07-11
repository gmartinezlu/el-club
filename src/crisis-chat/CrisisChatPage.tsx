import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { MessageCircle, Send, ShieldAlert } from "lucide-react";
import { getErrorMessage } from "../utils/errors";
import { useSessionStore } from "../store/sessionStore";
import {
  fetchCrisisMessages,
  fetchOrCreatePatientCrisisThread,
  fetchPsychologistCrisisThreads,
  sendCrisisMessage,
  type CrisisMessage,
  type CrisisThread,
} from "./service";

export function CrisisChatPage({ mode }: { mode: "patient" | "psychologist" }) {
  const user = useSessionStore((s) => s.user);
  const [threads, setThreads] = useState<CrisisThread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<CrisisMessage[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedThread = useMemo(
    () => threads.find((thread) => thread.id === selectedThreadId) ?? null,
    [selectedThreadId, threads],
  );

  const loadThreads = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      if (mode === "patient") {
        const thread = await fetchOrCreatePatientCrisisThread(user.id);
        setThreads(thread ? [thread] : []);
        setSelectedThreadId(thread?.id ?? null);
      } else {
        const data = await fetchPsychologistCrisisThreads(user.id);
        setThreads(data);
        setSelectedThreadId((current) => current ?? data[0]?.id ?? null);
      }
    } catch (e) {
      setError(getErrorMessage(e, "No se pudo cargar el chat"));
    } finally {
      setLoading(false);
    }
  }, [mode, user]);

  const loadMessages = useCallback(async () => {
    if (!selectedThreadId) {
      setMessages([]);
      return;
    }
    setError(null);
    try {
      setMessages(await fetchCrisisMessages(selectedThreadId));
    } catch (e) {
      setError(getErrorMessage(e, "No se pudieron cargar los mensajes"));
    }
  }, [selectedThreadId]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadThreads();
    });
  }, [loadThreads]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadMessages();
    });
  }, [loadMessages]);

  async function onSend(event: FormEvent) {
    event.preventDefault();
    if (!user || !selectedThread || !body.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await sendCrisisMessage({
        threadId: selectedThread.id,
        senderId: user.id,
        body,
      });
      setBody("");
      await Promise.all([loadMessages(), loadThreads()]);
    } catch (e) {
      setError(getErrorMessage(e, "No se pudo enviar el mensaje"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-sm font-medium text-club-green">
          Intervencion en crisis
        </p>
        <h1 className="font-display text-4xl text-club-green">
          Chat de apoyo
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-club-muted">
          Un canal breve para acompañamiento entre sesiones. No reemplaza
          servicios de emergencia.
        </p>
      </header>

      <div className="rounded-3xl border border-club-green/10 bg-club-green/10 p-4 text-sm text-club-green">
        <div className="flex items-start gap-2">
          <ShieldAlert className="mt-0.5 h-4 w-4" strokeWidth={1.5} />
          <p>
            Si hay riesgo inmediato para ti o alguien mas, contacta servicios de
            emergencia de tu ciudad. Este chat es apoyo complementario.
          </p>
        </div>
      </div>

      {error ? (
        <p className="rounded-2xl border border-red-200/80 bg-red-50/40 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="h-72 animate-pulse rounded-3xl bg-club-green/5" />
      ) : threads.length === 0 ? (
        <div className="rounded-3xl border border-club-green/10 bg-white/50 p-6 shadow-soft backdrop-blur">
          <MessageCircle className="h-5 w-5 text-club-green" strokeWidth={1.5} />
          <p className="mt-4 font-display text-2xl text-club-green">
            {mode === "patient"
              ? "Aun no tienes un chat activo"
              : "Aun no hay chats activos"}
          </p>
          <p className="mt-2 text-sm text-club-muted">
            {mode === "patient"
              ? "El chat se activa cuando tienes una cita pagada o confirmada con una especialista."
              : "Apareceran aqui las personas con relacion activa contigo."}
          </p>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[280px,1fr]">
          <aside className="space-y-2 lg:sticky lg:top-24 lg:self-start">
            {threads.map((thread) => (
              <button
                key={thread.id}
                type="button"
                onClick={() => setSelectedThreadId(thread.id)}
                className={[
                  "w-full rounded-3xl border p-4 text-left shadow-soft backdrop-blur transition",
                  selectedThreadId === thread.id
                    ? "border-club-green/25 bg-club-green/10"
                    : "border-club-green/10 bg-white/50 hover:bg-white/55",
                ].join(" ")}
              >
                <p className="font-display text-2xl text-club-green">
                  {mode === "patient"
                    ? thread.psychologistName
                    : thread.patientName}
                </p>
                <p className="mt-1 text-xs text-club-muted">
                  Canal activo de apoyo
                </p>
              </button>
            ))}
          </aside>

          <section className="rounded-3xl border border-club-green/10 bg-white/50 p-4 shadow-soft backdrop-blur md:p-5">
            <div className="border-b border-club-green/10 pb-4">
              <p className="text-xs text-club-muted">Conversacion con</p>
              <h2 className="font-display text-3xl text-club-green">
                {selectedThread
                  ? mode === "patient"
                    ? selectedThread.psychologistName
                    : selectedThread.patientName
                  : "Chat"}
              </h2>
            </div>

            <div className="mt-5 max-h-[460px] min-h-[280px] space-y-3 overflow-y-auto pr-1">
              {messages.length === 0 ? (
                <p className="rounded-2xl bg-white/55 p-4 text-sm text-club-muted">
                  Aun no hay mensajes. Puedes iniciar con una descripcion breve
                  de lo que necesitas.
                </p>
              ) : (
                messages.map((message) => {
                  const mine = message.senderId === user?.id;
                  return (
                    <div
                      key={message.id}
                      className={`flex ${mine ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={[
                          "max-w-[82%] rounded-3xl px-4 py-3 text-sm leading-relaxed",
                          mine
                            ? "bg-club-green text-club-paper"
                            : "bg-white/65 text-club-ink",
                        ].join(" ")}
                      >
                        {message.body}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <form onSubmit={onSend} className="mt-5 flex gap-2">
              <input
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder="Escribe un mensaje breve..."
                className="min-w-0 flex-1 rounded-2xl border border-club-green/10 bg-white/60 px-4 py-3 text-sm text-club-ink outline-none ring-club-green/10 focus:ring-2"
              />
              <button
                type="submit"
                disabled={saving || !body.trim()}
                className="inline-flex items-center gap-2 rounded-2xl bg-club-green px-4 py-3 text-sm text-club-paper shadow-soft transition hover:opacity-95 disabled:opacity-60"
              >
                <Send className="h-4 w-4" strokeWidth={1.5} />
                <span className="hidden sm:inline">
                  {saving ? "Enviando" : "Enviar"}
                </span>
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

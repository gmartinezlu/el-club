import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, MessageCircle, Search, Send } from "lucide-react";
import {
  fetchAdminSupportTickets,
  respondSupportTicket,
  updateSupportTicketStatus,
  type AdminSupportTicket,
} from "../services/operations";

export function AdminSupportPage() {
  const [tickets, setTickets] = useState<AdminSupportTicket[]>([]);
  const [query, setQuery] = useState("");
  const [replyById, setReplyById] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminSupportTickets();
      setTickets(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar soporte");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return tickets;
    return tickets.filter(
      (ticket) =>
        ticket.subject.toLowerCase().includes(normalized) ||
        ticket.body.toLowerCase().includes(normalized) ||
        ticket.userName.toLowerCase().includes(normalized) ||
        ticket.status.toLowerCase().includes(normalized),
    );
  }, [query, tickets]);

  async function closeTicket(ticketId: string) {
    setSavingId(ticketId);
    setError(null);
    try {
      await updateSupportTicketStatus(ticketId, "closed");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cerrar el ticket");
    } finally {
      setSavingId(null);
    }
  }

  async function sendReply(ticketId: string) {
    const response = replyById[ticketId]?.trim();
    if (!response) {
      setError("Escribe una respuesta antes de enviarla.");
      return;
    }

    setSavingId(ticketId);
    setError(null);
    try {
      await respondSupportTicket({ ticketId, response });
      setReplyById((current) => ({ ...current, [ticketId]: "" }));
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo responder el ticket");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-sm font-medium text-club-green">Cuidado operativo</p>
        <h1 className="font-display text-4xl text-club-green">Soporte</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-club-muted">
          Responde tickets y envia una notificacion directa al usuario.
        </p>
      </header>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <label className="flex max-w-xl items-center gap-3 rounded-3xl border border-club-green/10 bg-white/45 px-4 py-3 shadow-soft backdrop-blur">
        <Search className="h-4 w-4 text-club-green" strokeWidth={1.5} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar ticket, usuario o estado"
          className="w-full bg-transparent text-sm text-club-ink outline-none placeholder:text-club-muted"
        />
      </label>

      {loading ? (
        <div className="h-52 animate-pulse rounded-3xl bg-club-green/5" />
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-club-green/10 bg-white/35 p-6">
          <p className="text-sm text-club-muted">
            No hay tickets para revisar.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((ticket) => (
            <article
              key={ticket.id}
              className="rounded-3xl border border-club-green/10 bg-white/35 p-5 shadow-soft backdrop-blur"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-club-green">
                    <MessageCircle className="h-4 w-4" strokeWidth={1.5} />
                    <p className="text-xs text-club-muted">{ticket.userName}</p>
                  </div>
                  <h2 className="mt-2 font-display text-2xl text-club-green">
                    {ticket.subject}
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-club-muted">
                    {ticket.body}
                  </p>
                </div>
                <span className="rounded-full bg-club-green/10 px-3 py-1 text-xs text-club-green">
                  {ticket.status}
                </span>
              </div>

              {ticket.adminResponse ? (
                <div className="mt-4 rounded-2xl border border-club-green/10 bg-white/45 p-4">
                  <p className="text-xs text-club-muted">Respuesta enviada</p>
                  <p className="mt-1 text-sm leading-relaxed text-club-ink">
                    {ticket.adminResponse}
                  </p>
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  <textarea
                    value={replyById[ticket.id] ?? ""}
                    onChange={(event) =>
                      setReplyById((current) => ({
                        ...current,
                        [ticket.id]: event.target.value,
                      }))
                    }
                    rows={3}
                    placeholder="Escribe una respuesta humana y clara..."
                    className="w-full resize-none rounded-2xl border border-club-green/10 bg-white/60 px-4 py-3 text-sm text-club-ink outline-none transition placeholder:text-club-muted focus:border-club-green/30"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={savingId === ticket.id}
                      onClick={() => void sendReply(ticket.id)}
                      className="inline-flex items-center gap-2 rounded-2xl bg-club-green px-4 py-2 text-sm text-club-paper transition hover:opacity-95 disabled:opacity-60"
                    >
                      <Send className="h-4 w-4" strokeWidth={1.5} />
                      Responder y cerrar
                    </button>
                    {ticket.status !== "closed" ? (
                      <button
                        type="button"
                        disabled={savingId === ticket.id}
                        onClick={() => void closeTicket(ticket.id)}
                        className="inline-flex items-center gap-2 rounded-2xl border border-club-green/15 bg-white/55 px-4 py-2 text-sm text-club-green transition hover:bg-white/80 disabled:opacity-60"
                      >
                        <CheckCircle2 className="h-4 w-4" strokeWidth={1.5} />
                        Cerrar sin respuesta
                      </button>
                    ) : null}
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

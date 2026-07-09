import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, CreditCard, Search, XCircle } from "lucide-react";
import {
  approveMembershipOrder,
  declineMembershipOrder,
  fetchAdminMembershipOrders,
  type AdminMembershipOrder,
} from "../services/memberships";
import { formatSessionDate } from "../../patient/utils/formatDate";

const STATUS_LABELS: Record<AdminMembershipOrder["status"], string> = {
  pending_payment: "Pendiente",
  approved: "Aprobada",
  declined: "Rechazada",
  voided: "Anulada",
};

export function AdminMembershipsPage() {
  const [orders, setOrders] = useState<AdminMembershipOrder[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminMembershipOrders();
      setOrders(data);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudieron cargar membresias",
      );
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
    if (!normalized) return orders;
    return orders.filter(
      (order) =>
        order.patientName.toLowerCase().includes(normalized) ||
        order.planName.toLowerCase().includes(normalized) ||
        order.providerReference.toLowerCase().includes(normalized) ||
        STATUS_LABELS[order.status].toLowerCase().includes(normalized),
    );
  }, [orders, query]);

  async function approve(order: AdminMembershipOrder) {
    setSavingId(order.id);
    setError(null);
    try {
      await approveMembershipOrder(order);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo activar membresia");
    } finally {
      setSavingId(null);
    }
  }

  async function decline(orderId: string) {
    setSavingId(orderId);
    setError(null);
    try {
      await declineMembershipOrder(orderId);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo rechazar la orden");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-sm font-medium text-club-green">EL CLUB</p>
        <h1 className="font-display text-4xl text-club-green">Membresias</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-club-muted">
          Revisa ordenes de membresia, valida pagos de Wompi y activa el acceso
          de miembros. Los pagos de terapia siguen fuera de EL CLUB.
        </p>
      </header>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <label className="flex max-w-xl items-center gap-3 rounded-3xl border border-club-green/10 bg-white/45 px-4 py-3 shadow-soft backdrop-blur">
        <Search className="h-4 w-4 text-club-green" strokeWidth={1.5} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar miembro, plan, referencia o estado"
          className="w-full bg-transparent text-sm text-club-ink outline-none placeholder:text-club-muted"
        />
      </label>

      {loading ? (
        <div className="h-64 animate-pulse rounded-3xl bg-club-green/5" />
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-club-green/10 bg-white/35 p-6">
          <p className="text-sm text-club-muted">
            Aun no hay ordenes de membresia.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((order) => (
            <article
              key={order.id}
              className="rounded-3xl border border-club-green/10 bg-white/35 p-5 shadow-soft backdrop-blur"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-club-green">
                    <CreditCard className="h-4 w-4" strokeWidth={1.5} />
                    <p className="text-xs text-club-muted">
                      {formatSessionDate(order.createdAt)}
                    </p>
                  </div>
                  <h2 className="mt-2 font-display text-2xl text-club-green">
                    {order.patientName}
                  </h2>
                  <p className="mt-1 text-sm text-club-muted">
                    Plan {order.planName} · {order.amountLabel}
                  </p>
                  <p className="mt-2 max-w-2xl break-all text-xs text-club-muted">
                    Referencia Wompi: {order.providerReference}
                  </p>
                  {order.providerTransactionId ? (
                    <p className="mt-1 max-w-2xl break-all text-xs text-club-muted">
                      Transaccion: {order.providerTransactionId}
                    </p>
                  ) : null}
                </div>

                <span className="rounded-full bg-club-green/10 px-3 py-1 text-xs text-club-green">
                  {STATUS_LABELS[order.status]}
                </span>
              </div>

              {order.status === "pending_payment" ? (
                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={savingId === order.id}
                    onClick={() => void approve(order)}
                    className="inline-flex items-center gap-2 rounded-2xl bg-club-green px-4 py-2 text-sm text-club-paper transition hover:opacity-95 disabled:opacity-60"
                  >
                    <CheckCircle2 className="h-4 w-4" strokeWidth={1.5} />
                    Activar membresia
                  </button>
                  <button
                    type="button"
                    disabled={savingId === order.id}
                    onClick={() => void decline(order.id)}
                    className="inline-flex items-center gap-2 rounded-2xl border border-club-green/15 bg-white/55 px-4 py-2 text-sm text-club-green transition hover:bg-white/80 disabled:opacity-60"
                  >
                    <XCircle className="h-4 w-4" strokeWidth={1.5} />
                    Marcar rechazada
                  </button>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

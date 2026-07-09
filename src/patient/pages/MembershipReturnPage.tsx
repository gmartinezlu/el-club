import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Clock } from "lucide-react";

export function PatientMembershipReturnPage() {
  const [params] = useSearchParams();
  const transactionId = params.get("id") ?? params.get("transaction_id");

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <section className="rounded-3xl border border-club-green/10 bg-white/40 p-8 text-center shadow-soft backdrop-blur">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-club-green/10 text-club-green">
          {transactionId ? (
            <CheckCircle2 className="h-7 w-7" strokeWidth={1.5} />
          ) : (
            <Clock className="h-7 w-7" strokeWidth={1.5} />
          )}
        </div>
        <p className="mt-5 text-sm font-medium text-club-green">
          Membresia EL CLUB
        </p>
        <h1 className="mt-2 font-display text-4xl text-club-green">
          Estamos revisando tu pago
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-club-muted">
          Wompi nos devolvio a EL CLUB. Cuando conectemos el webhook seguro, tu
          membresia se activara automaticamente al aprobarse la transaccion.
        </p>
        {transactionId ? (
          <p className="mx-auto mt-4 max-w-xl break-all rounded-2xl bg-white/55 px-4 py-3 text-xs text-club-muted">
            Transaccion: {transactionId}
          </p>
        ) : null}
        <Link
          to="/patient"
          className="mt-7 inline-flex rounded-2xl bg-club-green px-6 py-3 text-sm text-club-paper shadow-soft transition hover:opacity-95"
        >
          Volver a mi espacio
        </Link>
      </section>
    </div>
  );
}

import { useAdminStats } from "../hooks/useAdminStats";

export function AdminOverviewPage() {
  const { appointmentCount, pendingPsychologists, loading, error } =
    useAdminStats();

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <p className="text-sm font-medium text-club-green">Sistema</p>
        <h1 className="font-display text-4xl text-club-green">Resumen</h1>
        <p className="max-w-lg text-sm leading-relaxed text-club-muted">
          Visión general con datos reales de Supabase.
        </p>
      </header>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl border border-club-green/10 bg-white/50 p-6">
          <p className="text-xs text-club-muted">Citas totales</p>
          <p className="mt-2 font-display text-3xl text-club-green">
            {loading ? "—" : appointmentCount}
          </p>
        </div>
        <div className="rounded-3xl border border-club-green/10 bg-white/50 p-6">
          <p className="text-xs text-club-muted">Psicólogas por aprobar</p>
          <p className="mt-2 font-display text-3xl text-club-green">
            {loading ? "—" : pendingPsychologists}
          </p>
        </div>
      </div>
    </div>
  );
}

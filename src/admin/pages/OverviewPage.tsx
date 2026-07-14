import { useCallback, useEffect, useState } from "react";
import { Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { useAdminStats } from "../hooks/useAdminStats";
import { PageTitle } from "../../components/ui/Typography";
import { getSupabaseClient } from "../../services/supabase/client";
import { getErrorMessage } from "../../utils/errors";

type UserRow = {
  id: string;
  role: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
};

async function fetchUsers(): Promise<UserRow[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("users")
    .select("id, role, full_name, avatar_url, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as UserRow[];
}

async function adminDeleteUser(userId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.rpc("admin_delete_user", {
    p_user_id: userId,
  });
  if (error) throw error;
}

const ROLE_LABELS: Record<string, string> = {
  patient: "Paciente",
  psychologist: "Psicóloga",
  admin: "Admin",
};

export function AdminOverviewPage() {
  const { appointmentCount, pendingPsychologists, loading, error } =
    useAdminStats();

  const [users, setUsers] = useState<UserRow[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    setUsersError(null);
    try {
      setUsers(await fetchUsers());
    } catch (e) {
      setUsersError(getErrorMessage(e, "No se pudieron cargar los usuarios"));
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void loadUsers();
    });
  }, [loadUsers]);

  async function handleDelete(user: UserRow) {
    if (user.role === "admin") {
      toast.error("No puedes eliminar a un administrador.");
      return;
    }
    const name = user.full_name?.trim() || user.id.slice(0, 8);
    if (!window.confirm(`¿Eliminar al usuario "${name}" y todos sus datos? Esta acción no se puede deshacer.`)) return;

    setDeletingId(user.id);
    try {
      await adminDeleteUser(user.id);
      toast.success(`Usuario "${name}" eliminado.`);
      await loadUsers();
    } catch (e) {
      toast.error(getErrorMessage(e, "No se pudo eliminar el usuario"));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <p className="text-sm font-medium text-club-green">Sistema</p>
        <PageTitle>Resumen</PageTitle>
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

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-club-green" strokeWidth={1.5} />
          <h2 className="font-display text-xl text-club-green">Usuarios</h2>
        </div>

        {usersError ? (
          <p className="text-sm text-red-700">{usersError}</p>
        ) : null}

        {loadingUsers ? (
          <div className="h-40 animate-pulse rounded-3xl bg-club-green/5" />
        ) : users.length === 0 ? (
          <p className="text-sm text-club-muted">No hay usuarios registrados.</p>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-club-green/10 bg-white/50 shadow-soft">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-club-green/10 text-left text-xs text-club-muted">
                  <th className="px-4 py-3 font-medium">Nombre</th>
                  <th className="px-4 py-3 font-medium">Rol</th>
                  <th className="px-4 py-3 font-medium">Registro</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-club-green/5 last:border-0"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt=""
                            className="h-7 w-7 rounded-xl object-cover"
                          />
                        ) : (
                          <div className="h-7 w-7 rounded-xl bg-club-green/10" />
                        )}
                        <span className="text-club-ink">
                          {user.full_name?.trim() || "Sin nombre"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-club-green/10 px-2.5 py-0.5 text-xs text-club-green">
                        {ROLE_LABELS[user.role] ?? user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-club-muted">
                      {new Date(user.created_at).toLocaleDateString("es-CO")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {user.role !== "admin" ? (
                        <button
                          type="button"
                          disabled={deletingId === user.id}
                          onClick={() => void handleDelete(user)}
                          className="inline-flex items-center gap-1 rounded-full border border-red-200/80 bg-red-50/40 px-2.5 py-1 text-xs text-red-700 transition hover:bg-red-100/60 disabled:opacity-60"
                        >
                          <Trash2 className="h-3 w-3" strokeWidth={1.5} />
                          {deletingId === user.id ? "..." : "Eliminar"}
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useSessionStore } from "../../store/sessionStore";
import type { AppRole } from "../../shared/auth/roles";

function loginPathForRole(role: AppRole): string {
  if (role === "psychologist") return "/auth/psychologist/login";
  if (role === "admin") return "/auth/admin/login";
  return "/auth/patient/login";
}

export function RequireRole({
  role,
  children,
}: {
  role: AppRole;
  children: ReactNode;
}) {
  const status = useSessionStore((s) => s.status);
  const initialized = useSessionStore((s) => s.initialized);
  const userRole = useSessionStore((s) => s.role);

  if (!initialized || status === "loading") {
    return (
      <div className="mx-auto flex w-full max-w-md items-center justify-center px-5 py-24">
        <div className="h-10 w-10 animate-pulse rounded-2xl bg-club-green/10" />
      </div>
    );
  }

  if (status !== "authenticated") {
    return <Navigate to={loginPathForRole(role)} replace />;
  }

  // Si el usuario estÃ¡ autenticado pero aÃºn no eligiÃ³ rol/onboarding.
  if (!userRole) {
    return <Navigate to="/auth/onboarding" replace />;
  }

  if (userRole !== role) {
    // Regla premium: no mostramos pantallas que no corresponden.
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

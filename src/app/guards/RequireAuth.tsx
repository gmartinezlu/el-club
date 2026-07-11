import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useSessionStore } from "../../store/sessionStore";

function loginPathFor(pathname: string): string {
  if (pathname.startsWith("/psychologist")) return "/auth/psychologist/login";
  if (pathname.startsWith("/admin")) return "/auth/admin/login";
  return "/auth/patient/login";
}

export function RequireAuth() {
  const location = useLocation();
  const init = useSessionStore((s) => s.init);
  const status = useSessionStore((s) => s.status);
  const initialized = useSessionStore((s) => s.initialized);

  useEffect(() => {
    void init();
  }, [init]);

  if (!initialized || status === "loading") {
    return (
      <div className="mx-auto flex w-full max-w-md items-center justify-center px-5 py-24">
        <div className="h-10 w-10 animate-pulse rounded-2xl bg-club-green/10" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <Navigate
        to={loginPathFor(location.pathname)}
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return <Outlet />;
}

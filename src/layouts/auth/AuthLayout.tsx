import { Link, Outlet } from "react-router-dom";

export function AuthLayout() {
  return (
    <div className="min-h-dvh bg-white/10">
      <header className="mx-auto flex w-full max-w-2xl items-center justify-between px-5 py-6">
        <Link
          to="/"
          className="inline-flex items-baseline gap-2 text-decoration-none"
        >
          <span className="font-display text-3xl text-club-green">El Club</span>
          <span className="text-sm text-club-muted">refugio emocional</span>
        </Link>
        <span className="text-sm text-club-muted">Premium & humano</span>
      </header>

      <main className="mx-auto w-full max-w-2xl px-5 pb-16">
        <div className="rounded-3xl border border-club-green/10 bg-white/35 p-5 shadow-soft backdrop-blur md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}


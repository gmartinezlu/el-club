import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import type { AppRole } from "../../shared/auth/roles";
import { ROLE_LABELS } from "../../shared/auth/roles";
import { useSessionStore } from "../../store/sessionStore";

type NavItem = {
  to: string;
  label: string;
  end?: boolean;
  group?: string;
  // Optional icon component (from lucide-react or similar)
  icon?: any;
};

const ROLE_SUBTITLES: Record<AppRole, string> = {
  patient: "tu refugio emocional",
  psychologist: "tu consulta organizada",
  admin: "centro de control",
};

export function RoleShell({
  role,
  nav,
  children,
}: {
  role: AppRole;
  nav: NavItem[];
  children: ReactNode;
}) {
  const fullName = useSessionStore((s) => s.fullName);
  const avatarUrl = useSessionStore((s) => s.avatarUrl);
  const signOut = useSessionStore((s) => s.signOut);
  const displayLabel =
    role === "patient" ? fullName?.trim() || "Mi espacio" : ROLE_LABELS[role];
  const groupedNav = nav.reduce<Array<{ group: string; items: NavItem[] }>>(
    (groups, item) => {
      const groupName = item.group ?? "Principal";
      const existing = groups.find((group) => group.group === groupName);

      if (existing) {
        existing.items.push(item);
      } else {
        groups.push({ group: groupName, items: [item] });
      }

      return groups;
    },
    [],
  );

  return (
    <div className="min-h-dvh">
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        aria-hidden
        style={{
          background: `
            radial-gradient(900px 500px at 0% 0%, rgba(234, 218, 200, 0.58), transparent 55%),
            radial-gradient(700px 400px at 100% 20%, rgba(8, 71, 57, 0.07), transparent 50%),
            linear-gradient(180deg, var(--club-paper) 0%, var(--club-sand) 100%)
          `,
        }}
      />

      <header className="sticky top-0 z-20 border-b border-club-green/10 bg-white/35 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-4 md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-club-green text-club-paper shadow-soft">
              <span className="font-display text-lg">EC</span>
            </div>
            <div className="min-w-0 leading-tight">
              <p className="font-display text-2xl leading-none text-club-green">
                El Club
              </p>
              <p className="truncate text-xs text-club-muted">
                {displayLabel} - {ROLE_SUBTITLES[role]}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                className="h-9 w-9 rounded-2xl object-cover"
              />
            ) : (
              <div className="h-9 w-9 rounded-2xl bg-club-green/10" />
            )}
            <p className="hidden max-w-[150px] truncate text-sm text-club-muted sm:block">
              {fullName ?? ROLE_LABELS[role]}
            </p>
            <button
              type="button"
              onClick={() => void signOut()}
              className="text-sm text-club-muted transition hover:text-club-green"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 px-5 py-6 md:grid-cols-[220px,1fr] md:px-8 md:py-8">
        <aside className="min-w-0 overflow-hidden rounded-3xl border border-club-green/10 bg-white/35 p-3 shadow-soft backdrop-blur md:sticky md:top-24 md:self-start md:p-4">
          <nav className="flex w-full min-w-0 flex-row gap-2 overflow-x-auto pb-1 md:flex-col md:gap-5 md:overflow-visible md:pb-0">
            {groupedNav.map((group) => (
              <div
                key={group.group}
                className="flex shrink-0 flex-row gap-2 md:flex-col md:gap-1"
              >
                <p className="hidden px-3 text-[11px] font-medium uppercase tracking-[0.18em] text-club-muted/70 md:block">
                  {group.group}
                </p>
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      [
                        "whitespace-nowrap rounded-2xl px-3 py-2 text-sm transition flex items-center gap-2",
                        isActive
                          ? "bg-club-green text-club-cream font-medium"
                          : "text-club-muted hover:bg-white/60 hover:text-club-green",
                      ].join(" ")
                    }
                  >
                    {item.icon ? (
                      <item.icon className="h-4 w-4 stroke-[1.5] text-current" />
                    ) : null}
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                ))}
              </div>
            ))}
          </nav>
        </aside>

        <section className="min-w-0 pb-16">{children}</section>
      </div>
    </div>
  );
}

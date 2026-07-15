import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { applyTheme, getCurrentTheme, type ThemePreference } from "../theme";

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemePreference>(() => getCurrentTheme());

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-club-green/10 bg-white/45 text-club-muted transition hover:bg-white/70 hover:text-club-green"
      aria-label={isDark ? "Usar modo claro" : "Usar modo oscuro"}
      title={isDark ? "Modo claro" : "Modo oscuro"}
    >
      {isDark ? (
        <Sun className="h-4 w-4" strokeWidth={1.5} />
      ) : (
        <Moon className="h-4 w-4" strokeWidth={1.5} />
      )}
    </button>
  );
}

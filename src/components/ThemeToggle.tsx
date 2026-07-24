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
      className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-club-green/15 bg-club-paper/80 text-club-green shadow-soft transition hover:bg-club-cream/70"
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

const THEME_KEY = "el-club-theme";

export type ThemePreference = "light" | "dark";

function readStoredTheme(): ThemePreference | null {
  const value = localStorage.getItem(THEME_KEY);
  return value === "light" || value === "dark" ? value : null;
}

function preferredTheme(): ThemePreference {
  if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}

export function applyTheme(theme: ThemePreference) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  localStorage.setItem(THEME_KEY, theme);
}

export function initializeTheme() {
  applyTheme(readStoredTheme() ?? preferredTheme());
}

export function getCurrentTheme(): ThemePreference {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

import { useState } from "react";
import type { AppRole } from "../../shared/auth/roles";

export function storageKey(role: "patient" | "psychologist") {
  return `el-club-onboarding-seen-${role}`;
}

export function useOnboardingTour(role: AppRole) {
  const [open, setOpen] = useState(() => {
    if (role !== "patient" && role !== "psychologist") return false;
    return !localStorage.getItem(storageKey(role));
  });

  function dismiss() {
    if (role === "patient" || role === "psychologist") {
      localStorage.setItem(storageKey(role), "1");
    }
    setOpen(false);
  }

  return { open, dismiss };
}

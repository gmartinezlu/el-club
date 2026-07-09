export type AppRole = "patient" | "psychologist" | "admin";

export const ROLE_LABELS: Record<AppRole, string> = {
  patient: "Mi espacio",
  psychologist: "Psicóloga",
  admin: "Administrador",
};

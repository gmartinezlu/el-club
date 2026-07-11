export function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Buenos dÃ­as";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

export function getFirstName(fullName: string | null): string {
  if (!fullName?.trim()) return "bienvenida";
  return fullName.trim().split(/\s+/)[0] ?? "bienvenida";
}

const AFFIRMATIONS = [
  "No tienes que cargarlo todo sola.",
  "Tu ritmo es vÃ¡lido. Hoy tambiÃ©n cuenta.",
  "Pedir ayuda es un acto de valentÃ­a.",
  "Respira. EstÃ¡s en un espacio seguro.",
  "PequeÃ±os pasos tambiÃ©n son progreso.",
];

export function getDailyAffirmation(): string {
  const dayIndex = new Date().getDate() % AFFIRMATIONS.length;
  return AFFIRMATIONS[dayIndex] ?? AFFIRMATIONS[0];
}

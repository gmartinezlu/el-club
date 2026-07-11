export const GRID_START_HOUR = 7;
export const GRID_END_HOUR = 21;
export const STEP_MINUTES = 30;
export const CELL_HEIGHT_PX = 28;

export function getMonday(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  const day = result.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + diff);
  return result;
}

export function addDays(date: Date, amount: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
}

export function weekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

export function slotCount(): number {
  return ((GRID_END_HOUR - GRID_START_HOUR) * 60) / STEP_MINUTES;
}

export function slotStart(day: Date, slotIndex: number): Date {
  const result = new Date(day);
  const totalMinutes = GRID_START_HOUR * 60 + slotIndex * STEP_MINUTES;
  result.setHours(0, totalMinutes, 0, 0);
  return result;
}

export function slotKey(day: Date, slotIndex: number): string {
  return slotStart(day, slotIndex).toISOString();
}

export function formatSlotLabel(slotIndex: number): string {
  const totalMinutes = GRID_START_HOUR * 60 + slotIndex * STEP_MINUTES;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function isSameDayAs(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

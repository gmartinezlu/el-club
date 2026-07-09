import { useCallback, useState } from "react";
import type { MoodEntry } from "../types";

const STORAGE_KEY = "el-club-mood-entries";

function readEntries(): MoodEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as MoodEntry[];
  } catch {
    return [];
  }
}

function writeEntries(entries: MoodEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function useMoodCheckIn() {
  const [todayMood, setTodayMood] = useState<number | null>(() => {
    const entries = readEntries();
    const today = entries.find((e) => e.date === todayKey());
    return today?.mood ?? null;
  });
  const [saved, setSaved] = useState(() => todayMood !== null);

  const saveMood = useCallback((mood: number) => {
    const entries = readEntries().filter((e) => e.date !== todayKey());
    entries.push({ date: todayKey(), mood });
    writeEntries(entries);
    setTodayMood(mood);
    setSaved(true);
  }, []);

  return { todayMood, saved, saveMood };
}

import { useCallback, useEffect, useMemo, useState } from "react";
import type { MoodEntry } from "../types";
import { useSessionStore } from "../../store/sessionStore";
import {
  fetchPatientMoodEntries,
  upsertPatientMoodEntry,
} from "../mood/service";

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
  const patientId = useSessionStore((s) => s.user?.id);
  const today = useMemo(() => todayKey(), []);
  const [todayMood, setTodayMood] = useState<number | null>(() => {
    const entries = readEntries();
    const todayEntry = entries.find((e) => e.date === todayKey());
    return todayEntry?.mood ?? null;
  });
  const [saved, setSaved] = useState(() => todayMood !== null);
  const [saving, setSaving] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    if (!patientId) return;

    let cancelled = false;

    async function loadRemoteMood() {
      try {
        const entries = await fetchPatientMoodEntries(patientId!);
        if (cancelled) return;
        if (entries.length > 0) writeEntries(entries);
        const todayEntry = entries.find((e) => e.date === today);
        setTodayMood(todayEntry?.mood ?? null);
        setSaved(Boolean(todayEntry));
        setSyncError(null);
      } catch (error) {
        console.error("Failed to load mood check-ins", error);
        if (!cancelled) setSyncError("Guardado localmente hasta sincronizar.");
      }
    }

    void loadRemoteMood();

    return () => {
      cancelled = true;
    };
  }, [patientId, today]);

  const saveMood = useCallback(async (mood: number) => {
    const entries = readEntries().filter((e) => e.date !== today);
    entries.push({ date: today, mood });
    writeEntries(entries);
    setTodayMood(mood);
    setSaved(true);

    if (!patientId) return;

    setSaving(true);
    setSyncError(null);
    try {
      await upsertPatientMoodEntry({ patientId, date: today, mood });
    } catch (error) {
      console.error("Failed to save mood check-in", error);
      setSyncError("Guardado localmente hasta sincronizar.");
    } finally {
      setSaving(false);
    }
  }, [patientId, today]);

  return { todayMood, saved, saving, syncError, saveMood };
}

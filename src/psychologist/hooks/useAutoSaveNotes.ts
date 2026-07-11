import { useEffect, useRef, useState } from "react";

/**
 * Auto-save notes with debounce.
 * Tracks if there are unsaved changes and auto-saves after specified delay.
 */
export function useAutoSaveNotes(
  initialNotes: string,
  onSave: (notes: string) => Promise<void>,
  debounceMs = 2000,
) {
  const [notes, setNotes] = useState(initialNotes);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef(initialNotes);
  const notesRef = useRef(notes);
  const onSaveRef = useRef(onSave);
  notesRef.current = notes;
  onSaveRef.current = onSave;

  // Auto-save with debounce
  useEffect(() => {
    if (notes === lastSavedRef.current) {
      setHasUnsavedChanges(false);
      return; // No changes, no save needed
    }

    setHasUnsavedChanges(true);

    // Clear previous timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set new timeout to save
    debounceTimeoutRef.current = setTimeout(async () => {
      setSaving(true);
      try {
        await onSave(notes);
        lastSavedRef.current = notes;
        setHasUnsavedChanges(false);
      } catch (error) {
        console.error("Failed to auto-save notes:", error);
        // Keep hasUnsavedChanges = true so user knows there's an issue
      } finally {
        setSaving(false);
      }
    }, debounceMs);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [notes, onSave, debounceMs]);

  // Update initial notes when appointment changes
  useEffect(() => {
    setNotes(initialNotes);
    lastSavedRef.current = initialNotes;
    setHasUnsavedChanges(false);
  }, [initialNotes]);

  // Flush any pending debounced save on unmount (e.g. switching to a
  // different appointment remounts this hook via a changed `key`), so
  // typing right before switching never silently discards the edit.
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (notesRef.current !== lastSavedRef.current) {
        void onSaveRef.current(notesRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    notes,
    setNotes,
    saving,
    hasUnsavedChanges,
  };
}

import { getSupabaseClient } from "../../services/supabase/client";
import type { PatientEmotionalOnboarding } from "./types";

type PatientOnboardingRow = {
  main_concern: string | null;
  emotional_goals: string[] | null;
  therapy_preferences: string[] | null;
  current_mood: number | null;
  urgency: string | null;
  support_style: string | null;
  onboarding_notes: string | null;
  onboarding_completed: boolean;
};

export async function fetchPatientOnboarding(
  patientId: string,
): Promise<PatientEmotionalOnboarding | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("patients")
    .select(
      "main_concern, emotional_goals, therapy_preferences, current_mood, urgency, support_style, onboarding_notes, onboarding_completed",
    )
    .eq("user_id", patientId)
    .maybeSingle<PatientOnboardingRow>();

  if (error) throw error;
  if (!data) return null;

  return {
    mainConcern: data.main_concern,
    emotionalGoals: data.emotional_goals ?? [],
    therapyPreferences: data.therapy_preferences ?? [],
    currentMood: data.current_mood,
    urgency: data.urgency,
    supportStyle: data.support_style,
    onboardingNotes: data.onboarding_notes,
    onboardingCompleted: data.onboarding_completed,
  };
}

export async function savePatientOnboarding({
  patientId,
  mainConcern,
  emotionalGoals,
  therapyPreferences,
  currentMood,
  urgency,
  supportStyle,
  onboardingNotes,
}: {
  patientId: string;
  mainConcern: string | null;
  emotionalGoals: string[];
  therapyPreferences: string[];
  currentMood: number | null;
  urgency: string | null;
  supportStyle: string | null;
  onboardingNotes: string | null;
}): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("patients")
    .update({
      main_concern: mainConcern,
      emotional_goals: emotionalGoals,
      therapy_preferences: therapyPreferences,
      current_mood: currentMood,
      urgency,
      support_style: supportStyle,
      onboarding_notes: onboardingNotes,
      onboarding_completed: true,
    })
    .eq("user_id", patientId);

  if (error) throw error;
}

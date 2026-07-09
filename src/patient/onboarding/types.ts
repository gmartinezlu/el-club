export type PatientEmotionalOnboarding = {
  mainConcern: string | null;
  emotionalGoals: string[];
  therapyPreferences: string[];
  currentMood: number | null;
  urgency: string | null;
  supportStyle: string | null;
  onboardingNotes: string | null;
  onboardingCompleted: boolean;
};

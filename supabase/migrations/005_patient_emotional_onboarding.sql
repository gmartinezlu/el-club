alter table public.patients
  add column if not exists main_concern text,
  add column if not exists emotional_goals text[] default '{}',
  add column if not exists therapy_preferences text[] default '{}',
  add column if not exists current_mood smallint check (
    current_mood is null or current_mood between 1 and 10
  ),
  add column if not exists urgency text,
  add column if not exists support_style text,
  add column if not exists onboarding_notes text;

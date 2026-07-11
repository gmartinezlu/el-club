-- Stores the Google Calendar event id (not just the derived Meet link) so
-- google-calendar-cancel-event can delete the exact event later.
alter table public.appointments
  add column if not exists google_calendar_event_id text;

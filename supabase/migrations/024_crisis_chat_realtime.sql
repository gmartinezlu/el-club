-- Enable Supabase Realtime for crisis chat messages so both sides of the
-- conversation see new messages live without polling/reloading.
alter publication supabase_realtime add table public.crisis_chat_messages;

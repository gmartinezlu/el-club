-- Google Calendar/Meet integration: one row per psychologist who has
-- connected their Google account. Tokens are encrypted by the Edge
-- Function before insert (pgp_sym_encrypt with a server-side key that
-- never reaches the client) — this table never stores plaintext tokens.

create table if not exists public.google_integrations (
  psychologist_id uuid primary key references public.psychologists (user_id) on delete cascade,
  google_email text not null,
  calendar_id text not null default 'primary',
  access_token_encrypted bytea not null,
  refresh_token_encrypted bytea not null,
  access_token_expires_at timestamptz not null,
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.google_integrations enable row level security;

-- Owner-only: the psychologist manages their own connection, admins can
-- see/revoke any connection for support purposes. Same pattern as
-- availability_manage_psychologist in 002_functions_and_rls.sql.
drop policy if exists google_integrations_manage_own on public.google_integrations;
create policy google_integrations_manage_own on public.google_integrations
for all
using (psychologist_id = auth.uid() or public.is_admin())
with check (psychologist_id = auth.uid() or public.is_admin());

drop trigger if exists trg_google_integrations_updated_at on public.google_integrations;
create trigger trg_google_integrations_updated_at
before update on public.google_integrations
for each row execute function public.set_updated_at();

-- Edge Functions use the service role key and bypass RLS entirely, so
-- this table is never queried directly by the browser client — only
-- through the connect/callback/disconnect Edge Functions.
revoke all on public.google_integrations from anon, authenticated;

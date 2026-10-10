-- King Down accounts, phase 1 of online play: handles and privacy settings on profiles, reserved
-- handles, and the account deletion queue (report part 03, sections 5.1 and 8.8).
-- Run after 0001 with a privileged connection. It is safe to run again.
-- Only the game server writes the new columns and tables; the browser reads the public columns only.

begin;

alter table public.profiles
  add column if not exists handle text,
  add column if not exists handle_changed_at timestamptz,
  add column if not exists icon text,
  add column if not exists on_leaderboards boolean not null default true,
  add column if not exists public_page boolean not null default false,
  add column if not exists challenge_from text not null default 'signed-in',
  add column if not exists online_visible_to text not null default 'mutual',
  add column if not exists quiet_mode boolean not null default false,
  add column if not exists accepting_games boolean not null default true;
-- 3-20 characters, lowercase: a letter first, a letter or a digit last.
alter table public.profiles drop constraint if exists profiles_handle_format;
alter table public.profiles add constraint profiles_handle_format check (handle ~ '^[a-z][a-z0-9_-]{1,18}[a-z0-9]$');
alter table public.profiles drop constraint if exists profiles_icon_format;
alter table public.profiles add constraint profiles_icon_format check (icon ~ '^[a-z0-9-]{1,40}$');
alter table public.profiles drop constraint if exists profiles_challenge_from;
alter table public.profiles add constraint profiles_challenge_from check (challenge_from in ('nobody', 'follows', 'signed-in', 'everyone'));
alter table public.profiles drop constraint if exists profiles_online_visible_to;
alter table public.profiles add constraint profiles_online_visible_to check (online_visible_to in ('everyone', 'mutual', 'nobody'));
create unique index if not exists profiles_handle_key on public.profiles (handle);

-- Other signed-in players see the public columns only; a player's own settings go through the server.
grant select (id, display_name, avatar_url, rating, handle, icon) on public.profiles to authenticated;

-- No real-name default: a new profile no longer copies the provider's full name or photo.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
exception when others then
  -- A missing profile must never stop a sign-up.
  raise warning 'handle_new_user: no profile for %: %', new.id, sqlerrm;
  return new;
end $$;

-- Old and deleted handles, and blocked words: a new handle is never one of these.
create table if not exists public.reserved_handles (
  handle text primary key check (handle ~ '^[a-z0-9_-]{1,40}$'),
  reason text not null check (reason in ('old', 'deleted', 'blocked')),
  user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

-- A deletion request runs after a 7-day grace; a sign-in in the grace cancels it. No foreign key:
-- the row outlives the account as the record that the deletion ran.
create table if not exists public.account_deletions (
  user_id uuid primary key,
  requested_at timestamptz not null default now(),
  run_after timestamptz not null default now() + interval '7 days',
  cancelled_at timestamptz,
  done_at timestamptz
);
create index if not exists account_deletions_due on public.account_deletions (run_after)
  where cancelled_at is null and done_at is null;

alter table public.reserved_handles enable row level security;
alter table public.account_deletions enable row level security;
revoke all on public.reserved_handles, public.account_deletions from public, anon, authenticated;

commit;

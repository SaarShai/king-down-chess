-- The short-code limit (report part 03, section 8.5): at most 10 invitation-code tries for each player in one
-- hour, on both surfaces (GameService.join counts them; the 43-character link token cannot be guessed, so it is
-- not counted). One row for each player, a window that starts again after an hour. Run after 0008 with a
-- privileged connection. It is safe to run again. RLS is on and the browser roles get nothing.

begin;

create table if not exists public.invite_code_tries (
  user_id uuid primary key references auth.users (id) on delete cascade,
  window_start timestamptz not null default now(),
  tries integer not null default 1 check (tries >= 1)
);
alter table public.invite_code_tries enable row level security;
revoke all on public.invite_code_tries from public, anon, authenticated;

commit;

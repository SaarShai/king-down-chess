-- One durable selection per launched board; never an account-wide pointer.
begin;
create table if not exists public.plugin_boards (
 id uuid primary key,
 actor_id uuid not null references auth.users(id) on delete cascade,
 match_id uuid not null references public.plugin_matches(id) on delete cascade
);
alter table public.plugin_boards enable row level security;
revoke all on public.plugin_boards from public,anon,authenticated;
commit;

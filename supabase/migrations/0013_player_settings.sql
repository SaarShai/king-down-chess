-- An empty board and a board whose game was deleted have different read results.
begin;
alter table public.plugin_boards add column if not exists created_at timestamptz not null default now();
alter table public.plugin_boards add column if not exists game_selected boolean not null default true;
create table if not exists public.player_settings (
 user_id uuid primary key references auth.users(id) on delete cascade,
 symbols_only boolean not null default false,
 show_threats boolean not null default false,
 last_setup jsonb
);
alter table public.player_settings enable row level security;
revoke all on public.player_settings from public, anon, authenticated;
commit;

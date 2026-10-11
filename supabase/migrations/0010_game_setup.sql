-- Seat setup for plugin games. A saved game with no options keeps its fixed setup.
begin;
alter table public.games drop constraint if exists games_kind_check;
alter table public.games add constraint games_kind_check check (kind in ('solo', 'friend', 'random'));
alter table public.games drop constraint if exists games_status_check;
alter table public.games add constraint games_status_check check (status in ('waiting', 'setup', 'playing', 'finished', 'aborted'));
alter table public.games
  alter column state drop not null,
  alter column snapshot drop not null,
  alter column rules drop not null,
  alter column engine_fingerprint drop not null,
  add column if not exists options jsonb check (octet_length(options::text) <= 8192),
  add column if not exists draw text check (char_length(draw) = 8),
  add column if not exists deal jsonb check (jsonb_typeof(deal) = 'array' and jsonb_array_length(deal) <= 4),
  add column if not exists level text not null default 'club' check (level in ('beginner', 'casual', 'club', 'strong')),
  add column if not exists setup_deadline_at timestamptz,
  add column if not exists rematch_offer smallint check (rematch_offer in (0, 1)),
  add column if not exists rematch_game_id uuid references public.games(id) on delete set null;
alter table public.game_players
  add column if not exists choice jsonb check (octet_length(choice::text) <= 512),
  add column if not exists ready boolean not null default false;
create index if not exists games_setup_deadline on public.games (setup_deadline_at) where status = 'setup';
commit;

-- The open lobby and its 24-hour sweep share this index.
begin;
create index if not exists games_random_waiting on public.games (created_at, id) where kind='random' and status='waiting';
create index if not exists game_players_recent on public.game_players (last_seen_at, user_id) where user_id is not null;
commit;

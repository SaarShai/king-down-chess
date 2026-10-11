-- Results for plugin games. Browser roles have no access; the game service is the writer.
begin;
create table if not exists public.player_ratings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  rating double precision not null default 1500 check (rating >= 400 and rating < 'Infinity'::float8),
  rd double precision not null default 350 check (rd between 45 and 350),
  volatility double precision not null default 0.06 check (volatility > 0 and volatility <= 0.1),
  last_game_at timestamptz
);
create table if not exists public.rating_history (
  game_id uuid not null references public.games(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating_before double precision not null,
  rd_before double precision not null,
  volatility_before double precision not null,
  rating double precision not null,
  rd double precision not null,
  volatility double precision not null,
  created_at timestamptz not null,
  primary key (game_id, user_id)
);
create table if not exists public.player_badges (
  user_id uuid not null references auth.users(id) on delete cascade,
  badge text not null check (badge in ('first_win', 'friend_match', 'stranger_match', 'purist', 'fairy_tale',
    'architect', 'card_sharp', 'crowned', 'royal_collection', 'giant_slayer')),
  earned_at timestamptz not null,
  game_id uuid references public.games(id) on delete set null,
  primary key (user_id, badge)
);
do $$
declare t text;
begin
  foreach t in array array['player_ratings', 'rating_history', 'player_badges'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from public, anon, authenticated', t);
  end loop;
end $$;
commit;

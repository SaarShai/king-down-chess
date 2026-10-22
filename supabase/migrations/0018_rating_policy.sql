-- Existing rows and old inserts keep their original result contract.
-- Recovery writers must understand this policy before any new Casual game can finish.
alter table public.games add column if not exists rating_policy text not null default 'legacy'
  check (rating_policy in ('legacy','casual','ranked-v1'));

create or replace function public.keep_game_rating_policy() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.rating_policy is distinct from old.rating_policy then
    raise exception 'The game rating policy is fixed at creation';
  end if;
  return new;
end;
$$;
drop trigger if exists games_rating_policy_fixed on public.games;
create trigger games_rating_policy_fixed before update of rating_policy on public.games
  for each row execute function public.keep_game_rating_policy();

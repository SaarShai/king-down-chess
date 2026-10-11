-- An empty board and a board whose game was deleted have different read results.
begin;
alter table public.plugin_boards add column if not exists game_selected boolean not null default true;
commit;

-- A game command and a seat's last surface can come from the Muse connector, 'muse' (docs/specs/muse-connector).
-- Run after 0022 with a privileged connection, before the server code that writes the surface. It is safe to run again.
begin;
set local lock_timeout = '5s';

alter table public.game_players drop constraint if exists game_players_last_surface_check;
alter table public.game_players add constraint game_players_last_surface_check check (last_surface in ('web', 'chatgpt', 'muse'));
alter table public.game_commands drop constraint if exists game_commands_surface_check;
alter table public.game_commands add constraint game_commands_surface_check check (surface in ('web', 'chatgpt', 'muse'));

commit;

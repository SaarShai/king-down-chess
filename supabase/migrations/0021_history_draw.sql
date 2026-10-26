-- A game that fills its history ends as a draw with its own end reason, 'history' (server audit F5; owner, 2026-10-26).
-- Run after 0020 with a privileged connection, before the server code that writes the reason. It is safe to run again.
begin;

alter table public.games drop constraint if exists games_end_reason_check;
alter table public.games add constraint games_end_reason_check check (end_reason in ('checkmate', 'stalemate', 'draw50', 'drawRepetition',
  'drawMaterial', 'history', 'resignation', 'agreement', 'timeout', 'abort', 'no_start'));

commit;

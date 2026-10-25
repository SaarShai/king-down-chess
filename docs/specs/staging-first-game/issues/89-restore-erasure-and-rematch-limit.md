# Restore keeps erasures; a rematch counts on the Create limit

Type: task
Status: resolved

A read-only server audit of `e3fd4411` confirmed two faults. This ticket fixes them. It deploys nothing and touches no remote database.

## Faults

1. **F2: the release restore puts back erased solo games.** `plugin-deploy/release-restore-games.sql` inserted every backup game that was deleted since the backup. After `kingdown_jobs.delete_account` (`supabase/migrations/0007_jobs.sql`) deleted an account and its solo games, as the privacy page promises, a restore put the solo game back: status `playing`, the moves, and the deleted handle in `game_players.handle_at_start`.
2. **F1: resign and rematch make games past the Create limit.** `TOOL_LIMITS` (`src/plugin/service.ts`) had no entry for `kingdown_rematch`, and the website command route counted only a computer turn. A solo rematch offer makes the next game at once, so resign plus rematch made new games with no limit after the 60 `kingdown_create` calls of one minute.

## Changes

- Restore: before the foreign-key actions, the restore leaves out each backup solo game with a seat account that is not in `auth.users` now, with its seats, commands and invites. A backup seat named an account that existed at the backup, so a missing account was deleted since the backup. This also covers an owner's delete in `auth.users`, which `account_deletions` does not record. A game with another human seat stays, with the seat null: the rule of `delete_account`, which keeps such a game for the opponent and keeps its `handle_at_start`. The script prints `erased_games_left_out`. The comment of the script, `docs/HOSTING.md` and release-safety ticket 01 say the same.
- Limit: `commandLimit` (`src/plugin/service.ts`) names the counter of a game command. A rematch offer or accept counts on `kingdown_create`; a computer turn on `kingdown_computer`; a decline, a resign and the other commands count nothing. The MCP server (`kingdown_rematch`) and the website route (`POST /api/games/:id/commands`) both use it. `kingdown_find` keeps the Create counter.

## Verification

- `tools/plugin-db/release-backup.db.test.ts`, new case: `delete_account` erases an account after the backup; the restore leaves its solo game out (no game, seat, command or invite row, no handle at start), brings back its friend game with the seat null and the handle that `delete_account` kept, and gives the same result on a second run.
- `src/plugin/server.db.test.ts`, new case: at the last Create slot a solo rematch offer takes the slot; then resign still works, and the next rematch offer is `RATE_LIMITED` and makes no game.
- `src/api/http.test.ts`, new case: a rematch offer or accept counts on `kingdown_create`; a resign or decline counts nothing; a refused count runs no command.
- Red on the old code: the three new cases fail (`restored_games: "3"`, the solo game came back; the Create counter stays at 59; the website route never counts). Green on the new code: the six related files, 158 tests pass.

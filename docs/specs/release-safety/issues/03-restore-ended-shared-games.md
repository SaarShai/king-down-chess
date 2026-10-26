# Release safety: the restore keeps the live end of a deleted account's shared game

Type: task
Status: ready-for-review (branch `staging/restore-sql`)

The release review found one P3 in `plugin-deploy/release-restore-games.sql`. This ticket fixes it. It deploys nothing and runs the script only on the local test database.

## Fault

`runDeletions` (`src/online/jobs.ts`) ends each game in which the account's seat is active before `kingdown_jobs.delete_account` deletes the account: the opponent wins by resignation, or the game is aborted. The restore wrote the backup copy of such a friend game back: status `playing` (or `waiting`), with the deleted seat null. Nobody can play that seat. The sweep (`GameService.sweep`, `src/match/service.ts`) can then end the game on time for the side to move, so the opponent's win can become a loss. Ticket [01](01-backup-restore-and-engine-target.md) said that the restore returns this game "as `delete_account` left it", which was false.

## Change

- The restore leaves out each backup game with a seat account that is not in `auth.users` now, when the game is solo (as before, [ticket 89](../../staging-first-game/issues/89-restore-erasure-and-rematch-limit.md)) or that seat was active at the backup. The seat's `active` flag is the condition of `runDeletions`. The live copy keeps its end, with all its rows; a game with no live copy stays deleted. A game that had ended at the backup is restored as before, with the foreign-key actions.
- The script also prints `ended_games_kept`. The order of the deletes and inserts, the checks and the foreign-key actions do not change.
- Ticket 01 (steps 3 and 4, the printed counts, Verification), the script comment and `docs/HOSTING.md` say the same.

## Verification

- `tools/plugin-db/release-backup.db.test.ts`, new case: after the backup, the deletion job resigns friend game `a` and aborts waiting game `w`, and `delete_account` erases the account. The restore keeps `a` finished (White wins by resignation) and `w` aborted, leaves every game row as it was, and gives the same result on a second run.
- The solo case now ends the games as `runDeletions` does (before, it only cleared `active`), and expects the shared game as the deletion left it.
- The foreign-key case now uses a game that ended before the backup and that a fault deleted, so only the backup copy can bring it back. Mutation: without the seat null-out, this case fails with `game_players_user_id_fkey`.
- Red on the old script: 2 of 10 fail. The new case reads `status: 'playing'`, `result: null`, `end_reason: null` for `a`; the solo case reads `restored_games: '2'`.
- Green: `KINGDOWN_TEST_FILE=tools/plugin-db/release-backup.db.test.ts npm test`: 10 tests pass.

# Release safety: the restore keeps the live end of a deleted account's shared game

Type: task
Status: ready-for-review (branch `staging/restore-sql`)

The release review found one P3 in `plugin-deploy/release-restore-games.sql`. This ticket fixes it. It deploys nothing and runs the script only on the local test database.

## Fault

`runDeletions` (`src/online/jobs.ts`) ends each game in which the account's seat is active before `kingdown_jobs.delete_account` deletes the account: the opponent wins by resignation, or the game is aborted. The restore wrote the backup copy of such a friend game back: status `playing` (or `waiting`), with the deleted seat null. Nobody can play that seat. The sweep (`GameService.sweep`, `src/match/service.ts`) can then end the game on time for the side to move, so the opponent's win can become a loss. Ticket [01](01-backup-restore-and-engine-target.md) said that the restore returns this game "as `delete_account` left it", which was false.

## Change

- The restore leaves out each backup game with a seat account that is not in `auth.users` now, when the game is solo (as before, [ticket 89](../../staging-first-game/issues/89-restore-erasure-and-rematch-limit.md)) or that seat was active at the backup. The seat's `active` flag is the condition of `runDeletions`. The live copy keeps its end, with all its rows; a game with no live copy stays deleted. A game that had ended at the backup is restored as before, with the foreign-key actions.
- The script also prints `ended_games_kept`. The order of the deletes and inserts, the other checks and the foreign-key actions do not change.
- The rating check runs after the leave-out, on the games that the restore writes only. `runDeletions` ends a game through the game service, so `recordResult` (`src/match/results.ts`) writes one `rating_history` row for each seat of a legacy or ranked-v1 game, and `delete_account` then deletes the account's row. A left-out game keeps these live rows. Before, the check ran over all backup games and refused the whole restore for such a game.
- A backup rematch link to a left-out game with no live copy becomes null, as `games_rematch_game_id_fkey` (`0010_game_setup.sql`, on delete set null) does. Without it, the update in place wrote the link and broke that foreign key, so the whole restore rolled back.
- Ticket 01 (steps 3 and 4, the printed counts, Verification), the script comment and `docs/HOSTING.md` say the same.

## Verification

- `tools/plugin-db/release-backup.db.test.ts`, new case: after the backup, the deletion job resigns friend game `a` and aborts waiting game `w`, and `delete_account` erases the account. The restore keeps `a` finished (White wins by resignation) and `w` aborted, leaves every game row as it was, and gives the same result on a second run.
- The solo case now ends the games as `runDeletions` does (before, it only cleared `active`), and expects the shared game as the deletion left it.
- The `end()` helper writes the rating rows that `recordResult` writes for a finished legacy or ranked-v1 game of two accounts. The fixture games are legacy (the column default). The new case also expects the opponent's live rating row of `a` after the restore.
- Rematch case: `p` is a casual friend game that ended before the backup, and its rematch `x` (casual) is in play. After the backup a fault deletes `x`, the deletion job resigns `a`, and `delete_account` erases the account. The restore leaves every game row as it was, `x` stays deleted, and the link of `p` is null.
- The foreign-key case now uses a game that ended before the backup and that a fault deleted, so only the backup copy can bring it back. Mutation: without the seat null-out, this case fails with `game_players_user_id_fkey`.
- Red on the old script: 2 of 10 fail. The new case reads `status: 'playing'`, `result: null`, `end_reason: null` for `a`; the solo case reads `restored_games: '2'`.
- Green: `KINGDOWN_TEST_FILE=tools/plugin-db/release-backup.db.test.ts npm test`: 11 tests pass.

## Review

- Independent review of `63847e2e`, P2: the rating check ran over all backup games, so the restore still refused a rated (legacy or ranked-v1) friend game that the deletion job ended. The tests passed only because `end()` wrote no rating rows. Fixed: the check runs on the games that the restore writes. Red on `63847e2e` with the faithful `end()`: 2 of 10 fail with `restore refused: 1 rating row(s) of backup games changed since the backup` (the solo case and the new case). Green: 10 pass.
- Same review, P2: a regression. When a restored game had a rematch link to a game that the new rule leaves out and that has no live copy, the restore failed with `23503 games_rematch_game_id_fkey` and rolled back; the script before this ticket restored it. Fixed: that link becomes null, as the foreign key does. The review's other fix (leave out a shared game only when its live copy exists) was not taken: it brings that game back in play with a seat that nobody can play, the fault of this ticket. Red on the rating fix alone: the rematch case fails with `games_rematch_game_id_fkey`, 1 of 11. Green: 11 pass.

# Release safety: a tested restore, a production-only engine check and a one-snapshot backup

Type: task
Status: resolved

Two independent read-only audits of the 2026-10-23 production release (commit `bdd886c7`) found no fault that affects players. They found three faults in the recovery and publish proof. This ticket fixes them. It changes no game code, deploys nothing and writes nothing to the production database. A production restore stays the owner's decision.

## Faults

1. **Restore procedure (confirmed).** The release log says to restore with `insert into public.<table> select * from release_backup_20261022.<table>`. The primary keys of `games` and `game_commands` (`supabase/migrations/0006_games.sql`) refuse a row that still exists, so the insert cannot bring back a changed game.
2. **Engine-check target (confirmed).** `tools/deploy.sh --publish` needs a non-empty `KINGDOWN_ENGINES_DATABASE_URL`, but nothing proves that it names the production project. A staging or loopback database with empty tables passes the engines-in-use check.
3. **Backup snapshot (plausible).** The backup script starts with a plain `begin` and copies the tables one at a time. In read committed mode each copy has a new snapshot, so a live move between two copies can make `games` and `game_commands` disagree.

## Plan and scope

1. Engine-check target: add `productionDatabase(url)` to `tools/staging-config.mjs`, from the same direct-host and pooler-user checks that `stagingConfig` uses. `deploy.sh --publish` refuses any other engines database before any Git or publish work. The publish step runs `engines-check.mjs --production`, which refuses before any connection. Without `--production` (check-only mode, local tests) the checker still accepts a loopback database.
2. Backup: put the release template in the repository as `plugin-deploy/release-backup.sql`. It starts with `BEGIN ISOLATION LEVEL REPEATABLE READ` and copies the tables in name order.
3. Restore: add `plugin-deploy/release-restore-games.sql` and test it on a disposable local database with a changed game, a deleted game, an added game and a deleted account.

## Restore procedure

`plugin-deploy/release-restore-games.sql` runs as one transaction. Tables: `games`, `game_players`, `game_commands`, `game_invites`.

1. Lock the four tables in `exclusive` mode until the commit. Reads continue; the game service and the jobs wait.
2. Refuse the backup when a backup game does not have exactly the command rows `1..revision`, when a backup child row has no backup game, or when a backup game lacks seat 0 or seat 1. Every game needs both seats, for every kind and status: `src/match/service.ts` makes `players: [player(0), player(1)]`, `src/match/store.ts` `insert` writes both seats in the game's transaction, and `game_players` allows only `seat in (0, 1)` with the primary key `(game_id, seat)` (`0006_games.sql`). A solo game's computer seat is a row too. A plain-`begin` copy can hold a game that started after its `game_players` copy: revision 0 and no commands pass the command check, but the game has no seats. Refuse when the `rating_history` rows of a backup game changed since the backup: a rating restore is a separate decision.
3. Keep the erasure of each account deleted since the backup. `kingdown_jobs.delete_account` (`supabase/migrations/0007_jobs.sql`) deletes the solo games of the account, as the privacy page promises, and keeps a game with another human seat for the opponent. So the restore leaves out each backup solo game with a seat account that is not in `auth.users` now, with its seats (and the handle at start), commands and invites. A backup seat named an account that existed at the backup (its foreign key held in the snapshot), so a missing account was deleted since the backup. A live copy of such a game (an owner's delete in `auth.users` leaves one) stays as it is.
4. Apply the foreign-key actions of accounts deleted since the backup to the other backup rows: the reference becomes null, and an invite that the account made stays deleted. This is what `delete_account` leaves in a game with another human seat.
5. Delete the live player, command and invite rows of each backup game.
6. Insert each backup game that was deleted since the backup. Then write every backup game in place, with an update, so reports, badges, boards and rematches keep their link.
7. Insert the backup player, command and invite rows. Only the columns that the backup and the live table share are copied; a column added since the backup keeps its default.
8. Refuse, and roll back everything, when a restored game and its command rows disagree.

Newer rows:

- A game made after the backup stays as it is, with all its rows.
- A backup game loses the moves, joins, seat changes and invites written after the backup.
- Not restored: accounts, profiles, settings, ratings, notifications and the outbox. Notifications about removed moves stay.
- A restored deadline that passed since the backup ends its game at the next `kingdown-tick`. To prevent that, the owner pauses that job before the restore.

The script prints `backup_games`, `restored_games` (same revision and status as the backup), `newer_games_kept` and `erased_games_left_out` (step 3). A second run gives the same result.

## Verification

- A staging pooler URL, a staging direct URL, a loopback URL and another host each stop `deploy.sh --publish` (website and plugin) before any Git call or step, without the password in the output.
- The check-only mode still accepts a loopback engines database.
- `engines-check.mjs --production` refuses a loopback and a staging URL with exit 2 before any connection, without the password in the output.
- `productionDatabase` accepts the production direct host and pooler user in any case, with a trailing dot or percent-encoded. It refuses staging, loopback and other hosts, a database other than `postgres`, a decoded NUL byte in the user or the database name (`%00` ends a startup field, so the pooler could read a second user that names staging), a non-empty `PGOPTIONS` (the client sends it as startup options, and the pooler's `reference` option selects the project before the user suffix does), and any pooler user other than `<plain role>.<production ref>` (the pooler reads `<role>.cluster.<alias>` as a cluster alias, which can name another project).
- Backup: a move that commits while the backup waits between its `game_commands` copy and its `games` copy is in no backup table. Control: with a plain `begin`, a seat and game update in the same wait gives a backup whose `games` and `game_players` disagree, with every count equal.
- Restore: the old insert fails with `23505`. The restore brings back the changed game and the deleted game, keeps the added game with its rows, keeps the report link, and gives the same result on a second run. A deleted account's seat becomes null and its invite stays deleted. After `delete_account` erases an account since the backup, its solo game stays deleted with no seat, command or invite row, and its handle at start does not come back; its friend game comes back with the seat null, as `delete_account` left it. A backup with a missing command row, a changed rating row, a revision-0 game with no seats, a game with one seat, or an invite whose game is not in the backup is refused, and the live rows do not change.

## Evidence

Base `bdd886c7` (origin/main), branch `staging/release-safety`. Local test cluster on port 55432; the database test runs on its own copy `kingdown_release_safety_releasebackup_test`.

- `KINGDOWN_TEST_FILE='tools/{deploy,staging-config,engines}.test.ts' npm test`: 3 files, 321 tests pass.
- `KINGDOWN_TEST_FILE='tools/plugin-db/release-backup.db.test.ts' npm test`: 7 tests pass. The seat test (review finding 4357499620) failed on the earlier SQL: the restore accepted the backup.
- Mutation: with `begin;` in place of `begin isolation level repeatable read;` in `release-backup.sql`, the one-snapshot test fails with `backup count differs for game_commands: 4 vs 3`. The template was put back.
- Full `npm test` at `aff8104c`: 257 files, 4781 tests pass, 8 skipped. An earlier full run had one browser timeout in `tools/plugin-motion.test.ts` ("opens end actions during a live win") at load average 14; that file passed alone, and the next full run passed.
- `npm run test:docs`: 13 files, 166 tests pass.
- After the seat check (`90674dd8`, main `0a043d4b` merged): full `npm test` 268 files, 5021 tests pass, 8 skipped.
- After the review fixes (`3abad803`): focused `tools/{deploy,staging-config,engines,plugin-db-config}.test.ts` 365 pass; `npm run test:docs` 166 pass. Full `npm test` at `3abad803` had one timing failure in `tools/plugin-app.test.ts` ("keeps two failed polls silent ...") at load average 13.8 while the review also ran tests; that file passed alone (136 tests). The next full `npm test` (`4f5adff4`): 268 files, 5030 tests pass, 8 skipped.

Limits: the test database stands in for Supabase (`auth.users`, roles). No production backup was read and no production restore was run. The production backup `release_backup_20261022` was made with the plain `begin` form; these tests do not show that it is inconsistent. Before a restore from it, the restore's own consistency check (step 2) shows whether its games and command rows agree.

## Review

- Automated PR review, finding 4357499620 (P1): the restore accepted a backup game with no player rows. Fixed in `90674dd8` (the seat check); the new test failed on the earlier SQL.
- Independent review by a Codex run on `0a043d4b..37de31ba`: changes needed.
  - Must-fix: a percent-encoded NUL byte in the pooler user or the database path passed `productionDatabase`, and the client sends both as NUL-ended startup fields, so the pooler could select staging. Fixed: the check refuses a NUL byte in the user and requires the database `postgres`. Refusal tests for both forms in the shared check, `deploy.sh --publish` and `engines-check.mjs --production`.
  - Should-fix: no test held the orphan-child check. Added: a backup invite that points at a newer live game is refused, and the live rows do not change.
  - Mutation: without the NUL check, 3 tests fail (shared check, deploy, CLI); without the orphan check, the new restore test fails.
  - Re-check of `37de31ba..165d24ab`: changes needed. Must-fix: `PGOPTIONS=reference=<staging ref>` still selected another project through the pooler's startup options. Fixed: the shared check refuses a non-empty `PGOPTIONS`; refusal tests in the shared check, `deploy.sh --publish` and `engines-check.mjs --production`, none of which prints the value. Should-fix: the CLI table lacked the NUL database-path form; added. Mutation: without the `PGOPTIONS` refusal, those 3 tests fail.
  - Second re-check of `165d24ab..2297dd8a`: changes needed. Must-fix: a pooler user `<role>.cluster.<alias>.<production ref>` passed the last-dot check, and the pooler reads it as a cluster alias that can name another project. Fixed with an allow-list: the pooler user must be exactly `<role>.<production ref>`, where the role is letters, digits and `_`. Refusal tests (plain and percent-encoded) in the shared check, `deploy.sh --publish` and `engines-check.mjs --production`. Mutation: with the last-dot check back, those 3 tests fail. The review found no other route through the URL, the client's environment inputs or the startup fields.
  - Third re-check of `2297dd8a..3abad803`: approve, no findings. The cluster-alias route is closed; the runtime pooler user and the direct host still pass; no earlier route reopens.
  - Correct as reviewed: the one-snapshot backup, lock mode, update in place, foreign-key actions, shared columns, triggers, refusal before live changes, and rollback in the SQL editor.

## Comments

- Merge needs a review by a reader that did not write the diff (AGENTS.md). The release log line on the restore path (`evidence/production-release/LOG.md`, outside this repository) now points at `release-restore-games.sql`.

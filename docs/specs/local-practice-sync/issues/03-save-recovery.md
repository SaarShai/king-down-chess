# Offer the legal part of a saved game

Type: task
Status: resolved

## Owner decision

The owner selects option 3 for local saves on 2026-10-26. Offer the legal part after a rules change. Keep the full source until the player accepts the recovered game or starts a New game.

## Plan and checks

1. Add replay, recovery, save-gate, and cloud-order tests. Show each fault before its fix.
2. Keep the legal part on the board. Offer Use recovered game and New game. Keep the full source until acceptance. Check the source again on acceptance.
3. Fix all four findings from the independent review of PR #158. Move its probes into the page and sync tests. Check each choice by keyboard.
4. Fix all three round 2 findings. Add the reload and FEN probes and the passing controls to the repo tests. Show the failures before each fix. Keep the equal-reply and focus fixes.
5. Run the requested three-file tests, doc checks, and three browser checks, one command at a time. Obey the quiet lock. Fetch and merge the base before the last commit. Commit on this branch. Do not push.

## Change and review findings

The save reader returns the legal part and keeps the full source. The page notice and live region give the action count. Acceptance clears the old result and staged count. A partial Haste turn uses the existing legal pass. Failed writes keep the full source. Tests also cover zero legal actions, powers, another tab, cloud order, and a reload.

- P1: The account callback can be absent, and a sync-record write can fail. The recovery source time now saves with the accepted game in one `kingdown.save` write. A normal stamp reads that time. The optional account callback cannot lose it. Settings and unchanged startup saves keep the marker; a new game change clears it. The cloud does not receive this local field.
- P2: An equal upload reply is confirmation. Sync keeps the local time and clears the local marker. It does not reload the game or cancel a move in motion. A different newer cloud copy still wins, including a tie after a reload.
- P2: A newer partial cloud save on a plain `?fen=` page now opens the legal part and both recovery choices.
- P3: Native dialog close restores the opener. The late close handler moves focus only when BODY has focus. Acceptance and a new game focus the board. Cancel restores the recovery New game button. A failed read focuses Menu or the visible recovery button.

Every local game carries `gameAt` in the same `kingdown.save` write as its data. Sync reads the game and its time together. It never infers game time from a changed JSON string or from `kingdown.sync`, except the one-time upgrade of an old save. A missing or invalid time is unknown (0), never newer than an existing cloud game. Only a player change advances local time. Startup, settings, recovery acceptance, and retries keep it. A downloaded or confirmed cloud game carries the server time. Recovery keeps its source time; its existing one-step upload proposal stays bounded by that source and rechecks the cloud. Recovery owns `fen`, `army`, `moves`, `rules`, `kings`, `design`, and `players` through one function. It clears both the live parameters and browser URL, and clears the live FEN and rule preset. Display fields, unrelated fields, and the hash stay. A pending recovery offer takes priority over Home and the title, including a fresh tab. Tests enforce both invariants. No game rule, server, migration, or dependency change is made.

## Red evidence

- The initial build has 12 failed tests before recovery is added. Its focused green run has 154 passes.
- Review repair: `KINGDOWN_TEST_FILE='src/{screen/play,account/sync}.test.ts' KINGDOWN_TEST_NAME='review recovery faults|recovery read failure|recovery confirmation' npm test` gives 8 failures, 3 passes, and 133 skips. Both type checks pass.
- P1 fails both page probes and the stale sync-record probe. P2 fails the move-in-motion probe, the equal-reply sync probe, and the FEN probe. P3 fails both read-failure focus probes.
- The browser red run fails after acceptance: focus is on Menu instead of the board. Its record is in `save-recovery-uRNnb2` under the browser output root.

## Green evidence

- `KINGDOWN_TEST_FILE='src/{screen/play,screen/save,account/sync}.test.ts' npm test`: 165 passes in 3 files. Both type checks and all 67 art checks pass.
- `npm run test:docs`: 180 passes in 15 files.
- The first three-browser run passes New game and visual design. Web game fails with database constraint `23514`: the shared local database has the later friend-invitation state constraint. A separate database made with `tools/plugin-db/make-test-db.mjs` and the branch bootstrap fixes the test setup. Web game then passes in 71.1 seconds. No source fix is needed.
- The full `npm test` runs once with that separate local database, before the base merge. It passes 5,468 tests in 284 files, with 8 skips. Both type checks and all 67 art checks pass. The test phase takes 436.87 seconds.
- The fetched base adds the spent-card motion fix at `b07d7f74`. The merge has no conflicts. After the merge, `KINGDOWN_TEST_FILE='{src/{screen/play,screen/save,account/sync,ui/motion},tools/plugin-motion}.test.ts' npm test` passes 210 tests in 5 files, both type checks, and all 67 art checks.
- After the merge, `npm run check:browser new-game visual-design web-game` passes all 3 checks: 31.8, 25.1, and 70.5 seconds. The build passes. Web game uses the separate local database.
- The New game check covers recovery at 1280 × 900, 390 × 844, and 844 × 390. It checks source retention, keyboard order, the live notice, reload, Escape, Cancel, Start, failed reads, and a late close event.
- `git diff --check` passes. The temporary databases from this run are removed.

Logs use the `recovery2-` prefix in the task output folder. Final browser evidence is in `/var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-check-runs/save-recovery-4CJx6p/`.

## Commits

- `a2c75dd8`: initial recovery build.
- `147a70a9`: base merge before the independent review.
- `87e5ebaf`: merge `origin/staging/first-game` at `b07d7f74` for this repair.
- `cda1ca14`: fix the four findings and add the review tests.

## Limits

No live account or screen reader test runs. Browser checks test live-region attributes and keyboard access. The full suite precedes the final base merge; the affected tests and all three browser checks pass after it. No push or deploy runs. Commit hooks run without changes.

## Round 2 repair plan

- Keep the recovery time through an unchanged startup save, with a late account load or a failed sync-record write. Check that a newer cloud game wins after reload. Check that a move clears the time.
- End the FEN override when an account game opens for recovery. Check the board and storage after a newer complete game wins, then try the old line's next move.
- Restore the recovery offer on a FEN reload. Keep the full source and both choices. Add this case to the New game browser check.
- Keep the failed-upload, account-switch, and sign-out controls. Record red and green counts and the final checks here.

## Round 2 findings and fixes

- P1, recovery time: The startup save builds a new save object and drops the local recovery time. A later stamp makes the old game newer than the account game. The save now keeps the stored recovery time when the game fields match. An explicit New game or changed game does not keep it. Cloud confirmation still clears it. The tests cover both a late account load and a failed sync-record write, then reload and the startup save. They also check repeated saves, settings, and a new move.
- P1, FEN board: Recovery loads an account game, but the old FEN flag stops a later complete account game from reaching the board. Opening an account game now clears the flag and removes `fen` from the URL. The test checks board and storage, then tries the old line's next move. The newer account game stays.
- P2, FEN reload: Startup skips the stored partial save on a plain FEN page. A later write blocks play but loses the recovery choice. Startup now reads a partial save and restores its settings and recovery offer. The restore path also finds that partial save if its caller passes no save. The New game browser check covers both choices and full source retention before and after reload.
- The passing failed-upload and sign-out probes are now sync tests. The account-switch probe is a page test. Existing equal-reply and focus tests stay in place.

### Round 2 red and green evidence

- Red: `KINGDOWN_TEST_FILE='src/{screen/play,account/sync}.test.ts' KINGDOWN_TEST_NAME='round 2' npm test`: 4 failures, 3 passes, 144 skips in 2 files. Both type checks pass. Both startup cases, the FEN board case, and the FEN reload case fail.
- Browser red, after only the recovery-time fix: New game passes the source-time reload checks at all 3 sizes, then fails because the FEN recovery button is hidden. Evidence: `save-recovery-p0vjmR/new-game.log` under the browser output root.
- Green: `KINGDOWN_TEST_FILE='src/{screen/play,account/sync}.test.ts' KINGDOWN_TEST_NAME='round 2|recovery confirmation' npm test`: 10 passes, 142 skips in 2 files. Both type checks and all 67 art checks pass.
- `git fetch origin` finds the base at `b07d7f74`. `git merge origin/staging/first-game` reports that the branch is up to date. No merge commit is needed.

### Round 2 final checks

- Required focused command: 173 passes in 3 files. Both type checks and all 67 art checks pass.
- `npm run test:docs`: 180 passes in 15 files.
- `npm run check:browser new-game visual-design web-game`: build and all 3 checks pass. Times: 35.9, 33.6, and 89.6 seconds. New game reports 27 case groups; visual design reports 14. Recovery checks include source time after reload at 3 screen sizes, both choices on FEN reload, source retention, and the existing focus cases.
- Web game uses a separate localhost database made with the repo helper. The database is removed after the check. No live sign-in or external site is used.
- `git diff --check` passes. The tests and browser checks run one command at a time. The quiet lock is absent before both browser commands. The repo test and browser locks delay the runs; no lock is bypassed.

The round 2 repair changes only the page, startup selection, tests, browser check, and this ticket. The equal-upload reply and focus code stay unchanged. No game rule, server, migration, or dependency changes. No full suite or live-account test runs for this repair. No push or deploy runs.

Round 2 logs: `recovery3-*.log` in the task output folder. Browser evidence: `/var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-check-runs/save-recovery-9ivxwk/`.


## Root repair plan

The owner requests two invariants. I1: the game and its time share one stored record and one write. Only a player change gets a new local time. A missing time is unknown and cannot beat a cloud game, except the one-time upgrade of an old save. I2: recovery owns all URL game fields. Reload keeps both choices until the player selects one.

1. Move all round 3 probes into the page tests. Keep the round 2 probes and controls. Run them before the fix.
2. Store the time in every game write. Remove time inference from sync. Keep the time through startup, normalization, settings, recovery, and failed writes. Keep the equal-reply and focus behavior.
3. Use one function to end URL game overrides on recovery and account load. Check both choices on reload.
4. Test 11 write paths on 3 page forms: 33 cells. Check cloud order and the recovery choice in each cell. Add the browser probes to the New game check.
5. Fetch and merge the requested base. Run the three-file tests, docs, and three browser checks in order. Check the quiet lock before browsers. Commit without a push.

### Write-path inventory

- `screen/play.ts`: move and turn completion, undo, resign, New game/rematch, startup, settings, lesson return and retry, and recovery acceptance all call `save()` then `writeSave()`.
- `screen/save.ts`: `writeSave()` writes `kingdown.save` once. It writes the game and `gameAt` together. It does not read the sync record. Missing time in an old save stays unknown, except for the one-time upgrade below.
- `account/sync.ts`: `writeLocal()` writes cloud settings and games, including partial downloads and equal upload replies. A game write includes the cloud time; a settings write keeps the game time. `stamp()` reads game time from that record. `changed()` no longer sets it. `take()` gives the cloud time to `writeLocal()`. Pull, flush, late account load, and upload replies reach these paths.
- `account/local.ts`: account selection archives and restores the whole raw save; interrupted selection replays the stored copy. Sign-out keeps the copy. A second tab uses the same keys and owner gate.
- `account/account.ts`: startup, page hide, network return, focus, storage events, and sign-in select, stamp, pull, or flush. They do not write game data directly.

### URL-field inventory

- Game fields: `fen`, `army`, `moves`, `rules`, `kings`, `design`, `players`. They set the position, moves, rules, custom piece, or seats. Recovery must clear them in the live parameters and browser URL.
- `think` sets the search limit; `labels` sets a display choice. Neither overrides saved game data. `title`, `look`, account fields, unrelated fields, and the hash do not set game data and stay.

Verification requires each review failure to turn green, all 33 matrix cells to pass, and the requested commands to pass one at a time. No rule, server, migration, dependency, focus, or equal-reply behavior change is planned.


### Root repair evidence

- Round 3 red: 5 failures, 5 passes, 105 skips in the page tests. Both source-time faults and all 3 URL faults fail before the fix.
- Matrix red: all 33 cells fail before the fix. Matrix green: all 33 pass. Each cell checks both choices before acceptance, source retention, unchanged acceptance time, and the newer cloud game after reload and sync. The failure cells check that the injected write error occurs.
- Additional red: 6 failures for unknown or invalid times and a second-tab write between the upload's time and data reads. The upload now uses one captured record. Unknown time cannot win against cloud time 0.
- The 13 round 2 unit probes remain in `play.test.ts` and `sync.test.ts`. All 10 round 3 unit probes are now in `play.test.ts`. Both rounds' browser probes are in `verify-new-game.mjs`, including Back/Forward, hash retention, rules after acceptance, and a shared-link control.
- The first complete green run passes 227 tests in the required 3 files, both type checks, and 67 art checks. This includes the 33 matrix cells and all review probes. Added storage checks cover the one game-and-time write and a failed write.
- The repair also stops account selection from giving an empty placeholder a player time. A failed player write retains its first time on retry. An unreadable future cloud copy supplies a bound to the next player write; sync no longer makes a second game-time write.
- `git fetch origin` confirms the requested base at `686dfd23`. The merge has no conflicts. Final checks follow the merge.


### Root repair final checks

- Merge commit: `4d6bc3ca`, with `origin/staging/first-game` at `686dfd23`.
- Required focused command after the merge: 230 passes in 3 files. Both type checks and all 67 art checks pass. All 10 round 3 probes, all retained round 2 probes, and all 33 matrix cells pass.
- `npm run test:docs`: 180 passes in 15 files. The final ticket check also passes.
- `npm run check:browser new-game visual-design web-game`: build and all 3 checks pass. Times: 38.7, 22.9, and 69.5 seconds. New game reports 29 case groups; visual design reports 14.
- Recovery checks cover 3 screen sizes and the round 2 and round 3 browser probes. Focus and equal-upload reply tests still pass.
- The quiet lock is absent before the browser command. All commands run one at a time. The repo locks remain in use. Web game uses a separate localhost database, which is removed after the check.
- `git diff --check` passes. The fix changes the page, startup recovery gate, local storage time reader, sync, tests, browser checks, and this ticket. No game rule, server, migration, or dependency changes.
- No full suite, live account, physical second device, or screen reader test runs for this repair. No push, deploy, or sign-in runs. The commit hook runs without changes or input overrides.

Logs: `recovery4-*.log` in the task output folder. Browser evidence: `/var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-check-runs/save-recovery-2PkPof/`.


The fresh-tab browser probe finds that Home can cover the pending offer after reload. Red: the New game browser check fails with `Home cannot cover a pending recovery`. Startup now gives a partial save priority over Home and the title. The offer closes either screen if a partial cloud game arrives later. The browser probe checks both zero and two legal actions without the title-seen flag. Green: both fresh-tab cases pass. The final 230 tests, 180 doc tests, and all 3 browser checks pass after this change.


## CI repair and old-save upgrade

- CI failure on `31b72b0e`: `tools/web-online-check.test.ts` and `check:browser web-online` fail. `stamp()` writes the sync record only when settings or lessons change. When only the saved game changes, the record keeps the older game, and the web-online check waits for the new one. Fix `16482aa9`: `stamp()` also writes the record when its game or recovery value changes.
- Review finding P3: a save from the live build has no `gameAt`; only the old `kingdown.sync` record holds its time. The time is unknown (0), so an older cloud game replaces unsent local moves with no choice.
- Fix: `upgradeGameTime()` in `account/local.ts` runs once per tab, in the first `localAccess()` call. This is before the page or the account sync reads the game time. It runs only when `canWriteLocal()` is true. When the save has no `gameAt` and no `recovery`, and the record's `saved_game.json` equals the save's game (the same `canon` and `pick` as `stamp()`), it writes the record's `at` into the save as `gameAt` in one write. The record must have no `recovery` value, and `at` must be a finite number above 0. Otherwise the time stays unknown. A record time of 0 already means unknown, so it causes no write. `canon`, `pick` and `GAME` move from `account/sync.ts` to `account/local.ts`, so both use one copy.
- Red: the ported review probe A4 (`play.test.ts`, "keeps unsent moves against an older cloud game when the old record matches") fails before the fix: the local game becomes `d2-d4` at 600. Green: it passes after the fix; the save keeps `e2-e4 e7-e5` at 900 and the cloud gets it. `sync.test.ts` adds cases for another game, no record, a recovery value, time 0, four invalid times, a tab that may not write, and a second load. The page test with a future record of the same game now uses a record of another game, because the same game now takes the record time. With the write gate removed, the gate case fails.
- Checks, one at a time: the four-file command (`web-online-check`, `play`, `save`, `sync` tests) passes 282 tests, both type checks and 67 art checks. `npm run test:docs` passes 180 tests in 15 files. `npm run check:browser web-online new-game` passes both checks (98.6 s and 38.5 s) with a new localhost database from `make-test-db.mjs` and `plugin:db:init-test`; the database is dropped after the check. The quiet lock is absent before each run. No game rule, server, migration or dependency changes. No push.

## Round 4 review faults

The fourth review of `31b72b0e` found four faults. Each fix keeps the one time store, `gameAt` in `kingdown.save`.

- P1, a computer reply replaces a newer cloud game. Accepting a recovery, or a reply after start-up, gave the game the current time and removed the recovery protection with no player action. Fix: `save()` in `screen/play.ts` takes a `computer` flag from `commit()`. A computer write keeps the loaded time and the recovery value until a player change on this page sets the time (`playerTime`). After that change, normal timing applies. `account/sync.ts` needs no change, because it reads the time from the save.
- P2, a chosen game link gets the replaced game's time. Fix: `restore()` compares an opened link with the saved game, so the first write of a different link gets a new time in the same game write.
- P2, New game and the Guide keep the `?rules=` preset after recovery. Fix: the page owns the preset and gives it through `play.preset()`. `main.ts` gives this getter to `connectGuide` and `newGameDialog`, so `endUrlGame()` clears the preset for all of them.
- P2, Share loses a recovered game's rules. Fix: `rulesName()` in `screen/links.ts` finds the preset of the live game's rules. Share puts that name in the link. The `?rules=` URL field is not used. `main.ts` reads its presets from the same `RULE_PRESETS` list.

Red: on the old source, the focused `play.test.ts` run has 36 failures. These are the 3 ported R4 unit probes and the 33 new computer-seat matrix cells (`gameAt` 1000000, expected 500). The 33 human-seat cells and the 2 lesson-return controls pass. On the old source, `check:browser new-game` fails three times, one fix at a time. First, a chosen link keeps time 500. With the link fix, New game shows `Freeze (2 per game)` for a game with 1 use. With the preset fix, the shared link has no `rules`. Green: all of them pass with the full fix.

Tests: `play.test.ts` has the 3 R4 probes, 2 lesson-return controls, and the matrix with a computer White (11 paths × 3 URLs × 2 seats = 66 cells). `links.test.ts` checks the rule name of 2017, 2021 and current games. `verify-new-game.mjs` has the 3 browser probes.

Commit: `efd3a728`. Checks, one at a time: the five-file command (`web-online-check`, `play`, `save`, `sync`, `links`) passes 338 tests, both type checks and 67 art checks. `npm run test:docs` passes 180 tests in 15 files. `npm run check:browser new-game web-game web-online visual-design` passes all 4 checks. They use a new localhost test database, which is dropped after the run. The quiet lock is absent before each run. No game rule, server, migration or dependency change. No UI text or control count changes. No push.

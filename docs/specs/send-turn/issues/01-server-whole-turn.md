# Server: whole-turn input for kingdown_move

Status: done

Lane: w7-server. Branch: `claude/w7-server`. Base: `d748b1b6`.

Scope: ticket 12-submit-turn, W7 design sections 4, 7 and 8, ticket 01.
The owner approves this build on 2026-10-15. The board UI stays outside this ticket.

## Plan and checks

1. Add tests for `lan` or `actions`, the tool description and the existing hints.
   Check that the new server test fails on the base.
2. Add a database test for Haste and its second move in one call.
   Check one revision and one command row. Check that it fails on the base.
3. Add protocol checks for retries and fixture rollback after a bad action,
   a change of mover or a game end. Use the supplied `probe2.ts` cases.
   Check that each new case fails on the base.
4. Add the optional `actions` field and require exactly one input form.
   Save the fixture engine before the list. Restore it on refusal.
5. Run `npx tsc --noEmit`, `npm test` with the local test database, and the
   protocol check. Run `plugin-ui` and `plugin-ui-http` on the M1 with its lock.
   Keep all time limits. Review the diff and commit on this branch.

## Limits

- Keep the tool hints table, service, store, database schema and receipts.
- Keep the old `lan` input. Do not add the ticket 06 unfinished-turn check.
- No taste choice is required for this server ticket.

## Results

- Base checks use the unchanged source at `d748b1b6` with the new tests.
  The server test and database test fail because `actions` is not accepted.
  The protocol check fails because a bad second action changes the FEN.
  Separate probes fail for all three cases: a bad second action, a change of
  mover, and an action after mate. These reproduce the supplied probe notes.
- The source change adds `actions` and the exact-one check. The description
  names the whole turn and its retry rule. The hints table stays unchanged.
- The fixture saves the engine before the list. It checks the game state and
  mover before each action. It closes the changed engine and loads the save
  on refusal. No command receipt or history entry remains after refusal.
- `npx tsc --noEmit` passes. The focused `npm test` passes 33 tests in 2 files
  and all 50 art checks. The local database tests are active.
- `npm run plugin:check:protocol` passes. It checks a two-action Haste turn,
  retry, changed input with the same ID, and rollback for all three cases.
- The first full suite has 2,556 passes, 8 skips and 4 time-limit failures:
  `power-fixes.test.ts`, `judge.test.ts`, `search.test.ts` and
  `plugin-board.test.ts`. The full rerun with `VITEST_MAX_WORKERS=2` passes
  165 files and 2,560 tests; 8 tests skip. All 50 art checks pass. The run
  takes 421.40 seconds after the lock wait. The same test limits apply.
  Both full runs use the supplied local test database.
- The M1 `plugin-ui` check passes in 239.8 seconds at source commit
  `830c3bbe`. Its first run passes the journeys, but the checkout guard
  refuses a launch file added during the check. Check procedure: prepare
  launch files before a browser check; keep them fixed until it ends.
- The M1 identity matches the project record. Its test database ports have
  no listener at the first probe. The HTTP check uses a loopback SSH tunnel
  on port 55439 to the supplied local test database. Port 55432 is no longer
  free when the first tunnel starts, so that start fails. The retry uses the
  M1 check lock. The database suites use separate copies, so the browser
  check does not need the Mac test lock.
- The first HTTP check fails in 160.6 seconds at `plugin-ui-check.mjs:902`.
  After the join screen remounts, `#join-confirm` stays hidden for its
  existing 30-second limit. The profile, setup and seat stages pass.
  The join handler and test agree that this step requests a preview.
  No UI file changes. The second HTTP check has the same fault in 168.9
  seconds. A check of `d748b1b6` on the same M1 has the same fault at the
  same line in 174.8 seconds. The base comparison uses the same database,
  tunnel and check limits. The check restores `830c3bbe` when it ends.
  This existing join fault prevents a green HTTP check in both versions.
- The diff review finds no extra source path to change. The server meets
  each build item. No taste choice is required. No server part remains.
  The HTTP check stays red because of the join fault in the base. The board
  UI and the ticket 06 turn-end check stay outside this ticket.

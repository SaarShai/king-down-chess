# Server: whole-turn input for kingdown_move

Status: in-progress

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
- The full suite and M1 browser checks are pending. The M1 identity matches
  the project record. Its test database ports have no listener. The HTTP
  check uses a loopback SSH tunnel to the supplied local test database.
- The diff review finds no extra source path to change. No taste choice is
  required. All requested parts are built; final checks are pending.

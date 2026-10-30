# 01 · Count only a legal en passant capture in the position key

Type: task
Status: resolved

## Scope

Fix audit finding 4 on release 3, base `f8fcec0a`.
A pinned pawn cannot capture en passant. Its square still changes the key.
The third occurrence of the position does not give a draw.

## Plan

1. Add a test with the audit FEN. Run it on the old code and record the failure.
2. Use one legal-capture check for full and incremental keys.
3. Run the affected tests, the full suite, and the doc checks with the shared lock.
4. Review the diff. Commit, push, and open a pull request into main.

## Acceptance

- From `kn2r3/8/8/3pP3/8/8/8/4K1N1 w - d6 0 2`, two cycles of
  `Ng1-f3 Nb8-c6 Nf3-g1 Nc6-b8` give `drawRepetition`.
- An illegal en passant capture does not change the position key.
- A legal en passant capture changes the position key.
- Full and incremental keys agree before and after a move and its undo.
- Required tests pass. No deploy, sign-in, remote database, or animation-bank change.

## Evidence

### Cause and fix

`epAfter` records a square when an enemy pawn stands beside the pawn that moves.
Both key paths count that stored square without a legal-capture check.
The initial audit position thus has a different key from its later occurrences.

`epForKey` uses the engine's legal capture list. Both key paths use this check.
The search checks the new board, turn, and marks after each move.
It saves the counted square for undo. The stored move right stays intact.
The rule document now states the same key rule.

### Before and after

- Before: `KINGDOWN_TEST_FILE=src/rules/classic-chess.test.ts KINGDOWN_TEST_NAME='audit position|omits an illegal en passant' npm test`
  exits 1. Both selected tests fail on the old code. The game stays `playing`
  after eight moves. Its key is `2713557494727229`, instead of `2996993321458362`
  for the same position without the unusable right. The resumed run repeats both failures. Log: `/private/tmp/fix-ep-key2-red.log`.
- After: `KINGDOWN_TEST_FILE='{src/rules/classic-chess.test.ts,src/rules/position-key.test.ts,src/game.test.ts}' npm test`
  exits 0. All 70 cases pass. Both type checks and 67 drawing checks pass.
  Log: `/private/tmp/fix-ep-key-affected.log`.
- The added cases check the audit draw, keys after a double step and undo,
  a pin along a rank, Black to move, an unrelated check, two adjacent pawns
  with one legal capture, a checking pawn, and a frozen pawn.

### Full suite

- `npm test` exits 0 with the shared lock: 270 test files pass and 17 skip.
  There are 5,377 passing tests and 342 skipped tests. Both type checks pass.
  All 67 drawing checks pass. Log: `/private/tmp/fix-ep-key2-full.log`.
- The skipped tests include the opt-in database cases. No database test setup
  or browser check runs for this rules-only fix.

### Doc checks

- `bash tools/test-lock.sh npm run test:docs` exits 0 after it takes the shared
  lock. All 183 tests pass in 16 files.
  Log: `/private/tmp/fix-ep-key2-docs.log`.

### Review

The resumed run checks the diff, the legal-move helper, and the search apply
and undo paths. The shared helper is the smallest complete fix.
The engine archive pair remains in the change for the new enforcement key.
The hooks stay unchanged. No gate input is set. No deploy runs.
A separate review remains required before merge.

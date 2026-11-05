# Variant move counts

Status: resolved

## Scope

The owner asks for fixed move counts and a search-path check in one test file.
Shipped code stays unchanged. This branch has no push or pull request.

## Plan

1. Find the piece rules, powers, cards, and game options. Add fixed positions with legal-move checks.
2. Freeze the counts from this branch. Compare the engine and search paths. Keep each known fault in a narrow expected-failure test.
3. Run this file twice and run the type check. Break one piece rule, show a table failure, then restore it.
4. Check the diff, commit the test and this ticket, and write the report at the owner's path.

## Checks

- Run only `KINGDOWN_TEST_FILE='src/rules/perft-variants.test.ts' npm test`.
- The file takes less than 20 seconds. Two runs give the same counts.
- Run `npm run typecheck`, which includes test files through `tsconfig.json`.
- A local piece-rule change makes a fixed count fail. Restore the shipped file before the commit.

## Result

- The test file has 71 fixed positions. Each count covers depths 1 and 2; most also cover depth 3.
- The default rows do not call `setRules`. The two fixed armies hold every kind in `POOL`.
- Legal-move checks show the named piece action, power, or card. The table covers all 12 powers and all 21 released cards.
- The path check compares full move objects, keys after apply and undo, and legal moves after apply. It walks two plies from each table position except the known double-turn fault.
- Two narrow `it.fails` checks record that fault: search changes the mover too soon and permits a check on Black's first move. The turn fault needs only two kings. No shipped code changes.
- `KINGDOWN_PERFT_PRINT=1` prints all counts to stdout. The runner hides console logs for passed tests.

## Evidence

- Two final runs use `KINGDOWN_PERFT_PRINT=1 KINGDOWN_TEST_FILE='src/rules/perft-variants.test.ts' npm test`.
- Each run passes 142 checks, with 2 expected failures. The full file run takes 1.30 s and 1.29 s. All 71 printed rows match.
- The stable printed table has SHA-256 `b3e7579dd246771075b754fb1436e9f2486f5b4e2fc28f397fa2590cb51a22c0` (JSON name/count pairs, with no spaces).
- `npm run typecheck` passes. `git diff --check` passes.
- A local one-line change stops Beast chains. The `beast chain` table row fails: `[12, 56, 662]` becomes `[11, 53, 595]`. No other row fails. The engine is then restored byte for byte.
- The full suite and browser checks do not run. The requested `npm test` command also runs its fixed 70 art checks; all pass.

## Scope limits

The counts freeze this engine. They do not prove the rules correct. Lab pieces and other lab toggles stay out of scope, except the named double-turn fault and the requested Morph card. Draw status is outside `perft`. The probes expose position keys and legal moves, not the full scratch position or its clocks. No new export is needed.

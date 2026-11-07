# Search under the double first turn

Status: resolved

## Scope

The owner asks for a search fix under `secondPlayerDoubleFirstTurn`.
Change search code and its tests. Keep engine code, engine archives, and fixed move counts unchanged.

## Plan

1. Compare the engine turn, mark, move-number, and legal-move changes with search make and undo.
2. Record fixed-depth moves and scores under default rules before the fix.
3. Fix the search turn test at each move path. Change both expected failures to normal tests. Add table checks under the rule and a search check.
4. Run the affected test files and the type check. Compare engine bytes and its archive pair before and after the fix.
5. Check the diff, commit with the hooks unchanged, and write the report at the owner's path. Do not push.

## Checks

- All variant table checks pass with no expected failure. Fixed counts stay unchanged.
- Existing search tests pass. Fixed default moves and scores match the values before the fix.
- The worker boundary test passes. The engine identity and bytes stay unchanged. No file is added to `engines/`.
- `npm run typecheck` and `git diff --check` pass.
- Run tests through `KINGDOWN_TEST_FILE='<affected files>' npm test`. Do not run the full suite.

## Result

- `src/ai/search.ts` has one test for the first move of the double turn. The move state, main search, capture search, and legal-list probe use the same turn test.
- The turn stays with the mover at absolute ply 1. The hash, move number, marks, and undo keep the same state as the engine. The legal filter also rejects a check on that first move.
- Both expected failures become normal tests. All 72 table positions also run through the path check with the rule on. Fixed counts stay unchanged.
- Four search cases check mate at the root, mate below the root, the capture horizon, and the score sign across two captures.
- A fixed-depth test records five default moves and scores before the fix. All five still match after the fix.

## Root cause

The engine keeps the same side at ply 1 and delays turn-end state changes (`src/rules/engine.ts:1061`); it also bars a first move that gives check (`src/rules/engine.ts:2012`).
The old search calls `holdsTurn(m)` without the rule in its move and score paths (now `src/ai/search.ts:378`, `src/ai/search.ts:771`, and `src/ai/search.ts:998`).
The old legal filter checks only the mover's king (now `src/ai/search.ts:558`), so it permits `Rh2-a2`.

## Evidence

- Before the fix: the two former expected failures and both new mate cases fail. The fixed default case passes. The command selects only these five cases with `KINGDOWN_TEST_NAME='double first turn:|double first turn >|keeps fixed moves'`.
- `KINGDOWN_TEST_FILE='src/rules/perft-variants.test.ts' npm test`: 219 pass, no expected failure, no skipped case. All fixed counts pass.
- `KINGDOWN_TEST_FILE='{src/ai/{search,search-repetition,search-ownership,legality,terminal,guard-probes}.test.ts,tools/plugin-worker-boundary.test.ts}' npm test`: 53 pass in seven files. No skipped case. The run includes all four new double-turn search cases and the fixed default values.
- `KINGDOWN_TEST_FILE='src/ai/symmetry.test.ts' npm test`: 28 pass. No skipped case.
- Each final test command also runs the fixed 70 art checks; all pass.
- `npm run typecheck` and `git diff --check`: pass.
- `buildWorker()` and `checkEnginePair()` before and after: the same 97,337 bytes, the same valid archive pair, and the same archive file list. Engine: `sha256:e58d7d379d0dad5ddde1c4e34e984923e856e4b3f702e7beeaee22db62d7a9b4`.
- The protected source paths have no diff. The only change under `src/rules/` is the test file the owner names.

## Review and limits

A local source check finds no need for a broader change. The rule test stays in search and uses the existing frame count; undo needs no new state.
No independent review runs. The full suite and browser checks do not run. CI covers the full suite.
The fixed default comparison covers five positions at depth 3. It does not prove equal choices for all positions or time limits.
No dependency, frozen count, engine source, or archive changes. No archive command, push, pull request, deploy, or service write runs.

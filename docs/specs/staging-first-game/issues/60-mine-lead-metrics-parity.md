# Put the mine's copy of leadMetrics back in line with the analyser

Status: done. The full `npm test` has 12 failures that are not from this change (see Result). Parent: staging first game. Follows ticket 53.

## What

`tools/mine.ts` keeps its own copy of `leadMetrics`. The copy lacked `decisionCost` and `decisionAsymmetry`, which `src/sim/analyze.ts` returns. The copy now matches the analyser, and a parity test keeps it that way.

## Why

The header of `tools/mine.ts` calls the copy a line-for-line port. A read-only scan found two missing fields. Mined reports could then disagree with the analyser, and the balance data sets the game rules.

Verified first: the old `leadMetrics` in `tools/mine.ts` returned five fields (`killerMove`, `leadChange`, `uncertaintyLate`, `permanence`, `drama`). The analyser returns seven. The mine did not read `m.gap` and did not import `DECISION_CP`.

The mine still does not import the analyser. Its header gives the reason: `src/` can be mid-edit while a mine runs, and an import then breaks the mine. That reason stays. The copy stays a copy, and a test now pins it.

## Scope

- `tools/mine.ts`: add `decisionCost` and `decisionAsymmetry` (with `DECISION_CP` from `src/sim/weights.ts`); type `rules` as `Partial<Rules>`; export `leadMetrics`; start `main()` only when the file runs as a script (the same guard as `src/sim/analyze.ts`), so a test can import it.
- `tools/mine.test.ts` (new): the parity test.
- No sim, tune or mine run. Unit tests on a small fixed record only.

Not changed: `trajectory` in the mine. It also differs from the analyser (no `uncertainty`, `drama` or `stability`), but the mine does not use those fields. It is outside this ticket.

## Acceptance

- A parity test runs both `leadMetrics` copies on the same fixed records, with and without `secondPlayerDoubleFirstTurn`, and asserts equal results for every field.
- The test fails when a field is removed from either copy.
- No sim run.

## Result

Parity test: six fixed records (three results under default rules, two under `secondPlayerDoubleFirstTurn`, one short record), plus an explicit-`rules` case and a fixture guard. Each record mixes plies with no eval (opening) and plies with `cp` and `gap`. The guard asserts that decision cost is non-zero for both sides and that the rule changes both `decisionCost` and `killerMove`. The test compares the key sets and then the full objects.

Mutation proof (temporary local edit, not committed): I deleted the `decisionAsymmetry` line from the final return in `tools/mine.ts`. `KINGDOWN_TEST_FILE=tools/mine.test.ts npm test` then reported `Tests  6 failed | 2 passed (8)`. I restored the file; the committed version passes.

Checks:

- `KINGDOWN_TEST_FILE=tools/mine.test.ts npm test`: `Test Files  1 passed (1)`, `Tests  8 passed (8)`; its `npm run typecheck` step passed.
- `KINGDOWN_TEST_FILE=src/sim/sim.test.ts npm test`: `Test Files  1 passed (1)`, `Tests  33 passed (33)`.
- `npm run typecheck`: exit 0.
- `npm test` (full): exit 1. `Test Files  5 failed | 236 passed | 14 skipped (255)`, `Tests  12 failed | 4428 passed | 217 skipped (4657)`. All 12 failures are browser-wait timeouts (5000 ms) in `tools/plugin-app.test.ts` (3), `plugin-lobby.test.ts` (2), `plugin-profile.test.ts` (1), `plugin-real-host.test.ts` (1) and `plugin-screen-lifecycle.test.ts` (5). None imports `tools/mine.ts`. The mine parity test passes in the full run.
- Same failures at the base. Run alone at the changed commit, then at `73387e66` (old `tools/mine.ts`, no new test), each with `KINGDOWN_TEST_FILE=tools/<file> npm test`: `plugin-app` `3 failed | 133 passed (136)` both times; `plugin-lobby` `2 failed | 32 passed (34)` both times; `plugin-profile` `1 failed | 25 passed (26)` both times; `plugin-screen-lifecycle` `5 failed | 9 passed (14)` both times. `plugin-real-host` passed alone (`9 passed (9)`), so its one failure is a timing flake under full-suite load.
- `npm run test:docs` (the ticket is a new doc): exit 0. `Test Files  13 passed (13)`, `Tests  161 passed (161)`.

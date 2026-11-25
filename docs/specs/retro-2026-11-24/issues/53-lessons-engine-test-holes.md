# Small engine and simulation test holes from the lessons

Status: ready-for-agent
Source: the change rehearsals and guard checks of 2026-11-25 ([ticket 10](10-change-rehearsals.md), [ticket 11](11-guards-that-cannot-fail.md), [ticket 12](12-lessons-and-checks.md))

## Problem
Four lessons have only a partial check:
1. A two-sided mark power keeps one slot per side. Position.marks is a per-side tuple (src/rules/engine.ts:173), but src/rules/power-fixes.test.ts:421 and src/rules/cards.test.ts:75 set the Black slot only. No test makes both sides use each two-sided power in turn.
2. Start sim workers through tsWorker(). src/sim/run.ts:200 and src/sim/tournament.ts:386 reject on exit, but no lint forbids `new Worker(<file>.ts)` outside src/sim/ts-worker.ts:7 (src/game.ts:157 is the browser worker and is correct).
3. When a new mode joins a function, the old mode stays bit-identical. src/sim/gen.ts:296 gates the residual target on `bases`; no test pins the wdl target unclipped.
4. Size a property test to about 1 s alone. No check holds the size; vite.config.ts sets no testTimeout, so the vitest default of 5 s is the only limit.

## Change
1. A behaviour test in a new file in src/ai/ or tools/ (src/rules/** is protected): for each power in the real power list that marks, let White use it, then Black, and expect `marks[0]` and `marks[1]` both set and the position key different from the one-side cases. Failure text names the power.
2. A source-text test in a new tools/ file: no file under src/ and tools/ except src/sim/ts-worker.ts and src/game.ts calls `new Worker(` with a .ts path. Failure text: 'start the worker through tsWorker() in src/sim/ts-worker.ts'.
3. A case in a new file beside src/sim/gen.ts: build a short corpus with no bases and expect the wdl target values to equal the unclipped scores.
4. No guard now; record it as a review rule.

## Test that fails first
1. Fake: in a scratch copy, write both sides' marks into slot 0. 2. Fake: an untracked tools/fake-worker.ts with `new Worker('x.ts')`. 3. Fake: in a scratch copy, remove the `if (bases)` gate at src/sim/gen.ts:296.

## Known limits
Item 1 needs a fixture for each two-sided power. Item 2 reads source text. Item 4 stays a review rule.

## Work record
Not started.

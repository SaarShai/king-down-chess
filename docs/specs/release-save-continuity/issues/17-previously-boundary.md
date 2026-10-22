# 17 — Keep previous-turn and Beginner narration outside enforcement

Status: resolved

## Scope

U08 requires cosmetic changes to keep the same mechanics identity. `GameRules.previouslyTurn` and `GameRules.teachNote` import narration into the worker. Combine these two small cuts before the next explicit archive publication and recovery cycle. Neither function enforces moves.

Previous-turn narration requires an explicit narrow name provider with `nameOf`, `aName` and `theName`. The sole product caller in `src/ui/previously.ts` supplies its game's context. Keep method calls on the provider so owned lookup keeps its receiver. Remove only its `GameRules` import/method. Remove the formatter's ambient-helper classification and private-owner exemption so the import guard checks it. No ambient default, wrapper or public scoped callback is added.

Beginner `teachNote` requires explicit `Pick<Rules, 'archerShots' | 'ogreMode' | 'paladinKamikaze'>`. The sole product caller in `src/plugin/screens/board.ts` supplies `gameRules.rules`. Remove its `GameRules` method and ambient-helper classification. The shared `paladinLeaves` function takes an explicit mode; its guide caller supplies the same existing rule value. Keep the Archer text table and guide text in their current file. No module, framework, catalog or behavior hook is added.

Keep exact previous-turn summaries, details, grouping, power names, custom design names and replay behavior. Keep all eight exact Beginner wording cases. Add three owned/ambient conflict cases for Archer shots, Ogre mode and Paladin departure; the Paladin case also checks the existing owned guide wording. No other help, Workshop admission, rule, archive or replay timing changes are in scope.

## Plan and checks

1. Extend the existing real worker-build test with independent Growth narration and Maester Beginner wording mutations. Leave product code unchanged so `npm test` can prove both exact-byte failures after a CPU grant. Keep existing catalog, ceremony, evaluator and mechanics controls.
2. Keep the previous-turn product/test patch at `/tmp/kingdown-u08-previously-candidate.patch` unapplied. Keep the additional typed read tests at `/tmp/kingdown-u08-teach-note-tests.patch` until the explicit three-argument implementation is reviewed; do not introduce a pre-fix typecheck failure. After true build red and review, apply the previous-turn patch and the narrow teaching signature/callers/test changes.
3. Run full previous-turn, read, ownership guard and real-build boundary tests through `npm test`, including typecheck and 54 art checks. Preserve all existing expected text. Inspect a real-builder negative control rather than masking or omitting hashed inputs.
4. Get an independent read, record exact selected evidence, then use normal commit hooks. The parent owns archive publication, recovery and release acceptance.

## Owned files

`src/previously.ts`, `src/ui/previously.ts`, `src/game-rules.ts`, `src/previously.test.ts`, `src/read.ts`, `src/read.test.ts`, the teaching call in `src/plugin/screens/board.ts`, `tools/game-boundary.test.ts`, `tools/plugin-worker-boundary.test.ts`, and this ticket. Remove both obsolete `GameRules` methods; retain every other method.

## Release boundary

No archive is published here. All published pairs remain byte-for-byte unchanged. Removing the retained narration can change the current enforcement bytes once; explicit publication and recovery must use the exact accepted worker. This does not claim all cosmetic coupling is removed. U06 still uses its single content sources and contextual help for the stored configuration.

## Evidence

- True unchanged-product red: `KINGDOWN_TEST_LOCK_WAIT=180 KINGDOWN_TEST_FILE=tools/plugin-worker-boundary.test.ts npm test` passes full typecheck, then the one real-builder test reports exactly two wording failures (2.580 s test time). The baseline engine is `febb9239470eea930cce5e1b588838bafd2c6687f0419d1bbf1072c975603ae2`. Growth narration alone produces `e66c274cac0b3778031dab646a286eb899731cc71d7f766cf9b21b332e601c40`; Maester teaching alone produces `0c90c7b3dabe5c8da56fdabdf97ee07dc7fe9107c8ec677579875b4a4c2bc199`. Both change actual emitted bytes. Log: `/tmp/kingdown-u08-narration-red.log` (exit 1).
- The same run reports no other assertion failure. Existing catalog, ceremony and evaluator controls, the mechanical negative control and compiled helper load/apply/reload probe complete. The art stage does not run after the expected failing unit test.
- The parent accepts that true red, then the reviewed combined product change is applied. `KINGDOWN_TEST_FILE='{src/{previously,read}.test.ts,tools/{game-boundary,plugin-worker-boundary}.test.ts}' npm test` passes 4 files / 121 tests, full typecheck and 54 art checks. Both actual wording mutations keep exact worker bytes and identity. The same controls and compiled helper probe remain in the test. Log: `/tmp/kingdown-u08-narration-green.log` (exit 0; 2.74 s Vitest).
- `npm run check:browser link-game` passes against the built local app in 20.4 s. It checks the actual previous-turn caller, one replay, no replay on refresh/reload/Motion Off, long-turn detail layout, move history and guarded link send. Log: `/var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-check-runs/u08-previously-boundary-SS4RNu/link-game.log`.
- Independent final product/test read finds no substantive should-fix: all naming calls keep the provider receiver; teaching reads only the three explicit fields; Paladin guide wording, Beginner gating, once-per-kind behavior and context priority stay unchanged. No product edit follows that review.
- No archive publication or deploy occurs. Current archive and recovery acceptance remain the parent's release work. Normal commit hooks follow.

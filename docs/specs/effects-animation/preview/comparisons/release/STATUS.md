# Material release comparison

Status: Freeze ending approved; Ice Wall ending rejected; Holy Light ending pending

## Owner decisions

The owner approves the proposed Freeze ending and rejects the proposed Ice Wall ending. Keep Current for Ice Wall release. This does not change approval of the existing Ice Wall formation or held state. Holy Light ending remains pending feedback. These decisions do not request game integration.

## Plan

1. Read the production materials and state rules. Use legal engine moves for each loss.
2. Build one board with Current and Proposed views at one shared time.
3. Check all controls, source timing, state loss, repeat seeks, and both screen sizes.
4. Save captures and check logs outside the repo. Leave the local server on.

## Motion thesis

The rule ends first. The material then leaves as residue. Frost retreats in uneven patches and drops grains. Wall plates become thin, move apart, and dissolve. Holy Light gathers and lifts from the knight when its source king leaves range. Keep the approved material and still hold. Keep each figure still.

The shared clock has a 250 ms settled hold, a legal state change, and a short result hold. Current uses the production state controller and drawing code. Its ice release stays at 1,344 ms. Proposed releases in 620 ms. One board draws only the selected view. No hidden view has a clock.

## Acceptance checks

- Use the real board, art, state controller, and engine rules.
- Prove each move is legal and each condition ends in the result.
- Remove the active badge at the state change. Label later material as residue.
- Keep one timestamp, scale, and board position when the view changes.
- Check Replay, Pause, scrub, speed, reduced motion, flip, hidden state, and offscreen stop.
- Check repeat seek pixels. Check desktop and 390 × 844 captures. Check console errors.
- Run focused production tests, doc checks, and the final design detector.
- Change only this folder. Do not commit or deploy.

## Source proof

Current calls `drawBoardEffects` with `StateEffects`. The state code reads `boardStates` from the engine position. `materialProgress` starts ice residue at 0.72. `remaining` removes it after 0.28 × `SIGNAL_DURATION_MS`. That constant is 4,800 ms, so residue lasts 1,344 ms. The same controller removes Holy Light at source loss with no residue.

The fixtures use the production Freeze and Ice Wall card states. Black plays `Ke8-f8` to end each mark. The Holy Light fixture plays `Kh8-g8`, then White plays `Ke2-d1`. The knight on e3 remains on its square and loses its source. Each step comes from `legalMoves` and `makeMove`.

The preview warms the real fixture art before it sets `ready`. Contact shadows build at idle in the scene. This keeps the first ready frame and repeat seeks stable.

## Check results

- The owned browser check passes for all three samples. It checks legal state loss, production timing, badge loss, shared time and scale, repeat canvas pixels, flip, controls, and reduced motion.
- Offscreen playback stops. The scene frame count stays still. A hidden-page signal stops playback.
- Desktop at 1,440 × 900 and phone at 390 × 844 have no side scroll. The board and state line fit each screen. The phone controls use normal page scroll.
- Focused `npm test` passes with `KINGDOWN_TEST_FILE='src/render/effects/{states,board-effects}.test.ts'`: 29 selected tests. The same command passes type checks and 51 art checks. This is not a full test suite pass.
- `npm run test:docs` passes: 166 tests in 13 files.
- The final design scan reports two shared-style warnings. The cream palette is the game theme. The glow belongs to the unused `.wordmark` rule in the linked game stylesheet. The preview has no wordmark element. Keep both as narrow exceptions.
- `npm run check:browser effects-animation` is attempted. The supervisor stops it while it waits for a shared slot. No legacy browser check runs. The owned `verify.mjs` runs directly and passes. Integration must use a registered comparison check; the registry stays unchanged here.
- All captures and logs are outside the repo. Port 5302 stays on. The listener PID is 1243. The launch PID is 1215.
- This is a preview. Freeze ending is approved, Ice Wall ending is rejected and Holy Light ending awaits feedback. Production adoption is outside this task.

## Evidence

External output: `/Users/za/.codex/visualizations/2026/10/23/01a168fe-8505-7842-89a3-dd078bd311a1/comparison-previews/release/`.

Read `verification.json`, `legal-state-proof.json`, `production-timing-proof.json`, `focused-tests.log`, `docs-tests.log`, and `design-detector.json`. The final report is `release.md`. The early sample is recorded in `EARLY_READY.md`.

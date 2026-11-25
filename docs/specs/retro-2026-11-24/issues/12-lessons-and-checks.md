# Lessons about code and the check that holds each one

Status: done on branch change-guards (PR A); waits for the review

Source: the owner's task of 2026-11-25, track 2. Rule 5 of [CHANGES.md](../../../CHANGES.md): a lesson goes into a note only when no check can hold it.

## Method

A scout read the Index of `LESSONS.md` and the topic files `docs/lessons/engine-and-tests.md` and `docs/lessons/browser-checks-and-ui.md`. For each lesson about code (not about the conduct of an agent), it named the check that holds the lesson today, by grep and by reading. It then picked the five lessons with the highest cost of a repeat and no check. A builder built the check where it could, and wrote a ticket for the rest.

This ticket changes no tracker file: `LESSONS.md` and the topic files change only on main.

## Each lesson about code

| Lesson | Source | Check today |
|---|---|---|
| Size a property test to about 1 s alone; sample with a fixed stride; one expect at the end. | docs/lessons/engine-and-tests.md 2026-10-19 | partial: the vitest default limit of 5 s per test (vite.config.ts sets no testTimeout). No check holds the 1 s size. |
| A two-sided mark power keeps one slot per side. | docs/lessons/engine-and-tests.md 2026-10-03 mark slot | type: Position.marks is a per-side tuple (src/rules/engine.ts:173). Partial behaviour: src/rules/power-fixes.test.ts (Ice Wall ward, line 421) and src/rules/cards.test.ts:75 set the Black slot only. No test makes both sides use each two-sided power in turn. |
| Draw the hash halves from independent generators; test the claim about key width. | docs/lessons/engine-and-tests.md 2026-10-03 hash | partial: src/rules/position-key.test.ts 'preserves fixed position keys from the pre-extraction implementation' pins the streams. No test checks the key width (that hi is not a function of lo). |
| After a new move kind, check each helper outside the engine that reads pseudoMoves, m.from, m.to; give power moves their own wording. | docs/lessons/engine-and-tests.md 2026-10-02 helpers | partial: src/move-text.test.ts 'still show during a Haste turn's pending second move' and the hand-written 'card effect text' cases. No key set over PowerTag in src/move-text.ts or src/read.ts (if chains with a general fallback; ticket 03 leaves them out on purpose). |
| After a change to POOL, check which evaluator a random army gets. | docs/lessons/engine-and-tests.md 2026-10-02 pool net | partial: src/ai/nnue/net.test.ts 'falls back to the linear evaluation on a board with a lab piece the net cannot see' tests the Ogre and the catapult by hand. No test iterates POOL. |
| Keep closures out of hot paths under tsx keepNames; measure the search with equal node counts. | docs/lessons/engine-and-tests.md 2026-10-02 closures | none (performance rule; no lint or benchmark gate). |
| Start sim workers through tsWorker(); fail the run when a worker exits with games unplayed. | docs/lessons/engine-and-tests.md 2026-10-02 workers | runtime code: src/sim/run.ts:200 and src/sim/tournament.ts:386 reject on exit; src/sim/sim.test.ts 'plays 2 games at depth 1 on 1 worker and records legal moves' starts a real worker. No lint forbids new Worker(file.ts) outside src/sim/ts-worker.ts. |
| A synchronous child process in a test needs its own timeout below the test limit. | docs/lessons/engine-and-tests.md 2026-10-02 workers | partial: tools/child-timeouts.test.ts 'synchronous child limits' covers a hand-made list of files. 17 test files call execFileSync/spawnSync/execSync with no timeout today (for example tools/engines.test.ts, tools/anim/recolor.test.ts). |
| When a new mode joins a function, the old mode stays bit-identical; gate the new mode on new state. | docs/lessons/engine-and-tests.md 2026-09-14 trainer flag | code gate: src/sim/gen.ts:296 'if (bases)'. Partial: src/ai/nnue/net.test.ts 'fits the gap to the linear evaluation, not the score'. No test pins the wdl target unclipped. |
| Keep historical repel regressions explicit beside the new push default. | docs/lessons/engine-and-tests.md 2026-09-24 bullet 1 | src/rules/rules.test.ts 'push is the default; the explicit repel alternative stays in place'. |
| Search agrees with game endings: checkmate before the fifty-move draw; disabled draw rules. | docs/lessons/engine-and-tests.md 2026-09-24 bullet 2 | src/ai/terminal.test.ts case 'checkmate before the fifty-move draw' and the fiftyMove:false case. |
| Mobile guidance goes in the scrolling panel; assert stable board bounds across a real touch. | docs/lessons/engine-and-tests.md 2026-09-24 bullet 3 | none found in unit tests; browser checks only (not confirmed). |
| Fairy pawn moves break orthodox repetition bounds; search checks full history repetition. | docs/lessons/engine-and-tests.md 2026-09-22 | src/ai/search-repetition.test.ts (CYCLE fen 7k/8/8/8/3p4/2BOK3/8/8). |
| A UI for another host reuses the game tokens, fonts and components. | docs/lessons/browser-checks-and-ui.md 2026-10-11 host look | tools/plugin-ui-style.test.ts 'imports game tokens and components without lesson, account or title lineup rules'. |
| A sample or mockup draws the board through the game code from engine state. | docs/lessons/browser-checks-and-ui.md 2026-10-11 design sample | partial: src/plugin/screens/board.ts imports marksModel and threatsIn (real code). No check on design samples under docs/specs. |
| Cloud Chromium build: link it and run with PLAYABLE_BROWSER=chromium. | docs/lessons/browser-checks-and-ui.md 2026-10-02 cloud Chromium | hook: .claude/hooks/cloud-setup.sh with tools/pw-cloud-link.mjs; tools/lib/checks.mjs env() default. |
| Test positions need material on both sides; time only the animation meant (view.scene.playing). | docs/lessons/browser-checks-and-ui.md 2026-10-02 timing | none. |
| Register the service worker only after the board is drawn. | docs/lessons/browser-checks-and-ui.md 2026-10-02 service worker | none for src/interface/platform.ts:47 order. Offline page only: tools/offline-build.test.ts checks that the offline startup registers on load at '/'. |
| Bound every wait on navigator.serviceWorker.ready. | docs/lessons/browser-checks-and-ui.md 2026-10-02 service worker | product: src/render/scene-load.test.ts 'starts after load even if a worker install never becomes ready'. Tools: none; tools/verify-character-clips.mjs:143 waits with no bound (protected file). |
| Keep the live Game separate from the lesson Game; test lifecycle controls. | docs/lessons/browser-checks-and-ui.md 2026-09-29 | partial: src/screen/play.ts:114 lessonReturn; src/screen/play.test.ts 'control: partial cloud recovery leaves a lesson and saves the recovered match'; browser check lesson-return is byName (not in CI). No unit test changes a player during a lesson. |
| Lessons run under the rules their instructions teach. | docs/lessons/browser-checks-and-ui.md 2026-09-29 | src/lessons.test.ts '%s: a legal move reaches the goal, and a wrong one does not' (iterates LESSONS). |
| After a moved control, grep tool selectors and rerun every tool. | docs/lessons/browser-checks-and-ui.md 2026-09-27 selectors | partial: CI runs every default registry check (npm run check:browser -- --no-gpu in .github/workflows/plugin-checks.yml). The byName entries in tools/lib/registry.mjs are outside it. |
| When a default changes, grep every tool that depends on it and run each one. | docs/lessons/browser-checks-and-ui.md 2026-09-27 qa.mjs | partial: same CI run of default registry checks; tools/qa.mjs and byName checks are outside it. |
| Never wait a fixed time for an animation; wait on its state. | docs/lessons/browser-checks-and-ui.md 2026-09-27 fixed sleep | none: 51 tool files use waitForTimeout; tools/checks.lint.test.ts has no rule for it. |
| Assert the state change itself; take screenshots only after view.ready(). | docs/lessons/browser-checks-and-ui.md 2026-09-27 same trap | none (36 tool files call view.ready(), no lint). |
| Embedded board: new resource URI for changed content; test selection recovery with widget writes dropped; phone check taps the board destination. | docs/lessons/browser-checks-and-ui.md 2026-09-27 same trap, plugin part | not confirmed; plugin board tests (tools/plugin-*.test.ts) not read in this scout. |
| Check the real status rectangle after board interaction; size the grid from real heights. | docs/lessons/browser-checks-and-ui.md 2026-09-26 | partial: tools/lib/checks.mjs insideViewport() exists; no lint requires its use on the status line. |
| A click on the 3D board can hit the piece in front; hover first. | docs/lessons/browser-checks-and-ui.md 2026-09-14 | obsolete: no Raycaster in src (3D clay view removed); tools/qa.mjs still reads #hover. |
| Raycasts hit invisible sprites; a responsive canvas in a grid needs minmax(0, 1fr) and min-width 0. | docs/lessons/browser-checks-and-ui.md 2026-09-22 | obsolete for the raycast part (no Raycaster in src). Grid part: none. |

Notes of the scout: Scout read only; no test run, no file change. Started 09:41, finished about 09:50 (2026-11-25). Holes that are tickets, not top-5 builds: (1) fixed sleeps in browser tools: 51 tool files use waitForTimeout and most are protected (tools/verify-*.mjs, tools/qa.mjs), so a lint fails today; a ratchet test in a new tools/ file can freeze today's counts per file. (2) tools/verify-character-clips.mjs:143 waits on navigator.serviceWorker.ready with no bound; the file is protected (seam-ci). The registry limit bounds it in CI only. (3) The byName checks in tools/lib/registry.mjs (lessons, lesson-return, layout-*, next-menus and others) and tools/qa.mjs are outside the CI run, so a moved control or a changed default can break them unseen. (4) No unit test changes a player during a lesson (lesson over match lesson); src/screen/play.ts is not in the protected lists, so a play.test.ts case is possible later. (5) No test makes both sides use each two-sided mark power in turn; a new test must go in tools/ or src/ai/ because src/rules/** is protected. The two 3D clay picking lessons apply to removed code: no Raycaster in src. Not confirmed in this scout: the plugin board parts of the 'same trap, twice more' lesson.

## lessons

Kind: lessons from docs/lessons/engine-and-tests.md and docs/lessons/browser-checks-and-ui.md. Each code lesson needs a check that fails when a change breaks the lesson.

Branch guard-lessons, worktree worktree guard-lessons, from origin/main 80b855489. Not pushed. No PR.

### Places and their guard today
- Repel regressions beside the push default: src/rules/rules.test.ts 'push is the default; the explicit repel alternative stays in place'.
- Search agrees with game endings: src/ai/terminal.test.ts ('checkmate before the fifty-move draw', fiftyMove:false).
- Fairy pawn repetition: src/ai/search-repetition.test.ts.
- Host UI reuses game tokens: tools/plugin-ui-style.test.ts.
- Lessons run under their own rules: src/lessons.test.ts (iterates LESSONS).
- Cloud Chromium: .claude/hooks/cloud-setup.sh, tools/pw-cloud-link.mjs, tools/lib/checks.mjs env().
- Hash streams pinned: src/rules/position-key.test.ts (fixed keys). Key width: none before this lane.
- Pool and net: src/ai/nnue/net.test.ts tests the Ogre and the catapult by hand. Iteration of the pools: none before this lane.
- Synchronous child timeouts: tools/child-timeouts.test.ts, a hand-made list of files. All other test files: none before this lane.
- Sim workers: src/sim/run.ts:200, src/sim/tournament.ts:386 reject on exit; no lint on new Worker.
- Service worker after the board: none (src/interface/platform.ts:47).
- Power-move wording: partial (src/move-text.test.ts hand-written cases).
- Fixed sleeps and unbounded serviceWorker.ready waits in tools: none.
- byName checks and tools/qa.mjs: outside CI.
- Player change during a lesson: none in unit tests.
- Two-sided marks on both sides: partial (Black slot only).
- wdl target unclipped: partial.
- Property test size, closures in hot paths: none (review rules).
- Method-of-work lessons (render twice, PID waits, byte-identical runs, clean baselines): no code check; AGENTS.md rules.
- 3D picking lessons: obsolete (no Raycaster in src).

### New guards
1. src/ai/nnue/pool-net.test.ts. Kind: behaviour test over the real lists (POOL, POOL_NO_PALADIN, POOL_2BEASTS; every browser pool derives from POOL letters). It loads the residual net as src/ai/worker.ts does and fails when evalBoard equals evaluateBoard on all 96 placements of a pool piece.
   - Fault: 'C' added to POOL in src/rules/setup.ts (reverted).
   - Red: `AssertionError: pool piece C (type 13, in POOL) falls back to the linear evaluation: retrain the net with inputs for it, or add an input block in src/ai/nnue/net.ts and its type in hasNetTypes (src/ai/eval.ts): expected 0 to be greater than 0`
   - Green: 11 tests pass (10 pool letters Q O L R B N A G M S, and the net-loaded case).
   - Time: 10 ms for the file.
   - Commit: 166753de5.
2. tools/hash-width.test.ts. Kind: behaviour test over the real tables. It pairs every exported Z_*_LO table with its Z_*_HI partner (by name, so a new table joins without an edit) and asks for rank 52 over GF(2).
   - Fault: nextHi() returned `next() & 0xfffff` in src/rules/position-key.ts (reverted).
   - Red: `AssertionError: position key carries 32 bits, not 52: draw the hi half from its own generator (nextHi in src/rules/position-key.ts), not from the lo stream: expected 32 to be 52`
   - Green: 2 tests pass.
   - Time: 13 ms for the file.
   - Commit: 4f44ee647.
3. tools/child-timeouts-ratchet.test.ts. Kind: source-text test with a ratchet. It reads every *.test.ts under src/, tools/ and .claude/hooks/ (readdirSync, no child process) and counts execFileSync, spawnSync and execSync calls with no timeout. 22 files with 44 calls keep a frozen count that can only go down. Every other file must have 0.
   - Fault: an untracked tools/fake-child.test.ts with one bare spawnSync (removed).
   - Red: `"tools/fake-child.test.ts: 1 execFileSync/spawnSync/execSync call(s) without a timeout; add { timeout: <ms below the test limit> }"`
   - Green: 2 tests pass.
   - Time: 101 ms for the file.
   - Commit: 6c3c709d7.

Green run: KINGDOWN_TEST_FILE='{src/ai/nnue/pool-net.test.ts,tools/hash-width.test.ts,tools/child-timeouts-ratchet.test.ts}' gives 'Test Files 3 passed (3)', 'Tests 15 passed (15)', Duration 331 ms. Red run with the three faults: 'Tests 3 failed | 13 passed (16)'. npm run typecheck: exit 0. npm run test:docs: 19 files, 199 passed, 1 skipped.

### Holes that stay
- Timeouts in the 22 frozen files: [47](47-lessons-child-timeouts-frozen-files.md).
- Service worker registered after the board: [48](48-lessons-service-worker-after-board.md).
- Power-move wording keyed on PowerTag: [49](49-lessons-power-move-wording-table.md).
- Fixed sleeps and unbounded serviceWorker.ready waits in browser tools: [50](50-lessons-browser-tool-waits.md).
- byName checks and tools/qa.mjs outside CI: [51](51-lessons-byname-checks-outside-ci.md).
- Player change during a lesson: [52](52-lessons-lesson-player-change.md).
- Two-sided marks on both sides, new Worker lint, wdl target, property test size: [53](53-lessons-engine-test-holes.md).
- Closures in hot paths, mobile guidance panel bounds, test positions with material on both sides: no ticket; review rules or browser checks only.

### Known limits
- The ratchet fails when another lane changes the count of a frozen file. tools/plugin-server-build.test.ts and tools/offline-build.test.ts are in other lanes now. A merge after those lanes must update UNBOUNDED.
- The ratchet parser counts a timeout in a shared options variable as missing. Its string stripper can hide a call. It does not read *.test.mjs or helper files.
- The pool guard covers the browser evaluator (residual). It does not cover the sim pools in src/sim/spec.ts, which can pass other letters.
- The hash guard proves linear independence over GF(2) only. It does not prove a good spread of the keys.


## Review

See the review section of ticket [10](10-change-rehearsals.md): one review of the whole branch, one repair batch, one repair check.

## Work record

See the sections above.

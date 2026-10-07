# 08: Five checks on the shared module, part B (painted game to visual design)

**What to build:** The painted game, playable clay, powers, special moves and visual design checks read the same three settings and fail on an unexpected page error. Each check uses `env`, `launch`, `trapErrors` and `assertNoErrors` from the shared module. No check holds a port, a browser channel or a tracked output path: screenshots, browser-check JSON and the visual design result file go to `PLAYABLE_OUT`, so a run no longer overwrites tracked files. The powers check's ignored "Failed to fetch" error becomes an allowed pattern with a reason. This ticket does not edit the shared new-game helper; ticket 07 owns it.

**Blocked by:** 06

**Status:** resolved

**Owns:** `tools/verify-painted-game.mjs`, `tools/verify-playable-clay.mjs`, `tools/verify-powers.mjs`, `tools/verify-special-moves.mjs`, `docs/visual-design/verify.mjs`

- [x] Each of the five files imports `env`, `launch`, `trapErrors` and `assertNoErrors`, and calls `assertNoErrors` before it exits.
- [x] No file of the five holds a port number, the string `chrome` or `chromium` as a channel, or a path under `docs/` for output; each output goes under `env('PLAYABLE_OUT')`.
- [x] The powers check allows "Failed to fetch" with a written reason, and fails on any other page or console error.
- [x] Runner self-test, stories 11 and 13: `npm run check:browser painted-game playable-clay powers special-moves visual-design` prints ok for each, and the changed-file guard finds no difference.
- [x] A check that fails for a fault in the game, not in the check, gets a new ticket under `docs/specs/`, and this ticket's `## Comments` names it.
- [x] Each file's header gives the run command through the runner, not a hand-started server.

**Verify:** `npm test`; `npm run check:browser painted-game playable-clay powers special-moves visual-design`; `git status --porcelain` is the same before and after.

## Comments

Builder, 2026-10-07, branch `build/checks-and-hooks-08`.

- Files: `tools/verify-painted-game.mjs`, `tools/verify-playable-clay.mjs`, `tools/verify-powers.mjs`, `tools/verify-special-moves.mjs`, `docs/visual-design/verify.mjs`. Each imports `env`, `launch`, `trapErrors` and `assertNoErrors` from `tools/lib/checks.mjs` and calls `assertNoErrors()` at the end of its run. Screenshots go through `shot()`; `browser-checks.json` (playable clay, special moves) and `checks.json` (visual design) go to `env('PLAYABLE_OUT')`. Each header gives `npm run check:browser <name>`. No file holds a port, a channel string or a `docs/` output path (checked with grep).
- Powers: one `allow` list, `{ pattern: /Failed to fetch/, reason: ... }`, for both pages. The phone page trapped only page errors before; now it also fails on a console error. Probe with the same allow list on `page.setContent` pages: a page with only "Failed to fetch" (console and thrown) passes `assertNoErrors`; a page with `console.error("some other fault")` fails it.
- Special moves and visual design: the result file now writes `errors: []`, because `assertNoErrors()` stops the run before the write when an error exists (as the old `assert.deepEqual(errors, [])` did).
- Red, before the change (`npm run check:browser painted-game playable-clay powers special-moves visual-design`): 4 of 5 FAIL on the changed-file guard: `docs/painted-game/{computer-game,phone}.png`, `docs/kings-powers/{new-game-powers,phone-powers}.png`, `docs/special-moves/{desktop,mobile}-choice.png`, `docs/visual-design/checks.json`. Playable clay was ok (it already read `PLAYABLE_OUT`). I restored the files with `git checkout`.
- Green, after the change (same command): `ok painted-game 87.4 s`, `ok playable-clay 19.9 s`, `ok powers 6.0 s`, `ok special-moves 31.4 s`, `ok visual-design 15.2 s`, "all 5 passed", exit 0. `git status --porcelain` was the same before and after (empty).
- No check failed for a fault in the game, so no new ticket.
- Not changed (not owned by this ticket): the old tracked outputs (`docs/visual-design/checks.json`, the screenshots in `docs/painted-game/`, `docs/kings-powers/`, `docs/special-moves/`) stay in the repository, now no check writes them. `HANDOFF.md` line 108 still gives the hand-started command for the painted game check (steering cut owns it). When you run `docs/visual-design/verify.mjs` without the runner, the `PLAYABLE_OUT` default is `<output root>/verify` (the module takes the script name); the runner gives `<output root>/visual-design`.
- `npm test` after the merge of the integration tip (`c93f803`): typecheck ok; vitest 55 files, 1018 tests passed; node tests 42 passed. One earlier run at load average 18 timed out in `src/sim/piece-activity.test.ts` ("agrees with the counts the games recorded", 5 s default limit); alone it passed in 2 s, and the next full run passed.

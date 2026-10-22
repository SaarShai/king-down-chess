# Port two finished fixes from the old repository

Status: resolved on branch `staging/lane-port`; not merged, not deployed.

## What

Two small fixes exist in the old King Down repository but not in this build:

- Old commit `8b9024b4` removes a duplicate End turn ready motion from `src/plugin/app.css`.
- Old branch `claude/plugin-clock-races` (PR 83, tests only) has 8 commits. They fix timing races in plugin tests.

The old commits are in this repository under `refs/old-local/*`.

## Why

The duplicate CSS is dead weight and hides which copy is in effect. The clock races make plugin tests fail at random under machine load. A random failure hides real faults.

## Scope

- `src/plugin/app.css`: remove one copy of the three End turn rules.
- Test files only for the clock races: `tools/plugin-menus.test.ts`, `tools/plugin-app.test.ts`, `tools/plugin-board.test.ts`, `tools/plugin-real-host.test.ts`.
- For each old commit: port it when its race still exists here; skip it with a reason when the test is gone, already waits correctly, or needs a product change.
- This ticket file. No product change for the races. No deploy.

## Acceptance

- One copy of the End turn motion stays, and no computed style changes.
- Each old commit is ported or skipped, with the reason below.
- Each changed test file passes alone and together. `plugin-ui`, `npm run typecheck` and `npm run test:docs` pass.

## Result

### Duplicate CSS

`src/plugin/app.css` had the same three rules twice (lines 348–350 and 363–365):

- `#end-turn.primary { animation: turn-ready 400ms var(--ease-out); }`
- `@keyframes turn-ready { 50% { filter: brightness(1.3); } }`
- `@media (prefers-reduced-motion: reduce) { #end-turn.primary { animation: none; } }`

The second copy is removed, as in `8b9024b4`. Proof that no computed style changes:

- The two copies have the same text, selectors and specificity, in the same file. Thus the order between them has no effect on the cascade.
- Lines 351–362 between them set no `animation` property and select no `#end-turn` element.
- The other `#end-turn` rules (`src/ui/table.css:86` and `:101`) set border, colour and grid place, not `animation`. They are in a different file, so the position of the copy inside `app.css` does not change their order.
- The two `@keyframes turn-ready` are the same, so the last-wins rule for keyframes gives the same frames.

### Clock-race commits

`git cherry -v staging/integrate refs/old-local/claude/plugin-clock-races` lists 8 commits. Each race was compared with the test in this build.

| Old commit | Subject | Decision | Reason |
| --- | --- | --- | --- |
| `552d948b` | Record the plugin clock race checks | Not ported; summarized here | Record file only (see "Old record file"). |
| `8a96e4b9` | Pause menu test clocks across timed steps | Ported by hand | The `open()` helper still installs a flowing clock, and the four clock tests (busy Start, slow settings save, seat activity, opponent moves) still step time on it. The busy Start test here has a different local pause (`setFixedTime` + `pauseAt`, then `resume`) than the old base, so the cherry-pick does not apply. The port pauses in `open()` and removes the local pause and resume, as the old commit does. |
| `df71efb3` | Wait for the frame to apply the computer reply | Ported (cherry-pick) | The lost Ready test still waits on the host view (`harnessView`), not the frame. |
| `46745b3e` | Pause the board clock between frame count reads | Ported (cherry-pick) | The passive drawing test still reads frame counts on a flowing clock. |
| `50e712b4` | Wait for board art before measuring idle frames | Ported (cherry-pick) | The board screen still loads king art (`ui/kings/*.webp`) as images that can finish after `ready()`. The test still has no load wait. |
| `45b1a53f` | Record the clock race causes and test proof | Not ported; summarized here | Record file only. |
| `0251e587` | Finish both widget polls before a clock jump | Test part ported (cherry-pick of `tools/`) | The two-widget test still jumps 30 s after it waits for the older widget only. The record part is summarized here. |
| `1d91e131` | Record the widget poll fix and check results | Not ported; summarized here | Record file only. |

No fix needs a product change. No old test is missing in this build.

### Old record file

The old record is `docs/specs/chatgpt-mvp/issues/60-plugin-clock-races.md`. That folder exists here, and number 60 is free. It is not ported, because its evidence names old-repository commits, an old base (`2d48c2be`), M1 runs and lane logs that this repository does not hold. Its causes and rules, in short:

- Menus: a poll starts after `idle()`, and the next clock jump expires its 10 s limit. Real time also adds to the busy Start, settings save and 30 s presence steps. Fix: pause the clock after boot and keep it paused across all timed steps.
- App, lost Ready: the host sees the computer reply before the frame applies it. Fix: wait on the frame's view.
- Board, passive drawing: real time ends the move and the 5 s draw window before the frame-count read. Fix: fix and pause the clock after `ready()`.
- Board, first idle check: optional art loads after `ready()` and starts a new draw window. Fix: wait for `networkidle` before the pause.
- Real host, two widgets: a paused clock still expires an open call at the next jump. Fix: wait until both widgets have `client.inflight === 0`. The test keeps a 1.5 s delay in the newer widget's first poll reply and checks that the delay runs.
- Rules: keep the page clock paused across timed steps. Before a clock jump, finish the calls of the last step in every live widget. For a reply check, wait for the frame state that the next check needs.
- The old sweep found no race in `plugin-motion`, `plugin-lobby`, `plugin-wait-recovery` or `plugin-races`.

### Commits

- `621300ef` Plugin CSS: keep one copy of the End turn ready motion (from `8b9024b4`).
- `5d855470` Wait for the frame to apply the computer reply (from `df71efb3`).
- `eb76c828` Pause the board clock between frame count reads (from `46745b3e`).
- `eb29cf69` Wait for board art before measuring idle frames (from `50e712b4`).
- `6534ee25` Pause menu test clocks across timed steps (by hand, from `8a96e4b9`).
- `adcb50b6` Finish both widget polls before a clock jump (test part of `0251e587`).

Each port names its old commit in the message. The old messages had two co-author lines; the ports keep only this lane's trailer.

### Checks

Test database: `kingdown_lane_port_test`. The full `npm test` is not run, by the lead's order.

- `KINGDOWN_TEST_FILE=tools/plugin-menus.test.ts npm test`: `Test Files  1 passed (1)`, `Tests  13 passed (13)`.
- `KINGDOWN_TEST_FILE=tools/plugin-app.test.ts npm test`: `Test Files  1 failed (1)`, `Tests  3 failed | 133 passed (136)`. The ported lost Ready test passes. The three failures are not in changed code (see below).
- `KINGDOWN_TEST_FILE=tools/plugin-board.test.ts npm test`: `Test Files  1 passed (1)`, `Tests  196 passed (196)`.
- `KINGDOWN_TEST_FILE=tools/plugin-real-host.test.ts npm test`: `Test Files  1 passed (1)`, `Tests  9 passed (9)`.
- `KINGDOWN_TEST_FILE='tools/plugin-{menus,app,board,real-host}.test.ts' npm test`: `Test Files  1 failed | 3 passed (4)`, `Tests  3 failed | 351 passed (354)`. The same three app tests fail.
- `npm run check:browser plugin-ui`: `FAIL plugin-ui          14.2 s  locator.click: Timeout 10000ms exceeded.`, `check: 1 of 1 failed`. It fails at `tools/lib/plugin-android-check.mjs:61`, while it waits for the board sheet's `Use` button.
- `npm run typecheck`: `tsc --noEmit` exits 0.
- `npm run test:docs`: `Test Files  13 passed (13)`, `Tests  161 passed (161)`.

### Failures that exist at the base

- The three app tests fail the same way at the base `c4f3d3c3`. Run: `src/plugin/app.css` and `tools/plugin-app.test.ts` set back to `staging/integrate`, then `KINGDOWN_TEST_NAME='keeps one rematch during a held end read|through a minute tick and updates actions at the deadline'`. Result: `Tests  3 failed | 1 passed | 132 skipped (136)`.
  - `keeps one rematch during a held end read and cancels it on leaving false`: `TimeoutError: page.waitForFunction: Timeout 5000ms exceeded.` at `tools/plugin-app.test.ts:1089`.
  - `keeps focus on power-w through a minute tick ...` and `... card-w-0 ...`: `AssertionError: expected '' to be '2 min left'` at `tools/plugin-app.test.ts:2092`.
- `plugin-ui` fails the same way at the base: `git checkout --detach staging/integrate`, then `npm run check:browser plugin-ui`: `FAIL plugin-ui          13.9 s  locator.click: Timeout 10000ms exceeded.`, at the same `plugin-android-check.mjs:61` step.
- These failures are outside this ticket's scope. This ticket does not fix them.

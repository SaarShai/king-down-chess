# Make the new build pass CI

Status: in review on PR SaarShai/king-down-chess#87 (branch `staging/lane-ci`, from `bdd886c7`). Round 2 fixes three failures of CI run 39901282212; round 3 splits the WebKit job (item 13); round 4 splits the board tests and fixes a card-detail race (items 14 and 15); round 5 splits the board input tests and fixes two `verify` failures (items 17 to 19); round 6 takes back the round 5 end card change, makes the end card miss print its state, and fixes its cause: a solo poll read left the finished view with no rules (item 16); round 7 closes the two other ways a poll read breaks a harness sample (item 16) and fixes a card check that a poll read took the failure of (item 20); round 8 fixes the cause of the 200% zoom miss on WebKit, a product fault: each poll render moved the seat screen's scroll (item 12); round 9 gives each board file its own runner in WebKit and in Chromium (items 21 and 22); round 10 fixes a poll race in the `plugin-ui` move race step, frees the canvases of removed widget pages in WebKit, and fixes two `verify` reads that timed a second browser request (items 23 to 26); round 11 keeps the canvases of a page in the back-forward cache, pauses the page clock with no race, gives the WebKit CI jobs CPU canvases (their software GL took most of the CPU), and fixes a pulse check and a WebKit poll race (items 23, 24, 27 to 29); its review finds one fault in the pulse check, and the review of that fix two more, all fixed (item 28). No merge or deploy.

## What

The owner asks for fixes for the eight failures in runs 39832956829 and 39844176473.
Keep each guard and assertion. Fix the cause. Use no retry loop or longer time limit as a fix.

## Plan

1. Read the failed paths and run logs. Compare the worker and start page with the old passing build.
2. Fix the history checkout, optional Python probes and OAuth test profile.
3. Reproduce the board, Play, small-screen and lesson races under CPU load. Wait for the state each step needs.
4. Prove the Firefox cause and fix the product or browser setup as the evidence requires.
5. Run each changed case three times under load in each failed browser. Run the full checks below. Commit the fixes.

## Acceptance

- Before each CPU load or browser run, the publish lock is absent. Stop load by exact PID if it appears.
- Set `PLUGIN_TEST_DATABASE_URL=postgresql://kingdown_test@127.0.0.1:55432/kingdown_lane_ci_test`.
- `npm run plugin:db:init-test` passes first.
- Changed cases pass 3 of 3 under CPU load in the failed browser.
- `npm run typecheck`, `npm run test:docs` and full `npm test` pass.
- `PLAYABLE_BROWSER=firefox npm run check:browser web-online` and `npm run check:browser plugin-oauth` pass.
- Record each cause, fix and exact check line here. No file edit occurs during a check.

## Evidence

- Database setup: `npm run plugin:db:init-test` exits 0. Output: `Disposable PostgreSQL schema ready (migrations 0001-0018); every migration is repeatable`.
- Local logs stay in ignored `dist-review/ci-green/`.

## Scope and choices

The owner approves this work directly. Change the workflow and check code, and fix the product faults that the checks find. Keep the production profile guard, every game assertion and each worker assertion. Add no dependency, retry loop or longer time limit. Round 8 finds one product fault (item 12): each poll render moved the seat screen's scroll at 200% zoom. Its fix changes two product files, `src/account-game/runtime.ts` (the Home label check) and `src/plugin/screens/seat.ts` (seat text written only on a change). No other product file changes.

## Causes and fixes

1. **History.** `tools/steering.docs.test.ts` uses `git show d6021674:...` to check the removed release paths. The default CI checkout holds one commit. The `verify` checkout now sets `fetch-depth: 0`. The other jobs do not run this history test and keep their shallow checkout.
2. **Python.** `tools/board-grain.test.ts` and `tools/stone-control.test.ts` probe `import numpy, PIL` in Python. Each catches failure and skips its source-export cases. These are optional paths, not the failed tests of the run. The child process inherited stderr, so the caught failure still printed a traceback. Each probe now captures its output and gives a clear skip reason. Shipped-asset checks still run. The existing skip conditions and all asset assertions stay.
3. **OAuth.** The compiled-function retry step used `https://plugin.example`, a generic Auth project and a local database. Ticket 66 rejects that profile before discovery, so `attempts` stays zero. The step now uses the staging origin, staging Auth URL and a valid staging runtime database URL. The mocked fetch throws before any connection. The same two requests must each attempt discovery and answer 503. The server guard stays.
4. **W7.** A key press starts a remote preview. `data-animating="false"` can still describe the old board before that preview answers. Undo or the focus poll then runs before the staged turn is ready. The keyboard steps now wait for `#end-turn[aria-disabled="false"]`; this follows the preview and its animation. The direct focus assertions stay. A separate local fault is macOS WebKit's Tab setting: even a plain page with two buttons skips the second button. Option+Tab includes buttons ([WebKit issue 199671](https://bugs.webkit.org/show_bug.cgi?id=199671)). The held-send step uses that key only on macOS WebKit; Linux and Chromium keep Tab. A mobile/desktop context change did not fix it and is removed.
5. **Back to Menu.** The clean-board case taps while the initial legal-move preview can still run. It then gives a later move preview only the short draft poll. It now uses the file's existing `settled(page)` before the taps and waits for the ready turn button before the draft assertion. The new game, old game, unchanged position, draft and exact call-list assertions stay.
6. **Small screens.** Canvas paint and Reload being on do not prove that the frame is idle. At the old draw-offer injection point, a load probe reports `inflight: 1`, with `kingdown_preview` still due, while Reload is already on. The step now uses ticket 76's `settled(page, frame)` before it copies and injects the view. The zoom case also settles the seat before it measures controls. Its old reachability helper scrolls in one protocol call and reads the hit target in another; a later layout can change the scroll between those calls. The helper now scrolls instantly and reads the same target in one frame call. The size floors, point-hit assertions and real move remain.
7. **Lesson return.** The CI artifact shows `#pace` present but hidden after the Menu click. The check opens Menu before the initial link replay ends. While a move animates, `src/render/PaintedView.ts` consumes a left click anywhere on the page to skip the animation, so the Menu click only skips it and Menu stays closed. The check now finishes `waitForLinkReplay(page)` before it opens Menu to set pace. It keeps all lesson, save, rules, return and friend-side assertions. The local final journeys pass on desktop and phone.
8. **Firefox.** This is a check setup fault. Commit `30657504` adds `context.route` to each retained profile. With it, the local check fails in 13.6 s: the registration is active, but the controller is absent after restart. Removing that routing makes the same unmodified workers pass the whole journey. `launchPersistent` now keeps the native network; its only caller is this worker check. Normal check contexts still answer the fake account host. The unit test now requires no routing in retained profiles. No worker assertion changes. Each final run proves four reopened profiles with `controlled`, `active` and `same` all true. Its fresh-profile negative control still fails as required.

### Firefox comparison and effect on players

- `git log 71f2d4c8..bdf321f2 -- static/sw.js 'src/sw*' tools/web-online-check.mjs` names the API, account-entry and recovery-check changes. The actual worker source is `public/sw.js`, so it is also checked.
- `git diff 71f2d4c8..bdd886c7 -- public/sw.js` changes only installation from serial requests to eight concurrent requests. The fetch and control paths stay the same. `static/sw.js` is emitted build output.
- `git show 30657504 -- tools/lib/checks.mjs` identifies the later routing change. The same final tree fails with routing and passes with native networking.
- [Playwright issue 37012](https://github.com/microsoft/playwright/issues/37012) describes a controller loss in its Firefox build that does not occur in normal Firefox. The local native-network runs test actual retained profiles, not a substituted controller.
- A real loss of the controller would matter for offline navigation. Here the native-network profiles keep it, and the emitted workers pass offline reload, lesson, Workshop, move and save checks. No product worker change is needed. A manual run in stock Firefox is not claimed.

## Reproduction and diagnostics

All load phases use 16 `yes > /dev/null` processes, one per core. They start 20 s before the first check and stop by their exact PIDs in cleanup. A watcher checks the publish lock and stops the load if it appears. Each check phase tests the lock before it starts. The lock stays absent in these phases. The normal browser runner keeps the shared three-slot limit. No source edit occurs during a check.

- `dist-review/ci-green/baseline-webkit.log`: the two W7 cases and the two failed size cases under load give `1 failed | 3 passed`; the failure is the direct Tab focus assertion at the old line 1440.
- `focus-probe.log`, `focus-probe-2.log`, `focus-native.log`: focus leaves Undo for the document body, with no end-turn focus event. A plain two-button page gives the same result. No app callback takes focus. The temporary probes and the context experiment are removed.
- `app-preview-red.log`: a temporary 1.5 s delay of preview replies reproduces the CI draft timeout at the old line 399. `app-preview-green.log`: waiting only for the initial preview is not enough; the move preview still exceeds the short poll. `app-preview-green-2.log`: the final readiness waits pass the same delay. The delay is removed before the final three load runs.
- `ios-state.log`: a temporary checkpoint stops the test so its state log is visible. It records the pending preview described above. This is a diagnostic stop, not a passing acceptance run. All checkpoint code is removed.
- `firefox-baseline.log`: `FAIL web-online 13.6 s`, with an active registration and no controller. `firefox-native-1.log`: the first native-network load run passes in 122.9 s. The final three runs below use the clean final code.
- The lesson cause uses the failed CI artifact `web-check-logs/king-down-chess-U6YnpG/lesson-return.log`: `page.selectOption`, `#pace`, `element is not visible`. A local failure of the old lesson code is not claimed.

## Green load runs

Each command below sets this database first:

```sh
export PLUGIN_TEST_DATABASE_URL=postgresql://kingdown_test@127.0.0.1:55432/kingdown_lane_ci_test
```

`CI_GREEN_LOAD=1 CI_GREEN_RUNS=3 python3 dist-review/ci-green/run.py <command>` is the local scratch driver. It supplies the 16 load processes and runs each command three times. It is not a test retry: any failed repetition stops the phase. It does not change a check's limit. The driver is ignored, not shipped.

1. WebKit W7 and the failed size cases, 3 of 3:

```sh
PLAYABLE_BROWSER=webkit KINGDOWN_TEST_FILE='tools/{plugin-board,plugin-ios-size}.test.ts' KINGDOWN_TEST_NAME='W7: (stages a move, sends once|moves keyboard focus)|keeps the seat and board large at 320.*63/180|keeps a usable board, seat and move at 200%' npm test
```

Each: `Test Files  2 passed (2)`, `Tests  4 passed | 224 skipped (228)`. Log: `final-webkit-3.log`.

2. Chromium W7 and Back to Menu, 3 of 3:

```sh
PLAYABLE_BROWSER=chromium KINGDOWN_TEST_FILE='tools/{plugin-board,plugin-app}.test.ts' KINGDOWN_TEST_NAME='W7: (stages a move, sends once|moves keyboard focus)|finds a game created elsewhere when Back returns a clean board to Play' npm test
```

Each: `Test Files  2 passed (2)`, `Tests  3 passed | 329 skipped (332)`. Log: `final-chromium-unit-3.log`.

3. History, both Python export files and the browser helper, 3 of 3:

```sh
PLAYABLE_BROWSER=chromium KINGDOWN_TEST_FILE='tools/{board-grain,stone-control,steering.docs,lib/checks}.test.ts' npm test
```

Each: `Test Files  4 passed (4)`, `Tests  99 passed (99)`. The local Python export dependencies are present. CI's absent-dependency path keeps its existing skips. Log: `final-chromium-unit-3.log`.

4. Every size case of the changed small-screen test and the zoom case, 3 of 3:

```sh
PLAYABLE_BROWSER=webkit KINGDOWN_TEST_FILE=tools/plugin-ios-size.test.ts KINGDOWN_TEST_NAME='keeps the seat and board large|keeps a usable board, seat and move at 200%' npm test
```

Each: `Test Files  1 passed (1)`, `Tests  4 passed | 28 skipped (32)`. This includes 393/852 with 102/118 insets and both 320/568 inset cases. Log: `final-ios-all-sizes-3.log`.

5. OAuth and lesson return, 3 of 3:

```sh
PLAYABLE_BROWSER=chromium npm run check:browser plugin-oauth lesson-return
```

Each: `check: all 2 passed`. OAuth: 4.9, 4.7, 4.9 s. Lesson return: 6.9, 6.8, 6.7 s. Each OAuth log has `Compiled function configuration: rejected discovery promise resets for a later request`. Log: `final-oauth-lesson-3.log`.

6. Firefox, 3 of 3:

```sh
PLAYABLE_BROWSER=firefox npm run check:browser web-online
```

Each: `check: all 1 passed`; 124.4, 124.0, 124.9 s. Each proves four retained profiles and the fresh-profile negative control. Logs: `final-firefox-3.log`; browser run folders `lane-ci-MuTR9j`, `lane-ci-k5WbPu`, `lane-ci-u1VW6K`.

These are focused runs. They are not a full-suite pass.

## Workflow follow-up

The failed CI `npm test` step hid one more fault in the next step. The first local workflow-tail run (`final-workflow-rest.log`) passes `npm run plugin:build`, then fails `npm run plugin:server:check` at line 62. Its first unsafe website-key case sets `localDev: false` with a generic Auth project and a loopback origin/database. The new production-profile guard rejects it before the website-key guard, so its unchanged error assertion sees the wrong reason.

`tools/plugin-server-check.mjs` now reuses the valid production fixture that it already uses for its OAuth-ready guard. The unsafe-key case passes the profile guard and reaches the intended website-key refusal. All eight refusal cases, the zero-provider-call assertion and the OAuth-ready assertion stay. No product guard changes.

Under the same 16-process load, this command passes 3 of 3:

```sh
npm run plugin:server:check
```

Each run reports `11 default API closures with zero pool calls, 8 unsafe website-key refusals` and `production auth gate passed`. Log: `final-server-check-3.log`.

## Full and workflow verification

The first full run, before the extra server-check fixture fix:

- `npm run typecheck`: exit 0.
- `npm run test:docs`: `Test Files  13 passed (13)`, `Tests  166 passed (166)`.
- `npm test`: `Test Files  256 passed (256)`, `Tests  4769 passed | 8 skipped (4777)`; Node checks: `pass 50`, `fail 0`. Log: `final-full.log`.

The remaining local workflow steps pass (`final-workflow-rest-2.log`):

```sh
npm run plugin:smoke
npm run plugin:check:protocol
npm run check:browser plugin-oauth
node --input-type=module -e 'import { build } from "vite"; await build({ envDir: false });'
node tools/plugin-server-build.mjs --site
npm run check:vercel
```

- Runtime smoke: source-free Haste, bounded AI, public data, apply, save/reload and all 11 archived engines pass.
- Protocol: all 27 tools and hints, retry, rollback, board/private-data boundaries, stale revisions and actor rejection pass.
- Default OAuth: `ok plugin-oauth 3.8 s`, `check: all 1 passed`.
- The combined site build uses the Vite API with `envDir: false` to avoid environment files. The explicit type check supplies the other part of the workflow build command. No deployment CLI runs.
- Site-tree check: 191 offline URLs, 7 browser entry routes, 3 closed legacy/unknown paths, 116 board-art files, 22 default API probes with zero pool calls, 28 enabled/test API probes with 3 provider refusals, and 11 archived engines pass.

The final tree, after the extra fixture fix, passes again (`final-full-after-server.log`):

```sh
npm run typecheck
npm run test:docs
npm test
```

- Type check: exit 0.
- Documents: `Test Files  13 passed (13)`, `Tests  166 passed (166)`.
- Full suite: `Test Files  256 passed (256)`, `Tests  4769 passed | 8 skipped (4777)`.
- Node checks: `pass 50`, `fail 0`.

All required local checks pass. GitHub does not run again because this task forbids a push. No merge or deploy occurs.

## Review

The final change reuses the existing frame and board waits. It keeps one native retained-profile path, with a regression assertion. It removes the failed context experiment and all temporary probes. No dependency, product rule or permission boundary changes. No time limit increases. The only replaced assertion is the retained-profile routing expectation; it now requires the native network. The commit records that change with a `Removed-check:` trailer. The server-check fixture refactor also receives a trailer; its assertions stay.

An independent read-only review (three dimensions, each finding checked by a separate skeptic) confirms two faults in the first commit and finds no other:

- Lesson return: the comment and item 7 named the wrong cause (`showPly` and `home.close()` do not run in the replay). The cause is the animation skip in `src/render/PaintedView.ts`. The comment and item 7 now say so. The wait does not change.
- Python probes: the new 4 s import limit in `tools/board-grain.test.ts` (and the existing one in `tools/stone-control.test.ts`) skipped the source checks on a slow import, even with numpy and Pillow present. A time-out now fails the file; only an import failure skips.

The Firefox worker change and the CI and fixture changes have no confirmed finding.

## CI round 2 (PR SaarShai/king-down-chess#87, run 39901282212)

`browser`, `browser-web` and `browser-firefox` pass; they failed on main. `verify` and `browser-webkit` fail. Each failed test also fails on main runs (39844199620, 39851032329, 39854257067): these are older races in the same tests. The WebKit `npm test` step reached its 20-minute limit, so vitest printed no error text there; runs 39832956829 and 39854257067 print the errors of the same tests.

9. **Remount.** The `#remount` click returns before the old frame leaves: `mount()` in `tools/plugin-ui-host.ts` first waits for the old app's teardown. A wait that the old frame already meets (enabled `#home-play`, enabled `#retry`) passes on the old frame; the next read then reaches the new frame before it boots. CI: "keeps a board open without a game on home" (`expected null to be 'home'`) and "makes one game after a lost Start reply" (`['', 1]`). A `remount(page)` helper in `tools/plugin-app.test.ts` now clicks and waits until the old iframe leaves the page, as #85 did inline for one test. All 32 Remount clicks in the file use it; each keeps its own wait for the new frame. Two loops named a Boolean `remount`; they now use `again`.
10. **Back to Menu call list.** The solo board polls every 5 s (`src/plugin/poll.ts`). On a slow runner the exact call list after Back also holds poll reads (`['kingdown_get','kingdown_get','kingdown_games']`). The test now installs the page clock before the board mounts. After the draft it pauses the clock 2 s ahead of now (on a slow runner the page clock can pass a nearer time before the command reaches it), then waits for the frame's in-flight calls to end and takes the call baseline. The exact assertion `['kingdown_games']` stays.
11. **Draw offer on WebKit.** The test set a one-time `harnessNextView` and clicked Menu > Reload. A slow WebKit click lets a 5 s poll take the view first; Reload then reads the fixture game without the offer, so the note never shows. The test now serves the offer to every game read (the `serveView` form of `tools/plugin-app.test.ts`). The first commit's `settled` call stays before it; `settled` needs `harnessNextView` undefined, so the test calls it no more after.
12. **200% zoom on WebKit.** Fixed in round 8 (see "CI round 8"). The hit test after the scroll misses on Linux WPE only (`seat-ready`, `seat-shuffle`); the first commit's one-call scroll and hit test did not fix it. The logs give no geometry. `reachable()` now prints the control box, the elements at its center, each scroll ancestor, the viewport and a second hit test after one rendering frame, at the moment of a miss. Its pass condition does not change. The next CI run gives the data to find the cause.

### Proof (local, Chromium unless named)

Each proof adds a delay to a temporary copy of the test and runs the old and the new test with the same delay.

- Remount: an 800 ms teardown delay in `tools/plugin-ui-host.ts`, a 2 s boot delay (`harnessBootDelay`) and a 1.5 s pause between the wait and the read. Old: both CI errors, `expected null to be 'home'` and `step 300: expected [ '', 1 ]`. New: both pass.
- Back to Menu: an 11 s pause before Back. Old: `['kingdown_get','kingdown_get','kingdown_games']`, the CI list. New: passes with the exact list.
- Draw offer: a 12 s pause between the injection and Menu. Old: two poll reads take the view (`next view left: false`) and the note wait times out, as on CI. New: 3 of 3 sizes pass in Chromium and in WebKit.

### Verification

- Under 16-process CPU load: Back to Menu 5 of 5 (Chromium), the draw-offer test 3 of 3 sizes (WebKit), the 200% zoom test (WebKit). With the pause at the current page time instead of 2 s ahead, Back to Menu failed 2 of 3 under load with `Cannot fast-forward to the past`.
- A forced miss in a temporary copy prints the item 12 line in WebKit, for example the seat screen as scroll ancestor (`auto`, top 115 of 115) and the viewport (197 by 426, scale 1).
- Full `tools/plugin-app.test.ts` in Chromium: `Tests  136 passed (136)`. The CI WebKit file set (`tools/plugin-{board,ios-size,preview-size}.test.ts`) in WebKit: `Test Files  3 passed (3)`, `Tests  230 passed (230)`.
- No new type errors in the two files (checked with a temporary tsconfig that holds `tools`; `npm run typecheck` checks `src` only).

### Review

An independent read-only review confirms causes 9 to 11 and the remount and draw-offer fixes. It found two faults in the first draft of this round, both fixed before the commit: the Boolean loop name that hid the helper, and a call filter for Back to Menu that could hide a real board read from Back (replaced by the paused clock). It finds the 200% zoom cause UNSURE and asks for the geometry that item 12 now prints.

It also lists races of the same classes in tests that have not failed on CI: a one-time view in "keeps focus on a power coin through an unchanged poll reply", poll reads in the exact lists of "recovers a held move at 10 seconds" and "keeps a failed read board locked", one-time `rejectNextGet` and hold flags that a poll can take, and two-call scroll and hit pairs in the short-phone matrix. Other test files also click `#remount` directly. These stay out of this change: no run shows them.

## CI round 3 (run 39908178007)

Every check passes except `browser-webkit`. Its 230 tests and `plugin-ui` pass; the 45-minute job limit cancels `web-online` after 54 s. No test fails.

13. **WebKit job time.** The job runs the browser install, the three test files, `plugin-ui` and `web-online` in turn. In this run the install takes 9 min 20 s (`Fetched 117 MB in 8min 56s (218 kB/s)`; the other jobs and the earlier WebKit runs take under 1 minute), the tests 15 min 58 s and `plugin-ui` 18 min 36 s. The step limits (20 + 24 + 4 minutes) already pass the 45-minute job limit. The job is now two jobs, as `browser-web` is for Chromium: `browser-webkit` runs the three test files, `browser-webkit-ui` runs `plugin-ui` and `web-online`. Each keeps the install, the sampler, the kernel log, the uploads, its step limits and the 45-minute job limit. No limit grows and no check goes. `tools/workflow.lint.test.ts` checks both jobs; its time check now allows 10 minutes of setup, the time of this slow install.

### Proof

- `tools/workflow.lint.test.ts` through `npm test`: `Tests  16 passed (16)`.
- The next CI run gives the first run of both jobs.

### Independent audits

Two independent read-only audits (ponytail review of the code, a retro of the session) both find the round 2 fixes right and give the same cause and fix for item 13. Other findings stay out of this ticket, which fixes CI only:

- Release: the written restore from the backup cannot replace rows that still exist; the publish does not prove that the engine check reads the production database; the backup copy does not set one snapshot for all tables.
- Checks: `tsconfig.json` checks `src` only, so a TypeError in a test file passes the type check; the docs lint exempts the specs folder from the model-name rule; a bare `vitest run` skips the test lock; a broken Python import still skips the source-export cases.
- The retained WebKit and Firefox profiles have no assertion that every request stays on `127.0.0.1`; the Firefox run shows 160 requests, all local.

## CI round 4 (run 39918579892)

`verify`, `browser`, `browser-web` and `browser-firefox` pass. The two WebKit jobs of round 3 fail.

14. **WebKit board tests time.** `browser-webkit` passes `plugin-ios-size` and `plugin-preview-size`; the 20-minute step limit stops `npm test` in `plugin-board`. No test fails. This runner is slower than the one of run 39908178007: `plugin-ios-size` takes 512 s against 382 s, so the board file needs about 21 minutes against 16. `tools/plugin-board.test.ts` is now two files at its own section break ("W7 journeys use board input"): `tools/plugin-board.test.ts` keeps the first 95 tests (about 470 s in run 39908178007), and `tools/plugin-board-input.test.ts` holds the other 101 (about 480 s). Their shared build, harness, browser and helpers move to `tools/lib/plugin-board-fixture.ts`; each file still gets its own setup. `browser-webkit` runs the first file with the size files, and a new `browser-webkit-board` job runs the second, with the same install, sampler, diagnostics and limits. No test, assertion or limit changes.
15. **Card detail failed read.** `browser-webkit-ui` fails in `tools/lib/card-detail-check.mjs`: after Menu > Reload fails, the check closes the card sheet and clicks Try again, but the button is hidden (`locator.click: Timeout`). The check's comment says a computer game has no timed poll; the solo board now polls every 5 s (`src/plugin/poll.ts`), and a good poll read clears the failed read. The check now installs the page clock before the board page loads (390 px, light) and pauses it 2 s ahead of now from the failed read until Try again ends, as item 10 does.

### Proof

- Card detail, WebKit, cards only, with a 6 s pause before Try again: the old check fails with the CI error (`<button disabled hidden="" id="retry">`); the new check passes.
- `npm run check:browser plugin-ui`: passes in WebKit and in Chromium with the new check.
- `tools/workflow.lint.test.ts` through `npm test`: `Tests  21 passed (21)`.
- Type check of the three board files (a temporary config with `tools`): the same errors as the old file, all older than this branch; no new error.
- Both board files through `npm test`: Chromium `Tests  196 passed (196)` (95 and 101, the old file's 196); WebKit, the `browser-webkit` file set `Tests  129 passed (129)` and `tools/plugin-board-input.test.ts` `Tests  101 passed (101)`.

## CI round 5 (run 39923681818)

`browser`, `browser-web` and `browser-firefox` pass. `browser-webkit` fails only in the 200% zoom test (item 12).

16. **End card on WebKit.** `browser-webkit-ui` fails in `tools/lib/plugin-shell-check.mjs`: `#over.end-card[open]` does not show in 10 s. The WebKit page process used 0.35 s of CPU in the last 5 s of the wait (the sampler gives its total CPU time), so the page waited; it did not render slowly. `src/plugin/screens/end.ts` opened the card only in one `requestAnimationFrame` callback, and CI WebKit can stop sending frames (the clickButton comments in the board tests). A CI diagnostic that ran the check 10 times (run 39925393652) passed 10 times; there, one frame came 1085 ms after its request. The owner decision C4 c says "Show end actions at once" (`docs/specs/owner-decisions-2026-10-15/issues/06-end.md`). Round 5 made `endScreen()` open the card at once, with no wait for a frame. Round 6 shows that this is not the cause (see below).
17. **Board input tests time.** `browser-webkit-board` stops at the 20-minute step limit in `tools/plugin-board-input.test.ts`. No test failed and no test stopped: no WebKit page process lived longer than 46 s, and the page processes used about 300% CPU. The runner was about 2.5 times slower than usual: the tests of the first board file took 707 s, against 453 s for the same tests in run 39908178007. Vitest runs the tests of one file in order, one file to a worker. The file is now two files at its section break "W7 ticket 04 browser journeys": `tools/plugin-board-input.test.ts` (38 tests, about 227 s on the usual runner) and `tools/plugin-board-drafts.test.ts` (63 tests, about 256 s). The job runs both side by side. Their shared helpers moved without change to `tools/lib/plugin-board-fixture.ts`.
18. **Child limit after the board split.** `verify` fails in `tools/child-timeouts.test.ts`: the board widget build moved to `tools/lib/plugin-board-fixture.ts` in round 4, and the test still read `tools/plugin-board.test.ts`. The test now reads the fixture, with the same limits. Open PR SaarShai/king-down-chess#88 has the same lines.
19. **Board read count with the solo poll.** `verify` fails in `W7-04: a press refused with INVALID_MOVE drops the draft and reads once (D11)`: three `kingdown_get` calls against two. `/fixture-position` makes a solo game (`tools/plugin-protocol-fixture.ts` `seedPosition`), and the solo board reads every 5 s (`src/plugin/poll.ts`). A poll read in the count window adds one. As in items 9 and 15, the test installs the page clock before the page loads, pauses it 2 s ahead, waits for the reads to end, counts, and resumes the clock after the count check. The exact count stays.

Item 12 has new data: a CI diagnostic (run 39925737196) printed the geometry at a `clickButton` miss for `#seat-ready`. The button box is 60, 318, 77, 52 and its center is at y 344. The seat screen scrolls (box 0, 51, 197, 279, so it shows y 51 to 330), and its scroll is at 95 of 135. So the button is 40 px under the visible area, and the hit test meets `main#app-root`. After one frame the box and the miss stay the same. The scroll was right when the box reads agreed; then a change of 40 px moved the button. A second diagnostic logs the seat changes between the scroll and the hit test.

### Proof

- Item 16: `npm run check:browser plugin-ui` passes in WebKit (321 s) and in Chromium (261 s), and `plugin-ui-http` passes in Chromium. `tools/plugin-motion.test.ts` (the live win and the 200 ms Skip with the end card): 3 of 3 with the round 5 `end.ts` and 3 of 3 with the old. These runs pass with the old code too, so they do not prove the fix (round 6).
- Item 19: the old test with a 5.5 s wait after the count fails with the CI error (`expected 3 to be 2`); the new test with the same wait passes, in Chromium and in WebKit.
- Items 17 and 18: `tools/child-timeouts.test.ts` and `tools/workflow.lint.test.ts` through `npm test` (with its type check): `Tests  32 passed (32)`. The three board files: Chromium `Tests  196 passed (196)` (95, 38 and 63); WebKit, the `browser-webkit` set `Tests  129 passed (129)` and the `browser-webkit-board` set `Tests  101 passed (101)` in 72 s, against 121 s as one file.
- Type check of the board files with `noUnusedLocals` (a temporary config): the same errors as the old file, all older than this branch; no new error.

### Review

An independent read-only review finds no fault. It rates the item 16 cause PLAUSIBLE: the failed run does not prove that the frame callback stopped. Round 6 shows that the cause is wrong. Each caller of `endScreen()` passes its checks, and with no wait between the game read and the open, the old second game check has nothing to check. It confirms items 18 and 19, and the split keeps all 101 cases, each assertion and the eight moved helpers unchanged. Not checked: the split on a slow CI runner.

## CI round 6 (runs 39934658877 and 39937069169)

`browser-web` and `browser-firefox` pass. `browser-webkit-ui` fails as in round 5: `#over.end-card[open]` does not show in 10 s after the finished result, with the card opened at once. So the frame wait in `src/plugin/screens/end.ts` is not the cause of item 16, and `end.ts` is back as it was before round 5.

16. **End card on WebKit: the cause.** `tools/lib/plugin-shell-check.mjs` now prints the state at a miss. Run 39937069169 prints: after the finished result the widget read the board twice (`kingdown_get`, `kingdown_get`, `kingdown_games`), the host's last view is the real game, still `playing` at revision 0, and the frame shows the board page with no card. A 0 ms timer and an animation frame still run, so the page does not stop; it shows the wrong game.
    The check makes the finished view from `window.harnessView`, the last view that the host sent, with a new game id. The solo board reads every 5 s (`src/plugin/poll.ts`) until the check hides the page, and that poll read has no `rules`: a read with `since_revision` sends only the changes (`src/match/service.ts` `view()`). When a poll read comes before the check hides the page, the finished view has no rules. The widget does not show a board of a new game without its rules (`src/account-game/runtime.ts` `show()`), so it reads the board again, and the server sends the real game. On a fast runner no poll read comes in the 5 s window, so the check passes: 18 of 18 runs in two CI diagnostics that ran only this job (runs 39925393652 and 39937127860), and every local run. Every `browser-webkit-ui` run of a pull request, with seven jobs side by side, failed. `zoomEndFits` in `tools/plugin-ui-check.mjs` already handles the same case ("A poll can leave only a delta in the harness").
    The fix: the finished view takes the full rules of the created game when the host's last view has none. The wait, its selector, its 10 s limit and the miss report stay. The other checks that make a view of a new game give it full rules, or hide the page before the game starts (`tools/lib/plugin-android-check.mjs`), so no poll read comes.

### Proof

- A/B on this machine in WebKit, with a 5.6 s wait before the check hides the page, so one poll read comes: the old check fails with the CI state (`{"host":{"calls":["kingdown_get","kingdown_get","kingdown_games"],...,"view":"playing@0",...},"frame":{"page":"board","open":false,...},"timer":0,"paint":0}` and `locator.waitFor: Timeout 10000ms exceeded`); the new check passes 2 of 2.
- A local WebKit run with a selector that cannot match prints the miss line and then fails with the same error.
- The full `npm run check:browser plugin-ui` in WebKit with the fix: all of its steps pass (`PASS: chat join preview ...`, 383 s). The run lists one fault: the ticket changed during the run.

## CI round 7 (run 39938961976)

`browser-firefox` passes. In `browser-webkit-ui` the shell check and the Android check now pass; the job fails in `tools/lib/card-detail-check.mjs` (item 20).

16. **End card: the review findings.** An independent read-only review confirms the round 6 cause and fix and finds two more ways a poll read breaks a harness sample:
    - A poll read that is in flight when the finished result comes takes its one-use view (`tools/plugin-ui-host.ts` `callTool`). The newer chat result detaches the old read, so the widget drops its reply, and the mount read gets the real game. Hiding the page after the board settles stops new polls, not a read in flight. The check now hides the page before it creates the game, as `tools/lib/plugin-android-check.mjs` does, so no poll starts. The rules repair stays.
    - The route samples in `tools/plugin-ui-check.mjs` take `routeBase` from `window.harnessView`. After a poll read it has no rules, so a finished sample and each sample in a fresh frame read the board again and get the real game. `routeBase` now takes the full rules from a board read when it has none, as `zoomEndFits` does.
20. **Card detail failed turn send.** `browser-webkit-ui` fails in `tools/lib/card-detail-check.mjs`: after the check sets `failNextAction` and clicks End turn, "Retry" does not show in 30 s. `failNextAction` fails the next tool call of any name but `kingdown_handle` and `kingdown_games`, a board read too. After the draw offer the friend game reads every 3 s (`src/plugin/poll.ts`), and the page clock runs again. A poll read between the arm and the click takes the failure, and the turn goes through. As in items 9, 15 and 19, the check pauses the page clock 2 s ahead of the page's now, waits for the reads to end, arms the failure, and resumes the clock after the step. The draw offer step arms the same failure, so it gets the same pause. The assertions and limits stay.

### Proof

- Held poll read, A/B in WebKit: the check holds the first poll read before the server runs it and releases it after the finished result. With the round 6 order the poll read comes, and the check fails with the CI state (`"calls":["kingdown_get","kingdown_games"]`, `"view":"playing@0"`, the board page). With the new order no poll read comes in 8 s, and the check passes.
- Route samples, A/B in WebKit with a 5.6 s wait before `routeBase`: one poll read comes and `routeBase` has no rules. The old code fails in the fresh-frame samples (`[data-screen="friend"]` does not show in 30 s); with the new code the full `plugin-ui` check passes (372 s).
- Item 20, A/B in WebKit with a 3.5 s wait after the arm: the old check gets one poll read in the wait and fails as on CI ("Retry" does not show); the new check gets no read and passes ("Card recovery: failed read, failed command, failed turn send ... pass").

## CI round 8 (item 12)

12. **200% zoom on WebKit: the cause.** A product fault. At 200% zoom (197 by 426 CSS px, insets 51/59) the seat screen scrolls. Each solo setup poll (every 5 s, `src/plugin/poll.ts`) renders the seat again, and in WebKit each render moved the seat screen's scroll from its bottom (115 or 135) to 95. The test scrolls `#seat-ready` into view, waits until two box reads agree, and clicks; a poll render between the reads and the click moved the button 40 px under the visible area. This is the CI geometry of run 39925737196 (scroll at 95 of 135, button center 14 px under the visible area).
    A per-write trace of one poll render on this machine (WebKit, the zoom test's page) shows 227 DOM writes. All but two connected writes give the same value. The two that change the DOM on each render:
    - `homeActions()` `label()` in `src/account-game/runtime.ts` writes `#home-play` and `#home-games` (in the hidden Home card) only when their `innerHTML` differs from its template. The template writes `<use .../>`, and the serializer gives `<use ...></use>`, so the check never holds and each render gives the buttons new content.
    - `render()` in `src/plugin/screens/seat.ts` sets the `textContent` of `#seat-context` (a wrapped line in the scrolled seat screen) to the same text, which replaces its text node.
    With both writes, 3 of 3 poll renders move the scroll. With either write blocked, 0 of 3 do. Same-value writes of `hidden`, `disabled`, `src`, attributes and classes, and the other seat text writes, do not matter. The trace does not show why WebKit lands at 95.
    The fix: the label template writes the serialized form (`></use>`), so the check holds for an unchanged label. The seat render writes its text only when the text changes (`text()` in `seat.ts`). The 200% zoom test gets a check: it scrolls the seat to its bottom, waits for one poll read, settles and requires the same scroll. The reachable checks and the click stay.

### Proof

- A/B in WebKit, the 200% zoom test with the new check: the old product code fails 2 of 2 with `A poll render keeps the seat scroll: expected 95 to be 135`; the fix passes 3 of 3, and 1 of 1 in Chromium. The label fix alone passes 2 of 2, and the seat fix alone passes 2 of 2.
- `tools/plugin-ios-size.test.ts` in WebKit with the fix: `Tests  32 passed (32)`.
- After the review fix below: the old product code fails 2 of 2 (`expected 95 to be 135`, `expected 95 to be 115`); the fix passes 2 of 2.
- Local runs with the fix: `src/plugin/app.test.ts` and `tools/plugin-app.test.ts` through `npm test` `Tests  253 passed (253)`; WebKit `tools/plugin-{journeys,menus,screen-lifecycle}.test.ts` `Tests  32 passed (32)`; `npm run check:browser plugin-ui` in WebKit (311 s) and `plugin-ui-http` in Chromium (281 s) pass.

### Review

An independent read-only review confirms the round 7 harness changes, the label check for each text and detail case (16 cases with `&`, `<`, `>` and a non-breaking space, in WebKit and Chromium), and `text()` (the context line is a polite live region; changed text still updates it). It found one fault in the new check: it counted the reads before it scrolled, so a poll read between the count and the scroll let it pass with the fault present (it forced that order on the old page: the check passed at 135, and the next poll moved the scroll to 95). The check now scrolls first and then counts.

## CI round 9 (runs 39941852399 and 39946595802)

In run 39941852399, `verify`, `browser`, `browser-web` and `browser-firefox` pass, and `browser-webkit-board` and `browser-webkit-ui` fail. In run 39946595802 (round 8), `browser-webkit` passes with the item 12 fix, `browser-webkit-ui` fails again, `verify` stops at its 30-minute job limit, and the `browser-webkit-board` install stopped at the job limit: the Ubuntu package mirror sent about 20 kB/s to that runner, so its tests did not start.

21. **Board tests side by side.** `browser-webkit-board` fails in `tools/plugin-board-drafts.test.ts`. F13 (dark) waits 9 s for a `#seat-menu` click: the call log stops after "done scrolling". D10 fails in `chooseTurnMove` (`expected undefined to be 'e2-e4'`, the saved draft after the move choice) and, in an earlier run of the same commit, in `settleBoardReads` (`expected 1 to be +0`). Both waits are `expect.poll` with its 1 s limit. On this machine the draft is saved 1 ms after the choice click and the `#seat-menu` click takes 44 ms, and an idle board page uses 3% CPU.
    The runner was starved. Since round 5 the job runs the two board files side by side on one 4-CPU runner. The sampler shows two WebKit page processes with about 350% CPU between them (about 175% each) and a load average of about 9. One CI WebKit page alone uses about 300% CPU (the `browser-webkit-ui` sampler). The tests ran a median 4.6 times slower than in main's last green run (39420161267), and the files took 977 s and 945 s against about 227 s and 256 s. F13 (light) passed in 20 s, near its 9 s click limit. So each step took as long as its limit allows.
    The fix: the job runs one board file to a runner (a matrix of `input` and `drafts`). Each runner gets its own 4 CPUs, the sampler and the log uploads, and the step limit stays. The waits, their limits and the assertions stay.
22. **`verify` time.** `npm test` in `verify` takes about 23 minutes (1372 s and 1342 s in the two last full runs), against 15.4 minutes (926 s) on `bdd886c7`. In run 39946595802 the Chromium install took 7 min 15 s (17 s in the run before), and the 30-minute job limit stopped `npm test`. The time comes from the round 4 and 5 board split: Vitest runs the three board files side by side, with up to four test files at a time on the 4-CPU runner. The three files took 1869 s of file time against 924 s for the one file on `bdd886c7`, and every other file ran about 1.5 times slower (the sum of all file times: 3175 s on `bdd886c7`, 5357 s now; for example `src/ai/search.test.ts` 105 s against 148 s, with no change to it).
    The fix: `verify` leaves out the three board files (`KINGDOWN_TEST_SKIP` in `vite.config.ts`), and the new job `browser-board` runs them in Chromium, one file to a runner, as `browser-webkit-board` does in WebKit. Each test runs in CI as before. The job limits stay.


## CI round 10 (run 39953001791)

In run 39953001791 (round 9), the board jobs, `browser`, `browser-web` and `browser-firefox` pass. `verify` fails two tests, and `browser-webkit-ui` stops at the 1260 s `plugin-ui` limit. Round 8's run 39946595802 also stopped `plugin-ui` in WebKit: WebKit killed the page (`Unable to shrink memory footprint of process (9228 MB) below the kill thresold (8192 MB)`).

23. **`plugin-ui` race step.** The check waits 90 s for the End turn button in the move race step (`sendTurn` after "Another tab wins the move race"), then the time limit stops it. The step arms `dropNextReply='kingdown_move'` and `holdNext='kingdown_computer'`: the send reply is lost, Retry shows, and the Retry send gets the refusal and then the computer turn, which the step holds and releases. The solo board polls every 5 s (`src/plugin/poll.ts`), and the page clock runs in real time. On a slow runner a poll read comes between the other tab's move and the send. It shows the page the other tab's move and starts the computer turn; the turn takes the computer hold, so End turn never shows, and the held call ends in "Cannot connect" (`SdkError: Request timed out`).
    A test fault: the product shows a move from another tab, as it must. The step now chooses the move with the running clock (the move animation needs it), then pauses the page clock 2 s ahead of the page's now, waits for the frame's reads to end, and resumes the clock after the Retry send. The Retry send closes the poll gate (`queue.writing()` in `src/account-game/runtime.ts`), so no poll read comes before the refusal. The assertions and limits stay.
24. **`plugin-ui` memory in WebKit.** Playwright's WebKit keeps each removed widget page until the host page navigates (ticket 45), and `plugin-ui` remounts the widget many times on one host page. A board page holds 88 canvases of 126 MB. On the CI runner, which has no GPU, each kept board page held about 700 MB: a diagnostic of 16 board remounts (run 39952611436) reached 11864 MB. The host removes a frame only for good, so `FRAME_SHIM` in `tools/plugin-ui-harness.ts` now records each canvas that gets a context and sets its size to 0 on `pagehide`. With this, the same 16 remounts reach 2920 MB (about 125 MB each), and the full check stays under 4.3 GB. The product does not change.
25. **`verify` focus check.** "keeps focus on power-w through a minute tick" fails at `expect(await frame.locator('#power-w').evaluate(b => document.activeElement === b)).toBe(true)`. A Playwright locator finds the element and evaluates on it in two browser requests. A coin row render (`strips()` in `src/plugin/screens/board.ts`) replaces the coin and gives focus to the new coin by id; between the two requests, the check compares the old, removed coin. A test fault. An independent read-only diagnosis reproduces it on this Mac: it releases the held profile read between the two requests, and both the `power-w` and `card-w-0` cases fail; the product moved focus to the new coin. A `hasFocus(page, id)` helper in `tools/plugin-app.test.ts` reads the element by id and the active element in one request. Its three uses keep their assertions.
26. **`verify` R8 game read.** "R8: another game does not drop a failed command for the game it belongs to" fails at `expect.poll(...shownGame...).toBe(other)` after an awaited `kingdown_resume`, with "expect.poll() function didn't resolve in time": Vitest sets this message only when no read completed in the 1 s limit. The resume draws its game before it returns. A pause of the browser for 1500 ms after the resume (Chrome DevTools `Debugger.pause`) gives the same error on this Mac, with `other` on the board before and after. A test fault: the 1 s limit timed a second browser read. The test now reads the shown game in the same browser call as the resume. The assertion stays.

### Proof

- Item 23: a red and green pair of `npm run check:browser plugin-ui` (Chromium) with a 6 s real-time wait after the arm line, so that a poll read comes in the window, as on a slow runner. Without the fix (`bf3634bb`) the check fails as in CI: `locator.click: Timeout 30000ms exceeded`, the host's pending call is `kingdown_computer`, and the frame shows "Cannot connect" after `SdkError: Request timed out`. With the fix, the race step passes and the full check passes. The wait is not in the commit.
- Item 24: diagnostic run 39952611436 remounts the board 16 times in CI WebKit. Without freeing, the page process grows to 3806, 6591, 9573 and 11864 MB after 4, 8, 12 and 16 remounts. With the `pagehide` freeing it grows to 2043, 2486, 2569 and 2920 MB, and to 2662 MB after 10 s idle.
- Items 25 and 26: the independent read-only diagnosis forces each event order on this Mac. The focus case releases the held profile read between the element lookup and the evaluate; R8 pauses Chromium for 1500 ms after the resume. With the old tests, both focus cases and R8 fail with the CI messages. With the new tests and the same forced orders, all three pass. In a diagnostic CI run with tracing (run 39957782452), the two old tests pass in all three attempts, so CI gives no trace of a failure.
- `npx vitest run tools/plugin-app.test.ts tools/plugin-races.test.ts` (180 tests), `tools/plugin-app.test.ts -t "keeps focus on"` (3 tests), `tools/plugin-races.test.ts -t R8`, `tools/workflow.lint.test.ts` (22 tests), `npm run test:docs` (166 tests) and `npx tsc --noEmit -p .` pass.

## CI round 11 (run 39965072628 and the independent review of rounds 9 and 10)

In run 39965072628 (round 10), every Chromium and Firefox job and `browser-webkit` pass. `verify` fails two tests, `browser-webkit-board (input)` fails one, and `browser-webkit-ui` stops at the 1260 s `plugin-ui` limit again. An independent read-only review of rounds 9 and 10 finds items 21, 22, 25 and 26 sound, and two faults: in item 24 and in item 23.

24. **Canvas freeing: a kept page.** `FRAME_SHIM` dropped the canvases on every `pagehide`. A `pagehide` into the back-forward cache (`persisted: true`) keeps a live page, and `tools/plugin-real-host.test.ts` sends one to a board page it keeps: in `verify`, "reads the board once when the page comes back from sleep" fails in the board scene (`drawImage`: "a canvas element with a width or height of 0"). The shim now returns on a persisted `pagehide`, as `src/plugin/screens/friend.ts` does. The test now also checks that the board page keeps its canvases.
23. **A pause with no race.** `page.clock.pauseAt(time)` jumps the running page clock to `time` and throws "Cannot fast-forward to the past" when the page clock has passed it. The race step read the page's now and paused 2 s ahead in a second command, so a runner that is slow between the two commands fails the step (the review forces it with a 2300 ms delay). Items 10, 15, 19 and 20 pause the same way; two of them read Node's clock, which a page clock after `fastForward` steps is ahead of. The review proposes holding a poll read instead, but a held read in the window ends after the 10 s call limit of `src/plugin/client.ts`, which runs on the page clock too. `pauseClock(page)` in `tools/lib/page-clock.mjs` fixes the wall time first (`setFixedTime`: `Date.now()` stops, the timers run), pauses at that same time (a jump of zero, so it cannot be in the past), then lets the wall time run again from there (`setSystemTime`). The five pauses use it. `tools/lib/page-clock.test.ts` checks it with the page clock an hour ahead of Node and with each clock command 300 ms late; the old forms fail both with "Cannot fast-forward to the past". Two older pauses (`tools/plugin-ui-check.mjs` near line 1724 and `tools/plugin-board-input.test.ts` near line 453, both from `bdd886c7`) still try three times; they are not CI failures, so this ticket leaves them.
27. **`plugin-ui` time in WebKit.** After the race and memory fixes, `plugin-ui` passes every step it reaches but stops at its 1260 s limit (runs 39965072628 and 39963922119). A per-thread CPU sampler in a diagnostic run (39963922119, two jobs of one commit side by side) shows four Mesa `llvmpipe` threads in the WebKit page process at 249% CPU together, against 25% for the page's main thread, with a load average of 4.05 on the 4-CPU runner. The runner has no GPU, and WebKit draws an accelerated 2D canvas with software GL; `WEBKIT_SKIA_ENABLE_CPU_RENDERING=1` moved only the tile painting (run 39958217855). A board page has 88 canvases. With 2D contexts made with `willReadFrequently` (a CPU canvas in WebKit), `llvmpipe` falls to 49%, the main thread gets 65%, the load average is 2.57, and `plugin-ui` passes in 809 s (Chromium: about 750 s); the setup section takes 153 s against 515 s. The memory peak is 3495 MB against 4880 MB.
    The fix: `FRAME_SHIM` adds `willReadFrequently: true` to each 2D context when `PLAYABLE_CPU_CANVAS=1`, and the three WebKit jobs set it (`tools/workflow.lint.test.ts` checks that they do and that no other job does). A run with a GPU keeps the accelerated canvas that the product asks for: on this Mac, Chromium with CPU canvases ran past the 420 s limit twice, and with its own canvases `plugin-ui` passes in 273 s. The product, the checks and their limits do not change.
28. **`verify` check pulse.** "pulses the checked side once (reduced motion false)" waits 500 ms for `#strip-me .portrait.is-checked` after the "Check!" status, and the wait ends with no match. The class comes with the check and stays until the strips draw again 600 ms on (`strips()` in `src/plugin/screens/board.ts`); on a loaded runner the strips can draw again after that time (for example when the replayed move ends) before the read comes. With the widget's CPU slowed 12 times (Chrome DevTools `Emulation.setCPUThrottlingRate`), the old test fails with the CI error. A test fault: a recorder (`watchMotion`, as the deal tests use) now notes the class as it comes, and the test expects it once with motion and never with reduced motion. Its next check, a 1.5 s poll for no running animation, failed in the same slow run, where one read took about a second; the page now reads it itself (`watchMotionEnd` in `tools/plugin-motion-observer.ts`). The time runs in frame times from the first frame after the pulse class comes, when the pulse starts, to the first frame 1.5 s on. There the portrait is present, and no animation of the portrait or of the pulse runs; the portrait had the pulse animation at the start. A slow browser call cannot use up the time, and a page stall before or after the start moves the frames, not the pulse's own progress. Two earlier forms of this fix had faults; see the reviews below.
29. **WebKit lost-send check.** "W7: keeps a lost-send error while pieces and coins remain readable" (`tools/plugin-board-input.test.ts`) does not find the All rules button of the tapped pawn. The host loses the move reply after the server commits the move. A solo poll read between the tap and the check shows the committed move, and the redraw clears the selection. A 6 s wait after the tap gives the CI error on this Mac. As in items 15 and 19, the test installs the page clock before the board loads and stops it (`pauseClock`) before the send. The checks and limits stay.

### Proof

- Item 24: with the old shim, `npx vitest run tools/plugin-real-host.test.ts -t "reads the board once"` fails with the `verify` error; with the guard, the file passes (9 tests).
- Item 23: `npx vitest run tools/lib/page-clock.test.ts` passes (2 tests); with `pauseAt(Date.now() + 2000)` or a page-clock target 100 ms ahead after a 300 ms delay, it fails with "Cannot fast-forward to the past".
- Item 27: run 39963922119, as above (per-thread samples every 10 s: 127 for the default canvas, 82 for the CPU canvas).
- `npx vitest run` of `tools/plugin-app.test.ts`, `tools/plugin-board-input.test.ts`, `tools/plugin-board-drafts.test.ts`, `tools/plugin-motion.test.ts`, `tools/plugin-real-host.test.ts` and `tools/lib/page-clock.test.ts` passes (267 tests); `tools/workflow.lint.test.ts`, `npm run test:docs` and `npx tsc --noEmit -p .` pass.
- Items 23, 24 and 27 in `plugin-ui`: `npm run check:browser plugin-ui` (Chromium, machine load about 15) passes in 273 s. With `PLAYABLE_CPU_CANVAS=1` the two runs pass each step to line 3171 (the race step and the three card-detail pauses among them) and stop at the 420 s limit there, as above.
- Item 28: at 12 times CPU slowdown (a loop in the widget takes 283 ms, not 23 ms) the old test fails (`locator.waitFor: Timeout 500ms exceeded`) and the new test passes three times. With the pulse stopped (`playbackRate = 0` when the class comes), the new test fails (`running: 1`, expected 0); the `endTime` form passes it. `tools/plugin-motion-observer.test.ts` passes two times each in Chromium and WebKit (10 tests: a 600 ms pulse ends; a stopped pulse and a 2 s pulse run; a stopped pulse whose element leaves the scope runs; a pulse whose element a render replaces ends; a 600 ms pulse ends with a 2 s page stall after its start, before its first frame, or before its class after a style or layout read; no match gives null). With the second form of `watchMotionEnd`, the scope case passes (`running: 0`), the layout-read stall fails (`running: 1`), and the no-match read waits until the 30 s test limit. The review's own probes give the expected result in both browsers with the final form. `tools/plugin-motion.test.ts`, `tools/plugin-motion-observer.test.ts` and `tools/plugin-join-review.test.ts` pass (43 tests), and `npx tsc --noEmit -p .` passes.
- Item 29: with a 6 s wait after the tap, the old test fails (`locator.isEnabled: Timeout 3000ms exceeded`, the All rules button) and the new test passes.

### Review

An independent read-only review of round 11 (commit `c5af8ba2`) finds items 23 and 29 sound, and items 24 and 27 sound with notes. It traces both clock classes of Playwright for item 23: the fixed wall time makes the pause a jump of zero, and a frame that loads later replays the fixed time and the pause. Its probes (a 2300 ms delay for each clock command, frames that load before, between and after the pause) keep each frame paused, and resume and `fastForward` work in Chromium and WebKit. Notes: the item 24 canvas check reads sizes, not painted pixels (its pixel probe keeps a painted pixel through `pagehide` and `pageshow`); for item 27, a CPU canvas can change small drawing details, and the setting does not show the speed for real users who also draw with software GL.
It finds one fault, in item 28: `getComputedTiming().endTime` gives the end in animation time and does not show that the pulse ends. A pulse at `playbackRate` 0 keeps its `endTime` of 600 ms and runs on; the round 11 test passes it and the round 10 poll fails it. Fixed as item 28 says: the page reads the running animations at its first frame 1.5 s on, and a unit test covers the stopped pulse.
A second independent read-only review, of that fix (commit `b986b0eb`), finds two faults in its first `watchMotionEnd`. First, the start read `document.timeline.currentTime`, which can hold the time of the frame before a stall: in Chromium, a style or layout read, a 2 s stall and then the class make a correct pulse read as running at its first frame. Second, the end read only the elements that match the scope then: a stopped pulse whose element leaves the scope read as ended, where the round 10 locator read fails. It also notes that the read waits with no limit when the widget document changes after the count. Fixed: the time runs from the first frame after the class; the end counts the pulse's own animations too and reports the scope elements, which the test expects; and a read with no match gives null at once.
A third independent read-only review, of commit `0b226e1d`, finds no fault. Both faults are fixed: the stale-start and empty-scope probes give the right result, a 2 s pulse and a stopped pulse fail, and a correct 600 ms pulse passes with a 2 s stall before the class, before the first frame, after the start, or during a later frame. A read with no match, also in a new widget document, gives null. It notes that the read still has no limit of its own if frames stop after the match; the 60 s test limit then reports it, and the pulse test keeps the page clock running, as the helper needs. All 10 observer tests pass in Chromium and WebKit, the pulse tests pass in Chromium also at 12 times CPU slowdown, and its 32 probes give the expected results.

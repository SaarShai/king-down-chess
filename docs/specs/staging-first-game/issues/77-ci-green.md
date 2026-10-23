# Make the new build pass CI

Status: in review on PR SaarShai/king-down-chess#87 (branch `staging/lane-ci`, from `bdd886c7`). Round 2 fixes three failures of CI run 39901282212; round 3 splits the WebKit job (item 13); round 4 splits the board tests and fixes a card-detail race (items 14 and 15). The 200% zoom miss on WebKit stays open (item 12). No merge or deploy.

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

The owner approves this work directly. Change only the workflow and check code. Keep the production profile guard, every game assertion and each worker assertion. Add no dependency, retry loop or longer time limit. No product fault is found. No product file changes.

## Causes and fixes

1. **History.** `tools/steering.docs.test.ts` uses `git show d6021674:...` to check the removed release paths. The default CI checkout holds one commit. The `verify` checkout now sets `fetch-depth: 0`. The other jobs do not run this history test and keep their shallow checkout.
2. **Python.** `tools/board-grain.test.ts` and `tools/stone-control.test.ts` probe `import numpy, PIL` in Python. Each catches failure and skips its source-export cases. These are optional paths, not the failed tests of the run. The child process inherited stderr, so the caught failure still printed a traceback. Each probe now captures its output and gives a clear skip reason. Shipped-asset checks still run. The existing skip conditions and all asset assertions stay.
3. **OAuth.** The compiled-function retry step used `https://plugin.example`, a generic Auth project and a local database. Ticket 66 rejects that profile before discovery, so `attempts` stays zero. The step now uses the staging origin, staging Auth URL and a valid staging runtime database URL. The mocked fetch throws before any connection. The same two requests must each attempt discovery and answer 503. The server guard stays.
4. **W7.** A key press starts a remote preview. `data-animating="false"` can still describe the old board before that preview answers. Undo or the focus poll then runs before the staged turn is ready. The keyboard steps now wait for `#end-turn[aria-disabled="false"]`; this follows the preview and its animation. The direct focus assertions stay. A separate local fault is macOS WebKit's Tab setting: even a plain page with two buttons skips the second button. Option+Tab includes buttons ([WebKit issue 199671](https://bugs.webkit.org/show_bug.cgi?id=199671)). The held-send step uses that key only on macOS WebKit; Linux and Chromium keep Tab. A mobile/desktop context change did not fix it and is removed.
5. **Back to Play.** The clean-board case taps while the initial legal-move preview can still run. It then gives a later move preview only the short draft poll. It now uses the file's existing `settled(page)` before the taps and waits for the ready turn button before the draft assertion. The new game, old game, unchanged position, draft and exact call-list assertions stay.
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

2. Chromium W7 and Back to Play, 3 of 3:

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
10. **Back to Play call list.** The solo board polls every 5 s (`src/plugin/poll.ts`). On a slow runner the exact call list after Back also holds poll reads (`['kingdown_get','kingdown_get','kingdown_games']`). The test now installs the page clock before the board mounts. After the draft it pauses the clock 2 s ahead of now (on a slow runner the page clock can pass a nearer time before the command reaches it), then waits for the frame's in-flight calls to end and takes the call baseline. The exact assertion `['kingdown_games']` stays.
11. **Draw offer on WebKit.** The test set a one-time `harnessNextView` and clicked Menu > Reload. A slow WebKit click lets a 5 s poll take the view first; Reload then reads the fixture game without the offer, so the note never shows. The test now serves the offer to every game read (the `serveView` form of `tools/plugin-app.test.ts`). The first commit's `settled` call stays before it; `settled` needs `harnessNextView` undefined, so the test calls it no more after.
12. **200% zoom on WebKit.** Open. The hit test after the scroll misses on Linux WPE only (`seat-ready`, `seat-shuffle`); the first commit's one-call scroll and hit test did not fix it. The logs give no geometry. `reachable()` now prints the control box, the elements at its center, each scroll ancestor, the viewport and a second hit test after one rendering frame, at the moment of a miss. Its pass condition does not change. The next CI run gives the data to find the cause.

### Proof (local, Chromium unless named)

Each proof adds a delay to a temporary copy of the test and runs the old and the new test with the same delay.

- Remount: an 800 ms teardown delay in `tools/plugin-ui-host.ts`, a 2 s boot delay (`harnessBootDelay`) and a 1.5 s pause between the wait and the read. Old: both CI errors, `expected null to be 'home'` and `step 300: expected [ '', 1 ]`. New: both pass.
- Back to Play: an 11 s pause before Back. Old: `['kingdown_get','kingdown_get','kingdown_games']`, the CI list. New: passes with the exact list.
- Draw offer: a 12 s pause between the injection and Menu. Old: two poll reads take the view (`next view left: false`) and the note wait times out, as on CI. New: 3 of 3 sizes pass in Chromium and in WebKit.

### Verification

- Under 16-process CPU load: Back to Play 5 of 5 (Chromium), the draw-offer test 3 of 3 sizes (WebKit), the 200% zoom test (WebKit). With the pause at the current page time instead of 2 s ahead, Back to Play failed 2 of 3 under load with `Cannot fast-forward to the past`.
- A forced miss in a temporary copy prints the item 12 line in WebKit, for example the seat screen as scroll ancestor (`auto`, top 115 of 115) and the viewport (197 by 426, scale 1).
- Full `tools/plugin-app.test.ts` in Chromium: `Tests  136 passed (136)`. The CI WebKit file set (`tools/plugin-{board,ios-size,preview-size}.test.ts`) in WebKit: `Test Files  3 passed (3)`, `Tests  230 passed (230)`.
- No new type errors in the two files (checked with a temporary tsconfig that holds `tools`; `npm run typecheck` checks `src` only).

### Review

An independent read-only review confirms causes 9 to 11 and the remount and draw-offer fixes. It found two faults in the first draft of this round, both fixed before the commit: the Boolean loop name that hid the helper, and a call filter for Back to Play that could hide a real board read from Back (replaced by the paused clock). It finds the 200% zoom cause UNSURE and asks for the geometry that item 12 now prints.

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

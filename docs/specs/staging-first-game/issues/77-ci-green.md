# Make the new build pass CI

Status: resolved on branch `staging/lane-ci`, from `bdd886c7`. No push, merge or deploy.

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
7. **Lesson return.** The CI artifact shows `#pace` present but hidden after the Menu click. The check opens Menu before the initial link replay ends. Replay calls `showPly`, which calls `home.close()` and moves the Menu button. The check now finishes `waitForLinkReplay(page)` before it opens Menu to set pace. It keeps all lesson, save, rules, return and friend-side assertions. The local final journeys pass on desktop and phone.
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

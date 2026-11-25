# Remove the launch switch and the off build

Status: done on branch seam-switch (cut from seam-ci, ticket 06); waits for the review, CI and the staging pass. The owner approved [the spec](../spec.md) and decision 1 on 2026-11-25. The staging pass and the publish need the owner's word.

Blocked by: 06

Class: C. Size: M. Needs a two-account pass on staging and a publish.

## Problem

The switch `KINGDOWN_SOLO_LAUNCH` gives two builds. No form ships the off build. The switch keeps these fork points alive:

- the source rewrites by exact text in `tools/solo-launch.mjs` (two files, three anchors);
- the swap of `next.html` and of its entry (`vite.config.ts:194`), with `src/interface/launch-entry.ts` beside `src/interface/entry.ts`;
- the error-forms filter (`vite.config.ts:161`);
- two service workers, `public/sw.js` and `tools/solo-launch/sw.js`, with a constant `SOLO_LAUNCH = true` and dead branches in the second;
- four legal pages in two copies (`public/`, `tools/solo-launch/`);
- `tools/release/profile.sh` and each script that reads it (`live.sh`, `release.sh`, `staging.py`, `tools/lib/release-browser.mjs`); the export in `tools/ios-sync.sh`;
- the branches on the launch marker in `tools/vercel-check.mjs` and `tools/deploy-live-check.mjs`;
- the condition `inApp && __KINGDOWN_SOLO_LAUNCH__` in `src/account/account.ts:99`.

The rollback that the switch exists for does not work on the release path: `profile.sh` sets the switch to 1 with no condition.

## Change

- `src/online/entry.ts` gets the two calls that the rewrite adds now (`installLocalSolo` before `createBrowserRuntime`, `installAccountControls` after the sign-out controls), written in the source. `tools/solo-launch.mjs` goes, with its import in `tools/plugin-server.mjs:28`.
- `vite.config.ts`: the switch, the filter and the rewrite plugin go. Each place that reads the switch keeps its launch value, with one exception. Line 150 gives the local online stack only when the switch is off (`&& !launch`). That term goes: the stack stays a dev-server mode that `KINGDOWN_LOCAL_ONLINE=1` turns on. The cache list at line 29 names `src/interface/entry.ts`, not `launch-entry.ts`.
- The build still writes `solo-launch.json`: the app router of the installed build, the host routes and the checks read it.
- `next.html` becomes the launch page. `src/interface/entry.ts` starts the platform with no switch; `launch-entry.ts` goes. The stale comment at `next.html:37` ("no manifest and no service worker until cutover") goes with it: `tools/solo-launch/next.html` has no such comment (ticket 08).
- The service worker, in two commits: first move the launch worker to `public/sw.js` (the shipped bytes do not change), then remove the constant and its dead branches.
- The launch copies of the legal pages and `browser-support.js` move to `public/`.
- The built server reads no switch: it gives the launch behaviour when it has a site. The server from source (`tools/plugin-server.mjs:188`, the local online stack) keeps the behaviour that it has today with no switch set. The exemption for the app in `src/api/http.ts` does not change: the installed build depends on it.
- `profile.sh` and the reads of it go. The export in `ios-sync.sh` and its test lines go.
- The run-by-hand workflow `pages.yml` builds the off page at a sub-path. It goes, with its section in `docs/perf/README.md` (decision 1).
- [HOSTING.md](../../../HOSTING.md) and the launch platform spec say what the rollback is now: a revert and a release.

## Tests and tools that read the fork

Each of these fails or goes stale when the fork goes. The change moves each one to the single tree.

- `tools/platform.test.ts`: tests `soloLaunch` and `launchSource`.
- `src/interface/play/merge.test.ts`: reads `tools/solo-launch/next.html` and `src/interface/launch-entry.ts`.
- `tools/privacy-policy.docs.test.ts`: checks `tools/solo-launch/privacy.html`.
- `src/account/account.test.ts:122`: asserts the switch text of `account.ts:99`.
- `tools/release/release.test.ts:280`: asserts the switch in the release run.
- `tools/offline-build.test.ts`: calls `offlineCacheFiles` with the off default and asserts that only the launch build adds `next.html`.
- `tools/cache-registration-check.mjs` and `tools/openai-challenge.test.ts`: read `public/sw.js`, which the first worker commit changes to the launch worker.
- `tools/online-local.test.ts:118`: expects the local online stack with no switch.
- `tools/ios-app.test.ts:34`: asserts the export in `ios-sync.sh`.

The list comes from a search. Before the first edit, the builder searches for each of `KINGDOWN_SOLO_LAUNCH`, `solo-launch`, `launch-entry` and `profile.sh` and adds what the list lacks.

## Tests that fail first

- `src/online/entry.test.ts`: the entry calls `installLocalSolo` before `createBrowserRuntime`. Red today: the source has no such call.
- `tools/service-worker.test.ts`: the default worker answers an offline visit of `/play` with the offline page. Red today for `public/sw.js`.

## Checks

- The builder compares `dist/` of a launch build before and after. Expected differences only: the build hash, the entry chunk, and `sw.js` after the second worker commit.
- The full suite and one full CI run.
- One pass of `npm run online:local`: sign-in and one online move.
- One pass of the dev server at `/next.html`: the new page starts. (The dev server has no route from `/` to `next.html`.)
- A two-account pass on staging: sign-in, an online game, an invite, a solo game with its hand-over, a reload offline.

## Known limits

- After this change, no new commit can build the old home page. A rollback is a revert and a release, or an earlier deployment of the host.
- The second worker commit makes each client fill its cache again, one time.
- The old board stays: the site still sends account solo games to it (`src/online/launch.ts:53`).
- No iOS build is necessary. The installed build keeps its bundle, and the next build gets the same page.

## Fork points: the search before the first edit

The builder searched the whole repository (`git grep`, without `docs/tasks-archive`) for `KINGDOWN_SOLO_LAUNCH`, `__KINGDOWN_SOLO_LAUNCH__`, `solo-launch`, `soloLaunch`, `launchSource`, `launch-entry`, `profile.sh` and `SOLO_LAUNCH` on head `0e1998312`: 198 hits in 67 files. Each hit has a result.

Changed:

- `tools/solo-launch.mjs` (`soloLaunch`, `launchSource`): removed.
- `vite.config.ts`: the import, `const launch`, the error-forms filter, the rewrite plugin `solo-launch-source` and the `&& !launch` term of the local online stack go. Each other read keeps its launch value: the manifest link and the worker start script of the pages, the legal page copy, the marker and the manifest name, the worker template, and the offline lists (`offlineCacheFiles` loses its `solo` parameter; its cache list names `src/interface/entry.ts`).
- `src/interface/launch-entry.ts`: removed; `src/interface/entry.ts` starts the platform.
- `tools/solo-launch/next.html`: its bytes are now `next.html`; the copy goes.
- `tools/solo-launch/sw.js` (`SOLO_LAUNCH`): its bytes are now `public/sw.js` (first worker commit); the constant and its dead branches go (second worker commit).
- `tools/solo-launch/terms.html`, `delete-data.html`, `browser-support.js`: moved to `public/`.
- `src/online/entry.ts`: the two calls are in the source.
- `src/account/account.ts:18,99` (`__KINGDOWN_SOLO_LAUNCH__`): the declaration goes; the condition is `inApp`.
- `tools/plugin-server.mjs:28,188`: the import and the env fallback go. The server from source has `localSolo` off, as with no switch today.
- `tools/release/profile.sh`: removed. `tools/release/live.sh:22`, `tools/release/release.sh:304`, `tools/release/staging.py:86-88`, `tools/lib/release-browser.mjs:53-54`: they build with no profile.
- `tools/ios-sync.sh:17-19`: the export and its comment go.
- `tools/check.mjs:179,184`, `tools/web-game-check.mjs:58-59`, `tools/web-online-check.mjs:229-230`: no switch.
- `.github/workflows/plugin-checks.yml:85,88-90`: one build and one `check:vercel`; the off pair goes.
- `tools/vercel-check.mjs:97-109,308,329,357-369`: the off branches go; the check requires the marker.
- `ios/App/App/SceneDelegate.swift:58`: the comment names no switch (comment only; no iOS build is necessary).
- Tests: `tools/platform.test.ts`, `src/interface/play/merge.test.ts`, `src/account/account.test.ts:122`, `tools/release/release.test.ts:280`, `tools/offline-build.test.ts`, `tools/openai-challenge.test.ts`, `tools/service-worker.test.ts`, `tools/ios-app.test.ts:33-39`, `tools/check.test.ts:23,137-142`, `tools/workflow.lint.test.ts:81-86`, `tools/privacy-policy.docs.test.ts:4-5` (comment).
- Docs: `docs/HOSTING.md` (the launch tree, Rollback, the release lines 71, 92, 123), `docs/IOS.md:7`, `docs/specs/interface-platform/spec.md`, `docs/perf/README.md` (with `.github/workflows/pages.yml`).

Stays:

- `solo-launch.json` (the marker) and each read of it: `vite.config.ts` (the build writes it; the preview plugin `solo-launch-preview`), `tools/plugin-server-build.mjs:44,47,103,139` (host routes, join page, the `__KINGDOWN_SOLO_LAUNCH__` define of the built server), `tools/deploy-keep-assets.mjs:66`, `tools/release/staging.py:49`, `ios/App/App/SceneDelegate.swift:42,61`, `ios/App/App/UniversalLink.swift`, `ios/Tests/UniversalLinkChecks.swift:44`, `ios/store.test.ts:21`, and the fixtures in `tools/deploy.test.ts`, `tools/ios-app.test.ts`, `tools/plugin-server-build.test.ts`, `tools/release/release.test.ts:586`, `tools/service-worker.test.ts`, `tools/offline-build.test.ts:558`. The installed iOS build, the host routes and the checks read the marker. A marker-less tree stays a test case of the host routes.
- `tools/deploy-live-check.mjs:64`: the marker branch stays. `tools/deploy.test.ts` has 76 cases of this check on a tree with no marker; a move of them is a fixture rewrite of a deploy tool with no change for the shipped tree.
- `__KINGDOWN_SOLO_LAUNCH__` in `tools/plugin-server.mjs:188` and `tools/plugin-server-build.mjs:103`: the build sets it from the marker of the site, so a built server with a site gives the launch behaviour. No caller sets it.
- `kingdown.solo-launch-seen` (`src/interface/platform.ts:8`, `src/interface/play/scenes.ts:148`, `tools/lib/*.mjs`, `tools/verify-*.mjs`, `docs/specs/gui-*/capture.mjs`): a storage key of live clients.
- `tools/solo-launch/privacy.html` and `tools/solo-launch/support.html`, and their copy line in `vite.config.ts`: see "Where the build does not follow the ticket".
- `.claude/hooks/tool-gate.test.ts:195,218` (`pages.yml` as a command string): an example in a hook test; `.claude/**` is outside this ticket.

History (no change): `docs/specs/platform-seam/**`, `docs/specs/retro-2026-11-24/retro.md`, `docs/specs/interface-ios/spec.md`, `docs/specs/interface-platform/issues/03-repair.md`, `docs/specs/interface-playtest/issues/01-new-game-refresh.md`, `docs/specs/release-flow/issues/01-release-and-preview.md`, and the research and spec files that name `public/sw.js` or `pages.yml`.

Found by the search and not in the list of "Tests and tools that read the fork": `tools/service-worker.test.ts` (both workers), `tools/check.test.ts`, `tools/workflow.lint.test.ts`, `tools/vercel-check.mjs`, `tools/plugin-server.mjs`, `ios/App/App/SceneDelegate.swift:58` (a comment), `tools/muse-tool-docs.ts` (reads the head of `public/support.html`), and the storage key `kingdown.solo-launch-seen`.

## Findings for the lead

1. **The shipped privacy page is not the page that the Muse test checks.** The launch build copies `tools/solo-launch/privacy.html` over `public/privacy.html`; the page at kingdown.dev is the copy of 15 November (`cmp` of the baseline `dist/privacy.html` with `tools/solo-launch/privacy.html`: equal). The Muse paragraph `<p id="muse-connector">`, the item `<li id="muse-link">` and the wording "from the website, from ChatGPT or from Muse" are only in `public/privacy.html` (commits a22f50a75 and 187174608, 17 November). No build ships that text, and the Muse case of `tools/privacy-policy.docs.test.ts` passes only on that file. The two copies also differ in both directions (lessons and badges on one side; the device solo text on the other), so a merge is an editorial change to a legal page. The owner decides the text.
2. **The Muse docs page takes its style from the support copy that does not ship.** `tools/muse-tool-docs.ts` builds the head of `public/muse-connector.html` from `public/support.html` (dark page), while kingdown.dev ships the light launch copy of `support.html`. A move of the launch copy to `public/` makes the docs test ask for a new run of `muse:docs`, and that run restyles a shipped page.
3. **`tools/online-local-smoke.mjs` is stale against the current home.** It presses `Play a person`, which the home has not had since the redesign of 2026-11-20 (`Play a friend`, then `Send invite link`), and it waits for `.people-sheet` headings. It fails before sign-in on this branch. It did not run on the base: `tools/online-local-smoke.mjs` and `src/interface/play/texts.ts` have no diff from `0e1998312`, and the dev page loads the same `play/main` home before and after this change, so the same failure on the base is an inference.

## Where the build does not follow the ticket

- **A stale comment stays.** `src/online/launch.ts:1` says "The launch build alone adds local solo and account controls to the old web entry." The lane may not edit that file.

- **Commit order.** The first worker commit (12f94c70d) and the move of the legal pages (c8180a41d) come before the commit of the switch (6028b2b09). After the switch goes, the fixture builds of `tools/offline-build.test.ts` and `tools/openai-challenge.test.ts` (their root is a temporary folder) cannot read `tools/solo-launch/sw.js` or the legal copies. In this order each commit stays green, and the two worker commits keep their order and their split. Bullets 1 and 2 of the ticket (the entry calls and the end of the rewrite) are one commit, because the rewrite adds the calls a second time.
- **`privacy.html` and `support.html` keep two copies** (findings 1 and 2). `vite.config.ts` copies the two launch copies from `tools/solo-launch/` with no condition, so the shipped bytes do not change. `terms.html`, `delete-data.html` and `browser-support.js` moved to `public/`: no commit touched only their `public/` copy after the fork (5db7875b7).
- **`tools/deploy-live-check.mjs:64` keeps its marker branch.** `tools/deploy.test.ts` has 76 cases of this check on a tree with no marker; the lead's rule for the deploy tools is no change apart from the switch. `tools/vercel-check.mjs` lost its off branches (2bdfbfeb1).
- **The built server keeps the define `__KINGDOWN_SOLO_LAUNCH__`** (`tools/plugin-server-build.mjs:103`), which the build derives from the marker of the site. Only the env fallback and its import went from `tools/plugin-server.mjs`.
- **`next.html` keeps the launch comment** "The build links the manifest only for the solo launch." The comment reaches `dist/`, and the ticket permits no change of `next.html` apart from the entry chunk name.
- **`tools/online-local.test.ts:118`** needs no change: with no switch, its case is the default.

## Work record

Head before the change: `0e1998312`. Logs: `$TMPDIR/seam-switch-logs` of the builder session.

Red lines (before the change):

- `KINGDOWN_TEST_FILE=src/online/entry.test.ts KINGDOWN_TEST_NAME='keeps web solo games'`: `× keeps web solo games on the device before the runtime starts, and adds the account controls after Log out` with `AssertionError: expected [] to deeply equal [ 'Log out' ]`. 1 failed, 23 skipped.
- `KINGDOWN_TEST_FILE=tools/service-worker.test.ts KINGDOWN_TEST_NAME='default worker answers an offline visit'`: `× the default worker answers an offline visit of /play with the offline page` with `TypeError: Cannot read properties of undefined (reading 'text')`. 1 failed, 229 skipped.

Green runs (focused runs are not a full-suite pass):

- After 12f94c70d: `tools/service-worker.test.ts`, 149 passed.
- After 6028b2b09: 12 files (entry, account, merge, platform, offline-build, openai-challenge, online-local, plugin-server-build, service-worker, launch, account-controls, account-requests), 345 passed, 27.5 s, with the type check.
- After e01320afb: service-worker, offline-build and openai-challenge, 224 passed.
- After 02195f350: `tools/{release/release,deploy,ios-app,check,workflow.lint}.test.ts`, 286 passed, 223 s.
- After 2bdfbfeb1: `tools/{offline-build,web-online-check}.test.ts`, 100 passed.
- `npm run typecheck` on 12c1688e9: exit 0.
- `npm test` on 12c1688e9: 410 files passed, 1 failed, 19 skipped; 8040 tests passed, 1 failed, 387 skipped; 461 s (11:10 to 11:18). The failed case is `tools/git-hooks/pre-commit.test.ts > gate interface > lets a commit through the real pre-commit hook`. The file alone passes (14 passed). The cause of the failure in the full run is not found.
- `npm run check:browser web-game web-online signin-speed home account cache-registration`: all 6 passed (65.9 s, 126.6 s, 28.4 s, 7.7 s, 56.1 s, 2.9 s).
- The job `verify` in the way CI runs it, on a disposable database `kingdown_lane_seamswitch_test` (port 55432): `plugin:db:init-test`, `build:vercel`, `test ! -e dist/play-scenes.html`, `check:vercel`: exit 0 ("Site tree: worker 470c1e215eba / public-build-v1, 363 offline URLs, … 18 archived engine(s) passed").
- The local online stack (`npm run online:local`, no switch set): the seeded accounts `test-c` (Google stand-in) and `test-b` (GitHub stand-in). `test-c` opened `/next.html?as=test-c`, pressed Play a friend, Send invite link and Continue with Google; the sheet made the game and copied the invite link. `test-b` opened the link with `?as=test-b`, pressed Join the game and Continue with GitHub, and joined. Light sent one move (a2 to a4), and the other player got the turn. No page error and no console error. The script is a probe (`pass-online.mjs` in the log folder; it ran from a temporary copy in `tools/`, removed after the run), because `tools/online-local-smoke.mjs` is stale (finding 3). An earlier try with `test-a` got HTTP 409 from the API after earlier probes had made open games for that account; the cause of the 409 is not confirmed.
- The dev server (`npx vite`, no switch): `/next.html` starts the new page (Guide, Sign in, Play, Play a friend) with no page error and no console error. The dev page now runs `startPlatform`: from the code (`src/interface/platform.ts:38,47`), it shows the returning-player notice to a browser with an old save and registers `/sw.js`. Before, the dev page loaded `play/main` directly. The ticket orders this; it is not observed in a browser.
- `npm run test:docs` with this work record: 19 files, 199 passed, 1 skipped.

The `dist/` comparison: a launch build of `0e1998312` (`KINGDOWN_SOLO_LAUNCH=1 npm run build`) and a build of `12c1688e9` with no switch, 11318 files each. 11306 files are byte-equal at the same path. The compare script (`compare.mjs` in the log folder) replaces the build commit, the content-hash parts of file names and the worker version. After that, three files differ:

- `assets/next-*.js` (the entry chunk): one block level less, from `src/interface/entry.ts` with no `if (true)` (permitted).
- `sw.js`: the constant `SOLO_LAUNCH` and its dead branches go (permitted, second worker commit).
- `assets/account-*.js`: `accountHtml(…, e&&!0)` becomes `accountHtml(…, e)` (the `account.ts:99` condition is now `inApp`). The value is the same for each boolean `inApp`.

The other nine changed files (`index.html`, `next.html`, `assets/browser-*.js`, `assets/host-*.js`, `assets/index-*.js`, two `assets/main-*.js`, `assets/platform-*.js` and a second `assets/account-*.js`) differ only in the build commit or in the hashed names of the files that they import. A build of `6028b2b09` (before the second worker commit) differed only in the entry chunk and the account chunk.

Not verified:

- The two-account pass on staging (sign-in, an online game, an invite, a solo game with its hand-over, a reload offline). This session cannot run it, and it needs the owner's word.
- One full CI run.
- The installed iOS build: no iOS build ran. The app bundle keeps its own bytes; the next build gets the same page.
- The pre-commit hook case of the full suite in a run with no load (it passed alone).

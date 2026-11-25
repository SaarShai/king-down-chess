# CI builds the tree that ships

Status: done on branch seam-ci; waits for the review.

Class: B (check scripts, tests and CI only). Size: M, or L if many checks need more than a new start address.

## Problem

- Each shipped form builds with `KINGDOWN_SOLO_LAUNCH=1` (`tools/release/profile.sh`, `tools/ios-sync.sh`).
- The build step of CI (`.github/workflows/plugin-checks.yml:85`) and the check runner (`tools/check.mjs:183`) do not set it. They build the off tree, which no form ships.
- The launch tree is built in two cases only. In CI: by the two release checks (`tools/lib/release-browser.mjs:53`). In a release run: `tools/release/release.sh` and `tools/release/live.sh` read `profile.sh` and then run the checks. So a fault of the launch tree shows at the release, not in the pull request.
- On the off tree `/` is the old page; on the launch tree `/` is the new page. A search shows about 18 browser checks that open `/` to test the old board. On the launch tree the old board is at `/index.html`. The number is an estimate: the first step of this ticket is the true list.
- One journey of `tools/web-game-check.mjs` sends solo commands of the web through `/api`. The launch server refuses them (`src/api/http.ts:172`). So CI tests a flow that no form ships.
- Commits 587f6c1b3 and 97f1b02c8 repaired faults that staging or the publish found first, not CI.

## Change

- Set the switch on each site build of a check, and only there:
  - the CI build (`plugin-checks.yml:85`);
  - the site build of the check runner (`check.mjs:183`);
  - the own build of `tools/web-game-check.mjs`;
  - the second site ("recovery") that `tools/web-online-check.mjs:229` builds in its own process. If not, that check compares a launch tree with an off tree.
- Do not set the switch for the whole workflow: with the switch on, `vite.config.ts:150` turns local online play off, and `tools/online-local.test.ts` needs it.
- List the checks that open `/` for the old board. Give them one helper for the address of the old board, `index.html` on the check site.
- The solo part of `web-game-check` expects what the launch server does: the refusal and the hand-over.
- The off tree keeps one build and one route check in CI while it is the rollback path (decision 1 of the spec).
- The unit tests that build with the real config (`tools/openai-challenge.test.ts:20`, `tools/offline-build.test.ts:187`) stay on the off tree in this ticket. [Ticket 07](07-remove-off-build.md) moves them.

## Test that fails first

In `tools/check.test.ts`, the test of the site build of the runner ("browser check site build", line 81): its stand-in build records the build environment. The new assertion wants `KINGDOWN_SOLO_LAUNCH=1` there. It is red today. The stand-in records only the `VITE_*` values and `KINGDOWN_TEST_PAGES` (`check.test.ts:23`), so it must record the switch too.

## Checks

- Each moved check passes on the launch tree, one run each.
- One full CI run.

## Known limits

- The time of the CI build grows by one site build while both trees are built.
- A check can show a fault of the launch tree that is real. Such a fault becomes its own ticket; it does not stop this one.

## The checks that open `/` for the old board

The list comes from `tools/lib/registry.mjs` and a read of each script. Each one now opens `oldBoard()` (`tools/lib/checks.mjs`), which is `index.html` on the check site.

- Default checks (a local run with no name, and the CI shards `browser-default`): `read-piece`, `verb-marks`, `turn`, `end`, `their-turn`, `game-screen`, `menu-extra`, `home`, `account`, `cursor-adoption`, `character-clips`, `new-game`, `powers`, `special-moves`, `ux-defects`, `visual-design`, `qa`, `leap-start`, `character-prepare`. That is 19.
- Checks that CI runs by name: `web-online` (each visit of the old board, and `/` for the offline install), `signin-speed` (the home entry). `web-game` opens no root page; its join and solo parts change (see below).
- The by-name modes of `tools/web-game-check.mjs`, which now build the launch tree too: `account-discovery` opens `/` for the old board. `staging-login` opens an own solo game, which the launch tree hands to the local board. `shared-mechanics`, `recovery-consumers`, `desktop-performance` and `web-game-staging` open no root page.
- Checks that run only by name: `painted-leaps` (the script of `leap-start`), `layout-title` and `layout-zoom` (`tools/verify-layout.mjs`), `ui-review-samples`, `king-capture-facing`, `stratus-idle-exit`, `stratus-registration`, `character-runtime` (also through its throttle proxy, and `tools/lib/character-effects-game-check.mjs`), `motion-concepts`. The parked checks (docs/PARKED.md): `lessons`, `link-game`, `lesson-return`, `workshop`, `workshop-cast`.
- Already at `/index.html` before this ticket: the GPU checks `king-effects` and `painted-game`, and `king-labels`. They keep their own address.
- Not moved, because they do not open the runner's site: `movement-runtime`, `cache-registration`, `effects-states`, `effects-game`, `production-comparison`, `owner-playtest-b`, `w6-parts`, `search-worker`. They start their own server. The `play/friend` visit of `ui-review-samples` is not the root, so it stays.

In all, 39 registry entries open the old board. This ticket moves 36: 33 to the helper, and `web-online`, `signin-speed` and `account-discovery` to `/index.html` on the server that they start themselves. The other 3 had their own address before. The first step of the ticket estimated about 18; the 19 default checks are near that estimate, and the by-name checks are the rest.

## Work record

### What changed

- `tools/check.mjs:184`: the site build of the runner sets `KINGDOWN_SOLO_LAUNCH=1`.
- `.github/workflows/plugin-checks.yml:85`: `KINGDOWN_SOLO_LAUNCH=1 npm run build:vercel`, then `check:vercel`. Then one off build and its route check (`KINGDOWN_SOLO_LAUNCH=0`), the rollback path of decision 1. `tools/vercel-check.mjs` finds the tree from `static/solo-launch.json`, so one command checks both.
- `tools/web-game-check.mjs`: its own build sets the switch. The join part follows the launch tree: `/j` goes to the join page, then to `next.html#join=<key>`; the friend taps "Join the game", the redeem call answers 200, and the new page opens `#online=<game>`. The solo part now checks the refusal (403, `NOT_ALLOWED`, "The computer plays on this device.") and the hand-over dialog of the old page to the local board. The web call of `checkSoloSync` goes: the launch server refuses web computer commands, so it cannot pass there. The embedded call in `tools/plugin-ui-check.mjs` stays.
- `tools/web-online-check.mjs`: the recovery site sets the switch before its build. The old board visits use `/index.html`. The route loop accepts `/join.html` for `/j`. A parked game link offline now opens the new page with "This game link cannot open here", and the save stays.
- `tools/lib/checks.mjs`: the helper `oldBoard()`.
- `tools/checks.lint.test.ts`: a call of `oldBoard` counts as a use of `env`, with one fixture case.
- `tools/check.test.ts`: the stand-in build also records `KINGDOWN_SOLO_LAUNCH`; the shell holds `0`, and the build must get `1`.
- `tools/workflow.lint.test.ts`: the verify job builds the launch tree and keeps one off build and route check.
- The 33 check scripts of the helper in the list above, and `tools/lib/signin-speed-check.mjs`, `tools/lib/daylight-home-check.mjs`, `tools/lib/account-discovery-check.mjs`, `tools/lib/staging-login-check.mjs`.

### What the lead watches in the first CI run

- The change of the workflow file puts `tools/ci-plan.mjs` in full mode, so every shard runs.
- Job `verify`: it now builds the site two times. `check:vercel` finds the tree from `static/solo-launch.json` (`tools/vercel-check.mjs:97`), so the first call checks the launch tree and the second the off tree. Here the pair took about 100 s. The off tree stays in `dist` and `.vercel/output` after the step; the tests of that job (`tools/plugin-board.test.ts`, `tools/plugin-board-drafts.test.ts`) read `plugin-server-dist`, not these folders.
- Jobs `browser-default (1)` to `(3)`: the runner site is now the launch tree. The shards balance by `ciSeconds` of the registry, which come from off-tree runs. The times here are near them, but `qa` was 232 s against 358 s.
- Job `browser-webkit-board (input)` runs `web-online` and `signin-speed` on WebKit, and the default shards run `next-art-wait` and `daylight-tabs` on WebKit as well (`ciBrowsers`). No WebKit run was made here: this is the first test of the launch tree on WebKit in a pull request. Look first at the offline install of `web-online` and at the new `signin-speed` rule that `next.html` also installs the worker.
- Job `play-scenes`: it builds the launch tree with the test pages. It passed here (408.5 s; the limit in CI is 420 s × 2).
- The test shards still build the off tree in `tools/openai-challenge.test.ts` and `tools/offline-build.test.ts`, because the workflow does not set the switch for the job. Ticket 07 moves them.

### Changed expectations (not faults of the checks)

- `account`, `menu-extra`: the launch old page reads `/api/status?muse=1` when it opens Account. The check site is a static preview with no API, so the read gets 404 and the check counts a console error (run log `seam-ci-95kirz/account.log` and `menu-extra.log` of the earlier builder). The checks now answer `/api/status` with a closed status. The live site has the API.
- `signin-speed`: on the launch tree `next.html` also installs the offline worker. The assertion "Only home entry starts the offline install" (`seam-ci-Si7Bj0/signin-speed.log`) became "Only the two home pages start the offline install".
- `daylight` save check and `signin-speed`: the new page shows a one-time launch notice to a returning player. The checks set `kingdown.solo-launch-seen`.
- `web-game` Settings: the launch tree adds its Account section (Delete my account) after Log out (`src/online/launch.ts:129`). The assertion now accepts Log out as the last row or as the row just before that section, which must be the last.

### Found fault

- Possible: on the launch tree, the sign-in page of `/play/` links "Play on this device" to `/` (`src/online/entry.ts:67`). That is the new page, not the old board where the player came from. `account-discovery` fails there (run `seam-ci-eZEprN/account-discovery.log`, time-out at line 81). The lead decides if this is a fault or the design of the launch.
- Possible: on the launch tree, Log out is no longer the last Settings row; "Delete my account" comes after it. The old assertion (`web-game-check.mjs`, "Log out is the last Settings row") failed in `seam-ci-Si7Bj0/web-game.log`. The launch code puts the section there on purpose, so this ticket records it and does not judge it. The lead decides if it is a fault.

### Red and green

- Red (2026-11-25 06:54): `KINGDOWN_TEST_FILE=tools/check.test.ts npm test` with the new assertion and the stand-in that records the switch. 1 failed: "builds the site as a production launch build with the fake account project, whatever the shell holds", `expected '0' to be '1'` at `tools/check.test.ts:142`.
- Green (08:39): `npm test` with `KINGDOWN_TEST_FILE` = `tools/check.test.ts`, `tools/checks.lint.test.ts`, `tools/workflow.lint.test.ts`, `tools/web-online-check.test.ts`, `tools/lib/removed-checks.test.ts`: 5 files, 115 tests passed, 33.45 s. `npm run test:docs`: 19 files, 199 passed, 1 skipped.
- The CI verify step, run here with a throwaway PostgreSQL as the runner starts one: `KINGDOWN_SOLO_LAUNCH=1 npm run build:vercel` (22.7 s), `test ! -e dist/play-scenes.html`, `npm run check:vercel` (21.7 s, launch worker 787d05582578, 363 offline URLs), `KINGDOWN_SOLO_LAUNCH=0 npm run build:vercel` (29.6 s), `npm run check:vercel` (24.8 s, off worker dbec0deb2ec8, 322 offline URLs). All exit 0.

Browser checks on the launch tree, one run each, in sequence (`npm run check:browser <names>`):

| Check | Result | Time |
| --- | --- | --- |
| read-piece, verb-marks, turn, end, their-turn, game-screen, menu-extra, home, account | ok | 5.1, 3.2, 21.2, 68.0, 11.9, 9.1, 10.5, 13.0, 64.2 s |
| cursor-adoption, character-clips, new-game, powers, special-moves, ux-defects, visual-design, qa | ok | 43.3, 44.5, 38.2, 6.2, 41.7, 25.8, 27.4, 232.0 s |
| painted-leaps, character-prepare, selftest | ok | 28.4, 13.6, 1.9 s |
| leap-start | ok on the second run | 33.7 s |
| next-art-wait, daylight-tabs, layout-result, next-save, muse-docs (not moved; same site build) | ok | 29.8, 45.1, 7.3, 5.9, 2.3 s |
| layout-zoom, ui-review-samples, king-capture-facing, character-runtime, motion-concepts | ok | 3.7, 40.8, 71.2, 170.6, 51.0 s |
| king-effects, painted-game (GPU; already at `/index.html`) | ok | 147.3, 173.6 s |
| web-game, web-online, signin-speed | ok | 75.1, 142.6, 47.4 s |
| shared-mechanics, web-game-staging, desktop-performance, staging-login | ok | 143.5, 97.0, 100.0, 24.2 s |
| play-scenes (alone, with the test pages, as CI runs it) | ok | 408.5 s |
| layout-title, stratus-idle-exit, stratus-registration, lessons, link-game, lesson-return, workshop, workshop-cast | fail; old faults | see below |
| account-discovery | fail | see below |
| recovery-consumers | not run | needs an outside `KINGDOWN_WEB_RECOVERY_OUTPUT` |

- The first run of `leap-start` failed because this ticket file changed during the run (the runner refuses a changed checkout). The second run failed once on time ("knight white SE warm: 1317 ms, limit 150 ms"; the other 15 cases passed). The third run passed. The check asserts time, so the one slow case is most likely machine load. Not proven.
- Old faults: the 8 by-name checks also fail on an off-tree build of this worktree (`KINGDOWN_SOLO_LAUNCH=0`, the same scripts, the old board at `/index.html`): the same assertion or time-out in each. `stratus-idle-exit` fails with a time-out on the launch tree and with "exit changes the pose" on the off tree. Five of them are parked (docs/PARKED.md). So these are not faults of the launch tree. They are moved, and they stay red as before.
- `account-discovery` is moved only in part: the first visit uses `/index.html`, and the offline step expects `/index.html`. It then fails at `tools/lib/account-discovery-check.mjs:81`: the "Play on this device" link of the sign-in page goes to `/` (`src/online/entry.ts:67`), which is the new page on the launch tree, and the check waits for the old board there. The rest of the journey needs a launch-tree design; it is not an address change. See "Found fault".
- `staging-login`: its own solo game now opens the hand-over dialog of the old page, not the board (`tools/lib/staging-login-check.mjs:58`).

### Not verified

- WebKit. CI runs `web-online`, `signin-speed`, `next-art-wait` and `daylight-tabs` also on WebKit. All runs here are Chromium.
- The CI run itself. It needs the lead.
- `recovery-consumers` (it needs an outside output) and `account-discovery` past line 81.
- The cause of the one slow `leap-start` case.

# CI builds the tree that ships

Status: done on branch seam-ci; reviewed, repaired and checked.

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
- `account-discovery` stays red; ticket [09](09-account-discovery-launch.md) holds the work. Before this ticket it ran on an off-tree build of its own; now `web-game-check.mjs` sets the switch for every mode (`tools/lib/registry.mjs:106`). It runs only by name, so CI stays green. The lead decided that the "Play on this device" link of `/play/` is correct (see "Found fault").
- In `web-online`, the offline install step opens `/index.html`, so it tests the worker of the old board. No step of `web-online` installs the worker from `/` on a fresh profile. The offline game-link step shows that `/` loads from the cache, but only after `/index.html` installed the worker. In CI, the only registration check of the new page is the `daylight` entry of `signin-speed` (`next.html`, `tools/lib/signin-speed-check.mjs:85`).
- The route loop of `web-online` (`tools/web-online-check.mjs:660`) accepts `/index.html` or `/join.html` for each path. It checks the status and the content type, not which page each route gives. An assertion against `static/solo-launch.json` only compares the route table with the condition that made it (`tools/plugin-server-build.mjs:41`). The join part of `web-game` checks `/j` end to end.

## The checks that open `/` for the old board

The list comes from `tools/lib/registry.mjs` and a read of each script. Each one now opens `oldBoard()` (`tools/lib/checks.mjs`), which is `index.html` on the check site.

- Default checks (a local run with no name, and the CI shards `browser-default`): `read-piece`, `verb-marks`, `turn`, `end`, `their-turn`, `game-screen`, `menu-extra`, `home`, `account`, `cursor-adoption`, `character-clips`, `new-game`, `powers`, `special-moves`, `ux-defects`, `visual-design`, `qa`, `leap-start`, `character-prepare`. That is 19.
- Checks that CI runs by name: `web-online` (each visit of the old board, and `/` for the offline install), `signin-speed` (the home entry). `web-game` opens no root page; its join and solo parts change (see below).
- The by-name modes of `tools/web-game-check.mjs`, which now build the launch tree too: `account-discovery` opens `/` for the old board. `staging-login` opens an own solo game, which the launch tree hands to the local board. `shared-mechanics`, `recovery-consumers`, `desktop-performance` and `web-game-staging` open no root page.
- Checks that run only by name: `painted-leaps` (the script of `leap-start`), `layout-title` and `layout-zoom` (`tools/verify-layout.mjs`), `ui-review-samples`, `king-capture-facing`, `stratus-idle-exit`, `stratus-registration`, `character-runtime` (also through its throttle proxy, and `tools/lib/character-effects-game-check.mjs`), `motion-concepts`. The parked checks (docs/PARKED.md): `lessons`, `link-game`, `lesson-return`, `workshop`, `workshop-cast`.
- Plugin checks that also open the site (`site: true`): `gui-board-preview`, `gui-board-a8`, `gui-board-a15`, `gui-board-a18` open the old board through `docs/specs/gui-previews-2026-10-19/capture.mjs`. It now opens `index.html` on the check site or on a saved web build.
- `tools/lib/error-recorder-check.mjs` (the default mode of `web-game`) opens `/` on purpose: it tests the error recorder of the root page, which is now the new page that players get at `/`.
- Already at `/index.html` before this ticket: the GPU checks `king-effects` and `painted-game`, and `king-labels`. They keep their own address.
- Not moved, because they do not open the runner's site: `movement-runtime`, `effects-states` and `effects-game` start a Vite dev server of the source; `cache-registration` serves its own fixture page; `production-comparison` serves the two trees that its caller names; `owner-playtest-b`, `w6-parts` and `search-worker` start their own server. The `play/friend` visit of `ui-review-samples` is not the root, so it stays.

In all, 43 registry entries open the old board. This ticket moves 40: 33 to the helper, `web-online`, `signin-speed` and `account-discovery` to `/index.html` on the server that they start themselves, and the 4 board previews to `index.html` in their capture script. The other 3 had their own address before. The first step of the ticket estimated about 18; the 19 default checks are near that estimate, and the by-name checks are the rest.

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
- Job `browser-webkit-board (input)` runs `web-online` and `signin-speed` on WebKit. No WebKit run of them was made here: this is their first test of the launch tree on WebKit in a pull request. Look first at the offline install of `web-online` and at the new `signin-speed` rule that `next.html` also installs the worker. (`next-art-wait` and `daylight-tabs` open WebKit themselves, so the runs here covered WebKit for them.)
- `leap-start` asserts time and is a default check. It failed once here on one case (see below). Watch it in the default shards.
- Job `play-scenes`: it builds the launch tree with the test pages. It passed here in 408.5 s, near its local limit of 420 s (`tools/lib/registry.mjs:125`). The limit in CI is 420 s × 2, and `ciSeconds` is 320 from off-tree runs. If the CI time comes near the CI limit, change `ciSeconds` or the limit.
- The test shards still build the off tree in `tools/openai-challenge.test.ts` and `tools/offline-build.test.ts`, because the workflow does not set the switch for the job. Ticket 07 moves them.

### Changed expectations (not faults of the checks)

- `account`, `menu-extra`: the launch old page reads `/api/status?muse=1` when it opens Account. The check site is a static preview with no API, so the read gets 404 and the check counts a console error (run log `seam-ci-95kirz/account.log` and `menu-extra.log` of the earlier builder). The checks now answer `/api/status` with a closed status. The live site has the API.
- `signin-speed`: on the launch tree `next.html` also installs the offline worker. The assertion "Only home entry starts the offline install" (`seam-ci-Si7Bj0/signin-speed.log`) became "Only the two home pages start the offline install".
- `daylight` save check and `signin-speed`: the new page shows a one-time launch notice to a returning player. The checks set `kingdown.solo-launch-seen`.
- `web-game` Settings: the launch tree adds its Account section (Delete my account) after Log out (`src/online/launch.ts:129`). The assertion now accepts Log out as the last row or as the row just before that section, which must be the last.

### Found fault

- Possible: on the launch tree, the sign-in page of `/play/` links "Play on this device" to `/` (`src/online/entry.ts:67`). That is the new page, not the old board where the player came from. `account-discovery` fails there (run `seam-ci-eZEprN/account-discovery.log`, time-out at line 81). Lead decision, 2026-11-25: this is the design. On the launch tree, `/` is the page where a player plays on this device. The check is wrong, not the page; ticket [09](09-account-discovery-launch.md) changes the check.
- Possible: on the launch tree, Log out is no longer the last Settings row; "Delete my account" comes after it. The old assertion (`web-game-check.mjs`, "Log out is the last Settings row") failed in `seam-ci-Si7Bj0/web-game.log`. The launch code puts the section there on purpose. Lead decision, 2026-11-25: this is the design, not a fault.

### Red and green

- Red (2026-11-25 06:54, a run of the first builder of this lane): `KINGDOWN_TEST_FILE=tools/check.test.ts npm test` with the new assertion and the stand-in that records the switch. 1 failed: "builds the site as a production launch build with the fake account project, whatever the shell holds", `expected '0' to be '1'` at `tools/check.test.ts:142`.
- Green (08:39): `npm test` with `KINGDOWN_TEST_FILE` = `tools/check.test.ts`, `tools/checks.lint.test.ts`, `tools/workflow.lint.test.ts`, `tools/web-online-check.test.ts`, `tools/lib/removed-checks.test.ts`: 5 files, 115 tests passed, 33.45 s. `npm run test:docs`: 19 files, 199 passed, 1 skipped.
- The CI verify step, run here with a throwaway PostgreSQL as the runner starts one: `KINGDOWN_SOLO_LAUNCH=1 npm run build:vercel` (22.7 s), `test ! -e dist/play-scenes.html`, `npm run check:vercel` (21.7 s, launch worker 787d05582578, 363 offline URLs), `KINGDOWN_SOLO_LAUNCH=0 npm run build:vercel` (29.6 s), `npm run check:vercel` (24.8 s, off worker dbec0deb2ec8, 322 offline URLs). All exit 0.

Browser checks on the launch tree, one run each, in sequence (`npm run check:browser <names>`):

| Check | Result | Time |
| --- | --- | --- |
| read-piece, verb-marks, turn, end, their-turn, game-screen, menu-extra, home, account | ok | 5.1, 3.2, 21.2, 68.0, 11.9, 9.1, 10.5, 13.0, 64.2 s |
| cursor-adoption, character-clips, new-game, powers, special-moves, ux-defects, visual-design, qa | ok | 43.3, 44.5, 38.2, 6.2, 41.7, 25.8, 27.4, 232.0 s |
| painted-leaps, character-prepare, selftest | ok | 28.4, 13.6, 1.9 s |
| leap-start | ok on the third run | 33.7 s |
| next-art-wait, daylight-tabs, layout-result, next-save, muse-docs (not moved; same site build) | ok | 29.8, 45.1, 7.3, 5.9, 2.3 s |
| layout-zoom, ui-review-samples, king-capture-facing, character-runtime, motion-concepts | ok | 3.7, 40.8, 71.2, 170.6, 51.0 s |
| king-effects, painted-game (GPU; already at `/index.html`) | ok | 147.3, 173.6 s |
| web-game, web-online, signin-speed | ok | 75.1, 142.6, 47.4 s |
| shared-mechanics, web-game-staging, desktop-performance, staging-login | ok | 143.5, 97.0, 100.0, 24.2 s |
| play-scenes (alone, with the test pages, as CI runs it) | ok | 408.5 s |
| gui-board-preview | ok | 175.1 s |
| layout-title, stratus-registration, lessons, link-game, lesson-return, workshop, workshop-cast | fail; old faults | see below |
| stratus-idle-exit | fail; old fault not proven | see below |
| account-discovery | fail | see below |
| recovery-consumers | not run | needs an outside `KINGDOWN_WEB_RECOVERY_OUTPUT` |

- The first run of `leap-start` failed because this ticket file changed during the run (the runner refuses a changed checkout). The second run failed once on time ("knight white SE warm: 1317 ms, limit 150 ms"; the other 14 cases passed). The third run passed. In the first run the same case took 9 ms. The check asserts time, so the one slow case is most likely machine load. Not proven.
- Old faults: 7 by-name checks also fail on an off-tree build of this worktree (`KINGDOWN_SOLO_LAUNCH=0`, the same scripts, the old board at `/index.html`): the same assertion or time-out at the same line in each. Five of them are parked (docs/PARKED.md). So these 7 are not faults of the launch tree. They are moved, and they stay red as before. Ticket [10](10-red-by-name-checks.md) holds them and `stratus-idle-exit`.
- `stratus-idle-exit`: not proven. On the off tree it fails at `tools/verify-stratus-idle-exit.mjs:36` ("exit changes the pose"). On the launch tree it passes line 36 and times out at line 121. The off run stops at line 36 and does not reach line 121. So no run shows that line 121 also fails on the off tree. It runs only by name, not in CI.
- `account-discovery` is moved only in part: the first visit uses `/index.html`, and the offline step expects `/index.html`. It then fails at `tools/lib/account-discovery-check.mjs:81`: the "Play on this device" link of the sign-in page goes to `/` (`src/online/entry.ts:67`), which is the new page on the launch tree, and the check waits for the old board there. The rest of the journey needs a launch-tree design; it is not an address change. See "Found fault".
- `staging-login`: its own solo game now opens the hand-over dialog of the old page, not the board (`tools/lib/staging-login-check.mjs:58`).

### Not verified

- WebKit for `web-online` and `signin-speed`. CI runs them also on WebKit; the runs here are Chromium.
- `gui-board-a8`, `gui-board-a15`, `gui-board-a18` one by one. `gui-board-preview` covers their screens (A8, A15, A18, A39) and passed (175.1 s).
- The CI run itself. It needs the lead.
- `recovery-consumers` (it needs an outside output) and `account-discovery` past line 81.
- The cause of the one slow `leap-start` case.
- If the time-out of `stratus-idle-exit` at line 121 is an old fault (see above).
- The by-name checks that read `next.html` or `index.html` on the runner site, which is now the launch tree: `next-menus` (`tools/verify-next-menus.mjs:31`), `next-skylift` (`tools/verify-next-skylift.mjs:13`), `next-rule-text` (`tools/verify-next-rule-text.mjs:16`) and `king-labels` (`tools/verify-king-labels.mjs:8`, `:62`). On the launch tree `next.html` is the launch page (`vite.config.ts:194`). No run of the build covered them. After the first CI run, the `notice` case of `next-menus` ran here and passed (see "Review").

## Review

- Kind: an independent review by an agent that did not build the change. It read head `3aeea07c576f573e1bb43c417d3efc7c8b6c834d`.
- Findings: 1 blocking (the commit removed the web call of `checkSoloSync` with no `Removed-check:` trailer) and 7 notes (two wrong numbers for `leap-start`, `stratus-idle-exit` not proven old, `account-discovery` with no ticket, one wrong comment in `web-online`, the loose route loop, by-name checks not run, `play-scenes` near its limit).
- One batch repairs them:
  - The first commit has a new message with a 19th trailer for the web call of `checkSoloSync`. Its tree did not change. The two commits now have new hashes: `52ab76b8c` (was `5ea3ab3c2`) and `8390878b7` (was `3aeea07c5`).
  - `tools/web-online-check.mjs:635`: the comment names the old board at `/index.html`.
  - This file: `leap-start` numbers (14 other cases, ok on the third run); `stratus-idle-exit` is "not proven"; "Known limits" holds `account-discovery`, the worker of `/` in `web-online` and the route loop; "Not verified" holds the four by-name checks and `stratus-idle-exit`; the CI watch list holds the `play-scenes` time.
  - Runs after the batch: `KINGDOWN_TEST_FILE=tools/web-online-check.test.ts npm test` (1 file, 42 passed); `npm run test:docs` (19 files, 199 passed, 1 skipped). The batch changes no check step, so no browser check ran again.
- Check of the batch, by the same reviewer, on head `08ce70de4`: the blocker is closed; no blocking finding; no new fault.
- The first CI run (head `0e1998312`) was red in one job. `play-scenes` runs `MENUS_CASES=notice npm run check:browser next-menus` (`.github/workflows/plugin-checks.yml:196`), and the four sizes of the case timed out. Cause: the case stores a signed-in session before the first visit, so the launch page shows its notice to a returning player and waits for Continue (`src/interface/platform.ts`). The build and the review listed `next-menus` as not verified. They did not see that CI runs this case.
- Repair by the lead: the runner of `tools/verify-next-menus.mjs` sets the seen mark of the notice on each context. The line that set the mark for `result_reload` only goes. `src/interface/platform.test.ts` tests the notice. Run on the launch tree with the CI command: the `notice` case was red before (four time-outs, 49.7 s) and is ok after (12.2 s).
- Not verified: the 22 other cases of `next-menus` on the launch tree. The lead runs them with ticket 07, on the one tree that stays.

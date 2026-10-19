# PR 61 merge record (ticket 08, steps 1, 2 and 6)

## Step 1

Record scope: ticket 08, steps 1, 2, and 6 only. The fixed source is the PR 61 merge. The plan and source worktrees stay unchanged. This run uses Git, saved records, and read-only CI calls. It runs no tests or browser checks.

- Merge: `cd8fa9f27ecd9a1f193f4be75660db4fe42a819d` (`cd8fa9f2`).
- Tree: `1183dd83b7789ff5f250233a005f79bec6e52f87`.
- Merge time: 2026-10-19 03:53:54 UTC (2026-10-18 20:53:54 in Los Angeles).
- Parents: `b5327dd2bab71b0eaab994ff329f149780d310b5` and `db3d4d449709e8768a8008def5ef5f7da00d6cfc`.
- Plan base: `442c5eb3840164b05d579c03b9fce2a9136d31f9`.
- Source commands: `git rev-parse cd8fa9f2 cd8fa9f2^{tree}`, `git show -s cd8fa9f2`, `git diff --stat 442c5eb3 cd8fa9f2`, and `git diff --numstat 442c5eb3 cd8fa9f2`.

**Path delta against the plan base**

The delta has 67 paths, 6,164 added lines, and 111 removed lines. The tables give each path, grouped by area. The added planning files are records. They are not new runtime features.

**CI** — 1 path; +4 / −2.

| Path | Added | Removed |
|---|---:|---:|
| .github/workflows/plugin-checks.yml | 4 | 2 |

**Task index** — 1 path; +1 / −0.

| Path | Added | Removed |
|---|---:|---:|
| TASKS.md | 1 | 0 |

**Web research** — 16 paths; +3491 / −0.

| Path | Added | Removed |
|---|---:|---:|
| docs/research/web-adaptation-2026-10-18/README.md | 22 | 0 |
| docs/research/web-adaptation-2026-10-18/critic.md | 341 | 0 |
| docs/research/web-adaptation-2026-10-18/decision-review-product.md | 77 | 0 |
| docs/research/web-adaptation-2026-10-18/decision-review-scope.md | 76 | 0 |
| docs/research/web-adaptation-2026-10-18/decision-review-security.md | 113 | 0 |
| docs/research/web-adaptation-2026-10-18/decisions-draft.md | 38 | 0 |
| docs/research/web-adaptation-2026-10-18/lane-checks.md | 277 | 0 |
| docs/research/web-adaptation-2026-10-18/lane-client.md | 222 | 0 |
| docs/research/web-adaptation-2026-10-18/lane-decisions.md | 451 | 0 |
| docs/research/web-adaptation-2026-10-18/lane-look.md | 475 | 0 |
| docs/research/web-adaptation-2026-10-18/lane-screens.md | 384 | 0 |
| docs/research/web-adaptation-2026-10-18/lane-server.md | 308 | 0 |
| docs/research/web-adaptation-2026-10-18/lane-shared.md | 287 | 0 |
| docs/research/web-adaptation-2026-10-18/research-engines.md | 85 | 0 |
| docs/research/web-adaptation-2026-10-18/research-identity.md | 154 | 0 |
| docs/research/web-adaptation-2026-10-18/research-routes.md | 181 | 0 |

**Plugin release records** — 9 paths; +586 / −2.

| Path | Added | Removed |
|---|---:|---:|
| docs/specs/chatgpt-mvp/issues/45-pr61-linux-ci.md | 30 | 0 |
| docs/specs/chatgpt-mvp/issues/47-pr61-codex-sweep.md | 81 | 0 |
| docs/specs/chatgpt-mvp/issues/48-vault-check-deal.md | 40 | 0 |
| docs/specs/chatgpt-mvp/issues/49-pr61-webkit-board-flakes.md | 127 | 0 |
| docs/specs/chatgpt-mvp/issues/50-pr61-anim-cursor-flake.md | 78 | 0 |
| docs/specs/chatgpt-mvp/issues/51-pr61-plugin-ui-races.md | 82 | 0 |
| docs/specs/chatgpt-mvp/issues/52-pr61-board-size-races.md | 146 | 0 |
| docs/specs/chatgpt-mvp/release/RUNBOOK.md | 1 | 1 |
| docs/specs/chatgpt-mvp/release/cron-mvp.sql | 1 | 1 |

**Web plan** — 23 paths; +1646 / −0.

| Path | Added | Removed |
|---|---:|---:|
| docs/specs/web-adaptation/comparison.md | 65 | 0 |
| docs/specs/web-adaptation/inventory.md | 202 | 0 |
| docs/specs/web-adaptation/issues/01-baseline.md | 39 | 0 |
| docs/specs/web-adaptation/issues/02-shared-client.md | 37 | 0 |
| docs/specs/web-adaptation/issues/03-http-contract.md | 59 | 0 |
| docs/specs/web-adaptation/issues/04-test-reuse.md | 32 | 0 |
| docs/specs/web-adaptation/issues/05-one-account.md | 33 | 0 |
| docs/specs/web-adaptation/issues/06-hosting-routes.md | 33 | 0 |
| docs/specs/web-adaptation/issues/07-engine-compatibility.md | 43 | 0 |
| docs/specs/web-adaptation/issues/08-release-evidence.md | 37 | 0 |
| docs/specs/web-adaptation/issues/09-web-play.md | 51 | 0 |
| docs/specs/web-adaptation/issues/10-account-entry.md | 52 | 0 |
| docs/specs/web-adaptation/issues/11-save-ownership.md | 55 | 0 |
| docs/specs/web-adaptation/issues/12-scope-picks.md | 62 | 0 |
| docs/specs/web-adaptation/issues/13-routes.md | 71 | 0 |
| docs/specs/web-adaptation/issues/14-visual-sample.md | 57 | 0 |
| docs/specs/web-adaptation/issues/15-public-safety.md | 47 | 0 |
| docs/specs/web-adaptation/issues/16-test-gate.md | 54 | 0 |
| docs/specs/web-adaptation/issues/17-release-route.md | 37 | 0 |
| docs/specs/web-adaptation/issues/18-approve-spec.md | 37 | 0 |
| docs/specs/web-adaptation/map.md | 55 | 0 |
| docs/specs/web-adaptation/spec.md | 368 | 0 |
| docs/specs/web-adaptation/test-gate.md | 120 | 0 |

**Plugin source and source tests** — 8 paths; +181 / −23.

| Path | Added | Removed |
|---|---:|---:|
| src/plugin/app.test.ts | 108 | 0 |
| src/plugin/app.ts | 10 | 8 |
| src/plugin/client.test.ts | 22 | 0 |
| src/plugin/client.ts | 20 | 5 |
| src/plugin/screens/board.ts | 2 | 2 |
| src/plugin/screens/wait.ts | 11 | 6 |
| src/plugin/state.test.ts | 6 | 0 |
| src/plugin/state.ts | 2 | 2 |

**Check tools** — 9 paths; +255 / −84.

| Path | Added | Removed |
|---|---:|---:|
| tools/lib/checks.mjs | 5 | 4 |
| tools/lib/plugin-android-check.mjs | 2 | 2 |
| tools/lib/plugin-cards-check.mjs | 5 | 1 |
| tools/lib/plugin-k-picks-check.mjs | 2 | 1 |
| tools/plugin-board.test.ts | 87 | 40 |
| tools/plugin-ios-size.test.ts | 45 | 12 |
| tools/plugin-ui-check.mjs | 100 | 24 |
| tools/plugin-ui-harness.ts | 3 | 0 |
| tools/workflow.lint.test.ts | 6 | 0 |

**Changed inventory rows**

The IDs below come from the plan copy of `docs/specs/web-adaptation/inventory.md`. A test-path change updates evidence for a row. It does not prove a new product feature. No inventory class or work-unit count changes.

| Row ID | What changes after the plan base | File at the merge |
|---|---|---|
| A13 | The cron comment now matches the existing 30-day outbox cleanup. No schedule or SQL action changes. | docs/specs/chatgpt-mvp/release/cron-mvp.sql |
| A16 | CI adds Chromium wait scaling. The verify and Chromium browser jobs each get a 30-minute limit. The workflow keeps its build, smoke, protocol, and output checks. | .github/workflows/plugin-checks.yml; tools/lib/checks.mjs; tools/workflow.lint.test.ts |
| B01 | The shared hall entry gets the corrected settings/connect state and reload behavior through its app controller. No hall preset or chat-draft feature lands in this delta. | src/plugin/app.ts; src/plugin/app.test.ts |
| B10 | Cancel and Switch now use a command origin. Late replies cannot route a newer screen. | src/plugin/screens/wait.ts; src/plugin/app.test.ts |
| B14 | The held shove/swap line uses Select. Its preview rule stays the same. | src/plugin/screens/board.ts |
| B15 | The armed-card target line uses Select. Direct coin arming remains later work. | src/plugin/screens/board.ts |
| B21 | A name request keeps its caller and return screen through saved widget state. | src/plugin/app.ts; src/plugin/client.ts; src/plugin/app.test.ts; src/plugin/client.test.ts |
| B24 | A new user command clears an old error as well as a refusal. A successful settings read clears a connect notice. A first settings-load failure uses connect recovery. | src/plugin/state.ts; src/plugin/state.test.ts; src/plugin/app.ts; src/plugin/app.test.ts |
| B25 | The client admits three concurrent tool calls and queues the rest. Saved name-return state and wait-screen origins keep stale work from taking over. | src/plugin/client.ts; src/plugin/client.test.ts; src/plugin/app.ts; src/plugin/screens/wait.ts |
| B28 | Board-size evidence waits for the layout state under test. Product size CSS does not change. | tools/plugin-ios-size.test.ts; tools/plugin-board.test.ts |
| B29 | Swipe and layout checks wait for native scroll and stable bounds. This is check evidence, not a new touch policy. | tools/plugin-ios-size.test.ts; tools/plugin-board.test.ts; tools/lib/plugin-android-check.mjs |
| B30 | Card and picker checks remove browser focus/timing assumptions. Select words change in the two board hints. | tools/lib/plugin-cards-check.mjs; tools/lib/plugin-k-picks-check.mjs; tools/plugin-ui-check.mjs; src/plugin/screens/board.ts |
| B31 | App regressions, board probes, remount waits, and the harness add evidence for recovery and races. | src/plugin/app.test.ts; src/plugin/client.test.ts; tools/plugin-board.test.ts; tools/plugin-ui-check.mjs; tools/plugin-ui-harness.ts |
| B32 | Device-size, animation, cursor, control, and viewport checks use stable observations. CI wait scaling is 2 for Chromium and 3 for WebKit; checked timing limits do not use that scale. | tools/plugin-board.test.ts; tools/plugin-ios-size.test.ts; tools/lib/checks.mjs; tools/lib/plugin-android-check.mjs; tools/plugin-ui-check.mjs |
| B33 | The runbook now states that daily cleanup deletes outbox rows made or done more than 30 days ago. The PR fault tickets add check records. | docs/specs/chatgpt-mvp/release/RUNBOOK.md; docs/specs/chatgpt-mvp/issues/45-pr61-linux-ci.md; issues/47-pr61-codex-sweep.md through issues/52-pr61-board-size-races.md in that folder, except 46 |
| D03 | Private widget state also stores handle_back and name_for_caller. This does not supply browser storage. | src/plugin/client.ts; src/plugin/client.test.ts; src/plugin/app.ts |
| D04 | An inline home route keeps its queued destination during connect and reload. | src/plugin/app.ts; src/plugin/app.test.ts |
| D05 | The host lifecycle controller keeps the queued screen at initial navigation. Remount checks wait for that lifecycle to finish. | src/plugin/app.ts; tools/plugin-ui-check.mjs; tools/plugin-ui-harness.ts |
| D09 | The named plugin browser checks get repaired observations and CI coverage. These remain plugin regressions. | .github/workflows/plugin-checks.yml; tools/plugin-ui-check.mjs; tools/lib/checks.mjs |

The runbook and cron changes close the inventory's release-packet text fault. They do not change `src/online/jobs.ts` or apply a database change. The new web research, plan, and TASKS entry add planning records; they do not change the runtime rows.

There is no delta from `442c5eb3` in the shared renderer, shared table CSS, public pages, web entry, API, match service, online service, or migrations. Thus A03–A06 and A17 have no further runtime change in this comparison. Their earlier changes remain in the accepted source. Step 5 still owns the live-web baseline and render comparison. The `04b7af87` live worktree is a supplied source reference; this run does not check what the site serves now.

## Step 2

**Existing CI evidence**

Read-only calls: `gh pr view 61 --json statusCheckRollup`; `gh run list --branch claude/release-candidate`; `gh run list --branch main --limit 10`; and `gh run view <id>` with job data and saved logs. The saved job records are `run-39176331400.json`, `run-39176331491.json`, and `run-39196850801.json` beside this file. The matching `.log` files hold the existing CI output.

PR 61 head is `db3d4d449709e8768a8008def5ef5f7da00d6cfc`. The run API reports this head. All four PR job checkout logs identify the temporary PR merge `7664bd9599b8e74238968998c999d8ea0abf9a8f` as the tested source. These PR results are not a direct test of `cd8fa9f2`. The main-push jobs below check that final merge itself.

| Run and event | Job | Result | Checked commit | Tests or checks; skips |
|---|---|---|---|---|
| [39176331400](https://github.com/SaarShai/king-down-chess/actions/runs/39176331400), PR, 2026-10-18 UTC | test | success | 7664bd9599b8e74238968998c999d8ea0abf9a8f; PR head db3d4d44 | Full npm test on Node 22: 179 files pass, 12 files skip; 3,028 tests pass, 164 skip. The 51 drawing tests pass, with zero skips. No job step skips. |
| [39176331491](https://github.com/SaarShai/king-down-chess/actions/runs/39176331491), PR, 2026-10-18 UTC | verify | success | 7664bd9599b8e74238968998c999d8ea0abf9a8f; PR head db3d4d44 | Full npm test on Node 24 with PostgreSQL 17: 191 files pass; 3,183 tests pass, 9 skip. The 51 drawing tests pass. Plugin build, server check, smoke, protocol, build:vercel, and check:vercel pass. No job step skips. |
| Same run | browser | success | 7664bd9599b8e74238968998c999d8ea0abf9a8f; PR head db3d4d44 | Chromium: plugin-oauth, plugin-ui, plugin-ui-http all pass. No requested browser check skips. The failure-only artifact upload step skips. |
| Same run | browser-webkit | success | 7664bd9599b8e74238968998c999d8ea0abf9a8f; PR head db3d4d44 | WebKit: the board, ios-size, and preview-size selection passes all 161 tests in 3 files, with zero skips. The 51 drawing tests pass. Named plugin-ui passes. The failure-only artifact upload step skips. |
| [39196850801](https://github.com/SaarShai/king-down-chess/actions/runs/39196850801), main push, 2026-10-19 UTC | verify | success | cd8fa9f27ecd9a1f193f4be75660db4fe42a819d | Full npm test on Node 24 with PostgreSQL 17: 191 files pass; 3,183 tests pass, 9 skip. The 51 drawing tests pass. Plugin build, server check, smoke, protocol, build:vercel, and check:vercel pass. No job step skips. |
| Same run | browser | success | cd8fa9f27ecd9a1f193f4be75660db4fe42a819d | Chromium: plugin-oauth, plugin-ui, plugin-ui-http all pass. No requested browser check skips. The failure-only artifact upload step skips. |
| Same run | browser-webkit | success | cd8fa9f27ecd9a1f193f4be75660db4fe42a819d | WebKit: all 161 selected tests in 3 files pass, with zero skips. The 51 drawing tests pass. Named plugin-ui passes. The failure-only artifact upload step skips. |

The main-push run starts at 03:54:04 UTC on 2026-10-19. All three jobs end with success. The PR status rollup has the four successful jobs above. Earlier failed or cancelled runs use older heads. They do not replace the final pass. The separate Test workflow has only a PR trigger, so there is no separate Node 22 Test job on the main push.

**Skip details and CI limits**

- The nine skips in each verify job are eight opt-in balance drift tests in `src/balance/schema.test.ts`, plus the pinned-history check in `tools/public-tree.docs.test.ts`. The latter skips in a shallow checkout. The workflow uses the default shallow checkout.
- The PR Test job has no test database. Its 164 skips comprise those nine plus 155 database-dependent cases. The 12 fully skipped files are `src/plugin/server.db.test.ts` (41), `src/match/service.db.test.ts` (20), `src/match/setup.db.test.ts` (14), `src/match/matchmaking.db.test.ts` (21), `src/online/accounts.db.test.ts` (10), `src/match/results.db.test.ts` (18), `src/online/jobs.db.test.ts` (11), `src/api/http.db.test.ts` (4), `tools/plugin-db/review-signup-hook.db.test.ts` (3), `tools/plugin-db/migrations.db.test.ts` (2), `tools/plugin-db/seed-review.db.test.ts` (2), and `tools/plugin-db/role-lock.db.test.ts` (3). Four cases in `tools/plugin-db/release-packet.db.test.ts` and two in `tools/engines.test.ts` also need that database. The verify job runs those cases with its disposable database.
- CI runs Linux browsers. The verify and Chromium browser job limits are 30 minutes. The WebKit job limit is 45 minutes. Chromium waits use the CI factor 2; WebKit waits use factor 3. `tools/lib/checks.mjs` keeps measured animation and reply budgets outside that scale. These are CI passes under those settings.
- The WebKit job selects three browser files; it does not run the full source suite in WebKit. It also runs named plugin-ui. The Chromium job runs three named plugin checks. Neither job runs the complete default web-browser suite or the new top-level web account flow.

**Device evidence in the plugin records**

| Device or test surface | Date and source | Evidence | Limit |
|---|---|---|---|
| Owner iPhone, native ChatGPT iOS app; screenshot 393 × 852 pt | 2026-10-15; `docs/specs/chatgpt-mvp/issues/21-iphone-test-fixes.md`, Problem and Checks | The owner reports duplicate Play choices, two random-player routes with the same words, and a board about 45 pt tall. The screenshot measures a 349 pt table inside a screen about 570 pt tall. This is real-device fault evidence. | The record gives no phone model, app version, OS version, or exact source commit for that screenshot. The native-device fix recheck stays open. It is not a pass at cd8fa9f2. |
| iOS 27 Simulator, Safari, local built host | 2026-10-15; same ticket | A 402 × 542 seat table and a 222 px board fill the test screen before and after the change. | This is a simulator. The real host fault does not reproduce there. It supplies no native ChatGPT pass or real iOS swipe result. |
| M1 Chromium 1243, phone/tablet/desktop host copies | Report copied 2026-10-15; `docs/qa/reports-2026-10-15/06-device-matrix-round-1.md`; source 2e7f6295 | 27 cases × seven journeys, two passes. Ordinary journeys finish on 26 of 27 host copies. The zoom case and listed layout faults remain in that report. | Every phone and iPad is a Chromium copy. Android insets 24/80 are inferred. No physical device or native host runs. Linked raw captures remain in the original scratch folder. |
| M1 WebKit 26.6 and Chromium 153.0.8010.12, touch host copies | Report copied 2026-10-15; `docs/qa/reports-2026-10-15/06-device-matrix-round-2.md`; source 1a18046f03d986504f5f81dd26fdb6bd616a2bfe | 46 cases in each of two passes. Ordinary journeys finish; eight earlier findings are fixed. The 197 px zoom board remains unusable in that report. `docs/specs/plugin-submission/issues/06-device-matrix-qa.md` records the same results. | These are desktop browser copies, not physical iOS or Android devices. The record does not establish real-host page zoom. Raw capture links do not resolve in the copied report. |
| Android emulator follow-up | `docs/specs/chatgpt-mvp/issues/36-android-fixes.md` and `39-device-faults.md`; no completed device result or date in these records | Ticket 36 leaves the emulator check to the main session. Ticket 39 leaves the Android swipe and tap recheck to that session. | No final Android device pass appears in these files. Do not infer one from CSS or unit-test passes. |
| Native iOS swipe after the touch repair | `docs/specs/plugin-submission/issues/35-touch-scroll.md`; no completed native result in that record | The record leaves the native iOS swipe and End turn tap to the main session after merge 5. Desktop WebKit checks computed pan-y, square taps, mouse drags, and wheel bounds. | Desktop WebKit raw touch fails the positive control on this Mac. It cannot prove the native iOS pan. |
| Release live-device checklist | `docs/specs/chatgpt-mvp/release/LIVE-CHECKS.md` | The file defines the two-account web and iPhone checks. Its result cells are empty at this merge. | A checklist is not a pass record. No final real-device pass at cd8fa9f2 appears in the searched release folders. |

The historical faults above do not establish that those faults remain at the merge. They establish the limits of the available device evidence. No physical Android or iPad pass, real-device screen-reader pass, or native iOS swipe pass is present in these records.

The deploy's own `npm test` and default browser checks come later from the release owner. PR 62 adds an engine archive file and its test, with no web change, before that deploy. The deploy commit comes later from the plugin session. This record claims no pass for that later combined source.

## Step 6

The owner decision of 2026-10-18, from the plugin session and relayed in this task, is: “yes, park them and send it”. All five branches are local only. The owner parks them because they predate the client redesign, the live plugin has an OpenAI review period of one to five weeks, and od-home changes the J1 chat contract, test case P2, and the skill. The review period is the supplied owner record; this run does not check a review schedule.

Counts use `git rev-list --left-right --count cd8fa9f2...<branch>`. Its left count is behind; its right count is ahead. The table puts ahead first. Git reads use the repository at `/Users/za/Documents/king down chess`, not its working files. These counts compare to cd8fa9f2, not to the old live commit or a later deploy.

| Branch | Fixed tip | Ahead | Behind | State |
|---|---|---:|---:|---|
| claude/od-home | 06c746b0b04ac0d5da79a35a9100699762018091 | 19 | 548 | parked (owner, 2026-10-18) |
| claude/od-board | b3b52a47d0c7a5f5ed780f4a639c3b39c6e9812b | 20 | 468 | parked (owner, 2026-10-18) |
| claude/od-look | c382f95b3e06d7ece49ccb72614be3c4fb896de3 | 17 | 601 | parked (owner, 2026-10-18) |
| taste/b2-row-preview | 3bf795e71e6de4a2d621bc06f3418088a916991d | 6 | 601 | parked (owner, 2026-10-18) |
| taste/c5-seat-reveal | 97e0dca199cd0935a0d1a1508488fd656e713696 | 13 | 601 | parked (owner, 2026-10-18) |

The ahead count counts commits, not missing features. Several branch changes already exist at the merge through earlier integration. The `git log --oneline cd8fa9f2..<branch>` outputs are saved in the five `*-refs.txt` files beside this record. Each later ticket names its fixed reference tip and feature commits.

| Branch | Features and reference commits | Branch source records |
|---|---|---|
| claude/od-home | Hall tools, first friend name, chat draft, three presets, feature chips, and one More options chest: 4e3422a0, a8e6495f, 6e2bc72d. Any rules and start recovery: 5d98d933, 4928c824, 5f754cec, 23a774ab. Start is busy at once, shows Starting… at one second, frees exits at five seconds, and quietly resends after remount. Retry uses server time. The unique log also holds a report-delete test update (8b30f235); it checks an existing cleanup grant, not a new screen feature. | docs/specs/owner-decisions-2026-10-15/issues/02-home.md; 03-hall.md; 09-start-and-match.md at the branch tip |
| claude/od-board | J6 direct arming from own usable coins; cost and target words; readable faces and hand rings; Collection costs; 197 px coin and action-bar fit: 0fd664e7, f3b26387, be959074. J9 own-piece shove/swap preview and its review fixes: 95635c37, 7a077e77. Complete-turn server refusal and guide: 08f11be8, f0795e4a. The last two behaviors already exist at the merge; preserve them and check for gaps. | docs/specs/owner-decisions/issues/07-cards.md; 08-shove-swap.md; docs/specs/send-turn/issues/06-server-unfinished-turn.md at the branch tip |
| claude/od-look | Plain dim layers, system text and path logo, safe Collection tab hits, and narrow text fit: 60516586, 8ac22ad7, 51e33ecc, fcd55bcd. L2 complete move chooser, optional focused view, short-phone row, frame labels, and stronger move-mark edges: 5c325fd2, d67a8112, b689cc85, c46ecb9a, 694bbc18. The plan omits Zoom in from the web scope. Keep that proposal separate until a new choice changes the scope. | docs/specs/owner-decisions/issues/10-look.md at the branch tip; L2 b and final repair sections |
| taste/b2-row-preview | A still board or close-up last-action replay in Your games: 71b08c32, e89c7c25, 3bf795e7. Full Ogre, Beast, and Earth Quake paths; separate replay and open controls; keyboard and reduced motion. The sample choice remains open. | docs/specs/plugin-submission/issues/13-b2-row-preview.md; docs/specs/plugin-submission/samples/b2/README.md at the branch tip |
| taste/c5-seat-reveal | C5 opponent VS banner: 6eee45ee. Four dealt cards and their seat reads: aa8686b4, eb365bd8, 3d5c6269. Stone cover, lift, and gold sweep: 4fa7c930, 26bca4ee, 0e71782d. Read-state, narrow-strip, and animation-end fixes: c1a996ad, 96713212. The sample still needs the owner yes. Tall far-rank piece tips show above the cover for about 0.5 seconds in the reference. | docs/specs/seat-reveal/issues/01-c5-sample.md at the branch tip |

Read a source as `git show <fixed-tip>:<path>`. The source records name the owner picks and their limits. Plan ticket 12, Part 2 and Answer, records the shared-UI route. B2 and C5 remain subject to sample approval. J1 remains subject to its later review. Parking does not approve these open choices.

The parking meets the shared-seam condition “the approved later-update branches land or are parked”. Nobody merges, rebases, or deletes these branches. Rebuild each missing feature once on the current shared screens. The branch is a reference only. Work starts only after the plugin session hands over `src/plugin/` and the OpenAI review allows it. The parking alone does not give that handover or permission to change the live plugin during review.

## Later tickets

The staging folder is `out/later/`. Its target is `docs/specs/shared-screens-later/`. It has 27 task drafts and a README. Each task has a triage status, `Blocked by: none`, the outside-event Starts gate, an approval source, a fixed branch tip, feature commits, rebuild scope, and pass criteria. Open review or sample choices use `needs-info`. Other new-scope checks use `needs-triage`. No ticket claims build completion.

- [01-hall-tools.md](../../specs/shared-screens-later/issues/01-hall-tools.md) — Hall tools and the first friend name.
- [02-chat-draft.md](../../specs/shared-screens-later/issues/02-chat-draft.md) — J1 chat draft before Start.
- [03-setup-presets.md](../../specs/shared-screens-later/issues/03-setup-presets.md) — Three setup presets.
- [04-feature-chips.md](../../specs/shared-screens-later/issues/04-feature-chips.md) — Feature chips and named history results.
- [05-more-options.md](../../specs/shared-screens-later/issues/05-more-options.md) — More options in the setup.
- [06-any-rules.md](../../specs/shared-screens-later/issues/06-any-rules.md) — Any rules in the hall and open games.
- [07-start-feedback.md](../../specs/shared-screens-later/issues/07-start-feedback.md) — Start feedback and ways out.
- [08-quiet-resend.md](../../specs/shared-screens-later/issues/08-quiet-resend.md) — Quiet resend after a remount.
- [09-retry-server-clock.md](../../specs/shared-screens-later/issues/09-retry-server-clock.md) — Start retry on the server clock.
- [10-direct-card-use.md](../../specs/shared-screens-later/issues/10-direct-card-use.md) — Use a card or power from its coin.
- [11-card-coin-faces.md](../../specs/shared-screens-later/issues/11-card-coin-faces.md) — Readable card faces in both hands.
- [12-collection-costs.md](../../specs/shared-screens-later/issues/12-collection-costs.md) — Card and power costs in Collection.
- [13-narrow-coins.md](../../specs/shared-screens-later/issues/13-narrow-coins.md) — Coins and action words at 197 px.
- [14-own-piece-preview.md](../../specs/shared-screens-later/issues/14-own-piece-preview.md) — Keep the own-piece shove and swap preview.
- [15-whole-turn-contract.md](../../specs/shared-screens-later/issues/15-whole-turn-contract.md) — Keep the complete-turn service contract.
- [16-plain-dim.md](../../specs/shared-screens-later/issues/16-plain-dim.md) — Plain dim layers.
- [17-system-text.md](../../specs/shared-screens-later/issues/17-system-text.md) — System text and a path logo.
- [18-collection-tab-hits.md](../../specs/shared-screens-later/issues/18-collection-tab-hits.md) — Safe Collection tab targets.
- [19-move-chooser.md](../../specs/shared-screens-later/issues/19-move-chooser.md) — A complete move chooser.
- [20-focused-board.md](../../specs/shared-screens-later/issues/20-focused-board.md) — Optional focused board view.
- [21-short-board.md](../../specs/shared-screens-later/issues/21-short-board.md) — More board room on a short phone.
- [22-frame-labels.md](../../specs/shared-screens-later/issues/22-frame-labels.md) — Readable labels on the dark board frame.
- [23-move-mark-edges.md](../../specs/shared-screens-later/issues/23-move-mark-edges.md) — Clear move-mark edges.
- [24-game-row-preview.md](../../specs/shared-screens-later/issues/24-game-row-preview.md) — A board preview in Your games.
- [25-opponent-banner.md](../../specs/shared-screens-later/issues/25-opponent-banner.md) — An opponent VS banner.
- [26-seat-dealt-cards.md](../../specs/shared-screens-later/issues/26-seat-dealt-cards.md) — Read the dealt cards before Ready.
- [27-seat-reveal.md](../../specs/shared-screens-later/issues/27-seat-reveal.md) — A stone reveal over the other army.
- [README.md](../../specs/shared-screens-later/README.md) — Shared screens later work.

J1 explicitly changes P2 in both copies and the skill. Tickets 14 and 15 retain the merged preview and complete-turn paths. They close with evidence if the shared extraction leaves no gap. They do not ask for a second implementation.

## Could not check

- No local test, browser check, build, render comparison, live site probe, sign-in, database read, or database write runs here. The owner reserves this Mac for release checks. This run cannot supply ticket 08 step 5.
- Applied migrations, runtime grants, engines in active games, deploy ID, later deploy commit, and recovery record come from the release owner. Steps 3 and 4 stay open. PR 62 and the deploy are outside this run.
- The searched records give no final real-device pass at cd8fa9f2. The native iPhone recheck, real iOS swipe, Android result, and screen-reader evidence need a later owner record. Historical matrix reports use older source and browser copies. Their copied screenshot links point outside the repository and are not checked here.
- The later branch records refer to owner scratchpad approval pages and sample images outside the supplied files. This record cites the branch tickets that preserve the picks. It does not claim to inspect the original approval pages or infer a final sample yes.
- No tests of the later branches run here. Their old pass logs do not qualify the redesigned shared client. No release result from a later commit is attached to cd8fa9f2.

Verification of this record checks file shape, source paths at each fixed branch tip, feature-commit ancestry, branch counts, CI summaries, path totals, and forbidden names. It runs no project test command. Only the stated output folder receives files. No process outside this run is stopped.

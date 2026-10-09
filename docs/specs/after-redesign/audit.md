# Code audit of main, 2026-10-09

Yes. Some code and checks add work with little gain.
The main delay comes from repeated checks and one shared browser queue.
The main game file also makes many changes wait for each other.
Most game rules, art, and account checks serve a real need.
Cut repeated work first. A full rewrite gives less value.

This is a read-only audit of main at `af13c3494c8139c1c53a597646aaa08f0e8aa16c`, on 2026-10-09. No test, browser check, build, install, commit, or deploy runs for this audit. The only output is this report, outside the repo. Existing simulation files and other agents' work stay in place.

The plan is to trace the check chain, inspect its large parts, check source reuse, and rank the cuts. The evidence is source text, file counts, Git history, stored test times, and the owner's measured times. Source references use repo-relative paths. Suggested times are estimates unless the text says measured. No proposed fix is verified by a new run. A later build must meet the acceptance checks below before it uses a fix.

The owner's measurements are the time baseline: about 90 s for the unit suite alone; about 12 min for all 15 browser checks. The six slowest browser checks take 581 s in total. Thus, six checks use about 81% of the browser time. Queue wait, review, sample approval, and merge work add to these times.

The line count confirms the stated source size: 86 non-test TypeScript files in `src/`, with 20,269 lines. `src/main.ts` has 1,528 newline-delimited lines; a counter that includes its final empty line gives 1,529. There are 79 TypeScript test files with 15,903 lines, plus 15 motion test files with 550 lines. The shared non-test JavaScript in `docs/2d-first-pieces/` adds 3,498 lines. It is part of the product, although its path says docs.

The findings below are ranked by likely payoff. Time savings overlap. Do not add all the estimates.

**1. shrink: Stop full check cycles at each small build step.**

- **Evidence:** `docs/specs/web-redesign/spec.md:60` requires all unit and browser checks before each pull request. It also requires three clean runs of each new browser check. The table at `spec.md:260` has 27 steps. Ticket 00 records a full run plus three further runs of 13 changed checks at `issues/00-check-helpers.md:25`. After review fixes, it records a full run plus three further runs of six checks at line 26. These are real repeat costs, not a guess about agent conduct.
- **Cost today:** One browser pass per step costs about `27 × 12 = 324 min`, or 5.4 h, before queue wait. One 90 s unit pass per step adds 40.5 min. If an agent runs the units by hand, then pushes the same tree, the push hook adds another 40.5 min across 27 steps. On the supplied browser times, each extra 13-check pass in ticket 00 costs about 10 min; three passes cost about 30 min. This last figure is an estimate for that older revision.
- **Fix:** Give each ticket a named check set. Run checks that use the changed code or controls. Keep one full release gate and full checks for changes to shared rules, the game loop, or shared input helpers. Repeat a new or repaired timing check, rather than all its neighbours. Keep the owner's sample approval and one pull request per step. The full-per-step rule is an owner-approved rule; its change needs the owner's decision.
- **Payoff:** A step that needs only `special-moves` replaces about 12 min with the measured 31 s plus its build. A Workshop-only step can start with the measured 66 s Workshop check. Savings of 8–11 min per small step are plausible. The exact check set determines the saving.
- **Risk and check:** A bad check map can miss a shared dependency. The map must include changes to controls, shared helpers, CSS, saves, and the plugin. Compare the selected results with one full pass before release. Keep full checks at those shared boundaries.

**2. shrink: Give each browser run its own files, then permit two functional runs.**

- **Evidence:** `tools/lib/lock.mjs:13` puts the lock in Git's common directory. `tools/check.mjs:74` takes it before the build. `tools/lib/checks.mjs:46` gives every worktree the same temp output root. `tools/check.mjs:75` deletes that root. The runner already gives its preview server a free port at line 128. It starts checks in separate child processes at line 137. Most checks use fresh browser contexts.
- **Cost today:** With twelve 12 min jobs ready at once, the last job can wait 132 min and finish at 144 min. This is a queue calculation, not a claim that this exact queue occurs today. The next run also deletes the prior run's logs and screens. A failure can then need another run to recover evidence.
- **Fix:** Use `mkdtemp()` for a run root outside the checkout. Pass that root to the child checks and print it in the result. Build before taking a browser resource slot, in separate worktrees. Start with two functional browser slots on this Mac. Keep frame-rate and frame-cost checks alone. Keep one build at a time in any one worktree, because its `dist/` folder is still shared within that worktree.
- **Payoff:** Two equal functional jobs can run at once without log loss. Twelve jobs would finish in about 72 min if contention adds no time. That is a ceiling, not a forecast. Small named jobs can cut the queue much more than a second slot can.
- **Risk and check:** Simply removing the lock is unsafe: the output deletion remains, and timing checks compete for CPU and graphics time. Test two separate worktrees, separate output roots, and separate ports. Confirm that each run retains its own evidence. Measure contention before raising the slot count above two. Do not run twelve browsers at once.

**3. shrink: Move the 40-game stress test out of every local push.**

- **Evidence:** `src/ai/search.test.ts:125` plays 40 games of up to 120 plies. Each search gets 15 ms at line 133. That is up to 4,800 searches and 72 s of nominal search budget, plus move generation and assertions. The test has a 300 s timeout at line 143. `package.json:11` includes it in every `npm test`. `.githooks/pre-push.mjs:78` runs that command on every non-deletion push, including a docs-only push.
- **Cost today:** The whole unit suite takes about 90 s alone. The stored results show this file at 99.7 s in one later snapshot and 281.4 s in an earlier, failed snapshot under an unknown load. Those stored times are not clean solo measurements. They do identify a large repeat cost. The search checks its clock once per 1,024 nodes (`src/ai/search.ts:623`), so a 15 ms request is not an exact time cap.
- **Fix:** Keep the short tactical tests and a small seeded legal-game smoke test in the local gate. Keep all 40 games in an explicit stress tier and the full release or hosted test job. Use fixed-depth tests for a required move or score; reserve wall-clock tests for time behaviour. Add tiers through `npm test`, so agents still use the required entry point.
- **Payoff:** This can remove much of the 90 s local pass. A 45–70 s saving per local pass is a reasonable target, not a measured result. Five build/push cycles can save about 4–6 min before contention.
- **Risk and check:** The long test catches failures that short positions miss. Retain it and its seed. Retain any discovered failure as a small regression test. Do not delete the legal-move comparison to make the test faster.

**4. shrink: Remove the shared work point in `main.ts`.**

- **Evidence:** `src/main.ts` has 34 top-level `let` declarations. It owns piece-guide text at line 143, board highlights and controls at line 391, move commit at line 583, lessons at line 624, review at line 887, results at line 1018, links at line 1128, saves at line 1164, and startup at line 1399. `docs/specs/web-redesign/spec.md:294` says every step changes this file and requires the steps to run one at a time.
- **Cost today:** Each interface change enters a 1,528-line file with many shared states. The spec has 27 steps that pass through this point. More agents cannot make those merges independent. The inspect and repair time per change is not measured; a minutes claim would be invented.
- **Fix:** First move the piece guide and its art/name helpers into one cohesive module. Next give save/settings code one owner. Give review/lesson state one owner, and keep the move/turn path together. Pass the small values and callbacks each part needs. Let main create these parts and connect them. Use the existing `new-game.ts`, `account/account.ts`, and `workshop/dialog.ts` as the pattern. Do not add a general event bus, store framework, or a class for each control.
- **Payoff:** About 600–900 lines can move out of main without changing the game. This is a move, not a net deletion. Later guide, account, and review changes then have smaller patch areas. Independent work can occur in those modules while one agent owns the main/turn merge path.
- **Risk and check:** Splitting functions while leaving all state in main just adds callbacks and files. Keep each state with the functions that own its life. Preserve the generation checks around an awaited animation (`main.ts:608`) and the separate lesson game. Check new game, Undo, review, a lesson return, and account restore after each extraction.

**5. shrink: Stop hashing all simulation output around every browser check.**

- **Evidence:** `tools/check.mjs:136` and line 142 take a workspace snapshot before and after each check: 30 snapshots in a full run. `tools/lib/tree-status.mjs:43` includes every untracked file. Line 50 hashes each dirty or untracked file; `fileHash()` reads its full content at line 13. A read-only file-size count during this audit finds 5,166 untracked files under `sim/out/`, with 342,025,730 bytes in total.
- **Cost today:** On this main checkout, a full pass can reread 10,260,771,900 bytes, about 10.3 GB, just from those simulation files. Clean build worktrees do not necessarily pay this cost. No disk time is measured. A live simulation can also change a file during a check and make the runner blame that check.
- **Fix:** Run checks in a clean, stable worktree, which already fits the build process. Exclude known run-output folders from the check's content guard. Preserve guards for source, tools, and new files elsewhere. Stop the test immediately if its own output path points into the checkout. Keep run records under the run process, not the browser process.
- **Payoff:** Remove up to 10.3 GB of needless reads per full run on this checkout. Remove false dirty-check failures due to concurrent simulation output. The minute saving needs a later measurement.
- **Risk and check:** A broad ignore can hide a check that writes files it should not write. Use a small, named exclusion. Keep `selftest-dirty` to prove that an unexpected file still fails. Do not replace this with a general permission to write in the repo.

**6. shrink: Split long browser scripts by the question they answer.**

- **Evidence:** The measured times are `qa` 195 s, `king-effects` 100 s, `painted-game` 93 s, `ux-defects` 73 s, `workshop` 66 s, and `account` 54 s. `tools/qa.mjs:282` plays a random full computer game until a result. Its inner limit is 1,500 s at line 296, although the registry gives the whole script 900 s (`tools/lib/registry.mjs:22`). `tools/verify-painted-game.mjs:28` plays at least 60 plies and a capture, or to the end. `tools/verify-king-effects.mjs:252` waits 1.2 s, then samples for 4 s. Lines 263–267 repeat this ten times: 52 s of fixed sampling, mostly to print a report. `tools/verify-workshop.mjs:1150` repeats edit, properties, name, share, reload, and Try it at five sizes, then repeats menu and card layout at five sizes.
- **Cost today:** These six scripts use 9 min 41 s of a roughly 12 min pass. At least 52 s of the king-effects script is deliberate measurement wait. The 66 s Workshop script repeats state behaviour across five sizes, although much of that behaviour does not depend on size.
- **Fix:** Give the king frame-cost report a named performance check. Keep effect on/off, reduced motion, and hidden-tab behaviour in the functional check. Put random long games in a named soak check; use fixed capture and game-end positions in the small gate. Keep both painted and clay release coverage. For Workshop, run full state changes once with a mouse and once with real touch. Test layout at all five sizes with smaller seeded states. Permit a named UX probe instead of all eleven. Replace ordinary sleeps, such as `qa.mjs:113` and `verify-painted-game.mjs:69`, with the relevant saved-move or animation state. Keep waits that measure elapsed time.
- **Payoff:** Moving the ten frame samples saves 52 s exactly from the functional run, before startup. A 2–4 min smaller routine browser pass is a reasonable target when it omits soak work. Exact savings for Workshop and the game loops are not known. Named selection already works in `tools/check.mjs:46`; `QA_ONLY` already works in `tools/qa.mjs:31`.
- **Risk and check:** Clay and painted games are two real render paths, not duplicate tests to delete. Mouse and touch can fail in different ways. Keep those tests in the appropriate tier. Keep animation timing alone and test normal, fast, and off against their own controls. Set one clear timeout for each soak case.

**7. shrink: Run tool integration tests when tools change.**

- **Evidence:** `vite.config.ts:79` puts source tests, all tool tests, and assistant-hook tests in the same run. `tools/lib/temp-repo.mjs:68` creates two Git repos per fixture, copies hooks, and starts child commands. `tools/gate.test.ts:21` uses that fixture to test the real gate. The hook tests test real commit and push paths. `tools/deploy.test.ts` has 26 cases. The later stored snapshot gives `gate.test.ts` 56.5 s, the tool-gate tests 51.2 s, deploy tests 36.1 s, commit-msg tests 29.2 s, and pre-push tests 26.3 s. These are concurrent file times; they cannot be added as wall time.
- **Cost today:** A piece-label or CSS change can run repeated Git, shell, and Node fixtures for code it does not change. The test files themselves are useful; their place in every local app check causes the waste.
- **Fix:** Keep a core test tier and a tool integration tier behind the same `npm test` entry point. Route hooks, build config, package files, tool code, and shared fixtures to the tool tier. Run all tiers in hosted pull-request checks and before release. Keep one real hook-path check for each important gate; use direct gate tests for additional rule cases when that preserves evidence.
- **Payoff:** Fewer child processes on the shared Mac. The exact local wall-time gain is unmeasured and overlaps finding 3. Tool failures still block a tool change and a release.
- **Risk and check:** Tools can affect an app change through the package or config path. Include those paths in the routing rule. Keep the secret, dirty-tree, and protected-main checks. Do not replace them with assertions about source strings.

**8. shrink: Limit local test workers and separate worktree caches.**

- **Evidence:** The Mac reports 16 available CPUs. The owner reports twelve build agents. `vite.config.ts:79` sets no worker limit. `tools/wt.sh:48` links a worktree's packages to main when the lockfiles match. This audit finds 81 registered worktrees and 44 linked package folders. The shared test-results file at `node_modules/.vite/vitest/da39a3ee5e6b4b0d3255bfef95601890afd80709/results.json` changes during this read-only audit. Its later copy has 90 file entries, while main has 79 TypeScript test files. It has no reliable run/commit identity for this report. Hosted tests use Node 22 (`.github/workflows/test.yml:20`); this shell uses Node 26; plugin output declares Node 24 at `tools/plugin-server-build.mjs:40` and compiles for Node 20 at line 34.
- **Cost today:** Many test processes can compete for the same sixteen CPUs, even while the browser queue is closed. The stored search-file time ranges from 99.7 to 281.4 s between the two snapshots. Load and source identity are unknown, so this does not prove the size of a slowdown. Shared result files also make diagnosis and timing comparisons less reliable.
- **Fix:** Set a small local worker count and permit only a small number of full local suites at once. Give each worktree a cache/results path outside the linked package folder. Record the commit, Node version, and worker count with each result. Pin the local runtime to the version used by the main test job, or test the intended version set explicitly. Keep the plugin production runtime check separate.
- **Payoff:** More stable check times, fewer timeout reruns, and evidence that belongs to one worktree. The payoff needs a bounded later load check; no honest minute claim is available now. Package linking can still save installs.
- **Risk and check:** Too few workers can slow a solo run. Compare one suite alone and two at once with the same source. Do not install separate packages in every worktree just to separate caches. Keep the current rule that a dependency change needs its own installation.

**9. shrink: Build the plugin once for its named check set.**

- **Evidence:** `tools/check.mjs:121` builds the website for every selection, including plugin-only checks. Each plugin entry then calls `tools/plugin-browser-check.mjs`, which builds a private plugin server at line 47. `tools/plugin-server-build.mjs:19` builds the UI; line 24 builds consent code; line 25 builds the runtime. `tools/plugin-runtime-build.mjs:11` builds index and worker separately; the server build adds another bundle at line 26. Thus, each named plugin mode starts five build jobs. `tools/deploy.sh:152` builds the plugin artifact first, then line 156 calls all three plugin browser modes, which build it again.
- **Cost today:** A three-mode plugin check starts fifteen plugin build jobs plus an unused website build. The deploy path starts five plugin build jobs before those fifteen. These are build counts, not timed minutes. The modes own separate identities and servers, so build reuse does not require shared match state.
- **Fix:** Let the plugin check set use one immutable built artifact. Keep separate servers, database identities, and browser contexts for each mode. Skip the website build and preview when all selected checks build or receive their own plugin artifact. During deployment, check the artifact that the deploy step will publish.
- **Payoff:** A three-mode run can cut fifteen plugin build jobs to five and remove the website build. A plugin release can avoid all fifteen redundant jobs by checking its existing artifact. Measure the time saved later.
- **Risk and check:** Artifact reuse must be tied to the current source and build settings. Do not reuse an old folder by its name alone. Test that a changed board script appears in every mode and that each mode still uses its own data.

**10. shrink: Keep useful document checks; cut checks of exact prose shape.**

- **Evidence:** `tools/steering.docs.test.ts` has 1,223 lines and 50 named tests. It checks links and repeated run rows, which have clear value. It also fixes eleven AGENTS section names and their order at line 812, fixes rule phrases at line 824, and requires particular fact-file words at line 731. These checks couple a prose edit to test implementation. The start documents total 217 lines and 2,748 whitespace-counted words. Specs contain 128 tracked text/script files and about 9,474 lines. The redesign spec and tickets alone have 29 Markdown files and 1,529 lines, with about 29,666 whitespace-counted words.
- **Cost today:** Agents must read the same broad entry rules, then reconcile the spec, ticket, lessons, and test's prose requirements. A routine rule edit can require code changes to retain the exact words. The writing/review minutes per edit are not measured. This is process size, not player download size.
- **Fix:** Keep checks for broken links, duplicate run IDs, secrets, missing tickets, and unsafe commands. Replace exact heading/order/phrase rules with a smaller content contract only where a tool consumes that format. Give each task one current acceptance list in its ticket, with links to the spec. Keep old reviews as evidence; do not require every agent to reread them. Merge repeated standing rules at their source rather than add another note.
- **Payoff:** A smaller lint and fewer coupled prose/code edits. Several hundred test lines are candidates, but the exact cut needs a focused diff. Do not claim the entire 1,223-line file is waste. The required start docs are already fairly short.
- **Risk and check:** Some fixed words encode real owner limits. Preserve the meaning and the tools that enforce it. The owner must approve a rule change. A wording edit must still leave agents able to find run, secret, and deploy constraints.

**11. shrink: Track removed test behaviour, rather than removed source lines.**

- **Evidence:** `.githooks/commit-msg.mjs:30` counts removed assertion lines and requires one trailer per line. `tools/lib/removed-checks.mjs:8` exempts only a matching line that is added again. A rewritten line counts even when it checks the same or stronger behaviour. The counter has 125 lines; the hook has 45 lines and its own tests. The spec's helper step seeks to preserve assertion text while UI changes (`docs/specs/web-redesign/spec.md:292`).
- **Cost today:** Refactoring a test can create many trailers with no loss of coverage. The counter can also pass an identical assertion whose helper now checks less. The time cost is review and message repair, not a large measured runtime cost. Ticket 00 contains a long review record about one-for-one check changes at `issues/00-check-helpers.md:83`.
- **Fix:** Require one concise coverage-change note when a check changes. Name removed or narrowed cases by behaviour. Review the helper with its callers. Retain a mechanical flag for deleted whole check files or case IDs. If the owner keeps the trailer rule, first narrow it to those real removals.
- **Payoff:** Less bookkeeping during control moves and test cleanup. Agents can simplify tests without producing a trailer for each rewritten expression. The 125-line line parser may then be removable or much smaller.
- **Risk and check:** The present rule aims to stop agents from deleting a failing check. Keep that aim. Require a baseline-failing example for a removed regression and a clear reason for each real coverage loss. This is an owner rule change, not an audit permission to bypass a hook.

**12. shrink: Remove the manual rules snapshot from the art trial's normal path.**

- **Evidence:** `docs/2d-first-pieces/board/model.mjs:1` imports `rules.mjs`. `rules-entry.ts:2` re-exports the production engine. `build-rules.mjs:6` creates the snapshot, and line 8 stores hashes for two source files. The bundle is 10,179 bytes. A hash comparison in this audit finds that both recorded hashes differ from today's `src/rules/engine.ts` and `src/rules/rules.ts`. A tracked-source search finds the hash record only in the builder and README, not in a check. `board/cast.test.mjs:3` reads the snapshot. The README explicitly calls it a snapshot at line 27.
- **Cost today:** The repo stores a second rules copy plus a manual build command and hash record. Both stamps are stale today. This proves source drift, not a failure in a specific move. It adds a manual refresh and another thing an agent must remember. Its current time cost is not measured.
- **Fix:** Let the Vite-served trial import the production rules directly. For a standalone exported trial, generate the bundle as an export artifact in its output folder. If the committed snapshot must remain, check its source hashes whenever engine/rules files change and rebuild it through one named command. Do not make a second handwritten engine.
- **Payoff:** One rule source for the live game, plugin, and served trial. Remove a 10.2 KB tracked generated copy and its manual refresh from ordinary changes. Keep an export-only bundle if a static handoff needs it.
- **Risk and check:** The art trial deliberately uses pseudo-moves and omits kings/check, turns, and promotion. Preserve that trial scope. Its static export and motion tests still need to work. Do not infer from stale hashes that all artwork tests are invalid.

**13. shrink: Give shared production scene code a production source contract.**

- **Evidence:** `src/render/PaintedView.ts:1` imports the 953-line JavaScript scene from `docs/2d-first-pieces/board/scene.mjs`. The plugin uses the same view (`src/plugin/app.ts:2`). A separate 75-line `scene.d.mts` declares the scene API. `tsconfig.json:14` includes `src`; it does not enable JavaScript implementation checking. Other shared art code adds to the 3,498 non-test JavaScript lines under this docs path.
- **Cost today:** The most important painted runtime is outside the stated source count and has a hand-maintained type declaration. An API change can require edits to implementation, declaration, and callers. Browser checks then carry more of the burden of finding a contract mismatch. No repair-time measurement exists.
- **Fix:** Treat the shared scene and motion code as production source. In a bounded change, type the public scene API at its implementation, then remove the matching manual declaration. Keep art data and visual studies beside their assets where that aids their authors. Use one shared module in both product paths. Do not copy the scene into `src` and leave the old version live.
- **Payoff:** A compiler check can catch a shared scene contract error before a 12 min browser pass. Up to 75 declaration lines can go after the typed implementation replaces them. This is mostly a clearer boundary, not a large code cut.
- **Risk and check:** Moving files changes relative image URLs (`scene.mjs:23`). Preserve asset resolution in the website, plugin's inline HTML, and trial. The full scene rewrite is not a prerequisite for the redesign; start at its public API.

**14. shrink: Share the small rules-to-UI facts that still repeat.**

- **Evidence:** `src/main.ts:361` defines the clicked path for shove, shot, chain, and power moves. `src/plugin/app.ts:72` and line 80 derive board targets again. The trial defines its own first target in `board/model.mjs:29`. King/preset precedence appears in `main.ts:32` and `src/match/worker.ts:55`. The website save field list appears in `main.ts:1170` and `settingsNow()` at line 1178; `src/account/sync.ts:21` and line 22 keep separate settings/game field lists. The comment at `main.ts:1166` tells agents to update both places.
- **Cost today:** These are small repeated facts, not thousands of duplicated lines. A new move kind or save setting can require two or three edits and checks. The best saving is fewer patch sites. Net line savings are likely small and are not measured.
- **Fix:** Put the move target facts in the existing `powers-ui.ts` module. Let the website use an ordered path and the plugin use the target set it needs. Keep trial-only limits explicit. Put preset precedence in one small pure helper beside the rules. Put the website save type and field lists with its save module. Keep the plugin command/revision save format separate: it serves a different need.
- **Payoff:** Fewer repeated change sites for new powers, moves, or settings. This reduces drift and review work more than bundle size. Existing `needsArming()` and `describeMove()` already show the right level of reuse.
- **Risk and check:** The three interfaces do not use identical interaction rules. A shared whole selection controller would add complexity. Share facts only. Test chain order, same-square powers, shove choices, and a new settings field reaching account sync.

**15. delete: Remove confirmed unused exports and an unnecessary type relay.**

- **Evidence:** A tracked code/HTML search finds each of these names only at its definition: `GP_NAMES` (`src/ai/eval.ts:375`), `lookSpec()` (`src/render/prototype/ClayLook.ts:359`), `doneGames()` (`src/sim/run.ts:113`), and `setUseSculpts()` (`src/render/voxels.ts:66`). No caller sets `useSculpts` false. `doneGames()` says it is kept for callers, but there are none. `src/plugin/view.ts:1` only re-exports one type; its sole importer is `src/plugin/app.ts:7`.
- **Cost today:** Four unused exports, one constant flag path, and one relay file. These are small signs of stale cleanup, not the cause of the hours. `noUnusedLocals` in `tsconfig.json:8` does not catch unused public exports.
- **Fix:** Delete the unused table and functions. Use `loaded.get(t)` directly in voxel geometry and remove the unused sculpt switch; keep the loaded-model and lab-piece fallbacks. Import `MatchView` directly as a type in the plugin. Delete the empty relay file. Remove the misleading kept-for-callers comment with its function.
- **Payoff:** A confirmed 14-line deletion and one fewer file, with two voxel expressions simplified. No dependency can be removed on this evidence. No meaningful runtime-minute saving is expected.
- **Risk and check:** Search all tracked tools, studies, tests, and dynamic references before a later deletion. These names are absent from those callers in the inspected tree. Typecheck and use the existing clay/plugin checks when the change is built. Do not remove real load, storage, or network guards as part of this cleanup.

The unit-time evidence needs care. The test cache changes while other agents work, and it gives no stable source identity. The later snapshot has these large file times:

| File | Stored time | Interpretation |
|---|---:|---|
| `src/ai/search.test.ts` | 99.7 s | Forty-game stress work; strong local-gate candidate. |
| `tools/gate.test.ts` | 56.5 s | Many real Git/hook fixtures; route by tool changes. |
| `.claude/hooks/tool-gate.test.ts` | 51.2 s | Assistant tool controls; keep outside routine app checks. |
| `tools/deploy.test.ts` | 36.1 s | Release-tool integration; keep for tool changes and release. |
| `tools/git-hooks/commit-msg.test.ts` | 29.2 s | Hook fixtures and line-removal policy. |
| `tools/git-hooks/pre-push.test.ts` | 26.3 s | Real pushes to temp repos. |
| `src/workshop/judge.test.ts` | 7.6 s | Product judgement rules; useful. |
| `src/rules/power-fixes.test.ts` | 6.9 s | Rule regressions; useful. |
| `src/ai/legality.test.ts` | 3.6 s | 26,000 seeded trials; good value in this snapshot. |

These are per-file durations from one stored snapshot. They overlap in time. They are not a fresh solo ranking. The earlier snapshot has several failures and much larger times. No current failure diagnosis follows from this cache. The owner's 90 s solo suite remains the baseline for the report.

Several large parts are well made and should stay:

- **One game engine.** The website and plugin import `src/rules/engine.ts`. The scene accepts rule helpers at `scene.mjs:36`, so it does not bundle a second engine. The generated trial snapshot is the small exception in finding 12. The 1,931-line engine serves fifteen piece types, powers, cards, and real state rules. Its size alone is not proof of bloat.
- **Two real renderers behind a small interface.** `BoardView` in `src/render/PaintedView.ts:12` has two implementations. It is not a one-product factory. Painted and clay checks must remain where those looks are supported. The no-op painted `resetView()` and `applyStyle()` methods cost two lines and keep a simple common caller; they do not merit a new type hierarchy.
- **Useful source reuse.** Both the game and plugin use `PaintedView`, `needsArming()`, and `describeMove()`. The 953-line scene is one shared implementation, not a website/plugin copy. The trial's different move scope is intentional. Do not combine its entire input flow with the game.
- **Useful data boundaries.** Plugin command IDs, revision checks, replay validation, database transactions, OAuth checks, and bounds protect real user and network state. `src/match/index.ts:15` gives each live match a worker; global engine rules then stay isolated. Removing that worker needs a larger engine change and does not solve the current build delay.
- **Useful stale-work guards.** `main.ts:608` waits for motion, then checks its generation before it syncs the board. `reset()` at line 950 cancels old work. The separate lesson game at line 114 protects the saved match. These comments explain actual failure paths; they are not filler.
- **Useful regression tests.** Legal move comparison, two-sided power state, save/restore, real touch input, refused storage, and offline loading have known failure cases. The legal test tries 26,000 seeded positions (`src/ai/legality.test.ts:50`, 80, 131, 169, 219, 269, 306). It costs only 3.6 s in the later cache snapshot. A large case count does not make that test waste.
- **A lean dependency set for the scope.** There are seven runtime dependencies: the plugin SDKs, account client, token library, database driver, 3D renderer, and schema library. There is no large interface framework or custom dependency-injection system. The installed art/build tools have real uses. No dependency deletion is justified by this audit.
- **Useful load separation.** Clay loads on demand (`main.ts:68`). Account code loads after the board. `src/entry.ts:2` keeps the visual study out of production. `vite.config.ts:8` omits large study assets from publication. The service worker gives a real offline feature. Preserve these boundaries.
- **Useful test helpers and release checks.** Shared UI helpers reduce selector repair across many tools. Fresh contexts, free ports, temp outputs, and error traps are sensible. `tools/deploy.sh:137` checks fresh `origin/main` and publishes only the tested build. `.github/workflows/test.yml:25` tests pull requests because a remote merge does not run the local hook. That final check is useful duplication; repeated local checks of an unchanged tree are the cheaper cut.

Defensive code is not a broad deletion target here. Storage reads can fail, data can be old, art can fail to load, and a server call can race. Keep those guards. The inline AI fallback in `src/game.ts:102` and line 127 deserves a later supported-browser decision: it keeps a second search path in the page and can block that page. This audit has no evidence that the fallback is unused, so it does not count it as a finding or a promised cut.

The code has small stale comments. The voxel header still says the figures are placeholders until sculpts arrive (`src/render/voxels.ts:2`), although the file loads those sculpts. The study header says it is committed only to a study branch (`src/render/prototype/study.ts:2`), although it is on main. Correct these when the files change. Do not spend a separate build cycle on a general comment cleanup. The save, cancellation, and state-boundary comments do real work.

The better architecture and work order are modest. First reduce what a local check must do. Give each run stable output and source identity. Then extract the guide, save, and review parts from main as their tickets touch them. Keep one owner for shared turn state and the main merge path. Let other agents work on independent modules and samples. Twelve writers cannot shorten a spec that orders 27 edits to one shared file.

The product scope also explains part of the hours. New turn submission, link sending, review, reverse motion, the ceremony, lessons, and Workshop cards are real features. The owner asks for a sample before each visual build passes. Those choices take time even in lean code. Keep the approved features and samples. Reduce the repeated machine and paperwork cost around them.

For a later implementation, use this acceptance order:

1. Record one clean baseline with commit, Node version, workers, check names, build time, and queue wait. Use the existing suite when the owner releases the shared Mac. Do not launch it during this audit.
2. Change run output isolation first. Prove two worktrees cannot delete each other's screens or logs. Keep one-worktree build exclusion and exclusive performance checks.
3. Add check tiers through the existing commands. Compare their combined results with the full gate. Preserve the same regressions and a full release pass.
4. Remove one repeated build or test family at a time. Measure its wall-time saving on the same machine and source.
5. Extract one cohesive part of main at a time. Use existing flow checks. Avoid a general rewrite.

The highest-payoff target is minutes per change and minutes in the queue. It is not a large line-deletion target. The confirmed immediate source cut is small; larger savings come from running useful work at the right time.

net: -14 lines, -0 deps possible.

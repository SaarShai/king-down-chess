# Survey lane: tests, checks and QA tools

The web app can keep its present check runner, web checks, account checks, render comparison, test lock, and offline checks. PR 61 adds shared test cover, WebKit support, database isolation, and site-build checks. These additions do not test new web screens by themselves. Reuse the plugin's scenarios and measurement code through the existing web test interfaces. Add web browser checks for the new service flows, native device checks, and a web CI selection. Keep the ChatGPT host checks with the plugin. This survey checks source code only. It runs no test, browser, device, build, or live-site check. Current pass results are **unverified**.

Reference keys:

- `MAIN` means commit `38a6bbffb3b85f10bb9e6d23e8e1f394b781b4f4` in `/Users/za/Documents/king down chess`.
- `RC` means the requested PR head, `682e58bd47e38aa1e571deb17afb64f3183149a1`. Paths are relative to the repo root. Each source reference gives a line number.
- `SCRATCH` means `/private/tmp/claude-501/-Users-za-Documents-king-down-chess/b7cd01b9-9824-4854-8a44-29f55a926d5b/scratchpad`. These files exist outside Git. They do not arrive with PR 61.
- The release branch moves to `442c5eb3` during this read. Its delta changes only `src/plugin/app.ts`, `src/plugin/app.test.ts`, and ticket 47. The surveyed tool files still match the requested head.
- Size is the added web work: **S** is a small check or reuse of a tool; **M** is a flow or check group; **L** is work across the web UI, service, and release path. For an inherited or existing item, S means reuse with no new code.
- “Owner: yes” means approval of an improvement in the web spec. A fault against an approved requirement, with one right fix, needs no new taste approval. No work in this report is approval to build or run it.

## (a) Shared code: available when PR 61 merges

### CHECKS-01 — Shared WebKit launch and CI wait scale

- **Kind:** (a). **Size:** S; merge supplies the code. **Needs:** none.
- **Evidence:** RC `tools/lib/checks.mjs:74` adds `STEP` and selects WebKit in `launch()`. RC `tools/check.mjs:169` multiplies each named check's outer limit by `STEP`. RC `tools/lib/registry.mjs:38` gives `plugin-ui` 420 seconds and `plugin-ui-http` 480 seconds. Commit `7fbd2e70` adds the CI scale.
- **Web today:** the web checks use the same launch helper. MAIN uses Chromium channels. After merge, a compatible web check can select WebKit through that helper. The web does use this shared code.
- **Change and seam:** use the existing `npm run check:browser <name>` interface. Keep the helper as supplied. CHECKS-13 defines the web WebKit selection.
- **Risk:** `STEP` is 3 only when both `CI` and `PLAYABLE_BROWSER=webkit` are set. It scales waits, not measured performance limits. It does not remove CDP calls from web scripts. A global WebKit setting is not proof that the whole web suite works.
- **Owner:** no new taste call for the supplied helper. Approval of added web cover belongs to CHECKS-13.

### CHECKS-02 — Shared board readiness and real tap completion

- **Kind:** (a). **Size:** S; no web wiring change for these checks. **Needs:** CHECKS-19 for browser regression cover.
- **Evidence:** RC `src/render/PaintedView.ts:92` resolves readiness on the frame that shows the canvas. RC `src/render/PaintedView.test.ts:27` checks this promise; line 47 checks touch, drag, tap, and cancel. RC `tools/lib/tap-board.mjs:8` counts handled input. RC `tools/read-verb-fixture.mjs:17` uses `tapSquare()`. Commits `e2cb2dc5` and `1c534749` fix these paths. MAIN `src/main.ts:69` constructs `PaintedView`; line 71 exposes it to browser checks.
- **Web today:** the web already uses this renderer and the read/verb fixture. The merge gives the web these repairs. `ready()` becomes a stronger test signal.
- **Change and seam:** keep `readyBoard()`, `view.ready()`, and real board input. Read marks after the handler takes the tap. Do not replace the input with a direct move call.
- **Risk:** readiness now waits for an animation frame. A hidden tab can delay it. The shared renderer also changes touch handling, reduced motion, and small-board coordinate ink. Plugin tests alone cannot prove that the web keeps its layout and input. The web does not set the plugin's `canDrag` policy merely because the property exists.
- **Owner:** no new taste call for readiness or tap fault repairs. New visual or input policy still needs approval.

### CHECKS-03 — Shared rules, worker, service, and database tests

- **Kind:** (a). **Size:** S for reuse. **Needs:** CHECKS-04 for database tests; CHECKS-15 for web browser proof.
- **Evidence:** RC `src/rules/classic-chess.test.ts:20` checks published move counts and classic-mode isolation. RC `src/match/match.test.ts:16` drives the public match interface. RC `src/match/index.ts:72` exposes snapshot, apply, choose, and save. RC `src/match/service.db.test.ts:26` uses real PostgreSQL connections; line 63 checks one application of a retry and rejects another player's access. RC `src/api/http.db.test.ts:31` tests website sessions and the website client. RC `vite.config.ts:73` includes source and tool tests in `npm test`.
- **Web today:** the local web game uses the shared rules and renderer. It does not use the server match path for local play. MAIN `src/main.ts:66` creates the local engine and line 89 connects the local play screen. Server tests become available after merge, but do not prove a new web UI.
- **Change and seam:** retain the public rules tests, `LocalMatch`, `GameService`, and HTTP client tests. Add assertions at the highest interface that expresses the requirement. Do not make a browser test repeat all engine cases.
- **Risk:** database suites skip without `PLUGIN_TEST_DATABASE_URL`. The WebKit CI file selection is only a subset. A normal local `npm test` pass can omit database cover.
- **Owner:** no new taste call for inherited tests. New game modes or service features need their own approved scope.

### CHECKS-04 — Separate test databases and a server-wide role lock

- **Kind:** (a). **Size:** S for reuse. **Needs:** a disposable local PostgreSQL server with database and role rights.
- **Evidence:** RC `tools/plugin-db/bootstrap-test.mjs:7` limits bootstrap to loopback names ending `_test`; line 27 applies migrations 0001–0014 twice. RC `tools/plugin-db/own-test-db.ts:9` gives a test file its own database. RC `tools/plugin-db/role-lock.mjs:2` locks on the server's `postgres` database. RC `src/api/http.db.test.ts:45` uses these helpers. RC `tools/plugin-db/migrations.db.test.ts:17` makes this suite conditional.
- **Web today:** MAIN has the earlier plugin bootstrap. It has no web multiplayer UI that needs it. After merge, the web API tests already use the new isolation. The browser account check still uses a fake server.
- **Change and seam:** reuse these helpers for new web service tests. Keep sweep jobs, schema changes, and role changes out of a shared test database. Keep bootstrap separate from `tools/plugin-db/migrate.ts`, which is a privileged migration tool.
- **Risk:** PostgreSQL roles span databases. A separate database alone does not isolate role changes. These tests need more rights than a runtime service. This fixture is a Supabase stand-in, not proof of hosted sign-in.
- **Owner:** no new taste call. Database test isolation is a fault-prevention measure.

### CHECKS-05 — CI browser installation and local site-build checks

- **Kind:** (a). **Size:** S for inherited cover. **Needs:** CHECKS-04.
- **Evidence:** RC `.github/workflows/test.yml:23` installs Chromium before `npm test`. RC `.github/workflows/plugin-checks.yml:17` runs verification; line 49 checks the combined site build; line 53 separates Chromium browser checks; line 88 adds WebKit. Failed browser jobs upload check logs at lines 81 and 106. RC `tools/workflow.lint.test.ts:50` and line 65 check this setup. RC `tools/vercel-check.mjs:67` checks the static site routes; line 111 requires website API routes to return 404.
- **Web today:** MAIN has PR tests and plugin CI, but lacks these added steps. The merge gives the web static-output checks. It still does not run the web's named browser checks in CI.
- **Change and seam:** keep the local build-output check. Extend it when an approved web API is exposed. Do not treat its current API refusal assertions as proof of a usable web service.
- **Risk:** the PR test workflow uses Node 22; plugin jobs use Node 24. Browser installation adds cost to the shared test workflow. The latest GitHub job results are **unverified**. CHECKS-14 records the open Linux limit.
- **Owner:** no new taste call for inherited fault checks. A change to the site's public API needs the approved web spec.

### CHECKS-06 — Web account deletion check follows the shared server rule

- **Kind:** (a). **Size:** S; merge supplies both words and assertions. **Needs:** CHECKS-20.
- **Evidence:** The MAIN-to-RC diff in `tools/verify-account.mjs:204` changes immediate-deletion assertions to seven-day deletion and cancellation by sign-in. The same diff changes `src/account/account.ts` and `src/account/client.ts`. RC `tools/verify-account.mjs:211` checks that Cancel sends no delete request; the next block checks the delete request and local sign-out.
- **Web today:** the account check expects immediate deletion words. The merge changes the web's account UI and check together.
- **Change and seam:** keep the existing `account` browser check. Check the true service rule through the shared database tests, rather than through UI words alone.
- **Risk:** an old test or old deployed UI can claim that data is already deleted while the service holds a grace period. The browser uses a fake server; it does not prove hosted deletion jobs.
- **Owner:** no new taste call for words that must match the service. Any change to the retention rule needs approval.

## (b) Plugin code and tools that need a small web change

### CHECKS-07 — Built-page journey and recovery scenarios

- **Kind:** (b). **Size:** M for the group; each scenario is small. **Needs:** the approved web feature screens, CHECKS-19, and CHECKS-15 for service-backed flows.
- **Evidence:** RC `tools/plugin-browser-check.mjs:48` builds the artifact; line 79 starts the harness. RC `tools/plugin-ui-check.mjs:130` starts home checks, line 403 setup, line 773 seat setup, line 1177 friend and lobby flows, and line 1686 move retry and rollback. RC `tools/plugin-ui-host.ts:48` supplies failures; lines 53–63 distinguish a held action, a held reply, and a lost reply after commit.
- **Web today:** named `home`, `new-game`, `turn`, `end`, and `account` checks cover local play. They do not cover the plugin's new friend, lobby, profile, and recovery flows on the web.
- **Lift and seam:** lift the scenario steps and final assertions. Add them to the matching web `verify-*` check through `app-ui.mjs` and `new-game-ui.mjs`. Replace a widget remount with web reload or navigation. Use route control or the local HTTP fixture for failed and lost replies.
- **Host coupling:** `frameLocator('iframe')`, `harnessShow`, `harnessWidgetState`, `kingdown_*` calls, display-mode requests, and `window.openai` state. Remove these from the web variant. Do not copy the 3,000-line widget check into a second script.
- **Risk:** source-page tests expose `harnessApp`; the built page hides it. A direct call to that object can bypass the player's path. Seed through a fixture, then act through the built page.
- **Owner:** yes for new web feature and check scope; no new approval for a confirmed fault in the approved flow.

### CHECKS-08 — Effective touch targets and clipped controls

- **Kind:** (b). **Size:** S for helpers; M for all new screens. **Needs:** CHECKS-07 and the owner's target-size rule.
- **Evidence:** RC `tools/lib/plugin-hit-sizes.mjs:2` measures points that hit a control. RC `tools/plugin-board.test.ts:43` checks current nodes under a stable root, including target edges. RC `tools/lib/plugin-control-bounds.mjs:7` checks ancestors and safe areas; line 12 also reserves a 96/128 px host-composer gap. RC `tools/plugin-ios-size.test.ts:365` checks 48 px Android targets.
- **Web today:** `capture.mjs` and web checks measure viewport bounds and 44 px target boxes. These are useful, but a box can be covered by another control. MAIN `docs/specs/web-ux/capture.mjs:9` states its current checks.
- **Lift and seam:** reuse the hit tests and clipping-parent walk. Evaluate them on the web page's stable screen root. Replace the composer limit with the actual web viewport and fixed bars. Check labels, controls, and text after fonts and motion settle.
- **Host coupling:** `--safe-*` and the fixed composer gap belong to the widget host. Do not subtract that gap from the web page.
- **Risk:** a larger invisible hit layer can cover a neighbour. A DOM box check can miss painted-text overlap. Keep image review beside the numeric checks.
- **Owner:** yes for a new web target-size or layout requirement. Covered or unreachable controls are faults once the requirement is set.

### CHECKS-09 — Phone, zoom, viewport, and keyboard cases

- **Kind:** (b). **Size:** M. **Needs:** CHECKS-08, CHECKS-13, and the adapted screens.
- **Evidence:** RC `tools/plugin-ios-size.test.ts:13` says host copies do not replace a native check. Line 29 tests bottom gaps; line 105 tests stale viewport units; line 382 tests 197 CSS px layouts; line 469 checks a usable board and move at 200%. RC `tools/lib/plugin-android-check.mjs:52` tests card-bar hit areas; line 77 tests win and loss actions. RC `docs/qa/plugin-qa-protocol.md:108` names the on-screen keyboard case.
- **Web today:** the web has phone and landscape samples, plus a narrow-layout case in `tools/qa.mjs:329`. It does not have the plugin's full built-page size matrix for the new screens.
- **Lift and seam:** keep the width, zoom, long-name, sheet-scroll, and reachable-action cases. Open the built web page. Check browser bars, the web's safe areas, keyboard opening and closing, and resize during a game. Keep real 200% native zoom distinct from a 197 px emulation.
- **Host coupling:** remove ChatGPT header/composer insets, host touch flags, and fullscreen messages. WebKit mobile emulation and host context are different inputs.
- **Risk:** importing widget board-size floors can produce the wrong web layout. A short viewport test does not prove keyboard behaviour. Native keyboard results for the adapted web page are **unverified**.
- **Owner:** yes for new layout floors and the device matrix. Clipping against those agreed limits is a fault.

### CHECKS-10 — Motion and reply waits that survive a slow runner

- **Kind:** (b). **Size:** S per check. **Needs:** CHECKS-02; CHECKS-07 for the new flows.
- **Evidence:** RC `tools/plugin-motion-observer.ts:4` records short motion states before the action. RC `tools/plugin-ui-check.mjs:78` waits for outstanding replies. RC `tools/plugin-ios-size.test.ts:22` waits for canvas visibility, animation completion, and a frame. Tickets `43-ci-motion.md:21`, `46-pr61-ci-menus.md:20`, and `45-pr61-linux-ci.md:95` explain failures caused by late reads or clock jumps before a reply ends.
- **Web today:** `app-ui.mjs:208` already provides `waitForUi()`, and line 252 provides `readyBoard()`. Some older QA and capture cases still use sleeps: MAIN `tools/qa.mjs:65` and `docs/specs/web-ux/capture.mjs:33`.
- **Lift and seam:** use the existing web state wait first. For short CSS motion, record the state inside the page before the action. Adapt `watchMotion()` from the iframe to the top-level page. Install the fake clock before navigation. Advance it only after the relevant reply completes. Keep cold-load timing separate from a warmed interaction test.
- **Host coupling:** the supplied observer selects the first child frame; the supplied reply counter belongs to the host bridge. Use the web page and its actual transport instead.
- **Risk:** a longer sleep or a forced click can hide the fault. A warm-up can also hide a first-load defect if the cold test disappears. Keep the measured behaviour budget unchanged.
- **Owner:** no new taste approval for a check race with one right fix. A new performance budget needs approval.

### CHECKS-11 — Native iOS and Android recheck method

- **Kind:** (b). **Size:** M. **Needs:** CHECKS-09 and a fixed build of the adapted web page.
- **Evidence:** `SCRATCH/qa/device-recheck-1/ios/index.md:3` records 49 shots on three Simulator devices at `170bf85c`. Lines 20–29 record real swipes, piece drags, End turn, and scrollable end actions. `SCRATCH/qa/android-recheck-39/index.md:3` records an emulator run at `801cc7c9`; lines 15–20 record swipe, tap, and own-piece drag results. RC `tools/plugin-ui-check.mjs:2150` states that its WebKit path uses wheel scrolling in place of native pan.
- **Web today:** the named web checks use browser automation. These recorded native runs use the widget build, not the web page.
- **Lift and seam:** reuse the device setup, real touch paths, before/after shots, and measurements. Point the device at an owned local web server. Check Safari and Android Chrome with their browser bars, page zoom, keyboard, background/resume, scroll from a piece, and a saved move after a destination tap.
- **Host coupling:** remove the harness iframe and injected fullscreen/inset query settings. Use the web's real viewport.
- **Risk:** the device reports concern older commits. Their passes are recorded evidence, not a pass at the requested head. The terminal fixture does not prove Play again; both reports name this limit. No current native web result is verified.
- **Owner:** yes for the device and release cadence. A native failure against an approved flow is a fault.

### CHECKS-12 — Rolling QA states, shots, and separate taste review

- **Kind:** (b). **Size:** M. **Needs:** CHECKS-07–09 and CHECKS-21.
- **Evidence:** `SCRATCH/qa/zz-qa-matrix.test.ts:170` defines the states; line 307 captures each state and its variants; line 361 writes the index. `SCRATCH/qa/rolling-3/index.md:3` records 70 shots; line 7 lists 13 states. `SCRATCH/qa/rolling-3/report.md:14` identifies a measurement gap for scrollable text; line 32 separates taste calls. RC `docs/qa/plugin-qa-protocol.md:98` supplies ordered flows and line 125 requires confirmation and regression checks after a fix.
- **Web today:** the web has sample tables and a capture tool. It has no tracked equivalent of this rolling plugin capture for the new web flows. The rolling driver and its shots stay in scratch.
- **Lift and seam:** add web state tables to the existing capture path. Reuse the state list where the web feature exists: home, game list/setup, waiting invite, own turn, other turn, armed card, swap preview, end, settings, profile, collection, failed read, refused turn. Use fixed time and seed data. Keep a named image and measurements for each reached state. Compare faults with earlier shots and tickets before adding a new finding.
- **Host coupling:** replace fixture tools, host theme/context, and iframe selectors with web fixtures and page selectors. A dark-host pass does not prove a dark web palette.
- **Risk:** the scratch capture catches and discards some settle failures at lines 63 and 66. Its measurement checks hidden/clip overflow, but can miss text hidden in a scroll box with no cue. Its small-control check measures pseudo-element size, not every hit point. Use CHECKS-08 and fail an unreached state. Do not use this driver unchanged as a release gate.
- **Owner:** yes for visual improvements and the state matrix. Faults with one right fix stay out of the taste approval list.

### CHECKS-13 — M1 check routing and a web WebKit selection

- **Kind:** (b). **Size:** S for routing; M for the WebKit selection. **Needs:** CHECKS-01, CHECKS-19, and CHECKS-22.
- **Evidence:** `SCRATCH/check-runner.sh:2` accepts arbitrary check names. Lines 16–27 route database checks and WebKit to this Mac. Lines 33–38 copy committed HEAD to an owned M1 checkout; lines 45–65 use one lock per machine and call the normal named runner. MAIN `tools/verify-cursor-adoption.mjs:185` and `tools/verify-workshop.mjs:184` use CDP. RC `tools/check.mjs:32` warns that other checks can depend on Chromium.
- **Web today:** web names already fit the runner's command interface. The M1 wrapper exists only in scratch and copies against a plugin branch base. A merge does not install it as a web tool. No reviewed full web WebKit selection is present.
- **Lift and seam:** retain the named check command and machine lock. Make the source ref and owned target checkout fit the web task. Use Chromium for CDP checks. Add a small WebKit web selection for the adapted screens and keep native touch proof in CHECKS-11.
- **Host coupling:** the routing script is not coupled to the ChatGPT frame. Its database-name routing and bundle base are coupled to the plugin work. Its header says WebKit can use either machine; the actual code at line 24 sends it to this Mac.
- **Risk:** the M1 path copies committed HEAD; local edits are not included. The Mac path runs the working tree. The script can remove a lock after 30 minutes and resets its target checkout. It must use only a dedicated owned target. The M1 has no test database according to this script; current machine state is **unverified**. Do not infer a machine-wide lock from the repo test lock.
- **Owner:** yes to make this a lasting web workflow and set its runner policy. The tool needs a small web variant, not a second check framework.

### CHECKS-24 — Review data for games, ratings, and badges

- **Kind:** (b). **Size:** S. **Needs:** CHECKS-04 and CHECKS-15.
- **Evidence:** RC `tools/plugin-db/seed-review.ts:22` exports `seedReview()`. Line 24 uses `GameService` and `AccountService`. Lines 40–49 make a finished friend win, an active friend game on the other player's turn, and a beginner computer game on the player's turn. RC `tools/plugin-db/seed-review.db.test.ts:56` checks the resulting record and badges in a separate test database.
- **Web today:** the local web game has no server-backed review-data flow. The account browser check seeds its own fake cloud-save row. New profile, game-list, and end-card checks can use this service-level data recipe.
- **Lift and seam:** call the exported function with disposable accounts in the local HTTP/database fixture. Use its game IDs to open the built web screens. For layout edge cases, add deterministic test data at that fixture boundary. Do not call the release CLI to seed a browser test.
- **Host coupling:** the seed function has no frame, widget-message, or `window.openai` dependency. Its present purpose and CLI inputs concern the plugin submission account. The companion test also checks MCP responses; those response assertions stay with the plugin.
- **Risk:** the CLI accepts a privileged database URL. It is not limited to loopback. The function requires two existing accounts and refuses a review account that already has games. Its result includes a rating, so it must use disposable test accounts for web QA.
- **Owner:** yes to use review data in a web acceptance sample. Test isolation and correct totals need no taste choice.

## (c) Web work with no plugin equivalent

### CHECKS-14 — Web browser gates in CI, with an explicit Linux limit

- **Kind:** (c). **Size:** M. **Needs:** CHECKS-05, CHECKS-13, CHECKS-15, and the approved web screen set.
- **Evidence:** RC `.github/workflows/plugin-checks.yml:80` names only `plugin-oauth`, `plugin-ui`, and `plugin-ui-http`. Lines 102–105 select plugin test files and `plugin-ui` for WebKit. RC `.github/workflows/test.yml:27` runs `npm test`; it does not run web `verify-*` scripts. MAIN `.github/workflows/pages.yml:25` builds the site for a manual publish, without web browser gates. RC `docs/specs/chatgpt-mvp/issues/45-pr61-linux-ci.md:148` records native WebKit memory growth in the ARM Linux VM; line 175 keeps the full-job result open.
- **Web today:** local named web browser checks exist, but these workflows do not run them. The plugin CI jobs are not a web adaptation gate.
- **Change and seam:** add a named built-web Chromium selection and a compatible WebKit selection. Reuse the build, output folders, and failure artifacts. Include the new web service flow only when its local fixture is ready. Set required gates from an approved check list.
- **Risk:** a passing plugin frame does not prove the top-level web page. The 160-test WebKit selection in ticket 45 is not the full `plugin-ui` job. Later CI wait scaling does not by itself prove that the native-memory issue ends. Latest target-runner results and required branch checks are **unverified**.
- **Owner:** yes for CI scope and cost. Keep the unresolved full WebKit job visible; do not call it green from the ticket's subset result.

### CHECKS-15 — Built web page through website sessions and the real API

- **Kind:** (c). **Size:** L for the full adaptation layer; M for the check after that layer exists. **Needs:** CHECKS-03–04, CHECKS-07, CHECKS-20, and the web account/multiplayer feature work from the other survey lanes.
- **Evidence:** RC `src/api/http.db.test.ts:37` makes website identities; line 53 signs local session tokens; line 57 starts the API; line 75 plays a friend game through `onlineClient`; line 86 tests a lost reply. RC `tools/plugin-browser-check.mjs:60` instead uses a local development actor and an MCP endpoint. RC `tools/vercel-check.mjs:31` requires no website API function and line 111 requires API requests to return 404.
- **Web today:** local game play works. The account browser check uses fake Supabase responses. RC has useful website HTTP/client/database tests already, but it does not connect the built web page to an exposed website API. This is the missing layer, not a missing server test framework.
- **Change and seam:** extend the existing HTTP/database fixture to serve the built web page with two local test identities. Drive create, join, choose, move, End turn, reload, retry, and sign-out through the UI. Check saved service state after the action. Cover expired or absent web sessions, a stale revision, a second tab, and a lost reply. Replace the output check's deliberate API refusal assertions when the approved release exposes the API.
- **Risk:** MCP development actors bypass website session verification. Reusing that shortcut would leave the web trust boundary untested. Keep local test identity setup out of production code. A client-level API pass alone does not test web routing or persistence.
- **Owner:** yes for feature and release scope. Session verification and one application of a command are correctness requirements, not taste calls.

### CHECKS-16 — New web flows across offline cache and site updates

- **Kind:** (c). **Size:** M. **Needs:** CHECKS-15 and CHECKS-23.
- **Evidence:** MAIN `docs/perf/check-update.mjs:40` checks cache takeover and replacement; line 64 checks local play while signed in and offline. MAIN `tools/measure-load.mjs:100` cross-checks a cold visit with service workers blocked. RC `tools/plugin-real-host.test.ts:1` tests a cross-origin widget; it has no top-level site service-worker update path.
- **Web today:** local offline reload, cache replacement, and signed-in local play have checks. The new server-backed screens and commands have no built-web cache/update check. The plugin has no equivalent site service-worker lifecycle.
- **Change and seam:** extend the existing web update fixture. Keep local play usable. Check an old cached page with a newer service, session expiry while offline, an in-flight server turn when the network drops, and a reload after the site updates. Read the server to prove that a retried turn applies once. Keep account/session data and private API responses out of the static cache.
- **Risk:** an offline-ready shell can show an old game or the wrong command state. Cached assets can also hide a load regression. The existing load tool reports measurements; it does not assert a speed budget (`tools/measure-load.mjs:115`, line 123).
- **Owner:** yes for new offline behaviour and any performance budget. Duplicate moves or private data in a shared cache are faults.

## (d) Plugin-only checks: retain them for the plugin

### CHECKS-17 — Host frame, widget state, and chat-result contracts

- **Kind:** (d). **Size:** S to exclude from the web feature plan. **Needs:** none for web use.
- **Evidence:** RC `tools/plugin-ui-harness.ts:26` builds the resource CSP/sandbox policy; line 47 supplies `window.openai.widgetState`; line 56 reads the UI resource through MCP. RC `tools/plugin-ui-host.ts:6` supports a live frame for each chat result; line 67 receives widget-state messages; line 90 creates the host bridge. RC `tools/plugin-real-host.test.ts:1` names this host simulation.
- **Web today:** `index.html` and `src/main.ts` run as the page, not as a widget resource. There is no ChatGPT inline/fullscreen lifecycle or widget-state store in that entry path.
- **Change and seam:** keep these tests on the plugin. Reuse only the user-level recovery scenarios through CHECKS-07 and CHECKS-15. Test web reload, navigation, and tabs through the page's own interfaces.
- **Risk:** copying widget persistence or composer spacing into the web app adds a false host dependency. The name “real host” does not mean the test runs in ChatGPT; it runs the local harness.
- **Owner:** no new taste call. This is a platform boundary.

### CHECKS-18 — MCP protocol, plugin OAuth, and submission checks

- **Kind:** (d). **Size:** S to retain unchanged for the plugin. **Needs:** CHECKS-20 for the web sign-in path; CHECKS-15 for website API sessions.
- **Evidence:** RC `tools/plugin-browser-check.mjs:16` selects OAuth, fixture, or HTTP mode; line 82 sends OAuth mode to `plugin-oauth-check.mjs`. RC `.github/workflows/plugin-checks.yml:45` runs plugin build, server, runtime, and protocol checks. RC `docs/qa/plugin-qa-protocol.md:115` checks chat-visible tool data and annotations; line 123 checks submission readiness.
- **Web today:** the web has its own account UI and redirect check. It does not need MCP tool discovery, widget resource metadata, private chat summaries, or ChatGPT submission rules to play a local game.
- **Change and seam:** keep those gates for the plugin release. Use shared service/HTTP tests for rules and data access. Do not use a plugin OAuth pass as evidence for web sign-in.
- **Risk:** common use of the same account store can make two different sign-in flows appear equivalent. Shared database safety tests remain useful; the host protocol checks remain plugin-only.
- **Owner:** no new taste call for keeping the platform checks separate.

## (e) Web checks already present: no gap

### CHECKS-19 — Named web browser checks and the QA fault ledger

- **Kind:** (e). **Size:** S; reuse. **Needs:** none.
- **Evidence:** MAIN `tools/lib/registry.mjs:10` lists 24 default checks. They include `read-piece`, `verb-marks`, `lessons`, `turn`, `link-game`, `end`, `their-turn`, `game-screen`, `menu-extra`, `home`, `account`, `cursor-adoption`, `king-effects`, `lesson-return`, `new-game`, `painted-game`, `powers`, `special-moves`, `ux-defects`, `visual-design`, `workshop`, `workshop-cast`, `qa`, and `selftest`. MAIN `tools/check.mjs:145` builds and serves the app; line 157 runs checks and checks for repo changes. MAIN `tools/qa.mjs:14` defines FAIL/XFAIL/XPASS; line 17 ties known faults to tickets. MAIN `tools/qa-known-red.json:1` is empty.
- **Web today:** these checks exercise the built local game. QA covers saved rules, special pieces, undo, computer play, cancellation, promotion, and phone overflow. An empty known-fault ledger does not prove that the checks currently pass.
- **Change and seam:** extend the matching named check. Use `npm run check:browser <name>`. Keep `QA_ONLY` for a focused case, and keep ticket-backed known faults with XPASS failure. Do not replace the web suite with the plugin suite.
- **Risk:** QA is a long, exclusive Chromium check. `qa` alone does not cover all web UI or new service screens. Current results are **unverified**.
- **Owner:** no new taste call for retaining existing cover.

### CHECKS-20 — Web sign-in, cloud save, and account failure checks

- **Kind:** (e). **Size:** S for reuse. **Needs:** CHECKS-06 after merge; CHECKS-15 for the new service UI.
- **Evidence:** MAIN `tools/verify-account.mjs:1` lists its cover. Line 35 seeds page state and routes fake Supabase responses. Line 97 checks that signed-out play loads no account client or account request. Line 118 checks the Google redirect and PKCE. Line 305 covers an expired session and offline sign-out. MAIN `src/account/account.test.ts:8` checks account UI and line 31 checks escaping.
- **Web today:** optional sign-in already exists. The check covers sign-in return, cloud save, conflicting saves, lessons/Home, offline failure, sign-out, deletion, and phone controls. This is not a blank web sign-in requirement.
- **Change and seam:** extend the existing `account` check for any added profile or service entry. Keep fake provider responses for deterministic browser tests. Reuse the real website-session API tests for the service boundary.
- **Risk:** these tests do not prove a live identity provider's settings, mail, or hosted redirects. Those results are **unverified**. Do not run a release check in the owner's signed-in session.
- **Owner:** no new taste call for retaining sign-in checks. Added account features need approved scope.

### CHECKS-21 — Web render capture and stable comparison

- **Kind:** (e). **Size:** S for reuse. **Needs:** CHECKS-12 for new state tables.
- **Evidence:** MAIN `docs/specs/web-ux/capture.mjs:6` loads named state tables; line 23 defines desktop, laptop, tablet, phone, small-phone, and landscape sizes; line 69 seeds the saved game; line 85 opens the built page. MAIN `docs/specs/web-ux/render-compare.mjs:12` defines `--against`; line 16 renders the base again; line 18 separates stable differences from unstable states. The tool is unchanged between MAIN and the requested RC.
- **Web today:** this tool already checks saved moves, overflow, controls, touch targets, and optional video. The comparison detects missing image partners and unfinished samples. There is no need to build a new pixel-comparison engine.
- **Change and seam:** add state tables for the approved web adaptation. Use the existing capture and two-folder comparison for matching shot sets. Use `--against main` for the web sample-table path. Keep same-environment base repeats and the build/chunk/precache comparison beside the render comparison.
- **Risk:** plugin QA prose names `tools/render-compare`, but the actual tool is this file. `--against` uses web sample tables, not arbitrary widget state drivers. MAIN `docs/lessons/browser-checks-and-ui.md:11` records unstable art and the old sample `00` selector fault. Current sample health is **unverified**. Pixel equality does not prove usable input.
- **Owner:** yes for a new visual result, with the required rendered sample. Unexpected changes against an approved sample are faults.

### CHECKS-22 — Test lock, browser slots, and run records

- **Kind:** (e). **Size:** S; reuse. **Needs:** CHECKS-13 only for machine routing across separate checkouts.
- **Evidence:** MAIN `package.json:11` wraps `npm test` in `tools/test-lock.sh`. MAIN `tools/test-lock.sh:7` places the lock in Git's common directory; line 9 keeps it through child processes; line 15 permits a nested locked command. MAIN `tools/test-lock.test.ts:46` checks a second worktree; line 56 checks surviving children. MAIN `tools/check.mjs:90` records HEAD, check names, results, and logs; line 135 uses slots. The test-lock script is unchanged in RC.
- **Web today:** worktrees of one clone already share the test lock. The browser runner already has its own run lock, slots, limits, output folder, and exclusive checks.
- **Change and seam:** continue to use `npm test` and the named browser runner. Add registered names rather than an independent launch path. Preserve the run record and full failure log.
- **Risk:** the test lock does not serialize browser scripts or another clone. Without Git or Perl, the script runs without a lock. A filtered run through `KINGDOWN_TEST_FILE` is not a full-suite pass. Keep that filter in the evidence.
- **Owner:** no new taste call. Do not describe test-lock as a new plugin feature that the web lacks.

### CHECKS-23 — Cold load, offline reload, and service-worker updates

- **Kind:** (e). **Size:** S for reuse. **Needs:** CHECKS-16 for new server-backed flows.
- **Evidence:** MAIN `tools/measure-load.mjs:6` defines a fresh slow-phone profile, 4× CPU, and network limits. Line 58 creates the profile; line 83 checks repeat and offline visits; line 100 blocks service workers for a control. MAIN `docs/perf/check-update.mjs:40` checks takeover, new content, and cache replacement; line 64 checks signed-in offline local play and saving. MAIN `vite.config.ts:23` registers the worker after the board loads. These tools are outside the named registry at `tools/lib/registry.mjs:10`.
- **Web today:** these checks already exist. The plugin payload-size check is not a substitute for them. The web has a site cache and lazy account code that the widget harness does not model.
- **Change and seam:** keep the existing local build/update fixture and measurement output. Add it to the approved web release procedure. Register or invoke it through a reviewed check path if CI must enforce it. Do not infer a pass from the load tool's exit alone: it records offline failure and page errors as data.
- **Risk:** both tools launch Chromium directly. The network measurement needs CDP. Service-worker traffic can escape the emulated limit. The update test checks a controlled local update, not a public deploy.
- **Owner:** no new taste call to retain the checks. A new speed budget or required CI gate needs approval.

## Test seams for the web adaptation spec

Use the highest existing interface that proves the requirement. Add a lower-level test only when it gives evidence that the higher interface cannot supply.

| Requirement | First test seam | Evidence and limit |
| --- | --- | --- |
| A player starts, moves, ends a turn, reloads, or changes a setting | Built page through `app-ui.mjs`, `new-game-ui.mjs`, and a named `verify-*` check | MAIN `tools/app-ui.mjs:81`, line 116, line 208, line 252; `tools/new-game-ui.mjs:16`. Use `readyBoard`, `waitForUi`, `lanMoves`, real pointer input, and the saved result. |
| Account redirect and local/cloud save behaviour | Existing `account` browser check with fake provider routes | MAIN `tools/verify-account.mjs:35`. Keep the web sign-in path. |
| A server-backed web flow, with valid website identity | Built-page variant over the existing real HTTP/database fixture | RC `src/api/http.db.test.ts:37`, line 53, line 57. This fixture already uses `onlineClient`; add the page layer in CHECKS-15. |
| API access, retries, and browser request limits | `onlineClient` through `createApiHandler`, local signed sessions, and PostgreSQL | RC `src/api/http.db.test.ts:75`; `src/api/http.test.ts:1`. This is higher than calling the store directly. |
| Game setup, deadlines, ratings, badges, and concurrent commands | `GameService` with `PostgresMatchStore` and separate test databases | RC `src/match/service.db.test.ts:26`, line 49; `src/match/setup.db.test.ts`, `matchmaking.db.test.ts`, `results.db.test.ts`. Keep whole-turn and revision assertions. |
| Worker save/reload or per-game rule isolation | `createMatch` / `loadMatch`, then snapshot, apply, choose, and export | RC `src/match/index.ts:72`; `src/match/match.test.ts:16`. Do not import a worker's private state. |
| A rule's legal moves or move count | Existing rules tests and `perft` | RC `src/rules/classic-chess.test.ts:20`; MAIN `src/rules/rules.test.ts:23`. Set and reset the rule set. |
| Painted input and first visible frame | `PaintedView` public callbacks and `ready()` | RC `src/render/PaintedView.test.ts:27`, line 47. Then prove native touch through CHECKS-11. |
| Visual change and responsive fit | Existing web state tables, capture, and render comparison | MAIN `docs/specs/web-ux/capture.mjs:39`; `render-compare.mjs:12`. Add hit tests for covered controls. |
| Offline/update behaviour and static/service routing | Existing update fixture and combined build-output check | MAIN `docs/perf/check-update.mjs:40`; RC `tools/vercel-check.mjs:67`, line 111. Current site output deliberately refuses website API routes. |

## Open questions for the owner

1. **Which browser checks become required for the web adaptation?** Options: (1) only the changed feature checks; (2) changed checks plus a small local-game/account smoke set; (3) all web checks on every PR. **Pick: 2.** Use Chromium and a reviewed WebKit subset. Run the broad web suite for the release. Add failure logs to both jobs. This keeps CHECKS-14 small and makes the gate clear.

2. **When do native device rechecks run?** Options: (1) each UI step; (2) after touch, viewport, keyboard, or navigation changes and before release; (3) only before release. **Pick: 2.** Use iOS Simulator Safari and Android emulator Chrome. Keep the build fixed and record its hash. Add a physical-device pass if the release claim requires one; current physical-device cover is unverified.

3. **What touch-target rule applies to the web?** Options: (1) retain the present 44 px floor everywhere; (2) retain 44 px and use 48 px for the new Android touch controls; (3) use 48 px for all touch controls. **Pick: 2.** Check actual hit areas and neighbour overlap. Approve the layout sample before a visible size change.

4. **Which rolling QA states become part of the web sample set?** Options: (1) only the changed screen; (2) all new web states plus the existing local-game path; (3) copy every plugin state and variant. **Pick: 2.** Reuse the web capture tool. Keep separate fault and taste lists. Require a named reason for each state that cannot be reached.

5. **What happens to the open full Linux WebKit job?** Options: (1) require a confirmed full pass on the target runner; (2) accept the passing test subset as the full job; (3) drop WebKit. **Pick: 1.** Keep the memory-failure limit in the release evidence until a target-runner pass or a confirmed cause closes it. No test result in this read closes it.

6. **Which speed and offline promises does the web make?** Options: (1) retain current measured behaviour; (2) set web-specific budgets from a cold and warm baseline; (3) copy the widget budgets. **Pick: 2.** Keep the current offline local-game checks. Add the new service flows in CHECKS-16. Treat numeric budgets and the offline user experience as approval items.

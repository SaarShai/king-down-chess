# Release packet — PR 71: Publish the safe public worker

**Status: PUBLISHED 2026-10-20 (main cc1081b2, deployment dpl_7v1QcQTHnNTjDP2xpCP5fjNy1Wdm); live worker check PASS. One post-publish row stays OPEN: O8, the new deployment's scheduled job outcomes. Section 0a decides which rows apply to slice 1; the OPEN labels in sections 1 to 9 are the pre-ruling proposal record.**

> Committed copy (2026-10-20). The T4 record is [pr71-t4.md](pr71-t4.md). Paths that start with `scratchpad/` name the main session's evidence folder (images, logs and CI copies); they are not in the repository.

This copy corrects packet02.md after the independent review in packet02r.md. All five findings are confirmed. The packet controls are corrected below. Missing builds, results and operator records stay OPEN. This copy does not turn a proposed step into proof. The reader verdict on the prior copy is **reject**.

This packet covers web build ticket 02 and one public worker publish to project **kingdown**, at https://kingdown.dev. It opens no website account page or API operation. The owner asks the main session to merge PR 71 and deploy it. The main session must attach the reviewed evidence and the owner's words to the final source. This drafting run performs no test, build, browser, server, database, deploy or live probe.

Plan and pass rule: verify the reader findings against fixed source and CI; correct each confirmed gap; check this copy for complete gates and honest result labels. The source and CI checks in this revision use read-only commands. Only the two requested answer files receive writes. The project ticket stays unchanged under this task's read-only rule.

Publication clears only after all applicable pre-publish rows have retained evidence and signatures. This includes a tested compatible recovery build and the output equality gate in section 9. The live result clears only after both unsigned live checks and the new deployment's tick, daily and cron-history outcomes pass. Command exit 0 alone does not close the release.

## 0. Main-session rulings (2026-10-20)

The main session accepts this packet's structure under the planning delegation, with these rulings. Each ruling is scoped to this worker-only publish (slice 1). No account page, API operation, server state or engine changes in this slice.

1. **Output equality (reader finding 3, section 9, O4b).** The full-tree manifest, equality and retention gate in `tools/deploy.sh` is not a requirement for this publish. The release route requires source equality: the operator checks that the fetched main commit equals PACKET_MAIN (release-route.md:36), and `tools/deploy.sh --publish` repeats its own built-output checks on the output that it publishes. In its place, this publish adds one cheap drift check: the SHA-256 of the live `/sw.js` after publish must equal the SHA-256 of `sw.js` in the release output that the final CI `web-online` run built from PACKET_MAIN (its worker-outputs record), and the live worker `POLICY` must be `public-build-v1`. A difference stops further exposure and starts the recovery procedure until the cause is known. Section 9 stays as a recorded proposal for the slices that open account routes (slice 3 and later), where the function output carries server behavior.
2. **Recovery build (finding 1, section 3).** Slice 1 writes no server or account state. A compatible recovery is a fix-forward worker: the release commit plus the reverted or repaired change, built with a new `VERSION` and the same `POLICY = 'public-build-v1'`, allowlist, purge and handshake. The takeover mechanism is proven by the existing `web-online` recovery case (release worker to a later safe worker, failed purge, dormant old worker, two tabs, offline local assets) on Chromium, Firefox and WebKit in the final CI. The recovery-server and data-state rows of section 3 apply from slice 3 on; for this slice they are not applicable, because the server code does not change. Never restore the broad private-response cache.
3. **Engines and production state (section 4).** This slice changes no engine file, migration or grant, and it keeps main's engines check (row 2d: the stricter save-level report needs read rights that the release login does not have; it moves to ticket 06). One fresh engines report (check-only `tools/deploy.sh` with `KINGDOWN_ENGINES_DATABASE_URL`, run by the release operator) covers both outputs, because their engine archives are equal; the operator records that equality. The applied migration list is recorded as unchanged from the prior release record.
4. **Kept as written:** the phase 1 evidence (finding 2: final CI on all three engines, the 24 default local checks at base and final, two stable base captures and the final comparison, on the M1), the post-publish job outcomes (finding 4) and the local-root load record (finding 5: three samples each, worker active and blocked, base and final, on the M1).
5. **Order (changed 2026-10-20 by the release operator).** The OpenAI domain-token deploy has no date (an OpenAI identity fault blocks the plugin upload, support case 17581301). So PR 71 may merge and publish first when its rows close. BASE_MAIN is main `1476f55c68e9cc7515ffafd1c5f895e68fb3ddf5` (tree `d5ed4dce4911cbc67a439b7e59b25c01a3753f76`): the live `85c249be` plus PR 74 (Playwright 1.64.1, devDependency and one harness test; owner word "yes, merge 74", 2026-10-20). Its tree equals the tree of `c5b821cb`, the base of the T4 captures. The later token deploy publishes the main of its time and repeats the live `/sw.js` SHA-256 and `POLICY` check of ruling 1.
6. **Prior release record (release operator, 2026-10-20).** The live base: commit `85c249be165797bd99b14c4b1083e0e55ac9018c`, tree `960a83672ce5ae0f968d342e3c6d58eb0dcf7ab9`, deployment `dpl_DNLidzkjUzetxFGQrMCDftrYPtda`, deploy log ended 2026-10-20T04:00Z (operator log `~/kingdown-deploy-61.log`): npm test 196 files and 3,277 tests pass, 8 skip; checks 24 of 24 and 2 of 2 pass; every engine in use (2) has its bundle; both live checks pass. The prior live worker (read by the main session 2026-10-20T04:29:50Z, GET `https://kingdown.dev/sw.js`): HTTP 200, 8,609 bytes, SHA-256 `2f0e7f73b838a669ec5e9e61999d8d879861608abeb6a11a0247491e1ae4206c`, `VERSION = 'b8306ad30538'`, no `POLICY` (the old worker); copy in the main session's `release02/prior-sw.js`. The engines report and the live database parts come from the operator's check-only run (`~/kingdown-check-71.log`, `~/kingdown-check-71-parts.log`): closed, see rows 2b and 2c below.

7. **Owner words (recorded 2026-10-20; given in the plugin session's chat, relayed verbatim by the release operator).** Merge and publish of PR 71: "merge 71 and deploy it" (2026-10-20), then "merge 71 and deploy when it's ready." (2026-10-20). PR 74, the dependency: "yes, merge 74" (2026-10-20), merged at main `1476f55c`. These words apply when every applicable pre-publish row of this packet is closed ("ready"). The release operator merges PR 71 and runs `tools/deploy.sh --publish` at that main. It holds every other merge to main until the publish ends, so the main of the final CI `web-online` run is the main that publishes. After the publish, the main session runs the live `/sw.js` SHA-256 and `POLICY` check of ruling 1 against the operator's deploy record.

### 0a. Closure record for slice 1 (main session; the rulings above decide which rows apply)

| Row | Owner | Status | Evidence |
|---|---|---|---|
| 1a. Final CI on Chromium, Firefox and WebKit at the final PR head | Main session | Closed 2026-10-20 | Final head c45295a7 (tree d0d4ea96). Its diff from f24dee47 is `tools/engines-check.mjs` and `tools/engines.test.ts` (back to main) and ticket 02's text only. Every job passes on both events: [39379514516](https://github.com/SaarShai/king-down-chess/actions/runs/39379514516) (pull_request, checkout e1a04ad = c45295a7 merged into 1476f55c) and [39379508091](https://github.com/SaarShai/king-down-chess/actions/runs/39379508091) (push, checkout c45295a7): verify, browser, browser-web, browser-firefox and browser-webkit (WebKit web-online included); Test run [39379514579](https://github.com/SaarShai/king-down-chess/actions/runs/39379514579) passes. Attempt 1 of each failed one job on a known page-clock race outside this diff, and attempt 2 of the failed job passes: 39379514579 (J12/passive drawing), 39379514516 browser-webkit, 39379508091 verify (`tools/plugin-menus.test.ts` F4, the J12 steps; `expect.poll` timeout). The fix for these races is on claude/plugin-clock-races (release operator). Earlier: f24dee47 passes every job on both events (runs 39374841858, 39374837880, Test 39374842083); the 1.63 WebKit faults of 2c250f8b also fail on main 85c249be (run 39364152158), so they are not PR 71 faults. **Worker identity for ruling 1:** the release output of both web-online runs (artifact web-check-logs, `web-online/worker-outputs.json`) has `static/sw.js` SHA-256 `ecf6796c6dc023ddc911f382a28edd574198b2b0dbcb9b920aaee91923259237`, equal to the T4 FINAL worker (VERSION d12f2d90de07, POLICY public-build-v1, 16,659 bytes). Copies: `scratchpad/ci71c/web-logs-39379508091/` and `web-logs-39379514516/`. |
| 1b. 24 default local checks at BASE_MAIN and final | Main session (this Mac, one at a time) | Closed 2026-10-20 | BASE c5b821cb (tree d5ed4dce, equal to main 1476f55c) and FINAL a9600e47 (tree f27fb62a, equal to f24dee47): 24 of 24 each, exit 0, no skip. The delta from f27fb62a to the final head c45295a7 changes no file that the site build reads (the two deploy tools and ticket 02's text), so the FINAL result applies to c45295a7. Record: `[pr71-t4.md](pr71-t4.md)` (evidence in `scratchpad/release02/`; operator and independent reader both signed; reader verdict accept with changes, corrections made). |
| 1c. Two stable base captures and the final comparison | Main session | Closed 2026-10-20 | 52 unique pairs. BASE repeat and BASE versus FINAL: zero differences and zero missing partners after one narrow mask (x=21, y=614, 56 x 65 px, the settled Workshop-ledge pawn thumbnail in workshop-phone.png), whose noise is identical in the BASE repeat. The main session accepts the mask: it covers the same idle-callback shadow noise in both trees, and no equality claim applies inside it. Raw pairs retained. Record: `[pr71-t4.md](pr71-t4.md)` (evidence in `scratchpad/release02/`; operator and independent reader both signed; reader verdict accept with changes, corrections made). |
| 1d. Local-root load record and O5L acceptance | Main session | Closed 2026-10-20 | 30 samples (3 per state, 5 states, BASE and FINAL), headless Chromium 156, 1440 x 900, CPU rate 4, 150 ms latency, 200,000 B/s down. Medians, board-ready: blocked cold 19.106 to 19.261 s; first-install cold 19.499 to 19.310 s; blocked warm 0.426 to 0.445 s; active cold HTTP 1.083 to 1.744 s; active warm 0.439 to 0.559 s. Installing to activated 30.35 to 53.38 s; navigation to activated 49.9 to 72.9 s. **Accepted limits (main session, delegated plan decision):** (1) first-visit board-ready (blocked cold, first-install cold) within +5% of BASE: +0.8% and -1.0%, pass; (2) returning player with an active worker: board-ready at most 2.0 s cold HTTP and 1.0 s warm under this profile: 1.744 s and 0.559 s, pass. The allowed change (+0.66 s, +0.12 s) comes from the network-first start page (public/sw.js:116-128), which gives a returning player the current page and the update check; that is the intended trade. (3) Installation runs after the board is ready and never blocks play: navigation to activated at most 90 s under this profile: 72.9 s, pass. Its +23 s comes from the sequential precache loop (public/sw.js:53-57): 175 requests at 150 ms latency is about 26 s. Follow-up after this publish: a bounded-parallel precache with the same per-response checks, target near BASE. Record: `[pr71-t4.md](pr71-t4.md)` (evidence in `scratchpad/release02/`; operator and independent reader both signed; reader verdict accept with changes, corrections made). |
| 2a. Token deploy record | Release operator | Not applicable (ruling 5) | No token deploy; the prior release record is ruling 6. |
| 2b. Engines report | Release operator | Closed 2026-10-20 | Check-only `tools/deploy.sh` (no `--publish`) at origin/main `1476f55c68e9cc7515ffafd1c5f895e68fb3ddf5`, with the Keychain read-only release login; exit 0. npm test 196 files, 3,278 tests pass, 8 skip; check: all 24 passed; check: all 2 passed; MCP PASS (26 tools); "engines-check: every engine in use (2) has its bundle"; site tree with 5 archived engines passed; last line "deploy: checks passed at 1476f55c…; published nothing (no --publish flag)". Log `~/kingdown-check-71.log`; the main session read these lines in the log. PR 71 changes no file in `engines/`. |
| 2c. Applied migrations and live parts | Release operator | Closed 2026-10-20 | Read-only catalog lookups in one read-only transaction: 0005 to 0014, the audience hook, `kingdown_oauth.client_resources` and the runtime role are present. `supabase/migrations` on main holds 0001 to 0014, so no migration is new. Log `~/kingdown-check-71-parts.log`; the main session read it. PR 71 adds no migration or grant. |
| 2d. Checker and login compatibility | Release operator; ruling by the main session | Closed 2026-10-20 by file identity | The stricter check of slice 3 (f24dee47) stopped against production: "Cannot read games (SQLSTATE 42501)", because the release login reads only `games (engine_fingerprint, status)` by design. Ruling: commit d07b862d restores main's `tools/engines-check.mjs` (blob 251db847) and `tools/engines.test.ts` (blob 77bd7b59), equal to main 1476f55c, so row 2b is the exact report for the PR 71 file. `deploy.sh --publish` still stops without the engines setting. The save/column agreement count moves to ticket 06 (a read-only function that returns counts and stamps only); no wider login rights. Limit, as on the live site today: main's check reads plugin_matches only when games is absent. Archive equality (ruling 3): the `engines/` tree is `3ca60280` at main 1476f55c and at c45295a7, and the runtime build copies every archived bundle into `functions/mcp.func/runtime/engines` (tools/plugin-runtime-build.mjs:47), so the release and recovery outputs carry the same engine archives. Row 2b proves that the login runs this checker; it is not the report of the final output: the publish run's own "engines in use" step at the merged main is that report, and the operator attaches its source, time, stamp lines and exit after the publish. Main's check does not prove save/column agreement or plugin_matches coverage; do not record them as passed. Independent review (Astra and Sol, 2026-10-20): both "accept with changes"; no code fault; the record fixes are in this packet, ticket 02 (c45295a7) and ticket 06 (codex/web-06 65699f2e). |
| 3. PR 74 decision | Owner | Closed 2026-10-20 | "yes, merge 74"; merged at main 1476f55c. |
| Post-publish: live `/sw.js` SHA-256 and `POLICY` (ruling 1) | Main session | Closed 2026-10-20 | PASS at 2026-10-20T11:07:27Z: `https://kingdown.dev/sw.js` and a query URL both give HTTP 200, 16,659 bytes, SHA-256 `ecf6796c6dc023ddc911f382a28edd574198b2b0dbcb9b920aaee91923259237`, VERSION `d12f2d90de07`, POLICY `public-build-v1`, etag `9fd03b2e982ba40446ec763b804c88c7`. This equals `static/sw.js` in the release output of both final CI web-online runs (row 1a) and the operator's live-check line. Copies: `scratchpad/release02/live-sw-20261020T110726Z-{plain,query}.js` with headers. |
| Post-publish: launcher and deploy record | Release operator | Closed 2026-10-20 | Merged main `cc1081b24ca8362d41d7cc2b2f7c9de0d21b4aea` (tree d0d4ea96, equal to the PR head c45295a7; merged 2026-10-20T10:35:22Z). The release-main worktree, detached at cc1081b2 after npm ci, runs PR 71's `tools/deploy.sh` (its line 59 publish stop). Run 10:35:38Z to 11:04:40Z; "release: deploy.sh ended with exit 0"; "deploy: published cc1081b2… to kingdown; live checks pass". Deployment `dpl_7v1QcQTHnNTjDP2xpCP5fjNy1Wdm` (READY, production https://kingdown.dev). npm test 199 files, 3,509 pass, 8 skip; check: all 24 passed; site tree worker d12f2d90de07 / public-build-v1, 175 offline URLs. Engines step with the read-only release login: archived bab22e94 (2 unfinished) and e668782a (4 unfinished); "engines-check: every engine in use (2) has its bundle"; prelude "schema-check: migration 0014 present; runtime grant present". live-check: bundle ./assets/index-Dk4CR2PB.js, 4 legal pages identical, 181 public files match bytes and types, 16 closed-route probes pass; plugin-live-check pass. Record relayed by the release operator. |
| Post-publish: job outcomes (O8) | Release operator | OPEN (after publish) | Section 6: the first scheduled tick and daily HTTP 200 and the cron-history SQL success after 10:35Z, attributed to dpl_7v1QcQTHnNTjDP2xpCP5fjNy1Wdm. Observe only; no manual job call. Asked of the operator 2026-10-20T11:08Z. |

## 1. Evidence and source

All H file citations refer to commit **2c250f8b3cb5d5b8a1ccd2a6603a656416c9e1ee**, tree **e87e5731cee94d510f8b124b4dc0c0a59477dc3f**. All M citations refer to the fetched origin/main at **85c249be165797bd99b14c4b1083e0e55ac9018c**, tree **960a83672ce5ae0f968d342e3c6d58eb0dcf7ab9**. The final PR head is **c45295a7** (tree **d0d4ea96e41cb20edd634c2474527fa9d887c68c**): **f24dee47** (tree f27fb62a, the merge of main 1476f55c) plus the restored main engines check and ticket 02's text (row 2d). The merge f24dee47 differs from 2c250f8b only in `package.json`, `package-lock.json` and `tools/plugin-ui-harness.test.ts` (PR 74). c45295a7 then returns `tools/engines-check.mjs` and `tools/engines.test.ts` to main, so H citations of those two files describe the superseded slice 3 check; every other H citation stays valid. Paths start at the repository root. A citation to a test proves that the case exists. It proves a pass only when a result is also cited.

Read-only source commands for the packet (the prior copy lists these; this revision repeats fetch, the source/tree records, path comparison and predecessor equality):

~~~sh
git fetch -q origin
git show -s --format='%H%n%T%n%P%n%s' HEAD
git log -1 --format='%H %T %s' origin/main
git log -1 --format='%H %T %s' origin/codex/web-02
git diff --stat origin/main...HEAD
git diff --numstat origin/main...HEAD
git diff --name-only origin/codex/web-02...HEAD
git diff --exit-code origin/main:public/sw.js HEAD:tools/fixtures/web-worker/old-sw.js
~~~

The last command exits 0. The frozen old-worker source equals the worker source on fetched main. Its built version and file lists still need the prior output record.

| Field | Record |
|---|---|
| Slice | PR 71; branch codex/web-02; docs/specs/web-build/issues/02-safe-worker.md:9–23. |
| Local source | H. Its parents are fbbcb2f7f81ecd9e629a88b7cb01a3a72afc7ed3 and M. It includes the current main. |
| Pushed PR head | **fbbcb2f7f81ecd9e629a88b7cb01a3a72afc7ed3**, tree **421f6a1a5fca8fe817a8dd17e7c492d53bf3b611**. Existing PR checks attach to this head, as supplied in the task. The exact checkout commit for each CI event remains OPEN. |
| Difference from the checked head | H adds the two main test repairs and their tickets: docs/visual-design/verify.mjs, tools/plugin-menus.test.ts, and tickets 58 and 59. No runtime file changes in that comparison. This does not transfer the old check result to H. |
| Current live source | **85c249be165797bd99b14c4b1083e0e55ac9018c**, supplied by the owner in this task. **OPEN:** attach its deployment ID and operator record. |
| Last repository deploy record | M docs/specs/web-adaptation/issues/08-release-evidence.md:62–72 records source 3d4c97ae and deploy kingdown-1uncjepb9. It is historical. It does not prove the supplied current live source. The README:7 still names that older source. |
| Required intervening publish | **OPEN, O1/O4a:** the domain token file publishes from main before PR 71 reaches main. Attach the approved operator record, source/tree, deployment ID, publish time, checks, live results and retained combined output. Also record the PR 71 merge time to prove the order. Do not copy the token value. The token publish becomes the prior deployment for PR 71. |
| Planned release main commit/tree | **OPEN:** the final main commit after the token publish, the approved dependency merges, and the PR 71 merge. H is a preparation source, not a claim about that future commit. |
| Accepted comparison base | **OPEN:** fix the exact post-token main source before PR 71. Compare that base with the final source. Keep M and the historical render record as references. |
| Independent review | H ticket 02:41–45 records two reviews, nine confirmed fixes, one refuted finding and acceptance of both Firefox fixture fixes. **OPEN, O4/O7a:** attach the item-by-item findings/fix record, tests and a reader review of the final diff and this corrected packet. packet02r.md rejects the prior packet. This revision does not replace independent acceptance. |

### Source selection rule

The deploy selects fresh origin/main. It accepts no source ref or deployment ID. H also accepts no approved output manifest and retains no publish copy. Section 9 makes that missing enforcement a pre-publish stop. Keep main fixed through source selection. The release operator compares the fetched commit with the approved packet commit. If they differ, stop. Renew the source checks, review and source-specific owner go. The operator also compares the commit in the deploy's worktree log. Evidence: H tools/deploy.sh:175–184,216–229; H docs/specs/web-adaptation/release-route.md:33–37.

The main session sets PACKET_MAIN and BASE_MAIN only after it records their full public commit IDs. The release operator then runs:

~~~sh
git fetch -q origin
git show -s --format='%H %T %P' origin/main
git diff "$BASE_MAIN" "$PACKET_MAIN" --stat
~~~

Pass means that fetched main equals PACKET_MAIN, the recorded tree matches, the reviewed scope is unchanged, and the required token publish already succeeds. This is step O4 below.

### Exact public scope

The comparison M...H has 24 changed source paths. Under public/, only **public/sw.js** changes. No local screen, plugin screen, migration, engine archive or route builder changes in this comparison. The release still publishes the combined static site and MCP function as one unit. It does not publish a separate static site.

| File or route | Public result and evidence |
|---|---|
| /sw.js | Replace the broad cache with policy **public-build-v1**. The build inserts the exact ALLOWLIST and PRECACHE and a 12-character content VERSION. H public/sw.js:5–35; vite.config.ts:15–36,55–69. |
| / and /index.html, including local-link queries | Keep local play. Fetch the requested page from the network first. After failure or the 4 s page timeout, use the installed root shell. Do not replace that shell with a later network page. H public/sw.js:18–28,116–128. |
| Exact local build graph | Cache only the emitted local entry graph, its static/dynamic imports, AI worker, CSS and imported assets; public UI images, fonts, icons and manifest. Exclude the account-only client, other page entries, source maps, legal pages, metadata and auth files. H vite.config.ts:15–36; tools/offline-build.test.ts:18–84,118–147. |
| Other asset queries and protected requests | Pass asset query variants, any Authorization request, non-GET, foreign origin and request no-store to the network without a worker cache read. Refuse unsafe response writes: no-store, redirects, wrong URL, failed response or non-basic response. H public/sw.js:14–35,131–147. Root queries share only the public installed root fallback; the worker does not save callback responses. |
| Cache removal and reply | Install the full offline graph before takeover. Remove obsolete kingdown-* caches. Check the active registration and the current offline cache before and after removal. Reply with request ID, policy and version only after success. Repeat proof on each request and after restart. Keep unrelated caches and other storage. H public/sw.js:38–113. |
| Future private client boundary | src/online/client.ts:32–41 sends through src/online/cache-policy.ts. It requires a fresh reply from the correct controller. Controller change repeats proof; failure or the 8 s deadline prevents the send. With blocked registration and no controller, cleanup must succeed. This slice serves no account page that opens private calls. H src/online/cache-policy.ts:6–80. |
| /api, /api/games, /api/me/games | Stay absent from routing; GET and POST return **404 without redirect**. There is no api.func. A 503, 401 or HTML 200 does not pass this slice. H tools/vercel-check.mjs:29–32,140–149; tools/deploy-live-check.mjs:11–12,95–99. Do not require JSON for the unrouted host 404. |
| /play, /play/, /play/profile, /play/settings, /play.html, /g/<id>, /j, /j/, /j/<token> | Stay closed with 404 and no redirect. No account entry, identity, read, Create, Find, Join or turn operation opens. H tools/vercel-check.mjs:144–149; tools/deploy-live-check.mjs:11–12. |
| Existing plugin and public pages | Retain /mcp, /authorize with its query, /consent.mjs, both OAuth resource metadata paths, /internal/* authorization, /plugin-art/*, the domain challenge, and the four legal/help pages. No route rewrite is added by this diff. H tools/plugin-server-build.mjs:14–26,61–75; release-route.md:58. |

**Local players keep their saves, lesson progress, Workshop designs, local links and offline local play.** The worker does not migrate or clear localStorage or IndexedDB. The browser cases seed these records, check them after takeover, then open a saved move, a lesson, lazy Workshop, a local link and the AI offline. Evidence: H tools/web-online-check.mjs:296–343,465–490; tools/service-worker.test.ts:130–140,207–230. Final-source results remain OPEN.

The old coordinate limit, idle-effect stop, growing context row, Select text, first-frame art fix and legal text are prior product changes. Do not count them as worker features. M baseline-post-merge.md:18–55 lists the accepted picks.

### Output identity fields

| Field | Release | Recovery |
|---|---|---|
| Approved source and tree | OPEN, O4 | OPEN, O3. No fixed recovery source is approved; H is not recovery proof. |
| Complete combined output root and retained copy | OPEN, O4: RELEASE_ROOT | OPEN, O3: RECOVERY_ROOT. The old proposed path is only a path; no output is proved to exist. |
| Full output manifest, SHA-256 and retained evidence path | OPEN, O4/O4b; section 9 | OPEN, O3/O4b; section 9 |
| Static entry, bundle, every changed public path and hash | OPEN, O4 | OPEN, O3 |
| config.json, function server, board resource and runtime hashes | OPEN, O4 | OPEN, O3 |
| Worker SHA-256 and actual 12-character VERSION | OPEN, O4 | OPEN, O3 |
| Worker policy | public-build-v1 in source; emitted value OPEN, O4 | Must remain public-build-v1; emitted value OPEN, O3 |
| Accepted safe predecessor policy | public-build-v1 | public-build-v1 |
| Old worker with no policy reply | Upgrade input only; never accept it as safe | Upgrade input only; never accept it as safe |
| Prior live worker bytes/version and deployment | OPEN, O1/O4. Retained prior combined output and full manifest also required. | Same prior-output record |
| Exact browser pair and full manifest equality | OPEN, O3/O5/O4b; all three engines | OPEN, O3/O5/O4b; external recovery input required |
| Actual publish copy retained before CLI; full equality with approved output | OPEN, O4b/O7. H has no such gate. | Same gate required if recovery publishes |
| Retained publish root, manifest and equality report paths | OPEN, O7. Must survive deploy cleanup. | OPEN if recovery is invoked |
| New deployment ID and live result | OPEN, O7 | OPEN only if recovery is invoked |

The client accepts the one policy ID, not a list of old content versions. An old controller with no valid reply must upgrade; its presence never grants a private send. Evidence: H src/online/cache-policy.ts:6–8,26–37,48–77. The frozen predecessor fixture has SHA-256 f0b151cd7cb703053d22fa9e9ec970ba7c95f080330e8ef5d5fee695983df8b7. That is a source fixture hash, not the hash of the live built worker. H tools/web-online-check.test.ts:90–92.

## 2. Phase 1 test record

The required common gate is H test-gate.md:19–25. The phase 1 row is :33. The full default local set is :42. Required test skips do not pass.

Existing CI evidence comes from:

~~~sh
gh pr checks 71 --repo SaarShai/king-down-chess
gh run view 39357865948 --repo SaarShai/king-down-chess --json jobs
gh run view 39357870158 --repo SaarShai/king-down-chess --json jobs
gh run view 39357869849 --repo SaarShai/king-down-chess --json jobs
gh run view 39357870158 --repo SaarShai/king-down-chess --log-failed
~~~

The checks command exits 1 because WebKit fails. This revision repeats all four permitted CI reads above, and also reads failed logs for run 39357865948. All listed jobs are complete. The results in the table still match. Job metadata proves each named step result. It does not supply individual test counts, case skips or the checkout SHA. A skipped setup cleanup step is not a skipped test; keep those records separate.

| Run / job | Existing result | Limit |
|---|---|---|
| [39357869849 / test / 118423763598](https://github.com/SaarShai/king-down-chess/actions/runs/39357869849/job/118423763598) | PASS on rerun; npm test step succeeds. | This job has no database service. It cannot close database cover. H .github/workflows/test.yml:14–27. |
| [39357865948 / verify / 118416778618](https://github.com/SaarShai/king-down-chess/actions/runs/39357865948/job/118416778618) and [39357870158 / verify / 118416791775](https://github.com/SaarShai/king-down-chess/actions/runs/39357870158/job/118416791775) | PASS: database init; full npm test; plugin build, server, smoke, protocol; build:vercel; check:vercel. | Counts, internal skips and exact checkout source OPEN. These are existing-head results. |
| [39357865948 / browser / 118416778838](https://github.com/SaarShai/king-down-chess/actions/runs/39357865948/job/118416778838) and [39357870158 / browser / 118416791649](https://github.com/SaarShai/king-down-chess/actions/runs/39357870158/job/118416791649) | PASS: plugin-oauth, plugin-ui, plugin-ui-http. | Not the full default local set. |
| [39357865948 / browser-web / 118416778483](https://github.com/SaarShai/king-down-chess/actions/runs/39357865948/job/118416778483) and [39357870158 / browser-web / 118416791795](https://github.com/SaarShai/king-down-chess/actions/runs/39357870158/job/118416791795) | PASS: home, account, link-game, lessons, lesson-return, workshop, workshop-cast; Chromium web-online. | web-online uses the default recovery fixture. |
| [39357865948 / browser-firefox / 118416778715](https://github.com/SaarShai/king-down-chess/actions/runs/39357865948/job/118416778715) and [39357870158 / browser-firefox / 118416791838](https://github.com/SaarShai/king-down-chess/actions/runs/39357870158/job/118416791838) | PASS: Firefox web-online after database init. | Same fixture limit. |
| [39357865948 / browser-webkit / 118416778788](https://github.com/SaarShai/king-down-chess/actions/runs/39357865948/job/118416778788) and [39357870158 / browser-webkit / 118416791918](https://github.com/SaarShai/king-down-chess/actions/runs/39357870158/job/118416791918) | FAIL only at web-online. The selected npm test step and plugin-ui succeed. | Required WebKit row stays OPEN. The failed log records exit 1 after 85.3 s in the latter run; it does not contain the inner browser error. |

The task supplies the inner WebKit fault: “page.goto: WebKit encountered an internal error”, linked to Playwright issue 42775. H ticket 02:42–44 records the same offline failure on Playwright 1.63. The task also supplies a PR 74 result: PR 71 plus Playwright 1.64.1 passes all web-online cases on WebKit 27.2, Firefox 157 and Chromium 156. Treat that result as supporting evidence only. Its exact source pair and logs are OPEN here. PR 74 awaits the owner's merge word. Do not waive WebKit or treat a local dependency overlay as the approved release. Repeat CI on the final integrated source after PR 74.

| Required gate | Evidence now | Remaining pass rule and closure step |
|---|---|---|
| T1/T2: full database-enabled source tests | verify jobs above succeed. Workflow: H plugin-checks.yml:21–51 supplies PostgreSQL 17, database init and unfiltered npm test. | OPEN, O2/O5: final source; exact counts and all skips; no required database case skips. The database-free test job is supplementary. |
| Common plugin build/server/smoke/protocol | Both verify jobs succeed at each named step. | OPEN, O5: repeat on the approved source; record exits and counts. |
| T5: build:vercel and check:vercel | Both verify jobs pass. The built check asserts worker version, lists, policy, offline entry files, archives and closed routes: H tools/vercel-check.mjs:24–64,90–105,140–157. | OPEN, O4/O5: same checks and exact output identities for release and recovery. |
| Common plugin browser checks | Chromium browser jobs pass all three named checks. WebKit plugin-ui passes. | OPEN, O5: final-source common gate. |
| T4: full default local set at base and final | Seven affected checks pass in browser-web. The historical deploy at 3d4c97ae records 24 of 24, M ticket 08:66. | OPEN, O2/O5: all 24 names at the fixed base and final candidate on the M1. Neither record above closes this pair. |
| Two stable baseline captures and accepted merge comparison | M baseline-post-merge.md:69–104 has historical pairs, masks and results. Its sources are 04b7af87 and cd8fa9f2, :11–16. | OPEN, O2/O5: two captures of the fixed current base in one environment, then final-source comparison. Keep raw pairs and explain any unstable state or accepted change. Old temporary images are not final evidence. |
| Worker allowlist, cache writes, offline graph | Cases exist in H tools/service-worker.test.ts:97–280 and tools/offline-build.test.ts:18–147. Full verify succeeds. | OPEN, O5: final-source test counts and no required skips. |
| Active/dormant old worker, restart, controller change, two tabs/accounts, query variants | Chromium and Firefox web-online pass. Cases: H tools/web-online-check.mjs:359–434,447–464. The probe uses the real private client, :70–73; fixture page:35–45. | OPEN, O3/O5: all three engines with the exact recovery input. The account markers and private cache canaries are fixture identities. They do not prove real provider sign-in, which stays closed. |
| Purge failures and interrupted activation | Browser cases :395–413 and held-reply cases :419–432; source cases H tools/service-worker.test.ts:284–575. | OPEN, O3/O5: final exact-output pair; no reply or private send before successful cleanup and current-controller proof. |
| Offline public local assets | Chromium and Firefox web-online pass through the saved game, lesson, Workshop, link and AI cases, :436–490. | OPEN, O3/O5: WebKit and the exact pair. The server also refuses requests while offline; only root network attempts and worker update checks may reach it. |
| Blocked registration/no worker | Chromium and Firefox pass the cases at :495–512. Failed cleanup and an unsafe retained controller prevent a send; no controller plus successful cleanup permits the closed-API probe. | OPEN, O3/O5: WebKit and final-source record. |
| Active engines and compatible recovery | Existing source and compiled archive cases exist. No fresh final runtime report or approved recovery pair is in this packet. | OPEN, O3/O6. See sections 3 and 4. |
| Source, versions, selectors and operator record | H ticket 02:41–45 records focused results and fixes. web-online emits worker-browser.json, worker-outputs.json and worker-events.json, :119–124,186–187,513–520. | OPEN, O2/O5: retain those files, run.json and logs; record OS, browser, dependency version, source/tree, command, exit, counts, skips, operator and affected selectors. |
| Local-root cold/warm load; worker active and blocked | No controlled load result is attached. Test duration and render pairs do not measure load. | OPEN, O5L: complete the scoped table and decision below. |
| Browser-tested, approved and actual publish output equality | H records selected browser-pair hashes only. H deploy rebuilds and deletes its copy. | OPEN, O4b/O5/O7: section 9 requires complete manifests, exact pair equality, retained publish copy and a fail-closed check before the hosting publish. |

The 24 default names are: read-piece, verb-marks, lessons, turn, link-game, end, their-turn, game-screen, menu-extra, home, account, cursor-adoption, king-effects, lesson-return, new-game, painted-game, powers, special-moves, ux-defects, visual-design, workshop, workshop-cast, qa, selftest. H tools/lib/registry.mjs:10–40 distinguishes these from plugin and web-online checks.

### Local-root load record

**Status: OPEN. Owner: load operator on the M1 or CI; main session accepts the measured limit.** This worker slice still needs the local-root load record. Sources: H release-route.md:104,117; test-gate.md:63,66,86. The account-page target and later full phone matrix do not apply to this slice.

Use the accepted post-token base and final release outputs. Record their full manifests. Use one browser/version, device, OS, viewport, server and network profile for both. Use the recorded 4× CPU and Slow 4G method where supported. Record the exact profile and method. An unsupported throttle does not count as that profile. Do not substitute a journey's total run time.

Measure time from navigation start to a visible, usable local board. Record first paint and transferred bytes separately where the method supports them. Define cold and warm states before the run. Record the HTTP cache, worker registration/controller, worker cache contents and whether a previous precache completes. Keep local saves in the same known state. Run three independent samples per row; retain each value and the median. Use a fresh profile for each independent cold sample. For an installed active worker, record its precache state explicitly; do not call it an empty cache. Use the separate first-install row to show the cost of the changed installation path.

| Output | Worker | State | Three load samples / median / bytes | Evidence / result |
|---|---|---|---|---|
| Accepted base | Blocked; no controller | Cold HTTP cache | OPEN | OPEN |
| Accepted base | Blocked; no controller | Warm HTTP cache | OPEN | OPEN |
| Accepted base | Installed and active | Cold HTTP cache; worker cache recorded | OPEN | OPEN |
| Accepted base | Installed and active | Warm HTTP and worker caches | OPEN | OPEN |
| Final release | Blocked; no controller | Cold HTTP cache | OPEN | OPEN |
| Final release | Blocked; no controller | Warm HTTP cache | OPEN | OPEN |
| Final release | Installed and active | Cold HTTP cache; worker cache recorded | OPEN | OPEN |
| Final release | Installed and active | Warm HTTP and worker caches | OPEN | OPEN |
| Accepted base | First visit; registration enabled, no prior worker | Empty HTTP and worker caches | OPEN; also record board-ready, install-start, activation/offline-ready times and precache bytes | OPEN |
| Final release | First visit; registration enabled, no prior worker | Empty HTTP and worker caches | OPEN; same installation measurements | OPEN |

H public/sw.js:50–61 fetches and stores the precache files in sequence. H vite.config.ts:46–53 delays registration until the board is ready, or its wait ends. Record the board load and completed installation as separate events. A fast board does not prove a fast install. A warm installed worker does not prove first-visit cost.

The operator records their name, time, commands or measurement steps, all raw samples, failures and source/output identity. Record the accepted plugin/main baseline under the same conditions where the speed method requires it; an older uncontrolled baseline does not pass. The main session records the accepted local-root load limit and allowed change from the base, with its reason and evidence. Both remain **OPEN**. Do not invent a numerical limit. Repeat a row after a relevant fix. O5L clears only when the comparable results meet that recorded decision and the operator signs. This record gives no load-test result and no new run authority.

## 3. Compatible recovery build

**Status: OPEN — no tested compatible recovery build is identified. This blocks publication.**

Recovery objective for this slice: restore the accepted post-token local-root behavior if the release causes a local load, offline graph, installation or worker takeover fault. Keep local saves, lessons, Workshop, local links and AI play usable. Keep the retained plugin service and its supported game continuations. Keep the domain challenge. Keep the safe policy, exact public-file allowlist, purge and private-call handshake. Keep all account/API routes closed.

This objective is a proposed recovery scope, not a proved source. The recovery operator must name the concrete behavior to restore, the fault it repairs or avoids, and the reviewed source change that restores it. A nominal copy of the release does not show recovery from its own fault. H adds the worker under review; its nomination alone proves neither a repair nor an earlier safe behavior. Remove H as the nominated recovery build until a reviewed fault/behavior record supports it.

| Required recovery fact | Record and closure |
|---|---|
| Behavior/fault and accepted reference | OPEN, O3. Name the exact load/offline/takeover behavior and reference source. Show how the recovery source restores it. |
| Fixed recovery source commit/tree and reviewed change | OPEN, O3. A safe backport or repair needs its own reviewed source. No such fixed source is supplied. |
| Complete retained combined output; full manifest | OPEN, O3/O4b. RECOVERY_ROOT and manifest/evidence paths must contain actual retained files. A proposed directory does not pass. |
| Worker SHA-256, 12-character VERSION, policy and accepted predecessors | OPEN. Policy must remain public-build-v1. Both worker version and bytes must differ from release for the takeover proof. |
| Exact release/recovery pair in Chromium, Firefox and WebKit | OPEN, O3/O5. Require external recovery input; full and selected manifests must match section 9. Retain the three result sets and output copies. |
| Recovery server and representative state proof | OPEN, O3/O6. Run the recovery function/runtime itself against disposable data under the exact production migration order. The static-switch fixture does not prove this. |
| Every used engine and alias; supported-client continuation | OPEN, O6. Use the fresh reports, all used stamps, reopened games and tested supported client paths. Include playable legacy rows. |
| Runtime/grant/startup and verified recovery-state reference | OPEN, O6. Complete section 4. Keep the recovery-state reference private; publish no payload. |
| Recovery operator and independent reader acceptance | UNSIGNED. They attach the fixed source, complete output manifests, fault/behavior record and all results. |

Build only after the recovery source is fixed and reviewed. Use that source's own worktree and installation. Keep the token carrier's challenge. Any source or output change returns to the affected checks and review. A marker-only build that changes the worker VERSION proves an update mechanism, not a useful recovery.

Never restore the broad private-response cache. Neither 04b7af87 nor the prior unsafe-worker deployment is an approved fallback. The old record itself says that 04b7af87 cannot continue the four alias games, M ticket 08:67. The route also rejects it as an automatic recovery choice, H release-route.md:70–78.

### Existing takeover proof and its limit

The external input must contain config.json, static/index.html, built static/sw.js, server, function config, board, runtime entry/worker and engine archive. recoveryOutput hashes those selected files and all allowlisted files; it checks the policy and built lists. It omits other output files and function links, including consent and plugin art. It is not a complete output manifest. It does not approve a source or prove service/database compatibility. H tools/web-online-check.mjs:27–48. Section 9 supplies the required equality and retention rules.

The driver tests both output directions: safe predecessor takeover, failed purge, interrupted activation, dormant old workers, restart, held replies in two tabs and offline local assets. H tools/web-online-check.mjs:370–490. Without KINGDOWN_WEB_RECOVERY_OUTPUT, it creates a second build with a fixture HTML comment and records **“fixture pair; no exact recovery approval”**, :107–124. Existing CI uses that default.

The driver constructs the server from the release tree, :128,184. Its function dispatch still uses that tree after the static output changes, :177–178. Therefore an external recovery journey proves worker/static takeover; it does not prove that the recovery server reads current data. Run check:vercel on the recovery output and the database-enabled source gate on the recovery source too. Add representative-state and supported-client continuations with the recovery server/runtime selected throughout. Retain that separate server identity and result. The source gate or a fixture archive pass alone does not close this row.

**OPEN, O3/O6:** approved source/output; distinct worker hashes and versions; policy/predecessor record; exact-output takeover in all three engines; matching schema/grants; representative state continuation; archive/alias and used-engine continuation; verified recovery-state reference.

PR 71 adds no database writes or state format. The recovery state set still includes states that the retained plugin can write: waiting/setup, initialized games and rules, receipts, results/history, settings and active legacy games. Use disposable data and the production migration list in order. Reopen and continue games. File presence or archive existence alone does not pass. H release-route.md:70–74,84–88.

### Recovery procedure

1. The owner gives the **recovery word** for the concrete fault and scope. The release operator records the failed probe and affected paths. Keep website account/API routes closed and keep local play usable. Assess any shared plugin fault. Stop only affected jobs, by an approved operator and only when the fault involves job writes.
2. The main session creates a recovery PR from current main. Restore the selected compatible behavior and keep the safe worker, allowlist, purge, handshake, token file and all used archives/aliases. Keep all committed data. Apply no down migration.
3. An independent reader reviews that PR and its packet. Test operators repeat the common/phase 1 gate, exact-output worker takeover, data compatibility and continuation checks. The release/database operator obtains fresh reports against both exact runtime folders.
4. The owner gives the recovery PR's **merge word**. Merge by PR. Record final main commit/tree and freeze main through deploy source selection.
5. The owner gives the separate **publish go** for that exact recovery source and scope. The release operator checks fresh origin/main against the recovery packet, then uses only:
   ~~~sh
   tools/deploy.sh --publish
   ~~~
6. Record the deployment ID, source log, retained publish copy, full equality report and both live results. Repeat every scoped probe in section 6, including the applicable new deployment job outcomes. Resume affected play only after the required results pass. A saved deployment ID is not a deploy input. A database restore requires a separate owner decision.

Evidence: H release-route.md:76–88; H RUNBOOK.md:82–100. These steps are a procedure. None runs in this packet task.

## 4. Engines and retained service state

Publication now fails at argument validation if KINGDOWN_ENGINES_DATABASE_URL is absent. Check-only mode can still skip it. Reject a release record that says **“skipped the check of engines in use”**. A nonempty setting is not a pass: the read-only query and runtime check must also succeed. H tools/deploy.sh:58–71,193–198.

**Superseded for slice 1 (ruling 3, row 2d):** main's checker is the report; it reads only the stamp column, and the fields below that need saves stay required from ticket 06 on. The checker now reads both games and plugin_matches in one repeatable-read, read-only transaction. It reports schema/time, unfinished and empty setup counts, initialized saves, malformed saves/stamps, save/column agreement, mismatches, per-stamp counts, exact runtime path and bundle SHA-256. It fails on query error, missing archives or malformed/disagreeing states. H tools/engines-check.mjs:13–79,82–99. This corrects the old checker limits stated in the planning document. It does not add browser continuation proof.

| Required record | Evidence / OPEN |
|---|---|
| Prior used engines | Historical report at 2026-10-19 09:50 UTC: bab22e94 has 1 unfinished game; alias e668782a has 4. M ticket 08:54–60. These are not fresh counts. |
| Full retained alias/base stamps | e668782a46ed3661312f39a8d246c19722686054317a4c9a35da31d726dabcb6 maps to bab22e94d4df81591374763a7f3abe703c30534f80ce771ee3fe7e095dcec7da. H tools/engines.test.ts:15–39 checks byte equality after stamp replacement and continues each archive fixture. |
| Release runtime report | OPEN, O6: exact release functions/mcp.func/runtime/engines. |
| Recovery runtime report | OPEN, O6: exact recovery functions/mcp.func/runtime/engines. |
| Fresh report pass | Slice 1: exit 0 of main's check at the publish (ruling 3, row 2d). From ticket 06 on: exit 0, ok true, at least one game table present, both tables accounted for, zero missing bundles, zero malformed initialized saves/stamps and zero unexplained mismatches. Record each table's agreement and unfinished counts and each full used stamp/hash. Explain absent legacy tables. |
| Continuation per used stamp and alias | OPEN, O6. Source tests and tools/vercel-check.mjs:56–64 prove compiled fixture continuation. They do not alone prove a browser continuation for every live stamp. Name and test the supported client path for each one. “Use the plugin” without a test does not pass. H release-route.md:84–86. |
| Applied migration numbers and order | OPEN, O1/O6. Attach the current approved production list in actual application order and its time/evidence path. The disposable recovery-state test records and uses the same list and order. Historical presence of 0014 does not supply the list. |
| Missing migration numbers | OPEN, O1/O6. List each missing number from the final source's supabase/migrations/ inventory. Record an explicit empty list only if the operator proves none are missing. Explain every intentional omission. Do not apply a migration to fill this cell. |
| Runtime-role block numbers and effective grants | OPEN, O1/O6. Record applied and missing block numbers, their order where needed, effective privileges and evidence time/path. PR 71 proposes no grant change. Historical evidence of the 0014 grant does not close the current record. |
| Runtime startup probes | OPEN, O1/O6. Attach current shared-function startup and effective runtime privilege results, tied to exact source/output. Recovery-server probes use the recorded schema/grants on a disposable database. A shared-service 503 fails. |
| Recovery-state/backup reference | OPEN, O1/O6. Operator supplies a verified private reference and verification time. Put no payload or restore credential here. |
| Prior jobs/settings baseline | OPEN, O1/O6. Expected jobs remain tick, daily and cron-history; mail, push, chat, outbox and reminder schedules stay off/absent. Record current schedules and prior tick/daily HTTP outcomes and cron-history SQL result with times and the prior deployment. These are baseline facts only. H RUNBOOK.md:120–150. |
| New deployment job results | OPEN until after publication, O8. Record each required outcome under section 6. Prior outcomes cannot close it. Observe authorized scheduled executions; do not invoke a live job merely to fill a cell without the owner's word. |

The release/database operator runs the fresh reports on **this Mac**, in the assigned release window, with the approved read-only connection already in the local shell. Do not place its value in a command or log:

~~~sh
node tools/engines-check.mjs "$RELEASE_ROOT/functions/mcp.func/runtime/engines"
node tools/engines-check.mjs "$RECOVERY_ROOT/functions/mcp.func/runtime/engines"
~~~

**Superseded for slice 1 (ruling 3, row 2d):** main's checker is the report; it reads only the stamp column, and the fields below that need saves stay required from ticket 06 on. The packet needs both reports and their time, folder and hashes. The script's deploy-time report checks the actual release runtime again. Keep archived fixtures, aliases, command IDs, rules and game records. Do not rewrite fingerprints, restart games or discard review games. Do not run a live write under the source interpreter. H release-route.md:82–88.

## 5. Stop conditions for this publish

| Stop | Release evidence that clears it | State |
|---|---|---|
| Unknown source, wrong target, scope change, token order failure or missing decision | Final packet/main/tree match; token deployment precedes PR 71 merge; owner words attach to exact scope; deploy verifies project kingdown and the approved team. | OPEN, O1/O4/O7 |
| Parked feature or unapproved shared UI enters the diff | Independent final diff confirms worker-only scope. H touches no src/plugin screen or shared local screen. Retain the five parked references at M release-record-2026-10-19.md:195–219. | Source evidence present; final review OPEN, O4 |
| Unsafe cache or unproved upgrade | Source/built checks plus all three browser engines and exact recovery input prove purge/reply order, failure/restart/dormant/two-tab cases and offline local assets. Live worker bytes/policy match. | OPEN, O3/O5/O7 |
| Website/API route opens | Built and live probes keep every listed account route and GET/POST API request at 404 without redirect. | Existing-head built evidence present; final/live OPEN |
| Required database tests skip; schema/grants unknown; shared function fails startup | Full database CI counts and no required skips; current operator schema/grant/startup record. A shared service 503 stops release. | OPEN, O5/O6 |
| Used engine/alias lacks archive or supported continuation; report skips; counts disagree | Both exact runtime reports and per-used-stamp continuation; zero unexplained failures. | Slice 1: row 2d and the publish run's engines step; save-level fields deferred to ticket 06. Later: OPEN, O6 |
| Confirmed fault, local regression or unstable comparison remains | Full base/final default sets; stable baseline pair and final comparison; affected checks and independent fix review. WebKit is required. | OPEN, O2/O5 |
| Compatible recovery is absent | Defined recovery behavior/fault; fixed reviewed source; complete retained output; exact pair passes in three engines; recovery server reads and continues representative states under the production migration order; every used engine/alias has a tested supported client. Required signatures pass. | OPEN, O3/O6 |
| Tested, approved and actual publish outputs do not match, or copy is lost | Section 9 equality gate passes for the full output and selected browser pair; actual publish copy is retained outside deploy cleanup before publication. Missing enforcement, file, link, hash or record fails closed. | OPEN, O4b/O5/O7 |
| Local-root load evidence or accepted limit is absent | Comparable base/final cold/warm records with workers active and blocked, plus first-install cost; operator signs samples; main session accepts the measured local-root limit. | OPEN, O5L |
| Unexpected job/settings or failed baseline job evidence | Operator confirms unchanged expected schedules/settings and successful prior outcomes. Scheduler success alone is insufficient. | OPEN before publish, O1/O6 |
| New deployment job outcome absent or failed | New deployment tick/daily HTTP 200 and separate cron-history SQL success, with request/execution times and deployment attribution. Prior deployment evidence does not pass. | Post-publish closure OPEN, O8 |
| A scoped live route, asset, OAuth, worker or job probe fails | Stop further exposure; record the fault; use the compatible recovery procedure. Both live checks and applicable post-publish job outcomes must pass. | Post-publish, O7/O8 |

Do not add later-slice gates to this packet. Website token verification, current-user write controls, shared web limits, read-only game GET and the account-off switch apply when account/API operations open. They stay closed here. Real provider return, cross-surface website play, matching support/appeal readiness, new setup/profile screens and the full native phone/accessibility/speed matrix belong to their later phase rows. The proposed account-load speed target does not apply to an absent account page. This exclusion does not waive worker safety, the scoped local-root load record above, current plugin regression or any active engine's supported continuation. H release-route.md:19–29,78,92–108; test-gate.md:33–40,44–66.

## 6. Post-publish live probes

**Results: OPEN. Owner: release operator on this Mac, after the source-specific publish go.** Use no owner account, player token or session cookie. These commands are the existing unsigned checks. The deploy runs both on its own copied output before cleanup. H then deletes that copy. Until section 9 is implemented and proved, the required retained actual publish copy does not exist and publication stays stopped. After that gate passes, record its retained root, complete manifest and equality report. Use PUBLISHED_ROOT, the retained and verified actual publish copy, for any later repeat. Do not substitute an independent rebuild.

~~~sh
node tools/deploy-live-check.mjs "$PUBLISHED_ROOT/static"
node tools/deploy-plugin-live-check.mjs "$PUBLISHED_ROOT/functions/mcp.func" https://kingdown.dev
~~~

The unsigned probe stage passes only if both commands exit 0 against the retained actual publish copy. This stage alone does not close the live result. The first exits 1 for a live mismatch and 2 for an invalid build or argument. It prints the built worker version, policy and full SHA-256. Byte equality with the live worker checks all three values; a separate unauthenticated page request cannot prove an installed controller's lifecycle.

| Probe within those commands | Expected result |
|---|---|
| /sw.js | 200, no redirect, JavaScript content type, exact built bytes. Actual VERSION equals the packet's 12-character value; POLICY equals public-build-v1; full SHA-256 equals the packet. |
| /, /index.html and each allowlisted/precached URL | 200, no redirect, correct type, exact bytes. Root module path equals the built entry. The two worker lists drive the public asset probes. |
| /privacy.html, /terms.html, /delete-data.html, /support.html | 200, no redirect, HTML type, byte equality with the checked output. |
| /.well-known/openai-apps-challenge | The token publish must make this file present in the final output. The site check then requires 200, text/plain, exact bytes and no redirect. Record presence/hash/result, never the token value. The worker never caches it. |
| GET and POST /api, /api/games, /api/me/games | 404 without redirect; no account service opens. The checker does not require a JSON body from these absent routes. |
| GET /play, /play/, /play/profile, /play/settings, /play.html, /g/00000000-0000-4000-8000-000000000000, /j, /j/, /j/deploy-check-inert-token, /deploy-check-unknown | 404 without redirect. The ID and token in these probes are inert test constants. |
| Both OAuth resource metadata paths | 200; equal metadata; resource https://kingdown.dev/mcp; expected issuer and openid scope. Do not copy provider configuration into the packet. |
| Unsigned POST /mcp | 401; the expected Bearer resource_metadata challenge and openid scope. No match operation runs. |
| /authorize?authorization_id=deploy-check%2Bquery&state=keep%20me | 200; exact query retained; correct consent page and script reference. |
| /consent.mjs | 200; exact built bytes. |
| One /plugin-art/* file per webp/png/svg/woff2 format | 200; exact built bytes and configured headers. This existing live check samples formats; it does not probe every plugin art file. |

Evidence: H tools/deploy-live-check.mjs:9–12,43–64,70–117; tools/deploy-plugin-live-check.mjs:17–76; tools/deploy.sh:216–229. The full plugin art set and archived fixture continuations also have built checks at H tools/vercel-check.mjs:56–64,112–118.

No live internal job call belongs to these unsigned commands. Section 4 keeps prior job outcomes as a baseline. The new deployment needs its own post-publish record below. LIVE-CHECKS.md:3–5,9–14,38–49 requires test accounts and source/device/time records for retained plugin journeys. Its empty cells do not prove a current pass. The full admission checklist remains with the plugin release operator; do not claim it passes from these unsigned probes.

### New deployment job observation

**Status: OPEN until publication and the next applicable scheduled results. Owner: approved release/database operator.** Required by H release-route.md:106,108,118,121; test-gate.md:88; ticket 02:23; RUNBOOK.md:120–131. The unsigned check scripts make no job request and read no job result (H deploy-live-check.mjs:58,82; deploy-plugin-live-check.mjs:42–45).

| Required new deployment row | Identity and time | Required outcome / evidence / signer |
|---|---|---|
| Traffic change | OPEN: final source/tree, deployment ID, alias-switch time and public publish scope | OPEN: operator's deploy record and section 9 identity proof |
| Scheduled tick | OPEN: scheduled time, actual request and response times after traffic changes; sanitized request/log reference tied to this deployment | OPEN: HTTP **200**; bounded result/failure summary; evidence path; operator signature |
| Scheduled daily | OPEN: next applicable scheduled request after traffic changes, actual request/response times and deployment attribution | OPEN: HTTP **200**; bounded result/failure summary; evidence path; operator signature |
| Scheduled cron-history | OPEN: next applicable SQL execution after traffic changes; schedule, start/end times and link to this release window | OPEN: successful **SQL** outcome; evidence path; operator signature. It has no HTTP outcome. |
| Settings and schedules after publish | OPEN: observation time and deployment/window | OPEN: only tick, daily and cron-history active; outbox/reminder schedules absent; mail/push/chat off |

The runbook records tick each minute, daily at 03:17 UTC and cron-history at 03:47 UTC. Record the actual applicable schedule from the operator's current record. Exclude requests that start before the traffic change or run on the prior deployment. Times alone are insufficient if a request can reach either deployment; use the platform/operator request record to prove the new function receives tick and daily. Keep account IDs, headers, keys and private response payloads out of the packet.

Observe the already authorized scheduled work. Do not call a live job, change its schedule or write data merely to fill a result cell. A manual execution requires the owner's applicable word through the approved operator path. If no qualifying result exists, keep O8 and the final live signature OPEN. A future scheduled result is not a pre-publish failure, but its absence prevents final closure. A failed request or SQL run is a post-publish stop: record it, hold affected exposure/job writes under the recovery rule, and start the compatible recovery procedure. Recheck the applicable outcomes after recovery.

## 7. Signatures

Each signer records their name or assigned operator role, date, exact source/output, evidence path and decision. All entries below are **UNSIGNED**. Existing automation and this draft do not sign for a person.

| Part | Required signer | Status |
|---|---|---|
| Source, public/closed scope, complete output identity and equality controls | PR author | UNSIGNED |
| Final diff, this packet, confirmed fixes | Independent reader who does not write the diff | UNSIGNED |
| Each CI/M1 test, render, load and version/device row | Operator who runs or verifies that row | UNSIGNED |
| Applied/missing migrations, role blocks/effective grants, startup, engines, prior jobs and recovery-state record | Release/database operator for the facts they check | UNSIGNED |
| Compatible recovery source/output and tested procedure | Recovery operator; independent reader | UNSIGNED |
| Reviewed packet acceptance | Main session, under its planning delegation | UNSIGNED |
| PR 74 merge decision | Saar, in his own words; dependency still awaits his word | UNSIGNED |
| PR 71 final merge decision | Saar, in his own words, with date and concrete scope/source | UNSIGNED |
| PR 71 public publish decision | Saar, separately, for the exact final main source and public scope | UNSIGNED |
| Pre-publish retention/equality gate and actual publish copy | Release operator; independent reader checks the guard | UNSIGNED |
| Executed publish, deployment ID and both unsigned live probes | Release operator | UNSIGNED |
| New deployment tick/daily HTTP and cron-history SQL results; final live closure | Release/database operator for job facts; release operator for final live result | UNSIGNED, O8 |
| Recovery, recovery merge and recovery publish, if needed | Saar gives each word; operators sign their actions | UNSIGNED |

The task states that Saar asks to merge PR 71 and deploy it. This is supplied owner authority for the main task. The packet must carry that existing decision with its date, source and concrete scope; it must not label the request absent or ask again solely because this copy lacks the record. The final source and any changed scope still need the route's source match. Attach the separate merge and publish decision records to that final source. Do not invent a quote or treat PR 74's separate decision as implied. Signature rule: H release-route.md:110–121.

## 8. OPEN work in run order

No command in these instructions runs during this packet correction. Operators execute them only under the release route and applicable owner authority. The current task reads files, Git and the permitted CI data only. Future checks use the test gate's CI/M1 placement and the assigned local release window.

Every evidence row needs the exact source/tree, output manifest, operator, time, command or steps, exit, counts, skips and retained evidence path. A proposed path is not a result. The main session fills the following inputs from retained evidence before the dependent step starts:

| Input | Meaning / current state |
|---|---|
| BASE_MAIN; BASE_ROOT | Accepted post-token main commit/tree and its retained complete combined output; OPEN |
| PACKET_MAIN; RELEASE_ROOT | Final approved main commit/tree and retained release output; OPEN |
| Recovery source/tree; RECOVERY_ROOT | Fixed reviewed recovery source and complete output; OPEN |
| Release/recovery manifests | Full output records in section 9, plus their SHA-256 values and evidence paths; OPEN |
| Three browser records | Exact pair, full manifests, worker-outputs.json, worker-browser.json, worker-events.json, run.json and logs per engine; OPEN |
| PUBLISHED_ROOT | Retained actual copy from the deploy before the hosting CLI, outside its cleanup root; OPEN; H cannot supply it |
| Final CI runs | Exact checkouts, steps, counts, skips and results; OPEN |
| Production compatibility record | Applied/missing migrations, role blocks, effective grants, startup, both runtime engine reports, continuation and verified recovery-state reference; OPEN |
| Owner and reader records | Existing owner words/date/scope, final source match, final diff/fix review and required signatures; OPEN |

### Before PR 71 reaches main

| Step | Owner / machine | Action and pass rule |
|---|---|---|
| O1. Establish current live and retain prior output | Main session and release operator / assigned local window | Obtain the current operator deploy record for the supplied live M. Attach source/tree, deployment ID and time, tests/live results, prior worker bytes/version/policy, full retained prior output and manifest. A source-only rebuild does not prove prior deployed bytes. Obtain the current migration/grant/startup, schedule and recovery-state records. Pass: each fact has a retained source/time/evidence path; no private payload. Unknown facts stay OPEN. |
| O2. Collect existing evidence | Test operator / CI; render operator / M1 | Read gh pr checks 71 and gh run view for the named runs. Retain complete existing logs and exact checkouts where available. Preserve the current CI limits. Prepare the base/final 24-check and stable-render records. Pass: distinguish existing-head, overlay, fixture and final-source results. No existing result is silently transferred to a changed source. |
| O3. Fix and prove recovery | Recovery operator; independent reader / M1 or CI with its own disposable database | First fill section 3's behavior/fault and fixed recovery commit/tree. Build from that source with npm run build, then node tools/plugin-server-build.mjs <retained-recovery-build-root> --site. Set RECOVERY_ROOT to its .vercel/output and retain it. Run npm run check:vercel -- "$RECOVERY_ROOT" and the full common source/database gate. Test the recovery server against the exact production migration order and representative post-slice states. Reopen and continue all used engines/aliases through named supported clients. Complete section 9 before exact-pair approval. Pass: a useful reviewed recovery exists, all required data and worker proofs pass, and both recovery signers accept its exact manifests. H alone does not clear it. |
| O4a. Dependency and intervening token publish | Main session; owner decision record; release operator / assigned window | Resolve the separate PR 74 decision. Retain its source and supporting three-engine result; do not treat it as final-source proof. The authorized token publish completes and passes its checks/live probes before PR 71 merges. Record that publish's exact source/tree, deployment ID, times and retained output/manifest as PR 71's prior release. Pass: token publish success time precedes PR 71 merge time. No new token or dependency authority comes from this packet. |
| O4b. Add and review output enforcement | Main session assigns source work; independent reader reviews it | Implement the small complete-output manifest/equality/retention gate described in section 9 inside the existing driver and sole deploy path. H has neither complete browser-pair manifests nor the required deploy gate. The packet provides no ready-made new flag. Record the actual reviewed interface, source/tree, tests and evidence paths before use. Pass: missing or unequal approved source/output prevents the hosting publish; retained actual copy survives cleanup; browser pair equality is proved. No alternate deployment path, manual racing copy or log-only check passes. Recheck the final integrated source after this change. |
| O4. Fix branch source and review before merge | Main session, author and independent reader | Bring PR 71 to the accepted post-token main and approved dependency/guard changes. Fix the comparison base. Review git diff origin/main...HEAD and every confirmed fix. Run the source and phase checks on that integrated candidate before the owner's recorded merge decision applies. After PR merge, record final main commit/tree as PACKET_MAIN and freeze main through deploy selection. Fetch again and compare full commit/tree. Any extra change returns to review and affected checks; renew the owner decision only where source/scope no longer matches it. |

### After the token publish and final integration, before PR 71 publishes

The pre-merge candidate gates above must pass before merge. The following final-output rows use the exact resulting main source. Reuse candidate evidence only where the checked source/output identity and scope prove that it still applies. Record that proof; otherwise repeat the affected checks.

| Step | Owner / machine | Action and pass rule |
|---|---|---|
| O4 output. Retain approved release | Build operator / CI or M1 | At PACKET_MAIN run npm run build:vercel. Retain the complete combined output as RELEASE_ROOT. Validate it with npm run check:vercel -- "$RELEASE_ROOT". Record section 9's full manifest and worker fields. Compare all paths with BASE_ROOT, including function files and links. Challenge presence is mandatory even though current tools test it only when present. Pass: every changed path matches reviewed scope; exact output is retained; no later build replaces it under the same record. |
| O5. Complete final source/browser/render gate | Test operator / CI; browser/render operator / M1 | Run database init, full unfiltered npm test, plugin build/server/smoke/protocol and build:vercel/check:vercel. Keep plugin-oauth, plugin-ui and plugin-ui-http. Run web-online with the exact RECOVERY_ROOT in Chromium, Firefox and WebKit. Use KINGDOWN_WEB_RECOVERY_OUTPUT="$RECOVERY_ROOT" PLAYABLE_BROWSER=chromium npm run check:browser web-online, then separate firefox and webkit runs. Each uses section 9's reviewed retention/equality implementation. Run all 24 default local checks at BASE_MAIN and final source on the M1. Capture the accepted base twice in the same environment; compare stable final pairs, with raw evidence and explained masks. Pass: exact checkouts, versions, counts, all skips and paths are attached; no required database skip; all required engines and pairs pass; full manifest/pair equality passes. WebKit stays required. |
| O5L. Complete local-root load record | Load operator / M1 or CI; main session accepts limit | Complete section 2's base/final blocked/active cold/warm rows and first-install measurements under one recorded profile. Retain raw samples and medians. Attach comparable accepted baselines and the measured local-root limit/allowed change decision. Pass: comparable results satisfy that decision; operator signs. Browser journey duration and render comparisons do not close this step. |
| O6. Complete production compatibility and recovery (slice 1: rulings 2 and 3 and rows 2b to 2d replace the report parts) | Approved release/database operator / assigned local window; recovery operator / disposable M1 or CI database | Run the two section 4 engines reports against RELEASE_ROOT and RECOVERY_ROOT through the approved read-only connection. Attach time, schema, full stamps, counts, hashes and zero unexplained failures. Obtain the current applied-order/missing-migration list, runtime-role block numbers/effective grants and startup record. tools/plugin-db-check.mjs exports a startup checker; it is not a standalone CLI command. Attach the service's actual startup result. Match production migration order on disposable recovery data. Attach recovery-server state/continuation results for every used stamp/alias and playable legacy rows, plus verified recovery-state reference and prior job/settings baseline. Pass: all pre-publish section 4 fields and recovery signatures clear. New deployment jobs remain for O8. |
| O7a. Accept pre-publish packet | Author, independent reader, main session and owner record | Attach the exact existing merge/publish words with dates and final source/scope. Fill every required pre-publish signature and evidence path. Resolve PR 74 separately. Check fresh origin/main and the selected source/tree against PACKET_MAIN. Confirm section 9's guard is in the actual launcher to be used, not only in the fetched tree. Pass: no applicable pre-publish OPEN stop, no source drift and no missing required signature. Future deploy/live/job fields stay OPEN until their stage occurs. |

### Publish and close the result

| Step | Owner / machine | Action and pass rule |
|---|---|---|
| O7. Publish with retained equality proof | Approved release operator / assigned local window | Only after O7a passes, run tools/deploy.sh --publish through the reviewed one-project path. Its checked source must equal PACKET_MAIN. Section 9's guard must run inside this path before the hosting CLI. It retains the actual copy to PUBLISHED_ROOT, hashes all files/links, compares it with the approved release manifest and stops on every difference. Record the retained root, manifest, equality report, source log, verified project, deployment ID and publish/alias times. Both unsigned live checks run on that copy; retain results. Pass: equality and both live checks pass. This closes the unsigned probe stage only; O8 stays OPEN. Exit 0 without the retained proof does not pass. |
| O8. Observe new deployment jobs and sign final live result | Approved release/database operator, then release operator | Fill section 6's new deployment tick/daily HTTP and cron-history SQL rows from authorized scheduled executions after traffic changes. Record times and deployment attribution, schedules/settings and evidence paths. Pass: tick and daily HTTP 200; cron-history SQL success; only expected jobs; mail/push/chat remain off; both unsigned live checks still pass; required operators sign. Only then close the release. Missing outcomes leave closure OPEN. Failed outcomes trigger the recovery stop. Do not invoke or reschedule a live job without the owner's applicable word. |

## 9. Output equality and retention gate

**Status: OPEN — required source work and results are absent at H. This is a pre-publish stop.** The packet corrects the procedure here. This read-only task does not implement it. Do not run the H publish command and assume the added prose enforces it.

### Why the old validator does not pass

H tools/web-online-check.mjs:105–124 builds a temporary release tree from dist. It records recoveryOutput's selected hashes. H tools/deploy.sh:175–189 builds again in another worktree; :216–224 copies and publishes that later output. Its live probes compare the live site with that later copy. Its cleanup at :78–93 deletes the copy on every exit.

The old selected-file validator is removed from this copy. recoveryOutput covers only its selected paths, allowlist and engine files (H tools/web-online-check.mjs:28–48). It omits consent, full plugin art, other function files and function links. Matching VERSION or those selected hashes cannot prove equality of complete combined outputs.

### Complete manifest contract

Use one reviewed manifest implementation at each stage. The manifest contains sorted relative paths and entry types for the complete .vercel/output tree. For each regular file, include byte length, SHA-256 and permission bits that affect execution/access. Include dotfiles and directories. For each symbolic link, include its exact relative target and prove that it resolves inside the output to an existing entry. Reject absolute, dangling, cyclic or escaping links and unsupported entry types. Never follow a link outside the output. Retained copies preserve links and required permission bits.

Include config.json; every static entry/chunk/asset; sw.js; all four public legal/help pages; the domain challenge; all plugin art; every function file, consent HTML/script, board resource, runtime file and archive; package.json and .vc-config.json; and every function alias link. H tools/plugin-server-build.mjs:37–75 creates files and relative links that must be included. Do not limit this manifest to the worker's public cache graph. Reject unexpected secret/auth/environment files before reading their contents. Copy no account payload or secret into an artifact record.

Hash the canonical sorted manifest itself. Keep the root path, source/tree, tool/dependency versions and creation time in its evidence envelope. They do not replace byte identity. Do not hash absolute paths, inode numbers, owner IDs or filesystem timestamps as content. Do not omit or normalize a differing content file to make equality pass. If a build is not repeatable, stop and repair the cause or test and approve the new exact output. Do not grant an exception for a matching source SHA alone.

### Browser pair to approved outputs

1. Fix RELEASE_ROOT and RECOVERY_ROOT and their full manifests. The output records list the actual worker full SHA-256, VERSION, POLICY, ALLOWLIST and PRECACHE. Policy must be public-build-v1 on both outputs. Both VERSION and worker bytes must differ between release and recovery.
2. Extend the current web-online driver at its output record step, before cleanup, to retain full manifests and complete copies of the exact release and recovery trees it uses. Write these outside its temporary work root and outside source. Preserve function links. Record both retained roots and canonical manifest hashes beside worker-outputs.json. Hash the unmodified built outputs; the controlled fault wrappers are test instrumentation and get their own record.
3. For each of the three engines, require pair = external recovery input. Compare the recorded release and recovery selected-hash maps in worker-outputs.json with recoveryOutput computed from the retained approved RELEASE_ROOT and RECOVERY_ROOT. Require identical key sets and every SHA-256 value. Ignore only the different absolute root labels. Missing keys or a fixture pair fail.
4. Also require full browser release manifest equality with the approved release manifest, and full browser recovery manifest equality with the approved recovery manifest. Compare every path, type, length, mode, byte hash and link target. A selected-map pass does not waive a full-map difference. Record each comparison exit/result and evidence path.
5. Retain all three exact pair records, browser versions, events, run logs, counts and skips. Require all lifecycle/failure/blocked/offline cases to pass on this identified pair. Separately prove the recovery server/data states in sections 3–4. In H, the server remains the release server even while recovery static files serve; no static pair result closes the recovery-server row.

### Approved outputs to actual publish copy

1. Before the source is approved, add and review a fail-closed gate in the existing tools/deploy.sh path. Define its real input interface for the approved commit/tree, full release manifest and a durable output/evidence root outside deploy cleanup. These inputs are mandatory for this packet's publish. H has no such interface; this document invents no usable flag or setting for it. Record the implemented interface, launcher source/hash, tests and independent review in O4b.
2. Put source equality before any publish work. Check the deploy's fetched commit/tree against PACKET_MAIN. The script runs from the operator's checkout before it creates the fresh-main worktree. Thus the launcher that the operator actually invokes must include the reviewed gate too. A guard found only in the future fetched checkout does not protect an older launcher.
3. After the artifact copy at H's :219 and before the hosting publish at :224, compute the full manifest of the **actual** site/.vercel/output copy. Compare it with the approved release manifest. Also prove its equality with the tested build tree. Stop before the hosting CLI for any mismatch, missing approval/input or unreadable entry. Preserve project verification and all existing checks. Keep the static site and function as one unit.
4. Retain that exact actual publish copy, with links intact, to PUBLISHED_ROOT outside base. Retain its full manifest and the equality report outside base too. Verify the retained copy against the actual copy and approved manifest before the CLI. If retention or re-verification fails, stop before publication. Do not retain only the static folder. Do not copy .vercel/project.json or any private configuration; retain .vercel/output and non-sensitive release evidence only.
5. After project link/verification and immediately before the hosting CLI, recheck the publish input manifest. Project linkage must not change any output entry. Keep that output fixed for the publish. Record the exact CLI input tree, approved manifest hash and retained manifest hash. If a later check or write changes it, stop and repeat review/approval of the changed output.
6. Keep the single existing hosting publish inside tools/deploy.sh. Do not call the hosting CLI directly or add a second deploy script. The gate tests must prove that a changed worker, function file, consent file, plugin art, challenge, missing/extra path or altered function link prevents a publish call. Also prove that a missing approved manifest/source or failed retention prevents that call. Prove a successful retained copy survives the deploy cleanup.
7. Keep the full source/output/equality record on success or failure. Live probes use the actual publish copy and compare it with the live deployment. A later repeat uses the verified retained PUBLISHED_ROOT. Record the new deployment ID and output hash together. No separate rebuild substitutes for this retained copy.

| Equality record | Required before publish | Current record |
|---|---|---|
| Approved release full manifest / SHA-256 / retained root | Yes | OPEN |
| Approved recovery full manifest / SHA-256 / retained root | Yes | OPEN |
| Chromium exact pair; selected and full equality reports | Yes | OPEN |
| Firefox exact pair; selected and full equality reports | Yes | OPEN |
| WebKit exact pair; selected and full equality reports | Yes | OPEN |
| Actual launcher identity and reviewed guard evidence | Yes | OPEN |
| Actual tested build → publish input → approved release equality | Yes, inside the deploy before CLI | OPEN |
| Retained PUBLISHED_ROOT and full equality/retention report paths | Yes, before CLI; must survive cleanup | OPEN |
| New deployment ID → approved manifest → live probe record | After publish | OPEN |

No operator may sign equality from a command exit, source identity or worker version alone. The equality reports and retained copies are concrete incident inputs. Until those inputs exist, the main session cannot accept this packet for publication.

## Reader findings

The full independent answer is packet02r.md. Its verdict is **reject**. This correction verifies all five findings against H and M and the permitted current CI reads. No finding is refuted. **Fixed** below means the packet's claim, procedure or closure rule is corrected. It does not mean missing release evidence appears or a required source change is implemented.

| Finding | Disposition | Evidence, correction and remaining stop |
|---|---|---|
| 1. Blocker: no tested compatible recovery build | **Fixed in packet; release proof OPEN.** | Confirmed by H release-route.md:70–76 and web-online-check.mjs:107–128,177–184. H is no longer nominated as a useful recovery without a fault/behavior record. Section 3 names the recovery objective and requires a fixed reviewed source, complete retained output, distinct worker identity, exact pair in all engines, recovery-server/state proof under the production migration order and every used-engine/alias continuation. O3/O6 and signatures keep publication stopped until the actual records exist. No approved recovery source/output is available in this read-only task. |
| 2. Blocker: mandatory final evidence absent | **Fixed in packet; evidence and signatures OPEN.** | Confirmed by H release-route.md:33–36,96–107,114–121; test-gate.md:21–25,33; ticket 02:17–23. Sections 1,2,4,7,8 require retained prior/token deployment records, final source/tree and accepted base, final counts/skips/WebKit/base-final/render proof, exact runtime/continuation/startup evidence and verified recovery-state reference. Section 4 now has explicit applied migration order, missing migration numbers and runtime-role block rows. The supplied owner merge/deploy request remains acknowledged; the main session attaches its dated concrete record and resolves PR 74 separately. No missing field is marked complete. New deployment ID, live and scheduled-job outcomes remain post-publish fields. |
| 3. Major: tested, approved and published outputs can differ | **Fixed in packet; guard implementation and equality proof OPEN.** | Confirmed by H web-online-check.mjs:28–48,105–124 and deploy.sh:78–93,175–189,216–229. Section 9 replaces the incomplete selected-file validator with full-tree file/link identity, browser selected/full-map equality and retention of exact browser outputs. O4b is a hard pre-publish source-work stop. O7 requires retention/hash/equality of the actual publish copy inside the sole deploy path before the CLI, plus durable paths outside cleanup. H has no such enforcement. No publish or final signature clears until the reviewed gate and concrete reports exist. |
| 4. Major: new deployment job outcomes omitted | **Fixed in packet; post-publish proof OPEN.** | Confirmed by H release-route.md:106,108; test-gate.md:88; deploy-live-check.mjs:58,82; deploy-plugin-live-check.mjs:42–45. Section 4 keeps old outcomes as baseline only. Section 6 and O8 require scheduled tick/daily HTTP 200 tied to the new deployment and separate cron-history SQL success with times, evidence and operator signatures. Both unsigned checks or deploy exit 0 cannot close the live result. No manual live job is authorized to fill a cell. |
| 5. Major: worker load row and closure absent | **Fixed in packet; measurements and limit OPEN.** | Confirmed by H release-route.md:104,117; test-gate.md:63,66,86; public/sw.js:50–61. Section 2 and O5L add comparable local-root base/final cold/warm records with active and blocked workers, three samples/medians, recorded cache/profile conditions, first-install cost and a signed accepted local-root limit/allowed change. Installation time is separate from board usability. The absent account-page target and full later phone matrix stay outside this worker-only slice. Journey duration and renders do not close the row. |

Verification of this correction: fetch completes; H and M commit/tree identities match the reader report; M...H has 24 paths; the pushed head is fbbcb2f7; the four paths added above that head are the two main test repairs and their tickets; the frozen predecessor equals M's worker template. Current CI job/step metadata matches section 2. Both failed WebKit logs show only web-online fails, with exit 1 after 85.2 s and 85.3 s; they do not expose the inner browser error. The Playwright fault and PR 74 three-engine pass remain supplied supporting facts, not final-source proof.

This revision runs no test, build, browser, server, database action, deploy or live probe. It changes no repository file and supplies no missing operational result or final acceptance signature. Publication and final live closure remain **OPEN** under the explicit gates above.

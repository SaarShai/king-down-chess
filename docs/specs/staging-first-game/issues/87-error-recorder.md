# 87. First-party error recorder

Status: resolved

## Scope and plan

The owner approves this task in the run request. Work stays on `staging/error-recorder`. Do not push or deploy. Use only the local test database.

1. Add shared data limits and scrub rules. Install the browser recorder in `src/entry.ts`. Connect the engine worker failure through an event.
2. Add the table, runtime grants, bounded writes, API route and server fault capture. Add the report command.
3. Add the privacy text and checks. Test the emitted website and prove that the board bundle has no recorder.
4. Run the required checks. Record the results and owner steps. Commit the work.

## Check criteria

- Unit tests cover scrub rules, own frames, route IDs, fingerprints, limits and browser versions.
- HTTP and database tests cover accepted and dropped reports, counts, retention, restricted roles and failed writes.
- The browser test uses the emitted website and a local database. It checks errors, rejections, extensions, repeat faults and the page limit.
- Run each new test file twice, type check, the full test suite, and `check:browser web-game plugin-ui`.
- The plugin board contains no recorder. Its CSP and submission stay unchanged.

## Decisions

- `index.html` loads `/src/entry.ts`. That file selects `src/main.ts` or `src/online/entry.ts`. The plugin build uses `src/plugin/index.html` with a separate Vite config. Install only in the site entry.
- The shared engine sends a local `kingdown-worker-error` event. Only the website listens. This keeps the recorder out of the board bundle.
- Both builds read the full commit from `git rev-parse HEAD` at build time. The site and server use that value. A source server with no build value does not record server faults.
- The database groups by fingerprint, build and UTC hour. It keeps one sample and at most 20 route and browser values. This bounds each row.
- The function accepts at most 60 reports per minute, with at most two database writes in flight. It uses no address key.
- Each write uses one client and one transaction, with local statement and lock limits of 500 ms. It deletes at most 100 expired rows and skips locked rows. A full pool drops the report. Daily cleanup uses the same limits and repeats 100-row batches until fewer than 100 unlocked expired rows remain. Its failure does not stop the other daily work. A missing table drops fault reports silently.
- Approved message forms come from source error texts at build time and known browser and engine forms. Every variable part uses a fixed mark, including short code names. Every unlisted message uses one fixed text. Both browser and server apply this rule. The existing scrub rules are a second layer. Names use a fixed list. Unknown route words become ID marks. Browser and worker errors use only native event file, line and column fields. The file must be a same-origin JavaScript asset in the emitted site build. The browser reads that asset list from the built page. Rejections have no native location and store no frames. Error and worker reports require exactly one known-asset frame. Rejection reports require zero frames. Group codes use accepted frames only. Server faults store no frames and group by name, cleaned message and route. Never read stack text for report locations. Only the combined website build includes recorder setup, routes and cleanup. The plugin-only server and board bytes must match the base with the same packages.
- Source maps are omitted. The repo has no private source-map store by build commit. A useful map step needs that store and a build/archive process. Bundle locations and build commits remain in the report.
- The privacy text for play without an account now names fault reports. Its old claim that no data reaches the server conflicts with this task.

## Owner steps

1. Apply `supabase/migrations/0019_client_errors.sql` on staging before a deploy with this change.
2. Apply `supabase/migrations/0019_client_errors.sql` on production before a deploy with this change.

## Evidence

All required checks pass. Each database test uses the local test database or its own local copy.

| Check | Result |
| --- | --- |
| `npx tsc --noEmit -p .` | Pass. The final command exits 0. |
| Four new test files, twice each | Pass. Each final run has 42 passing tests, including seven existing account tests. |
| Full `npm test` | Pass. 264 files pass; 4,893 tests pass and eight skip. All 55 drawing tests also pass. |
| `npm run check:browser web-game plugin-ui` | Both print `ok`. Website: 40.4 seconds. Plugin UI: 262.5 seconds. |
| Repeat `npm run check:browser web-game` | Prints `ok`, 40.2 seconds. |
| `npm run test:docs` after the final privacy wording | Pass. 13 files and 167 tests pass. |
| `npm run errors:report -- --since 7` on the local database | Pass. It prints `No fault reports.` |
| `git diff --check` | Pass. |

The four new test files are `src/diagnostics/data.test.ts`, `src/diagnostics/browser.test.ts`, `src/diagnostics/server.db.test.ts` and `tools/errors-report.test.ts`. The final focused runs also include `src/account/account.test.ts`.

The first full run finds a fake token literal in the new scrub fixture. The source secret check rejects it. The fixture now builds that value from parts, as the existing secret check does. The two focused repeats and the next full run pass. The first type check also finds an incomplete `pg` query-config type. The installed driver supports `query_timeout`; named query objects keep that option and pass the type check.

Both website browser runs check the emitted site through HTTP and PostgreSQL. They check error and rejection rows, allowed fields, extension filtering, repeat faults and the five-report page limit. They also read the emitted ChatGPT board. It contains neither `/api/client-errors` nor `sendBeacon`.

The HTTP database tests run as a copy of the restricted runtime role. They check 204 responses for good and dropped reports, byte bounds, count updates, 31-day retention and failed inserts. They check server faults, RLS, browser grants and repeat migration runs.

Logs are in `/private/tmp/claude-501/ci87/sol19/checks/`. The browser runner also keeps its own detailed logs under `kingdown-check-runs/sol-errors-4XHgHl` and `kingdown-check-runs/sol-errors-BJ1yN9`.

## Code check

The change uses one shared scrub module and one database writer. The site installs the recorder before it loads either game entry. The engine keeps its worker cleanup. The new table has no player or game key. No dependency is added. The ChatGPT CSP stays unchanged.

The run makes no push or deploy. It makes no staging or production database connection.

## Review fixes

The owner requests these fixes. The staging merge uses `dc921442` and has no conflict. The review and its three probe logs confirm the four faults.

Plan:

1. Build approved message forms from source literals. Use the same forms in the browser and server. Replace all variable values with a fixed mark. Keep the scrub rules as a second check.
2. Build the browser asset list from the emitted site. Reject unknown frames. Read server frames only after the full error message and only from stack lines.
3. Use one client and one transaction per write. Set local statement and lock limits. Drop reports when the pool is full. Send the fault response before recorder work and use the Node function lifetime hook.
4. Delete expired faults in batches. Skip locked rows. Keep fault cleanup failures separate from report cleanup and account deletion. Cover an absent table.
5. Run each recorder test file twice, type checks, doc checks, the full suite, and both browser checks. Compare board bytes with `dc921442`. Commit without a push.

Check criteria: all review probe cases pass as tests; blocked SQL stops within its limit; HTTP fault time excludes recorder work; more than 100 expired rows are removed while a locked row stays; the absent table has no effect on API or daily job results. All required commands pass. The board bytes match the base build.


### Fixes and proof

- Messages: the build reads source error texts with the installed parser. This avoids a second manual list. It reads the message argument, including native error cause options. Template values and engine code names use a fixed mark. All other messages become `Unlisted message`. The browser checks before send. The server checks before it accepts a report and before storage. The scrub stays as a second layer.
- Frames: the server build reads the emitted site JavaScript paths. Both the reader and writer drop unknown browser frames. A report with no remaining browser frame is dropped. The reader makes a new group code after it drops frames. Server stack parsing removes the full message first and accepts only real `    at ` lines.
- Writes: each write uses one client and one transaction. Local statement and lock limits are 500 ms. The write slot stays active through rollback. A full pool drops the report. The API sends its fault response and releases its request slot before it calls `waitUntil`. The installed package and the [Vercel Node API](https://vercel.com/docs/functions/functions-api-reference/vercel-functions-package#waituntil) support this work after a response.
- Retention: each delete takes at most 100 expired rows and skips locked rows. Daily cleanup repeats batches until fewer than 100 rows are removed. Each batch has the same local time limits. A fault cleanup failure has its own catch and rollback. Report cleanup and account deletion continue.
- Missing table: the HTTP tests rename the table and check the empty 204 response, the unchanged API fault response, and a daily account deletion. The emitted website check also removes the table name, sends a fault, and checks that the page and status route still work.

The data and browser tests cover the bad FEN, player message, account number, full browser string, path with query and fragment, and raw Auth message. The FEN test calls the real parser. The database tests cover these same message cases, an unknown asset, false stack lines in a message, four concurrent writes, and 20-value limits. Three pairs of blocked writes leave no blocked database session after their limits. A fault response takes less than 350 ms while its recorder takes at least 450 ms. The request slot is released once. A full pool queues no recorder work.

The retention test starts with 351 expired rows and one locked row. A write removes 100 rows. Daily cleanup removes batches of 100, 100, and 50 rows. The locked row and a current row remain. After the lock ends, the next cleanup removes the last expired row. A table lock and a missing table each leave report cleanup and account deletion active.

| Check | Result |
| --- | --- |
| `npx tsc --noEmit -p .` | Pass. Exit 0. |
| Selected tests, twice | Pass. Each run has 9 files and 134 passing tests. Each also has 56 passing drawing tests. |
| `npm run test:docs` | Pass. 13 files and 167 tests. The two privacy paragraphs match exactly. |
| Full `npm test`, once | Pass. 272 files, 5,062 passing tests, and eight skips. All 56 drawing tests pass. |
| `npm run check:browser web-game plugin-ui` | Both print `ok`. Website: 43.1 seconds. Plugin UI: 279.6 seconds. |
| Board comparison with `dc921442` | Pass. Both have 895,361 bytes and SHA-256 `47d81dbb8349691f95d18b7dfe1c9d7421bbcc9f902e8920c27131d82dba44cf`. |
| `git diff --check` | Pass. |

The selected files are the three test files in `src/diagnostics/`, `tools/errors-report.test.ts`, `tools/lib/error-forms.test.ts`, `tools/plugin-server-build.test.ts`, `tools/privacy-policy.docs.test.ts`, `src/online/jobs.db.test.ts`, and `src/api/http.test.ts`.

The first test start finds that the installed TypeScript package has no parser API. The build helper now uses the parser of the installed build tool. The next run finds two incorrect fixtures and early pool refusal. These are fixed. A later 132-test run passes. The final two expanded runs each pass all 134 tests.

The first browser run finds that Playwright trims leading blank lines in the fault fixture. Those faults then have the same code location and the same approved message. The fixture now places a fixed comment before its blank lines. The final browser run passes. The first plugin check also passes in 274.3 seconds.

Logs are in `/private/tmp/claude-501/ci87/sol22/checks/`. The final browser detail logs are in `kingdown-check-runs/sol-errors-FyvPJL`. Every test run uses the approved loopback database or its own loopback copy. The shared locks stay in place. No staging or production database connection, push, or deploy occurs.

### Final code check

The fix uses one shared message rule and one build helper. It adds no dependency. PostgreSQL controls the SQL time limit. The existing Node function package keeps recorder work active after the response. The daily job isolates fault cleanup failures. The tests prove the review cases through the real local database and emitted website. The board bytes match the staging base.

## Second review fixes

The owner requests both open fixes in `/private/tmp/claude-501/ci87/sol23/rereview.md`.
The merge of `origin/staging/first-game` at `0c016348` has no conflict.

Plan:

1. Replace every variable part of an approved engine message with a fixed mark. Check the sent body and stored row for short private names and the old private-text cases.
2. Include recorder code only in the combined website server build. Add a build test. Compare the plugin-only server and board bytes with a fresh build of `0c016348` with the same packages.
3. Run the required type, selected test, full test, document and browser checks. Run copies of both review proof scripts. Record the results and commit. Do not push or deploy.

Check criteria: no input value remains in sent or stored fields; all required checks pass; both byte comparisons pass; the temporary base worktree is removed; the final worktree is clean.

### Second review results

Both open findings are fixed.

- Engine messages use fixed text for every variable part. The three short private names, UUID, email and move cases pass through the browser recorder and the real local database. Tests check the full sent body, all stored fields and the group code. The tests also send raw client messages and record server faults. The old FEN, player text, account number, full browser string, asset URL and Auth cases stay in place.
- The server build enables recorder code only when it includes the website. The plugin build removes its setup, route, message data and daily cleanup. The build test checks the emitted file. The API reads recorder options only in a website build, so the plugin function stays unchanged. No dependency changes.
- The copied review scripts change paths only. `identifiers.mjs` keeps no private name in sent or stored reports. `artifacts.mjs` returns 404 for the base and plugin-only recorder route, and 204 for the combined website route. The website stores one row. Old asset reports store no row. An absent table produces no error log. All of these servers run on loopback.
- A fresh base worktree uses `0c016348` and a copy of this worktree's installed packages. The plugin-only server has 715,646 bytes and SHA-256 `48343160695990fb95dfd18a3eb4044e31794911b4f537cbcba278a545eee9b4`. Its bytes match the base. Both boards have 895,596 bytes and SHA-256 `34d2245fcec040d0e78c64e889880705ed834fbc7247015f6549fd631637a76f`. The combined website board also matches. The board CSP source has no change against the base. The temporary worktree and its branch are removed.

| Check | Result |
| --- | --- |
| `npx tsc --noEmit -p .` | Pass. Exit 0. |
| Selected `npm test` | Pass. Nine files, 158 tests and 56 drawing tests. |
| Full `npm test`, once | Pass. 272 files, 5,081 tests and eight skips. All 56 drawing tests pass. |
| `npm run test:docs` | Pass. 13 files and 167 tests. |
| `npm run build:vercel` | Pass. |
| `npm run plugin:build:vercel`, both revisions | Pass. Server and board byte checks pass. |
| `npm run check:browser web-game plugin-ui` | Both pass. 41.9 seconds and 333.0 seconds. |
| Copied `identifiers.mjs` and `artifacts.mjs` | Both pass under the shared test lock. |
| `git diff --check` | Pass. |

The selected test files are `src/diagnostics/*.test.ts`, `tools/errors-report.test.ts`, `src/api/http*.test.ts`, `src/online/jobs.db.test.ts`, `tools/plugin-server-build.test.ts` and `tools/lib/error-forms.test.ts`.

The first byte check finds unused recorder data in the plugin output. The build now removes unused recorder modules too. The next check finds extra recorder fields in the API function arguments. Recorder options now use a website-only read. The final plugin bytes match the base. One test check rejects the word `fingerprint`, which also occurs in the unchanged game code. The check now uses recorder text. The next selected run and full run pass. The first package-copy command uses an incorrect relative path. The corrected command copies this worktree's installed packages to the base worktree. No dependency file changes.

The full run takes 595.47 seconds. The browser runner waits for another run's exclusive lock, then both checks pass. No lock is removed. Logs, copied scripts, compared files and `build-compare.json` are in `/private/tmp/claude-501/ci87/sol24/`. Browser detail logs are in `kingdown-check-runs/sol-errors-XLmqDJ`.

The code check finds no need for a new helper or dependency. Shared message rules fix the private-value fault once. A build flag and normal removal of unused modules keep the plugin output unchanged. All database work uses the approved loopback test database or its local test copies. No push, deploy, staging database connection or production database connection occurs.


## Frame review fix

The owner requests the remaining frame fix. The review at `/private/tmp/claude-501/ci87/sol25/rereview3.md` confirms private values in message headers and function names. The staging base is `30609582`; its merge has no conflict.

Plan:

1. Remove the full message header. Read only the file location from Chromium, WebKit and Firefox stack lines. Keep the server asset check. Remove false frames that occur in raw client messages. Make group codes from accepted frames only.
2. Use native errors to check full sent bodies and stored rows for unknown assets, false lines in known assets, function names and messages with more than one line. Repair the browser test helper.
3. Run the requested type, test, browser and review proof checks. Compare the board, plugin function files and CSP with a clean build of the staging base. Remove that temporary worktree.
4. Record all results, commit on this branch, and leave a clean worktree. Do not push or deploy.

Check criteria: each private value is absent from the full sent body and stored row. The group code uses the accepted first frame. All required checks pass. The board, plugin function files and CSP match the base bytes.


### Frame fix and evidence

The browser removes the full native message header before it reads frames. It reads only the final file location in Chromium, WebKit and Firefox stack lines. A function name does not supply a location. Worker file locations use the same reader. The server keeps its known-asset check. It also removes a frame that occurs in the raw client message. Both the reader and writer make the group code from accepted frames.

The browser test helper keeps the real message in its stack header. Ten new native-error cases check full sent bodies and stored rows. They cover an unknown asset, a false line in a known asset, a computed function name, a worker fault and a message with more than one line. These new cases do not assign `Error.stack`. Four parser cases check the two browser stack forms, with and without function names.

| Check | Result |
| --- | --- |
| Staging merge | Pass. Base `30609582` merges without a conflict in `794938b6`. |
| `npx tsc --noEmit -p .` | Pass. Exit 0. |
| Selected recorder, HTTP, jobs, server-build and message-form tests | Pass. Nine files and 172 tests pass. All 56 drawing tests pass. |
| `npm run test:docs` | Pass. 13 files and 167 tests pass. |
| Full `npm test`, one run | Pass. 272 files and 5,095 tests pass; eight tests skip. All 56 drawing tests pass. Duration: 352.82 seconds. |
| `npm run check:browser web-game plugin-ui` | Pass. Website: 41.7 seconds. Plugin UI: 273.9 seconds. |
| Copied source proof, with path changes only | Fails. Its direct frame-reader call omits the full message. It expects two large reports to be dropped. The fixed recorder removes their headers and sends safe reports. A separate copy passes the message to the reader and passes all 300 message cases, 300 client reports, 300 server reports and four false-frame cases. |
| Copied artifact proof, with path changes only | Fails at its old assertion that requires the private value in a sent frame. A separate copy requires the private values to be absent. Its first run stops at the duplicate-report limit: the fixed locations now give the first three cases the same group code. With a fresh page for each case, all four native browser cases pass. Full sent bodies and stored rows contain no private probe value. |
| Emitted recorder routes | Pass. Base and plugin-only builds return 404 and store no row. The website returns 204 and stores one row. |
| Board, plugin function files and CSP source against the base build | Pass. All 22 function files and four links match. Both boards match the base. CSP source bytes match. |
| Temporary base worktree and branch | Removed after the base build and first byte comparison. Saved base files remain in the proof folder. |
| `git diff --check` | Pass. |

The selected files are `src/diagnostics/*.test.ts`, `tools/errors-report.test.ts`, `src/api/http*.test.ts`, `src/online/jobs.db.test.ts`, `tools/plugin-server-build.test.ts` and `tools/lib/error-forms.test.ts`.

The board has 895,596 bytes and SHA-256 `34d2245fcec040d0e78c64e889880705ed834fbc7247015f6549fd631637a76f`. The plugin server has 715,646 bytes and SHA-256 `48343160695990fb95dfd18a3eb4044e31794911b4f537cbcba278a545eee9b4`. The base uses a copy of this worktree's installed packages. The final byte check runs after both browser checks and passes.

Proof scripts, results and logs are in `/private/tmp/claude-501/ci87/sol26/`. `build-compare.json` has each file hash and link target. Browser logs are in `kingdown-check-runs/sol-errors-YTB4qC`. Both original proof copies differ from the review files in paths only. The separate updated copies keep the original failure logs.

The code check finds no need for a new helper or dependency. The full suite and browser checks use the final source code. Tests wait for the shared lock; no lock is removed. All database work uses the approved local test database or its local test copies. No push, deploy, staging database connection or production database connection occurs.


## Native field fix

The owner replaces stack text parsing after the fourth review. The staging base is `762e42bc`. Its merge has no conflict.

Plan:

1. Delete both stack text parsers. Use native browser and worker event fields. Send no frames for rejections. Store no server frames. Keep message cleaning, known-asset checks, group codes and repeat suppression.
2. Check native computed names, names with new lines, the old length cut, unknown assets, raw HTTP reports, async faults and eval faults. Check full sent bodies and stored rows.
3. Run the required type, selected test, full test, document, browser and copied proof checks. Compare board bytes, plugin function bytes and CSP source with a fresh build of the merged staging base. Remove the temporary worktree.
4. Record each result, commit, and leave a clean worktree. Do not push or deploy.

Check criteria: private probe values are absent from recorder bodies and stored rows. Error and worker reports use one native known-asset location. Rejections store one row with no frames and a cleaned message. Server faults use no stack data. All required checks pass.

Server choice: no frames is the smaller correct option. Structured V8 call sites need stack capture control and can depend on an earlier stack read. The recorder needs neither. It groups server faults by name, cleaned message and cleaned route. The operator keeps the full stack in host logs.

The HTTP reader checks shape and known asset paths. It cannot prove that an arbitrary HTTP caller gets a location from a native event. Reports with more than one frame are invalid. A caller can still forge one valid known-asset location; no client-only change can authenticate that value.


### Native field evidence

- `browserFrames()` and `serverFrames()` are removed. Their text-parser tests are removed. The browser and server do not read `.stack`. A throwing stack getter test checks this rule.
- The built page lists all emitted JavaScript assets in one meta element. This includes worker assets. The browser and the server check known asset paths. Both remove query and fragment values from locations.
- Native browser checks cover computed names with Chromium and WebKit frame text, new lines, parentheses, the old 32,768-character cut, unknown assets, property errors, async rejections, eval faults and a real worker. They check the complete report body and stored fields. Different private names at one native location give the same group code.
- The copied `native-artifacts.mjs` passes eight browser cases. Each has no private value in its sent body or stored row. Its three raw HTTP cases store no row. Its two server computed-name cases store no frames. The selected database tests also check server capture before and after a stack read, and separate groups for separate cleaned routes.
- Async and eval rejections store one row with no frames. Eval with a known native filename stores its real event location. The original review eval event has an empty filename. It sends no error report, because an error report requires one known native location. The recorder does not infer an eval caller from stack text.
- The copied proofs change output paths and parser-dependent assertions only. Private-frame assertions now require no private value. The cut-name case now stores one safe row. Rejection group checks use an empty location. Raw two-frame reports are invalid. Server checks use no frames and include the route in the group code. `native-extra.mjs` replaces its deleted parser call with native event fields.
- The first temporary native check server lacks `/api/status`. This makes the existing missing-table fixture fail with 404 instead of 200. The temporary server now has that fixture route. The next native check and both copied proofs pass. No product fix is needed for that failure.
- A fresh build of `762e42bc` uses a copy of the same installed packages. All 22 plugin function files and four links match. Both boards match the base: 895,593 bytes, SHA-256 `915f65ce0c860d35d1c2aa1043981dfcd27f04cc08317a7865ed98a30747380a`. The plugin server has 715,646 bytes, SHA-256 `48343160695990fb95dfd18a3eb4044e31794911b4f537cbcba278a545eee9b4`. CSP source bytes match. The temporary worktree and branch are removed.
- The public privacy paragraph and submission copy stay identical. They now name one native error location and no locations for rejections or server faults.

The final code check finds no need for a new dependency or V8 global state. The smaller server choice is complete: no frames and a group code from name, cleaned message and route. The HTTP reader cannot authenticate a forged single known-asset frame. It rejects the old two-frame reports; the shipped browser no longer makes false frames from private text.

Logs, native proof data, proof changes and byte hashes are in `/private/tmp/claude-501/ci87/sol28/`. All database work uses the approved loopback test database or its local test copies. Shared locks stay in place. No push, deploy, staging database connection or production database connection occurs.


### Native field final checks

| Check | Result |
| --- | --- |
| Fetch and staging merge | Pass. `762e42bc` merges without a conflict in `6aa4d643`. |
| `npx tsc --noEmit -p .` | Pass. Exit 0. |
| Required selected tests | Pass. Nine files and 162 tests. All 57 drawing tests pass. |
| Final selected tests, with the emitted asset-list test | Pass. Ten files and 172 tests. All 57 drawing tests pass. |
| Full `npm test`, once | Pass. 272 files and 5,085 tests pass. Eight tests skip. All 57 drawing tests pass. Duration: 346.50 seconds. |
| `npm run test:docs` | Pass. 13 files and 167 tests. The privacy paragraphs match. |
| `npm run check:browser web-game plugin-ui` | Pass. 59.5 seconds and 271.7 seconds. |
| Native browser, HTTP and database check | Pass. The built site uses native locations. Async and eval rejections have no frames. |
| Copied `native-artifacts.mjs` | Pass. Eight safe browser reports, three dropped raw reports and two server reports with no frames. |
| Copied `native-extra.mjs` | Pass. Eval has no native filename. Anonymous and real worker locations use native fields. |
| Site and plugin builds | Pass. Both plugin builds use the same installed packages. |
| Board bytes, all plugin function bytes and CSP source | Pass against `762e42bc`. |
| Temporary base worktree and branch | Removed. |
| `git diff --check` | Pass. |

The selected files are `src/diagnostics/*.test.ts`, `tools/errors-report.test.ts`, `src/api/http*.test.ts`, `src/online/jobs.db.test.ts`, `tools/plugin-server-build.test.ts` and `tools/lib/error-forms.test.ts`. The final selected run also includes `tools/offline-build.test.ts`. Both selected runs are separate from the full-suite pass.

Browser detail logs are in `kingdown-check-runs/sol-errors-1kKlmA`. The full test and browser commands end before the final report.

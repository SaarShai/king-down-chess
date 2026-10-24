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
- Approved message forms come from source error texts at build time and known browser and engine forms. Template values use a fixed mark. Every unlisted message uses one fixed text. Both browser and server apply this rule. The existing scrub rules are a second layer. Names use a fixed list. Unknown route words become ID marks. Browser frames must name JavaScript assets in the emitted site build. Server frames must start after the full message and use real stack lines.
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

- Messages: the build reads source error texts with the installed parser. This avoids a second manual list. It reads the message argument, including native error cause options. Template values use a fixed mark. Known engine forms keep only short code identifiers. All other messages become `Unlisted message`. The browser checks before send. The server checks before it accepts a report and before storage. The scrub stays as a second layer.
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

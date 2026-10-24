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
- The existing daily cleanup removes rows whose last time is more than 30 days ago. Each write also deletes at most 100 expired rows. The daily job works when there are no new faults. The write cleanup bounds backlog work.
- Extra scrub rules remove quoted values, URLs, IP addresses, common token forms, chess moves and board positions. Names use a fixed error-name list. Unknown route words become ID placeholders. These rules reduce private data in unexpected error text.
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

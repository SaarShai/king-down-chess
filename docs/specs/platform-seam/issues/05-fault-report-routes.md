# The routes of fault reports

Status: done on branch seam-reports; reviewed, repaired and checked; waits for the staging pass and the publish.

Class: C. Size: S. Needs a two-account pass on staging and a publish.

## Problem

- `fixedRoutes` in `src/diagnostics/data.ts:83` has no `/api/friends`, no `/api/invites/:id/decline` and no `/play/friend`. A fault report from one of these shows the route `/other`.
- It also has no `/index.html`. The site sends an account solo game to that address (`src/online/launch.ts:53`), and the old board starts the fault recorder (`src/entry.ts`).
- `src/diagnostics/data.test.ts` checks sample paths only. No test compares the list with the API table (`src/api/http.ts:140`) or with the account routes (`src/online/routes.ts`).
- The server calls `errorRoute` too (`src/diagnostics/server.ts:63`) and stores the result. Thus the change is class C, small as it is.

## Change

- Add `/api/friends`, `/play/friend` and `/index.html` to the list, and a pattern for `/api/invites/<id>/decline` that stores no ID.
- Keep the line `if (clean === '/next.html') return '/next.html';` as it is: `tools/solo-launch.mjs` finds it by its exact text.

## Test that fails first

In `src/diagnostics/data.test.ts`: for each `METHOD /api/…` key of `src/api/http.ts`, with a sample ID in the place of each parameter, `errorRoute` does not give `/other`, and its result does not hold the ID. The same for the named account paths and for `/index.html`. The test reads the keys with the scan that `tools/plugin-server-build.test.ts:46` uses. It is red on the four paths today.

## Checks

- The test, then `npm run test:changed`.
- On staging: one fault report from `/play/friend` with each of two accounts; read the stored route.

## Known limits

- The stored route of these four paths changes one time, so old and new reports of one fault have different routes.
- An installed app reduces the path itself, with its old list (`src/diagnostics/browser.ts:24`). Its reports from `/play/friend` and `/index.html` stay `/other` until the next app build. The server change needs no app build.

## Work record

Branch `seam-reports`, from `origin/main` at cc61f2633.

Change:
- `src/diagnostics/data.ts`: `fixedRoutes` gets `/index.html`, `/play/friend` and `/api/friends`. A new line in `errorRoute` gives `/api/invites/:invite/decline` for `/api/invites/<id>/decline`. The line `if (clean === '/next.html') return '/next.html';` does not change. The comment of `errorRoute` now names the old board page too.
- `src/diagnostics/data.test.ts`: one new test. It reads each key of `src/api/http.ts` with the scan of `tools/plugin-server-build.test.ts`. It tests each key path two times: as the server gives it (`/api/invites/:id/decline`, from `route.key` in `src/api/http.ts`) and with a sample ID. It also tests the path of each screen from `accountPath` (`src/online/routes.ts`) and `/index.html`. The samples are a `Record` with one key for each screen of `AccountEntryRoute`, so a new screen with no sample does not compile. A route must not be `/other`, must not hold the game ID or the invite key, and must give itself again, because the server reduces the route of the browser a second time.

Red, on an earlier text of the test with the sample-ID form only (`red.log:28`): `KINGDOWN_TEST_FILE=src/diagnostics/data.test.ts npm test`, 1 failed, 35 passed. The failing list held the four paths of the ticket: `/api/friends`, `/api/invites/<id>/decline`, `/play/friend`, `/index.html`.

Red again, on the final test text and the old `data.ts` (`red2.log`): 1 failed, 35 passed. The failing list holds the four paths and the raw key `/api/invites/:id/decline`; `/api/friends` comes two times, because both forms of a key with no parameter are equal.

Runs after the change:
- `KINGDOWN_TEST_FILE=src/diagnostics/data.test.ts npm test`: 36 passed, 15 s.
- `KINGDOWN_TEST_FILE=tools/platform.test.ts npm test`: 18 passed, 3 s. This test reads the `/next.html` line of the off build.
- `npm run test:changed`: red as one run, exit 1. The runner starts the tests only after both type checks pass, so the type checks passed. 135 files selected; 128 files passed, 1 skipped, 6 failed; 3064 tests passed, 58 skipped, 42 failed; 761 s. All 42 failures are in six plugin harness files (`plugin-app`, `plugin-board`, `plugin-board-drafts`, `plugin-board-input`, `plugin-motion`, `plugin-ios-size`): 37 Playwright timeouts, 2 `expect.poll` timeouts (`changed.log` lines 403, 605) and 3 value assertions inside `expect.poll` calls (lines 227, 251, 480).
- The six files again, with the same head and no type check: `tools/plugin-ios-size.test.ts` 33 passed, 56 s; the other five together 386 passed, 1 skipped, 201 s.
- `npm run test:docs`: 19 files passed; 199 tests passed, 1 skipped; 2 s.

Not verified:
- The two-account pass on staging and the stored route of a report from `/play/friend`. No staging deploy ran.
- The database tests of the server path. `src/diagnostics/server.db.test.ts` skips when `PLUGIN_TEST_DATABASE_URL` is not set, and the log does not show that it ran. Its one `/other` case sends a made-up `/play/profile/...` path, so the change does not touch it.
- A full-suite run. CI runs it.

## Review

- Kind: a review by an agent that did not build the change.
- Head: `1498675b320e750f34138aaa455eacc9ce46f1bd`.
- Findings: no blocker; five notes. The record said that all 42 `test:changed` failures were timeouts, gave a load average that no log holds, and gave a red line from an earlier test text. The "Known limits" line said that an old app sends raw paths. The test listed the account screens by hand.
- One batch repairs them:
  - The record now gives the three kinds of failure with their log lines, and has no load average.
  - The red ran again on the final test text (`red2.log`), and the record gives both red lines.
  - The "Known limits" line now says that an installed app reduces the path itself.
  - The test keeps its samples in a `Record` of `AccountEntryRoute['screen']`. A probe without the `new-friend` key fails the type check with TS2741 (`probe-missing-screen.log`).
- Runs after the batch:
  - `KINGDOWN_TEST_FILE=src/diagnostics/data.test.ts npm test`: 36 passed, 4 s (`green2.log`).
  - `npm run test:docs`: 19 files passed; 199 tests passed, 1 skipped; 2 s.
  - No `test:changed` run: the batch changes one test file and the ticket.
- Check of the repair batch, by the same reviewer, on head `a348026a3`: each repair holds; no blocker. One note stays open, not needed for the ticket: a mapped type can make each screen key hold the sample of its own screen.

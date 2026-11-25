# The routes of fault reports

Status: done on branch seam-reports; waits for the review, the staging pass and the publish.

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
- An old app sends raw paths; the server reduces them. No iOS build is necessary.

## Work record

Branch `seam-reports`, from `origin/main` at cc61f2633.

Change:
- `src/diagnostics/data.ts`: `fixedRoutes` gets `/index.html`, `/play/friend` and `/api/friends`. A new line in `errorRoute` gives `/api/invites/:invite/decline` for `/api/invites/<id>/decline`. The line `if (clean === '/next.html') return '/next.html';` does not change. The comment of `errorRoute` now names the old board page too.
- `src/diagnostics/data.test.ts`: one new test. It reads each key of `src/api/http.ts` with the scan of `tools/plugin-server-build.test.ts`. It tests each key path two times: as the server gives it (`/api/invites/:id/decline`, from `route.key` in `src/api/http.ts`) and with a sample ID. It also tests the path of each screen from `accountPath` (`src/online/routes.ts`) and `/index.html`. A route must not be `/other`, must not hold the game ID or the invite key, and must give itself again, because the server reduces the route of the browser a second time.

Red: `KINGDOWN_TEST_FILE=src/diagnostics/data.test.ts npm test`, 1 failed, 35 passed. The failing list held exactly the four paths of the ticket: `/api/friends`, `/api/invites/<id>/decline`, `/play/friend`, `/index.html`.

Runs after the change:
- `KINGDOWN_TEST_FILE=src/diagnostics/data.test.ts npm test`: 36 passed, 15 s.
- `KINGDOWN_TEST_FILE=tools/platform.test.ts npm test`: 18 passed, 3 s. This test reads the `/next.html` line of the off build.
- `npm run test:changed`: red as one run, exit 1. The runner starts the tests only after both type checks pass, so the type checks passed. 135 files selected; 128 files passed, 1 skipped, 6 failed; 3064 tests passed, 58 skipped, 42 failed; 761 s. All 42 failures are Playwright timeouts in six plugin harness files (`plugin-app`, `plugin-board`, `plugin-board-drafts`, `plugin-board-input`, `plugin-motion`, `plugin-ios-size`). When the run ended, the 5-minute load average of the Mac was 42.
- The six files again, with the same head and no type check: `tools/plugin-ios-size.test.ts` 33 passed, 56 s; the other five together 386 passed, 1 skipped, 201 s.
- `npm run test:docs`: 19 files passed; 199 tests passed, 1 skipped; 2 s.

Not verified:
- The two-account pass on staging and the stored route of a report from `/play/friend`. No staging deploy ran.
- The database tests of the server path. `src/diagnostics/server.db.test.ts` skips when `PLUGIN_TEST_DATABASE_URL` is not set, and the log does not show that it ran. Its one `/other` case sends a made-up `/play/profile/...` path, so the change does not touch it.
- A full-suite run. CI runs it.

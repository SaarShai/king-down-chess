# The routes of fault reports

Status: needs-triage. Waits for the owner's approval of [the spec](../spec.md).

Class: C. Size: S. Needs a two-account pass on staging and a publish.

## Problem

- `fixedRoutes` in `src/diagnostics/data.ts:83` has no `/api/friends`, no `/api/invites/:id/decline` and no `/play/friend`. A fault report from one of these shows the route `/other`.
- `src/diagnostics/data.test.ts` checks sample paths only. No test compares the list with the API table (`src/api/http.ts:140`) or with the account routes (`src/online/routes.ts`).
- The server calls `errorRoute` too (`src/diagnostics/server.ts:63`) and stores the result. Thus the change is class C, small as it is.

## Change

- Add `/api/friends` and `/play/friend` to the list, and a pattern for `/api/invites/<id>/decline` that stores no ID.
- Keep the line `if (clean === '/next.html') return '/next.html';` as it is: `tools/solo-launch.mjs` finds it by its exact text.

## Test that fails first

In `src/diagnostics/data.test.ts`: for each `METHOD /api/…` key of `src/api/http.ts`, with a sample ID in the place of each parameter, `errorRoute` does not give `/other`, and its result does not hold the ID. The same for the named account paths. The test reads the keys with the scan that `tools/plugin-server-build.test.ts:46` uses. It is red on the three paths today.

## Checks

- The test, then `npm run test:changed`.
- On staging: one fault report from `/play/friend` with each of two accounts; read the stored route.

## Known limits

- The stored route of these three paths changes one time, so old and new reports of one fault have different routes.
- An old app sends raw paths; the server reduces them. No iOS build is necessary.

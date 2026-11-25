# One page route table

Status: needs-triage. Waits for the owner's approval of [the spec](../spec.md).

Class: B. Size: M.

## Problem

- The pattern of the online pages, `^/(?:play(?:/.*)?|g/[^/]+/?|j/?)$`, has four copies: `tools/plugin-server-build.mjs:42` (the host), `ios/App/App/SceneDelegate.swift:62` (the app), `vite.config.ts:198` (the preview) and `tools/solo-launch/sw.js:194` (the offline page).
- The copies differ now. For `/j` on a launch tree, the host sends the page to `join.html` (`plugin-server-build.mjs:41`), and the preview sends it to `index.html`.
- One comparing test exists: `tools/ios-app.test.ts:12` compares the Swift copy with the host on 11 sample paths, and it skips `/j` by hand.
- No test compares the worker copy, `parseAccountRoute` (`src/online/routes.ts:14`) or `launchRoute` (`src/interface/platform.ts:15`) with the host.
- Two of the three seam faults of the history were route faults: 13938bdd3 and 97f1b02c8.

## Change

- A new module `tools/lib/page-routes.mjs` holds the pattern, the text of the join page (now inline at `plugin-server-build.mjs:137`) and a function that gives the page routes for a tree with or without the launch marker.
- `vercelRoutes` in `tools/plugin-server-build.mjs` puts these routes in the same place and order as now.
- The preview middleware of `vite.config.ts` routes a path through the same routes (with `tools/lib/site-route.mjs`). Its own copy of the pattern goes.
- The Swift router, the worker, the AASA file and `src/online/routes.ts` do not change.
- The check lists of the deploy checks (`tools/vercel-check.mjs`, `tools/deploy-live-check.mjs`, `tools/web-online-check.mjs`) stay independent on purpose: a check that reads the table that it checks proves nothing.

## Tests

1. Written before the change: `vercelRoutes(site)` gives the same routes after the change as before it, with and without the marker.
2. Fails first: the preview routes each sample path as the host does. It is red on `/j` and `/j/` today.
3. In `tools/ios-app.test.ts`: the Swift pattern is equal to the pattern of the module, as text. The sample loop stays. The `/j` difference stays, with its reason in the test: in the app, `/j` arrives only through `UniversalLink.localURL`.
4. In `tools/service-worker.test.ts`: the launch worker gives the offline page for a path if and only if the pattern matches it. The sample list has paths that must not match: `/`, `/playground`, `/g/a/b`, `/next.html`.
5. `parseAccountRoute` gives a route only where the host gives `index.html` or `join.html`. `launchRoute` gives home only where the host gives `next.html` with no 404. These tests read class C code; they do not edit it.

## Checks

- The tests above, then `npm run test:changed`.
- `npm run check:vercel` on a launch tree: the routes of the built site are the same.

## Known limits

- The Swift copy and the worker copy stay copies. A test makes a difference fail; it does not remove the copy. A generated Swift file needs a new iOS build, and a filled worker changes the worker bytes for each client.
- The preview serves a launch tree only in the release checks and by hand, until ticket 06.

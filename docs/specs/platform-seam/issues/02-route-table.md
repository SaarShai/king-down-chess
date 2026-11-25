# One page route table

Status: done on branch seam-guards; waits for the review.

Class: B. Size: M.

## Problem

- The pattern of the online pages, `^/(?:play(?:/.*)?|g/[^/]+/?|j/?)$`, has four copies: `tools/plugin-server-build.mjs:42` (the host), `ios/App/App/SceneDelegate.swift:62` (the app), `vite.config.ts:198` (the preview) and `tools/solo-launch/sw.js:194` (the offline page).
- The copies differ now. For `/j` on a launch tree, the host sends the page to `join.html` (`plugin-server-build.mjs:41`), and the preview sends it to `index.html`.
- One comparing test exists: `tools/ios-app.test.ts:12` compares the Swift copy with the host on 11 sample paths, and it skips `/j` by hand.
- No test compares the worker copy, `parseAccountRoute` (`src/online/routes.ts:14`) or `launchRoute` (`src/interface/platform.ts:15`) with the host.
- Two of the three seam faults of the history were about `/j`: 13938bdd3 (the route) and 97f1b02c8 (the check lists after the route change).

## Change

The host list is the table. `vercelRoutes` in `tools/plugin-server-build.mjs` already gives it, and `tools/ios-app.test.ts` already reads it.

- The preview middleware of `vite.config.ts` routes each path through `vercelRoutes` of the built tree (with the two servers off) and `tools/lib/site-route.mjs`. Its own copy of the pattern goes. The preview uses only the page destinations of the list (`index.html`, `join.html`, `next.html`). It has no `/mcp` and no `/internal`, so each other destination answers as a missing file does today. The preview tells the route function which files the built tree has, and it keeps its early return for a tree with no launch marker.
- The text of the join page, now inline at `plugin-server-build.mjs:137`, becomes an exported constant. The built tree has no `join.html` (the host build writes it into its own output), so the preview answers `/join.html` with this constant.
- The body of `vercelRoutes` does not change. Thus the class is B: the routes of the live host are the same function with the same output, and test 1 holds this.
- The Swift router, the worker, the AASA file and `src/online/routes.ts` do not change.
- The check lists of the deploy checks (`tools/vercel-check.mjs`, `tools/deploy-live-check.mjs`, `tools/web-online-check.mjs`) stay independent on purpose: a check that reads the table that it checks proves nothing.

## Tests

1. Written before the change: `vercelRoutes(site)` gives the same routes after the change as before it, with and without the marker, and the host build writes the same `join.html`.
2. Fails first: the preview routes each sample path as the host does. It is red on `/j` and `/j/` today.
3. In `tools/ios-app.test.ts`: the Swift pattern is equal to the pattern of the host route, as text. The sample loop stays. The `/j` difference stays, with its reason in the test: in the app, `/j` arrives only through `UniversalLink.localURL`.
4. In `tools/service-worker.test.ts`: the launch worker gives the offline page for a path if and only if the pattern of the host route matches it. The sample list has paths that must not match: `/`, `/playground`, `/g/a/b`, `/next.html`.
5. `parseAccountRoute` gives a route only where the host gives `index.html` or `join.html`. `launchRoute` gives home only where the host gives `next.html` with no 404. The test of `parseAccountRoute` reads class C code; it does not edit it.

## Checks

- The tests above, then `npm run test:changed`.
- `npm run check:vercel` on a launch tree: the routes of the built site are the same.

## Known limits

- The Swift copy and the worker copy stay copies. A test makes a difference fail; it does not remove the copy. A generated Swift file needs a new iOS build, and a filled worker changes the worker bytes for each client.
- Until ticket 06, the preview serves a launch tree only in a release run and by hand.

## Work record

- `tools/plugin-server-build.mjs`: the join page is the exported constant `JOIN_PAGE`, and the host build writes it. No line of `vercelRoutes` changes.
- `vite.config.ts`: the preview middleware of a launch tree routes each path through `vercelRoutes(site, { chatgpt: false, muse: false })` and `siteRoute`. It tells `siteRoute` which files the tree has, and that `/join.html` is present. It answers `/join.html` with `JOIN_PAGE`. Each destination that is not a page (`/mcp`, `/internal`) gets the 404 page, as a missing file does today. The preview adds no route header. Its copy of the pattern goes.
- Test 1 (`tools/plugin-server-build.test.ts`): the routes of today as literals, with and without the marker (both servers on), and the join page text in the server-build test of ticket 03. It was green before the change and after it.
- Test 2 (`tools/plugin-server-build.test.ts`): takes the `solo-launch-preview` plugin from the config, drives its middleware on a temporary launch tree, and compares 20 paths with the host. Red before the change: `/j: expected { dest: '/index.html' } to deeply equal { dest: '/join.html' }` (the case stops at the first fault; `/j/` and `/join.html` also differed in the old preview).
- Test 3 (`tools/ios-app.test.ts`): the Swift pattern equals the host route as text. The `/j` difference stays, with its reason.
- Test 4 (`tools/service-worker.test.ts`): the launch worker gives its offline page for a navigation exactly where the host pattern matches, on 13 paths.
- Test 5 (`tools/platform.test.ts`): `parseAccountRoute` gives a route only where the host gives `index.html` or `join.html`; `launchRoute` gives home exactly where the host gives `next.html` with no 404. The test loads `src/interface/platform.ts` through a path in a variable: a static import puts the whole board (its dynamic import of `play/main`) into the tools type check, and that check fails on files of `src/` (`never[]` with `noImplicitAny` off).
- Red: `KINGDOWN_TEST_FILE="tools/{plugin-server-build,ios-app,service-worker,platform}.test.ts" npm test`, with the type check: 1 failed (test 2), 269 passed, 4.8 s of tests.
- Green: `KINGDOWN_TEST_FILE="tools/{plugin-server-build,ios-app,service-worker,platform,offline-build,dev-settings}.test.ts" npm test`, with the type check: 6 files, 341 tests passed, 4.8 s of tests (31 s in all). `offline-build` loads the config from its file; `dev-settings` imports it.
- Test 1 before the change: no log of the first build shows it. Probe (temporary, not committed): `tools/plugin-server-build.mjs` and `vite.config.ts` taken from de9ddec20, the commit before this ticket; `KINGDOWN_TEST_NO_TYPECHECK=1 KINGDOWN_TEST_FILE=tools/plugin-server-build.test.ts npm test` (with `tools/ios-app.test.ts` in the same run): test 1 and the join page text are green; test 2 is red with the same `/j` line as above. The files are back to HEAD.
- `git diff origin/main -- tools/plugin-server-build.mjs` shows only `JOIN_PAGE`: the body of `vercelRoutes` does not change.
- Cost: `vite.config.ts` now imports `tools/plugin-server-build.mjs`. That file and its imports are now in the import graph of the config, so a local `npm run test:changed` runs the full suite when one of them changes.
- Final run on head f68ec5c9a: `npm run test:changed`, with the type checks. It ran the full suite: 430 files, 411 passed and 19 skipped; 8119 tests passed and 387 skipped; the node tests 115 passed; 610 s of tests (622 s in all). An earlier run on this head had no home folder and could not stop Chromium, so it is void.
- Not verified: `npm run check:vercel` on a launch tree (no launch tree was built); a real `vite preview` of a launch tree in a browser.

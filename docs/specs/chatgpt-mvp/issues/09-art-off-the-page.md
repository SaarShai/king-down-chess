# 09 · Art off the page

Status: resolved
Type: AFK
Size: M
Blocked by: none

## Scope

- The plugin build stops inlining images. It copies the board art (piece sheets, king sheets, the stone board, the effect masks) and the UI art to hashed file names in the plugin's static output, served from the plugin origin, with long cache headers.
- The page's CSP lists the plugin origin in `_meta.ui.csp.resourceDomains` and in the legacy `openai/widgetCSP.resource_domains`.
- The website build does not change (the shared board code keeps its imports; the plugin build rewrites them).
- The local harness and the HTTP check serve the same files.

## Acceptance

- The page payload falls below 1,000,000 bytes; record the number.
- `npm run plugin:build`, `plugin:server:check`, `plugin:smoke`, `check:vercel`, `check:browser plugin-ui plugin-ui-http` pass; the board draws every piece and king (screenshot in the check output).
- The website build output is byte-identical in its asset list (`npm run build`).

## Notes

- Explorer note E §2, §9; note F §8 (CSP). The size gate: `tools/plugin-ui-build.mjs`.
- A real-host check of the CSP (ChatGPT web and iPhone) is part of ticket 19.

## Result

Branch `claude/mvp-09-art`.

- The plugin build (`tools/plugin-ui-build.mjs`) writes the 20 art files (11 pieces, 6 kings, the stone board, 2 effect masks) to `plugin-art/` with hashed names. The page names each file by an absolute URL on a placeholder origin. The server (`src/plugin/server.ts`) puts its public origin in place of the placeholder before it hashes the page URI. The scene reads its art into canvases, so each image loads in the `anonymous` CORS mode: first by a text rewrite in the plugin build, since the review by `crossOrigin` at the five image sites of the shared scene code (review finding 2).
- The standalone server serves `/plugin-art/<file>`. On Vercel, the files are static, and a route adds the headers. The headers: `Cache-Control: public, max-age=31536000, immutable`, `Access-Control-Allow-Origin: *`, `Cross-Origin-Resource-Policy: cross-origin`.
- The resource `_meta` lists the origin in `ui.csp.resourceDomains` and in `openai/widgetCSP.resource_domains`.
- The build refuses a page with an inline image or a payload above 1,000,000 bytes.
- The local harness serves the same files from its own origin. The local host now attaches its bridge before the frame loads, because the frame's load event waits for the art.

Page size: before 4,346,704 bytes HTML (payload 4,347,892); after 430,906 bytes HTML (payload 432,094). The art files total 2.8 MB, outside the page.

Checks:
- `npm test`: 2,001 passed, 56 skipped (126 files); node tests 50 passed. One earlier run had one timeout in `src/rules/power-fixes.test.ts` under load; the rerun passed.
- `npm run test:docs`: passed.
- `npm run plugin:build`, `plugin:smoke`, `plugin:check:protocol`: passed.
- `npm run plugin:server:check`: passed (resource 432,221 JSON bytes; all 20 art files load cross-origin with the headers; a missing or escaped name gets 404).
- `npm run build:vercel` and `check:vercel`: passed (20 art files in the static tree, served with the route headers).
- `npm run check:browser plugin-ui plugin-ui-http`: both passed. Each check loads every art file into a canvas. The screenshots `board-art-fixture.png` and `board-art-http.png` show the full board with all pieces and both kings.
- `npm run build`: all 213 output files are byte-identical before and after (SHA-256).

Open item: ticket 19 checks the CSP and the CORS art in the real hosts (ChatGPT web and iPhone).

## Review

A reader that did not write the diff reviewed `634f5690...claude/mvp-09-art` (no must-fix). The merger checked each finding against the code and fixed it in the integration branch after the merge.

1. Should-fix: "the board draws every piece and king" had no real check; the board drew only the fixed army (2 of 6 kings, no knight, bishop or beast). Correct. Fix: the harness seeds two positions with each of three king pairs (Spirit/Shadow, Frost/Flame, Stratus/Mud). The gallery (`rnbqkalg/msoppppp/8/8/8/8/MSOPPPPP/RNBQKALG`) holds every piece type of both colours; "apart" puts the kings and two pawns on other squares. The browser check (`tools/plugin-ui-check.mjs`, fixture and HTTP) reads the centre of each of the 32 gallery squares on the board canvas and asserts that each one differs from the same square of the "apart" board, for each pair, so all 6 kings and all 11 piece sheets must draw. It saves `board-gallery-<pair>-<mode>.png`.
2. Should-fix: the CORS mode came from a text rewrite of `new Image()` in the plugin build, which a new image site in another form would miss with no error. Correct. Fix: the shared scene code sets `crossOrigin = 'anonymous'` at its five image sites (`scene.mjs`: a `corsImage()` helper for the piece sheets, the king sheets, the board and Workshop figures; `king-effects.mjs`: the effect masks), and the build has no rewrite. The website loads its art from its own origin, where a CORS request works as before. Test: the gallery check above draws every sheet from the plugin origin on a canvas that the check reads; a sheet without CORS would make `getImageData` throw.
3. Nit: the art route serves only `.webp`. Correct, not changed now. Ticket 11's acceptance now says the route also serves the fonts (`woff2`) and the other planned types, and the server check counts them.
4. Nit: each HTTP request made a server that ran the origin swap and the SHA-256 over the 430 KB page again. Correct. Fix: `boardPage` in `src/plugin/server.ts` keeps the last page, origin, swapped page and URI, so the work runs once for each page and origin. No test: the result is the same; `src/plugin/server.test.ts` still checks the swap, the URI and both CSP forms.
5. Nit: two quick Remount clicks could leave an old bridge open in the harness. Correct. Fix: `tools/plugin-ui-host.ts` chains the mounts (`mounting = mounting.then(mount)`). The browser check's Remount steps cover it.

Checks after the three merges (04, 03, 09) and all review fixes, on `claude/chatgpt-mvp`:
- `npm test` with the disposable database `kingdown_mvpmerge_test`: 135 files, 2,116 passed, 8 skipped; node tests 50 passed. `npm run test:docs`: 110 passed.
- `npm run plugin:build`: passed; new engine `a6f9ebec…` (see ticket 03). `npm run plugin:server:check`: passed (resource 437,582 JSON bytes, 20 art files). `npm run plugin:smoke`: passed (2 archived engines).
- `npm run check:browser plugin-ui plugin-ui-http`: both passed, with the gallery check for the three king pairs. A first run failed the fixture check on pair 2 with "least change 0.0": the check read the canvas before the scene drew the synced board. The check now waits two animation frames before each read; then both passed. That failure also shows that the check fails when a square draws nothing new.
- Page size: 436,267 bytes HTML, payload 437,455 bytes (ticket 09 before the review: 430,906 and 432,094; the growth is the main fold-in and tickets 03 and 04).
- `npm run build` (the website): passed. Against the build of `70f3ef72` (before this merge), 176 of 182 output files are byte-identical. The 6 that differ are the 4 script chunks that hold the scene code (`index`, `main`, `king-sheets`, `title-kings`; `title-kings` differs only in the names of the chunks it imports), `index.html` and `sw.js` (their chunk names and the cache version). The images, styles and fonts do not change.
- Website browser checks: `painted-game`, `king-effects` and `workshop-cast` passed. `game-screen` fails at `tools/verify-game-screen.mjs:37` (a 30 s wait for the board label "a"); it fails the same way on `70f3ef72`, before ticket 09 and the CORS change, so it is not from this work.

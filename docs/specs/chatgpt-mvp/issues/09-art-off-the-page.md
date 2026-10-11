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

- The plugin build (`tools/plugin-ui-build.mjs`) writes the 20 art files (11 pieces, 6 kings, the stone board, 2 effect masks) to `plugin-art/` with hashed names. The page names each file by an absolute URL on a placeholder origin. The server (`src/plugin/server.ts`) puts its public origin in place of the placeholder before it hashes the page URI. The build also gives each `new Image()` the `anonymous` CORS mode, because the scene reads its art into canvases. The shared board code does not change.
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

# 11 · The app page: router, home card, settings, handle

Status: in-progress
Type: AFK
Size: L
Blocked by: 02 (the owner's yes), 09, 10

## Scope

- One page with a router (screens in widget state: screen, open sheet, board ID, pending command). Every mount reads the server first.
- The inline home card: Play and Your games (at most 2 actions); Play asks the host for fullscreen.
- Fullscreen frame: the approved sample's header and navigation (Play, Your games, Profile, Settings); one layout from 360 px to desktop and the side panel; host context for safe areas, theme and touch; the main controls away from the composer.
- Play menu: Computer, Friend, Random, Join with a code.
- Settings: Symbols only (draw each piece with its `public/ui/icons` symbol on the board) and Show threats (fill the board's threat marks from `threatsIn`; on main after `claude/game-marks` merges, else the current marks).
- The handle and picture screen, shown when a tool answers `HANDLE_NEEDED`.

## Acceptance

- `check:browser plugin-ui` extended: the home card, the move to fullscreen, each screen at 390 × 844 and 1440 × 900 with no horizontal scroll; Symbols only and Show threats on the board; a remount returns to the same screen.
- Page size recorded.
- The plugin art route also serves the game's fonts (`woff2`) and every other file type the page plans (PNG, SVG), with the right content type, on the standalone server, the local harness and Vercel; `plugin:server:check` counts each type, not only `.webp` (review of ticket 09, finding 3).

## Notes

- Follows the approved sample (ticket 02). Explorer note F §3, §4, §13.

## Part 1 plan

1. Keep page state and tool calls in one small client. Check saved screen and command recovery.
2. Add the home card, frame, Play, Settings and name screen from the approved sample. Keep the board's read and retry paths.
3. Serve hashed fonts, PNG and SVG with the right headers in each local build path.
4. Check each screen at phone and desktop size. Check board settings and remount. Run all browser checks and record page size.

Checks: red and green tests through `npm test`; the page seam through `plugin-ui` and `plugin-ui-http`; the compiled art route through `plugin:server:check` and `check:vercel`. Use the local `kingdown_mvp11_test` database. Ticket 10's server tools stay out of this part.

## Part 1 result

The page has the home card, fullscreen frame, Play, Your games, Settings, and name and picture screens. One client stores the screen, sheet, board ID and pending command. A remount reads the server and keeps the screen. The page uses the game's styles, fonts and art. The board uses PaintedView and the shared marks. Symbols only uses the game's SVG symbols. Show threats shows threats to your side, also while the other side moves. Profile has its route; ticket 14 builds its content.

The branch starts at `b02de05`, the local integration tip at the start of this part. Red checks catch the local settings call, an old read that changes a new board ID, a launch with no saved screen, and pictures that do not fit. The checks pass after each fix.

Checks before the integration merge:

- `npm test`: 2,189 tests pass in 139 files; 8 skip. The art tests pass 50 of 50. The type check passes.
- `npm run check:browser plugin-ui plugin-ui-http`: 2 of 2 pass. Each screen fits 360, 390, 400 and 1440 px. All 17 pictures fit. The checks cover fullscreen, host safe areas, theme and touch, both board settings, both seats, the saved screen, command retry and game changes.
- `npm run check:browser`: 24 of 24 pass.
- `npm run plugin:build` and `npm run plugin:server:check`: pass. All 79 art files have the right content type: 50 WebP, 1 PNG, 24 SVG and 4 woff2. The HTTP and PostgreSQL checks pass.
- `npm run build:vercel` and `npm run check:vercel`: pass. The local build serves the site, plugin and all 79 art files.
- Page size: 502,251 HTML bytes; 503,760 JSON bytes for the server resource. The page stays below the 1 MB build limit.

These items wait for ticket 10:

- The real `kingdown_open` screen and game contract, home with no game, and the page's fullscreen, side-panel and sidebar metadata.
- The server's private `me`, settings and games fields. The games list must use `_meta.games` when that field exists.
- Account reads and writes through `kingdown_settings`. Part 1 keeps the two board values in private widget state through the client.
- Account reads and writes through `kingdown_handle`, with real `HANDLE_NEEDED` replies and name errors. The local host checks the form and the return to the pending action.
- The new create and join contracts (`kind`, options, level and code), and the real `kingdown_find` and profile tools. The page sends the spec's calls now. The test host maps create, join and open to the old server contract; remove that test adapter when ticket 10 merges.

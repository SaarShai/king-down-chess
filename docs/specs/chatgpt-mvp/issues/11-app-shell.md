# 11 · The app page: router, home card, settings, handle

Status: in-progress
Type: AFK
Size: L
Blocked by: 02 (the owner's yes), 09, 10

## Scope

- One page with a router (screens in widget state: screen, open sheet, board ID, pending command). Every mount reads the server first.
- The inline home card: Play and Your games (at most 2 actions); Play asks the host for fullscreen.
- Fullscreen frame: the game's page sheet and the approved sample's Play rows; one layout from 360 px to desktop and the side panel; host context for safe areas, theme and touch; the main controls away from the composer.
- Play menu: Computer, Friend, Random, Join with a code.
- Settings: Symbols only (draw each piece with its `public/ui/icons` symbol on the board) and Show threats (fill the board's threat marks from `threatsIn`; on main after `claude/game-marks` merges, else the current marks).
- The handle and picture screen, shown when a tool answers `HANDLE_NEEDED`.

## Part 2: the shared base (orchestrator, 2026-10-11)

A cross-ticket audit of the briefs for 12 to 16 (2026-10-11) found that those tickets would build the same parts at the same time. Part 2 builds them once, after part 1 and before 12 to 16 start:

- One `routeView(view)` with stub routes (setup, friend, wait, lobby, seat, board, end) and one `start(kind, args)`; each screen ticket fills its own stub.
- The pure poll module `src/plugin/poll.ts`: the research §6.5 table; at the board, every 3 s while it is the opponent's turn and the opponent was seen in the last 2 minutes (owner rule).
- The whole game sprite of the sample (not the host icons) and one empty `<dialog id="over">`.
- Each shared block of `sample.css` ported once into one shared plugin CSS file.
- `art.ts` covers the card art and one plugin-only folder (the 10 badges, the scroll).
- One board module (`src/plugin/board-view.ts`): the one PaintedView, the marks and the Symbols only and Show threats settings.
- The client: a read with no board ID for background reads; `kingdown_find` and `kingdown_accept` in the one board-ID list (`kingdown_rematch` stays out); `new App(info, { availableDisplayModes: ['inline', 'fullscreen'] })`.
- One games list from `_meta.games` (turn, open and waiting rows), used by Play and by the profile scroll.
- Widget state holds only the spec's four fields: screen, open sheet, board ID, pending command. No game ID and no settings; the server holds the settings (ticket 10).

The items that need ticket 10's fields (settings and `me` from the server, the games list, the join route, home with no game) wait for its merge.

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

The page has the home card, fullscreen frame, Play, Your games, Settings, and name and picture screens. One client stores the screen, sheet, board ID and pending command. A remount reads the server and keeps the screen. The page uses the game's styles, fonts and art. The board uses PaintedView and the shared marks. Symbols only uses the game's SVG symbols. Show threats shows threats to your side, also while the other side moves. Profile has its route; ticket 16 builds its content.

The branch starts at `b02de05`, the local integration tip at the start of this part. Red checks catch the local settings call, an old read that changes a new board ID, a launch with no saved screen, and pictures that do not fit. The checks pass after each fix.

Checks before the integration merge:

- `npm test`: 2,189 tests pass in 139 files; 8 skip. The art tests pass 50 of 50. The type check passes.
- `npm run check:browser plugin-ui plugin-ui-http`: 2 of 2 pass. Each screen fits 360, 390, 400 and 1440 px. All 17 pictures fit. The checks cover fullscreen, host safe areas, theme and touch, both board settings, both seats, the saved screen, command retry and game changes.
- `npm run check:browser`: 24 of 24 pass.
- `npm run plugin:build` and `npm run plugin:server:check`: pass. All 79 art files have the right content type: 50 WebP, 1 PNG, 24 SVG and 4 woff2. The HTTP and PostgreSQL checks pass.
- `npm run build:vercel` and `npm run check:vercel`: pass. The local build serves the site, plugin and all 79 art files.
- Page size: 502,251 HTML bytes; 503,760 JSON bytes for the server resource. The page stays below the 1 MB build limit.

The local integration tip `a3386d38` merges with no conflict. After the merge, `npm test` passes 2,245 tests in 143 files, with 8 skipped, and all 50 art tests. The type check passes. Both plugin browser checks pass again (2 of 2). Both builds, the standalone server check and the local Vercel check pass again. All 79 art files pass; page size stays the same. The ticket keeps the Part 2 plan from the integration branch.

These items wait for ticket 10:

- The real `kingdown_open` screen and game contract, home with no game, and the page's fullscreen, side-panel and sidebar metadata.
- The server's private `me`, settings and games fields. The games list must use `_meta.games` when that field exists.
- Account reads and writes through `kingdown_settings`. Part 1 keeps the two board values in private widget state through the client.
- Account reads and writes through `kingdown_handle`, with real `HANDLE_NEEDED` replies and name errors. The local host checks the form and the return to the pending action.
- The new create and join contracts (`kind`, options, level and code), and the real `kingdown_find` and profile tools. The page sends the spec's calls now. The test host maps create, join and open to the old server contract; remove that test adapter when ticket 10 merges.

## This round plan

1. Remove the extra title and tabs. Use the Play rows and the game's sheet back control. Check row order and back with no tool call. Commit the owner's look fix.
2. Keep the pending action through handle Save and retry. Save only screen, sheet, board ID and pending. Fix the symbol preview. Check control access, each piece symbol and both seats' threat squares. Commit the review fixes.
3. Build step A: the client, router, route stubs, poll and runner, sprite, dialog, shared CSS, art paths and board module. Keep the screen bodies empty. Test each new public seam before its code.
4. Run all browser checks, both plugin checks and the server check. Record counts and page size. Keep this ticket in progress. Merge the local integration tip, run npm test and push. Step B waits for ticket 10.

Checks use kingdown_mvp11_test on 127.0.0.1:55432. The approved sample sets the look. The host rules set only the limits. No website or server file changes belong to this round.

## Owner look fix result

The page has no extra title or tabs. Play holds the sample's rows in its order. Each other screen has the game's sheet back control. Handle returns to Settings, or Play for a pending start. Back changes page state and sends no tool call.

The browser test fails with the extra title, then passes after the fix. `npm run check:browser plugin-ui` passes 1 of 1. It covers 360, 390, 400 and 1440 px, back with no tool call, and the board's existing move and recovery checks. Step A removes the old games route.

## Review fixes result

Save keeps the pending action until that action succeeds. Retry is in the shared sheet area, so a failed start and a remount can reach it. Widget state has only screen, sheet, board ID and pending. The model context has no game ID. Settings stay in page memory until step B. The move preview uses the same symbol as the piece, at half opacity.

Red tests catch the lost action, the extra saved fields and the painted preview path. `npm test` passes 2,246 tests in 143 files, with 8 skipped; all 50 art tests pass. The type check passes. The Save failure and remount browser check passes 1 of 1.

The browser checks now test each control's scroll access and bounds with safe insets and the 96/128 px gap, the board at all four widths, each piece against its source SVG, each threat arrow against threatsIn for both seats, and the symbol preview. The stronger fixture and HTTP checks pass the control and threat checks. The expected symbol map needs L for Paladin and S for Beast; the test now uses that map. The full rerun follows step A, when the shared browser slot is free.


## Part 2 result (step A)

Step A is complete. The ticket stays in progress. The shared base uses the approved sample and the game's tokens, fonts, components and art. Play opens setup with the solo or friend kind, lobby for random, and join with the code. Kind and code stay in page memory. Each other page has one sheet back control.

The screen tickets use these exports and files:

- `src/plugin/app.ts`: `routeView(view)`, `start(kind, args, { route: false })`, `navigate`, `client`, and `memory` (kind, code, and the current view). Start keeps its result pending through handle Save or Retry. It returns the view and keeps the caller's route choice.
- `src/plugin/client.ts`: `Screen`, `SCREENS`, and `BOARD_ID_TOOLS` (get, create, join, resume, find, accept). Rematch stays out. `client.call(name, args, { background: true })` sends no board ID, keeps the binding and pending command, and leaves the board view alone. Widget state has only screen, sheet, board ID and pending. Settings stay in page memory.
- `src/plugin/poll.ts`: `PollView`, `pollDelay`, and `runPoll`. The pure delay follows the wait, Daily and live table and the owner's recent-opponent rule. The runner reads on mount and when visible, uses setTimeout, stops when hidden, and stops on teardown. Solo games do not poll.
- `src/plugin/board-view.ts`: `board`, `highlight(Highlights)`, and `setSettings`. One PaintedView draws the board. The highlight entry keeps the full marks, including swaps. This module applies both board settings.
- `src/plugin/screens/`: setup (12); friend, join, wait and lobby (13); seat (14); board and end (15); profile and collection (16). Each file has its screen function. Each new section is empty. Board keeps the old board and game checks until 15 replaces it. The games route is removed.
- `src/plugin/index.html`: the 21 game symbols and one empty `#over` dialog. The sprite omits the host icons.
- `src/plugin/app.css`: the shared frame and page sheet, over sheet and scrim, menu rows, portraits and feature marks, fields, card faces, table and coin rules, and base dialog rule. Wide rules use a 900 px media query. The frame reserves 96 px on a phone and 128 px on a wide screen, plus safe insets.
- `src/plugin/art.ts`: the existing game art, `public/ui/cards/*.webp`, and `src/plugin/assets/`. The new folder holds all 10 badges and scroll.webp with their sample names. Each screen uses `art()`.

Red tests catch the absent background option, router, start, poll policy, runner, and pending start result. The tests pass after each change. The final checks before the late ticket 10 integration merge pass:

- `npm test`: 2,252 tests pass in 145 files; 8 skip. All 50 art tests and the type check pass.
- `npm run check:browser`: 24 of 24 pass with the final code.
- `npm run check:browser plugin-ui plugin-ui-http`: 2 of 2 pass after the full run. The checks cover all 14 route remounts at 390 x 844, 400 x 900 and 1440 x 900; four widget fields; background calls; symbols, dialog and art; safe control and scroll access; each piece's source SVG and preview; each threat arrow's squares for both seats. Haste, Archer and Freeze still pass.
- `npm run plugin:build` and `npm run plugin:server:check`: pass. All 101 art files load with the right type: 72 WebP, 1 PNG, 24 SVG and 4 woff2. The HTTP and PostgreSQL check passes on kingdown_mvp11_test.
- Page size: 515,431 HTML bytes; 517,074 JSON bytes in the standalone server check.

Step B stays out of this round. It adds the server settings and me, the shared games list, and the new join and home tool paths. Ticket 10 reaches the local integration branch after these checks. The integration merge and its test result follow below.


### Integration merge

The branch merges the local integration tip 9793db1f. The merge keeps ticket 10's code invitation and empty-FEN guard. The owner’s Play navigation and the shared stubs take the place of the old forced Create controls. The harness sends the new tool inputs and uses the real handle tool. It keeps the tool-surface lobby, rematch and empty-FEN switch checks.

The checks catch two reads during mount, two composer gaps, a shaft end outside the target square on a small board, and names reserved by an earlier test. Mount now reads once after the initial tool result. The page alone reserves the composer gap. The arrow check uses its start and arrowhead tip. Each check run uses one new handle and reuses it for Save and Retry.

After this merge, npm test passes 2,279 tests in 148 files, with 8 skipped. All 50 art tests and the type check pass. Both plugin browser checks pass (2 of 2). The rebuilt server check passes. All 101 art files pass. Page size is 516,016 HTML bytes and 517,789 JSON bytes. The full 24-check browser run above precedes the late integration merge; the named plugin checks also pass after it.

Ticket 10 is now merged. Step B stays open and has no new build in this round. A later integration tip has the database-clock and Abort-deadline fixes; its merge result follows.

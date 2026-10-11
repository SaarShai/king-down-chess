# 11 · The app page: router, home card, settings, handle

Status: ready-for-agent
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

## Part 2: the shared base (orchestrator, 2026-10-11)

A cross-ticket audit of the briefs for 12 to 16 (2026-10-11) found that those tickets would build the same parts at the same time. Part 2 builds them once, after part 1 and before 12 to 16 start:

- One `routeView(view)` with stub routes (setup, friend, wait, lobby, seat, board, end) and one `start(kind, args)`; each screen ticket fills its own stub.
- The pure poll module `src/plugin/poll.ts`: the research §6.5 table; at the board, every 3 s while it is the opponent's turn and the opponent was seen in the last 2 minutes (owner answer pending).
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

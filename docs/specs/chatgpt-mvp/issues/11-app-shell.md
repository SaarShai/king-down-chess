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

## Acceptance

- `check:browser plugin-ui` extended: the home card, the move to fullscreen, each screen at 390 × 844 and 1440 × 900 with no horizontal scroll; Symbols only and Show threats on the board; a remount returns to the same screen.
- Page size recorded.
- The plugin art route also serves the game's fonts (`woff2`) and every other file type the page plans (PNG, SVG), with the right content type, on the standalone server, the local harness and Vercel; `plugin:server:check` counts each type, not only `.webp` (review of ticket 09, finding 3).

## Notes

- Follows the approved sample (ticket 02). Explorer note F §3, §4, §13.

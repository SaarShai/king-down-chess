# 21 · iPhone test: board size and the Play menu

Status: in-progress
Type: AFK
Size: S
Blocked by: none

## Problem

The owner's first iPhone test in the ChatGPT iOS app (2026-10-15) found these issues:

1. The Play menu has three rows (Computer, A friend, A random player). The New game screen has the same three choices, so the rows are not necessary.
2. "A random player" in the Play menu opens the open-games list. "A random player" on the New game screen, then Start, finds an opponent at once. The same words open two different screens.
3. In the seat setup and on the board, the board is very small (about 45 pt).

Measurements from the owner's screenshot (393 × 852 pt): the table is 349 pt tall and centred in a screen of about 570 pt. Its rows use 305 pt (56 + 56 + 77 + 48 + 68), which leaves 45 pt for the board. So the table took its content height, not the height of its screen.

No test browser shows this. The same build fills the screen in Chromium, in Playwright WebKit and in Safari in the iOS 27 Simulator (seat table 542 px in a 594 px frame, board 222 px). The theory that stale `dvh` units cause it is wrong: `.frame #game-table { height: 100% }` (ticket 11) already overrides the website's `100dvh`. The cause is in the ChatGPT iOS host, and the data to name it must come from the device.

## Scope

- The seat and the board screens place the table by position (`inset: 0` in the screen), with no percentage and no viewport unit.
- The setup sheet (`#menu-sheet`) keeps the plugin's over-sheet height limits, not the website's `dvh` limit.
- A "Display check" line in Settings shows the sizes of the last seat or board screen (window, viewport units, frame, screen, table, board, safe area, display mode, the sizes the app sent to the host). Remove it when this ticket closes.
- The Play menu: one "New game" row opens the New game screen with the last choice of opponent. One "Open games" row opens the list of other players' open games. "A random player" appears only on the New game screen.
- No server change.

## Acceptance

- With viewport units at a wrong height (350 px), the seat and the board tables fill their screen, and the board fills its row (`tools/plugin-ios-size.test.ts`).
- The Play menu shows New game, Open games, Join with a code, Your games, Profile and Settings.
- On the owner's iPhone, the seat and the board fill the screen, or the Display check line names the cause.
- `npm test` passes; the plugin-ui browser check passes on the M1.

## Plan

1. [x] Measure the screenshot; test the built page in Chromium, WebKit and the iOS Simulator.
2. [x] Place the table by position; keep the over-sheet limits; add the Display check line.
3. [x] Change the Play menu; update the spec (Q4, the Play line, story 4) and the browser checks.
4. [ ] Run `npm test` and the M1 checks. Open a PR to main.
5. [ ] After the release, the owner checks the iPhone. If the board is still small, read the Display check line and fix the cause.

## Checks

- 2026-10-15, Chromium 393 × 760, built page: seat table = screen, board 265 px (row-limited).
- 2026-10-15, iOS 27 Simulator Safari, built page in the local host: seat 402 × 542 table, board 222 px; the same before and after the change.

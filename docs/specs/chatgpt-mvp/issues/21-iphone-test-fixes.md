# 21 · iPhone test: board size and the Play menu

Status: in-progress
Type: AFK
Size: S
Blocked by: none

## Problem

The owner's first iPhone test in the ChatGPT iOS app (2026-10-15) found these issues:

1. The Play menu has three rows (Computer, A friend, A random player). The New game screen has the same three choices, so the rows are not necessary.
2. "A random player" in the Play menu opens the open-games list. "A random player" on the New game screen, then Start, finds an opponent at once. The same words open two different screens.
3. "Join with a code: is that temporary? Can the published game work with no code?" Answer: the code stays; it is the decided friend invite (spec Q28, owner 2026-10-11). ChatGPT has no link that opens a game in a plugin, so the code names the game. The friend does not have to type it: they can say "Join King Down game K7QX2M" in ChatGPT. An invite with no code (by player name, or a rematch with a past opponent, with invites shown in Your games) is a possible later feature; it is not in this ticket.
4. In the seat setup and on the board, the board is very small (about 45 pt).

Measurements from the owner's screenshot (393 × 852 pt): the table is 349 pt tall and centred in a screen of about 570 pt. Its rows use 305 pt (56 + 56 + 77 + 48 + 68), which leaves 45 pt for the board. So the table took its content height, not the height of its screen.

No test browser shows this. The same build fills the screen in Chromium, in Playwright WebKit and in Safari in the iOS 27 Simulator (seat table 542 px in a 594 px frame, board 222 px). The theory that stale `dvh` units cause it is wrong: `.frame #game-table { height: 100% }` (ticket 11) already overrides the website's `100dvh`. The cause is in the ChatGPT iOS host, and the data to name it must come from the device.

## Scope

- The seat and the board screens place the table by position (`inset: 0` in the screen), with no percentage and no viewport unit.
- The setup sheet (`#menu-sheet`) keeps the plugin's over-sheet height limits, not the website's `dvh` limit.
- A "Display check" line in Settings keeps the sizes of the last seat or board screen (window, viewport units, frame, screen, table, board, safe area, display mode, the sizes the app sent to the host). The line stays hidden, because players read it as debug text (UX review U4). To show it on a phone with no developer tools, open a game, then Menu → Settings, and press the "Settings" title for about 600 ms. Remove the line and the long press when this ticket closes.
- The Play menu: one "New game" row opens the New game screen with the last choice of opponent. One "Open games" row opens the list of other players' open games. "A random player" appears only on the New game screen.
- New game keeps the player's pick of opponent for the session. The saved choice sets it only at the first New game.
- QA move history: a full read adds the public initial position and all moves. Storage and rules stay the same.

## Acceptance

- With viewport units at a wrong height (350 px), the seat and the board tables fill their screen, and the board fills its row (`tools/plugin-ios-size.test.ts`).
- The Play menu shows New game, Open games, Join with a code, Your games, Profile and Settings.
- A pick of "A friend" on New game stays after Back, Open games and New game (`tools/plugin-app.test.ts`).
- On the owner's iPhone, the seat and the board fill the screen, or the Display check line names the cause.
- `npm test` passes; the plugin-ui browser check passes on the M1.

## Plan

1. [x] Measure the screenshot; test the built page in Chromium, WebKit and the iOS Simulator.
2. [x] Place the table by position; keep the over-sheet limits; add the Display check line.
3. [x] Change the Play menu; update the spec (Q4, the Play line, story 4) and the browser checks.
4. [ ] Run `npm test` and the M1 checks. Open a PR to main.
5. [ ] After the release, the owner checks the iPhone. If the board is still small, show the Display check line (a long press on the Settings title), take a screenshot, and fix the cause.

## Checks

- 2026-10-15, Chromium 393 × 760, built page: seat table = screen, board 265 px (row-limited).
- 2026-10-15, iOS 27 Simulator Safari, built page in the local host: seat 402 × 542 table, board 222 px; the same before and after the change.

## QA fix round

The owner asks for the 13 QA fixes on 2026-10-15. The supplied QA reports are the baseline.

Plan and checks:

1. Measure the built seat, board and end screens. Shorten rows on small phones. Check 320 × 568 (180 px board), 375 × 667 (230 px board), 393 × 852 (no loss), and landscape with safe areas. Check control access and screen scroll.
2. Repair move history, draw offers, sheet focus, Settings Back and read recovery. Add tests for each flow. Read the saved game as the source of move history.
3. Repair Join, names, touch targets, words, art and game row details. Add checks for each behaviour.
4. Run typecheck, the requested plugin tests, doc checks and the built browser check. Record results and before/after measurements here. Leave all changes in the working tree.


### QA changes and evidence

All sizes use CSS px. The baseline is the source at the start of this round, built in the supplied scratch folder. The supplied reports describe older builds too. Chromium and WebKit give the same portrait measurements. Safe areas are 20/0 at 320 × 568 and 375 × 667, and 59/34 at 393 × 852 and 440 × 956. The harness uses 24 px for Remount.

| Item | Change | Before → after | Test |
| --- | --- | --- | --- |
| 1 | `src/plugin/app.css`: shorter rows below 520 px of screen height. Below 420 px, Moves opens from Menu. The veil clips to its box. | Seat and board: 320 × 568, 111 × 118 → 187 × 199; 375 × 667, 204 × 218 → 239 × 255; 393 × 852, 309 × 330 → 309 × 330; 440 × 956, 361 × 385 → 361 × 385. | `tools/plugin-ios-size.test.ts`: short-phone matrix and veil bounds. |
| 2 | `src/plugin/app.css`: the side panel scrolls. `app.ts` and `seat.ts`: reset page scroll and retain focus without a page scroll. | Landscape controls end at y=349, outside frame y=252 → y=241 after side scroll. With top/bottom 59/34, controls end at y=228 in frame y=239. All 16 hit tests pass in Chromium and WebKit. Board opens at scroll 0. The supplied QA records 104 px; the local baseline does not reproduce that offset. | The same matrix, plus `landscape.json` and its screenshots in scratch. |
| 3 | `src/plugin/app.css`: the end table uses its screen box. | At 375 × 667, table 696 px in screen 475 px → table and screen both 475 px. | End table bounds in the size matrix. |
| 4 | `src/match/protocol.ts`, `service.ts`, and `src/plugin/screens/board-model.ts`: full reads carry and replay all public moves. The fixture logs the computer LANs, as the server does. | Supplied QA: one of two computer-game moves, then zero after Remount → both moves, also after Remount. A separate test restores 12 moves with no recent commands. | App move history and model replay tests. |
| 5 | `src/plugin/screens/board.ts` and `src/plugin/poll.ts`: show draw state, poll an open offer each 3 seconds, and read before an action on that offer. | No offer words → offer words. Poll 30 s → 3 s. First Resign can reject after decline → first Resign succeeds, both at once and after a poll. | App draw cases and poll test. |
| 6 | `src/plugin/screens/join.ts`, `friend.ts`, and `src/plugin/index.html`: keep the code, hide the review until it exists, name features, and set keyboard attributes. The fixture validates code format and returns results only after the game ends, as the server does. | Bad code loses all 6 characters → keeps all 6. Empty review and Decline visible → hidden. Unknown code says expired → asks to check the code. Feature names visible: 0 → names in words. | Lobby code, review, portrait and input-attribute tests. |
| 7 | `src/plugin/screens/board.ts`: Escape closes the sheet and restores focus. Stable coin IDs retain focus through a strip refresh. | Sheet stays open after Escape → closed, with focus on its opener. | App keyboard test and size-test coin refresh check. |
| 8 | `src/plugin/app.ts` and `client.ts`: save the Settings return screen. | Back from game Settings opens Menu → opens the game. | App menu and Back test. |
| 9 | `src/plugin/app.css`: touch card and power targets use 44 × 44 px. | Cards 34 × 34 and powers 40 × 40 → each 44 × 44. Player row stays 44 px on short phones. | Size-test touch bounds. |
| 10 | `src/plugin/app.css`, `board.ts`, `seat.ts`, and `profile.ts`: use an ellipsis and a full-name title. | At 375 px, the 20-character name is 58 px tall in a 44 px strip → 19 px tall. Profile needs 371 px in 287 px → an ellipsis in the same 287 px box. | Long-name Profile and strip tests. |
| 11 | `end.ts`, `lobby.ts`, `seat.ts`, and shared `src/move-text.ts`: remove duplicate result words, say just opened, use Select, and name Firewall. | Game aborted twice → once. Open 0 min → just opened. Tap → Select. King b1 to b1 → Firewall protection words. | App abort, lobby time, seat matrix and Firewall model tests. |
| 12 | `app.css`, `lobby.css`, `friend.ts`, `wait.ts`, and `app.ts`: fill the computer bar, add portraits, contain art, separate the wait timer, and add Try again. | Empty bar slot 1 → 0. Blank portrait → Spirit portrait. Fan art 62 px in 52 px → 52 px. Wait art can shrink and overlap → fixed 180 px clipped box. Recovery action 0 → 1. | Size, lobby and app recovery tests. |
| 13 | `src/plugin/games-list.ts` and `screens/profile.ts`: show colour and start time in both lists. | Two rows have the same words → distinct start times and a colour. | Profile test for both lists. |

The shared move-text change is correct for the website too. The shared view change adds public move data on full reads only. It hides no data and changes no rule.

Evidence stays under the supplied `scratchpad/fix` folder: `before-measures.json`, `after-measures.json`, `after-webkit.json`, `details-before.json`, `details-after.json`, `landscape.json`, and the matching PNG files. The size test also checks stale viewport units.

The QA fix round is complete in the local host. It leaves changes in the working tree. The owner's native ChatGPT iOS check stays open.


### QA check results

- `npm run typecheck`: passes.
- The requested plugin suite: 146 pass; 20 database tests skip. The existing five-second handoff polling test times out in the full run and passes alone (1 pass, 21 other tests skip). The prior full pass has 147 passes. No requested behaviour test fails. The two draw cases also pass after the final fixture result guard (2 pass).
- `npm run test:docs`: 113 pass.
- `node tools/plugin-ui-check.mjs`: passes on the final build in the local fixture host. It checks setup, four levels, both seats, cards, draw and rematch flows, recovery, 14 route remounts, safe areas, phone input and end screens. No page error occurs. The old text checks now use Select, Just opened and the saved last move after Remount.
- `git diff --check`: passes.
- The local host, the test pages and the scratch builds use localhost only. The native ChatGPT iOS check stays with the owner. No code reaches main or the public site in this round.

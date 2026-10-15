# Plugin QA protocol

This protocol tells a QA agent how to find faults in the King Down ChatGPT plugin: bugs, errors, broken flows, bad layout, slow or unclear behaviour, and anything else that does not work well for a player. The UI and UX review has its own protocol: [plugin-ux-review-protocol.md](plugin-ux-review-protocol.md).

The expected behaviour is in [the MVP spec](../specs/chatgpt-mvp/spec.md) (stories and decisions) and [the rules](../RULES.md). The widget code is in `src/plugin/` (app.ts, index.html, screens/, the CSS files) and `src/ui/table.css`. The server tools are in `src/plugin/server.ts`.

## 1. Rules for the agent

- Do not change a file in the repository. Write only in your output folder.
- Do not use a git command that changes state (commit, push, checkout, stash, reset).
- Do not read `.secrets/`, key files or `.env` files. Do not print environment variables.
- Do not deploy. Use the network only for your own localhost harness.
- Do not stop or restart a harness or a simulator that is not yours.
- Use the iOS Simulator only when your task gives you a device. Use only that device.
- Keep at most 2 browsers open at one time. Other agents share the computer.
- Write the report in ASD-STE100 (Simplified Technical English): short sentences, active voice, present tense.

## 2. Setup

### 2.1 Build and harness

Your task can give you a harness URL. If not, start one:

1. Build the widget: `node tools/plugin-ui-build.mjs <your folder>/build`.
2. Start the harness: `npx tsx tools/plugin-ui-harness.ts <your folder>/build/board.html`. It prints `Local SDK host: <url>`.

Test the built page, not the source page: the build gives the seat its table look and the plugin its container rules.

The harness is a host page that shows the widget in an iframe, as ChatGPT does. An in-memory game server plays the tools. You are the player "alice".

### 2.2 Harness controls

On the host page (the outer window):

| Control | Use |
|---|---|
| "Remount board" button | Loads the widget again, as ChatGPT does when a chat opens again. |
| `await harnessSetContext({ displayMode, safeAreaInsets, containerDimensions })` | Sets the host context: `'inline'` or `'fullscreen'`, safe areas (iPhone: top 59, bottom 34). |
| `harnessDisplayRequests` | The display modes that the widget asked for. |
| `harnessCalls` | Every tool call from the widget, in order. |
| `harnessView`, `harnessMatchId` | The last game view and its game id. |
| `harnessWidgetState` | The state that the widget saved for the host. |
| `harnessTool({ name, arguments })` | Calls a tool as the widget does. |
| `harnessShow(result)` | Shows a tool result, as when the model calls a tool in the chat. |
| `rejectNextGet`, `rejectNextMove = '<code>'`, `failNextAction`, `requireHandleNext` | Make the next call fail. |
| `holdNext = '<tool>'` then `releaseHeld()`; `holdNextGet` then `releaseHeldGet()` | Hold a reply, to test slow replies and double taps. |
| `dropNextReply = '<tool>'`, `dropNextMoveReply` | Lose a reply after the server did the action. |
| `harnessBootDelay = <ms>` | Slows the widget start. |

HTTP endpoints of the harness:

| Endpoint | Use |
|---|---|
| `POST /fixture-friend-tool` `{ name, arguments }` | The second player "bob" calls a tool: `kingdown_join {code}`, `kingdown_find {}`, `kingdown_create {kind, colour, options}`, `kingdown_move`, `kingdown_get`, `kingdown_choose`, `kingdown_resign` and the others. Add `"fresh": true` for a third player. |
| `POST /fixture-seed` `{ actor, data }` | Seeds alice's or bob's record (`record`: totals, rating, badges) and other saved data. |
| `POST /fixture-position?case=<name>` | Opens a game at a test position: `swap`, `threats`, `threats-black`, `freeze`, `haste`, `gallery`, `apart` (with `&kings=0..2`), or the default. |
| `?terminal` on the host URL | Opens a game that is one move from its end. |

The server tools: `kingdown_open`, `create`, `find`, `lobby`, `accept`, `cancel`, `join`, `invite`, `choose`, `move`, `get`, `games`, `resume`, `computer`, `draw`, `claim`, `resign`, `abort`, `rematch`, `say`, `report`, `profile`, `settings`, `handle` (each with the `kingdown_` prefix).

### 2.3 Surfaces

Test each flow on at least one phone and one desktop. Do the layout sweep (step 13) on all of the surfaces in your task.

| Surface | Sizes (CSS px) | How |
|---|---|---|
| Phone | 320 × 568, 375 × 667, 393 × 852, 440 × 956; landscape 852 × 393 | Playwright WebKit (an iOS stand-in) and Chromium (Android), `isMobile`, `hasTouch`; iPhone safe areas by `harnessSetContext` |
| Tablet | 820 × 1180, 1180 × 820 | WebKit, `hasTouch` |
| Desktop | 1024 × 768, 1280 × 800, 1440 × 900, 1920 × 1080 | Chromium and WebKit; Firefox one time |
| ChatGPT desktop, inline | the iframe at about 760 px wide in a taller window | Set the iframe size from the host page; `displayMode: 'inline'` |
| iOS Simulator | the device in your task | Safari opens the harness URL. Drive it with the simulator tool. You cannot run JavaScript there: read the Display check line (section 4). |

Each surface in inline and in fullscreen mode. The ChatGPT apps themselves are for the owner only; the harness and the Simulator do not show every host fault.

## 3. Test sequence

Do the steps in this order. Each step names what to check. For each check, record pass or fail and the evidence.

1. **First open.** A new player opens the widget inline. Check: the home card, its words, its 2 actions at most, and the first-run name and picture flow (`requireHandleNext`).
2. **Play menu.** Check: the rows (New game, Open games, Join with a code, Your games, Profile, Settings), their words and their art, and that each row opens the correct screen. Back from each screen.
3. **New game.** For each opponent (Computer, A friend, A random player): the level (4), the colour (3), each game option (Fairy pieces and the pieces sheet, Arrangement, Classic chess, Cards and the cards sheet, King powers and the king choice). Check that an option that cannot apply is clear, that the choice stays after Back, and that Start does what the words say.
4. **Seat setup.** Arrangement (shuffle, move a piece), the king choice, Ready, and the wait for the other side. Check: the board size, the words, and what each button does.
5. **Game with the computer.** Each level one time. Select a piece, legal and illegal moves, the move marks, captures, check, cards, king powers, Show threats, Symbols only, the moves list, the menu sheet (rules, settings, resign, abort, draw), the computer's reply, and the end by checkmate (`?terminal`), resign and abort. The end card and Rematch.
6. **Friend game.** Alice makes a game: the code, Copy, a new code, Cancel. Bob joins with the code. Both choose and play. Then bob makes a game and alice joins: a good code, a bad format, an unknown code, a used or old code, her own code, and the chat words "Join King Down game XXXXXX" (`harnessShow` with a `kingdown_join` result). Preview, Join and Decline.
7. **Random player.** New game with "A random player": the wait screen, its timer, "play the computer while you wait", Cancel, and bob takes the game. Open games: the empty list, a list with bob's game, Accept, and alice's own waiting game. Find an opponent.
8. **Your games.** Rows for each state: your turn, their turn, setup, waiting, finished. Open each row. A move by bob changes the row. Two games against the same player: can you tell them apart?
9. **Profile and Collection.** The record, the rating, the provisional mark, the badges, the history (`/fixture-seed`), each Collection tab.
10. **Settings.** Each toggle, and that it stays after Remount. Name and picture: a good name, a short name, a long name (20 characters), a taken name, an emoji, spaces.
11. **Recovery.** Remount on each screen: the screen and the game come back. A slow reply and a double tap (`holdNext`). A lost reply (`dropNextReply`, `dropNextMoveReply`). A failed read (`rejectNextGet`). A rejected move (`rejectNextMove`). An action after the server changed the game (a stale revision). The opponent's move arrives by the poll.
12. **Display modes.** On each screen: inline to fullscreen and back. The widget asks for fullscreen only when it needs it. The sizes that the widget sends to the host (`sent` in the Display check line, or the size-changed messages) are not 0 in inline mode.
13. **Layout sweep.** On each surface and each screen: the board fill (section 4), no horizontal scroll, no clipped or overlapped text, tap targets of 44 px or more on touch, safe areas respected, the composer room at the bottom in fullscreen, text at 200% zoom, landscape.
14. **Keyboard and screen reader.** Tab order, a visible focus ring, Enter and Space on buttons, Escape closes a sheet, focus goes back to the button that opened the sheet. Each control has a name (role and label). Contrast of text on the parchment.
15. **Words.** Each screen: spelling, full stops, the same name for the same thing on every screen, numbers, times and dates ("open 0 min", time zones), and error words that tell the player what to do.
16. **Speed and errors.** The time to the first screen, the page size (the resource must stay under 4.4 MB), long tasks, memory after 30 moves, console errors and warnings, failed requests.
17. **Model words.** For each tool result: the text that ChatGPT reads (`content`) is short, correct, and has no private data. Error results have a code and clear words.

## 4. Measurements

- **Board fill.** In a browser you script: the board canvas (`#board canvas`) width and height, the board box (`#board`), the table (`#game-table`, or `[data-seat-id="game-table"]` on the seat), its screen (`[data-screen="seat"]` or `[data-screen="board"]`), and the frame (`#app-frame`). Record `canvas width / frame width`. The canvas must equal `min(board width, board height × 960 / 1024)`, and the table must fill its screen.
- **Display check line.** Play → Settings shows the sizes of the last seat or board screen: window, visual viewport, vh and dvh, frame, screen, table, board, canvas, safe areas, display mode, and the sizes sent to the host. Open the seat or the board, wait 2 s, then open Settings and read the line. This is the only measure in Simulator Safari.
- **Touch targets.** The bounding box of each control.
- **Times.** From the click to the next stable screen.

## 5. Severity

| Severity | Meaning |
|---|---|
| Blocker | A player cannot play, loses a game or data, or sees private data. |
| Major | A main flow fails or is very hard; the board is too small to play; a wrong result. |
| Minor | A flow works but is confusing, slow or wrong in a detail. |
| Polish | Small visual or word faults. |

## 6. Evidence rules

- Reproduce each finding 2 times before you report it. Give the exact steps from a fresh page.
- Give a screenshot or a measurement for each finding. Put the files in your output folder.
- Separate product faults from harness faults. Examples of harness faults: a missing viewport tag on the host page, a Simulator page zoom, the harness that grants each fullscreen request. Report harness faults in their own section.
- Mark a guess as a guess. Do not report what you did not see.
- Give the likely cause (`file:line`) when you can find it. Do not fix it.

## 7. Report

Write `report.md` in your output folder. If you cannot write it, put the full report in your final message.

1. One line: the result.
2. Surfaces and sizes that you tested.
3. Findings, most severe first. For each: severity, surface (device or browser, size, inline or fullscreen), steps, expected, actual, evidence (file names and measurements), likely cause.
4. Harness or tool faults.
5. Checks that passed (the step numbers of section 3).
6. What you could not test, and why.

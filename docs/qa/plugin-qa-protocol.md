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

1. Build the widget: `node tools/plugin-ui-build.mjs <your folder>/build`. Record the payload bytes that it prints.
2. Start the harness: `npx tsx tools/plugin-ui-harness.ts <your folder>/build/board.html`. It prints `Local SDK host: <url>`.

Test the built page, not the source page: the build gives the seat its table look and the plugin its container rules.

The harness is a host page that shows the widget in an iframe, as ChatGPT does. An in-memory game server (the fixture) plays the tools. You are the player "alice".

The fixture is not the real service:

- It has no time limits: no 3-day move or setup limit, no 24-hour open game and no 7-day code. It has no limit on code tries, no rating or badge updates and no "players online" count.
- Its computer replies in at most 250 ms. The real service thinks for up to 2.5 s (`src/match/service.ts`).
- At start, alice, bob and the third player already have names. There is no true first-run player.

Make these states with seeds, `harnessNextView` or `holdNext = 'kingdown_computer'`. If you cannot make a state, list it under "could not test". Do not report a pass for a state that the fixture cannot make.

### 2.2 Harness controls

On the host page (the outer window):

| Control | Use |
|---|---|
| "Remount board" button | Loads the widget again, as ChatGPT does when a chat opens again. |
| `await harnessSetContext({ displayMode, safeAreaInsets, containerDimensions, deviceCapabilities, theme, availableDisplayModes })` | Sets the host context: `'inline'` or `'fullscreen'`; safe areas (iPhone: top 59, bottom 34; iPhone SE: top 20, bottom 0); `deviceCapabilities: { touch: true }` on each touch surface (the 44 px tap rule applies only then; Playwright `hasTouch` does not set it); `theme: 'dark'` for the dark pass. Give the full context in each call: a Remount uses only the object from the last call. |
| `harnessDisplayRequests` | The display modes that the widget asked for. The harness grants each request, except: `holdDisplayNext = true` holds the next request until `releaseDisplay()`, and `denyDisplayNext = true` refuses it. |
| `harnessCalls` | Every tool call from the widget, in order. |
| `harnessView`, `harnessMatchId` | The last game view and its game id. |
| `harnessWidgetState`, `harnessWidgetStates` | The last state that the widget saved for the host, and every write in order. |
| `harnessTool({ name, arguments })` | Calls a tool as the widget does. |
| `harnessShow(result)` | Shows a tool result, as when the model calls a tool in the chat. |
| `harnessNextView = <view>` | The next `kingdown_get` returns this view (a later `server_now`, a finished game, an opponent seen at a given time). |
| `harnessWithoutWidgetState = true`, then Remount | A host with no saved widget state. |
| `harnessDropWidgetWrites = true` | The host loses each widget-state write. |
| `harnessTeardown()` | The host closes the widget. |
| `rejectNextGet`, `rejectNextMove = '<code>'`, `requireHandleNext`, `failActionAfterHandle` | Make the next call fail. `rejectNextMove` takes an error code: test one code from the list in `src/plugin/app.ts` (the move rolls back) and `INTERNAL_ERROR` (Retry shows). `requireHandleNext` changes only the next `kingdown_create`: use it with "A friend". With `failActionAfterHandle`, the action after Save fails. |
| `holdNext = '<tool>'` then `releaseHeld()`; `holdNextGet` then `releaseHeldGet()` | Hold a reply, to test slow replies and double taps. |
| `dropNextReply = '<tool>'`, `dropNextMoveReply` | Lose a reply after the server did the action. |
| `harnessBootDelay = <ms>` | Slows the widget start. |

HTTP endpoints of the harness:

| Endpoint | Use |
|---|---|
| `POST /fixture-friend-tool` `{ name, arguments }` | The second player "bob" calls a tool. For a random game, use `kingdown_create {kind: 'random'}` (`kingdown_find` needs a full `options` object). Also `kingdown_join {code}`, `kingdown_create {kind: 'friend'}`, `kingdown_invite {game_id}`, `kingdown_move`, `kingdown_get`, `kingdown_choose`, `kingdown_draw`, `kingdown_resign`, `kingdown_abort`, `kingdown_rematch` and the others. Add `"fresh": true` for a third player. |
| `POST /fixture-tool` `{ name, arguments }` | Alice calls a tool as the model does in the chat (no `command_id`, no `board_id`; not in `harnessCalls`). Show a `kingdown_open` result with `harnessShow(result)`. |
| `POST /fixture-seed` `{ actor, data }` | Seeds alice's or bob's saved data: `record` (totals, rating, badges), `history`, `games`, `views` (for example a past `deadline_at`, or an `outcome` for the end card). Each call replaces all earlier seed data for that player: send all keys in one call. |
| `POST /fixture-position?case=<name>` | Makes a game at a test position (`swap`, `threats`, `threats-black`, `freeze`, `haste`, `gallery`, `apart`, or the default; `&kings=0..2` for `gallery` and `apart`; or `?fen=<FEN>`, with `&black=1` for a game as Black against bob) and returns the `kingdown_open` result as JSON. Give it to `harnessShow(result)`. |
| `POST /fixture-delete-match` `{ game_id }` | Deletes a game, as when the service removes it. |
| `?terminal` on the host URL | Opens a computer game that is already in checkmate. It tests the end screen, not the move that ends a game. |

The server tools: `kingdown_open`, `create`, `find`, `lobby`, `accept`, `cancel`, `join`, `invite`, `choose`, `move`, `get`, `seen`, `games`, `resume`, `computer`, `draw`, `claim`, `resign`, `abort`, `rematch`, `say`, `report`, `profile`, `settings`, `handle` (each with the `kingdown_` prefix).

### 2.3 Surfaces

| Surface | Sizes (CSS px) | How |
|---|---|---|
| Phone | 320 × 568, 375 × 667, 393 × 852, 440 × 956; landscape 852 × 393 | Playwright WebKit (an iOS stand-in) and Chromium (Android), `isMobile`, `hasTouch`, `deviceScaleFactor` 3 (Android 2.625); `deviceCapabilities.touch` and the safe areas by `harnessSetContext` |
| Owner's ChatGPT iOS host copy | 393 × 852; safe-area insets top 102, bottom 118, left/right 0. Small copy: 320 × 568; top 63, bottom 84, left/right 0. | Set the viewport size. These insets include the host header and composer. Hide the harness Remount bar and set the iframe height to the full viewport. Playwright's `devices['iPhone 14 Pro']` viewport is 393 × 660. |
| Tablet | 820 × 1180, 1180 × 820 | WebKit, `hasTouch` |
| Desktop | 1024 × 768, 1280 × 800, 1440 × 900, 1920 × 1080 | Chromium and WebKit, `deviceScaleFactor` 1 and 2; Firefox one time |
| ChatGPT inline | the iframe at the chat column width (about 760 px on desktop, the screen width on a phone) | The harness does not resize the iframe. Listen on the host page for `ui/notifications/size-changed`, set the iframe height to the last height that the widget sent, and do this 3 times: the height must stay the same, and the home card must show in full with no inner scroll. |
| iOS Simulator | the device in your task | Safari opens the harness URL. Drive it with the simulator tool. You cannot run JavaScript there: read the Display check line (section 4). The line is hidden: to show it, press the "Settings" title for about 600 ms (a simulator tap with a duration of 0.7 s or more). |

**Tier 1 (each run):** phone WebKit 393 × 852 inline and fullscreen; desktop Chromium 1280 × 800; ChatGPT inline at 760 px. **Tier 2:** the other rows; run at least 2 of them each time and name them in the report. Do the layout sweep (step 13) on all of the surfaces in your task.

Do one phone pass with `locale: 'he-IL'` and `timezoneId: 'Asia/Jerusalem'`, and one desktop pass with `locale: 'en-US'` and `timezoneId: 'America/Los_Angeles'`.

The harness serves the page with no CSP, in a same-origin iframe with no sandbox. ChatGPT applies the CSP from the resource `_meta` (`src/plugin/server.ts`) in a sandboxed iframe. In one pass, add that CSP to `/board-resource` (for example, with a Playwright route) and read the console for CSP errors on each screen.

The ChatGPT apps themselves are for the owner only (section 8). The harness and the Simulator do not show every host fault.

## 3. Test sequence

Do the steps in this order. Each step names what to check. For each check, record pass or fail and the evidence.

0. **Smoke pass (10 min).** One phone surface and one desktop surface. Open the widget, start a computer game, make 3 moves, Remount, and see the same game. Open Settings, press the "Settings" title for about 600 ms to show the Display check line, and read it. If one item fails, stop: report a Blocker and do not run the other steps.
1. **First open.** A player opens the widget inline. Check: the home card, its words, its 2 actions at most. Record the taps and the time from the first open to the first move, and each word that a new player does not know. With "A friend" and `requireHandleNext`, check the name and picture flow; leave it with Back and with a Remount: the player is never stuck. A player with no record, games or badges sees no empty table and no "0" with no explanation.
2. **Quick-start hall.** "Choose a game" opens the Play screen. Check "Your games" (a list), "Join with a code" (a code field), and "New game" (the setup controls and "Start game"). Check the Profile and Settings rows, their words and art, and Back from each. "Play now" starts a Beginner computer game with an automatic army. With a game that needs your move, the home card shows "Resume" with the opponent and turn, and "Play now". Saved custom options stay after Play now.
3. **New game.** For each opponent (Computer, A friend, A random player): the level (4), the colour (3), each game option (Fairy pieces and the pieces sheet, Arrangement, Classic chess, Cards and the cards sheet, King powers and the king choice). Check that an option that cannot apply is clear, that the choice stays after Back and after a Remount, and that Start does what the words say.
4. **Seat setup.** Arrangement (shuffle, move a piece), the king choice, Ready, and the wait for the other side. Check: the board size, the words, and what each button does.
5. **Game with the computer.** Each level one time. Select a piece, legal and illegal moves, the move marks, captures, check, cards, king powers, Show threats, Symbols only, the Moves sheet, the context line and its "All rules", and the Menu sheet (Choose a move, Resign, Abort before each side's first move, Claim when it applies, Settings, Reload; a computer game has no draw). The computer's reply, and the end by checkmate, resign and abort. The end card and Rematch. `?terminal` checks the end screen of a finished game.
6. **Friend game.** Alice makes a game: the code, Copy, a new code, Cancel. Bob joins with the code. Both choose and play. Then bob makes a game and alice joins: a good code, a bad format, an unknown code, a used or old code, her own code. For the chat words "Join King Down game XXXXXX", the model calls `kingdown_open {code}`: use `POST /fixture-tool`, then `harnessShow(result)`. Preview, Join and Decline. Refuse clipboard access and press Copy: the page says to select the code and copy it, and selects the code. After a Copy that says "Copied", read the clipboard and compare it with the code.
7. **Random player.** New game with "A random player": the wait screen, its timer, "play the computer while you wait", Cancel, and bob takes the game. Open games: the empty list, a list with bob's game, Accept, and alice's own waiting game. Find an opponent.
8. **Your games.** Rows for each state: your turn, their turn, setup, waiting. (Finished games show on the Profile.) Open each row. A move by bob changes the row. Two games against the same player: can you tell them apart?
9. **Profile and Collection.** The record, the rating, the provisional mark, the badges, the history (`/fixture-seed`), each Collection tab.
10. **Settings.** Each toggle, and that it stays after Remount. Name and picture: a good name, a short name, a long name (20 characters), a taken name, an emoji, spaces. In the Simulator, type with the on-screen keyboard: the field and Save stay visible, and after the keyboard closes no fixed control has moved.
11. **Recovery.** Remount on each screen: the screen and the game come back. A slow reply and a double tap (`holdNext`). A lost reply (`dropNextReply`, `dropNextMoveReply`). A failed read (`rejectNextGet`). A rejected move (`rejectNextMove`). An action after the server changed the game (a stale revision). The opponent's move arrives by the poll. For a new chat message, set `harnessWidgetState = undefined`, then Remount. Hide the page and show it again (switch the tab, or send Simulator Safari to the background) after your move and before the computer replies, and again while bob moves: when the page shows again, the reply and bob's move arrive at once.
12. **Display modes.** On each screen: inline to fullscreen and back. Inline shows only the home card; each other screen asks for fullscreen. The sizes that the widget sends to the host are not 0 in inline mode. Also: a slow answer (`holdDisplayNext`): the home card stays until the host grants fullscreen, and no other screen shows inline; a refusal (`denyDisplayNext`): the home card shows clear words; a tool result after the player leaves fullscreen does not open fullscreen again; `availableDisplayModes: ['inline']` (no request for fullscreen; the widget stays usable); `containerDimensions` missing, with only `maxHeight`, or with a fixed `height`; a context change in the middle of a game (theme, safe areas, size) updates the layout with no reload.
13. **Layout sweep.** On each surface and each screen: the board fill (section 4), no horizontal scroll, no clipped or overlapped text, tap targets of 44 px or more on touch, safe areas respected, the composer room at the bottom in fullscreen, text at 200% zoom, landscape, the dark theme. Take a screenshot of each screen on the tier 1 surfaces (animations off, a fixed clock and seed data) and compare it with the main build (`tools/render-compare` with `--against main`). Report each change that is not explained.
14. **Keyboard, screen reader and access.** Tab order, a visible focus ring, Enter and Space on buttons, Escape closes a sheet, focus goes back to the button that opened the sheet, and focus is never under the composer area or a sheet. Each control has a name (role and label). A live region announces the opponent's move and the game end. Contrast of text on the parchment. Colour vision (CDP `Emulation.setEmulatedVisionDeficiency`: deuteranopia, protanopia, achromatopsia): marks, threats, check and the last move are clear with no colour. Reduced motion: no large motion and no flash more than 3 times a second. Each move works with taps only.
15. **Words.** Each screen: spelling, full stops, the same name for the same thing on every screen, numbers, times and dates ("open 0 min", the code end time in the device language, the profile dates in UTC, a game that ends near midnight), and error words that tell the player what to do. One run with longer words (each string 40% longer) and one with `dir="rtl"`: no clipped or overlapped text.
16. **Speed and errors.** At 4× CPU slowdown and Slow 4G, with an empty cache, the median of 3 runs: the time to the first screen (at most 2.5 s), and from a tap to the next stable screen (at most 300 ms). The payload that the build prints (the build stops above 1,000,000 bytes). Long tasks, memory after 30 moves at `deviceScaleFactor` 3, console errors and warnings, failed requests. With the board open and no action for 60 s, the CPU time is near zero. In one more run, make the art requests (`/plugin-art/*`) fail, and in another make them slow: the screens and the board still work.
17. **Model words.** Call each model tool through `POST /fixture-tool`: `kingdown_open` (each `screen`, `game_id: "next"`, `code`), `kingdown_create` (each kind), `kingdown_join`, `kingdown_draw`, `kingdown_resign`, `kingdown_abort`, `kingdown_invite`, `kingdown_games` and `kingdown_profile`. Show each `kingdown_open` result with `harnessShow`, and check that the open widget shows each change. The text that ChatGPT reads (`content`, `structuredContent`, and the widget's `harnessWidgetState.modelContent`) is short and correct, and has no position, legal moves, opponent private data, or session, trace or request ids. Error results have a code and clear words. Each tool has `readOnlyHint`, `destructiveHint` and `openWorldHint` values that match what it does (resign and abort are destructive; get, games and lobby are read-only).
18. **Rules engine.** Run the move-count check (perft) in Classic mode on the start position, "Kiwipete" and positions 3 to 6 of the Chess Programming Wiki perft page, depth 1 to 4, and compare with the published counts. For each `/fixture-position` case, record the depth 1 to 3 counts in `perft.json` and compare them with the last run on main. A different count is a Major until the owner says that the rule changed. Then check on the board: castling out of, through and into check; en passant that exposes the king; promotion to each piece; stalemate; threefold repetition; the 50-move rule; insufficient material; a king power or card that gives check or stalemate. For each: the legal marks, the result, and the end card words.
19. **State sync.** In a friend game, after each move, compare alice's view (`harnessView`) and bob's (`kingdown_get`): the position, the turn, the revision and the move list are equal. Then: (a) send the same move 2 times at the same time with the same revision: exactly one move applies; (b) bob resigns while alice's move is held: one end result, and both players see it; (c) alice opens the same game in 2 tabs and moves in one: the other shows the move by the poll, and a move from the old tab gets clear stale-revision words and loses no move; (d) accept, join and rematch, each sent 2 times at the same time: exactly one game. Check the server state, not only the replies.
20. **Actions between people.** In a friend game: bob offers a draw and alice accepts; in a second game, bob offers and alice declines, then alice resigns; alice offers a draw and bob answers; bob resigns; bob aborts before the first move; each side offers a rematch, and the other side accepts or declines. Seed a past deadline and claim. Seed an `outcome`, so that the end card shows the rating change and a new badge. Each change from bob arrives by the poll, with no Reload.
21. **Network and lifecycle.** In Chromium with CDP `Network.emulateNetworkConditions`: 400 ms at 400 kbps; 2000 ms; and offline (`context.setOffline(true)`). In each: start a game, move, open Your games, join with a code, wait for the opponent's move; go offline in the middle of a move for 30 s, then online. Pass: no hang; clear words within 10 s; no retry faster than 1 per 2 s; the true state comes back with no reload; no move applies 2 times or goes with no message. Then freeze the page (CDP `Page.setWebLifecycleState`, frozen for 60 s), and hide it for 10 min with a fake clock (`page.clock`) while bob makes 2 moves. When it comes back: bob's moves within one poll, correct times, no burst of more than 3 requests. While hidden, the poll stops or slows.
22. **Tool calls.** On each screen, leave the page idle for 2 minutes and count `harnessCalls` by name. Compare the reads with the poll delays in `src/plugin/poll.ts` (3 s while the opponent is active; 5 s, then 15 s, while you wait; 15 s or 30 s at other times; none in a computer game or on a hidden page). More reads is a finding. Each tap sends one write with one `command_id`; a retry uses the same `command_id`.
23. **Abuse.** With `harnessTool` and `/fixture-friend-tool`, call tools with no UI: a move for the other side; a move out of turn, in a finished game, or in a game that is not yours; `kingdown_get` on a game of 2 other players; a join with your own code; 50 code guesses in 1 minute; a 10,000-character name or `say` message; a name and a message with `<img src=x onerror=alert(1)>`, with right-to-left marks, with zero-width characters, and a name that copies another name with look-alike letters; a resign, abort or claim with a wrong revision. Each call fails with a code and clear words, changes no game and shows no private data. Script text shows as plain text. Any fault here is a Blocker.
24. **Soak and random input.** (a) A scripted bob plays 150 moves or 30 minutes. Every 10 moves, record the JS heap, the DOM node count and the listener count on `window`. The heap at the end is within 20% of the heap at move 10. (b) 500 random taps and key presses on visible controls, with a recorded seed. Pass: no console error, no screen with no way out, no hang longer than 3 s.
25. **Review readiness.** No ads; no plan, upgrade or purchase words; content suitable for ages 13 to 17; an error message or a fallback for each tool error; no demo or "coming soon" screens; each loaded domain is in the resource CSP; the privacy words match the data that the tools save.

After a fix, do a **confirmation test** (the exact steps of the finding again) and a **regression pass** (steps 0, 5, 6 and 11 on one phone and one desktop).

## 4. Measurements

- **Board fill.** In a browser you script: the board canvas (`#board canvas`) width and height, the board box (`#board`), the table (`#game-table`, or `[data-seat-id="game-table"]` on the seat), its screen (`[data-screen="seat"]` or `[data-screen="board"]`), and the frame (`#app-frame`). Record `canvas width / frame width`. The canvas must equal `min(board width, board height × 960 / 1024)`, and the table must fill its screen.
- **Stale viewport units.** The iOS host can keep `vh` and `dvh` at an old height. Use the method in `tools/plugin-ios-size.test.ts`: scale each `vh` value in the page CSS to a stale height. Then measure every screen and sheet: the profile scroll, the pieces, cards and king sheets, and the board Menu. Nothing may clip, collapse or go under the composer.
- **Display check line.** Play → Settings keeps the sizes of the last seat or board screen: window, visual viewport, vh and dvh, frame, section (the screen box), table, board, canvas, safe areas, display mode, and the sizes sent to the host. The line is hidden until you press the "Settings" title for about 600 ms (in the Simulator, a tap with a duration of 0.7 s or more). It measures one time, 1.5 s after the seat or the board opens, and does not change after a rotation or a change of display mode. Open the seat or the board, wait 2 s, then open Settings, show the line and read it; after a change, leave the board and open it again first. This is the only measure in Simulator Safari.
- **Sharpness.** At each `deviceScaleFactor`, record `canvas.width` × `canvas.height` and zoom the screenshots: the board, the pieces, the coins and the badges are sharp.
- **Touch targets.** The bounding box of each control.
- **Times.** From the click to the next stable screen.

## 5. Severity, priority and repro rate

| Severity | Meaning |
|---|---|
| Blocker | A player cannot play, loses a game or data, or sees private data. |
| Major | A main flow fails or is very hard; the board is too small to play; a wrong result. |
| Minor | A flow works but is confusing, slow or wrong in a detail. |
| Polish | Small visual or word faults. |

Severity is the effect on the player, not the cost of the fix. Also propose a priority: **P1** fix before the next release; **P2** fix in the next planned work; **P3** fix when time permits. The owner can change it.

Give a repro rate ("3/10"). Report a fault that occurs only some of the time with its rate and the label `intermittent`. A fault that you saw once and cannot make again in 10 tries goes to "Seen once" in the report, with all of its evidence.

## 6. Evidence rules

- Reproduce each finding 2 times before you report it. Give the exact steps from a fresh page.
- Give a screenshot or a measurement for each finding. For a flow finding, also save the `harnessCalls` JSON and the console log, and for a finding between players, both players' views. A Playwright trace helps. Put the files in your output folder.
- One finding for each fault. Before you report, look in `docs/specs/` and the earlier reports for the same fault; if you find it, add your evidence as "also seen".
- Separate product faults from harness faults. Examples of harness faults: a Simulator page zoom, the missing CSP. Report harness faults in their own section.
- Mark a guess as a guess. Do not report what you did not see.
- Give the likely cause (`file:line`) when you can find it. Do not fix it.

## 7. Report

Write `report.md` in your output folder. If you cannot write it, put the full report in your final message.

1. One line: the result.
2. The build: the commit (`git rev-parse --short HEAD`), the payload bytes, the board resource URI. The surfaces and sizes that you tested, with their tier.
3. Findings, most severe first. For each: severity, priority, repro rate, surface (device or browser, size, inline or fullscreen), steps, expected, actual, evidence (file names and measurements), likely cause.
4. Seen once.
5. Harness or tool faults.
6. Checks that passed (the step numbers of section 3).
7. What you could not test, and why.
8. Exploration sessions (section 9).

## 8. Release exit and owner checks

A build is ready for the owner when the smoke pass passes, no Blocker or Major is open, steps 18 to 23 pass, and the screenshot comparison has no change that is not explained.

Agents cannot test these. The owner covers them on each release:

| Gap | Owner check |
|---|---|
| The real ChatGPT hosts (iOS, Android, desktop app, chatgpt.com) | 15 minutes of tier 1 flows on each, inline and fullscreen, with a screenshot of the Display check line (press the "Settings" title for about 600 ms to show it). |
| The model's choice of tool | A prompt set in ChatGPT developer mode: direct ("Start a King Down game against the computer"), indirect ("I'm bored, play chess with me"), follow-up ("make that game harder") and negative ("explain the Sicilian Defence") prompts, each with the expected tool. |
| Real networks, two people, a full day | One friend game with a second person on two phones, across a day, on Wi-Fi and cellular. |
| Battery, heat and screen readers | A 30-minute game on an iPhone; one VoiceOver game each major release. |
| Fun and clarity | Playtests with new players, watched with no help. |

## 9. Exploration

After the scripted steps, run 2 sessions of 45 minutes. Each session has one charter: "Explore <area> with <tool or data> to find <risk>", for example "Explore Remount during setup with 2 tabs to find lost choices" or "Explore cards and king powers with odd positions to find wrong legal marks". For each session, report the charter, the time, what you tested, the findings, the open questions, and what blocked you.

# 04 · Game apps teardown: ChatGPT games and mobile chess

Research for the UX approval items J1, J2, J3, D2, L0, L2 and L3. Written 2026-10-15. Repo state: branch `claude/plugin-ui-iphone` at `2e7f6295`. I read every source below on **2026-10-15**.

This note does not repeat reports [01](01-openai-review.md) (review rules), [02](02-chatgpt-host-metrics.md) (host sizes, display modes) and [03](03-game-feel.md) (motion timings, haptics, sound). It adds what the best game apps *do*, and compares King Down with them.

Labels:

- **[A1]**…**[A12]** a source in the table in section 1.
- **[Repo]** a fact from this repository, with `file:line`.
- **(inference)** my conclusion. No source states it.
- **(pre-2026)** the source is older than 2026.

---

## 1. Sources

| Key | Source | What it is | URL | Read | Pre-2026 |
|---|---|---|---|---|---|
| A1 | OpenAI UI guidelines | Display modes, inline card rules, PiP for games | https://developers.openai.com/apps-sdk/concepts/ui-guidelines | 2026-10-15 | Undated |
| A2 | OpenAI blog: What makes a great ChatGPT app | Know/do/show filter; games; cold start | https://developers.openai.com/blog/what-makes-a-great-chatgpt-app | 2026-10-15 | Undated; refers to the 2025 launch |
| A3 | `openai-apps-sdk-examples`, Cards Against AI (`src/cards-against-ai/*`, `cards_against_ai_server_node/*`) | OpenAI's only game example | https://github.com/openai/openai-apps-sdk-examples (head `18cc38e`, 2026-04-15) | 2026-10-15 | No |
| A4 | ChatGPT app directory and app pages | Store listings | https://chatgpt.com/apps ; https://chatgpt.com/plugins/plugin_asdk_app_69a0e374670c819190761772d2092135 ; https://chatgpt.com/plugins/plugin_asdk_app_6a8b1ebe49588191a38ff2211769d9d2 | 2026-10-15 | **All return HTTP 403** to an unsigned fetch. Only search-result titles and snippets were seen. |
| A5 | awesome-chatgpt-apps (third party) | A list of directory apps by category | https://github.com/rdmgator12/awesome-chatgpt-apps | 2026-10-15 | No (updated 2026-07-02). Secondary. |
| A6 | Lichess mobile (Flutter) | Home, play menu, ongoing games, board layout, feedback | https://github.com/lichess-org/mobile (head `243b19b`, 2026-10-15) | 2026-10-15 | No |
| A7 | flutter-chessground | Board animation | https://github.com/lichess-org/flutter-chessground (head `1b53e59`, 2026-09-29) | 2026-10-15 | No |
| A8 | Chess.com Help: Starting a new game | Mobile Play flow | https://support.chess.com/en/articles/8609779-how-do-i-start-a-game-on-chess-com | 2026-10-15 | **Yes** (updated 2025-07-30) |
| A9 | Chess.com Help: Play bots (iOS) | Bot entry points | https://support.chess.com/article/2041-how-do-i-play-against-the-computer-on-my-mobile-device-ios | 2026-10-15 | No (2026-08-18) |
| A10 | Chess.com Help: Daily Chess settings; Chess.com News: mobile widget | After-move "next game"; widget to most urgent game | https://support.chess.com/en/articles/8659190-how-do-i-manage-my-daily-chess-settings ; https://www.chess.com/news/view/announcing-chesscom-widget | 2026-10-15 | No (2026-01-05; 2026-02-27). The after-move options come from a search snippet; the page text did not show them. |
| A11 | Chess.com App Store page | Store description | https://apps.apple.com/us/app/chess-play-learn/id329218549 | 2026-10-15 | No (v4.10.33) |
| A12 | Pychess (pychess-variants), `client/lobby.ts`, `client/ongoingRoundGames.ts`, `client/sound.ts` | Open-source fairy-variant site | https://github.com/gbtami/pychess-variants (head 2026-10-14) | 2026-10-15 | No |

Also used, not re-read: Chess.com piece animation page and Lichess `move_feedback.dart` (report 03, S27–S29), OpenAI display-mode facts (report 02 §1).

**Gaps.** I could not open any ChatGPT directory page (A4: 403) and did not sign in. So the "best ChatGPT game apps" list rests on search snippets and a third-party list (A5). No Fairy-Stockfish GUI store app was read; Pychess stands in for the variant class.

---

## 2. Findings

### 2.0 Game apps in ChatGPT: what exists and what each does well

| App | What it does | What it does well | Source |
|---|---|---|---|
| Cards Against AI (OpenAI example) | Party card game against model "CPU" players | One splash with one **Start Game** button, then the game. A visible **Next Round →** button closes the loop. Moves go straight to the server (`callServerTool`, "No confirmation dialog, instant execution"); the model speaks only for CPU banter. Card turns use CSS transforms (600 ms travel, 300 ms flip); buttons press with `active:scale-95`. It asks for PiP on Start. | A3: `DESIGN.md:11`, `SplashScreen.tsx:52-57`, `PlayArea.tsx:265-269`, `Cards.tsx:61,70`, `App.tsx:283` |
| "Play Chess Against ChatGPT" | Chess against the model | Snippet: "You play white, the ChatGPT plays black." No setup choice at all. | A4 (snippet only) |
| "Sudoku puzzles, 5 levels" | Sudoku | Snippet: five graded levels, hints, size variants. Level is the only first choice. | A4 (snippet only) |
| Accelerator Chess, Chessy, Chess by Max Health, 789 Sudoku, ABC Crossword, ABC Word Search, Snake Retro, Trivana, QuizFlight | Chess, puzzles, arcade, quizzes | Each listing is one line ("Play chess against ChatGPT", "Quick word-search game"). Not inspectable without sign-in. | A5 (secondary) |

OpenAI's own rules for games, in short:

- PiP is "optimized for ongoing or live sessions like games"; "Do not overload PiP with controls" [A1]. ChatGPT itself does not offer PiP now, and on mobile PiP becomes fullscreen (report 02 §1). (inference) Fullscreen is the right game mode for King Down; that is what the plugin does.
- Inline card: "up to two actions maximum, with one primary CTA and one optional secondary CTA"; "No nested scrolling"; "Cards should not contain multiple drill-ins, tabs, or deeper navigation" [A1].
- A game app adds value when it can "maintain stateful game logic, track progress, enforce rules, or render interesting views of the game world" [A2].
- Cold start: "The user should feel like progress has started, not like they've been dropped into a multi-step onboarding flow"; "If they have to answer five questions before seeing anything useful, many will simply stop"; "Ask one or two clarifying questions at most"; "You don't need a full navigation hierarchy"; "Select capabilities, don't port your product" [A2].

### 2.1 The first game from zero

**Best apps.**

- **Lichess mobile.** The home screen shows a **Quick pairing** grid of time controls. One tap on a tile opens the game screen and starts a seek (`quick_game_matrix.dart:53,109-115`) [A6]. A floating **Play** button opens one sheet: a create-game block, then *Challenge a friend*, *Correspondence*, *Tournaments*, *Play against computer*, *Over the board* (`play_bottom_sheet.dart:11-22`, `play_menu.dart:21-90`) [A6].
- **Lichess, computer game.** If a saved game exists, the screen loads it at once; else a New game sheet opens, **prefilled from the last choices**, with one **Play** button (`offline_computer_game_screen.dart:140-146`, `:752-767`, `:1124`) [A6]. Defaults: Stockfish level 4, random side, unlimited time, casual (`offline_computer_game_preferences.dart:125-136`, `opponent_level.dart:42`) [A6]. So: Play → computer → Play → first move = **3 taps plus the move** the first time; later it resumes. The defaults are not the weakest level.
- **Chess.com.** "tap 'Play' on your home screen", then "begin a game immediately with the default settings or … tap 'Custom'" [A8] (pre-2026). Bots have their own home tile: "Tap 'Play Bots' on the home screen, or alternatively tap 'Play' and then select 'Play Bots'"; "To customize your game, tap 'Options'" [A9].
- **Pychess (variants).** The lobby has three buttons: *Create a game*, *Play with a friend*, *Play with AI* (`lobby.ts:96-105,649-651`) [A12]. Each opens one dialog (variant, time, level). The **colour buttons are the start buttons**: Black, Random, White each call `createSeek` (`lobby.ts:930-946`) [A12]. A variant app keeps all options in one dialog and starts on the last tap.
- **ChatGPT game apps.** One Start button (Cards Against AI) or no setup at all (Play Chess Against ChatGPT) [A3][A4].

Pattern: no app puts a separate "ready" step between setup and the first move against the computer. Options live in one place, prefilled from the last game. (inference)

**King Down today.** Home card → **Play** (`index.html:32`, `app.ts:345`) → Play screen → **New game** (`index.html:37`, `app.ts:147`) → setup with mode, level, colour and five toggles (`setup.ts:40-49`) → **Start game** (`index.html:45`) → seat screen (because Arrangement is on by default, `src/match/setup.ts:22`) → **Ready** (`index.html:59`) → piece → square. Default level is Club (`setup-model.ts:7`). That is 7 taps and 4–5 screens (J1).

**Gap.** Two extra steps that no reference app has: the Play → New game split, and the seat screen with Ready for a computer game. The first-time level (Club) is above Lichess's middle default. (inference)

### 2.2 Board size, and what gives way on a phone

**Best apps.**

- **Lichess portrait:** the board takes the full shortest side; it shrinks only when it would leave less than **180 px** for everything else: `maxAllowedBoardSize = maxHeight - 180.0` (`game_layout.dart:498-515`) [A6]. On a short screen (less than 200 px left beside a full-width board, `screen.dart:6-25`, `constants.dart:68`) the **move list goes away** and the board loses 16 px (`game_layout.dart:517-528`) [A6]. Layout order: optional move list, top player table, board, bottom player table, actions bar (`game_layout.dart:521-569`).
- **Lichess landscape:** board at full height on one side (left or right is a setting), a side column with the top table, the move list, the action bar and the bottom table (`game_layout.dart:439-495`) [A6].
- **Lichess drag aid:** the dragged piece shows at **2× size, one square above the finger** (`board_settings.dart:96-97`) [A7]. Lichess has no 44 px square rule and no second move chooser.
- **Chess.com:** no layout source is public (store page and help pages only) [A11].

Pattern: on a phone, the board is full width; the move list gives way first; player rows and one action bar stay. (inference)

**King Down today.** The table grid has seven rows: player strip, board, strip, context line, Moves line (48 px), space, bar (60 px + inset) (`src/ui/table.css:7`). In fullscreen a `‹ Play` head sits above it (`index.html:35`, `app.ts:279-280`). Short-phone rules make rows 44 px below 520 px and hide the Moves line below 420 px (`app.css:177-188`). L0 measures about 247 px today and 302 px after the fault fixes, against 384 px full width.

**Gap.** King Down spends about 264 px or more on rows (head, two strips, context, Moves, bar), against Lichess's 180 px budget. Lichess drops the move list before it shrinks the board; King Down shrinks the board first and drops the Moves line only below 420 px. (inference from the cited lines)

### 2.3 The play menu structure

**Best apps.**

- **Lichess:** one home with shortcuts (Quick pairing grid, ongoing games, recent games) plus one **Play** sheet that lists every way to play (`home_tab_screen.dart:349-404,472-474`; `play_menu.dart`) [A6]. Home widgets can be hidden or reordered (`_EditableWidget`) [A6]. The first-run home shows a greeting, sign-in and Quick pairing (`home_tab_screen.dart:189-276`).
- **Chess.com:** a home with **Play** and **Play Bots** tiles; Play opens one screen with defaults and a *Custom* option [A8][A9].
- **Pychess:** one lobby: three create buttons, the seek list, and ongoing games on the same page (`lobby.ts:649-651`, `ongoingRoundGames.ts`) [A12].
- **OpenAI:** a card holds at most two actions and no tabs or drill-ins; "You don't need a full navigation hierarchy" [A1][A2].

Pattern: every reference app has **one place** that lists all ways to play, with the user's games next to it. None uses tabs only for play. (inference)

**King Down today.** The Play screen mixes New game, Open games, Join with a code, Your games, Profile and Settings (`index.html:36-43`). New game opens a second screen that again offers Computer, A friend and A random player (`setup.ts:40`). Random play shows in two places (Open games, and New game → A random player). Settings has three entries (Play screen `index.html:42`, Profile `index.html:62`, board Menu `board.ts:247`).

**Gap.** Two levels where the references use one. Duplicate entries.

### 2.4 Resuming an active game

**Best apps.**

- **Lichess:** the home shows a carousel "N games in play" of live mini-boards; a tap opens the game (`games_carousel.dart:63-88`) [A6]. Games where it is your move sort first (`ongoing_games_notifier.dart:55-57`); the others show at opacity 0.7 with "Waiting for opponent" (`games_carousel.dart:108-135`) [A6]. A computer game resumes by itself when its screen opens (`offline_computer_game_screen.dart:140-142`).
- **Chess.com:** an after-move setting for Daily games: go to the next game, go home, or stay [A10] (search snippet). The home-screen widget goes "straight to the game that's closest to running out of time" [A10].
- **Pychess:** an "Auto skip to next game" switch on the ongoing games strip (`ongoingRoundGames.ts:96,140-144`) [A12].

Pattern: (a) your-move games first, (b) one tap from the home to the game, (c) a "next game" step after a move in correspondence play. (inference)

**King Down today.** The server already sorts your-move games first, then by deadline (`src/match/store.ts:125`). The home card shows a count ("Your move in N games", `app.ts:154`) and **Your games**, which opens the Play screen scrolled to the list (`app.ts:262,285,346`). The list is below New game, Open games and the code field (`index.html:37-40`). **Play** reopens the last game only if the player collapsed fullscreen in this mount (`app.ts:295-297,345`); after a remount it opens the Play screen. No "next game" after a move; the end card offers Rematch and Your games (`end.ts:81-85`).

**Gap.** The order is right; the entry is two taps and a scroll, not one, and the home card does not name the game. No next-game step.

### 2.5 Motion and feedback on a move, a capture and a win

**Best apps.**

| Moment | Lichess mobile | Others |
|---|---|---|
| Move | 150 ms slide (`board_preferences.dart:243`) [A6]; chessground default 250 ms, curve `easeInOutCubic` (`board_settings.dart:92`, `board_controller.dart:132-135`) [A7]. Sound `move`; light haptic, medium on check, haptics on by default (`move_feedback.dart:14-24`, `board_preferences.dart:188`) [A6]. | Chess.com: animation styles; none on iOS (report 03, S29). Pychess: per-variant piece sound sets (`sound.ts:219-234`) [A12]. |
| Capture | The taken piece **fades out** during the same slide (`easeInQuad`, `board_controller.dart:136`) [A7]. Capture sound, light haptic (`move_feedback.dart:37-46`). | Pychess: `capture`, or `explosion` for atomic (`sound.ts:219-234`). |
| Game start | Sound `dong` on a new game (`game_controller.dart:173-177`) [A6]. | — |
| Win / loss | `dong` 500 ms after the end (`game_controller.dart:890-894`); the result dialog opens after **400 ms** (`game_body.dart:51`); its buttons stay **inactive for 1,000 ms** so a late tap does not hit Rematch (`game_result_dialog.dart:40-46`); a 400 ms cross-fade for the rematch state (`:124-128`) [A6]. No confetti. | Pychess: separate `victory`, `defeat`, `draw` sounds (`sound.ts:167-175`). Cards Against AI: 600 ms card travel, `active:scale-95` press [A3]. |
| Sound default | On, volume 0.8 (`general_preferences.dart:104-110`) [A6] — a native app. | — |

Pattern: short, quiet motion (150–250 ms) on every move; the capture is a fade, not a scene; the win is a short sound and a delayed result card with a guard against stray taps. (inference)

**King Down today.** Moves animate at `fast` pace (`board-view.ts:8`); captures play full piece strikes (report 03 §4.5). The win shows the fallen king with no topple (`board.ts:243` passes `false`) and opens the end card when the board stops (`end.ts:91-99`). No sound, no lift tell, no stray-tap guard on the end card buttons (`end.ts:81-85`).

**Gap.** The move and capture already have more motion than the references. The missing parts are at the edges: the win moment, a stray-tap guard, and optional sound. Report 03 §5 lists the cheap fixes.

### 2.6 What a ChatGPT app reviewer would notice

From OpenAI's pages and the example [A1][A2][A3]; report 01 has the full rule list.

1. **Inline card: two actions, no nested scroll, no tabs.** King Down meets it: two buttons (`index.html:32`), all other screens in fullscreen (`app.ts:237-241`).
2. **Cold start.** A reviewer runs the starter prompt and counts steps to value [A2]. Today: 7 taps and a Ready step whose purpose the player does not see (D2). (inference) This is the most visible UX risk.
3. **No full navigation hierarchy; do not port the product** [A2]. The Play screen has Profile, Collection and Settings two levels deep (`index.html:41-42,62-63`). (inference) Low risk alone; it adds to item 2.
4. **System fonts; brand colour only on primary buttons; no patterns that "break ChatGPT's minimal look"** [A1]. King Down uses Cinzel and Alegreya and a stone floor (report 01 C7). The owner chose this (Q18). (inference) The game surface can carry the art; the chrome is where a reviewer looks.
5. **Model-free moves.** OpenAI's example sends player moves straight to the server with `callServerTool` and no confirmation [A3]; King Down does the same through app-only tools (report 01 C10).
6. **Tool annotations decide confirmation dialogs** [A3 README]. Report 01 A4–A5 covers this.

---

## 3. Per-item evidence

### J1 · One play hall in place of Play, then New game

- **Options:** (a) one hall; (b) three tabs; (c) keep Play and add shortcuts.
- **Evidence supports: (a).** Lichess, Chess.com and Pychess each have one place that lists every way to play, next to your games (§2.3). OpenAI asks for no "full navigation hierarchy" [A2]; tabs are the pattern none of them use for play.

### J2 · The two actions on the home card

- **Options:** (a) "Play now" + "Choose a game"; (b) "Play Beginner" + "Your games"; (c) "Continue" + "Play".
- **Evidence supports: (a), with J3's Resume in the first place during a game.** It mirrors Lichess (Quick pairing + Play sheet) and Chess.com (start at once with defaults, or Custom) [A6][A8]. OpenAI's "one primary CTA and one optional secondary CTA" fits a start-now / choose split [A1].

### J3 · A named Resume and "Next game ›"

- **Options:** (a) named Resume on the home card and Next game after a move; (b) a named list on each entry; (c) keep Play.
- **Evidence supports: (a).** Lichess shows named your-move games first on the home, one tap away [A6]; Chess.com and Pychess both offer a "next game" step after a move [A10][A12]. King Down's server order already fits (`store.ts:125`).

### D2 · A quick computer game with no seat screen

- **Options:** (a) quick route: Beginner, automatic army, no seat; (b) Arrangement off for computer games; (c) keep Club and Arrangement on.
- **Evidence supports: (a).** No reference app has a ready step before the first move against the computer, and all keep the last choices as the next defaults (Lichess `offline_computer_game_screen.dart:752-767`; Pychess colour button = start) [A6][A12]. One caveat: Lichess's first-time level is the middle one (level 4), not the weakest. So "Beginner the first time" is King Down's own call, and it fits a game with new pieces. (inference)

### L0 · What gives way for a full-width board on your iPhone

- **Options:** (a) short rows only (337 px); (b) Back into the top row (384 px, all one tap); (c) B plus Resign and Offer draw into Menu.
- **Evidence supports: (b).** Lichess makes the board full width and keeps the two player rows and one action bar at one tap; it drops the move list, not the controls (§2.2) [A6]. C goes further than Lichess needs on a full-size phone.

### L2 · A larger board on phones and in landscape

- **Options:** (a) full-width board; (b) board first, details scroll, side rail, large move chooser, focused view; (c) remove the top row only.
- **Evidence supports: (b) for the layout parts, and only partly for the move chooser.** Lichess does "board first": full width, move list hidden on short screens, and in landscape the board at full height with a side column (`game_layout.dart:439-528`) [A6]. But Lichess has no second move chooser; it uses a 2× drag piece above the finger (`board_settings.dart:96-97`) [A7] and accepts squares under 44 px. (inference) Keep "Choose a move" for powers and cards, where King Down needs it (`board.ts:141,147`); do not build a general chooser for size alone.

### L3 · Motion and sound: short moments that leave a clear state

- **Options:** (a) short moments, lasting state; (b) still states and text only; (c) larger scenes.
- **Evidence supports: (a).** Lichess uses 150–250 ms moves, a fade for captures, a delayed result card (400 ms) with a 1 s tap guard, and short sounds at start and end (§2.5) [A6][A7]. Nothing in the references supports larger scenes (c). Sound is on by default in Lichess, a native app; in a ChatGPT frame, off by default stays right (report 03 §4.7). Add Lichess's 1 s tap guard to the end card.

---

## 4. Open questions

1. **Directory apps.** Which ChatGPT game apps does OpenAI feature, and how do they start? All directory pages return 403 unsigned [A4]. The owner can open them signed in and screenshot two chess apps' first screen.
2. **First-time level.** Lichess starts at level 4 [A6]; Chess.com's default bot was not checked. Is King Down's Beginner the right first level for a chess player? A play test can tell.
3. **Small phones.** Lichess shrinks the board below full width only when less than 180 px remain [A6]. At 320 px wide, does B's 229 px board still beat C's 270 px enough to move Resign into Menu? Owner taste.
4. **Next game wording.** Chess.com lets the player choose the after-move action [A10]; Pychess uses a switch [A12]. Should King Down's "Next game ›" be a button only, or also a setting?
5. **Chess.com after-move options** come from a search snippet; the help page text did not show them [A10]. Confirm in the Chess.com app before quoting them to the owner.

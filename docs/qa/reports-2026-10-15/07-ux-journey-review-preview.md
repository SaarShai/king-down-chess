<!-- Copied from the run's scratch folder on 2026-10-15. Links to screenshots and raw data point to that folder and do not resolve here. -->

# King Down widget preview: player-journey review

Build: `taste/recommended` at `2ca46584`. Compared with today's build, `f1017eea`.
Reviewer role: senior game UX reviewer, playing as Mia, Kai and Ana.
Date: 2026-10-15. All shots are in `shots/` beside this file.

## Verdict

**The preview is better than today.** A new player moves after 3 taps, not 7.
The board opens in about 0.6 s, not 2.5 s. The iPhone board is 384 px, not 302 px.
"Next game ›", Resume and the rematch with no seat screen each save taps. No
journey is slower than today.

**It is not ready for the owner to accept as "faultless and ready for OpenAI
review".** The preview adds two faults at 320 px (U5, U6). Four old faults stay in
both builds and block a review: a chat-made King-powers game opens a blank board
(U1); the Abort button and the Moves line show through every bottom sheet (U2); an
ogre or maester tap can play a move that the player did not want (U3); and Settings
shows a debug line (U4).

**Recommendation:** accept the direction of the picks. Fix U1–U7 (all small) on
this branch, then accept. The other findings are polish or taste calls.

## Journeys and taps

A tap is a button, piece, square or field tap. Scroll, typing and waiting are not
counted. iPhone is WebKit 393 × 852 (insets 102/118). Small iPhone is WebKit
320 × 568 (63/84). Android is Chromium 360 × 800 (24/80).

| Journey | Today | Preview | Notes |
| --- | ---: | ---: | --- |
| Mia: home to first move | 7 | 3 | Board in 0.5–0.7 s (today 2.5 s). Same on all three devices. |
| Kai: Club, Cards, King powers, Black, to the board (hall) | 8 | 6 | The preview has no seat screen. The king is set in the hall ("Your king" row). |
| Kai: the same request in chat | dead end | dead end | U1. |
| Ana: invite, join, draw, rematch (owner + friend, moves excluded) | 10 + 8 | 8 + 8 | 10 moves add 20 square taps in both builds. |
| Returning player: open the waiting game | 2 | 1 | "Resume · Computer". |
| Returning player: see all three games | 1 | 2 | Resume, then ‹ (U12). |
| Resign and start again | 6 | 3 (Rematch) or 4 (New game) | Rematch swaps the colours. |
| Settings during a game, and back | 3 | 3 | The selected piece stays selected. |

## Findings

Severity: **fault** (wrong, broken or blocks a review), **friction** (slow or
confusing), **polish** (small), **delight idea**. "Both" means that today's build has
the same finding. All screenshot paths are relative to `shots/`.

| ID | Journey | Severity | Finding and evidence | Smallest fix | Taste call? |
| --- | --- | --- | --- | --- | --- |
| U1 | Kai (chat) | fault (both) | The chat creates a computer game with King powers. The widget then opens a blank board. It says "Choose your king and arrangement." and gives no control to choose. It also shows "Offer draw" against the computer. Cause: `server.ts:73` always sends `screen: 'board'`, and `app.ts:202` follows that screen, not the game status. `chat-prev-iphone-kai-create-mount.png`, `sheet-prev-iphone-0-chat-created.png` | Send `screen: 'seat'` for `status: 'setup'` (or route through `router.routeView` when a view comes with it). Add a test. | No |
| U2 | Kai, Ana, all | fault (both) | The Abort button and the Moves line paint over the Menu, card and confirm sheets. Text shows through ("Settings" under "White knight f1 to g3"). This occurs in WebKit and Chromium. Cause: `#board-sheet` is a non-modal dialog with `z-index: auto`; `#abort` has z 2 and `#moves-line` has z 1. `z-prev-iphone-menu.png`, `z-prev-android-menu.png`, `kai-prev-iphone-04-tap-card.png`, `kai-today-iphone-08-menu.png` | Give `.over-sheet` a z-index above the row (for example 10), or open it with `showModal()`. Add a top-element check to the browser check. | No |
| U3 | Mia | fault (both) | Mia taps her ogre to read it, then taps the pawn in front to move the pawn. The second tap plays "Ogre shoves the pawn on e2 to e3". She cannot take it back. A maester next to a friend does the same with a swap. The preview puts new players on this board in one tap, so more of them meet it. `mia-prev-iphone-03-tap-fairy-e1.png` → `mia-prev-iphone-05-moved.png`; `ogre-prev-iphone-1-select.png`, `ogre-prev-iphone-2-tap-own-pawn.png` | When a target square holds your own piece, the first tap shows the shove or swap and asks for a second tap ("Tap again to shove"). See concept 3. | Yes: which tap wins |
| U4 | Settings | fault (both) | Settings shows "Display check: board · window 393x852 · vv …" to every player. It is a temporary ticket-21 probe (`app.ts:239`). A reviewer reads it as debug output. `set-prev-iphone-02-settings.png` | Show it only behind a dev flag or a long press. Remove it when ticket 21 closes. | No |
| U5 | Mia (320 px) | fault (new) | The home card cuts the second button to "Choose a ga…". Today's "Your games" fits. `mia-prev-se-01-home.png`, `mia-today-se-01-home.png` | A shorter word ("Games"), or stack the two buttons below 340 px. | Words: yes |
| U6 | Kai (320 px, iPhone as Black) | fault (new) | Layout B puts the back button in the opponent row. With Cards on at 320 px, the opponent name gets 12 px ("Computer Club" does not show; today 60 px). With King powers too, the fourth coin goes off screen and your own name shows as "H 1". On the 393 px iPhone as Black, the opponent shows as "Co… C.". `coins-prev-se.png`, `coins-today-se.png`, `kai-prev-se-03-after-start.png`, `kai-prev-iphone-03-after-start.png` | When the coins do not fit, put them on a second line under the name, or use 36 px coins with a 44 px touch area. Add 320 px with Cards + powers to the size check. | No |
| U7 | Ana | fault (both) | Ana acts on an old view (her friend moved in the last seconds). She sees "The game changed; reload before you act", and the board does not refresh. A wrong move gives "This move is no longer available. Reload and choose a move." "Reload" is a browser word, and the player must find Menu → Reload. `stale/ana-prev-iphone-15-ana-draw-offered.png` | On a revision conflict, read the game again at once and say "Your opponent moved. Check the board." | Words: yes |
| U8 | Ana | friction (both) | In a live friend game, the other side saw each move 6–27 s late in the harness. The draw offer took 19 s, and the rematch took 23 s to reach the player who offered it. The poll waits 15 s on your own turn, and also before the opponent has done anything. Two headless browsers can make this worse, so check it on a phone. Log: latency lines in this run. `ana-prev-iphone-12-ana-draw-offered.png`, `ana-prev-iphone-16-ana-rematch-sent.png` | Poll every 3 s for 2 minutes after your own action (move, offer, rematch) in a live game. | No |
| U9 | Kai | friction (both) | Lab card names reach players: "Mirror B", "Morph P" (screen-reader names, and coins "Mi", "Mo"). `kai-prev-iphone-03-after-start.png` | Player names without the reading letter ("Mirror", "Morph"). | Yes: names |
| U10 | Kai | friction (both) | The coins show two letters (RA, MO, ST…). The Strike sheet shows the card back, not a face, and its rule text hides under the Moves line (U2). L1 is not in this preview. `kai-prev-iphone-04-tap-card.png` | L1 (real art, name on tap). | Yes (L1) |
| U11 | Kai | friction (new) | Kai never sees his four cards before the first move, and the computer can play a card first ("White turns the pawn on c2 into a bishop"). He never sees a king choice either: Black gets Shadow · Darkness by default. The hall shows the king row, but its 48 px coin is the only control. Today's seat screen showed the king. `kai-prev-iphone-02-powers-on.png`, `kai-prev-iphone-03-after-start.png`, `kai-today-iphone-04-seat.png` | Make the whole "Your king" row open the choice (C2), and show the dealt cards in one line on the board until the first move (C5). | Yes (C2, C5) |
| U12 | Returning | friction (new) | With three games, the home card has "Resume · Computer" and "Play now". No button opens the list. "Play now" makes a fourth game. Resume picked the computer game, though a person also waited (first run: two games waited). `ret-prev-iphone-01-home.png` | When games exist, make the second button "Your games (3)" and put Play now in the hall. Rank a game against a person before a computer game. See concept 2. | Yes (J2) |
| U13 | Returning | friction (both) | A friend invite shows in Your games as "Waiting for an opponent · Just opened". It does not show the code or Share. `ret-prev-iphone-03-back.png` | "Waiting for your friend · 3VY6UN", with Copy. | Yes (W1, J5) |
| U14 | Ana | friction (both) | The code screen has only "Copy the code", and it copies 6 letters. The Features row shows one icon and "You play White", with no rule names. "Ends Oct 22 at 3:38 PM." is unclear. J5 and W1 are not in this preview. `ana-prev-iphone-02-ana-code.png` | J5 (Share first, copy the full sentence) and W1 (word chips). | Yes (J5, W1) |
| U15 | Mia | polish (both) | Mia's first status line holds two ideas: "Your move. Abort ends the game with no result, until each side moves once." Her rating shows as "1500?". `mia-prev-iphone-02-board.png` | Show "Your move." only. Move the Abort note to Menu (J7). Show "New player" in place of "1500?". | Yes (words) |
| U16 | Ana, resign | polish (both) | The end card says "Agreement. Black pawn e7 to e6." and "Resignation. Black paladin g8 to g2, taking the pawn on g2." The reason and the last move run together. `ana-prev-iphone-15-ana-owner-end.png`, `res-prev-iphone-03-end-card.png` | "Draw by agreement." / "You resigned." Put the last move under the board, not on the card. | Yes (words) |
| U17 | Resign | polish (both) | The end card button "Your games" opens a page titled "Play". Against the computer, "Rematch" swaps the colours, so a player who wants the same game again needs 4 taps. `res-prev-iphone-05-hall.png` | Name it "New game" (C4). Offer "Play again" (same side) for computer games. | Yes (C4) |
| U18 | Settings | polish (Sound line new; rest both) | The divider of the "Name and picture" row strikes through its second line. A loose "›" sits between the two art samples. Sound has no line, and it saves on this device only, while the page says "Your settings … go with you to any device". `set-prev-iphone-02-settings.png` | Row padding; draw the arrow as an icon; add "Sound plays on this device only." | No |
| U19 | Mia (Android) | polish (both) | At 360 × 800, an empty band of about 85 px sits between the Moves line and Resign/Menu, while the board is 351 px. `mia-prev-android-02-board.png` | Pin the bar to the Moves line, or give the space to the board. | No |
| U20 | Ana | polish | "Decline" (join review) and "Cancel the game" (code screen) stay thin outline buttons. C1 b names "confirm buttons" as stone, so the owner should say if these count. `ana-prev-iphone-05-bob-join-review.png`, `ana-prev-iphone-02-ana-code.png` | Pale stone for both, if they count. | Yes (C1) |
| U21 | All | polish (both) | Two elements have the id `abort` (status row and Menu). Tests and screen readers can pick the wrong one. Seen in the DOM dump of the Menu. | Rename the Menu item id. | No |
| U22 | Mia | delight idea | Fairy pieces are the game's hook, but the first board names none of them. A rule shows only when Mia taps a piece. J8 is not in this preview. `mia-prev-iphone-02-board.png` | Concept 1 below. | Yes (J8) |

Not tested: the native ChatGPT app, a real phone, the first-time name prompt (the
harness sets the names), Reduce Motion, and landscape.

What works well and must stay: Play now (one tap, a beginner game, no seat), the
board size, "Next game ›" on a board where the opponent moves, the rematch that opens
the board for the accepting player at once, the resign confirm "Lay your king down?"
with "Keep playing" as the safe choice, and the Settings back button that returns to
the same board state.

## Three concepts to make it more fun

Each image is a real preview screenshot with an HTML/CSS overlay. No new art.

### 1. Meet your army (first-game piece intros)

![Concept 1](shots/concept-1-piece-intros.png)

On the first board of a game with new pieces, the new pieces glow, and a short card
names each one in one line. "Got it · your move" closes it. It shows once per new
piece, not once per game. It turns the fairy pieces from a surprise into a promise,
and it also makes U3 less likely. It uses the same rule lines as the piece reads.

### 2. Your tables (game tiles on the home card)

![Concept 2](shots/concept-2-game-tiles.png)

Back in the chat, the home card shows each open game as a small live board. The game
that waits for you glows, and an invite tile shows Share. One tap opens any game. It
fixes U12 and U13, and it makes the home card a place to come back to, not a menu.

### 3. See the trick before it happens (special-move preview)

![Concept 3](shots/concept-3-move-preview.png)

For a shove, a swap, a beast bite chain or a card target, the first tap shows a ghost
of the result and a short line ("Ogre shoves the pawn to e3, then steps to e2"). A
second tap, or "Shove", plays it. This fixes U3, teaches the piece at the moment of
use, and makes a special move feel like a trick, not an accident.

## Method and limits

- Two detached scratch worktrees (preview `2ca46584`, today `f1017eea`), each with its
  own harness on a free port (57827 and 57826). The friend played in a second
  browser through the harness friend seat.
- The harness keeps the last setup between runs. Some runs started at Club or as
  Black for that reason; the findings do not depend on it.
- Delay numbers (U8) come from two headless browsers on one Mac. Check them on a
  phone before you act on the exact values.
- No source file in the preview worktree changed. No commit, push, merge or deploy.

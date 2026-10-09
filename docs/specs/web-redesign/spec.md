# The web redesign: build spec

Status: ready-for-agent. The owner approved the spec and every pick on 2026-10-09: "picks, go ahead".

## 1. What the owner chose

On 2026-10-08 the owner chose a UI and UX redesign from the showcase of demos. Section 1.1 holds the owner's words, copied with no change. They are the ground truth. Where a ticket and the owner's words differ, the owner's words win.

This spec builds the choices in the real app, one pull request per step. Each step has a ticket in `issues/`. A ticket number is a name, not a place in the order; §5 gives the order.

Branches. PR #24 ("Fix the ten web app UI and UX defects") merged into main on 2026-10-09 (57b8792), as decision D1 asks. Each step branches from main with its needs merged, or stacks on the branch of a need that waits for the owner's yes.

Sources on the branch `claude/web-ux-showcase`, at commit dd93e39. Every demo path and line number in the tickets refers to this commit.

- The showcase: `docs/specs/web-ux/showcase/` (`demos/<id>/`, `renders/<id>/`, `kit/tokens.css`, `deck-data.js`).
- The screens spec: `docs/specs/web-ux/screens/spec.md`. Where it differs from this spec, this spec wins (Hint goes; the turn button comes; the title and lessons change; the result becomes the Ceremony).
- The section "Owner choices" of `docs/specs/web-ux/issues/04-redesign-showcase.md` is not in a commit yet. Section 1.1 copies it, so this spec does not need it.

### 1.1 The owner's words

The owner's choices, 2026-10-08, to register only ("don't start yet, just register"):

- **Reading a piece (`f-read`): A, Tap to read.** Our pick was A and B together, so Hold to read (B) is out.
- **Your move (`f-verbs`): A, Verb marks.** The same as our pick.
- **Their turn (`f-their-turn`): A, The tell.** The same as our pick.
- **King powers (`f-powers`): B, A coin by the portrait.** Our pick and the pick of both advisors was A, the tile with words. The coin shows no name. Proposal: a tap on the coin reads the power and its state ("Freeze · 1 left") in the tap-to-read line.

- **The move history at rest: A, One line.** The same as our pick.
- **Undo: rewind, with no words.** The owner chose "Undo plays the moves backward but doesn't say what it takes back." A player can undo only before the other player takes their turn; after that, the move stays. Against the computer, this means Undo works only until the computer's reply starts.
- **No Hint.** The Hint button goes from the game screen.
- **The end of a game: B, Ceremony.** Our pick was A, quiet.
- **The first minute: a plain Start button.** The owner first chose A, Take your first shot, then removed it. No first-shot lesson; the first visit shows one Start button.

- **Home (`f-home`): A, The table.** The same as our pick.
- **Starting a game (`f-new`): A, One short sheet.** The same as our pick.
- **Menu and Extra (`f-menu`): C, Index and Tricks.** The same as our pick.
- **Lessons (`f-lessons`): A, Piece shelf.** The same as our pick.
- **Sharing (`f-share`): parked.** No work on sharing for now. This parks the decision "Sharing words" and the idea "Try this turn" too.

- **Card mode (`u-cards`): C, Coins by the king.** Our pick was A, the folded hand. In a game with kings' powers and cards, the first coin is the power, and it is bound to the king's icon in the drawing. This agrees with the coin by the portrait for powers.
- **Unlocks (`u-crowns`): parked.** The owner works on unlocks separately; how they work is not decided.
- **Online play (`u-online`): A, Previously.** The same as our pick.
- **Workshop sharing (`u-workshop`): A, Card.** The same as our pick. Custom pieces travel as cards. This stays in, outside the sharing park.

- **Where to build: the real app**, in steps, one pull request per step.
- **The base look: the Quiet Table only.** No dark stage, also when the device is in dark mode.
- **Undo and the turn button.** A button plays (submits) the turn and gives the other player their turn. Undo works only before the player presses it. It applies in all modes: the computer, two players on one device, and online.
- **The ceremony: our pick** (`feat-king-down` B, "Ceremony"): the final blow again at half speed, the king falls, "King Down" settles in, three tiles rise.

- **The first deal: B, a chosen seed.** The first game draws a chosen army with an Archer and a Beast.
- **The other picks: ours, for now** (the owner can change them later): levels in words, with no faces; the second look as an opt-in practice aid; Warm joy, with no dial.

When the work starts: the decisions "Reading a piece" and "The power control" take these answers, and the path step "The power tile in words" becomes "The coin by the portrait", "Hint, Undo, Menu" becomes "Undo, Menu", and the prototype's whole-turn Undo changes to the owner's rule. The deck shows them on its next publish.

## 2. Rules for every step

1. **Base.** PR #24 merges first (decision D1). Until then, each step branch starts from `claude/web-ux-defects` (7dee704), and its pull request uses that branch as its base. Step 00 also merges `origin/main` (plugin and docs commits).
2. **One pull request per step.** Each step ships alone and makes the app better at once. Merge only when the owner asks. A step does not ship a button whose destination comes in a later step.
3. **Samples.** A visual step stays a draft pull request until the owner says yes to a rendered sample of the real app from the step branch. Step 00 adds a state table to `docs/specs/web-ux/capture.mjs` for the samples. Sizes: phone 390×844 (touch, DPR 2) and desktop 1440×900 for every visual step; layout steps add 1280×720, 820×1180 and 844×390. Motion steps add one phone video. Renders stay out of Git. The ticket records the owner's words and the date.
4. **Tests.** `npm test` and `npm run check:browser` (all checks) pass before each pull request. Each new browser check runs three times with no failure before the pull request, because a flaky check blocks every deploy. A check of the player's flow presses the real End turn through `endTurn(page)`. The switch `?turn=auto` is for isolated rule probes only.
5. **The plugin page.** Every module that `src/plugin/app.ts` imports, directly or through other modules, also runs in the ChatGPT plugin page. Today that is `src/render/PaintedView.ts`, `marks.ts`, `renderer.ts`, `tap.ts`, `docs/2d-first-pieces/board/scene.mjs` and the modules it imports, `src/move-text.ts`, `src/rules/engine.ts`, `src/rules/rules.ts` and `src/rules/setup.ts`. A step that changes one of them:
   - keeps the old behaviour as the default, and runs `npm run check:browser plugin-ui` and `plugin-ui-http`;
   - records the plugin page size before and after (`node tools/plugin-ui-build.mjs` prints it). The build stops at 4,400,000 bytes, and today the page is 4,291,318 bytes. When a step passes 4,350,000 bytes, stop and ask;
   - adds no new raster image to a shared module (draw new marks and motions on the canvas);
   - tells the plugin session before the pull request. A change to a shared module makes a new board resource version on main. Release the plugin once for each phase, and only when the owner asks (the release guide on main: refresh the ChatGPT connection, then check a fresh board).
6. **Compare.** A behaviour step shows the same states on a build of main and of the branch.
7. **Removed checks.** Each removed or changed assertion line gets a `Removed-check: <file>: <what>, <why>` trailer, also for `tools/ux-defects/` probes. Step 00 routes the checks through helpers, so later steps change helper bodies, not assertion lines.
8. **Pure logic in modules.** Unit tests run with no DOM and no canvas. Each step puts its logic in a pure module with a test, and does not grow `src/main.ts` more than it must. The timing and pose math of each new motion goes in a pure `.mjs` module beside `scene.mjs`, as `king-effects.mjs` does, with a `node --test` file. A browser check reads the drawn result through a scene state hook.
9. **The table never moves.** After ticket 03, the board, Undo, End turn and Menu keep their place in every state (0 px). One exception: the end state on a phone (ticket 14), where the result pane takes the rows under the board and the board keeps its place. Touch targets are 44 px or more. Motion Off and reduced motion show each motion's end frame. Each view has one crimson action at most. A line during play has 8 words or fewer. An off control uses `aria-disabled` and stays in the Tab order, so the focus never drops to the page.
10. **Words.** Player text and docs use ASD-STE100. No AI model name in any file, commit or pull request.
11. **The rules in force.** Player text, the reach, the marks, the lesson goals and the trick detectors read the rules in force (`RULES` and the engine), never demo text. The Archer reading can change (TASKS: the owner chose far2 on 2026-10-07; it waits for its merge). Each Archer text, reach, cause line, lesson goal and trick has one test for each Archer reading.

## 3. Each owner choice, its change and its ticket

| Owner choice | What changes in the app | Ticket |
|---|---|---|
| Where to build: the real app, one pull request per step | This spec: 27 steps in 6 phases; one step waits for the card deal | all |
| The base look: the Quiet Table only, no dark stage, also in device dark mode | A light-only page. The game, the first-visit title and the Workshop surround stand on the parchment floor | [01](issues/01-quiet-table-look.md), [03](issues/03-the-table.md) |
| Undo and the turn button, in all modes | One button hands the turn over against the computer, on one device and in a link game; the computer waits for it; Undo works only before it | [02b](issues/02b-turn-button.md), [02c](issues/02c-send-your-turn.md) |
| Undo: a rewind, with no words; only before the other player's turn | Undo takes back only the staged plies (02b); the board plays them backward with no words on screen (12) | [02b](issues/02b-turn-button.md), [12](issues/12-undo-rewind.md) |
| No Hint | The Hint button goes from the game screen. Lessons keep "Show me". The key-moment mark stays | [02a](issues/02a-no-hint.md) |
| Path edit: "Hint, Undo, Menu" becomes "Undo, Menu" | The bar is Undo · End turn · Menu | [02b](issues/02b-turn-button.md), [03](issues/03-the-table.md) |
| The move history at rest: A, one line | One Moves line under the board (03); the move story and a Review state (11) | [03](issues/03-the-table.md), [11](issues/11-move-story.md) |
| Reading a piece: A, tap to read (hold is out) | A tap reads any piece: the words in the context line and the reach on the board | [04](issues/04-read-on-the-board.md) |
| Menu and Extra: C, index and Tricks | One Menu sheet, Board help beside Guide, Extra as an index (05); Tricks and seals (19) | [05](issues/05-menu-and-extra.md), [19](issues/19-tricks.md) |
| Starting a game: A, one short sheet (then the muster) | The New game sheet (06); the muster and the first-sight tags (15) | [06](issues/06-new-game-sheet.md), [15](issues/15-muster.md) |
| Your move: A, verb marks | Shove arrows, bite numbers, the Beast chain on the board, the key line (08); the refusal that teaches, Take or Shove (09) | [08](issues/08-verb-marks.md), [09](issues/09-refusal-and-choice.md) |
| Their turn: A, the tell | The cause line, ember ring and low note for check (07); the tell (13) | [07](issues/07-cause-lines.md), [13](issues/13-their-turn-tell.md) |
| King powers: B, a coin by the portrait; a tap reads "Freeze · 1 left" | One coin for each side by the portrait; a tap reads it in the context line (D7) | [10](issues/10-power-coin.md) |
| Path edit: "The power tile in words" becomes "The coin by the portrait" | As above. No tile with words ships | [10](issues/10-power-coin.md) |
| The end of a game: B, the Ceremony (our pick of its form) | The final blow again at half speed, the king falls, "King Down", three tiles (14). Retry after a loss, from the path step "King Down: the king lies down; Retry" (23, D13) | [14](issues/14-ceremony.md), [23](issues/23-retry.md) |
| The first minute: a plain Start button | The first-visit title has one Start button | [16](issues/16-first-visit.md) |
| The first deal: B, a chosen seed with an Archer and a Beast | The first game deals `QRNAKBBS` (seed 83) | [16](issues/16-first-visit.md) |
| Home: A, the table | A returning player opens on the last board with Continue | [17](issues/17-home.md) |
| Lessons: A, the piece shelf | Six figures on a shelf in the Guide; four boards for the Guard | [18](issues/18-lesson-shelf.md) |
| Online play: A, Previously | The press sends the link (02c); the friend's turn plays once (21) | [02c](issues/02c-send-your-turn.md), [21](issues/21-previously.md) |
| Workshop sharing: A, card | One piece card for the read-only link, the Share sheet and Your designs | [22](issues/22-workshop-card.md) |
| Card mode: C, coins by the king, the first coin is the power | The power coin first, bound to the king's icon, then the card coins. It waits for the card deal and an engine rule. Ticket 10 builds the coin row so that card coins can join it | [24](issues/24-card-coins.md) (blocked) |
| Our picks for now: levels in words, with no faces | Level words in the opponent strip (03) and one line for each level in the sheet (06) | [03](issues/03-the-table.md), [06](issues/06-new-game-sheet.md) |
| Our picks for now: the second look, an opt-in practice aid | A Board help switch, off by default | [20](issues/20-second-look.md) |
| Our picks for now: Warm joy, with no dial | Sound, Vibration and Motion (Normal, Fast, Off) in the Menu (05); every motion at Warm; all sounds in one key, from the path step "Rewind undo; the tell; sounds in one key" (07) | [05](issues/05-menu-and-extra.md), [07](issues/07-cause-lines.md) |
| Sharing: parked (with "Sharing words" and "Try this turn") | No work. "Copy today's result" and "Copy moves" stay as they are | none |
| Unlocks: parked | No work. No crowns, no locked pieces | none |

## 4. The turn button

### 4.1 Name and place

- One button, `#end-turn`. Ticket 02b puts it in today's action row, in the place of Hint: Undo · End turn · Resign. Ticket 05 moves Resign into the Menu. Ticket 03 moves End turn to the middle of the bar: Undo · End turn · Menu. After ticket 03 it never moves.
- Its label is "End turn" in a game on this device (against the computer, or two players). In a link game it is "Send your turn", the words of the chosen online demo. After a send it is "Send again" (decision D2).
- It is the one crimson control while it is ready. When it is off, its label is ink-soft at 75 % (3:1 or more), so a player can still read it.
- A ready cue: when End turn becomes ready, it pulses once (Motion Off and reduced motion: the colour change only). Against the computer, in the first three games on this device, a turn that waits 4 s or more adds the line "The computer waits for End turn." once.

### 4.2 The turn state

A new pure module, `src/turn.ts`, holds the state. `main.ts` keeps one number, `turnStart`: the count of plies that are handed over.

- A person's ply does not move `turnStart`. A computer's ply moves it at once: a computer's turn hands itself over.
- A press sets `turnStart` to the length of the history. An opened link sets it to the link's ply count. A new game and a Rematch set it to 0.
- `activeSide` is the side to move at `turnStart`. `staged` is the count of plies after `turnStart`.
- The turn is **mid-way** when `pos.haste` or `pos.free` is set (the engine's `holdsTurn`: Haste, Rage, RageB, Rally, GrowthB and the free marks Freeze, Ice Wall, Firewall and Rescue). The side still has its follow-up move or the pass.
- The turn is **ready** (End turn is on) when `staged > 0`, no chain, choice or move animation is open, and one of these is true: the side to move is not `activeSide` (the turn passed); the game ended; or the turn is mid-way and a pass is legal.
- The turn **waits** when `staged > 0` and the turn passed or the game ended. A mid-way turn is ready but does not wait: the board still takes the follow-up move.
- `myTurn()` is false only while the turn waits. The same "waits" state moves the focus to End turn, adds "End turn, or Undo." to `#announce`, starts the search before the press (ticket 13), runs the second look (ticket 20) and drives `?turn=auto`.
- `ended()` is true when the game is finished and handed over. The result words, the game-over refusal, Home and the New game warn line read `ended()`, not `finished()`. A staged end is not ended: Undo still takes it back.

### 4.3 States

| State | Label | Look | A press |
|---|---|---|---|
| Your turn, nothing staged | End turn | off | – |
| Part of a turn that must go on (the lab rule `secondPlayerDoubleFirstTurn`) | End turn | off | – |
| Mid-way (§4.5) | End turn | ready | plays the pass, then hands the turn over. The board still takes the follow-up move |
| The turn waits | End turn | ready | hands the turn over |
| The turn waits after a staged end | End turn | ready | hands the turn over, then the game ends |
| A Beast chain, a choice or a move animation is open; review | End turn | off | – |
| The computer plays its reply | End turn | off | – |
| Link game, the turn is ready | Send your turn | ready | sends; only a success hands the turn over (§4.6) |
| Link game, after the send, or after the end of a link game | Send again | quiet, on | sends the link of the handed-over plies again |
| Link game, after Resign | Send the result | ready | sends the link that holds the resignation (D16) |
| The game ended on this device; after Resign in a game on this device | End turn | off | – |
| A lesson | not shown | – | – |

A double press hands the turn over once (the `busy` guard).

### 4.4 Keyboard and screen reader

- No new global letter key (WCAG 2.1.4). The keys I (ticket 04), Z and R act only while the game area (the board or the bar) has the focus.
- After ticket 03 the Tab order follows the page: their coin (ticket 10), the board, your coin, the context actions, the Moves line, Undo, End turn, Menu.
- When a keyboard move (Enter or Space on the board) makes the turn wait, the focus goes to End turn, and Enter presses it. A mid-way turn does not move the focus, so Enter cannot play the pass by mistake. After the press, the focus goes back to the board and the cursor shows again. After an Undo press that leaves nothing staged, the focus stays on Undo (`aria-disabled`).
- Z is Undo, with the same guard as the Undo button.
- When the turn starts to wait, `#announce` ends with "End turn, or Undo." On one device it ends with "<Side>: End turn." For a staged end it says "Checkmate. End turn, or Undo."

### 4.5 Special turns

The selection, the marks and the words of a follow-up move come from the engine's legal moves (`pseudoMoves` with `pos.haste`, `pos.rage` and `pos.free`). The build adds no game rule.

| Turn | What happens |
|---|---|
| Freeze, Ice Wall (free marks in the official powers set); Firewall, Rescue and GrowthB (lab cards) | The mark (or the draw) is ply 1, and the turn is mid-way. End turn is ready: a press plays the free pass and hands the turn over. The board takes the ordinary move; that move makes the turn wait. Undo takes back the move first, then the mark, and the use comes back ("1 left"). |
| A mark that is not free (other presets) | The mark ends the turn. The turn waits. |
| Haste, Rage, first move | The turn is mid-way. The same piece is selected again. End turn is ready: a press plays the pass `--` (it shows in the moves and in a link), then hands the turn over. A second move makes the turn wait. Undo takes back the second move and selects the piece again. |
| RageB (lab card) | As Rage, but only takes are marked for the second move. |
| Rally (lab card) | A different piece moves next. Nothing is selected again, and the piece of the first move cannot move. |
| The pass words | Today `describeMove` says "ends the turn without the Haste second move" also after a free mark. Ticket 02b gives the free pass its own sentence ("White ends the turn after the mark."). `move-text.ts` runs in the plugin page (rule 5). |
| End turn today (`#end-haste`) | It goes. The turn button does its job. |
| Strike, Flight, Sacrifice, March, Leap | Each is a one-ply turn. The turn waits after it. A Leap move spends a use; its target shows a small coin mark and the sentence "Leap: 1 of 3" (ticket 08). |
| The Beast's bite chain | Before ticket 08, as today: the taps collect bites, and nothing moves until the chain ends. From ticket 08: each bite slides the Beast and takes the victim off the view only (no ply, no save). Nothing is a ply until the last bite or "Stop here". A tap on the Beast means Stop here. "Stop here" shows only when a chain of this length is legal. Undo or Esc puts the board back. End turn is off while a chain is open. |
| Promotion, the Sacrifice choice, Take or Shove | The choice comes before the ply. While it is open, the board, Undo, the review keys and the coins take no input. Cancel stages nothing. Undo takes back the chosen ply (after a promotion, the pawn comes back). A new game or a link cancels the choice, and its result is dropped. |
| A move that ends the game (mate, king capture) | The board takes no more moves. Undo and End turn stay on. The line says "Checkmate. Tap End turn to finish." The press ends the game: the result, and the Ceremony after ticket 14. In a link game the press is the send, and the end starts only after the send succeeds. A computer ply that ends the game ends it at once (decision D3). |
| Draws (stalemate, 50 moves, too little material, threefold repetition) | As a game end. Undo of a repeated position lowers its count again. No draw offer comes. |
| Resign | Resign first drops the staged plies (back to `turnStart`), then gives up the active side. It is final at once. In a link game, see D16. |

### 4.6 Modes

- **Against the computer.** The computer waits for the press. From ticket 13, a search can run while the turn waits (§4.7); it plays nothing until the press. When the computer plays White, its first turn needs no press. `?players=ai,ai` needs no press.
- **Two players on one device.** The press gives the next person the turn. Before the press, the strips and the status name the active side. The board does not turn. Resign gives up the active side, not `game.pos.turn`. Undo is on an honour rule here: the next person can reach it before the press, so the line names the active side ("White: tap End turn.") and does not ask for Undo.
- **Link game (online).** Ticket 02b gives a link game the turn rule with today's send: End turn hands the turn over on this device, and "Send the game link" sends the handed-over plies. Ticket 02c makes the press the send:
  1. A two-player game becomes a link game at its first send (D5). A first "Send the game link" while a turn is staged is itself the press: it sends, then sets `linkSide` to the active side (the side that made the staged plies). With nothing staged, it sets `linkSide` to the side of the last handed-over turn.
  2. From then on, the press is "Send your turn". It builds one fixed link: the history through the staged turn, plus the pass when the turn is mid-way (`gameLink(plies)` writes that many plies). It opens the share sheet on a touch device, else it copies.
  3. Only a share that ends with no error, or a copy that succeeds, commits that link: it plays the pass if needed, sets `turnStart`, saves, gives seals (ticket 19) and starts the end of a staged end. A cancel or a failure keeps the exact staged state. A failed copy says "Could not copy. Your turn is not sent."
  4. The `busy` guard stops a second press. The game counter (`gen`) drops a late result after a new game, a link or an account change.
  5. After the send, Undo is off and the button reads "Send again" (quiet). It sends the link of the handed-over plies. It stays on after the end of a link game, so a lost final link can go again.
  6. The friend's plies come in handed over (`turnStart` = the link's ply count), so Undo cannot take them back.
  7. A link made before this change that ends in the middle of a turn (after a Haste first move or a free mark) still opens: the receiver's app plays the pass for the sender, then sets `linkSide` to the receiver's side.
- **The daily game.** It follows the rules of its mode. "Copy today's result" does not change.
- **Lessons.** No turn button and no Undo (the lesson takes back a wrong move itself). The lesson judges each move at once, as today. Return to game keeps `turnStart` and does not start the computer while a turn is staged.
- **Review.** End turn and Undo are off. The tap rule is in §4.10.
- **The ChatGPT plugin board.** No change (decision D14).

### 4.7 Undo

- Undo works only while a ply is staged (`history.length > turnStart`) or a Beast chain is open. It also works during the player's own move animation, as today (it skips the animation).
- One press takes back one ply, never below `turnStart` (decision D4).
- Undo is off after the press, while the computer plays its reply, after the computer's reply until the player stages a ply, after the end (`ended()`), after Resign, after a link send, in review and in a lesson. After the press, nothing can take a ply back.
- A search before the press (ticket 13) is background work. It does not set `busy` or `thinking`, and it blocks neither Undo, reading nor the press. Undo stops it and drops its result.
- From ticket 12, Undo plays the ply backward on the board. No words show on screen; the normal context line and the Moves line update. The screen reader hears "Move taken back." A press during a rewind ends that rewind at once and takes back the next staged ply, if one is left. A tap on the board only skips. With Motion Off or reduced motion the board changes at once. Before ticket 12 the board changes at once.
- Tricks (ticket 19) are given at the press, so Undo never leaves a seal for a move that did not stand.

### 4.8 Save and account

- The saved game gets a field `staged` (the count of staged plies), written only when it is more than 0. It joins the `GAME` list in `src/account/sync.ts`.
- On restore, a `staged` that is not an integer from 0 to the move count reads as 0. The stored boundary is the move count minus `staged`. `playLan()` can stop early, so `turnStart` is the smaller of the boundary and the count of replayed plies. A short replay never makes a handed-over ply undoable.
- A reload keeps the staged turn: End turn shows again, Undo works and the computer does not start. A lesson keeps `turnStart` for Return to game.
- An old save, or an older app, has no field: every ply counts as handed over (today's behaviour).
- A newer save from the account replaces the game with its own staged count.

### 4.9 The context line

One ordered list for every ticket. The first state that is true gives the line. Each first line has 8 words or fewer; a second line can hold a cause or the key line. A ticket that adds a line adds it here.

| Rank | State | First line (examples) | Action |
|---|---|---|---|
| 1 | Review (11) | The story line of the shown move | Back to game |
| 2 | A choice is open (09) | "Take or shove the guard?" | Take, Shove, Cancel |
| 3 | The result (`ended()`) | The result words | – |
| 4 | A refusal or a notice (it clears at the next tap) | "Only a king can take a guard." / "Tap End turn, or Undo." / one device: "White: tap End turn." | – |
| 5 | Link game, the send (02c) | "Sent. Wait for your friend's link." / after a copy: "Link copied. Paste it to your friend." / "Could not copy. Your turn is not sent." | – |
| 6 | A power is armed (10) | "Freeze · 1 left · Tap an enemy piece." | Cancel |
| 7 | A Beast chain is open (08) | "Bite again, or stop here." / "Bite again." when a stop is not legal | Stop here |
| 8 | A piece is read (04) | The read line | All rules |
| 9 | The turn is mid-way | Haste, Rage: "Move it again, or tap End turn." / Rally: "Move another piece, or tap End turn." / a free mark: "Now make your move, or tap End turn." | – |
| 10 | A piece is selected | The key line (08) | – |
| 11 | A staged end | "Checkmate. Tap End turn to finish." / "Stalemate. Tap End turn to finish." / link: "Checkmate. Tap Send your turn." | – |
| 12 | The second look (20) | "Their archer can take your queen." | – |
| 13 | The turn waits | "Your turn is ready. Tap End turn." / a staged check: "Check. Your turn is ready. Tap End turn." / one device: "White's turn is ready. Tap End turn." / link: "Your turn is ready. Tap Send your turn." / after 4 s in the first three games (§4.1): "The computer waits for End turn." | – |
| 14 | Previously (21) | "Previously: their archer shot your knight." | See again |
| 15 | Check against the active side, nothing staged (07) | "Check! Your move." and the cause | – |
| 16 | The computer plays its reply | "Their move." ("thinking…" shows in their strip after 1 s) | – |
| 17 | The read tip (04), until the first read | "Tap any piece to read it." | – |
| 18 | Your move | "Your move." / one device: "White to move." | – |

### 4.10 What a tap does

One tap table for every ticket. Reading never moves a piece and never drops a kept selection. A hover reads nothing.

| State | A tap on your piece | A tap on an enemy piece | A tap on a marked target | A tap on an empty square |
|---|---|---|---|---|
| Your move, nothing selected | selects it; the line reads it; the board shows its legal verb marks, not its reach | reads it (words and reach outlines) | – | closes a read |
| A piece is selected | selects that piece (a Maester's swap target plays the swap) | not a target: reads it and says why it cannot be taken; the selection stays | plays the move (to read a target on touch, tap the selected piece first to deselect; the I key reads any square) | clears the selection |
| A power is armed | a valid target: plays the power; else keeps the power armed, reads the piece and says why ("A king cannot be frozen.") | as for your piece | plays the power | keeps the power armed |
| A Beast chain is open | the Beast: Stop here | a next bite: bites; else "Tap a marked piece, or stop here." | bites | as for a wrong piece |
| A choice is open | no input | no input | no input | no input |
| The turn is mid-way | as "a piece is selected", with the engine's follow-up moves | as above | plays the follow-up move | as above |
| The turn waits | reads it; selects nothing; then "Tap End turn, or Undo." | reads it | – | "Tap End turn, or Undo." |
| The computer plays; after the end | reads it | reads it | – | closes a read |
| Review | reads it in the shown position | reads it in the shown position | – | closes a read; only Back to game or Esc goes back to the game |

While the turn waits, Show threats draws the threats against the active side in the staged position.

## 5. The order of the pull requests

Before the first step, on main or in the showcase worktree (not in this folder):

- The owner merges PR #24 (D1).
- Commit the "Owner choices" section in `claude/web-ux-showcase` and push that branch, so that a cloud session can read the demos at dd93e39.
- Change the TASKS line "Card mode in the game" from "a card panel" to "coins by the king, the power coin first (owner, 2026-10-08)", with a link to ticket 24.
- Close web-ux ticket 02 (the static game-screen sample); the showcase choices supersede it.

| Order | Ticket | Step | Phase | Needs | Sample | Effort |
|---|---|---|---|---|---|---|
| 1 | [00](issues/00-check-helpers.md) | Check helpers and sample states | 0 Groundwork | PR #24 | no | M |
| 2 | [01](issues/01-quiet-table-look.md) | The Quiet Table look on every screen | 1 The calm table | 00 | yes | M |
| 3 | [02a](issues/02a-no-hint.md) | No Hint on the game screen; Show me in lessons | 1 | 00 | yes | S |
| 4 | [02b](issues/02b-turn-button.md) | The turn button in every mode, Undo before the press | 1 | 01, 02a | yes | L |
| 5 | [02c](issues/02c-send-your-turn.md) | Send your turn: the press sends a link game | 1 | 02b | yes | M |
| 6 | [05](issues/05-menu-and-extra.md) | Menu and Extra in one sheet, Board help, Feel, Resign | 1 | 02c | yes | L |
| 7 | [03](issues/03-the-table.md) | The table: strips, bar, context line, one Moves line | 1 | 05 | yes | L |
| 8 | [10](issues/10-power-coin.md) | The power coin by the portrait | 1 | 03 | yes | M |
| 9 | [04](issues/04-read-on-the-board.md) | Tap to read: the words and the reach | 1 | 03 | yes | L |
| 10 | [06](issues/06-new-game-sheet.md) | One short New game sheet, levels in words | 1 | 05 | yes | M |
| 11 | [07](issues/07-cause-lines.md) | Check and shots show their cause; sounds in one key | 2 The rules you can see | 03, 05 | yes (video) | M |
| 12 | [08](issues/08-verb-marks.md) | Verb marks and the Beast chain on the board | 2 | 04, 10 | yes | L |
| 13 | [09](issues/09-refusal-and-choice.md) | The refusal that teaches; Take or Shove | 2 | 04, 05, 08, 10 | yes | M |
| 14 | [11](issues/11-move-story.md) | The move story and the Review state | 2 | 03, 04 | yes | M |
| 15 | [12](issues/12-undo-rewind.md) | Undo plays the move backward, with no words | 3 The moments | 02b, 11 | yes (video) | M |
| 16 | [13](issues/13-their-turn-tell.md) | The computer thinks while you decide; the tell | 3 | 02b, 03, 07 | yes (video) | M |
| 17 | [14](issues/14-ceremony.md) | The Ceremony | 3 | 02c, 03, 07, 11 | yes (video) | L |
| 18 | [23](issues/23-retry.md) | Retry after a loss | 3 | 14 | yes (video) | M |
| 19 | [15](issues/15-muster.md) | The muster and first sight | 3 | 04, 06 | yes (video) | L |
| 20 | [16](issues/16-first-visit.md) | First visit: one Start button and the first deal | 4 Around the game | 01, 06 | yes | S |
| 21 | [17](issues/17-home.md) | Home is the table | 4 | 03, 05, 06, 11 | yes | L |
| 22 | [18](issues/18-lesson-shelf.md) | Lessons: the piece shelf | 4 | 02a, 05 | yes | M |
| 23 | [19](issues/19-tricks.md) | Tricks and seals | 4 | 02c, 05, 18 | yes | M |
| 24 | [20](issues/20-second-look.md) | The second look, an opt-in practice aid | 4 | 05, 13 | yes | M |
| 25 | [21](issues/21-previously.md) | Link games: Previously | 5 Ready for next | 02c, 11, 14 | yes (video) | M |
| 26 | [22](issues/22-workshop-card.md) | The Workshop card | 5 | none (confirm the Workshop finish tickets on main) | yes | M |
| 27 | [24](issues/24-card-coins.md) | Card coins by the king | 5 | 10; the card deal; an engine rule (owner's yes) | yes | M |

Why this order:

- Step 00 changes no app code. It routes every check through helpers, so later steps change helper bodies, not assertion lines.
- Phase 1 builds the calm table. The turn rule (02b, 02c) comes before the layout: it changes the game loop, the save and the way every check plays. The Menu (05) comes before the table (03), so ticket 03 only moves the Menu button into the bar. The coin (10) comes directly after the table, so no power tile with words ships. For that one step, the power control is an action in the context line.
- Every step changes `src/main.ts`. Do the steps one at a time, in this order. Keep each step's change to `main.ts` to a few call lines, and put the logic in modules.
- "Needs" names every step whose files or parts a step uses. A step branch starts from main with its needs merged.
- Other branches: `claude/arrange-mode`, `claude/turn-countdown`, `claude/archer-far` and `claude/archer-over2` conflict with main and with PR #24. Each waits for its own owner decision in TASKS; this spec does not decide them. When the owner says yes to one, rebuild it on the latest step that changes the same files. The Archer change touches tickets 04, 07, 16, 18 and 19; rule 11 keeps them true under each Archer reading.

## 6. Not in this spec

- **Sharing (parked).** No work. "Copy today's result" (`#share-result`) and "Copy moves" (`#copy`) keep their ids, words and copy path when tickets 05 and 14 move them. No share sheet for results (screens spec O5), no poster, no "Sharing words", no "Try this turn".
- **Unlocks (parked).** No crowns, no locked or grey pieces, no "next piece". The first deal and the first-sight tags use neutral words, not "unlocked" or "new".
- **Live online play.** Online, Away, Reconnecting, the waiting table and the four words need a live channel for the web app. The match service serves only the plugin today.
- **Chat preview pictures** for a game or a design link. They need an image server.
- **Left out by the owner's choices:** faces for levels; hold to read and the ? lens; "Take your first shot"; a dark stage, and a Light and Dark choice.
- **Not built yet; ask with the sample of ticket 22:** the Workshop's "start from a working sample" and its "What changed" line. The chosen card demo recommends them.
- **Card mode** has its own blocked ticket (24). Today `setRules` refuses a hand beside a spendable king power, and the position's `used` field holds a count of power uses or, with a hand, the bits of played cards: the two cannot share it yet. Pure groundwork with no visible change can go first: `needsArming` and `offered` for every card tag, `describeMove` words for every card tag, and a `usesLeft` that reads a hand's bits.
- **Turn countdown** (TASKS, needs-info). It waits for the owner's decision; this spec does not design it.

## 7. Open decisions

The owner accepted every pick on 2026-10-09 ("picks, go ahead"). The text keeps the options as a record. D9 is closed: the owner's words ("the Quiet Table only") decide the title.

**D1. PR #24 merges before step 00.** Options: 1, the owner merges PR #24, then each step branches from main; 2, the steps stack on `claude/web-ux-defects` until PR #24 merges. Pick: 1 (PR #24 merges clean today). On yes: step 00 starts from main.

**D2. The turn button says "End turn", and "Send your turn" in a link game.** Options: 1, "End turn" on this device, "Send your turn" in a link game, then "Send again"; 2, "End turn" in every mode; 3, "Done". Pick: 1 (a link game must say that the press sends). On yes: tickets 02b and 02c use these labels.

**D3. A staged move that ends the game waits for the press.** Options: 1, the game ends on the press (in a link game, on a send that succeeds), and Undo works until then; 2, the game ends at once and Undo is off. Pick: 1 (one rule for every move; a player can take back an accidental stalemate). On yes: tickets 02b, 02c and 14 start the end from the press.

**D4. One Undo press takes back one ply.** The owner's words: "Undo plays the moves backward"; "A player can undo only before the other player takes their turn." They allow both options. Options: 1, one ply for each press, never below the turn start; 2, the whole staged turn for each press. Pick: 1 (after a Freeze and a move, the player can change only the move). On yes: tickets 02b and 12 rewind one ply for each press.

**D5. A game becomes a link game at its first send, and the first send is the press.** Options: 1, "Send the game link" in a two-player game sends the staged turn, turns the game into a link game and locks this device to the side that sent; 2, a "By link" choice in the New game sheet. Pick: 1 (no new row while sharing is parked; the sender cannot move the friend's pieces). Cost: to play both sides on this device again, start a new game. On yes: tickets 02c and 06 add no "By link" row.

**D6. The designer tools stay where the owner put them.** Options: 1, the Clay look, Reset view, the example armies, the custom army and Ogre practice show only with `?lab=1`; 2, they stay visible: Look (Painted, Clay) and Reset view as rows in Extra, and the other armies under "More…" in the army fold of the New game sheet. Pick: 2 (option 1 reverses the owner's Clay switch of 2026-09-27 and needs the owner's yes). On yes: tickets 05 and 06 build option 2.

**D7. A tap on a coin only reads; "Use" in the line arms the power.** The owner's words: "a tap on the coin reads the power and its state ('Freeze · 1 left') in the tap-to-read line." Options: 1, one tap on your ready coin reads and arms, a second tap cancels; 2, a tap reads, and the action "Use" in the context line arms. Pick: 2 (the owner's words; a tap reads and never acts anywhere else). On yes: ticket 10 builds the coin so.

**D8. The Ceremony plays for a win; a loss and a draw end quietly.** Options: 1, your win against the computer, any mate on one device and your win in a link game (after the send) get the Ceremony; a loss, a draw and Resign end quietly; 2, every game end gets it. Pick: 1 (the chosen demo ends a loss and a draw quietly, in its notes). The replay keeps half speed with no time cap; a tap skips at any time. The sample of ticket 14 shows a loss both ways and asks: "Does a loss also get the Ceremony?" On yes: ticket 14 builds option 1.

**D10. The shelf orders lessons Archer, Beast, Maester, Ogre, Guard, Paladin, and only the Guard gets four boards now.** Options: 1, this order, the four-board shape for all, four boards for the Guard only, the other boards after the owner's yes on each position; 2, today's order and one board each. Pick: 1 (the first deal holds an Archer and a Beast). On yes: ticket 18 builds the shelf so.

**D11. The second look works at every computer level and is off by default.** Options: 1, a Board help switch, off by default, every computer level, a loss of 3 pawns or a mate it allows; 2, Beginner only. Pick: 1 (the baseline score comes from the reply that the computer really played, so the random moves of Beginner and Casual do not give false alarms). On yes: ticket 20 builds it so.

**D12. Advisor changes to the chosen demos.** One yes for all four. (a) Bites: the demo numbers the planned bites; the build numbers a bite after it is made (Advisor S). (b) Take or Shove: the demo asks at the square; the build asks in the context line, with Cancel (Advisor A). (c) The power cast: the demo has three beats, about 0.8 s; the build uses 250–350 ms (Advisor S; the deck's "Less motion" card). (d) The move history: our pick named "B as a Menu choice" (five chips); the build has one line and a Review state, with no chips, scrubber or ghost (the advisors: no setting for the history style). Options: 1, the changed forms; 2, the demo forms. Pick: 1. On "the demo": tickets 08, 09, 10 and 11 follow the demo.

**D13. Retry after a loss is practice, not Undo.** Options: 1, after a loss against the computer, "Retry from move N" starts a practice game from the position before the costly move; the lost game stays lost; no "Show a better move" (the owner removed Hint); 2, no Retry. Pick: 1 (it is in the path step "King Down: the king lies down; Retry" and in the chosen demo, and the owner did not remove it). On yes: ticket 23.

**D14. The plugin board keeps its own turn rule.** Options: 1, no change: its server takes each ply at once and has no Undo; 2, a turn button there too, designed with the plugin session. Pick: 1 (the question to the owner named three modes; the plugin server commits each ply). On yes: no plugin ticket.

**D15. The computer searches while you decide.** Options: 1, the search starts when your turn waits and plays nothing until the press; 2, the search starts at the press. Pick: 1 (the reply comes soon after the press). Cost: the phone's processor works while the player decides, for one search of the level's time. On yes: ticket 13, step 1.

**D16. A resignation travels in a link.** Options: 1, the link gets a field `resign`, and after Resign the button reads "Send the result"; 2, the friend does not learn of it. Pick: 1 (today the friend opens a game that can still be played). On yes: ticket 02c.

## Review record

Five reviews read the first draft: three critics and two outside advisors. This revision checks each finding against the owner's words (§1.1) and the code at 7dee704. It accepts a finding only when the finding is true and its fix keeps to the owner's choices.

- **Fidelity critic:** mostly faithful; four major gaps (the night title, the lab switch, the interim power tile, the dropped path items). 11 findings: 11 accepted.
- **Engineering critic:** revise before the owner's yes; one blocker (the turn state) and seven major items. 23 findings: 21 accepted, 2 accepted in part.
- **Rules and UX critic:** not ready; 1 blocker, 12 major, 14 minor. 27 findings: 25 accepted, 2 accepted in part.
- **Advisor A:** revise before build approval; 3 blockers, 14 major, 1 minor. 18 findings: 18 accepted.
- **Advisor S:** revise before build; 2 blockers, 11 major, 2 minor. 15 findings: 14 accepted, 1 accepted in part.

What changed:

- The turn state has "ready" (End turn on) and "waits" (input locked). A Haste, Rage, Rally or free-mark turn keeps its follow-up move (§4.2; four of the five reviews).
- The link send builds one fixed link, commits only on success, and guards a late result. The first send is the press. A resignation travels in a link (D16). A staged end in a link game ends on the send (§4.6; 02c).
- Truer to the owner: the title and the Workshop surround stand on the floor (D9 closed); the designer tools stay visible (D6, option 2); the coin comes directly after the table, so no power tile with words ships; a coin tap only reads (D7, option 2); Retry (23), the first-sight tags (15) and sounds in one key (07) come back; card coins get a blocked ticket (24); the advisor changes to the demos wait for one yes (D12); the Coming row and the live previews of the chosen Menu demo come back (05); the Workshop's "start from a working sample" and "What changed" become a question at the sample of ticket 22, by the same rule as fidelity 4; §1.1 holds a copy of the owner's words.
- The search before the press is background work that never closes Undo. The second look takes its baseline from the reply that the computer really played.
- Safer build: step 00 (check helpers and sample states); ticket 02 splits into 02a, 02b and 02c; the Menu (05) comes before the table (03); every missing dependency is in §5; one context-line list (§4.9) and one tap table (§4.10); a plugin size budget, a complete plugin file list and pure motion modules for Node tests (rules 5 and 8); the Archer reading comes from the engine (rule 11); save validation (§4.8); focus, keys, refusal causes, the Beast chain on the board, the final blow, Leap and the rewind of each special move are defined.

Rejected, in part:

- A game-only module for every new motion (engineering 2): not now. The size risk comes from images; rule 5 measures each step and stops at 4,350,000 bytes.
- A turn button for one device and the computer before the link games (engineering 7): no. Advisor A asks for no mode without the turn rule, so 02b covers all three modes, and only the send itself waits for 02c.
- A tap on an empty square leaves review (rules and UX 5): no. Both advisors keep only Back to game and Esc, so a stray tap does not drop review.
- "With no moves, ask which side this device plays" (rules and UX 20): not needed. "Send the game link" is hidden while no move is played (`main.ts:490`).
- End turn for an old link that ends mid-turn (Advisor S 1): replaced by the fix of rules and UX 21. The receiver's app plays the pass for the sender.
- Two fixes are actions outside this folder: commit and push the showcase (engineering 3), and change the TASKS line for card mode on main (fidelity 5). §5 lists them before the first step.

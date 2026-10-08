# King Down: ideas for the app

Give the player a calm table. Let each unusual move explain the game.
Use one clear action at each step. Put the other choices in a fold.

These are design proposals. The borrowed products give starting points.
The layouts, words, and timings below are proposals for King Down.
Each mockup uses the present painted figures, stone board, emblems, and icons.

## Facts and common rules

- The Archer shoots without moving. Its current shots ignore blockers.
- The Guard cannot capture. Only a king can capture a Guard.
- The Maester swaps with an adjacent friend. Its long king swap needs both pieces on their first rank.
- The Beast can continue after a capture. The player can stop the chain.
- The Ogre pushes a non-king neighbour onto an empty square. It follows into the vacated square.
- The Paladin jumps friendly pieces. It leaves the board after it captures a non-pawn. It never gives check.
- The Paladin stays outside the normal random army. Give it a bonus lesson.
- Freeze has one use in the current powers game. It is a free action before the normal move.
- An always-on power needs a rule view. It does not need an Arm button.
- A daily game shares its starting army. It does not promise the same moves or result.

Use the [current rules](</Users/za/Documents/king down chess/.claude/worktrees/web-ux-showcase/docs/RULES.md>) for every rule example.
The Archer has another proposed reading. Keep the current reading in this round.
The [progression plan](</Users/za/Documents/king down chess/.claude/worktrees/web-ux-showcase/docs/PROGRESSION.md>) is a proposal.
Its crown counts, unlock pace, and daily pool still need decisions.
The [task list](</Users/za/Documents/king down chess/.claude/worktrees/web-ux-showcase/TASKS.md>) also leaves the card deal open.
Mock up six cards as a layout test. Do not present that deal as a settled rule.

Apply these rules to every direction:

- Use Cinzel for large titles. Use Alegreya Sans at 16 px or more for body text.
- Use crimson for the main action. Use words and shapes with every colour signal.
- Meet WCAG 2.2 AA. Check text contrast, focus contrast, text spacing, and text at 200% size.
- Give every touch control a target of at least 44 × 44 px. This includes board squares.
- If the board cannot fit, allow board pan or page scroll. Keep controls usable. Do not overlap square targets.
- Keep the board, Hint, and Undo in the same places through the live game states.
- Give each action a keyboard route. Show focus. Put focus back on the control that opens a sheet.
- Keep one sheet open. Back returns one step. Close returns to the board.
- Use 120–400 ms motion to show a cause, change, or place. End with a useful still view.
- Keep figures still between actions. Play each action once.
- With reduced motion, show that still view at once. Stop any motion that is already running.
- Sound and touch feedback are optional. Give the same information in visible text.
- Use touch feedback only on devices that support it. The browser game must work without it.
- Show rules and effects that the player can know. The interface does not claim to know the next enemy move.

## 1. Five directions

### 1. Open Table

**Thesis:** Make the whole app feel like a clear table with one game on it.

**Feel:** Quiet. Warm. Precise.

**Game screen:** Put the stone board on a plain ivory floor. Keep the present frame and figures.
On a phone, put the opponent above the board and the player below it.
Below the player, reserve three lines for the current rule or action.
Use one closed Moves row. Put Menu, Hint, and Undo in a fixed bottom bar.
On desktop, put the same information in a 320–352 px side column. Leave unused space empty.

**Menus and sheets:** Use flat parchment surfaces with one edge. Use large text rows, not framed tiles.
Put one main button at the foot of a setup sheet. Fold side and army choices.

**Motion:** Open a sheet from its button in 180 ms. Move markers appear once in 120 ms.
Use the present piece motion. Give a power one brief effect that ends in a clear state mark.

**Sound and touch:** Use a soft landing sound. Use one soft tap when a move completes, if supported.
Keep menu changes silent. Let the player turn all sound off from Menu.

**Borrow:** Take the quiet space from [Monument Valley](https://ustwogames.co.uk/our-games/monument-valley-3/).
Take the simple task focus from Lara Croft GO. These are style readings, not copies of their screens.

**Whole app:** Home has Continue, Daily, and New game. Lessons have one task.
Workshop has one piece and a Try it button. Future cards occupy a fold below the player strip.
Use plain opponent names for online play. Put crowns and sharing inside the relevant piece or result view.

**Fit:** The rich art supplies the character. The empty floor makes the board and controls easy to find.

**Main risk:** Too much empty space can hide the depth. Give Extra one clear line: “Make your own piece.”

**One-hour mockup:** Make a phone game at rest, an Archer selected, and Menu open.
Use one desktop frame to show the side column. Keep all four frames on the same grid.

### 2. Quiet Duel

**Thesis:** Treat a special move as a small card-battle event inside a calm chess game.

**Feel:** Focused. Tactile. Charged.

**Game screen:** Put the unchanged stone board on a warm charcoal floor.
Keep two slim parchment player strips. Each strip has a king emblem, a name, and a power label.
Show “Freeze · 1 use” as a small button. It stays much smaller than a board square group.
When the player reads a piece, show a narrow rule card in the fixed context area.
Give that card a piece icon, a name, and one rule. Keep ornament at the card edge.

**Menus and sheets:** Use one vertical menu. In setup, use three compact mode cards.
Open one king picker at a time. Replace it with a summary when the other picker opens.

**Motion:** Use three states: ready, armed, used. When an effect resolves, move its outline to the target in 240 ms.
Keep the target mark after the motion. Put the used state on the power button at the same time.

**Sound and touch:** Use a dry click for arming. Use one low note for a power effect.
Give a power a firmer touch tap than a normal move, if supported. Keep both brief.

**Borrow:** Take the compact hand and effect sequence from [Marvel Snap](https://marvelsnap.com/how-to-play/).
Take the hero and readable keyword focus from [Hearthstone](https://hearthstone.blizzard.com/en-us/news/24244450/welcome-back-to-hearthstone-a-returning-player-s-guide).
Use these patterns for identity, inspection, and cause. Keep the chess turn structure.

**Whole app:** Home shows one saved duel. Setup shows the two chosen kings as a small pair.
Lessons teach one effect at a time. Workshop presents a piece as a rule card that the player can test.
Future cards open from a count label. Unlocks reveal one figure. Online players get the same two strips.

**Fit:** King Down already has kings, emblems, and powers. This gives them a clear home without adding a game economy.

**Main risk:** Dark surfaces can reduce piece contrast. Keep the stone board intact and test the dark figures first.

**One-hour mockup:** Make Freeze ready, armed, and used on a phone.
Add one six-card tray frame. Use existing emblems as placeholders. Draw no new card art.

### 3. Field Notes

**Thesis:** Make every unusual action readable as a cause and an effect.

**Feel:** Clear. Thoughtful. Assured.

**Game screen:** Use the ivory floor and painted board. Put one plain note below it.
An idle note says “Your move.” A selected Maester says “Swap with a friend.”
Use the board's existing marker shapes. Add labels in the note, not text on every square.
On desktop, align the note and Moves in one narrow side column.

**Menus and sheets:** Use short text rows. Put choices in task order.
A piece sheet opens at the selected piece. A review opens at the selected move.
Use one small rule diagram beside each explanation.

**Motion:** Play the cause before the effect. A shove shows the neighbour move, then the Ogre follow.
Keep the whole event brief. Show both final squares in a still replay view.

**Sound and touch:** Use a clear move click. Use a second soft click when a second piece moves.
Use a short pair of touch taps for a swap, if supported. Make the visual pair sufficient.

**Borrow:** Take the clear consequence focus from [Into the Breach](https://subsetgames.com/itb.html).
Take the small, readable board action from [Lara Croft GO](https://store.playstation.com/en-us/concept/225657).
Apply this to public rules and completed moves. Keep enemy plans unknown.

**Whole app:** Home remembers the last actual event. Lessons use “Try it” and “See why.”
Workshop keeps the rule and test result together. Cards state their timing before use.
Online invites show the chosen rules. Shared games open at the move that the sender chooses.

**Fit:** Six new pieces create rule questions. The interface answers those questions where they occur.

**Main risk:** Explanation can become coaching that never stops. Show full explanations only on request.

**One-hour mockup:** Make an Ogre inspection, a shove choice, and the matching history row.
Add a check state with its attacker named. Use one real position for all four frames.

### 4. Daily Table

**Thesis:** Give the player a clear place to start, continue, and stop.

**Feel:** Familiar. Light. Welcoming.

**Game screen:** Use a pale paper floor. Keep the board dominant.
Show “Today's army” as a small setup label when it applies. Keep the date out of the turn status.
Fold Moves. Put the current task and the exit route in plain sight.

**Menus and sheets:** Home leads with Continue when a game exists.
Put Today and New game below it. Show the daily army as one small row of existing piece icons.
Give completed lessons a simple check mark. Keep all lessons available.

**Motion:** Expand Continue into the game frame in 200 ms. Keep a still transition for reduced motion.
Mark lesson completion with one ink check in 160 ms. Keep the check after the motion.

**Sound and touch:** Use a quiet two-note phrase after a lesson. Keep ordinary navigation silent.
Use one soft completion tap, if supported. Let the player mute it before starting.

**Borrow:** Take Wordle's common daily starting point and small share result.
Its daily rhythm appears in this [NYT Games report](https://apnews.com/article/4ab76097d6155a022f089d03e94807c3).
Take short skill practice from [Duolingo](https://blog.duolingo.com/guide-to-duolingo-practice-hub/).

**Whole app:** Learning sits beside Play as a small next step. Workshop keeps unfinished work available.
Future unlocks show lasting progress. Online home shows “Your move” or “Waiting for a friend.”
Card games show their rules before Start. Share results with the setup, so readers know what was played.

**Fit:** Browser players can return after a gap. The home screen helps them recover their place.

**Main risk:** Daily play can create pressure. Use a date and an invitation. Use no countdown or lost streak.

**One-hour mockup:** Make home with a saved game, home without one, and a daily result.
Use the same three action positions. Show one lesson link below them.

### 5. Maker's Cabinet

**Thesis:** Make each piece feel like a small object that the player can know, test, and share.

**Feel:** Curious. Crafted. Personal.

**Game screen:** Use the present parchment and stone. Keep the play controls as spare as Open Table.
An inspected piece gets a flat specimen card: figure, name, rule, and one small move diagram.
Use the figure at its normal proportions. Keep the board square visible behind the inspection state.

**Menus and sheets:** Extra opens with Workshop and Learn as named rows.
Workshop shows one sample piece, “Change it,” and “Try it.” Put saved pieces below the first view.
Keep settings as text controls. Give only pieces the specimen treatment.

**Motion:** After a rule edit, change the move diagram once in 180 ms.
Outline the squares that change. Stop the effect on the next edit.
When a piece unlocks, reveal its existing painted figure in 240 ms, then offer its lesson.

**Sound and touch:** Use a small fitting click when a rule changes. Use a soft paper sound on Save.
Give a saved piece one short touch tap, if supported. Keep editing sound easy to mute.

**Borrow:** Take object care from [Assemble With Care](https://ustwogames.co.uk/our-games/assemble-with-care/).
Take inspectable piece identity from Hearthstone's cards. The cabinet layout is a proposal for King Down.

**Whole app:** Setup shows the army as a strip of pieces. Lessons use the same specimen card.
Future crowns lead to one new specimen. Cards use the same rule structure.
Friends can open a shared piece and try it before a custom game. Game sharing uses a selected move as its cover.

**Fit:** The painted figures and Workshop already give King Down objects worth exploring.

**Main risk:** A collection screen can displace Play. Keep Continue and New game above the cabinet entry.

**One-hour mockup:** Make a piece inspection, a Workshop sample, and the sample after one rule edit.
Use one present Workshop figure. Add one shared-piece preview with Try it.

**Direction pick:** Start with Open Table. Test Quiet Duel as the main alternative.
Use Field Notes to check whether each special action explains itself.
Keep the five directions distinct in the presentation. Do not combine all their surface styles.

## 2. Feature choices

Each “On yes” line gives a small mockup scope. It does not ask for a production build.
Use phone frames at 390 × 844. Use a desktop frame when the layout changes.

### 2.1 First launch and the first minute

**Rule:** Let the player perform one new action before asking them to learn six pieces.

**A. One action.** Borrow Duolingo's short exercise and Lara Croft GO's clear board task.
Show “King Down” and “Chess with six new pieces.” Use the present figure lineup.
Make “Learn the new pieces” primary. Make Play secondary. Give Extra one quiet text row.
Learn opens the current Archer lesson. Say “Shoot the marked piece. Your Archer stays here.”
After that action, show “Play a game” and “Try the Beast.” Keep the lesson sequence optional.

**B. Play, then discover.** Borrow Hearthstone's guided play.
Play opens setup with Beginner selected. On the first game, mark the new pieces once.
Teach the selected piece in the context area. Offer its lesson through the rule card.
This gets chess players into play fast. It asks new players to learn during a full position.

**Pick A.** It proves the game's difference with one action. Play remains available from the title.
Aim for title, one Archer action, and a choice of Play or Beast within the first minute.
Do not require a name, an account, a tour, or all six lessons.

**On yes:** Mock up the title, the existing Archer task, and the task complete state.
Show Play opening the single setup sheet. Check that the player can skip Learn at every point.

### 2.2 The returning player's home

**Rule:** Show the player's place before showing new things to try.

**A. One saved table.** Borrow Hearthstone's return to play and Wordle's daily entry.
Show a small saved-board image, “Against Casual · Move 12,” and Continue as the main button.
Below it, show Today's army and New game. Add “Learn” and “Extra · Make your own piece” as quiet rows.
With no active game, put New game in the main position. Keep the other action positions stable.

**B. Three equal doors.** Borrow Hearthstone's mode hub.
Show Continue, Daily, and New game as three equal cards with painted art.
Put lessons and Workshop beneath them. This makes every activity easy to see, but each competes for attention.

**Pick A.** A returning player usually needs one next action. A saved position provides a useful memory cue.
Use the last actual move as an optional line. Do not infer the player's plan.
If Daily replaces an active saved game, show that consequence before Start.

**On yes:** Mock up home with and without a save. Add the warning state for Daily over a saved game.

### 2.3 Starting a game

**Rule:** Keep the common choices visible. Fold the rare choices with a readable summary.

**A. One setup sheet.** Borrow Hearthstone's ready deck and a simple app form.
Show the three present modes: Play the computer, Kings' powers, and Two players.
Keep Beginner, Casual, Club, and Strong visible for a computer game. Explain the chosen level in one line.
Use Beginner for the first game. Remember the later choices.
Fold side and army under “More options · White · Random army.” Show the current values even when closed.
Inside, use White or Black, then Random, Today's, or Chess army. Explain that both sides get the same drawn pieces.
For powers, open the player's king and power picker. Show the opponent's choice as a summary with Change.
For Two players, show On this device or By link. State what the player does after each move.
Keep Start game in a fixed footer. Put keyboard focus on the heading when the sheet opens.

**B. Prepare a duel.** Borrow Hearthstone's hero choice and Marvel Snap's deck identity.
Choose a mode first. Then show a compact opponent card, a level card, and an army strip.
Each card opens its choice in the same container. Keep a Start button on every step.
This gives powers more character. It adds taps to an ordinary game.

**Pick A.** It serves first play and repeated play with one surface.
Use a 560 px dialog on desktop. Use a full-height sheet with a scrolling body on a phone.
When Start replaces a game, say “This ends your game at move 12.” Label the button “Start new game.”
Keep raw army codes and lab armies outside normal setup.

**On yes:** Mock up computer setup, the open side and army fold, and powers setup.
Add one two-player frame. Check that Start stays visible with long power text.

### 2.4 The game screen and its five states

**Rule:** Change the information, not the layout, when the turn changes.

**A. A quiet frame.** Borrow Monument Valley's focus and Into the Breach's clear state labels.
**B. A duel frame.** Borrow Marvel Snap's player emphasis and Hearthstone's hero identity.

| State | A: quiet frame | B: duel frame |
|---|---|---|
| At rest | Board, two strips, a status, a closed Moves row, and Menu, Hint, Undo. Leave the context area empty. | Same controls. Add king emblems to two slim parchment strips on charcoal. |
| Your turn | Say “Your move.” Selecting a piece fills the fixed context area and shows legal markers. | Outline your strip once in 160 ms. Keep “Your move” after it. |
| Computer's turn | Say “Computer is thinking.” Keep rule inspection available. Disable move actions with a clear reason. | Transfer the outline to the opponent strip once. Use no progress percentage or repeated pulse. |
| Check | Say “Check from their Archer.” Mark the king and attacker with shapes. Keep the cause visible. | Put the same text beside the king emblem. Use one short emphasis at the checking move's end. |
| Game over | Put the outcome beside the board or below it. Keep the final position visible. | Show one brief king fall for a decisive defeat. Put the outcome in the same strip area. |

**Pick A.** The words and board marks carry the state. The frame remains easy to scan.
Make the special move itself the main visual event. Give a draw a still result; neither king falls.
For check, show every checking piece when more than one exists. Let the player request the cause view again.
An Archer shot line shows a shot, not a sliding route. Get all targets and check causes from the engine.
Use a short check sound at contact. Keep the text and shape marks sufficient with sound off.
Show Rematch without waiting for the fall animation. Keep the result outside the king's visible area.

**On yes:** Mock up all five states on one phone grid. Add desktop and short-landscape frames.
Check that the board and main actions move zero pixels between the live states.

### 2.5 Reading your piece or an enemy piece

**Rule:** Inspection must explain the rule without changing the game.

**A. Read at the board.** Borrow Hearthstone's card inspection and Into the Breach's unit detail.
Tap an unselected piece to show its name and one rule in the fixed context area.
For your piece on your turn, also show legal actions on the board.
For an enemy piece, say “Their Archer.” Offer Rule and a small example diagram.
Label a general diagram “Rule example.” Keep it distinct from current legal move markers.
All rules opens the same piece in the Guide. It retains the side and the current effect state.

**B. An inspection tool.** Borrow Hearthstone's card library.
Tap Read, then any piece. Open a sheet with Moves, Captures, and Special.
Use a full example board. Close returns to the same selection.
This keeps play and reading separate, but adds a tool that the player must discover.

**Pick A.** It answers a question at the piece that caused it.
A legal target tap still plays the selected move. It does not turn an intended capture into inspection.
To inspect another piece, cancel the selection first. Give the context area an explicit Close control.
Include the Guard's king exception, the Paladin's loss after a non-pawn capture, and active power effects.

**On yes:** Mock up your Archer, their Guard, and a frozen enemy piece.
Show one example diagram and its label. Check capture and inspection as separate touch paths.

### 2.6 Move history

**Rule:** Keep every move available. Keep the full list closed until the player asks.

**A. A picture sentence.** Borrow Hearthstone's action history and a readable message list.
Closed, show “Moves · 12” and the latest event: “Their Ogre pushes your pawn.”
Open, give each event a full-width row: move number, actor icon, short verb, and target icon when needed.
Use “Your Archer shoots their bishop.” Keep a plain text equivalent for every icon sequence.
Put square names on the selected row. Offer notation as a remembered display choice.
Keep previous, next, and Back to game beside the open list. Use 44 px controls.

**B. Event chapters.** Borrow Into the Breach's short combat account and a book's chapter list.
Show captures, powers, and checks as chapters. Fold quiet moves between them.
An expanded chapter opens its board position. This looks concise, but hides the sequence that explains a tactic.

**Pick A.** Closing the list gives the space back without removing moves.
On desktop, rows fill the spare side column. On a phone, open a scrollable reading sheet.
Keep the live board position unchanged. Mark review clearly when a row changes the viewed position.
Append a new row with a 120 ms, 4 px motion only while the list is open. Keep history silent.
Replay a selected special event on request. Use the actual move, not a guessed story.

**On yes:** Mock up the closed row and six open rows: move, shot, swap, shove, chain, and power.
Add the selected review row. Check that a player can find move 6 without opening several folds.

### 2.7 King powers

**Rule:** Show readiness, the action step, and the remaining uses in one place.

**A. Power at your seat.** Borrow Hearthstone's hero power and Into the Breach's action preview.
Put emblem, power name, and uses in your strip. Keep the opponent's power readable in their strip.
Tap Freeze to arm it. Outline the button and show legal targets. Say “Choose an enemy piece. Then make your move.”
Show Cancel in the context area. A second tap on Freeze or Escape also cancels.
After the target tap, apply Freeze, change the button to Used, and mark the frozen piece.
Say “Now make your move.” Keep normal move targets separate from Freeze targets.
For Flight, state “This uses your turn.” Show only legal empty squares in your half.
For always-on powers, show “Always on.” A tap explains the effect and its exceptions.

**B. One power card.** Borrow Marvel Snap's hand and reveal sequence.
Keep a small power card below your strip. Tap it to read, then choose Use and a legal target.
Reveal the emblem at the target once. Return the card to a small Used label.
This prepares for card mode, but costs more room and one more action.

**Pick A.** One power needs one small control. A full hand needs a tray later.
Both powers remain readable from move one. The reveal moment shows the effect when the power is used.
Move a thin outline from the power control to its target in 240 ms. End with the effect badge and clear text.
Say when the effect ends. A frozen piece's rule view states that it still attacks.
Use one brief sound and an optional touch tap. Show the same cause with both disabled.

**On yes:** Mock up Freeze ready, armed, and used, plus Flight and an always-on power.
Check that the player can state whether the power uses the turn before they commit it.

### 2.8 Hints, undo, and help

**Rule:** Make help useful at once. State the size of an undo.

**A. A directed hint.** Borrow Into the Breach's readable action preview.
Hint selects the piece, shows a still preview, and gives one action sentence.
If the hint needs a power, arm that power first. State its cost in uses and turns before the player acts.
The hint never plays the move. Offer Replay preview and Read rule as quiet actions.
Keep Undo beside Hint. In a computer game, explain that it takes back your move and the reply.
Take a whole multi-step action back. Restore power uses, marks, captures, and turn state together.
Menu has Help. Help opens the current piece or action first, then the full Guide.

**B. A hint ladder.** Borrow Duolingo's small learning steps.
The first hint names a piece. “Show the move” adds its target. “Read the rule” explains the action.
Use the same Undo and Help positions. This preserves more thought, but takes extra taps for a direct answer.

**Pick A.** The player asks for help in a real position. Give an action they can actually perform.
Explain the piece rule when a reliable strategic reason is not available. Do not invent a reason for the computer's choice.
During review, replace hint content with the viewed move's rule. Keep Back to game visible.
If Undo is unavailable, keep its label and give the reason. Do not use a silent grey control.

**On yes:** Mock up a normal hint, a power hint, and Undo after a Beast chain.
Check that the indicated action is legal and that Undo returns to one complete position.

### 2.9 Result, rematch, and review

**Rule:** Show the outcome and the next action while the final board remains readable.

**A. Result beside the board.** Borrow Lara Croft GO's completion pause and Wordle's compact result.
Say “You win,” “The computer wins,” or “Draw.” Add the exact reason and move number.
Use Rematch as primary, Review as secondary, and New game as a quiet action.
Rematch repeats the setup. State the army and level before the player starts it.
New game opens setup with the last choices. It is the route for a new army or another level.
Show up to three “Moves to look at again.” Use factual labels such as “Your Archer shot” or “The final check.”
Review opens the chosen event with previous, next, and Back to result. Keep Rematch available after review.

**B. A duel receipt.** Borrow Hearthstone's match-end identity and Marvel Snap's short result.
Show the two kings, the outcome, and a small strip of three special events in one parchment card.
Put Rematch and Review below it. This gives a stronger ending, but adds art that can cover the final position.

**Pick A.** The board explains the result. The result panel gives the next step.
On desktop, use the side column. On a phone, use the area below the board and a scrollable result body.
In review, show piece rules, power marks, and captured pieces from that historical position.
For a daily rematch, say that the rematch is a separate game. Keep the daily result available.

**On yes:** Mock up a win, a draw, and review of one special event.
Check that Rematch needs one deliberate tap and that the last position is still visible.

### 2.10 The Extra menu

**Rule:** Give optional features clear names and one small reason to open them.

**A. A useful index.** Borrow Duolingo's named practice choices and Hearthstone's collection entry.
Menu holds New game, Help, Sound, Extra, and Resign when it applies.
Extra opens in the same container. Use four groups: Make, Board, Reading, and Account.
Make has Workshop with “Make your own piece.” Put shared-piece tools here when they exist.
Board has coordinates, piece labels, flip, motion, and access controls.
Reading has notation and Copy moves. Put saved game and sharing tools here when the task needs them.
Account has sign-in and sync controls. Explain the benefit in one line. Play stays available without sign-in.
Keep technical experiments in the lab. Keep levels, modes, and the current power in their task screens.

**B. A cabinet of wonders.** Borrow Hearthstone's collection and Assemble With Care's object focus.
Open Extra with one Workshop specimen and three large labelled rows: Make, Learn, and Adjust.
The specimen gives the page character. It makes preferences harder to scan.

**Pick A.** Extra works as a small index, not another home screen.
Put one existing Workshop figure beside the Workshop row. Use one still image and a short rule example.
Keep access controls under a visible “Accessibility” label. Help stays in the first Menu.
Use Extra as the label throughout these mockups. Give every group a direct Back route.

**On yes:** Mock up Menu and Extra with the Workshop row in view.
Check that the player can find sound, labels, Workshop, and account without guessing an icon.

### 2.11 Lessons and the new pieces

**Rule:** Teach the signature action, then its important exception, through play.

**A. Choose a piece.** Borrow Duolingo's targeted practice and Into the Breach's small tactical problem.
Show six existing figures with names and simple completion marks.
Recommend Archer, then Beast, then Maester, Ogre, and Guard. Put Paladin under Bonus.
Each lesson starts with one sentence and a legal target. Offer Play a game after every lesson.
For the Guard, teach “It cannot capture” and “Only a king can take it” in separate tasks.
For the Archer, teach a step and a shot separately. For the Beast, make stopping a chain an explicit choice.
Offer “See it” before a retry. Explain a refused action with the rule that prevents it.

**B. Follow a short route.** Borrow Duolingo's learning path.
Show one next lesson at a time, with the others in a fold. Keep Play and Choose a piece available.
This reduces choice for a beginner. It is slower for a player who needs to learn the enemy's Ogre now.

**Pick A.** King Down's random armies create immediate, specific questions.
Start first launch at Archer. Later, open Learn at the piece the player asks about.
Keep a lesson separate from the saved match. Return to the same match after it.
Use full rule-correct board positions. Keep goals, hints, and accepted moves in agreement.

**On yes:** Mock up the piece shelf, one Archer task, and the Guard exception task.
Check that Play is always available and that a lesson never changes the saved match.

### 2.12 Workshop

**Rule:** Give the player a working piece before giving them a blank editor.

**A. Change one thing.** Borrow Assemble With Care's object test and Hearthstone's ready deck.
On first entry, show one present sample with its figure, name, rule, Change it, and Try it.
Keep Surprise me as a secondary action. Put saved pieces in a fold below the sample.
Change it opens the existing editor. Keep the figure and a plain rule sentence visible.
Put uncommon conditions and restrictions in labelled folds. Keep the editable move grid large enough for touch.
Keep Try it available at the foot. After a test, return to the same edit and test position.
Use the existing estimate of strength with its uncertainty. Do not present the estimate as a promise of fairness.

**B. Build a recipe.** Borrow Duolingo's step-by-step task and a card game's deck builder.
Ask how the piece moves, how it captures, and what makes it special on three short screens.
Keep a preview through the steps. This helps a first design, but splits edits across several places.

**Pick A.** The player can see, change, and test one object in a short loop.
Keep the existing editor and real figures. Improve its entry and folds before changing its structure.
After an edit, outline only the rule or squares that change. Stop the effect at the next input.
Show Save clearly. If the shelf is full, show which piece must be removed before any deletion.

**On yes:** Mock up the sample entry, one changed rule, and Try it.
Check that the player can explain the change without reading a full editor manual.

### 2.13 Settings, sound, and accessibility

**Rule:** Make the app accessible by default. Let preferences make it easier to use.

**A. Plain controls in Extra.** Borrow a simple app preference list and Monument Valley's quiet presentation.
Put Sound in Menu for immediate use. Put its volume and Test sound in Extra.
Use Motion: Normal, Fast, Off. Reduced motion selects the still state for every effect.
Keep coordinates, piece labels, and notation as separate remembered choices.
Give Accessibility a visible heading. Include stronger markers, larger interface text, spoken moves, and shortcut controls.
Use a static before-and-after sample for marker choices. Do not start an animation loop to demonstrate motion.
Keep all buttons labelled. Use shapes with colour. Give single-letter shortcuts an off option and a clear focus scope.

**B. A separate control room.** Borrow the grouped pages in Apple Settings.
Use Sound, Board, Controls, and Access as full pages with previews.
This supports many settings well. It adds navigation before the product has enough settings to need it.

**Pick A.** A short grouped list fits the present app.
Sound starts only after a player action. Keep the muted state visible when it matters.
Save preferences on the device. Sync them when the player chooses an account.
Keep game shortcuts inactive under sheets. Announce turn changes once, without repeated speech during thinking.
At larger text sizes, let the sheet body scroll. Keep its Close and main action usable.

**On yes:** Mock up Extra at normal and larger text sizes, plus the motion-off game state.
Check the whole path with keyboard, sound off, reduced motion, and colour removed.

### 2.14 Future: a hand of power cards

**Rule:** Let the player read a card's action and timing before using it.

**A. A folded hand.** Borrow Marvel Snap's compact hand and Hearthstone's readable card text.
Show “Cards · 6” below your strip in card mode only. A tap opens the hand below the board or in the side column.
Use two rows of three labelled cards on a phone. Keep every card target at least 44 px.
Tap a card to read it in the existing context area. Use an explicit Use action to arm it.
Show targets, Cancel, and whether it uses the turn. Close the tray after resolution and update its count.
Keep any continuing effect visible on the board after the hand closes.

**B. A permanent hand.** Borrow Hearthstone's visible hand.
Keep six small cards along the lower edge. Enlarge the selected card above them.
This speeds repeated card play. It takes space from the board and makes small text hard to read.

**Pick A.** Cards become available when needed. Ordinary chess and powers games keep their clear frame.
For the layout test, use six placeholders with real emblems and plain rule text.
Use only approved card rules in a playable demo. The number, deal, and rarity are separate decisions.

**On yes:** Mock up the closed count, six-card hand, and one armed card.
Check both “Then make your move” and “This uses your turn” as distinct states.

### 2.15 Future: piece unlocks with crowns

**Rule:** Show lasting progress and the exact reward. Keep learning open.

**A. One next piece.** Borrow Duolingo's visible skill progress and Hearthstone's piece identity.
Show one small progress line in setup or after an eligible result. Name the next piece.
State which game and level earn a crown. Use the approved thresholds when they exist.
At unlock, reveal the real figure once. Offer its short lesson and “Play with it.”
Explain the pool change before the next random game. Keep the Guide and permitted sandboxes available.

**B. A full collection.** Borrow Hearthstone's collection grid.
Show every piece, the owned set, and locked figures with requirements. Put it inside Extra.
This makes the long path clear. It gives more space to missing pieces than to the next game.

**Pick A.** One piece and one rule make the reward easy to understand.
Use the proposed Maester, Ogre, Guard order as a test, not a release commitment.
Losses and draws keep progress. Do not use a missed-day penalty or a timer.
When friends' unlocks affect the army pool, show the shared set before Start. Both players use the same agreed pool.

**On yes:** Mock up one crown added, one piece unlocked, and the updated army summary.
Check that the player knows what changes and why the crown counts.

### 2.16 Future: friends and strangers online

**Rule:** Make the opponent, the rules, and whose move it is clear before and during play.

**A. Add seats to the present flow.** Borrow Hearthstone's friendly duel and a simple invitation link.
Keep On this device and By link for today's two-player modes.
When live online play exists, add Friend and Find a player as explicit opponent choices.
Friend creates an invite with mode, powers, army, and any assistance rules in its preview.
Show Waiting for a friend, Their move, Your move, and Reconnecting in the existing status position.
Find a player shows the agreed mode before matching. Put Cancel search beside the status.
Put report, block, and leave controls in Menu. Keep them labelled.

**B. A social hall.** Borrow Clash Royale's social lobby.
Show friends, open games, invitations, and stranger matching on a separate home screen.
This suits a large player community. It adds a second home and several empty states to a young product.

**Pick A.** A named seat extends the present game frame with little visual change.
State whether hints and undo are available before both players start. Use the same rules for both sides.
Keep current link play's “Send the link after your move” instruction until the service actually sends moves.
During reconnection, preserve the position and say whether the last move is confirmed.

**On yes:** Mock up an invite, a friend joining, a stranger search, and reconnection.
Check that the player can tell manual link play from a live connection.

### 2.17 Future: sharing a game or a piece

**Rule:** Let the sender choose one thing. Let the receiver understand it before acting.

**A. A small playable card.** Borrow Wordle's small share result and Hearthstone's deck-code import.
For a game, choose the whole game or one move. Show a still cover, setup, and “Watch this game.”
For a piece, show its real figure, name, rule, and a move diagram. Offer “Try this piece.”
Put an optional short note below the preview. Keep account names out unless the player adds them.
Use a watch link for review and a separate invite action for joining a game.
Show Copied only when copying succeeds. Give a manual copy route when it fails.

**B. A public gallery.** Borrow a card collection and a community creation feed.
Publish pieces and game moments to a browsable shelf with author profiles.
This helps discovery. It needs accounts, search, content controls, and a much larger product scope.

**Pick A.** One shared object gives the recipient a clear next action.
Keep a text version alongside the image. A receiver can inspect a shared piece without replacing a saved design.
Identify a Workshop piece as a custom piece. State the game rules with any shared move.

**On yes:** Mock up the sender preview, a received game move, and a received piece with Try it.
Check that Watch and Join have different labels and that copying has a real success state.

## 3. Surprise and delight: top 15

These ideas use King Down's specific actions.
Keep them small in the live game. Let the player request fuller replays in review.
Small means existing event data and a little interface work. Medium means a new interaction or state view.
Large means a service or a wider product flow. The cost covers a working feature.

### 1. The shot that stays

**Moment:** The Archer captures from a distance.
**See and feel:** In the history row, the Archer icon stays fixed while a shot mark reaches the target icon.
The sentence says “Shoots. Stays on g5.” The player sees the trick without another lesson.
**Borrow:** Marvel Snap's effect resolution, applied to the Archer's stationary capture.
**Cost:** Small.

### 2. A swap with two names

**Moment:** The Maester swaps with a friend.
**See and feel:** The two square labels trade positions once inside the row. A paired marker links the two piece icons.
The player reads one shared action instead of two unrelated moves.
**Borrow:** Into the Breach's clear consequence view.
**Cost:** Medium.

### 3. The shove receipt

**Moment:** The Ogre pushes a neighbour.
**See and feel:** One history row has two short parts: “Pawn moves back. Ogre follows.”
A requested replay marks the pushed square, then the Ogre's final square. The relation becomes easy to remember.
**Borrow:** Lara Croft GO's physical board action and Assemble With Care's linked parts.
**Cost:** Medium.

### 4. One turn, several bites

**Moment:** The Beast continues a capture chain.
**See and feel:** Each capture adds one target icon to the same history row. Keep “Stop here” beside the current task.
After the chain, say “Two bites. One turn.” The player gets a small sense of mastery without a combo banner.
**Borrow:** Hearthstone's chained effect account, applied to the Beast's optional continuation.
**Cost:** Medium.

### 5. The Guard's one exception

**Moment:** The player reads a Guard or tries an illegal capture against it.
**See and feel:** Show the Guard icon, a barrier mark, and a king icon beside “Only a king can take it.”
Offer the Guard lesson as a quiet action. The refusal answers the question and opens a useful next step.
**Borrow:** Hearthstone's keyword explanation at the point of need.
**Cost:** Small.

### 6. The Paladin's exchange

**Moment:** A Paladin captures a non-pawn in a custom game or lesson.
**See and feel:** The history row pairs the enemy's loss with the Paladin's departure. Say “Takes a bishop. Leaves the board.”
For a pawn capture, the row keeps the Paladin icon in place. The contrast teaches the exception through actual events.
**Borrow:** Hearthstone's visible sequence of capture effects.
**Cost:** Medium.

### 7. A thaw with a clear owner

**Moment:** Freeze applies, then ends.
**See and feel:** Put the Frost emblem and “Frozen for its next turn” in the piece's rule view.
At expiry, remove the board badge once and say “Their Ogre is no longer frozen.” Keep the message in Moves.
The player knows which turn passed. A frozen piece still has its attacks.
**Borrow:** Into the Breach's state clarity, with a small Hearthstone-style effect badge.
**Cost:** Medium.

### 8. The power seal

**Moment:** The last use of a spendable power resolves.
**See and feel:** Change the power control to a still emblem with “Used.” Make one brief ink impression at that control.
The effect feels committed. Its unavailable state remains readable with motion off.
**Borrow:** Marvel Snap's clear resolution and the present parchment style.
**Cost:** Small.

### 9. Shelter you can read

**Moment:** The player inspects a Spirit king with a shelter power.
**See and feel:** Outline only the protected neighbours from the current engine state.
For Holy Light, show the relevant four adjacent directions. For Mercy, show its neighbour rule and pawn exception.
The player sees the area and its reason. The marks disappear when inspection closes.
**Borrow:** Into the Breach's unit effect view.
**Cost:** Medium.

### 10. The captured piece remembers

**Moment:** The player opens a captured piece in review.
**See and feel:** Show its name and “Taken on move 14.” A “See that move” action opens the exact historical position.
A small object becomes a route back into the game story. Keep it out of the idle play frame.
**Borrow:** Hearthstone's history inspection and Assemble With Care's object story.
**Cost:** Medium.

### 11. A lesson starts with your question

**Moment:** The player leaves a rule card for Learn.
**See and feel:** Learn opens at that piece, with the same figure and rule heading. Say “Try an Archer shot.”
After the task, Return to game restores the original selection. The player feels that help follows their question.
**Borrow:** Duolingo's targeted practice.
**Cost:** Medium.

### 12. Today's eight figures

**Moment:** The player reads Today's army on home or setup.
**See and feel:** Show the actual eight back-rank icons in order, with “The same starting army for everyone today.”
Tap the strip to read its unfamiliar pieces. The random army becomes an object to explore before play.
**Borrow:** Wordle's shared daily start and Hearthstone's deck identity.
**Cost:** Small.

### 13. A friend takes the other seat

**Moment:** A friend joins a future live invitation.
**See and feel:** The empty opponent strip gains the friend's name and chosen king in one 180 ms change.
The board stays still. Say “Mira joined. You play White.” The connection feels like sitting at the same table.
**Borrow:** Hearthstone's friendly duel, expressed through the present player strips.
**Cost:** Large. The visual change is small. Live joining and reliable connection need the online service.

### 14. Your edit leaves a trace

**Moment:** The player changes a Workshop rule.
**See and feel:** The diagram briefly outlines only the added and removed squares. Keep the new rule sentence beside it.
Try it uses the changed piece at once. The player sees what their edit does before looking at a strength estimate.
**Borrow:** Assemble With Care's test of a repaired object.
**Cost:** Medium.

### 15. A move as a small gift

**Moment:** The player shares a selected special move.
**See and feel:** A small parchment card contains the actor, the target, and one true sentence.
“My Archer shot your bishop without moving.” The receiver can open the actual move and replay it.
Use a text copy too. The shared object carries a rule and a story in very little space.
**Borrow:** Wordle's small share result and Hearthstone's portable deck idea.
**Cost:** Medium. Use existing game data and art. A public feed remains outside this scope.

## 4. Fold and tease

### The first screen

Show the title, “Chess with six new pieces,” the present figure lineup, and two clear actions.
On a first visit, make Learn the new pieces primary and Play secondary.
Put “Extra · Make your own piece” in one quiet, 44 px row below them.
Keep the lineup still and decorative. Give its image a short text description.
Give Learn and Play labels and keyboard focus.

Hide levels, side, army, account, settings, notation, crowns, and the full lesson shelf here.
Play brings the required setup choices into view. Learn brings the first task into view.

### After a return

Show the saved position and Continue first. Show Today and New game beneath it.
Keep Extra in the same place. Show one lesson link only when there is a useful next lesson.
Do not turn the home screen into an activity feed.

### During a game

Show the board, two player strips, turn status, the current action, and Menu, Hint, Undo.
Keep Moves closed by default. Keep power readiness and lasting effects visible when they apply.
Hide the full rule book, full history, settings, Workshop, account, sharing tools, and raw setup codes.
Use the context area for the selected piece, an armed power, a hint, or a rule refusal. Show one task at a time.

### How the hidden features call

- **Workshop:** One real figure and “Make your own piece” in Extra. Tap opens a working sample.
- **Lessons:** A piece rule has “Try this piece.” It opens that exact lesson.
- **Powers:** Setup has the real king emblems and one plain action sentence per selected power.
- **Move history:** The closed row uses a true action verb, such as shoots, swaps, or pushes.
- **Review:** Result shows one special move that can be opened. Its board position is the invitation.
- **Unlocks:** After release, show the next piece and exact progress in setup or result. Keep the progress after a loss.
- **Future cards:** Show a hand count only inside card mode. Introduce the mode with a real rule example when it ships.
- **Sharing:** Offer Share in a selected move or piece view, where the object is already clear.

Use one invitation per surface. Keep it still until the player acts or the task changes.
Use no rotating banners, red dots, repeated sparkle, or modal feature adverts.
Keep consequences outside folds: the current mode, side, army, assistance rules, and any saved game that Start replaces.
Treat connection failures and rule errors as status information. Never hide them in Extra.

## 5. Do not do

1. **A card shell around every control.** It makes the screen look like a card battler, but gives every option equal weight.
   Give cards to inspectable rules or a real hand. Use plain controls for navigation.

2. **A board that moves to make room for help.** It looks responsive, but moves the player's targets under their hand.
   Reserve the context space. Use a reading surface when more text is necessary.

3. **Effects that cover the cause.** Camera shakes, full-screen flashes, and early result overlays make special moves harder to read.
   Mark the affected squares. Keep the final state visible and let the next action proceed.

4. **A mystery rule as a discovery reward.** It may look exciting, but makes a capture or power feel unfair.
   Keep enemy rules, king powers, limits, and exceptions readable before they matter.

5. **A progress system that controls Play.** Daily countdowns, lost streaks, and repeated crown prompts make a quiet game feel like work.
   Keep learning available. Reward knowledge and clear progress. Give New game and Continue the main places.

## 6. The first five builds

1. **Calm play frame:** Fix the board and action positions, then close Moves by default.
2. **Short start path:** Teach one Archer action, then offer one setup sheet with remembered choices.
3. **Read any piece:** Give both sides the same clear rule card, with legal moves and rule examples kept distinct.
4. **Clear power use:** Show arm, target, effect, expiry, and next action in one stable area.
5. **Moves as a picture story:** Use true verbs and piece icons, then link each event to its review position.

## 7. Checks before choosing a direction

Use the same position, words, and tasks in each direction. Let only the presentation change.
Ask a player to start a Beginner game, read an enemy Guard, use Freeze, open move 6, and find Workshop.
Check these results:

- The player finds the next action without a tour.
- The player explains the Guard's exception and Freeze's timing in their own words.
- The player can return from a sheet or review without losing the game.
- A piece selection does not move the board, Hint, or Undo.
- Sound off and motion off preserve the cause and final state of each special action.
- Keyboard use, 44 px touch targets, large text, and colour-free views support the same tasks.
- The player notices one fun feature without a banner or interruption.

Reject a direction if its decoration slows these tasks. Keep the simplest direction that makes the special moves clear.

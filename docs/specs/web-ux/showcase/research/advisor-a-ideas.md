# King Down design ideas

Make the board easy to read. Let each new piece cause one small surprise.
Use Still Table as the base. Test the power treatment from King's Hand inside that base.
Use Living Diagram when a player asks for help.

These are design choices for mockups. They do not change the game rules.
The five directions are alternatives for the whole app. They are not five themes to ship.

## Common rules for the mockups

- Use the painted figures, king art, emblems, icons, and stone board from `public/ui/`.
- Keep parchment, ink, Cinzel titles, Alegreya Sans text, and one crimson main button per view.
- Use 16 px body text. Use Cinzel at 18 px or larger.
- Start with a 390 × 844 phone and a 1440 × 900 desktop.
- On the phone, use a 360 px board. Put player strips above and below it.
- On desktop, put the board beside a 320 px control area. Call this area the side panel.
- Keep Menu, Hint, and Undo fixed. Reserve space for short context text.
- Put long rules in a sheet. Do not let them move the board or its main controls.
- Keep Moves closed by default. Opening Moves must not shrink or move the board.
- On phones, open Moves in the space below the board. Give its rows their own scroll area.
- Use 44 px targets or larger. Do not overlap the targets for adjacent squares.
- At narrow sizes, offer a 44 px target list for board actions when the full grid cannot fit.
- Check short landscape, text zoom, and safe areas before choosing a design.
- Meet WCAG 2.2 AA. Check text contrast, control contrast, focus, and reading order.
- Give each mark a shape and a text label. Color alone never carries a rule.
- Let the keyboard do every task. Trap focus in modal sheets and return it on close.
- Give each sheet a named Close button. Support Escape and a visible Back button where needed.
- Keep the board inactive under a modal sheet. A rule card beside the board is not modal.
- Use 120–400 ms for most motion. Show one cause and one effect, then stop.
- A new action can finish an effect at once. It must not become an extra board move.
- Respect `prefers-reduced-motion`. The still state must carry the same facts.
- Make sound and touch feedback optional. Touch feedback needs device support.
- Keep each sound short. Do not play music or add idle movement by default.
- For an hour mockup, use three linked frames and real art. Use fixed example states.
- Judge the first frame, the action, and the still result. A full engine build comes later.

## Product facts that shape these ideas

- The random army is the same for both sides. The pieces have the same back-rank order.
- The default army has at most one Beast per side. Paladin stays outside the random pool.
- Archer shoots without moving. The current shot pattern ignores pieces in the way.
- Guard cannot take a piece. Only a king can take a Guard.
- Maester can swap with an adjacent friend. Its long king swap has a home-rank rule.
- Beast can continue a capture chain. A later capture in that chain cannot take a king.
- Ogre can push a Guard. Ogre follows the pushed piece. It cannot push a king.
- Paladin survives a pawn capture. It leaves the board after another capture. It never gives check.
- Each king offers a power choice. Spendable powers and always-on powers need different controls.
- In the current powers mode, Freeze has one use. After Freeze, the player still makes a move.
- Use the player name Ice Wall. The art key `ward` does not create another power.
- Card mode stays future work. The six-card deal and its contents still need final decisions.
- Crown unlocks are a proposal. Do not show their thresholds as a live promise.
- Workshop already saves and shares designs. Try it is a test board, not a full game.

The current rules take priority over old examples in design files.
Product sources: `docs/RULES.md`, `docs/MATRIX.md` section C, and `docs/WORKSHOP.md` in the supplied repo.

## 1 Directions

### D1 Still Table

**Thesis:** Make each game feel like a fine board on a clear table.
**Feel:** Quiet. Clear. Warm.

- **Game:** Put the stone board on a flat, light parchment field. Give the figures all the texture.
- Show player names, the turn, three small actions, and one closed Moves row. Remove panel borders inside panels.
- **Home and setup:** Use plain text rows. Show one main action and one small preview of the saved board.
- **Menus and sheets:** Open one plain sheet from Menu. Replace its contents when the player goes deeper.
- Keep the sheet title, Back, and Close in the same places. Keep the main action in its bottom edge.
- **Motion:** Use a 160 ms fade for context changes. Use a 200 ms slide only to show where a sheet comes from.
- Keep the board still during menus, results, and inspection. A move ends with one clear contact.
- **Sound and touch:** Use a dry stone tap for a move. Give a capture one lower tap. Use one optional touch pulse.
- **Borrow:** Take calm space and a clear focal point from [Monument Valley](https://ustwogames.co.uk/our-games/monument-valley/). Take simple lists from Apple Notes.
- **Fit:** The painted figures already carry character. This direction gives them room and reduces reading.
- **Future:** A card hand occupies the space below the board. Unlocks and designs live in Extra. Friends use the same setup sheet.
- **Main risk:** The app can feel too plain. Keep the king art on Home and one distinct effect for each special action.
- **Hour mockup:** Draw Home, a selected Archer, and an open Extra sheet. Test whether a player finds the Archer rule in one action.

### D2 King's Hand

**Thesis:** Treat a power as a valuable object that the player chooses to use.
**Feel:** Tactile. Focused. Potent.

- **Game:** Keep the board large. Put a small king portrait and its power tile in the player's strip.
- Use parchment tiles with a fine ink edge. Reserve a gold edge for the armed tile.
- **Home and setup:** Make each mode a flat card with one image, one name, and one line. Never make a card carousel.
- King selection shows six emblems. Selecting one opens its power choices in the same place.
- **Menus and sheets:** Use a single card-shaped sheet. It opens flat, with no spin or perspective tilt.
- A power tile grows into a readable card beside the board. It contracts before board targeting starts.
- **Motion:** Use three steps: lift the chosen tile, mark legal targets, show the effect at contact.
- The reveal takes up to 320 ms. Keep the king, target, and use count visible throughout.
- **Sound and touch:** Use a soft card tap on arm. Play one king-specific tone only when the power takes effect.
- Give the committed power one optional touch pulse. Arming and spending must feel different.
- **Borrow:** Take card selection and ordered resolution from [Marvel Snap](https://marvelsnap.com/how-to-play/). Take hero-linked powers from [Hearthstone](https://hearthstone.blizzard.com/en-us/heroes).
- **Fit:** King Down already has king art, powers, and a future card hand. This direction gives them one visual grammar.
- **Future:** Deal six readable card tabs below the board. A learned piece enters a collection page. Friend setup compares both kings.
- Workshop shows the piece card beside its test board. It uses the same rule and action labels.
- **Main risk:** Card frames can spread across the app. Limit them to modes, powers, pieces, and future cards.
- **Hour mockup:** Draw a powers game at rest, Freeze armed, and Freeze spent. Show a small six-card hand in a fourth sketch.

### D3 Living Diagram

**Thesis:** Let the board explain one rule at the point where the player needs it.
**Feel:** Precise. Curious. Reassuring.

- **Game:** Use the same painted board. Add crisp marks only to the selected action or inspected rule.
- Put one sentence below the board. Pair it with the affected squares. Keep decoration away from those marks.
- **Home and setup:** Show a small legal example for a selected piece or power. Keep all other examples still.
- **Menus and sheets:** Use an index of names. Choosing a rule closes the index and opens its board example.
- Keep an explicit Return to game action. The example never replaces or saves over the live match.
- **Motion:** Show before and after in 240 ms. A Replay button repeats the example once.
- An Ogre example shows the pushed piece move first, then the Ogre follow. It does not use a generic capture effect.
- **Sound and touch:** Give rule examples a soft two-note cause-and-effect sound. Keep ordinary selection silent.
- Use one optional touch pulse when a legal example completes.
- **Borrow:** Take clear action consequences from [Into the Breach](https://subsetgames.com/itb.html). Take visible rule language from [Baba Is You](https://hempuli.itch.io/baba).
- Use current rules and legal actions. Do not claim to show the computer's next choice.
- **Fit:** The main barrier is learning what unfamiliar pieces do. This direction makes that knowledge available on the board.
- **Future:** Cards show turn cost and targets in the same format. Workshop uses the same move and capture marks.
- Unlocks open one small lesson. Friend games explain unfamiliar pieces before the first move.
- **Main risk:** Help can become a tactical overlay on every square. Keep it off until the player asks.
- **Hour mockup:** Draw enemy inspection, an Ogre Take or Push choice, and Freeze's next-step message. Test each without sound.

### D4 Field Book

**Thesis:** Let each game leave a small, useful page in the player's own book.
**Feel:** Personal. Collected. Thoughtful.

- **Game:** Put the board on an open parchment page. Use one thin rule between play and the side notes.
- Moves stays a closed line. Its open view reads like a short illustrated account, with square names when needed.
- **Home and setup:** Use a bookmark for Continue. Give Daily a date. Put one saved piece or lesson below them.
- **Menus and sheets:** Use a plain index with Play, Learn, Workshop, and Settings. Each destination has one clear title.
- Use flat pages. Do not draw curled corners, leather straps, or moving page shadows.
- **Motion:** A new move writes one short line in 180 ms. A saved moment gains one small bookmark mark.
- **Sound and touch:** Use a light paper sound only when saving a moment. Use the normal stone sound during play.
- Use one optional touch pulse when a bookmark saves.
- **Borrow:** Take folders and pinned notes from Apple Notes. Take the character journal idea from Pentiment.
- **Fit:** The parchment already suits a book. The move list and custom pieces become things worth returning to.
- **Future:** Power cards have a page in the Guide. Crowns mark learning progress. Game and piece links open a clear shared page.
- A friend's game has one shared page with the agreed rules and a Join action.
- **Main risk:** The book can become a second app to manage. Save automatically; require no titles, tags, or filing.
- **Hour mockup:** Draw Home with one bookmark, a move story, and one shared moment. Test whether Continue remains the clear first choice.

### D5 Table for Two

**Thesis:** Make every match feel like a clear invitation to sit and play.
**Feel:** Welcoming. Fair. Human.

- **Game:** Give both player strips equal size. Use names and side symbols. Keep your own action controls near your edge.
- Use a light, flat table around the stone board. Keep network state beside the relevant player's name.
- **Home and setup:** Lead with Continue. Place Play a friend beside New game as a quiet row, when friend play is ready.
- Setup asks who plays before it asks for game details. Both players see the same final rule summary.
- **Menus and sheets:** Use invitation-like sheets with one clear next step. A friend link first shows what game it opens.
- **Motion:** A turn marker moves once to the other player's name. A side change updates names before the next move is possible.
- Keep orientation fixed by default on one device. Offer a visible Flip board action.
- **Sound and touch:** Use one short arrival sound for the opponent's move. Offer an optional pulse when the turn becomes yours.
- **Borrow:** Take approachable tabletop presentation from [Clubhouse Games](https://www.nintendo.com/us/store/products/clubhouse-games-51-worldwide-classics-switch/). Take readable invitations from Messages.
- **Fit:** King Down already supports two players. This gives link play a clear home and prepares for online play.
- **Future:** Explain a shared unlock pool before play. Keep private card hands covered during device handover. Share games and designs as previews.
- **Main risk:** Social controls can crowd solo play. Show invitation, connection, and handover controls only in their own modes.
- **Hour mockup:** Draw a friend invitation, a same-device turn change, and a lost-connection state. Make the recovery action clear.

### Direction pick

Pick **D1 Still Table** for the whole app. It has the lowest reading and control cost.
Borrow **D2's power tile** and **D3's requested explanations** as bounded features.
Keep D4 and D5 as full alternatives for the presentation. Do not combine all five visual styles.
Compare the same position and the same three actions in every direction. Do not judge only the title screen.

## 2 Feature by feature

### F1 First launch and the first minute

**Rule:** Offer one useful lesson and a direct way to play.

- **A — One trick first.** Keep the title, six kings, and 12-piece lineup. Main action: Learn the new pieces.
  It opens one Archer shot, then offers Play a game. Borrow Monument Valley's single clear action.
- **B — Play first.** Main action: Play. Open the short setup with Beginner selected. Teach a piece when the player selects it.
  Borrow Hearthstone's learning through play. Risk: an unfamiliar attack can happen before the player learns its rule.
- **Pick A.** It keeps the approved first-visit emphasis. Make the first lesson a complete, small reward.
- **Build:** Under the title, write “Chess with six new pieces.” Show Learn, Play, and a quiet Workshop link.
- In the lesson, write “Use the Archer to take the marked piece.” Show one legal target and Show me.
- After the shot, write “The Archer stays here.” Offer Play a game and Next piece. Ask for no account.
- Let Play from the title open setup. Show the no-castling and no-en-passant differences under What changes from chess.
- **Hour frame set:** Title → Archer before and after → lesson success. Check that Play never requires six lessons.

### F2 The returning player's home

**Rule:** Put the player's unfinished action first.

- **A — A bookmark.** Show Continue with a small board, opponent, level, and move number. Put Daily and New game below.
  Borrow a reading app's return to the current page.
- **B — A play shelf.** Give Continue, Daily, and New game equal cards. Borrow Netflix's visual choice rows.
  It gives more discovery but makes three actions compete.
- **Pick A.** The player can resume without reading a menu. The saved board helps them recognize the match.
- **Build:** Continue is crimson. Daily and New game are 56 px text rows. Put one quiet Extra row at the foot.
- With no saved game, New game takes the main position. Keep Daily in its own row. Do not start it automatically.
- If Daily replaces an unfinished game, explain that before Start. A date is useful; a countdown is not.
- **Hour frame set:** Home with a saved game, Home without one, and Continue's first board state.

### F3 Starting a game

**Rule:** Show the main choice now. Keep every hidden choice visible in a short summary.

- **A — One short sheet.** Show three modes: Play the computer, Kings' powers, Two players. Reveal only that mode's controls.
  Borrow the grouped choices of a native form and the clear mode cards of Hearthstone.
- **B — Three steps.** Ask who, then how, then which army. Borrow a console game's guided setup.
  Each page is simple, but returning players must step through it again.
- **Pick A.** It supports one-tap starts from remembered choices. It also keeps the three current modes clear.
- **Build:** Keep Beginner, Casual, Club, and Strong visible for computer modes. Select Beginner on the first game.
- Keep Side and Army in one closed row: “White · Random army · Change”. Remember both choices.
- Change opens White or Black and Random, Today's army, or Chess army. Preview the selected army with real piece icons.
- Powers opens your king picker. The opponent's king stays a summary with Change. Show the power's turn cost before Start.
- Two players shows On this device and By link. Future online choices join this branch when they work.
- Keep Start game in a fixed footer. If it ends the saved game, name that game and label the action Start new game.
- Put no raw army code in the normal choices. Keep lab armies outside this flow.
- **Hour frame set:** Computer, powers, and expanded Side and Army. Check that Start is visible in every frame.

### F4 The game screen and its five states

**Rule:** State changes replace information in fixed places. They do not rebuild the screen.

- **A — Fixed controls and context.** Keep player strips, the board, actions, context, and Moves in place.
  Borrow Monument Valley's stable play area. Use Into the Breach's local cause marks when needed.
- **B — A changing lower panel.** Replace the lower controls with the current task. Borrow a card battler's turn panel.
  It makes each moment strong, but moves familiar actions out of reach.
- **Pick A for all five states.** A stable position for controls matters more than a new composition for each turn.

| State | Option A | Option B | Pick and reason |
|---|---|---|---|
| At rest | “Your move”, no selection, closed Moves. | One large “Choose a piece” card. | A. The board already invites a move. |
| Your turn | Move the turn mark to You once. Show legal actions only after selection. | Brighten the whole lower edge. | A. It shows who acts without coloring the board. |
| Computer's turn | “Computer is thinking”. Let the player inspect rules. Block live move input. | Dim the board and show a spinner. | A. The player can still read the position. |
| Check | Show “Check” and mark the checking piece and king. Keep normal control positions. | Use a red screen edge and large warning. | A. It explains the cause. |
| Game over | Keep the final board. Put outcome and Rematch in the context area. | Cover the board with a full result screen. | A. The ending remains visible. |

- For check by a jumper or shooter, mark the endpoints. Do not draw a line that implies a block can stop it.
- Show checking squares only from the engine. Do not imply that every marked king escape is the whole mate explanation.
- During a Beast chain, the context says “Take again, or stop here.” Keep Stop here visible.
- During Haste, show the legal next step and End turn. Do not move Hint or Undo.
- If thought takes longer than expected, show an honest status. Do not use a false percent-complete ring.
- **Hour frame set:** Five still states in the same layout. Overlay them to check that the board and actions move zero pixels.

### F5 Reading your piece or an enemy piece

**Rule:** Reading and committing a move must have clear, distinct states.

- **A — Context card.** Tap a piece with no action armed. Show its name, rule, and See moves below the board.
  Borrow Into the Breach's unit inspection. A selected friendly piece also shows its legal moves.
- **B — Hold to inspect.** Hold any figure to open a small card at that square. Borrow card inspection from Marvel Snap.
  It is compact but hides the method from new players. Fingers can cover the text.
- **Pick A.** A normal tap is easy to find and works with keyboard focus. Offer Inspect as an explicit action during selection.
- **Build:** Show “Guard · Moves one square. Only a king can take it.” The next line says “Cannot take pieces.”
- See moves shows a small rule diagram. Distinguish movement from capture with the existing marker shapes.
- For enemy pieces, label the diagram “How it moves”. Do not present it as a forecast of the enemy's next turn.
- If a friendly piece has a legal capture selected, a target tap still means capture. Enter Inspect to read that target safely.
- Inspect clears the pending action. Show “Inspecting” and a visible Back to move control. It never spends a power.
- **Hour frame set:** Own Archer, enemy Guard, and Inspect during a selected capture. Check that no reading action changes the board.

### F6 Move history

**Rule:** Keep the history closed. Make the open view exact and pleasant to read.

- **A — Short story rows.** Show piece icons, one verb, and a quiet square label. Borrow Apple Messages' readable event list.
- **B — A filmstrip.** Show one board thumbnail per turn and a scrub control. Borrow [Apple Photos' video timeline](https://support.apple.com/en-ie/104968).
  It makes review visual but needs more space and stronger keyboard alternatives.
- **Pick A.** It is compact, readable, and easy to scan. Keep a filmstrip as a later review experiment.
- **Build:** Closed: “Moves 12 · Their Archer shoots your bishop · Show”. Use a chevron and a 44 px row.
- Open rows use “Archer g5 shoots Maester g7” or “Ogre d4 pushes Guard e4 to f4”. Keep optional notation in a second line.
- Ordinary moves stay quiet. Captures, check, powers, swaps, and pushes have distinct icons plus words.
- Add a new row with a 160 ms fade. Move the icon at most 6 px toward its final place. Never replay the full list.
- If the reader scrolls up, keep their place. Offer “2 new moves” at the bottom instead of moving the list for them.
- A row enters Review. Show Previous, Next, and Back to game. All data must describe the viewed position.
- **Hour frame set:** Closed row, five open rows, and one reviewed move. Include a shot, push, and Beast chain.

### F7 King powers

**Rule:** A player must know whether a power is ready, armed, spent, or always on.

- **A — Power tile at the king.** Name the power and uses beside the portrait. Borrow Hearthstone's link between hero and power.
- **B — A power drawer.** Keep one Powers button. Open a full card to inspect and arm. Borrow Marvel Snap's card focus.
  It saves space at rest but hides a legal action behind a drawer.
- **Pick A.** King powers are core actions in this mode. Keep both players' powers visible and readable.
- **Build:** At rest: “Freeze · 1 left”. First tap shows the rule and an Arm Freeze button. Nothing is spent.
- Arming closes long text. Mark valid targets. Show “Choose an enemy piece. Then make your move.” Keep Cancel visible.
- Tapping a marked target commits Freeze. No second confirmation follows. An invalid target changes nothing and gives a short reason.
- The reveal traces king to target once. Add a still Frozen badge. Use the text “Cannot move on its next turn.”
- Then show “Now make your move.” Leave the same player's turn marker active. Reduce the use count only on commitment.
- A spent tile stays as “Used”. It still opens the rule. Always-on tiles say “Always on” and have no Arm action.
- Do not copy Freeze's flow to Strike, Haste, or Flight. Their step prompts must follow their actual turn costs and targets.
- **Hour frame set:** Ready → armed → frozen target with normal move still available. Compare the flow with an always-on power.

### F8 Hints, undo, and help

**Rule:** Help supports the player's choice and tells them what it changes.

- **A — Direct help.** Hint shows one legal move with words and a one-time preview. Borrow a puzzle game's Show me action.
- **B — A hint ladder.** First show a piece, then a target, then the full action. Borrow adventure-game hint books.
  It preserves discovery but adds taps and needs reliable clue text.
- **Pick A now.** Use a ladder later in authored lessons. Live hints must be legal, clear, and fast.
- **Build:** Hint selects the relevant piece and shows “Use Flight, then move this piece to d3” only for a legal powered hint.
- Prepare its required power state, but spend nothing until the player commits. Provide Clear hint.
- Undo states its scope: “Undo your last turn and the reply.” Restore a complete decision point, including powers and capture chains.
- Help on a failed action explains only the local cause: “Only a king can take this Guard.” It does not suggest a better move.
- Computer games keep Hint and Undo visible. A future online match follows its agreed help rules and labels unavailable help clearly.
- **Hour frame set:** Normal hint, powered hint, and Undo's restored state. Check that each message matches the action.

### F9 Result, rematch, and review

**Rule:** Let the player see the ending and choose the next action at once.

- **A — Result beside the board.** Show outcome, reason, Rematch, and Review. Borrow a puzzle game's calm completion state.
- **B — Result card on top.** Show a large king portrait, outcome, and three key moments. Borrow a card battler's result ceremony.
  It celebrates the match but can cover the final position.
- **Pick A.** Keep the king's existing fall visible. Make Rematch usable before any optional celebration ends.
- **Build:** Write “You win” and “Checkmate on move 23”. Use the actual result reason for a draw or resignation.
- Label Rematch with “Same army · You play Black”. Put a changed setup behind New game.
- Show one Move to look at again, with “See all 3” if three exist. Let Review open it in place.
- Do not invent praise or a turning point. Use recorded events or the app's checked analysis. Omit a card when no useful moment exists.
- Closing the result leaves outcome, Rematch, and See result visible. Keep review clearly separate from the live game.
- **Hour frame set:** Checkmate, draw, and review of a named move. Check that a closed result never becomes a dead end.

### F10 The Extra menu

**Rule:** Fold optional features, but give each feature a useful name and one clear reason to open it.

- **A — Two kinds of rows.** Put Try something at the top and Preferences below. Borrow a museum guide's clear index.
- **B — A discovery card.** Put one large suggested feature above all settings. Borrow a streaming app's recommendation card.
  It makes discovery prominent but spends too much space on something the player did not ask for.
- **Pick A.** Use one small, fixed preview inside a row. The menu remains easy to scan.
- **Build:** Extra contains Lessons, Workshop, Board and controls, Sound and motion, Moves and sharing, and Account.
- Workshop says “Make your own piece” with one real figure. Lessons says “Try the Maester swap” with a static two-piece image.
- Board and controls holds threats, coordinates, piece labels, Flip board, keyboard help, and text options.
- Moves and sharing holds notation and copy actions. Account opens its own page with save and sync status.
- Keep New game, Guide, Sound, Extra, and Resign in Menu. Separate Resign from navigation with space and clear copy.
- Use the owner's name “Extra” in these mockups. This changes the draft spec's “Extras” label.
- **Hour frame set:** Menu, Extra, and Workshop preview. Check whether a new player can name what Workshop does before opening it.

### F11 Lessons and the new pieces

**Rule:** Teach one rule, let the player use it, then offer a game.

- **A — One piece at a time.** Show six piece icons and the current task. Borrow [Duolingo's short practice unit](https://blog.duolingo.com/intermediate-mini-units/).
- **B — Learn from this army.** Offer lessons only for unfamiliar pieces in the current army. Borrow a game's contextual training room.
  It feels relevant but makes the full set hard to find.
- **Pick A, with a direct link from B.** Keep a stable lesson index. A piece card can open its exact lesson.
- **Build:** Order the main lessons Archer, Beast, Maester, Ogre, Guard. Show Paladin as a custom-army lesson.
- Give each lesson one legal goal, Show me, and Leave. On success show Next piece and Play a game.
- For Archer, separate its step from its shot. For Guard, teach the king exception in the same lesson.
- For Beast, make Stop here part of the lesson. For Ogre, show why Take and Push can be different actions.
- Show a practice mark after completion. Do not call one solved task mastery. Never require a daily streak.
- Leaving returns to the same caller and position. Lesson saves must stay separate from match saves.
- **Hour frame set:** Archer lesson, Beast continuation, and lesson success. No main-game toolbar appears in the lesson.

### F12 Workshop

**Rule:** Start with a working piece. Let the player change one visible behavior and test it.

- **A — One change to a sample.** Lead with Surprise me, then show the existing editor. Borrow [GarageBand's playable starting instrument](https://support.apple.com/en-euro/guide/garageband-iphone/chsff8c943/ios).
- **B — Blank piece.** Lead with figure choice and empty movement grids. Borrow a drawing app's blank canvas.
  It gives control, but asks the player to understand the tool before it produces anything.
- **Pick A.** It matches the approved Workshop entry. Keep New piece available as a quiet secondary action.
- **Build:** Keep the existing Moves and Takes grids. Add one compact “What changed” line after a rule edit.
- Example: “Can now shoot two squares forward.” Provide Undo beside the line. Do not add another editor tab.
- Let Try it repeat the same small test position after the change. A Reset action restores that test.
- Keep “Estimated worth” explicit. Do not turn its label into a promise that the piece is balanced.
- Show “Saved on this device” separately from Share. A failed save keeps a visible recovery action.
- Shared designs open read-only with Keep a copy. Do not imply that a custom design can enter the full game today.
- **Hour frame set:** Surprise me entry, one changed capture square, and Try it. Use only existing Workshop figures.

### F13 Settings, sound, and accessibility

**Rule:** Put preferences in Extra. Keep access needs easy to find from the first screen.

- **A — Named groups.** Show Board and controls, Sound and motion, and Text and access. Borrow Apple Settings' plain rows.
- **B — Experience presets.** Offer Quiet, Guided, and Expressive. Borrow console accessibility presets.
  Presets are quick, but their hidden bundles make individual changes hard to predict.
- **Pick A.** Each setting has one meaning. A player can change sound without changing visual help.
- **Build:** Offer Sound on or off, volume, touch feedback, spoken moves, and Motion: Normal, Fast, Off.
- Show one Preview action for sound and motion. It plays once. The preview must not change a live game.
- Follow the system's reduced-motion preference. Save a player's explicit choice. Never hide access settings behind sign-in.
- Keep coordinates, piece names or icons, strong board contrast, focus visibility, and keyboard shortcuts in named rows.
- At text zoom, move long rules into the sheet. Preserve access to the board and actions with normal scrolling.
- On first launch, include a quiet Access link with a 44 px target. Also keep it in Menu and Extra.
- **Hour frame set:** Settings, reduced-motion power state, and large-text piece rule. Check the flow with the keyboard only.

### F14 Future card mode

**Rule:** A folded hand still tells the player what actions are available.

- **A — Six named tabs.** Put a compact hand below the board. Tap a tab to open its full card and Use action.
  Borrow Marvel Snap's hand and Hearthstone's selected-card focus.
- **B — One Hand button.** Open all cards in a sheet. Borrow a console inventory drawer.
  It gives the board more room, but hides the most important part of this mode.
- **Pick A.** The hand belongs to the turn. Keep every card's name and usable state in view.
- **Build:** On a phone, use two rows of three tabs. A full-width row can expand into the fixed context area.
- Show the count, card name, use state, and a text reason when it cannot act. Never rely on dim color alone.
- Full cards show effect, target, and turn cost. Use “Then make your move” or “Uses your move”, as the rules require.
- On Use, mark valid targets and show Cancel. Resolve one card at a time. Never cover the target with its card.
- Show six placeholder slots for this mockup. Label it “Proposed six-card hand”. Do not freeze the final deal through visual design.
- For private hands on one device, cover the hand before handover. Require Reveal hand after the next player takes the device.
- **Hour frame set:** Six tabs, one card expanded, and targeting. Use the same power states as F7.

### F15 Future piece unlocks with crowns

**Rule:** Show progress as access to a new thing to learn. Show the earning rule plainly.

- **A — A small progress row.** Put the next piece and crown count on Home and the result. Borrow Duolingo's visible lesson progress.
- **B — A collection wall.** Put all locked pieces on Home. Borrow a card battler's collection screen.
  It makes the full set visible, but gives locks more space than play.
- **Pick A.** Keep the collection in Extra. A progress row does not compete with Continue.
- **Build:** Use an illustrative state: “Next piece: Maester · 1 of 2 crowns”. Label the mockup's values as proposed.
- Explain the proposed earning rule beside progress: a win against Casual or stronger earns one crown.
- On unlock, reveal the existing figure once. Offer Try its move and Later. Preserve Rematch in the result.
- Keep full-piece practice available. Losses and draws never remove crowns. Do not add a claim button for an earned reward.
- The progression proposal has old piece counts. Reconcile it with the current one-Beast rule before a build.
- The daily pool and storage policy also need a final choice. Do not present either as settled.
- **Hour frame set:** Progress row, earned Maester, and optional lesson. The main action stays usable during the reveal.

### F16 Future online play

**Rule:** Say who joins, what rules apply, and whether the game is connected.

- **A — Friend or Find a player.** Keep two named paths under Two players. Borrow Clubhouse Games' clear multiplayer choices.
- **B — A public room list.** Show open tables with rules and seats. Borrow a board-game lobby.
  It supports choice, but makes a quick match require more reading.
- **Pick A.** Friend play needs a clear invitation. Stranger play needs a clear search state with Cancel.
- **Build:** A friend preview shows names, mode, army, powers, and whose move comes first. Join is the main action.
- When progression arrives, show the shared piece pool before acceptance. Both players must use the same pool for that game.
- Keep by-link play distinct from live online play. Do not call a link session Connected if moves still need manual sending.
- Show “Reconnecting” beside the opponent, with the last saved move. Do not report a result until the server confirms it.
- Put Leave, Block, and Report in the match menu. Add no open chat to the first online design.
- Keep hints and undo under the agreed mode rules. A friend takeback needs the other player's acceptance.
- **Hour frame set:** Friend invite, finding a player, and reconnecting. Test what the player can safely do in each state.

### F17 Sharing a game or a piece

**Rule:** Show what the receiver gets before the sender shares it.

- **A — A small preview card.** Show a board moment or piece, a short caption, and an Open action. Borrow Messages' link previews.
- **B — A text report.** Copy notation or piece rules and a link. Borrow a developer tool's export view.
  It is exact and useful, but asks a casual receiver to imagine the result.
- **Pick A, with B as Copy text.** The same share sheet can serve both kinds of content.
- **Build:** Game sharing offers This moment and Whole game. Label the action “View game” to distinguish it from an invitation.
- A piece preview shows its figure, name, and main rule. It opens Try it, with Keep a copy as a separate action.
- Let the sender preview the chosen position and remove names before sharing. Show “Copied” only after copy succeeds.
- Workshop sharing exists today. Game-moment cards and playable challenge links are future additions, not current capabilities.
- **Hour frame set:** Game preview, piece preview, and failed-copy recovery. Keep the receiver's next action clear.

## 3 Surprise and delight

Aim for moments that depend on King Down's unusual rules. Test novelty with players; do not claim a world first.
Each item fits an hour as three still frames. The cost below is the likely product cost, not the mockup time.
Small uses current state and art. Medium adds a focused interaction. Large needs a new saved or shared flow.

### 1 The Archer stays

- **Moment:** The player's first Archer shot, or a replay on request.
- **See and feel:** A small ring holds the Archer's square as the target disappears. The caption says “Still here”.
- **Source:** Into the Breach's clear cause marks. The still Archer makes the rule feel surprising and easy.
- **Cost:** Small. Keep the ring within the current shot effect, then return to normal board marks.

### 2 The Guard has one exception

- **Moment:** The player opens the Guard rule.
- **See and feel:** A small diagram pairs the Guard with a king. The sentence reads “Only a king can take it”.
- **Source:** Baba Is You's direct rule language. The exception becomes the memorable part of the card.
- **Cost:** Small. Show the rule diagram outside the live squares. Do not imply that a distant king can take it now.

### 3 A swap trades names too

- **Moment:** The player previews a legal Maester swap.
- **See and feel:** Two small labels trade places with the figures. The preview ends with each name at its new square.
- **Source:** Keynote's matching-object transitions. The player sees that both pieces move, with neither piece lost.
- **Cost:** Medium. Keep both source squares named in the still preview. Offer one Replay action.

### 4 A Beast sentence grows

- **Moment:** A Beast makes the first capture in a possible chain.
- **See and feel:** The context shows “Beast takes bishop → …”. The next chosen victim fills the last space.
- **Source:** Wordle's compact result cells and a card game's combo receipt. The chain becomes a short, readable object.
- **Cost:** Medium. Keep Stop here beside it. Show only chosen captures; do not praise an untested line.

### 5 Push and take have different endings

- **Moment:** An Ogre has both legal actions on a target.
- **See and feel:** Two miniatures show Take and Push. Push includes the target's next square and the Ogre's new square.
- **Source:** Into the Breach's consequence preview. The player understands the choice before they commit.
- **Cost:** Medium. Both buttons name their action. Use engine-checked end positions.

### 6 The Paladin leaves a receipt

- **Moment:** A Paladin takes a non-pawn piece.
- **See and feel:** One history row shows the victim, then the Paladin, with “Both leave the board”.
- **Source:** Hearthstone's action resolution order. The cost feels like part of the move, not a vanished figure.
- **Cost:** Small. Use a different row after a pawn capture because the Paladin survives it.

### 7 Freeze leaves your turn open

- **Moment:** Freeze takes effect.
- **See and feel:** The use mark empties, but the turn marker stays beside You. Text changes to “Now make your move”.
- **Source:** Hearthstone's separate power and turn controls. The player feels that the action has a clear next step.
- **Cost:** Small. Apply this only to powers with a free-action rule.

### 8 A power keeps its history

- **Moment:** The player uses the last charge of a power.
- **See and feel:** The tile becomes “Used on move 12”. Tap it to read the rule and see that event in review.
- **Source:** Apple Wallet's compact transaction details. The empty control remains useful instead of disappearing.
- **Cost:** Medium. Keep the use count and event reference exact during undo and review.

### 9 Show who protects this piece

- **Moment:** The player inspects a piece that a king power protects.
- **See and feel:** A short connector links piece and king. A named rule explains the protection and its exception.
- **Source:** Into the Breach's relationship marks. The player can explain why a capture is unavailable.
- **Cost:** Medium. Read the actual active power and square relation. The connector disappears when inspection ends.

### 10 Meet the same army

- **Moment:** The player opens the army preview before a game.
- **See and feel:** Tap one piece icon. The matching piece in the opponent's rank gains the same outline.
- **Source:** Clubhouse Games' shared-table feel. The unusual army feels fair because the match is easy to compare.
- **Cost:** Small. Do not animate all pieces at once. Preserve identical order and each side's orientation.

### 11 A guest brings a lesson

- **Moment:** A future friend game includes a piece from the friend's unlocked set.
- **See and feel:** The invitation says “New to you: Ogre” with Try its push. The player can test it before joining.
- **Source:** Clubhouse Games' guest access idea. A friend introduces something useful without creating a store prompt.
- **Cost:** Large. It needs shared-pool rules, familiarity state, and a lesson return path. It does not unlock the piece.

### 12 Your new piece answers at once

- **Moment:** The player changes one capture square in Workshop.
- **See and feel:** A tiny test target becomes reachable in the fixed preview. The line says “This shot is now possible”.
- **Source:** GarageBand's immediate instrument feedback and Baba Is You's visible rules. A rule edit feels tangible.
- **Cost:** Medium. Make the preview a test, with no change to the live match. Do not invent a balance verdict.

### 13 A moment becomes a small challenge

- **Moment:** After a game, the player shares a checked special move.
- **See and feel:** The receiver sees the position before the move and “Can you find the Archer shot?”
- **Source:** Wordle's small shared result and puzzle-game level sharing. The receiver gets an action, not a score boast.
- **Cost:** Large. Save the exact position, rule set, and valid goal. Keep the revealed answer one action away.

### 14 A crown opens knowledge

- **Moment:** A future crown unlock reaches the Maester.
- **See and feel:** The crown mark becomes a small lesson bookmark beside the real figure. “Try its swap” is optional.
- **Source:** Duolingo's short learning units and a reading app's bookmarks. The reward names a new ability to understand.
- **Cost:** Medium. Award progress at once. Do not make watching the reveal or taking the lesson a claim step.

### 15 Read the end of a power

- **Moment:** A temporary mark expires, such as Freeze after the opponent's next turn.
- **See and feel:** The badge clears once. The Moves row adds “Freeze ends”. Inspect shows the piece's normal rule again.
- **Source:** Into the Breach's explicit state changes. The player does not have to guess when the figure becomes available.
- **Cost:** Small. Use turn events, not a wall-clock timer. Never loop a thaw effect.

## 4 Fold and tease

### The first screen

- Keep the real title art and lineup. They carry the identity before the player learns the rules.
- Show “Chess with six new pieces”, Learn the new pieces, Play, and a quiet Workshop link.
- Put Access and Menu in small, labeled controls. Give each its full touch area.
- Use one static Archer detail as the invitation: “It shoots without moving.” Tap the figure to read or try it.
- Keep power selection, crowns, account forms, the full Guide, and all settings out of the first view.
- After a return, replace the first-visit emphasis with Continue. Place Daily and New game below it.
- At smaller heights, let the page scroll. Do not shrink text or place controls on top of the title figures.

### The first game screen

- Show the board, both players, the turn, Menu, Hint, Undo, and the closed Moves line.
- Show king powers only in a powers game. Future cards replace the reserved lower space only in card mode.
- Keep the selected piece rule in one context area. A long rule has a clear Open rule action.
- Hide history rows, notation, army codes, learning progress, account state, and settings from live play.
- Keep Resign in Menu. Put rare display and sharing choices in Extra.
- Never hide a currently required action, such as Stop here, End turn, or Send game link, inside Extra.

### How hidden features call to the player

| Feature | Quiet invitation | When it appears | When it stops |
|---|---|---|---|
| Piece lesson | “Try its move” on the rule card. | The player opens that piece. | When the card closes. |
| Kings' powers | One static king emblem and “Give your king a power”. | New game mode choices. | When a mode is selected. |
| Workshop | One real figure and “Make your own piece”. | Title link and Extra row. | It never interrupts play. |
| Daily | Date and a small army preview. | Returning Home. | Show its result after completion. |
| Review | One exact move with “Look again”. | Result, after the game. | When the player leaves the result. |
| Future cards | A sample hand inside the card-mode choice. | Setup, once the mode exists. | It stays out of other game modes. |
| Future unlock | Next piece and current crowns. | Home and result. | Hide the row when no next unlock exists. |

Use no red notification dot for discovery. Do not cycle invitations while the player reads.
Use the player's explicit action to choose the invitation. Avoid a hidden recommendation system.

## 5 Do not do

1. **Do not make a moving lobby.** Rotating kings, card fans, particles, and a daily banner compete with Continue.
   Keep one focal image and one main action. Stop motion when its job ends.
2. **Do not fold essential rules into silence.** A power's turn cost, the Guard exception, and the active side must remain clear.
   A beautiful one-line rule is harmful when it leaves out the condition that changes the action.
3. **Do not put all features on the board edge.** Tiny radial menus and gestures save space but hide actions and reduce target sizes.
   Use named controls. Give inspection an explicit state during a pending move.
4. **Do not make chess feel like a reward shop.** Avoid locked walls, timed claims, streak loss, and crown confetti after every game.
   Make rewards automatic. Keep practice open and let the player resume at once.
5. **Do not let effects rewrite the move.** A shot must not move the Archer. A push must show the target and Ogre move.
   Use no universal shake, trail, or red flash. It can teach a false rule or hide the cause of check.

## 6 The top five builds

1. **Still Table game shell.** Fix the board and controls in place; compare all five game states before adding decoration.
2. **A safe piece reader.** Let players read either army, then show one exact rule example without risking a move.
3. **A clear power sequence.** Build ready, armed, spent, and always-on states; use Freeze to prove the turn stays clear.
4. **A folded move story.** Turn each special action into a short row with icons, exact squares, and a direct path to review.
5. **One Archer move to begin.** Teach one surprising action, then put Play a game beside Next piece.

## 7 Checks for the next round

- Give a new player each mockup without a spoken tour. Ask them to start, inspect an enemy, and find the last move.
- Check the time to the first meaningful action. Count wrong taps and requests for help. Do not count delight by animation count.
- Ask “What happens after Freeze?” before and after the power flow. Check whether the same player's next move is clear.
- Use an Ogre choice and a Beast chain to test the layout. Ordinary chess moves do not expose these problems.
- Compare phone and desktop at the same state. Test keyboard input, large text, and reduced motion separately.
- Keep an idea only if its still frame is clear and its extra effect explains a change.
- These are ideas and mockup checks. No rendered or browser test is part of this round.

### Changes to the earlier screen proposal

- Keep the approved real art, stable controls, folded Moves, first lesson, Beginner start, and one-tap Rematch.
- Propose an Inspect state for reading during a pending action. The plain enemy-tap change alone does not cover that case.
- Keep spent powers visible. The earlier screen draft hides the power at zero uses.
- Add exact square labels to story rows. The earlier draft prefers story rows without squares.
- Keep Access easy to find. Group settings inside Extra rather than removing their clear names.
- Treat the new lesson order and the explicit power Arm step as choices to test, not settled product changes.
- Keep the existing Workshop editor. Add only a focused change preview to the first experiment.

### Input notes

The brief, current rules, Matrix section C, merged review, sample notes, screen spec, and Workshop define the current product.
The progression proposal in `docs/PROGRESSION.md` defines future choices, with unresolved items.
The open tasks in `TASKS.md` keep the card deal, Archer change, and other rule work separate from this design.
Borrowed sources name a pattern. Each King Down behavior above is a proposed adaptation.

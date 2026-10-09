# King Down showcase: judgment

Keep the proposed blend. It gives the painted board the main role. The best ideas explain a rule through play. They give King Down a clear identity.

Do not build the app exactly as `proto` shows it. Some feature demos solve their tasks better. Fix the power-turn state first. Then join the best screens with one board layout and one set of controls.

I review 27 demos, including the comparison page and kit. I inspect all 54 phone and desktop sheets, all metadata files, and selected source code. I also check a recorded power turn with the bundled rules engine. This is a design review, with targeted rule checks. It is not a full browser or accessibility test.

**Demo verdicts and feature picks**

**`dir-quiet-table` — KEEP.**
Best: The light floor gives the figures space. Check has a clear cause. The board stays visible at the end.
Main issue: The desktop opens the move list by default. That brings back a feature the owner wants to fold.
Fix: Use one last-move line on both sizes. Open the list on request. Keep A, Light floor, as the default.

**`dir-coach` — CHANGE.**
Best: The Guard refusal explains a strange rule at the exact place where the player needs it.
Main issue: Help changes with computer level or game count. Neither tells you if the player knows a rule.
Fix: Keep rule help at every level. Let the player turn extra hints on. Clear a new-piece tag after the player reads it. Keep Retry available after any computer loss.

**`dir-arena` — KEEP.**
Best: The opponent's power reveal explains why an Archer suddenly moves like a queen. This is a useful card-game idea.
Main issue: Portraits, coins and the open history tray give the player too many things to decode.
Fix: Use B's folded tray on both sizes. Replace the unnamed coin with `Freeze · 1 left`. Keep one power reveal and a still result.

**`dir-chronicle` — CHANGE.**
Best: Plain verbs make shots, swaps and bites easy to understand. Previously helps a player return to a game.
Main issue: Three live story lines, a large move heading and an end sheet make the story compete with the board.
Fix: Keep one last-move line. Put the three-panel recap behind Review. Keep the final board clear.

**`dir-pocket` — DROP as the main layout.**
Best: The drag lens, lower controls and landscape rail solve real phone problems.
Main issue: Read and result sheets cover the lower ranks while a large area above the board stays empty.
Fix: Move the useful controls into Quiet Table. Put a read card in the space below the board. Keep the drag lens and landscape rail as optional input aids.

**`dir-compare` — CHANGE.**
Best: The same moment picker makes the differences easy to see.
Main issue: Read, Select and computer level differ between directions. The comparison is not controlled.
Fix: Use the same piece, power, level and saved state in every frame. Use C, two views, for the final choice. Five views are an overview only.

**`feat-first-minute` — KEEP.**
Best: The first shot teaches the main surprise before a form or a rule page appears.
Main issue: The move from the small lesson to the full army can look like the app resets the player's action.
Fix: Add one line: `Now play a full game.` Keep the Archer in the same place through the change.
Pick: Agree with A. Keep Play and Skip available. Use its Archer-and-Beast first army in the complete app.

**`feat-home` — KEEP.**
Best: Table and Continued keep the board in the same place. The last move helps the player remember the game.
Main issue: Starting Today's army or a king game replaces the saved game. A small note carries a large consequence.
Fix: Route these actions through the same New game sheet. Name the game that Start replaces. Do not replace it when the player only opens a preview.
Pick: Agree with A plus C as one folded Today line. Keep B's king display for discovery, outside the usual return path.

**`feat-new-game` — CHANGE.**
Best: The folded Side and Army row names its values. Start stays in one place.
Main issue: C gives the computer a named character without a distinct style of play. It promises more than a level change.
Fix: Ship the four clear level names. Add named opponents only when their play differs in a way the player can learn.
Pick: Agree with A and returning-player B. Drop C from the first build. Keep the opponent's king and power readable before Start.

**`feat-muster` — KEEP.**
Best: Both armies arrive together, file by file. This shows the shared-army rule with little text.
Main issue: Moving a new piece clears its learning dot. A move does not show that the player understands its special rule.
Fix: Clear the dot after a read or an explicit dismissal. Do not keep adding dots after the player turns teaching off.
Pick: Agree with A. Keep the short duration, skip action and still frame. Do not repeat the muster on Rematch.

**`feat-your-move` — CHANGE.**
Best: Shove arrows show where the other piece lands. Plain dots cannot explain this move.
Main issue: In Choice, the two small outcome cards cover the board squares needed to compare them.
Fix: Put Take and Shove in the fixed context area. Show the chosen outcome on the full board before the final choice.
Pick: Agree with A. Keep distinct marks for each action. Show that the Beast's next bite is optional, not a forced numbered route.

**`feat-their-turn-check` — CHANGE.**
Best: The line from the checking Archer explains the shot over the pawn. The word Check also carries the signal.
Main issue: The tell adds 240 ms to every reply. The source adds 320 ms with reduced motion. The player pays this cost on every turn.
Fix: Fit the tell into the normal move duration. Omit its extra wait in Fast, Off and reduced motion. Keep a still cause line in all cases.
Pick: A for normal motion; B for fast or reduced motion. Disagree with an unavoidable tell.

**`feat-hold-to-read` — KEEP.**
Best: The card explains the piece, its current state and its rule. The short-phone version keeps the action bar clear.
Main issue: `Tap any piece to read` is false when that piece is a marked enemy target. The same tap then plays a move.
Fix: While a piece is selected, say `Tap to play. Hold to read.` Give the keyboard the same safe read action.
Pick: Agree with A and B together. Drop C's separate lens mode. Keep reading and move selection visually distinct.

**`feat-help` — CHANGE.**
Best: Undo names its scope and shows what comes back. A ghost hint gives the player a clear next action.
Main issue: Second look can interrupt a planned sacrifice. The demo can also warn about a piece already open to a take.
Fix: Make Second look an opt-in practice aid. Compare the position before and after the move. Do not infer a mistake from a possible take alone.
Pick: Agree with A for games and B for lessons. Disagree with Second look on by default for all Beginner games.

**`feat-move-story` — CHANGE.**
Best: A single sentence answers what the opponent just did. The special verbs are more useful than five unexplained icons.
Main issue: An old Beast chain plays over the live board. Faint old pieces and current pieces can look like one position.
Fix: Show the actual old position with `Review · move 7` and Back to game. Disable live moves until the player returns.
Pick: Agree with A. Do not add B and C as settings in the first build. Keep exact squares available on the selected row.

**`feat-menu-extra` — CHANGE.**
Best: The plain index is quick to scan. Tricks rewards discovery without a timer or a missing-item count.
Main issue: Board help sits in Extra beside optional play features. It is a basic need for someone who cannot read the board.
Fix: Put Board help in Menu beside Guide. Keep Workshop, Tricks and future modes in Extra. Show the seal once; keep its details in Tricks.
Pick: Agree with A plus C. Drop B's cabinet. Keep one still preview for each Board help control.

**`feat-lessons` — KEEP.**
Best: The Guard lesson teaches a move, a use and an exception. The final choice checks understanding.
Main issue: Only the Guard has this complete sequence. The other pieces still prove only one action each.
Fix: Add an exception and a free choice to each piece lesson before using Learned as a completion claim. Keep lessons independent of the saved game.
Pick: Agree with A. A random army creates a specific question, so the player needs direct access to any piece. Keep Next as a suggestion.

**`feat-king-down` — CHANGE.**
Best: The king falls on the board. Rematch stays available. The name of the game becomes a physical action.
Main issue: The winning recap joins moments from two positions that do not form one recorded game. It is not a true account of that win.
Fix: Build every recap from one complete game. Keep the original loss when Retry opens a practice position.
Pick: Agree with A, optional final-move replay and Retry. Keep `Resign` as the menu label, with `Lay your king down` inside its confirmation.

**`feat-share` — CHANGE.**
Best: The player sees the exact text or picture before sharing. Copy success waits for a real result.
Main issue: The emoji row means little to a friend who has never played. The stronger hook is `Four bites in one turn`.
Fix: Use plain words by default. Add the event marks as an optional detail. Keep the mode and computer level in the shared result.
Pick: Agree with A first and B second. Disagree with emoji as the default. Add C when its link reliably opens a view of the move.

**`feat-king-powers` — CHANGE.**
Best: `Freeze · 1 left` is clear without a lesson. The second step explains that Freeze does not end the turn.
Main issue: Only Freeze, Strike and Holy Light have complete treatment. One casting sequence does not explain all twelve powers.
Fix: Show Haste's second move and End turn. Show Flight's legal half. Give every power its own limits and step text in the same context area.
Pick: Agree with A. Drop B and C as primary controls. Keep the effect brief; a fixed three-beat cast is not needed for every power.

**`feat-joy-dial` — DROP as a player control.**
Best: It is a useful design test. The same position makes the cost of each effect visible.
Main issue: It mixes information, sound and speed. Calm can show Sound on but remain silent. Warm still shakes the king and puts a band over the board.
Fix: Use Warm's useful action marks, Calm's still king and the quiet ending. Keep Sound and Motion: Normal, Fast, Off. Respect device reduced motion.
Pick: Disagree with shipping the dial. Keep A as a design starting point, remove the shake and band, and drop C's automatic replay and veil.

**`future-card-hand` — CHANGE.**
Best: The open grid gives each card a name. `Uses turn` and `Then move` explain the cost before play.
Main issue: `Cards · 6` hides all useful choices. In card mode, the hand is part of the main game, not an extra.
Fix: Keep A's compact row, but show readiness and one or two card names. Open the grid on request. A newly usable card gets one still notice.
Pick: A with this change. Reject B's small fan and C's unnamed coins. Keep the sample deal clearly marked as a proposal.

**`future-crowns` — CHANGE.**
Best: The paint reveal and Try its move join a reward to learning. There is no claim button or loss of crowns.
Main issue: Players who stay at Beginner cannot earn the pieces. The players who need gradual teaching most can stay stuck.
Fix: Offer a clear Full army choice in New game. Use the fixed order to suggest lessons. Do not make repeated wins the only visible way to meet the full game.
Pick: Prefer A's order to B's reward choice. Do not accept the win gate as a settled product rule. The thresholds remain a proposal.

**`future-online` — CHANGE.**
Best: By link and Online have distinct labels. The return replay explains the friend's last move before play resumes.
Main issue: `Your move is safe on this device` does not say whether the other player has received it. A connection failure needs exact state.
Fix: Distinguish Saved here, Sending and Received. Keep an unsent turn available after reload. Show what Finish by link sends.
Pick: Agree with A, with B for motion off. Prefer words off by default, with a visible mute. Keep no forced timeout for casual friend games.

**`future-workshop-share` — KEEP.**
Best: A working sample removes the blank page. A friend can inspect, try and keep the same piece.
Main issue: The full diagram and small rule text become hard to read in the chat preview. More complex designs will need more space.
Fix: In the preview, show the figure, name and one clear rule. On open, show the full card and rules. Test a design with slides and three properties.
Pick: Agree with A and Change one thing. Keep `Test board only` visible. Keep estimated worth separate from a claim that a piece is balanced.

**`kit` — KEEP.**
Best: The real engine, computer and art give the showcase a firm basis. The shot leaves the Archer on its square.
Main issue: Shared engine code does not stop each demo from building its own incomplete rule view and turn handling.
Fix: Share the code for attack squares, turn boundaries and power text as well as the board. Keep this page as a test page.
Pick: Agree with the shared-kit recommendation. Its four options are test states, not four product choices.

**`proto` — CHANGE.**
Best: The game screen has a clear order: board, player state, one context line, Moves, three actions. It looks like one game.
Main issue: Undo counts one or two moves. A power turn can contain more. Undo leaves Freeze spent after it takes back the move and reply.
Fix: Restore the state before the player's complete turn, including power use. Make the Undo label match what it removes.
Pick: Agree with the overall blend. Do not accept this implementation as the final specification. Use the stronger feature demos where it differs.

**Direction order and blend**

1. **Quiet Table.** Use its light floor, clear board and restrained game screen as the base.
2. **Coach.** Use its rule refusals, piece help and optional practice. Separate help from computer strength.
3. **Arena.** Use its named power state and opponent reveal. Keep its history tray folded.
4. **Chronicle.** Use its verbs, return recap and optional end story. Remove its extra live lines.
5. **Pocket.** Keep the lens, reachable controls and landscape rail. Drop the full layout and sheets over the board.

There are five product directions. `dir-compare` is a review tool, not a sixth direction.

The blend needs one layout, not five style settings. On a phone, use the space below the board for context. On desktop, use one side area. Keep the board in place when context changes.

**Does the recommended app hold together?**

Yes, as a product direction. The art, type, crimson actions and quiet table form a clear whole. The first shot and king's fall give it a beginning and an end that belong to King Down.

Its weakest screen is **Home**, most clearly on desktop. A small board sits in the centre of a large empty page. Continue covers pieces. Today's army is a full card. The live game then uses a much larger board in another place.

Replace it with `feat-home` A. Keep the saved board at game size and in game position. Put Continue beside it on desktop and below it on a phone. Fold Today to one line. Keep the last move in view.

Four other joins need work:

- The first-minute demo uses `QRNAKBBS`: Archer, Beast and chess pieces. The prototype uses `AQBKSNMR`, which also adds a Maester. Use one agreed first army.
- The prototype's full lesson board loses the close first-shot view and its pull-back into play. Carry that useful transition into the app.
- The prototype puts reading in both a context line and a second card. Use the compact read card from `feat-hold-to-read` once.
- The prototype omits No power and the opponent picker from the powers setup. Keep the clearer choices from `feat-new-game`. Fold the opponent choice with a readable summary.

The placeholder pages are acceptable for this review. They do not prove the full journeys through Guide, Workshop, Account or Board help. Connect those paths before judging the product complete.

**Too much, too slow or confusing**

- **One strong moment per feature becomes many moments per game.** Muster, target waves and a three-beat Freeze add motion. A tell, check shake, seal and replay add more. Use most motion to show cause. Let the king's fall carry the result.
- **Warm is still too busy.** Its end band enters, waits 1.2 seconds, then leaves. Bold adds a replay and veil. The final position is the thing a player wants to inspect.
- **The repeated tell adds delay.** Forty replies add 9.6 seconds from the tell alone, before travel time. Reduced motion adds more in the current source. Remove this fixed cost.
- **History has too many formats.** One line, five chips, a count, three live lines, a ghost, a scrubber and a recap need not become settings. Ship one folded line and one clear review view.
- **Read marks are inconsistent.** Gold diamonds, white dots, red dots, rings and sights change meaning between demos. Define one mark for a move, one for a take and one for a shot. Add distinct shove and swap marks only when relevant.
- **Small extra words are doing essential work.** Power limits, replacement-game notes and turn costs must remain readable. Do not reduce them to fit a fixed card.
- **The title lists twelve figures before play.** The art is strong; the small labels ask for study. Let three new figures carry the first view. Put the full cast in Guide or an expanded display.
- **Words change between screens.** Use Today's army, Moves, Guide and Ice Wall everywhere. The prototype's Today's game, Chronicle's Story and Pocket's The game add needless names.
- **Some teaching becomes advice.** Automatic ways out of check and warnings about loss should be optional. A rule explanation must not silently become a move recommendation.

**What is missing?**

- **A complete power turn through Undo, reload and resume.** Show Freeze plus a move, Haste's two moves and End turn. Restore uses, marks and the correct side to move.
- **The full set of endings.** Show stalemate, repetition, the fifty-move draw and too little material. Explain why the game ends. A draw must not show a losing king.
- **Promotion as a real choice.** Show queen, rook, bishop and knight with a clear preview. Include underpromotion and cancellation before commitment.
- **Power exceptions where they matter.** Show a frozen attacker that still gives check. Show shelter that blocks a take. Show a second action with no legal continuation. Some demos show one example, not the full flow.
- **A safe link-game return.** Show an old link, a duplicate turn, an invalid link and an unsent turn. Also show a link that opens while another game is saved.
- **A full two-player journey on one phone.** Show the turn handover, board orientation, named Undo scope and both players' power choices.
- **A complete accessible journey.** Show keyboard-only play through all choices and sheets. Check screen-reader announcements, enlarged text, a short phone viewport and reduced motion. The sheets alone cannot prove these.
- **A clear save state.** Show what stays on this device, what syncs and what happens if saving fails. Workshop designs do not sync with the account today.
- **A result path for a new player who loses often.** Offer a useful retry or a short piece lesson. Do not make a locked next piece the main message after every loss.

These are gaps in the showcase evidence. Some controls or code paths may already exist in the app.

**Three sources of delight**

1. **The first shot, then the full board.** The player learns that chess can contain a shot without a move. The changing view then gives that small action a larger place.
2. **The king's fall, with a useful way back after a loss.** The result is part of the board. Retry turns a loss into a small problem the player can solve. Keep the original result intact.
3. **A Workshop piece that travels.** Change one rule, see its effect, then let a friend try the piece. This is a stronger surprise than a louder win animation.

**One idea to add: Try this turn.** Let a player share a special turn as a small puzzle. For example: `Can you find my four bites?` The friend starts at the real position before that turn. They can try legal moves, then reveal the recorded move. Keep it separate from both saved games. Use the existing move link, replay and lesson parts. No score or reward is required.

**Rules and state checks**

I use the current default in `docs/RULES.md` and `showcase/research/king-down-facts.md`. I do not treat unmerged experiments as current rules. Cards and crowns remain proposals where the demos mark them that way.

**1. Prototype Undo removes the wrong scope. Confirmed.**
`proto/app.js`, `undo()`, removes two entries when the human has the turn. In its own recorded line, White freezes d5, plays e3–e4, then Black plays b5–b4. After two entries are removed, White is back after Freeze. Freeze has zero uses left and the free-action state remains active.
The expected state for `your move and the reply` is before the whole turn. Restore one Freeze use and remove its mark. The engine probe is in `rule-check.json`. Check Ice Wall and Haste with the same turn rule. This is a UI state fault, not an engine rule fault.

**2. The prototype's fifty-move explanation is incomplete. Confirmed.**
`resultWords()` says `Fifty moves with no take.` The rule also requires no pawn move. Use `Fifty moves with no take or pawn move.` For stalemate, also say that the king is not in check. Source: `docs/RULES.md` section 1.

**3. Some prototype power text omits essential limits. Confirmed.**
The Darkness line says that the king may step two in a line. It omits the empty middle square and empty destination. Its pawn line also omits forward. The Death Touch line does not clearly restrict the two-square reach to forward, back or sideways. Haste omits that the second move is optional.
Use the full limits in the read view and setup choice. A short title can remain short. Source: `proto/app.js`, `POWER`; `docs/RULES.md` section 4 and the facts sheet section 3.

**4. A read view does not always show the full attack pattern. Confirmed limitation.**
The prototype and Coach derive read marks from legal moves. An Archer has no legal shot to an empty square, but that square can still be under attack. A piece that cannot move because of king safety can also retain an attack pattern.
The probe with an Archer on d4 and no target gives no shot marks. This cannot serve as a complete danger view. Show attacks separately from legal moves. Keep frozen attack marks; Freeze does not remove check. Source: `reachOf()` in both demos; facts sheet section 2 and `engine.ts` mark rules.

**5. Pocket's supplied end image shows Strike ready. Confirmed in the render.**
The preceding check uses the one-use Strike. It must stay used in the same game. The current source contains a separate spent-state override, so the supplied image may be stale. Store the used state in the game itself and render it again. Do not repair only the label. `future-online` also documents a label override while its result engine state keeps Strike unused.

**6. Some recaps join separate game states. Confirmed in metadata.**
Quiet Table labels its ending as another game. That is honest. `feat-king-down` says its win recap joins P1 and P2; a pawn taken on a5 appears again in the later position. Those frames cannot tell one true game story. Use one recorded legal sequence for any recap or share result.

**7. The shown first army differs from the chosen teaching plan.**
The prototype's seed 34 gives `AQBKSNMR`, including a Maester. The first-minute demo's seed 83 gives `QRNAKBBS`, with only Archer and Beast as new pieces. Both are legal armies. This is a teaching mismatch, not a game-rule error.

Several rules are shown well. Only a king takes a Guard. An Ogre can shove a Guard. Freeze leaves the player a move. A frozen Archer still gives check. The Archer's move to f6 can mate through its forward diagonal reach. Keep those distinctions. Do not animate a separate shot that takes the king after mate.

**Evidence references**

Paths below start at `docs/specs/web-ux/showcase/` unless stated otherwise.

- All `demos/<id>/meta.json` files and both supplied sheets for each demo.
- `demos/proto/app.js`: `FIRST_SEED`, `POWER`, `reachOf()`, `undo()` and `resultWords()`.
- `demos/proto/proto.css`: `.home-table` caps the Home board at 420 px; `.home-continue` places the action over it.
- `demos/dir-coach/coach.js`: `reachOf()` uses legal moves for the read view.
- `demos/feat-their-turn-check/demo.js`: `computerTurn()` adds the tell delay.
- `demos/feat-joy-dial/joy.js`: `FINISH.shot`, `FINISH.chain` and `FINISH.mate`.
- `demos/dir-pocket/pocket.js` and `demos/future-online/meta.json`: separate handling of spent Strike.
- Repository sources: `docs/RULES.md`, `src/rules/engine.ts` and `src/rules/rules.ts`.
- All 27 supplied render-check records report no listed faults. This does not prove rule accuracy or complete accessibility.

**The five changes, in order**

1. Fix complete-turn Undo and incomplete rule views. Make power uses, attacks and draw text agree with the rules.
2. Replace the prototype's Home with the stable table from `feat-home`. Keep board size and position through Continue.
3. Complete one clear turn flow for every piece and power. Separate Read, Choose, Play, Continue turn and Review.
4. Cut repeated delay and effects. Keep cause marks, short moves and one king's fall. Retain Fast, Off and independent Sound.
5. Join the strongest learning moments to play: the first shot, rule refusals, true move history and practice after a loss. Keep cards visible enough in card mode; keep optional features folded.

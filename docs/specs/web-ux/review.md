# Web app UI and UX review: the merged plan

Status: needs-info (the owner's decisions at the end; no build before the owner approves a rendered sample)

Owner, 2026-10-08: "yes, do both." Work continues under the picks: the defect fixes ([01](issues/01-defects.md)) and the rendered sample of the game screen ([02](issues/02-game-screen-sample.md)).

Date: 2026-10-08. Scope: the web app on `main` at 4247835 (the screenshots). `main` is now at 860386f; the commits between change only the ChatGPT plugin, which comes later.

## Sources

Three independent reviews worked from one brief ([brief](sources/brief.md)) and one set of 143 screenshots: 23 screens at five sizes (1440×900, 1280×720, 820×1180, 390×844, 844×390). [capture.mjs](capture.mjs) makes the screenshots again: `node docs/specs/web-ux/capture.mjs http://localhost:5173/ <out-dir>`.

| Review | How | Findings | Source |
|---|---|---|---|
| C | Claude Code workflow: 7 lens reviewers (first run, play, setup, visual, responsive, accessibility and copy, powers and Workshop), 7 adversarial checkers, 1 synthesis. The reviewers drove the live app with their own browser probes. | 172 kept, 2 refuted | [claude-review.md](sources/claude-review.md) |
| X1 | Codex CLI, one reviewer | 38 | [codex-review-1.md](sources/codex-review-1.md) |
| X2 | Codex CLI, one reviewer | 28 | [codex-review-2.md](sources/codex-review-2.md) |
| M | Claude Code motion agent (motion graphics only) | see [Motion](#motion) | [motion-review.md](sources/motion-review.md) |

X1 and X2 could not start a browser in their sandbox. They worked from the screenshots and the code. Their code-only defects below were checked again in the code for this merge. IDs: `C:PLAY-1` is finding PLAY-1 of review C; `X1:F11` and `X2:F10` are findings of the Codex reviews.

## Summary

The art carries the game. The title screen, the painted figures, the stone board and the move markers are strong, and all three reviews say to keep them. The game screen around the board does not match them. It has 7 tile buttons of equal weight and up to 9 text areas. A selection pushes Hint, Undo and Resign down by 95 to 243 px, and on a phone it pushes them off the screen. The layout follows the screen width only, so a portrait tablet gets 60 px squares and a landscape phone gets 35 px squares with the header box on top of the board. Help misleads at key moments: Hint suggests moves that the lesson or the power rules then refuse, and a new player meets Club, which plays the same as Strong.

The direction, agreed by all three reviews: the board first at every size, one fixed action row, one context area for help and piece rules, Resign and the rare actions out of the main row, a lesson screen with only the lesson, and fewer frames, sizes and button kinds. Most changes remove things.

## 1. Defects to fix first

These are wrong behaviour, not taste. They need no design decision. All are checked in the code; "probe" means a reviewer reproduced it in the live app.

| # | Defect | Evidence | Found by |
|---|---|---|---|
| D-1 | **Resign can resign the computer's side.** Resign asks "Resign as <side to move>?" and the button stays on while the computer thinks, so a tap during the computer's turn gives the player a false win. | `src/main.ts:1092` (`game.pos.turn`), `src/main.ts:476` (no busy check) | X2:F10 |
| D-2 | **Hint suggests moves that the game then refuses**: in lesson 3 (a king move; the lesson wants the Maester swap) and in power games (a Strike or Flight move that is not armed). | probes `hint-lesson-3.png`, `hint-flight-refused-desktop.png`, `hint-strike-desktop.png`; `src/main.ts:885-895` | C:ONB-M1, C:A11Y-M1, C:A11Y-M2, C:PW-M2 |
| D-3 | **Review shows the old board with live data.** The piece card and the keyboard cursor read `game.pos`, and the captured rows count the whole game, not the viewed move. | `src/main.ts:337`, `src/main.ts:455` | X1:F11 |
| D-4 | **Start game replaces an unfinished game without a question.** A game link asks; New game does not. | `src/main.ts:1270`; the link question at `src/main.ts:1439` | C:SET-M1, X1:F14, X2:F09 |
| D-5 | **Club and Strong play the same game** until the player finds the Thinking time slider (both at 800 ms). | `src/ai/skill.ts:17-18`; `src/play.test.ts:12` | C:SET-5 |
| D-6 | **Game keys act under some open dialogs.** Z, R and the arrows still work under the result, promotion and delete-account dialogs, and the single-letter keys have no focus limit or way to turn them off. | `src/main.ts:1326-1336` (skips only New game, Settings, title and Guide); WCAG 2.1.4 | C:A11Y-6, X1:F28, X2:F21 |
| D-7 | **A finger tap that moves 7 px or more does not select the piece** (a mouse threshold on touch). | probe; `src/render/PaintedView.ts:229`, `:240` (one 6 px limit for mouse and touch) | C:RESP-M1 |
| D-8 | **Piece letters do not stay on** after a reload or a look change. | `src/main.ts:1319-1322` (from `?labels=1` only); not in the Save shape (`src/main.ts:1152`) | C, X1:F37 |
| D-9 | **"Link copied" and "Result copied" show before the copy succeeds**, and a failed fallback stays silent. Copy moves gives no feedback at all. | `src/main.ts:1101-1104`, `:1133-1135`, `:1303-1304`, `:1140-1148` | C:A11Y, X1, X2:F22 |
| D-10 | **A tap on an enemy piece gives a refusal**, so touch players cannot read an enemy piece's rules. | probe `c1-enemy-tap.png`; `src/main.ts:835`, `:865-867` | C:PLAY-M1, C:ONB-19 |

## 2. What all three reviews agree on

These changes have three votes. They need no new owner choice, except where a row names a decision.

1. **Stable game screen.** Hint and Undo stay in one place on hover, selection, power arming and review. The help line, the piece card, Cancel and the power step share one context area of fixed height under the action row. Delete the Cancel selection button: a second tap and Escape already cancel. (C:PLAY-1, C:RESP-3, C:A11Y-4; X1:F08; X2:F05)
2. **Resign leaves the main row.** It goes into the menu or becomes a quiet flag with a two-step confirm in place of the browser `confirm()`. (C:PLAY-16; X1 D02; X2:F28)
3. **No floating header box.** Remove the "KING DOWN CHESS" card from the game screen; the board gets its 53 to 64 px back. One status line in player words: "Your move", "Computer is thinking…", "Check! Your move". (C:VIS-1, C:PLAY; X1:F20; X2:F18)
4. **Layouts by screen shape, not width only.** A portrait layout for tablets (board about 736 to 760 px wide, today 516 px). A short-landscape layout keyed to height (`max-height: 500px`) with the board at full height on the left. Safe-area insets. `svh` in place of `vh`. (C:RESP-2, C:RESP-5; X1:F07, F26; X2:F04, F20)
5. **Touch sizes by input, not width.** 44 px targets on any coarse pointer, tablets included. Move-list rows at least 24 px on a mouse. (C:RESP-7, C:SET-12; X1:F25; X2:F20)
6. **Dialog actions always in view.** A sticky footer holds Start game, Close or Cancel. Today Start game is out of view in the powers setup at every size. (C:SET-1; X1:F24; X2:F19)
7. **A lesson shows only the lesson**: the task, the board, one help action and the way out. Hide the menu tiles, Undo, Resign, the move list and the captured rows. Mark only the goal moves. (C:ONB-1, C:N1; X1:F03; X2:F02)
8. **Powers setup opens your own picker only.** The computer's king is a summary row with Change. This cuts the dialog from 28 controls and 1128 px. (C:SET-3; X1:F17; X2:F12) Decision W5.
9. **Hint says what to do**: it selects the piece (and arms the power when the move needs it) and writes one line, for example "Hint: use Strike, then knight f1 to f7." (C:PLAY-4, C:ONB-12; X1:F09; X2:F06)
10. **Review has visible controls**: back, forward and "Back to game", 44 px on touch. Today touch players have no way to step. (C:PLAY-6; X1:F10; X2:F07)
11. **Result leads with the outcome.** "You win!" or "The computer wins", one line ("Checkmate on move 23"), no army code, no "That side gave up." Buttons: Rematch, Review, and a setup action. Decision W8.
12. **Army codes are not choices for players.** "MMSSNBNK" and the Catapult lab armies leave the normal army list. (C:SET-7; X1:F05; X2:F13) Decision W6.
13. **Settings gets shorter.** Account moves to its own sheet or a closed row; "This game" moves out. (C:SET-6; X1:F19; X2:F14)
14. **The Guide puts the King Down pieces first.** The six new pieces, then the kings; the chess pieces and the notation fold away. (C:ONB-6, C:N4; X1:F04; X2:F03)
15. **Workshop off the first title as a big button.** It stays one tap away. Decision W3.
16. **Fewer visual kinds.** Body text at 16 px. Cinzel only for large titles. Three button kinds plus an icon button. One frame per surface, no card in a card. Crimson only for the one main action. (C:VIS-3, C:VIS-4, C:VIS-7; X1:F21, F22; X2:F17)
17. **Passive powers read as "Always on"**, the opponent's power reads in the third person, and the power button sits next to the turn it belongs to, not under a rule paragraph. (C:PW-3, C:ONB-7; X1:F30, F31; X2:F16)
18. **No material count (+N) yet.** First set official values for the six new pieces (docs/RULES.md lists them as disputed). (C D11; X1; X2 D11)
19. **Keep:** the 12-figure title lineup, the six kings, the move marker shapes, the three modes, the emblem picker and power vignettes, the rulebook icons, Painted as the default look, the toppling king, one-tap Rematch, Undo, keyboard play and spoken moves, and no clocks, premoves or evaluation bar.

## 3. Where the reviews differ, and my call

| Question | C | X1 | X2 | My call |
|---|---|---|---|---|
| First computer level for a new player | Casual | Beginner | Beginner | **Beginner for the first game only**, then the remembered level. King Down is new to every player, chess players too; a first win is the best first memory (peak-end). Decision W1. |
| Level row in New game | visible, one help line | visible | hidden in More | **Visible.** It is one row and the main choice of an experienced player. Add one line of 8 words or fewer. |
| Game navigation | desktop: 4 quiet links; phone: Menu sheet | Hint, Undo, Learn, Menu at all sizes | Hint, Undo, Menu at all sizes | **Phone and landscape: a bottom bar with Menu. Desktop and tablet: a quiet text toolbar** (no tiles). Desktop has the room; the tiles, not the items, are the noise. Decision W2. |
| Title buttons | Learn (main), Play, Workshop as a quiet link | Learn, Play | "Try one move", Play, quiet Menu | **Learn the new pieces (main on a first visit), Play, Workshop as a quiet text link.** The Workshop is a feature you made; keep it one tap away. Decision W3. |
| Lesson flow | 5 lessons, Paladin as a bonus | Play after any lesson | Play after any lesson | **Offer Play after every lesson; all lessons stay.** The Paladin lesson becomes a bonus, because the Paladin is not in the random draw (C, X1). Decision W4. |
| Powers setup | your picker open | both as summaries | your picker open | **Your picker open** (2 of 3; keeps the vignettes in view). Decision W5. |
| Two players | one mode (no change) | "On this device" / "By link" | same as X1 | **Split inside the mode, plus a Flip board action.** Two choices remove a real confusion; the three top modes stay. Decision W7. |
| Result buttons | Rematch, New game…, Review | Rematch, New army, Review game | Rematch, Review board, Change setup | **Rematch (main), Review, New game…** "New game…" opens setup with the last choices; one label keeps one meaning. Decision W8. |
| Key moments in the result | keep, "Moves to look at again" | move into Review | keep | **Keep up to three, with the new heading.** |
| Last move | mark the start square with Animations Off | keep the target only | keep the target only | **Keep your rule (target only); make it stronger** (darker wash, also on an archer's square). 2 of 3, and it is your recorded decision. |
| Thinking time slider | delete; Strong gets a fixed 2.5 s | move to Strong setup | hide in Advanced | **Delete it; Strong thinks 2.5 s.** One level, one opponent. Decision W1. |
| Lab tools (example armies, Clay 3D, Ogre practice) | behind `?lab=1` | named practice in Learn; lab hidden | task names | **Behind `?lab=1`; Ogre practice becomes a lesson.** Decision W6. |
| Workshop entry | small fixes | Surprise me first | a working sample first | **Surprise me first on the first visit** (2 of 3). Decision W9. |
| Around the board | light floor now; dark stage later | light, centred | light | **Light floor now.** Ask again after the new layout. |
| Board icons | icons in place of letters (Settings) | — | — | **Icons**, off by default (already an open TASKS item: Piece-letter icons). |

## 4. The proposed game screen

Wireframes, sizes and tokens are in [claude-review.md §5–6](sources/claude-review.md); X1 and X2 give the same shape. The short form:

```text
Phone portrait 390×844                    Desktop 1440×900
┌──────────────────────────────┐          ┌──────────────────────────────┬────────────────────┐
│ Computer · Beginner   [P][P] │ 36 px    │                              │ New game Guide …   │ quiet links
├──────────────────────────────┤          │                              │ Computer · Club    │ opponent strip
│                              │          │           BOARD              │ Your move          │ status line
│        BOARD, full width     │          │   (no header card;           │ context, 2 lines   │ fixed height
│        squares 45 px         │          │    +53 px of board)          │ [Hint] [Undo]  [⚑] │ never moves
│                              │          │                              │ 1. e2-e4  e7-e5    │ moves fill
├──────────────────────────────┤          │                              │ [◀] [▶] Back to game│ review only
│ You · White   [N]  [Freeze ●]│ 36 px    │                              │ You · White [Freeze]│ your strip
│ Your move. Choose a piece.   │ context  └──────────────────────────────┴────────────────────┘
│ 1.e4 e5 2.Nf3 Nc6 →          │ move strip
│ [Menu] [Hint] [Undo] [◀] [▶] │ 56 px bottom bar
└──────────────────────────────┘
```

Counts (C §4): fixed game buttons 7 → 3 on a phone bar plus Menu; text areas 9 → 2 plus one card slot; a pawn selected moves the action row 0 px (today 197 to 243 px); the powers game on a phone shows about 25 words (today 83); New game with powers 28 controls → 16; army choices 14 → 3; Settings about 1100 px → about 700 px; browser `confirm`, `prompt` and `alert` boxes 9 → 0.

## Motion

The motion review ([motion-review.md](sources/motion-review.md)) lists the motion that exists, then proposes motion that carries information first and reward second. It built six prototypes with frame strips and videos (outside the repo, in the session scratchpad: `ux/motion/proto/`). They model canvas effects in the DOM, so they show timing and order, not the final look.

Its findings agree with the UI reviews in five places, so these are the strongest motion items:

| Motion item | What it shows | Agrees with |
|---|---|---|
| F3 Frozen and walled pieces keep a mark: ice climbs the figure, a badge with the turns left, a thaw when it ends | Today nothing on the board marks a frozen piece | C:PW-1 (frozen looks normal) |
| H3 Result, board first: the check line, crosses on the king's escape squares, the king falls, then the card rises with its king already down | Today the card covers the board's king fall, and its kings fall a second time (`main.ts:1030`, `:1036`) | C row 9 (900 ms wait), X1:F32, X2:F24 |
| C1 Hint plays its move once as a see-through piece, then rests faint | Direction; today two equal gold boxes | all three (Hint says what to do) |
| C2 Check line from the checking piece to the king; the check sound plays when the piece lands, not when it starts | The cause of check, often hidden behind other pieces | C:N2 |
| G2 Lesson coach marks: the lesson piece pulses; with no move for 8 s, the goal move plays as a ghost | The first step of each lesson has no mark today | C:N1, X1:F03, X2:F02 |

Other high-value items: **E1** a turn disc that turns over and a ring that fills while the computer thinks (it replaces the "thinking…" line that moves the header); **F1** power targets appear as a wave from the king; **D1** a taken piece flies to the captured row at the moment of the hit (today the row fills before the capture plays: `main.ts:593-596`); **T3** a game link or Continue plays the last move once; **G1** small moving diagrams in the Guide cards, so the long Archer sentence can become "Shoots the red squares without moving, over any piece."

Next after those: **F2** the board plays each power (Freeze, Ice Wall and Sacrifice first; the New game vignettes promise a motion the board does not keep), **B4** Undo and review rewind in place of a snap, **B5** promotion, **B2** the Beast's chain plan.

The motion rules (motion-review §5) join the token set of C §6. The key ones: start at the cause and end at the effect; one moving focus at a time; every motion ends on a still frame that keeps the information (Animations Off shows that frame); a tap skips, a new action cancels; text and sound change at contact, not at launch; one sequence lasts 900 ms or less (the result 2.6 s, skippable); DOM motion uses transform and opacity only; board motion uses the scene's decorate layers and `keepAwake`, no second frame loop. One helper wraps `el.animate()` with the pace and reduced-motion check, because the reduced-motion CSS does not stop script motion.

A first motion release (F3, H3, C1, C2, E1, F1, D1, T3) touches only `marks.ts`, `PaintedView.ts`, `main.ts`, `style.css` and `index.html`.

## 5. Build order

Each step is one branch and one pull request. A visual step waits for the owner's yes on a rendered sample (AGENTS.md).

1. **Defects D-1 to D-10.** Tests and browser checks; no visual change except D-10. No sample needed.
2. **A rendered sample of the new game screen** at the five sizes (the mockups for decisions W2 and the layout). The owner approves it.
3. **The game screen layer:** stable action row and context area, no header box, the layouts by shape, touch sizes, review controls, the result. A browser check measures it: Hint moves 0 px, the dialog's main button is in view, squares are at least 44 px on touch at 390 px and wider.
4. **Setup and learning:** sticky footers, your king picker, the army list, Settings and Account, the lesson screen, the Guide order, Beginner first.
5. **Visual tokens and components**, once the layout holds.
6. **Motion**, after its own sample.

Coordination: `src/render/PaintedView.ts` and `src/render/marks.ts` also run in the ChatGPT plugin page (`src/plugin/app.ts`). Tell the Codex plugin session before a step changes them (D-7, the board marks, the check and power marks).

## Owner decisions

Each line: the rule, the options, my pick, and what happens on yes. Work continues under the picks; the build waits for your yes on a rendered sample.

- **W1. First opponent.** *A player with no finished game meets Beginner; each level is a different opponent.* Today a new player meets Club, which plays the same as Strong at 800 ms. (A) Club for everyone; (B) Beginner for the first game, then the remembered level, and Strong thinks a fixed 2.5 s with the slider removed; (C) Casual for the first game. **Pick B.** On yes: the default in `new-game.ts:33-37`, a first-game flag, one level line under the row, `play.test.ts:12`. Reverses the Round 3 Club default.
- **W2. Game controls.** *The main row holds only the actions you use each turn.* Today 7 tiles of equal weight. (A) Keep the tiles, actions first; (B) Hint, Undo and Menu at all sizes; (C) phones and landscape: one bar of 5 (Menu, Hint, Undo, back, forward); desktop and tablet: a quiet text toolbar and a quiet Resign flag. **Pick C.** On yes: the Menu sheet holds New game, Guide, Workshop, Settings, Resign; WORKSHOP.md:11 and the phone checks change.
- **W3. Title.** *The title leads with one main action.* Today 3 large buttons (4 with Continue). (A) Keep; (B) Learn and Play, Workshop only in the menu; (C) Learn the new pieces (main on a first visit), Play, and Workshop as a quiet text link. **Pick C.** On yes: add the line "Chess with six new pieces" in place of "Chess".
- **W4. Lessons.** *A lesson shows only the lesson, and Play is one tap away after any lesson.* Today 6 linear lessons inside the full game panel; lesson 1 marks 8 squares and 7 fail. (A) Keep; (B) lesson-only screen, goal moves only, Play after each lesson, the Paladin lesson as a bonus (the Paladin is not in the random draw). **Pick B.**
- **W5. Powers setup.** *New game with powers opens only your own king picker.* Today 28 controls and 1128 px; Start game is out of view at every size. (A) Both open; (B) yours open, the other king as a summary row with Change: 16 controls; (C) both as summary rows: 12 controls. **Pick B.** Reverses the Round 3 "both pickers open".
- **W6. Lab switch.** *Players see player features; the designer's tools sit behind `?lab=1`.* Today 14 army entries (codes such as MMSSNBNK, Catapult lab armies), Clay 3D and Thinking time in Settings. (A) Keep; (B) `?lab=1` (remembered) shows them; the public list is Random, Today's army, Chess army; Ogre practice becomes a lesson. **Pick B.** Reverses the Round 3 More options and the 2026-09-27 Clay switch in Settings.
- **W7. Two players.** *Two players says how you play: on one device or by link.* Today one mode with both meanings. (A) Keep; (B) two choices inside the mode, and a Flip board action. **Pick B.** The three top modes stay.
- **W8. Result.** *The result shows the outcome first, then one tap to play again.* Today 29 words with "setup SQBKRSML", and the card covers the king's fall. (A) Keep; (B) the board-first sequence (H3), "You win!" and one line, up to 3 key moments as "Moves to look at again", and Rematch (main), Review, New game… **Pick B.**
- **W9. Workshop entry.** *A first Workshop visit starts with a working piece.* Today New piece leads to 34 figure choices. (A) Keep; (B) Surprise me first on a first visit; New piece stays. **Pick B.**
- **W10. Type and buttons.** *Cinzel only at 18 px and larger; three button kinds plus an icon button; body text 16 px.* Today every button has a gradient and a lift, and Cinzel goes down to 8.5 px. (A) Keep; (B) change. **Pick B.** Partly reverses Round 1; the wordmark, dialog titles, Guide card names and the result title stay in Cinzel.
- **W11. Last move.** *The still board marks only the square a piece reached (your 2026-10-04 rule).* (A) Keep it, with a stronger mark; (B) A plus a faint trail from the start square that fades in 1.2 s; (C) always mark the start square too. **Pick B.** The still board keeps your rule.
- **W12. Motion.** *Motion carries information first; every motion ends on a still frame that keeps it.* (A) First release F3, H3, C1, C2, E1, F1, D1, T3, then F2 (Freeze, Ice Wall, Sacrifice), B4, G1, G2; (B) only F3, H3 and C2; (C) the twelve power casts (F2) first. **Pick A.** On yes: one motion helper and the tokens, a sample of each item for your yes, and sounds for a power cast, promotion, a win and a lesson done.

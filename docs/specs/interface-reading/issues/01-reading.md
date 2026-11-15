# Reading: the current action first, compact effects, clear words

Status: ready-for-human

Spec: [Reading](../spec.md). The build is in the working copy of the design project. AGENTS.md: this change is visible, so it waits for the owner's yes on a rendered sample before a merge.

## Scope and plan

### Decision 17: the current action comes first

- `main.ts` `renderReader`: the normal reading area has two parts. `.play-current` holds the current content: a choice at one square, the shown or armed power or card, the last step of the turn, the selected piece, or the last reply with Show again. `.play-more` holds the earlier steps of the turn, the effect summary and an earlier reply.
- No repeated instruction: the first-minute line or the last result shows once, and the old "Choose a piece" filler is gone.
- `play.css`: the current part takes the space that it needs; the rest goes to `.play-more`, which scrolls inside itself. A long line scrolls inside its own box; its first line stays in view.
- Test: browser case R17 (the exact reply and staged sentence of fixture `effects`, the first line in view, Show again and `?` in reach, the current part above the effects, the board does not move, one announcement for each event).

### Decision 18: one line for each source of a lasting effect

- `texts.ts` `effectGroups`: one group for each effect and owner, and one group for the Guards. The summary says the owner, the effect and the number of pieces. Each detail keeps the exact square line of `stateDescriptions`. Check is not a group: `checkLines` gives it to the current part.
- `main.ts` `effectsBlock`: one toggle button for each group, with `aria-expanded` and `aria-controls`. The detail opens in place. The open groups stay open for this visit only.
- `texts.ts` `selectionLines`: the selected piece shows each effect on its square and an always-on power that changes how it moves, with its owner. These lines come before the general rule line of the piece, so on a short phone the rule line gives way first.
- An earlier reply that is not the current content goes after the effect summary, at body size.
- `stateDescriptions` has an optional `turn` argument. A staged move does not change "next turn" to "this turn" before the turn is final. The default is `pos.turn`, so the old callers do not change.
- Replay (`syncReplayEffects`): it changes only the summary, and adds no list before the current action.
- Tests: `reading.test.ts` (owners apart, each square in the detail, a moved piece leaves no old square, Guards and check, the Freeze duration, the Mercy pawn exception, passive powers). Browser case R18.

### Decision 19: an armed or shown power or card

- The name, `?` and Cancel (or Close) share one row in the current part. The state line gives the next step from the real target set (`armedStep`): "Choose one of your pieces.", "Choose an enemy piece.", "Choose a ringed piece." or "Choose a target.".
- A shown or armed resource does not borrow the opponent strip. Menu stays. Only the rule panel and the menu borrow it.
- Cancel, Escape and a second tap give "You cancel the card." or "You cancel the power." (`cancelLine`). An unavailable card shows its reason in the state line.
- A power names its owner: "Your power · …" or "Computer’s power · …". The computer's power reads in the third person (`opponentLines`). The learning panel takes the same owner line through its new `owner` option.
- Tests: `reading.test.ts` (actor and target steps for Fire Starter, Curse and Freeze; the cancel words; the third person for each power). Browser case R19.

### Decision 20: after a free action

- `texts.ts` `freeLine`: "Move a piece, or end with Freeze." when both are legal, "Select End turn to end with Freeze." when no move is legal, and "Move a piece to keep your king safe." when End turn is not legal.
- `learning.ts`: the first-time steps of Freeze, Ice Wall and Firewall end "Then move a piece, or select End turn.".
- The announcement after a staged step reads the same state line.
- Tests: `reading.test.ts` (each case of `freeLine`). Browser case R20.

### Decision 21: after the end

- `main.ts` `update`: the own strip, the turn controls and the opponent power get `inert` while the game has ended. `pressResource` returns at once after the end. `play.css` dims the own strip and the turn controls.
- Focus goes to Rematch after a result and after a resign.
- The result card keeps its look and its three actions.
- Test: browser case R21.

### Decision 22: the other faults

- Check names the player's own king only (`checkLines(...).mine`). A check that the player gives shows as a red line in the current part.
- A possible result shows only for the square under the pointer or the keyboard, with the label "Possible result:". The square description of a target has the same label.
- The choice of several actions at one square shows in the reading area with short labels and one prompt (`choicePrompt`, `choiceLabel`). It covers no square, and each choice and Cancel is in reach (soak fault 1).
- A used card or power keeps a clear name: no strike line. The art dims. The Ribbon slot has a dashed edge.
- Card names are 14 px from 360 px up. Under 400 px the letter spacing is tighter and a pressed card has its ring outside the name. The soft 320 case uses 12 px.
- A new tap removes the red edge of an earlier refusal.
- Speed fault 5: focus goes to the main result action. Speed fault 6: the page has one polite live region; each event speaks one time.
- Test: browser case R22 and the matrix smoke.

### Decision 23: browser checks and the fault proof

- `runs/tools/launch-reading/browser.mjs`: cases R17 to R22 at 360x640, 390x844 and 1440x900 in Chromium and WebKit, a smoke case at the 17 sizes of the matrix, and deliberate faults on the served files.
- `audit.mjs`: the record is complete, each fault changed the served file, and each fault failed its case.

## New strings with no copy table entry

"Choose one of your pieces." and "You cancel the card." / "You cancel the power." come from decision 19. "Move a piece, or end with Freeze." and "Possible result:" come from the plan. The others are the lane's choice: "Choose an enemy piece.", "Choose a ringed piece.", "Capture or push?", "Choose the piece that returns.", "Choose the new piece.", "Choose the card that Mirror copies.", "Move a piece to keep your king safe.", "Select End turn to end with ….", "Your power", "Computer’s power", the effect summaries ("You: Holy Light protects 2 pieces.", "2 Guards: only a king can capture a Guard."), the check line ("Check: your Rook on a8 attacks the computer’s King on e8."), the passive power lines and the third-person power lines.

## Verification

- Full `npm test`: 6522 passed, 379 skipped; Node 114 of 114. Baseline 6504 and 384: +13 new tests, and the 5 tests of `tools/anim/recolor.test.ts` run with the NumPy Python.
- `npm run test:docs`: 187 passed, 1 skipped. `npm run build` passes. The registered `next-save` check passes.
- Browser, final build: 36 of 36 rule cases and 34 of 34 matrix smoke cases pass in Chromium and WebKit, with no console error. 21 deliberate faults in 55 runs: each changes the served file and each fails its case. The audit finds no fault.
- The report `parallel/reading/run/report.md` in the design project gives the log paths, the screenshot paths and the Merge notes.

## Known limits

- At 360x640 a reply of three sentences or more, the own-check state, and an armed card with its first-time hint do not fit. The start of the text and the controls stay in view; the rest scrolls inside its box. Fixture: `effects`.
- At 360x640 the effect summary can have no height while the current content fills the area. The rings and the square descriptions keep the information.
- At 360x640 a tap on a frozen piece gives a two-line refusal and the name row; the Frozen line then is inside the current part, which scrolls. The refusal in view states the same fact.
- The side phones (height under 500 px) keep the board-fit fault of the base (speed fault 2). Decision 34 of the next stage fixes it.
- Rows in the grid (speed fix 11) belong to the sides stage.
- No real phone, no manual screen reader and no Firefox run.

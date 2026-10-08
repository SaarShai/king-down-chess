# Fix the web app defects D-1 to D-10

Status: ready-for-agent

Owner, 2026-10-08: "yes, do both." (the defect fixes and the rendered sample of the game screen, under the picks of the [review](../review.md)).

## Scope

The ten defects of [review §1](../review.md#1-defects-to-fix-first). Wrong behaviour only: no new layout, no new style. D-5 follows pick W1 B (Strong thinks a fixed 2.5 s; the Thinking time slider goes). D-10 is the one visible change: a tap on an enemy piece shows its card.

`src/render/PaintedView.ts` (D-7) also runs in the ChatGPT plugin page (`src/plugin/app.ts`). The pull request says so, for the plugin session.

## Plan

Five groups, one branch each, merged into `claude/web-ux-defects`:

| Group | Defects | Code |
|---|---|---|
| A, game guards | D-1 resign side, D-4 Start game over an unfinished game, D-6 game keys under dialogs | `src/main.ts` |
| B, Hint | D-2 Hint suggests refused moves | `src/main.ts`, lessons, powers |
| C, the viewed position | D-3 review readouts, D-10 enemy piece card | `src/main.ts` |
| D, saved settings and copy | D-8 piece letters, D-9 copy feedback | `src/main.ts`, `index.html` |
| E, levels and touch | D-5 Club and Strong, D-7 touch tap limit | `src/ai/skill.ts`, `src/render/PaintedView.ts` |

Each group adds a unit test where the logic is pure and a probe in `tools/ux-defects/` (the browser check `ux-defects`).

## Verification

- [ ] D-1: Resign is off while the computer thinks. Against the computer, Resign always resigns your side.
- [ ] D-2: Hint suggests only moves that the game takes now: the goal move in a lesson, no unarmed power move.
- [x] D-3: In review, the piece card, the keyboard cursor and the captured rows show the viewed move.
- [ ] D-4: Start game over an unfinished game asks first; Cancel keeps the game.
- [ ] D-5: Strong and Club play with different time (2.5 s and 0.8 s); `play.test.ts` asserts that they differ.
- [ ] D-6: No game key acts while a dialog is open.
- [ ] D-7: A finger tap that moves up to 12 px selects the piece; a mouse keeps the 6 px limit.
- [ ] D-8: Piece letters stay on after a reload and a look change.
- [ ] D-9: "Copied" shows only after the copy succeeds; a failure says so; Copy moves gives feedback.
- [x] D-10: A tap on an enemy piece shows its card; a capture still works.
- [ ] `npm test` passes; `npm run check:browser` passes (all checks, `ux-defects` included).

## Comments

Group C (D-3, D-10), branch `claude/web-ux-fix-viewed`, 2026-10-08:

- D-3: `shownPos()` in `src/main.ts` gives the position on the board: in review, the move shown. The piece card, its power counts ("Freeze, 1 left"), the cursor speech and the captured rows read it. Each change of the shown move also says the cursor square again, so after Enter or Escape ends a review the cursor speech reads the live board at once. The probe `d3-review-readouts` fails on the old code at each of these readouts and passes on the fix.
- D-10 follows pick D10 of the review: only the line "That is Black's rook. White to move…" changes. With no piece selected, a tap, a click or Enter on an enemy piece shows its card, with no refusal. With a piece selected, a tap on an enemy piece that it cannot take also shows the card and clears the selection, but the help line still says why ("Not allowed: a guard can only be taken by a king.", "…would leave your king in check.", "the capture chain was cancelled"). A drag onto such a piece keeps the reason too. While the player cannot move (the computer thinks, the game is over, a game link waits for the friend, a lesson is done), a tap on a piece shows its card beside the existing help line. A tap on a marked enemy piece captures, as before. After Enter, the screen reader says the card. The probe `d10-enemy-card` fails on the old code and passes on the fix. `docs/visual-design/verify.mjs` expects the card for an enemy piece with no piece selected, and keeps the guard refusal.
- No unit test: the changed logic reads the game state in `src/main.ts`, so the probes test it.
- `src/render/PaintedView.ts` and `src/render/marks.ts` do not change, so the plugin page does not change.
- `tools/verify-ux-defects.mjs` calls `trapErrors`, as the check lint asks. The other groups have the same line, so the merge is clean.
- Repair after the check, 2026-10-08: the first fix also removed the refusals for a selected piece, against pick D10, and the cursor speech kept the reviewed board after Enter or Escape. Both are fixed as above.

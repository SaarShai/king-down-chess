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

- D-3: `shownPos()` in `src/main.ts` gives the position on the board: in review, the move shown. The piece card, its power counts ("Freeze, 1 left"), the cursor speech and the captured rows read it. The probe `d3-review-readouts` fails on the old code at each of these readouts and passes on the fix.
- D-10: a tap, a click or Enter on an enemy piece that the selected piece cannot take shows the card of that piece, clears the selection and gives no refusal. After Enter, the screen reader says the card. A tap on a marked enemy piece captures, as before. The probe `d10-enemy-card` fails on the old code and passes on the fix. `docs/visual-design/verify.mjs` now expects the card, not a refusal, for an enemy piece and for a guard.
- No unit test: the changed logic reads the game state in `src/main.ts`, so the probes test it.
- `src/render/PaintedView.ts` and `src/render/marks.ts` do not change, so the plugin page does not change.
- `tools/verify-ux-defects.mjs` calls `trapErrors`, as the check lint asks. The other groups have the same line, so the merge is clean.
- Follow-up, D-10: for an enemy piece that a pinned piece, or a piece while the king is in check, cannot take, the old refusal said why ("that move would leave your king in check"). Now the card shows and the marks show the legal squares. The owner decides whether the card also says why.

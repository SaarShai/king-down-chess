# 09 · The refusal that teaches, and Take or Shove in the context line

Status: wontfix (cut by the fast plan, fast-plan.md §2; the owner can bring it back)
Blocked by: 04, 05 (`src/haptic.ts`), 08, 10

## Scope

- Owner choice: Your move A (the refusal "Only a king can take a guard." and the take-or-shove choice). Decision D12 (b): Take and Shove in the context line, with Cancel (Advisor A); the demo asks at the square.
- Demo: `feat-your-move` (`shieldMark` 168, the nudge 184, the refusal 457).
- Files: `src/main.ts` (`refuse`, `onSquareClick`, `choosePushOrCapture`; call lines only); a pure `src/why-not.ts` (from today's `whyNot`) and its test; `src/render/marks.ts` (a refusal mark); `docs/2d-first-pieces/board/scene.mjs` and `scene.d.mts` (`nudge`); a pure motion module for the nudge (spec rule 8); `src/render/PaintedView.ts` (an optional `nudge`); `index.html` (`#move-choice` goes); `tools/ux-defects/d10-enemy-card.mjs`; `tools/verify-special-moves.mjs`.

## Plan

1. [ ] `whyNot` names each cause, in 8 words or fewer: a Guard ("Only a king can take a guard."); an Ice Wall ("Ice Wall: nothing can take it now."); Holy Light's shelter; Mercy's aura ("Only a pawn can take beside Mercy."); Haste or Strike, which take nothing; a frozen own piece ("Frozen: it cannot move this turn."); a bite chain never continues onto a king; a move into check ("That leaves your king in check."). The causes come from the rules in force.
2. [ ] A refused tap keeps the selection. It draws a short mark on the square (a shield for every shelter: Guard, Ice Wall, Holy Light, Mercy; a plain cross for other refusals), nudges the selected figure for 260 ms, pulses once (`haptic`), and shows the `whyNot` words. When the tapped piece is an enemy that is not a target, the line also reads it (ticket 04).
3. [ ] While a power is armed, a tap on a piece that is not a target keeps the power armed, reads the piece and says why ("A king cannot be frozen.").
4. [ ] `scene.nudge(sq, ms)`: skipped with Motion Off and reduced motion.
5. [ ] Take or Shove: when one target can be taken or shoved, the context line shows "Take or shove the guard?" with Take, Shove and Cancel, in place of the `#move-choice` dialog. While the choice is open, only these three act: the board, Undo, Z, the review keys and the coins take no input. Esc or Cancel keeps the position and the selection. A new game, a link or an account change cancels the choice and drops its result. The focus goes to Take, and back to the board after the choice.
6. [ ] The promotion and Sacrifice dialogs stay.

## Verification

- [ ] `src/why-not.test.ts`: one case for each cause of step 1.
- [ ] Node test: the nudge timing ends at the rest pose.
- [ ] A probe: a refusal at a Guard keeps the selection and shows "Only a king can take a guard."; a refusal at an Ice Wall and at a Holy Light shelter shows the shield; Take and Shove play the right moves; Cancel and Esc keep the position on touch and on the keyboard; Z and a board tap do nothing while the choice is open; a new game during the choice drops it; a choice after a staged free mark works.
- [ ] The existing keyboard and stale-choice proofs in `tools/verify-special-moves.mjs` (line 87) stay, moved to the new choice.
- [ ] The D-10 probes change (the selection now stays), with `Removed-check:` trailers.
- [ ] `special-moves`, `npm test`, `npm run check:browser` and `plugin-ui` pass. Record the plugin page size.
- [ ] Rendered sample, 390×844 and 1440×900: a Guard refusal; an Ice Wall refusal; a shelter refusal; Take, Shove and Cancel in the line. The owner's yes, with the date, in Comments.

## Risks

- `scene.mjs` is shared with the plugin and the trial page; the nudge is opt-in.

## Does not do

- No fan of tiles at the square. Promotion stays a dialog.

## Comments

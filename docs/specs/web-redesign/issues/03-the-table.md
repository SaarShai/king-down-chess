# 03 · The table: player strips, the bar, the context line and one Moves line

Status: done on claude/web-redesign-int (waits for the owner's yes on the sample)
Blocked by: 05

## Scope

- Owner choices: the Quiet Table layout; the game controls Undo · End turn · Menu; the move history at rest as one line; levels in words (the level word in the opponent strip). The read words and the reach come in ticket 04; the coin comes in ticket 10, the next step.
- Demos: `proto` (game grid, strips, context line, Moves line, bar: `proto.css` 118–231 and 322–347; `renderContext`, `app.js` 946–986), `dir-quiet-table` (floor and hairlines).
- Files: `index.html` (the game screen), `src/style.css` (split the game screen into its own file), `src/main.ts` (`refresh`, `showInfo`, `onSquareHover`, the `$('panel').scrollTop` calls), a pure `src/context-line.ts` (the ranked list of spec §4.9) and its test, `tools/app-ui.mjs` (helper bodies only), new `tools/verify-game-screen.mjs`, `docs/specs/web-redesign/samples/W2.mjs`.

## Plan

The fast plan, §2, sets this build scope.

1. [x] Build one grid with two strips, the board, context, Moves and the bar. Remove the old top and panel. Keep the board and check hooks.
2. [x] Use CSS for phone and two-column sizes. Keep fixed rows, `dvh`, safe areas and no sideways scroll.
3. [x] Show portraits, names, levels and the active side. Move today's power button into your strip. Cut the interim context power action.
4. [x] Build the existing context ranks in one pure module. Keep short power words and piece rules. Put lesson actions in the bar so their task stays visible.
5. [x] Use today's piece words for a tap. Remove the info card. Keep hover move marks.
6. [x] Show one Moves line and one native Moves sheet at every size. Keep row and key review, LAN and taken pieces. Cut the desktop fold.
7. [x] Scope table styles. Keep the global button rule for dialogs and Workshop.
8. [x] Update check helpers for moved controls. Name changed assertions in commit trailers.

## Verification

- [x] Test the four context collisions, named piece rules and short first lines. Test the last-ply position reader and explicit Review exit.
- [x] Run `game-screen` at 390×844 touch, 844×390 touch and 1440×900. Check fixed board and bar, 44 px targets, phone squares, no sideways scroll and one crimson action.
- [x] Run `npm test` and all 19 named checks that W2 touches. Run each new check twice after the merge. Run both plugin checks.
- [x] Render the five kept table states and four Menu states at all three sizes. Add review-fix states and one phone before-and-after pair. Inspect all four sheets.
- [ ] The owner's yes on the sample waits.

## Risks

- The largest CSS change of the redesign: test short phones and landscape with care.
- The Clay look must still fit the frame (`playable-clay`).
- Long texts (refusals, power texts such as Darkness) need short copy; the clamp must not hide the cause of a refusal.
- Today's power button stays in your strip until ticket 10 gives it a coin.

## Does not do

- No read words or reach (04), no coin (10), no story sentence (11), no Ceremony (the result dialog `#over` stays until 14).

## Comments

W2 follows the fast plan, §2. The review's nine findings are fixed.
Lesson actions use the bar. Task and success words stay visible.
Status reads keep piece rules. Review stays active at its last ply.
Freeze icons use the target's army. A pass names the free mark.
The fix commit records the seven missing check trailers.
`npm test`: 82 files pass; 1499 tests pass, 13 skip; 50 scene tests pass.
All 19 named checks pass. `game-screen` and `menu-extra` pass twice after the merge. The M1 script selects its local fallback.
The plugin page stays at 4,291,968 bytes. Both plugin checks pass.
Cut: interim power action, desktop fold and extra layout sizes. W2 gives 45 clean renders and four inspected sheets outside Git.

## Integration

Plan: merge W2 without a fast-forward, check the tree, then push the integration branch.
Checks: no lost changes, no conflicts, and a passing pre-push test and gate.
The owner asks for this merge and push. The starting branch is clean.
The start is `a251ccbdb2f6f6118745f9e7d953f9cb04d7af88`, an ancestor of W2.
Merge `050315c9eff7665f76ce61f5f948b812eeb44676` has no conflicts.
Its tree is the same as W2. The builder's full run above stands under the owner's rule.
The push hook must pass before the branch goes to origin.

## Batch 2 UX fixes

Decision: decided by delegation (2026-10-09).
Task and success words fit all four sizes. Moves wrap. The board and bar stay fixed.
Live buttons have icons and bold ink. Lesson marks have shapes and text.
Review uses the Moves numbers. Motion Off hides its note.
Landscape squares are 41.77 px. W2 adds computer rest and thinking states.
`npm test`: 83 files pass; 1514 tests pass, 13 skip; 50 scene tests pass.
All eight required browser checks pass. W2 has 68 inspected renders and no faults.

## Short screen strip fix

Decision: decided by delegation (2026-10-09).
Cause: the fault starts after `80860c1`. The board keeps the old 284 px row budget.
The new bar and wrapped note need more height. The board exceeds its grid row.
The board now fits its row. A 77 px note row holds three lines. Back stays beside the note.
The overlap check fails before the fix. It passes in rest, Review and lesson-done at all four sizes.
At 320×568 the board is 263 px high. The rows stay fixed. Landscape squares stay at 41.77 px.
`npm test`: 83 files pass; 1514 tests pass, 13 skip; 50 scene tests pass. All eight browser checks pass.
W1, W2 and W7 have 92 renders and no faults. All 34 smallPhone and landscape renders are inspected.

## Board review fixes

Decision: decided by delegation (2026-10-09).
Short phones use 44 px strips, a 52 px context row and a 44 px Moves row.
The 320×568 canvas is at least 290 px wide. Both strips clear the board.
Labels draw at 12 CSS px. File letters clear the frame.
The board and bar stay fixed at all four check sizes.
W2: 68 inspected renders, 0 faults. Tests and all required checks pass.

# 02a · No Hint on the game screen; Show me in lessons

Status: built (the separate W1 review and the owner's sample review wait)
Blocked by: 00

## Scope

- Owner choice: "No Hint. The Hint button goes from the game screen." The owner removed the button from the game screen, not the lesson aid: a lesson keeps a "Show me" that marks its goal move.
- Files: `index.html` (`#hint`, the `i-hint` symbol, the lesson controls); `src/main.ts` (the `#hint` handler and its disabled rule; the lesson controls); `src/style.css`; `tools/ux-defects/d2-hint.mjs` (removed); `tools/verify-cursor-adoption.mjs`, `tools/verify-painted-game.mjs` (the `#hint` steps); `tools/verify-lesson-return.mjs`.

## Plan

1. [ ] Remove `#hint`, the `i-hint` symbol, its handler and its disabled rule from the game screen.
2. [ ] Keep the names `hintSquares` and `Highlights.hint`: the key-moment "better move" mark uses them, and `renderer.ts` and `marks.ts` run in the plugin page. Keep `hintMoves()` in `src/powers-ui.ts`.
3. [ ] Lessons: a "Show me" button in the lesson controls (beside Next lesson and Return to game). It marks the lesson's goal move: today's hint path with `hintMoves()` and the lesson goal. Ticket 18 moves it into the lesson screen.
4. [ ] Remove `tools/ux-defects/d2-hint.mjs` and the `#hint` steps in `verify-cursor-adoption.mjs` and `verify-painted-game.mjs`, with `Removed-check:` trailers.

## Verification

- [ ] A check: no `#hint` on the game screen; in a lesson, Show me marks the goal move and no other move; a game move after it still works.
- [ ] `lesson-return`, `npm test` and `npm run check:browser` pass. `plugin-ui` does not change (no shared file changes).
- [ ] Rendered sample, 390×844 and 1440×900: the action row with no Hint; a lesson with Show me. The owner's yes, with the date, in Comments.

## Risks

- The action row has one control less until ticket 02b adds End turn in that place.

## Does not do

- No turn button (02b). No change to the key-moment mark.

## Comments

W1 build: remove Hint from play. Keep Show me in the lesson controls.
Reuse the goal move handler. The turn check plays its marked goal.
Checks: turn, lesson-return and the full suite pass.
Samples: `SAMPLE=02b` gives 14 renders with no fault, including Show me.
The separate W1 review and the owner's sample review wait.

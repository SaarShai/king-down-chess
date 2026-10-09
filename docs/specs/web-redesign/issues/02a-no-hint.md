# 02a · No Hint on the game screen; Show me in lessons

Status: done on claude/web-redesign-int (waits for the owner's yes on the sample)
Blocked by: 00

## Scope

- Owner choice: "No Hint. The Hint button goes from the game screen." The owner removed the button from the game screen, not the lesson aid: a lesson keeps a "Show me" that marks its goal move.
- Files: `index.html` (`#hint`, the `i-hint` symbol, the lesson controls); `src/main.ts` (the `#hint` handler and its disabled rule; the lesson controls); `src/style.css`; `tools/ux-defects/d2-hint.mjs` (removed); `tools/verify-cursor-adoption.mjs`, `tools/verify-painted-game.mjs` (the `#hint` steps); `tools/verify-lesson-return.mjs`.

## Plan

1. [x] Remove `#hint`, the `i-hint` symbol, its handler and its disabled rule from the game screen.
2. [x] Keep the names `hintSquares` and `Highlights.hint`: the key-moment "better move" mark uses them, and `renderer.ts` and `marks.ts` run in the plugin page. Keep `hintMoves()` in `src/powers-ui.ts`.
3. [x] Lessons: a "Show me" button in the lesson controls (beside Next lesson and Return to game). It marks the lesson's goal move: today's hint path with `hintMoves()` and the lesson goal. Ticket 18 moves it into the lesson screen.
4. [x] Remove `tools/ux-defects/d2-hint.mjs` and the `#hint` steps in `verify-cursor-adoption.mjs` and `verify-painted-game.mjs`, with `Removed-check:` trailers.

## Verification

- [x] No Hint in play. Show me marks the lesson goal, and its marked move completes the lesson.
- [x] Unit tests, lesson-return and the named M1 browser checks pass. Plugin defaults stay.
- [x] Sample W1 shows the action row and Show me at 390×844 and 1440×900.
- [ ] The owner's yes on the sample.

## Risks

- The action row has one control less until ticket 02b adds End turn in that place.

## Does not do

- No turn button (02b). No change to the key-moment mark.

## Comments

Remove Hint from play. Keep Show me in the lesson controls and reuse the goal handler.
The fast plan keeps this work and cuts no part of 02a.
Tests: 1482 pass, 13 skip; all 50 scene tests pass after the merge.
M1: all 14 named checks pass; turn and link-game pass twice; plugin-ui passes.
Sample W1: 14 renders, no fault. Both contact sheets are checked. The owner's yes waits.

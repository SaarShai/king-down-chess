# 18 · Lessons: the piece shelf

Status: done on claude/web-redesign-int (waits for the owner's yes on the sample)
Blocked by: none

## Scope

- Owner choice: Lessons A, Piece shelf. Decision D10.
- The [fast plan](../fast-plan.md) §2 sets this unit's scope.
- Demo: `feat-lessons` option A. Reuse its figure order, short lines and stone shelf.
- Keep the six lesson boards and W1's controls. W2's Menu opens Guide on the shelf.

## Plan

1. [x] Build a pure shelf model. Read Learned and Next from the lesson store. Use this order: Archer, Beast, Maester, Ogre, Guard, Paladin. Read Bonus from the pool.
2. [x] Put six figures on a stone shelf. Show each name, rule line and state. Any figure opens its lesson. The main button opens the next lesson, or returns to the game when all are learned.
3. [x] Keep Show me and the current lesson controls. Show “<Piece> learned.” in the context line on success. Lessons have no Undo or End turn.
4. [x] Keep every other field of `kingdown.lessons` when a lesson is learned. Keep the account's done list.
5. [x] Use “shove” for the Ogre in player text.
6. [x] Update the check helpers for the shelf controls. Keep each check's flow and purpose.

## Verification

- [x] Test the shelf order, state, next lesson and short lines at the pure seam.
- [x] Test the lesson store and learned context line before the code change.
- [x] Keep the lesson goal and Show me tests. Run `npm run typecheck` during the build.
- [x] Run `npm test`: 85 files pass, one is skipped; 1,531 tests pass, 13 are skipped. All 50 scene tests pass.
- [x] Run the three lessons cases at phone and desktop sizes twice. Check the shelf, a figure's lesson and Learned from the store.
- [x] Run the touched checks: lessons, lesson-return, account, painted-game, game-screen, turn, ux-defects, new-game, playable-clay, menu-extra, visual-design, special-moves.
- [x] Render the shelf at 390×844 and 1440×900. Inspect both contact sheets. Both renders have no capture fault.
- [ ] The owner says yes to the sample.

## Risks

- The saved game and a newer account game must stay safe during a lesson. The return and account checks cover both cases.
- The Paladin is in the draw pool. All pool pieces share one shelf.

## Does not do

- No board lists, four Guard boards, alternate Archer reading tests, new lesson screen or learned card.
- No path layout or crowns. Keep the current lesson controls and one board per piece.

## Comments

- The shelf model and DOM show six figures, Learned, Next and Bonus. A figure starts its current lesson.
- The lesson store keeps other fields. The context line shows the piece learned. Player text uses shove.
- The fast plan cuts board lists, four Guard boards, alternate Archer tests, the new lesson screen and learned card.
- `npm test`: 85 files pass, one is skipped; 1,531 tests pass, 13 are skipped; all 50 scene tests pass. Typecheck passes.
- One full run has a search clock timeout. The full test run with one worker passes on retry.
- The M1 launcher routes to this Mac. All 12 named browser checks pass. The new lessons check passes twice.
- Sample W9: phone and desktop shelf; two renders, no capture fault. Both contact sheets pass the review.
- The integration merge keeps the check cause text and learned line. The sample waits for the owner's yes.

## Integration

Plan: merge W9 without a fast-forward, check the tree, then push the integration branch.
Checks: no lost changes, no conflicts, and a passing pre-push test and gate.
The owner asks for this merge and push. The starting branch is clean.
The start is `80860c174b4dbf930a63ca1976aaa1866378e528`, an ancestor of W9.
Merge `7d9b4bc77ea40ac11855b6d34e9bae26147696fc` has no conflicts.
Its tree is the same as W9. The builder's full run above stands under the owner's rule.
The push hook must pass before the branch goes to origin.
The first push stops on three five-second test timeouts: one piece-activity case and two gate cases.
All 1,528 other tests pass. This Mac has a high load.
Retry the push with `VITEST_MAX_WORKERS=1`. Keep the assertions and time limits.

## Batch 3 words

- decided by delegation (2026-10-09).
- Next lesson uses the shelf's next unlearned lesson for its label and action. Archer leads to Beast.
- The Paladin line is “Jumps over its own pieces”.
- The browser helpers give both lesson flows the shelf order. Existing flow assertions stay.
- Shared lane edit: export the existing progress function from `src/lesson-shelf-ui.ts`.
- Checks: npm test passes (1,695 tests; 13 skipped). Typecheck and all ten required browser checks pass. Three extra checks pass.
- Sample W9: 4 renders, 0 faults. Both contact sheets are inspected.

## Batch 3 sheet fixes

Decision: decided by delegation (2026-10-09).
The first rule line shows under the phone shelf. The save note is centred.
The heading is smaller. The Paladin shares the shelf with all pool pieces.
Figures have hover and press states. The kept-game action says Return to game.
Tests: 1,666 pass; 13 skip. All 50 scene tests pass.
Samples: 128 renders across W2, W4, W9, W11 and W12; zero faults. All are inspected.
All nine required browser checks pass. Typecheck and the doc checks pass.

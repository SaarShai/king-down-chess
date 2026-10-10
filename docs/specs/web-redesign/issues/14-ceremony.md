# 14 · The end: the Ceremony

Status: done on claude/web-redesign-int (waits for the owner's yes on the sample)
Blocked by: 02c, 03, 07, 11

## Scope

- Owner choice: the end of a game, B, the Ceremony (our pick of its form): the final blow again at half speed, the king falls, "King Down" settles in, three tiles rise. Decisions D3 (the end starts on the press, or on a send that succeeds) and D8 (which games).
- Demo: `feat-king-down` option B (`end.js`: `runCeremony` 326–368, `renderResult` 183–216, `tileList` 219–232; `end.css`). Its notes: "A loss and a draw always end quietly."
- Files: `src/main.ts` (`result`, `showOver`, `listMoments`, the result close; call lines only); `index.html` (`#over` becomes a result pane); `src/render/PaintedView.ts` (a speed option on `animateMove`); `docs/2d-first-pieces/board/scene.mjs` and `scene.d.mts` (`setSpotlight`); a new pure `ceremonyPlan` and its test; a pure timing module beside `scene.mjs` (spec rule 8); `src/style.css` (the dialog king fall goes); new `tools/verify-end.mjs`; `tools/verify-game-screen.mjs` (the end state); `verify-king-effects.mjs`, `verify-painted-game.mjs`, `qa.mjs`, `tools/ux-defects/` d1, d4, d9, d10.

## Plan

1. [x] The board plays the four beats, then today's result dialog opens with the tiles. The dialog's second king fall goes.
2. [x] D8 plays your win against the computer, your link win, or any mate on one device. A loss, draw and Resign stay quiet.
3. [x] The final blow skips a trailing pass. It plays through `animateMove` at speed 0.5. The king falls; "King Down" settles in; up to three tiles rise.
4. [x] The final blow and up to two special moves form the tiles, with the winner's moves selected first and all tiles in play order. A tile opens Review at its ply. Key-moment search starts from Review.
5. [x] A board tap or Escape skips. Space and Enter on the board skip. A hidden tab, Off and reduced motion show the end frame. The result is spoken once. The result Rematch gets focus. End turn stays off during the board beats.
6. [x] A new game cancels every old wait. Open sheets keep their keys and focus. The result waits behind a sheet. New game cancels the pending result when it opens.
7. [x] A staged end waits for the press or a successful send. Undo before the press removes it. A king capture has no fallen king.
8. [x] "Copy today's result" keeps its id, words and copy path.

## Verification

- [x] The D8 unit test checks wins, quiet results, one device and a link.
- [x] `end` checks the board fall, tiles, Review, skip, quiet results, focus, first-frame Rematch, sheet keys, New game and Clay.
- [x] `w6-parts` checks half speed, a trailing pass, tiles, skip keys, Off, reduced motion and old waits.
- [x] `npm test`, the type check and all ten named browser checks pass. Both new checks pass twice. The plugin page size is in Comments.
- [x] Sample W6 has phone and desktop sheets and one phone video of an Archer mate. All five renders pass. Both sheets get a visual check.
- [ ] The owner gives yes on the sample.

## Risks

- The sequence is longer than the earlier motion rule (2.6 s), and a long Beast chain at half speed adds more. The owner chose the Ceremony; the skip keeps control with the player.
- A mate by a power move (Strike) must replay the power move.

## Does not do

- No Retry (ticket 23), no new sharing, no crowns.

## Comments

Four beats play before today's result dialog. Up to three tiles open Review.
Your win and any mate on one device play it. A loss, draw and Resign stay quiet.
New game cancels the old end. Other sheets keep their keys and focus.
The result waits behind Menu. Review starts the key-moment search.
Cut: the result pane, spotlight and new plan and timing modules.
Tests: 1644 passed, 13 skipped; 50 motion tests pass. Type check passes.
All ten named checks pass after the merge; end and parts each pass twice.
End: 16.6 s and 15.8 s. Parts: 3.1 s and 3.1 s. Both plugin checks pass.
Plugin page: 4,294,665 bytes. Sample W6: five renders and two sheets; no fault.
The sample waits for the owner's yes. Integration runs the full suite.

## W6 integration

Plan: merge W6 without a fast-forward. Keep Previously and its link check. Keep rewind, the tell and the Ceremony. Run the unit tests and the browser checks of both sides, then commit and push the integration branch.
Pass criteria: the unit tests, browser checks and pre-push tests pass. The worktree is clean after the push.

The starting head is `c6e42cb3e86d7452fc95a3b2cea0825632fa6f29`.
Two files have conflicts. Keep the Previously import in `src/main.ts`. Keep the link-game check and add the end check in the registry. Review and reset keep both units' cancel calls.

`npm test` passes: 93 files pass, 1 skips; 1,658 tests pass, 13 skip. All 50 board tests pass. Typecheck passes.

The supplied M1 launcher selects this Mac. All 25 named browser checks pass: link-game, painted-game, ux-defects, game-screen, their-turn, menu-extra, powers, read-piece, verb-marks, home, visual-design, turn, qa, new-game, plugin-ui, plugin-ui-http, lessons, lesson-return, special-moves, account, king-effects, workshop, end, w6-parts and playable-clay.

No timeout needs confirmation. Both plugin checks pass; the HTTP check uses the documented disposable local database. No source fix is needed after the conflict resolution. The sample still waits for the owner's yes.

## Batch 3 repair plan

Batch 3: decided by delegation (2026-10-09). Keep a loss, draw and Resign quiet.
Fix the words, tile acts and order, Review spacing and bar state.
Add the tell, quiet loss and first-visit samples. Keep seals until Tricks opens.
Check: unit tests, typecheck, the ten named browser checks and sample reports.
Inspect every sample. Each report must have zero faults.

Batch 3: decided by delegation (2026-10-09).
D8 stays: a loss, draw and Resign stay quiet. A loss gets no celebration.
King Down holds for 900 ms, then moves into the result. Review has space.
Tiles name the act in play order. The final blow is last and marked.
End turn stays off during the Ceremony. Rematch starts from the result.
The result uses move words, a full stop and a move count. The replay has a skip caption.
Tests: 1,667 pass, 13 skip; all 50 board tests pass. All ten browser checks pass.
W6: 10 renders, zero faults. Commit 7bf311a repairs the h-file fall. The web board turns the fall inward at the right edge. The shared scene keeps its old default.

## Batch 3 repair 2 words

Item 7: decided by delegation (2026-10-09).
Result and draw words use take and taken. No capture word stays in the end text.

Item 11: decided by delegation (2026-10-09). Power tiles name the power in two to four words without squares. The result reads the last ply that is not a pass. The replay caption sits in the context row, outside the squares. Unit and browser checks cover Haste and Freeze.

Item 15: decided by delegation (2026-10-09). The h-file note names the repair in 7bf311a. The repair is in this branch; it does not wait for shared board work.

Item 11 check repair: decided by delegation (2026-10-09). Images can load before the canvas resize. The probe taps at x -197 before that resize and fails. The shared board-ready helper waits for fitted bounds before coordinate input. The Ceremony check delays the resize to keep this case covered.

Items 4 and 5: decided by delegation (2026-10-09). The final-ply sentence has no Haste or Rally next-move promise. The shared move helper keeps its old default; only the web result asks for final words. The caption says Tap the board to skip. Unit and end browser checks pass.
